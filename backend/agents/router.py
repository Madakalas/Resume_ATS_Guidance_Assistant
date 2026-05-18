"""
agents/router.py — Intent Router v2 (hybrid: rules-first + LLM fallback)

Priority: deterministic rule matching first, LLM only for ambiguous cases.
"""

import re
from backend.config import MODELS

# ── Deterministic rule map (checked BEFORE LLM) ──────────────────────────────
RULE_MAP = [
    # Mode switches — always deterministic
    (r"switch to aggressive|aggressive mode", "ATS_MODE_SWITCH"),
    (r"switch to keyword|keyword mode", "ATS_MODE_SWITCH"),
    (r"switch to honest|honest mode|recruiter mode", "ATS_MODE_SWITCH"),
    # Diff/change summary
    (r"what did you (add|change|do|modify)|what changed|what was added|what you added|summary of (what |the )?changes?|what.s different", "DIFF_SUMMARY"),
    # ATS score requests
    (r"ats score|get me (the |a )?score|run (the |a )?analysis|analyze (my |the )?(resume|documents?)|score (my |the )?resume|evaluate (my |the )?resume", "ATS_SCORE"),
    # Score advisor
    (r"how far (can we|to) push|max(imum)? score|push (to |my )?(score|resume) to|can i get (to |a )?\d+|target \d+|ceiling", "SCORE_ADVISOR"),
    # Role convert
    (r"change (to|for|into) (a |the )?(testing|qa|frontend|backend|devops|data|ml|ai|fullstack|full.stack) role|make me (a |an )?(tester|qa|developer|engineer)|switch (my resume |it |to )?(to )?(testing|devops|data)", "ROLE_CONVERT"),
    # Optimize
    (r"optimize|improve|rewrite|strengthen|enhance|rework|revamp|upgrade (my |the )?resume|make (it |my resume |the resume )better|can you (optimize|improve|rewrite)", "OPTIMIZE"),
    # Salary guidance — was falling to OUT_OF_SCOPE, now properly handled
    (r"salary|how much (can i|should i|do i|will i) (expect|earn|get|make)|pay range|compensation|ctc|package|lpa|per annum|what (is|are) the (salary|pay|compensation)", "SALARY_GUIDANCE"),
    # Fresher build
    (r"i am a fresher|i.m a fresher|i don.t have (a )?resume|create (a )?resume for me|build (my |a )?resume from scratch|no resume", "FRESHER_BUILD"),
    # Skill add
    (r"i.ve? (used|worked with|have experience (in|with))|i know |add .{2,25} to (my |the )?resume|should i add |i.m? (familiar with|learning)", "SKILL_ADD"),
    # Edit
    (r"remove (the |my )?(certifications?|section|skills|education|summary|projects?|experience)|change (my |the )?(summary|title|headline|section|bullet)|update (my |the )?(summary|skills|projects?)|fix (my |the )?(summary|bullet)", "RESUME_EDIT"),
    # Projects
    (r"add (more |[0-9]+ )?projects?|expand (my |the )?projects?|more projects?", "PROJECT_EXPAND"),
    # Interview
    (r"interview (questions?|prep|preparation)|how (to |should i )?prepare|what (type of|kind of) questions?|behavioral question|technical question|leetcode|system design (question|prep)", "INTERVIEW_PREP"),
    # Company info
    (r"which companies? (hire|recruit|look for|are good for)|where (to |should i )?apply|companies that hire|good companies for|target companies?|where can i find (jobs?|roles?|openings?)", "COMPANY_INFO"),
    # Company intel
    (r"what does (amazon|google|microsoft|meta|flipkart|swiggy|zomato|tcs|infosys|wipro) (look for|want|prefer|value)|amazon (interview|hiring|process)|how does .{3,30} (hire|interview)", "COMPANY_INTEL"),
    # JD analysis
    (r"analyze (this |the )?jd|what (does|do) (this |the )?jd (require|want|ask)|jd analysis|analyze (this |the )?job description", "JD_ANALYSIS"),
    # Career advice
    (r"which role (fits?|suits?|matches?)|am i (ready|suitable|eligible)|should i apply|career (path|advice|guidance)|what role (should i|to) target|role (fit|match)", "CAREER_ADVICE"),
    # General greeting
    (r"^(hi|hello|hey|good (morning|afternoon|evening)|howdy|what can you do|what.s raga|who are you|help me)[\s!?.]*$", "GENERAL_CHAT"),
]

SYSTEM = """You are an intent classifier for a career coaching chatbot.
Read the user message + context and return EXACTLY ONE intent label.
Return ONLY the label — no explanation, no punctuation.

LABELS:
  ATS_SCORE       - wants ATS score / evaluation / analysis of resume vs JD
  OPTIMIZE        - wants resume improved / rewritten / optimized
  SCORE_ADVISOR   - asks max possible score / how far can we push / feasibility
  ROLE_CONVERT    - wants resume changed to a different role/domain
  SKILL_ADD       - mentions a skill they have and wants to add it
  FRESHER_BUILD   - is a fresher / no resume / wants to create one from scratch
  RESUME_EDIT     - wants to edit existing resume (remove/add/change a section or bullet)
  PROJECT_EXPAND  - wants to add more projects or expand projects in resume
  INTERVIEW_PREP  - wants interview questions / how to prepare
  COMPANY_INTEL   - what does this company look for / interview style / culture
  COMPANY_INFO    - asking which companies hire for X role / company recommendations
  JD_ANALYSIS     - analyze the job description / what does this JD require
  CAREER_ADVICE   - should I apply / am I ready / which role suits me / which role fits
  ATS_MODE_SWITCH - wants to switch mode (honest / keyword / aggressive)
  DIFF_SUMMARY    - asks what changed / what was added / what did you do to resume
  SALARY_GUIDANCE - asks about salary expectations, pay range, CTC, LPA, compensation
  GENERAL_CHAT    - greeting / what can you do / about the bot
  OUT_OF_SCOPE    - completely unrelated to career (weather, cooking, math homework, entertainment)

CRITICAL RULES:
- "salary" / "how much salary" / "CTC" / "LPA" → SALARY_GUIDANCE (NEVER OUT_OF_SCOPE)
- "optimize more" / "push further" / "can you do more" → OPTIMIZE (use draft if exists)
- "what changed" / "what did you add" → DIFF_SUMMARY
- "help me build" / "build my resume" with active resume → still RESUME_EDIT not FRESHER_BUILD
- "hello" / "hi" → GENERAL_CHAT

NEVER classify these as OUT_OF_SCOPE:
- Salary questions (these are career advice)
- Company recommendations
- Role targeting
- Interview prep

OUT_OF_SCOPE ONLY for: weather, cooking, sports scores, entertainment, math homework,
personal relationships, medical advice, non-career programming help
"""


def detect_intent(user_message: str, has_resume: bool, has_jd: bool,
                  has_draft: bool, history: list, client) -> str:
    """
    Hybrid intent detection: deterministic rules first, LLM fallback.
    """
    msg_lower = user_message.lower().strip()

    # ── RULE-BASED PASS (fast, deterministic) ────────────────────────────────
    for pattern, intent in RULE_MAP:
        if re.search(pattern, msg_lower):
            return intent

    # ── LLM FALLBACK for ambiguous cases ────────────────────────────────────
    ctx = (f"User has resume: {has_resume}. "
           f"User has JD: {has_jd}. "
           f"Bot has generated a draft: {has_draft}.")
    last_msgs = ""
    if history:
        for m in history[-6:]:
            if m.get("role") in ("user", "assistant"):
                last_msgs += f"{m['role']}: {m['content'][:150]}\n"

    try:
        resp = client.chat.completions.create(
            model=MODELS["router"],
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content":
                    f"Context: {ctx}\nRecent history:\n{last_msgs}\n"
                    f"Current user message: {user_message}"}
            ],
            temperature=0,
            max_tokens=20,
        )
        label = resp.choices[0].message.content.strip().upper()
        valid = {
            "ATS_SCORE", "OPTIMIZE", "SCORE_ADVISOR", "ROLE_CONVERT",
            "SKILL_ADD", "FRESHER_BUILD", "RESUME_EDIT", "PROJECT_EXPAND",
            "INTERVIEW_PREP", "COMPANY_INTEL", "COMPANY_INFO",
            "JD_ANALYSIS", "CAREER_ADVICE", "ATS_MODE_SWITCH",
            "DIFF_SUMMARY", "SALARY_GUIDANCE", "GENERAL_CHAT", "OUT_OF_SCOPE"
        }
        return label if label in valid else "GENERAL_CHAT"
    except Exception:
        return "GENERAL_CHAT"
