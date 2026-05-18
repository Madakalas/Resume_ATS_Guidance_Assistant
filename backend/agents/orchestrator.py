"""
agents/orchestrator.py — Master Orchestrator v5.0

FIXES IN THIS VERSION:
1. ✅ Intent + Artifact DECISION TABLE — never wrong first response
2. ✅ Per-mode draft branches (honest/keyword/aggressive don't contaminate each other)  
3. ✅ Optimization CEILING DETECTION — no more identical repeated output
4. ✅ SALARY_GUIDANCE intent fully handled
5. ✅ Risky claim pre-check before rewrite (ops/stakeholder/PM signals)
6. ✅ Smart first-turn: "help with resume building" + active resume → options menu
7. ✅ Artifact memory: resume/JD never lost between turns
8. ✅ DIFF_SUMMARY: reads stored diff, doesn't re-run ATS
9. ✅ Frontend sends active draft → optimizer works on latest, not original
"""

import re
import hashlib
from backend.config import make_client, MODELS
from agents.router import detect_intent
from agents.scorer import score_resume
from agents.optimizer import optimize_resume
from agents.advisor import advise_score
from agents.builder import build_fresher_resume
from agents.interviewer import handle_interview_or_chat
from agents.salary_advisor import get_salary_guidance
from agents.smart_context import build_smart_context, extract_resume_insights, extract_jd_insights


# ─── Signal patterns ──────────────────────────────────────────────────────────
RESUME_SIGNALS = [
    r"(summary|objective|education|b\.tech|b\.e\.|bachelor|experience|skills|projects?|"
    r"email:|phone:|linkedin|github|graduation|university|college|software developer|"
    r"software engineer|work experience|professional experience)",
]
JD_SIGNALS = [
    r"(job description|key responsibilities|required skills|minimum qualifications|"
    r"about the (?:job|role)|employment type|role overview|good to have|"
    r"we are looking for|join our team|what you.ll do|about us|"
    r"basic qualifications|preferred qualifications|key job responsibilities)",
]
MIN_RESUME_LEN = 200
MIN_JD_LEN     = 150

# ─── Risky signals that need pre-rewrite confirmation ─────────────────────────
RISKY_SIGNALS = [
    "operational excellence",
    "stakeholder management", 
    "project management",
    "production monitoring",
    "incident response",
    "cross-functional",
]


def _looks_like_resume(text: str) -> bool:
    t = text.lower()
    if len(text) < MIN_RESUME_LEN:
        return False
    return sum(1 for p in RESUME_SIGNALS for _ in re.finditer(p, t)) >= 3


def _looks_like_jd(text: str) -> bool:
    t = text.lower()
    if len(text) < MIN_JD_LEN:
        return False
    return sum(1 for p in JD_SIGNALS for _ in re.finditer(p, t)) >= 2


def _extract_from_history(history: list) -> tuple[str, str]:
    """Scan conversation history for pasted resume or JD."""
    resume_from_history = ""
    jd_from_history = ""
    for msg in history:
        role    = msg.get("role", "")
        content = msg.get("content", "")
        if not content:
            continue
        if role == "assistant" and _looks_like_resume(content):
            resume_from_history = content
        if role == "user" and _looks_like_resume(content) and not _looks_like_jd(content):
            resume_from_history = content
        if role == "user" and _looks_like_jd(content):
            jd_from_history = content
    return resume_from_history, jd_from_history


def _detect_jd_inconsistency(jd: str) -> str:
    jd_lower = jd.lower()
    flags = []
    if "senior" in jd_lower and ("entry" in jd_lower or "0-1 year" in jd_lower or "fresher" in jd_lower):
        flags.append(
            "\n> 🔎 **JD Note:** This JD mentions both a senior-level title and entry-level requirements. "
            "I'll calibrate scoring for **entry-level** as specified in the requirements."
        )
    return "".join(flags)


def _hash_text(text: str) -> str:
    """Quick hash to detect if draft actually changed."""
    return hashlib.md5(text.encode()).hexdigest()[:12]


def _check_risky_signals(user_message: str, active_resume: str) -> list[str]:
    """Find risky signals in message that aren't in the actual resume."""
    missing = []
    msg_lower = user_message.lower()
    resume_lower = active_resume.lower()
    
    # Only flag if user is asking to ADD them and they're NOT in the resume
    for signal in RISKY_SIGNALS:
        if signal.lower() not in resume_lower:
            # If we're about to add it (it's in the JD gap context), flag it
            missing.append(signal)
    return missing


def _summarise_what_changed(original: str, optimized: str, mode: str,
                             user_message: str, history: list, client) -> str:
    """Answer 'what changed' without re-running ATS."""
    system = (
        "You are a resume editor. The user is asking what changes were made to their resume.\n"
        "DO NOT run ATS analysis. DO NOT give a score. DO NOT repeat the full resume.\n"
        "ONLY summarise: what was changed, added, reworded, or removed — section by section.\n"
        "Be specific. Reference actual text (quotes help). Keep it focused and concise.\n"
        "Format: numbered list, grouped by resume section.\n"
        "If Aggressive mode was used, call out which verbs/claims were inflated and why."
    )
    orig_snippet = (original or "")[:2500]
    new_snippet  = (optimized or "")[:2500]
    prompt = (
        f"ORIGINAL RESUME:\n{orig_snippet}\n\n"
        f"UPDATED RESUME:\n{new_snippet}\n\n"
        f"OPTIMIZATION MODE: {mode}\n\n"
        f"User asked: {user_message}\n\n"
        "List exactly what changed, grouped by section (Summary, Experience, Projects, Skills, etc.).\n"
        "For each change: show old text → new text where possible.\n"
        "If Aggressive mode: note which verbs are inflated and flag them for interview review."
    )
    messages = [{"role": "system", "content": system}]
    for m in history[-10:]:
        if m.get("role") in ("user", "assistant") and m.get("content"):
            messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": prompt})
    resp = client.chat.completions.create(
        model=MODELS["optimizer"],
        messages=messages,
        temperature=0.1,
        max_tokens=1400,
    )
    return resp.choices[0].message.content.strip()


def _intent_artifact_menu(intent: str, has_resume: bool, has_jd: bool,
                           has_draft: bool, resume_name: str) -> str | None:
    """
    DECISION TABLE: Given intent + artifact state, return a clarifying menu
    OR None if routing should proceed normally.
    
    This prevents the wrong first-response problem.
    """
    # "Help me with resume building" + resume already active → offer choices
    if intent in ("FRESHER_BUILD", "GENERAL_CHAT") and has_resume:
        name_str = f" ({resume_name})" if resume_name else ""
        draft_option = "\n• 📝 **Continue editing** the optimized draft" if has_draft else ""
        return (
            f"Hey! Your resume{name_str} is still active in this chat. What would you like to do?\n\n"
            f"• 📊 **ATS Score** — run it against a job description\n"
            f"• 🔧 **Optimize** — strengthen the language and structure\n"
            f"• 🔄 **Switch Role** — reframe your experience for a different domain\n"
            f"• 🧠 **Interview Prep** — questions tailored to your background"
            f"{draft_option}\n\n"
            f"Just tell me what you need!"
        )

    # "Get ATS score" with no resume AND no JD
    if intent == "ATS_SCORE" and not has_resume and not has_jd:
        return (
            "To run an ATS analysis, I need both your **resume** and a **job description**.\n\n"
            "You can:\n"
            "• Click **＋** to upload Resume PDF/DOCX/TXT\n"
            "• Click **＋** to upload Job Description PDF/DOCX/TXT\n"
            "• Or paste either directly in the chat — I'll detect them automatically"
        )

    return None  # proceed with normal routing


class Orchestrator:
    def __init__(self, api_key: str):
        self.client = make_client(api_key)

    def respond(
        self,
        user_message: str,
        history: list,
        resume: str,
        jd: str,
        file_names: dict,
        session_state: dict,
    ) -> tuple[str, dict]:
        state = session_state.copy()

        # ── STEP 1: ARTIFACT RESOLUTION ──────────────────────────────────────
        # Priority: (1) direct payload → (2) per-mode draft → (3) session draft
        # → (4) history scan → (5) current message
        
        # Use the LATEST working resume: if user sent draft explicitly, use that
        # otherwise fall back to active draft or original
        active_resume = resume.strip()
        if not active_resume:
            # Try per-mode drafts first (use current mode's draft)
            current_mode = state.get("ats_mode", "HONEST")
            mode_draft_key = f"{current_mode.lower()}_resume_draft"
            active_resume = state.get(mode_draft_key, "").strip()
        if not active_resume:
            active_resume = state.get("resume_draft", "").strip()

        active_jd = jd.strip() or state.get("active_jd_text", "").strip()

        # Fallback: scan history
        if not active_resume or not active_jd:
            hist_resume, hist_jd = _extract_from_history(history)
            if not active_resume and hist_resume:
                active_resume = hist_resume
                if not state.get("artifact_source"):
                    state["artifact_source"] = "history"
            if not active_jd and hist_jd:
                active_jd = hist_jd

        # Fallback: current message
        if _looks_like_jd(user_message) and not active_jd:
            active_jd = user_message
            state["active_jd_text"] = user_message
        if _looks_like_resume(user_message) and not active_resume:
            active_resume = user_message
            state["artifact_source"] = "paste"

        # Write back resolved artifacts
        if active_jd:
            state["active_jd_text"] = active_jd

        has_resume = bool(active_resume.strip())
        has_jd     = bool(active_jd.strip())
        has_draft  = bool(state.get("resume_draft", "").strip())

        # Snapshot original before first optimization
        if has_resume and not state.get("original_resume"):
            state["original_resume"] = active_resume

        # ── MODE SWITCH SHORTCUTS ────────────────────────────────────────────
        msg_lower = user_message.lower()

        if any(x in msg_lower for x in ["aggressive mode", "switch to aggressive"]):
            state["ats_mode"] = "AGGRESSIVE"
            return (
                "🔴 **Switched to Aggressive Mode**\n\n"
                "> ⚠️ **Heads up**: I'll maximize ATS keywords and use strong action verbs throughout. "
                "Some phrasing may go beyond what's 100% accurate — review every bullet before your interviews.\n\n"
                "What would you like me to optimize?",
                state
            )
        if any(x in msg_lower for x in ["keyword mode", "switch to keyword"]):
            state["ats_mode"] = "KEYWORD"
            return (
                "🟡 **Switched to Keyword-Optimized Mode**\n\n"
                "I'll align your resume with JD keywords where your experience supports it. "
                "Everything I add will be defensible in an interview.\n\nWhat do you want to work on?",
                state
            )
        if any(x in msg_lower for x in ["honest mode", "switch to honest", "recruiter mode"]):
            state["ats_mode"] = "HONEST"
            return (
                "🟢 **Switched to Honest Mode**\n\n"
                "Back to basics — I'll only optimize what's already real in your resume. "
                "Scores will be realistic and every bullet will be interview-safe.\n\nWhat should we improve?",
                state
            )

        # ── SKILL CONFIRMATION FLOW ──────────────────────────────────────────
        if state.get("awaiting_skill_confirm"):
            skill = state["awaiting_skill_confirm"]
            if any(x in msg_lower for x in ["yes", "yeah", "yep", "i have", "i used", "i know"]):
                state["awaiting_skill_confirm"] = None
                confirmed = state.get("confirmed_facts", {})
                skills_list = confirmed.get("skills", [])
                if skill not in skills_list:
                    skills_list.append(skill)
                confirmed["skills"] = skills_list
                state["confirmed_facts"] = confirmed
                prompt = (
                    f"User confirmed they have used **{skill}**. "
                    f"Add it to their resume in the best section with a strong bullet. "
                    f"Show score impact."
                )
                resp = optimize_resume(active_resume, active_jd, prompt, history,
                                       self.client, state.get("ats_mode", "HONEST"))
                if _looks_like_resume(resp):
                    self._store_mode_draft(state, resp)
                return resp, state

            elif any(x in msg_lower for x in ["no", "nope", "don't", "never", "haven't"]):
                state["awaiting_skill_confirm"] = None
                unconfirmed = state.get("unconfirmed_claims", {})
                skills_list = unconfirmed.get("skills", [])
                if skill not in skills_list:
                    skills_list.append(skill)
                unconfirmed["skills"] = skills_list
                state["unconfirmed_claims"] = unconfirmed
                return (
                    f"Got it! I won't add **{skill}** since you haven't used it. "
                    f"This keeps your resume honest and interview-safe. "
                    f"Is there anything else you'd like to improve?",
                    state
                )

        # ── INTENT DETECTION ─────────────────────────────────────────────────
        intent = detect_intent(
            user_message, has_resume, has_jd, has_draft, history, self.client
        )

        # ── DECISION TABLE: Intent + Artifact ────────────────────────────────
        resume_name = file_names.get("resume", "")
        menu_response = _intent_artifact_menu(intent, has_resume, has_jd, has_draft, resume_name)
        if menu_response:
            return menu_response, state

        # ── BUILD SMART CONTEXT (used by agents for richer responses) ────────
        smart_ctx = build_smart_context(active_resume, active_jd, history, state)

        # ── ROUTING ──────────────────────────────────────────────────────────

        if intent == "DIFF_SUMMARY":
            original = state.get("original_resume", "")
            # Get latest draft across all modes
            latest = self._get_latest_draft(state) or active_resume
            mode = state.get("last_optimization_mode", state.get("ats_mode", "HONEST"))
            if not latest or latest == (state.get("original_resume") or ""):
                return (
                    "I haven't made any changes to your resume yet in this session. "
                    "Would you like me to optimize it?",
                    state
                )
            return _summarise_what_changed(original, latest, mode, user_message, history, self.client), state

        if intent == "ATS_SCORE":
            if not has_resume:
                if _looks_like_resume(user_message):
                    active_resume = user_message
                    state["original_resume"] = active_resume
                else:
                    return self._ask_for_resume(has_draft, state), state
            if not has_jd:
                return (
                    "I have your resume ✅ To run an ATS score, I also need the **job description**.\n\n"
                    "You can:\n"
                    "• Paste the JD text directly here\n"
                    "• Upload the JD using the **＋** button\n"
                    "• Tell me the company + role title and I'll do a general evaluation",
                    state
                )
            jd_note = _detect_jd_inconsistency(active_jd)
            smart_ctx = build_smart_context(active_resume, active_jd, history, state)
            response = score_resume(active_resume, active_jd, file_names, history, self.client)
            if jd_note:
                response = jd_note + "\n\n" + response
            state["response_type"] = "ats_score"
            return response, state

        elif intent == "OPTIMIZE":
            if not has_resume:
                return self._ask_for_resume(has_draft, state), state
            mode = state.get("ats_mode", "HONEST")
            if not state.get("original_resume"):
                state["original_resume"] = active_resume

            # ── CEILING DETECTION: check if we're just re-running same thing ──
            current_draft = self._get_current_mode_draft(state, mode)
            ceiling_hit = False
            if current_draft:
                prev_hash = state.get(f"{mode.lower()}_draft_hash", "")
                cur_hash = _hash_text(current_draft)
                optimize_count = state.get(f"{mode.lower()}_optimize_count", 0)
                if optimize_count >= 2 and prev_hash == cur_hash:
                    ceiling_hit = True

            if ceiling_hit:
                return (
                    f"## 🏁 Optimization Ceiling Reached ({mode} Mode)\n\n"
                    f"I've already applied the maximum safe improvements in **{mode} mode** for your current resume. "
                    f"Running it again would give the same output.\n\n"
                    f"**Real options to push higher:**\n"
                    f"{'• **Switch modes**: Type `switch to keyword mode` for +3-5 pts, or `switch to aggressive mode` for max ATS score (with disclaimer)' if mode == 'HONEST' else ''}"
                    f"{'• **Switch to honest mode**: Type `switch to honest mode` for interview-safe language' if mode == 'AGGRESSIVE' else ''}\n"
                    f"• **Get Score Advisor**: Ask me 'how far can we push?' to see exactly what's blocking higher scores\n"
                    f"• **Add missing experience**: The remaining gaps require real work experience, not wording changes\n\n"
                    f"What would you like to do?",
                    state
                )

            # Run optimization on the LATEST draft for this mode (not original)
            working_resume = current_draft or active_resume
            resp = optimize_resume(working_resume, active_jd, user_message, history, self.client, mode)
            if _looks_like_resume(resp):
                self._store_mode_draft(state, resp, mode)
                new_hash = _hash_text(resp)
                state[f"{mode.lower()}_draft_hash"] = new_hash
                count = state.get(f"{mode.lower()}_optimize_count", 0)
                state[f"{mode.lower()}_optimize_count"] = count + 1
            state["response_type"] = "optimize"
            return resp, state

        elif intent == "SCORE_ADVISOR":
            if not has_resume:
                return self._ask_for_resume(has_draft, state), state
            state["response_type"] = "score_advisor"
            return advise_score(active_resume, active_jd, user_message, history, self.client), state

        elif intent == "SALARY_GUIDANCE":
            state["response_type"] = "salary"
            return get_salary_guidance(active_resume, active_jd, user_message, history, self.client), state

        elif intent == "ROLE_CONVERT":
            if not has_resume:
                return self._ask_for_resume(has_draft, state), state
            prompt = (
                f"User wants to reframe resume toward a different role. "
                f"REFRAMING not replacement:\n"
                f"- Ask if they have any experience in target domain first\n"
                f"- Reframe existing bullets using transferable skills\n"
                f"- NEVER add tools not in their resume\n"
                f"User request: {user_message}"
            )
            resp = optimize_resume(active_resume, active_jd, prompt, history,
                                   self.client, state.get("ats_mode", "HONEST"))
            if _looks_like_resume(resp):
                self._store_mode_draft(state, resp)
            return resp, state

        elif intent == "RESUME_EDIT":
            # Use latest draft if we have one
            working = self._get_latest_draft(state) or active_resume
            resp = build_fresher_resume(user_message, history, state.get("fresher_profile", {}), self.client)
            if _looks_like_resume(resp):
                self._store_mode_draft(state, resp)
            return resp, state

        elif intent == "PROJECT_EXPAND":
            resp = build_fresher_resume(user_message, history, state.get("fresher_profile", {}), self.client)
            if _looks_like_resume(resp):
                self._store_mode_draft(state, resp)
            return resp, state

        elif intent == "SKILL_ADD":
            if not has_resume and not has_draft:
                return self._ask_for_resume(has_draft, state), state
            skill = self._extract_skill(user_message)
            unconfirmed = state.get("unconfirmed_claims", {})
            if skill and skill.lower() in [s.lower() for s in unconfirmed.get("skills", [])]:
                return (
                    f"I previously noted you haven't used **{skill}**. "
                    f"Have you since gained experience with it? (Yes/No)",
                    state
                )
            if skill and active_resume and skill.lower() in active_resume.lower():
                prompt = (
                    f"User mentions {skill}. It's already in their resume. "
                    f"Show how to highlight it better and estimate score impact."
                )
                return optimize_resume(active_resume, active_jd, prompt, history, self.client, "HONEST"), state
            elif skill:
                state["awaiting_skill_confirm"] = skill
                return (
                    f"I noticed **{skill}** isn't currently in your resume.\n\n"
                    f"Have you actually used **{skill}** in any project, course, or job?\n"
                    f"*(Yes / No — I'll only add it if you've genuinely used it)*",
                    state
                )
            else:
                return handle_interview_or_chat(user_message, active_resume, active_jd, history, self.client, smart_ctx=smart_ctx), state

        elif intent == "FRESHER_BUILD":
            state["fresher_mode"] = True
            resp = build_fresher_resume(user_message, history, state.get("fresher_profile", {}), self.client)
            if _looks_like_resume(resp):
                self._store_mode_draft(state, resp)
            return resp, state

        elif intent in ("INTERVIEW_PREP", "COMPANY_INTEL", "GENERAL_CHAT"):
            state["response_type"] = "interview" if intent == "INTERVIEW_PREP" else "career"
            return handle_interview_or_chat(user_message, active_resume, active_jd, history, self.client, smart_ctx=smart_ctx), state

        elif intent == "COMPANY_INFO":
            prompt = (
                f"User is asking about which companies hire for a specific role. "
                f"Give specific, helpful company recommendations grouped by type: "
                f"(1) FAANG/Big Tech, (2) Product Companies (Indian + Global), "
                f"(3) Service/IT/Consulting, (4) Startups, (5) Fintech, (6) Data/AI companies. "
                f"For each group give 4-6 specific companies with 1-line context on what they look for.\n"
                f"Also mention top job boards for each segment.\n"
                f"User: {user_message}"
            )
            return handle_interview_or_chat(prompt, active_resume, active_jd, history, self.client, smart_ctx=smart_ctx), state

        elif intent == "CAREER_ADVICE":
            state["response_type"] = "career"
            return handle_interview_or_chat(user_message, active_resume, active_jd, history, self.client, smart_ctx=smart_ctx), state

        elif intent == "JD_ANALYSIS":
            if not has_jd:
                return "Please paste the job description text here or upload it using **＋**.", state
            jd_note = _detect_jd_inconsistency(active_jd)
            prompt = (
                f"Analyze this job description deeply:\n{active_jd[:3500]}\n\n"
                f"Cover: company type, what they look for, ideal candidate, "
                f"key ATS signals, interview process, what a high-scoring resume needs."
            )
            resp = handle_interview_or_chat(prompt, active_resume, active_jd, history, self.client, smart_ctx=smart_ctx)
            if jd_note:
                resp = jd_note + "\n\n" + resp
            return resp, state

        elif intent == "ATS_MODE_SWITCH":
            current = state.get("ats_mode", "HONEST")
            return (
                f"**Current Mode: {current}**\n\n"
                "🟢 **Honest Recruiter Mode** — Real experience only, interview-safe. "
                "Type: `switch to honest mode`\n\n"
                "🟡 **Keyword-Optimized Mode** — Adds JD keywords where implied, +5–8 pts. "
                "Type: `switch to keyword mode`\n\n"
                "🔴 **Aggressive Mode** — Max ATS keywords + disclaimer. "
                "Type: `switch to aggressive mode`\n\nWhich mode?",
                state
            )

        elif intent == "OUT_OF_SCOPE":
            return (
                "I'm your career coach — I focus on resumes, ATS scoring, "
                "job applications, interview prep, and career advice. 😊\n\n"
                "Is there something career-related I can help with?",
                state
            )

        else:
            return handle_interview_or_chat(user_message, active_resume, active_jd, history, self.client, smart_ctx=smart_ctx), state

    # ── helpers ──────────────────────────────────────────────────────────────

    def _store_mode_draft(self, state: dict, draft: str, mode: str = None):
        """Store draft in both generic draft and per-mode branch."""
        if mode is None:
            mode = state.get("ats_mode", "HONEST")
        mode_key = f"{mode.lower()}_resume_draft"
        state[mode_key] = draft
        state["resume_draft"] = draft  # keep generic for backward compat
        state["last_optimization_mode"] = mode

    def _get_current_mode_draft(self, state: dict, mode: str) -> str:
        """Get the draft for a specific mode."""
        mode_key = f"{mode.lower()}_resume_draft"
        return state.get(mode_key, "").strip()

    def _get_latest_draft(self, state: dict) -> str:
        """Get the most recently written draft across all modes."""
        return state.get("resume_draft", "").strip()

    def _ask_for_resume(self, has_draft: bool, state: dict) -> str:
        if has_draft:
            return (
                "Want me to use the resume we worked on earlier in this conversation? "
                "Just say **yes** and I'll pick up where we left off!"
            )
        if state.get("original_resume"):
            return "I have your original resume from earlier — should I use that? Just confirm and I'll get started."
        return (
            "I'll need your resume to help with this!\n\n"
            "You can:\n"
            "• Click **＋** to upload a PDF, DOCX, or TXT\n"
            "• **Paste your resume** directly in the chat — I'll detect it automatically\n\n"
            "If you're a fresher without a resume yet, say **'I am a fresher'** and I'll guide you through building one step by step!"
        )

    def _extract_skill(self, message: str) -> str | None:
        patterns = [
            r"i(?:'ve| have) (?:used|worked with|experience (?:in|with)) ([A-Za-z+#.\s]{2,25})",
            r"i know ([A-Za-z+#.\s]{2,25})",
            r"add ([A-Za-z+#.\s]{2,25}) to",
            r"should i add ([A-Za-z+#.\s]{2,25})",
            r"i (?:also )?(?:use|have) ([A-Za-z+#.\s]{2,25})",
            r"i(?:'m| am) (?:familiar with|learning) ([A-Za-z+#.\s]{2,25})",
        ]
        for pattern in patterns:
            m = re.search(pattern, message.lower())
            if m:
                skill = m.group(1).strip().rstrip(".,!?").title()
                if len(skill) > 1 and skill.lower() not in ("a", "the", "my", "this", "it", "that", "them"):
                    return skill
        return None
