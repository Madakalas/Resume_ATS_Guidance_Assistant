"""
agents/specialist.py — Specialist Agent for missing 100-case coverage

Handles: Cover Letter, LinkedIn Optimization, Learning Roadmap, 
         Portfolio Ideas, International Resume, Multi-Resume detection,
         PII detection, and Network/Job-search strategy.

Single agent, multiple prompt templates = low token cost.
"""

import re
from backend.config import MODELS

# ── PII detection (zero LLM cost) ─────────────────────────────────────────────
PII_PATTERNS = [
    (r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', 'credit/debit card number'),
    (r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b', 'SSN-like number'),
    (r'\b[A-Z]{5}\d{4}[A-Z]\b', 'Aadhaar PAN-like number'),
    (r'\b\d{12}\b', 'possible Aadhaar number'),
    (r'\bpassport\s+no\.?\s*:?\s*[A-Z]\d{7}\b', 'passport number'),
    (r'\bdate.of.birth\b|\bdob\b|\bborn\s+on\b', 'date of birth'),
    (r'\bmarital.status\b|\bmarried\b|\bsingle\b|\bdivorced\b', 'marital status'),
    (r'\bnationality\s*:\s*\w+', 'nationality (may not be needed)'),
    (r'\breligion\b|\bcaste\b', 'religion/caste (never include)'),
    (r'\bfather.s?\s+name\b|\bmother.s?\s+name\b', "parent's name (not needed)"),
]

def detect_pii(resume_text: str) -> list[str]:
    """Returns list of PII warnings found in resume. Zero LLM cost."""
    warnings = []
    lower = resume_text.lower()
    for pattern, label in PII_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            warnings.append(label)
    return warnings


# ── Prompt templates ───────────────────────────────────────────────────────────

COVER_LETTER_SYSTEM = """You are a professional cover letter writer.
Write a compelling, personalized cover letter based on the user's resume and the target job description.

RULES:
- 3 paragraphs: Hook + Value + Call-to-action
- Use specific details from BOTH resume and JD — never generic
- Match the company's tone (startup = energetic, enterprise = formal)
- Highlight the top 2-3 relevant achievements from resume
- Show you understand what the company needs
- Length: 250-350 words
- Never start with "I am writing to..."
- Always end with a confident CTA, not "I hope to hear from you"
- ATS-friendly: include 3-4 key phrases from JD naturally

OUTPUT FORMAT:
## 📝 Cover Letter

**[Your Name]**
[Your Email] | [Your Phone] | [LinkedIn if available]

---

[Company Name / Hiring Manager Name if known]
[Date]

Dear [Hiring Manager / Recruiting Team],

[Opening paragraph — hook + role mention + why this company specifically]

[Middle paragraph — your top 2-3 relevant achievements with specifics]

[Closing paragraph — fit + enthusiasm + clear CTA]

Sincerely,
[Your Name]

---

### 💡 Customization Tips
[2-3 specific things to adjust before sending]
"""

LINKEDIN_SYSTEM = """You are a LinkedIn profile optimization expert.
Analyze the user's resume and give specific LinkedIn optimization advice.

SECTIONS TO OPTIMIZE (cover all):
1. Headline — most important, 220 chars, keyword-rich, not just job title
2. About/Summary — first 2 lines must hook the reader (shown before "See more")
3. Experience — bullet points, not paragraphs, same impact verbs as resume
4. Skills section — list 20+ skills, prioritize endorsable ones
5. Featured section — what to pin (projects, articles, posts)
6. Keywords — ATS keywords recruiters search for in this field
7. Connections strategy — who to connect with

OUTPUT FORMAT:
## 🔵 LinkedIn Profile Optimization

### 🏷️ Optimized Headline (use this exactly)
`[Generated 220-char headline with role + value prop + keywords]`

### ✍️ About Section (first 2 lines — shown before "See more")
[Opening hook — who you are + what you do + what makes you different]

### 💼 Experience Section Improvements
| Current | Improved |
|---|---|
| [current bullet] | [stronger bullet] |

### 🎯 Top 15 Skills to Add
[comma-separated list]

### 🔑 Keywords Recruiters Search For
[5-8 exact search terms for this role]

### 📌 Featured Section Ideas
[3 specific things to pin]

### 🤝 Connection Strategy
[specific people/groups/companies to follow/connect with]
"""

LEARNING_ROADMAP_SYSTEM = """You are a senior tech educator and career coach.
Create a personalized, realistic learning roadmap based on the user's current skills and target role/JD.

RULES:
- Be specific — name exact resources, not just "learn Python"
- Be realistic — how many hours/week, how long to reach the goal
- Prioritize highest-impact skills first
- Include free + paid options
- Include project milestones (not just courses)

OUTPUT FORMAT:
## 🗺️ Personalized Learning Roadmap

**Target:** [Role] at [Company Type]
**Current Level:** [Detected level]
**Timeline to job-ready:** [X months at Y hrs/week]

### 🔴 Priority 1 — Fill Critical Gaps (Week 1-4)
| Skill | Resource | Time | Why Critical |
|---|---|---|---|

### 🟡 Priority 2 — Strengthen Core (Week 5-8)
| Skill | Resource | Time | Expected Outcome |
|---|---|---|---|

### 🟢 Priority 3 — Build Edge (Week 9-12)
| Skill | Resource | Time | Differentiator |
|---|---|---|---|

### 🏗️ Project Milestones
| Month | Project | Skills Demonstrated | Resume Impact |
|---|---|---|---|

### 📊 Progress Checkpoints
[How to know you're ready to apply]

### 💰 Budget
Free options: [list]
Paid (worth it): [list with approximate cost]
"""

PORTFOLIO_IDEAS_SYSTEM = """You are a senior software engineer and hiring manager.
Suggest specific, impactful portfolio projects tailored to the user's skills and target role.

For each project:
- Explain WHY it impresses recruiters for this specific role
- Give a concrete tech stack (not vague)
- Estimate build time for a developer at this level
- Explain how to make it stand out (what most people miss)
- Give the exact title to name it in the resume

OUTPUT FORMAT:
## 🚀 Portfolio Project Ideas

*Tailored for: [Role] | Current Level: [Level]*

### 🥇 Project 1 — [Catchy Name]
**Why this impresses recruiters at [company type]:**
[2 sentences]

**Tech Stack:** [specific stack]
**Build Time:** [realistic estimate]
**What makes it stand out:** [the 1 thing most people skip]
**Resume title:** "[exact resume-ready title]"
**GitHub structure tips:** [what to include in README]

[Repeat for 3-5 projects]

### ⚡ Quick-win additions (1-2 days each)
[3 small additions to existing projects that have big impact]
"""

INTERNATIONAL_RESUME_SYSTEM = """You are an international career expert with knowledge of resume formats across regions.
Give specific, actionable advice for adapting a resume for the target country/region.

REGIONAL PROFILES:
USA/Canada: 1-page for <5yr, no photo, no DOB, achievement-focused, strong summary
UK: 2 pages OK, "CV" not "resume", personal statement instead of summary, references available
Germany/EU: Photo expected (professional), DOB sometimes required, Lebenslauf format, detailed
Australia: 2-3 pages OK, referee section, no photo required, hybrid US/UK style
UAE/Middle East: Photo OK, nationality useful, Arabic companies expect 2-3 pages
Singapore/APAC: Photo expected, 2 pages, concise, achievements + education prominent
India (international): Emphasize global tools, remove Aadhaar/DOB, 1-2 pages

OUTPUT FORMAT:
## 🌍 International Resume Guide — [Target Region]

### ✅ What to KEEP from your current resume
[specific list]

### ❌ What to REMOVE for this region
[specific list with reasons]

### ➕ What to ADD for this region
[specific list]

### 📄 Format Expectations
- Length: [X pages]
- Photo: [Yes/No/Optional]
- Personal info: [what's expected]
- Tone: [formal/conversational]

### ⚡ Quick Adaptation Checklist
[ ] [specific action 1]
[ ] [specific action 2]
...

### 🎯 Top Job Boards for [Region]
[5-6 specific platforms]
"""

NETWORKING_SYSTEM = """You are a career strategist specializing in job search and professional networking.
Give a concrete, actionable networking and job search strategy.

RULES:
- Specific actions, not generic advice ("send 10 connection requests per week to X type of people")
- Include templates for messages (connection requests, cold emails, informational interview asks)
- Timeline-driven plan
- Honest about what works and what doesn't in the Indian/global tech job market

OUTPUT FORMAT:
## 🤝 Job Search & Networking Strategy

### 📊 Honest Assessment
[2-3 sentences: where this person is in the market, realistic timeline]

### 🎯 Week 1 — Foundation
| Action | Specifics | Time |
|---|---|---|

### 📨 Message Templates (copy-paste ready)

**LinkedIn Connection Request (< 300 chars):**
> [template]

**Cold Email to Hiring Manager:**
> Subject: [template subject]
> [template body]

**Informational Interview Ask:**
> [template]

### 🔑 Where to Apply (ranked by ROI)
1. [highest signal channel for this role]
2. [second best]
...

### ⚡ Weekly Job Search Ritual (45 min/day)
[specific daily/weekly actions]

### 🚩 What NOT to do
[3-4 common mistakes that waste time]
"""


def run_specialist(intent: str, resume: str, jd: str, user_message: str,
                   history: list, client, extra: dict = None) -> tuple[str, str]:
    """
    Run the appropriate specialist prompt.
    Returns (response_text, response_type) — response_type used by frontend for card rendering.
    """
    extra = extra or {}

    # ── PII check (no LLM cost) ───────────────────────────────────────────────
    if intent == "PII_WARNING":
        warnings = detect_pii(resume or user_message)
        if not warnings:
            return ("I didn't detect any obvious sensitive information. "
                    "Still, double-check your resume for date of birth, "
                    "Aadhaar number, religion, or marital status before sending.", "text")
        items = "\n".join(f"⚠️ **{w.title()}** detected — remove before sharing" for w in warnings)
        return (
            f"## 🔒 Privacy Check — Sensitive Information Found\n\n"
            f"I found potentially sensitive information in your resume:\n\n{items}\n\n"
            f"**Why this matters:**\n"
            f"- Indian companies often auto-reject resumes with Aadhaar/PAN numbers\n"
            f"- Marital status and DOB can lead to unconscious bias\n"
            f"- International companies may legally not be allowed to consider this info\n\n"
            f"**What to do:** Remove all items above. Replace with relevant professional details.",
            "pii_warning"
        )

    # ── Multi-resume detection ────────────────────────────────────────────────
    if intent == "MULTI_RESUME":
        return (
            "I can see you've shared multiple resumes. Which one would you like me to work with?\n\n"
            "**Option A** — Analyze the first resume\n"
            "**Option B** — Analyze the second resume\n"
            "**Option C** — Compare both resumes and tell me which is stronger\n\n"
            "Just say A, B, or C and I'll get started!",
            "choice"
        )

    # ── System prompts that need LLM ─────────────────────────────────────────
    system_map = {
        "COVER_LETTER": COVER_LETTER_SYSTEM,
        "LINKEDIN_OPTIMIZE": LINKEDIN_SYSTEM,
        "LEARNING_ROADMAP": LEARNING_ROADMAP_SYSTEM,
        "PORTFOLIO_IDEAS": PORTFOLIO_IDEAS_SYSTEM,
        "INTERNATIONAL_RESUME": INTERNATIONAL_RESUME_SYSTEM,
        "NETWORKING_STRATEGY": NETWORKING_SYSTEM,
    }

    response_type_map = {
        "COVER_LETTER": "cover_letter",
        "LINKEDIN_OPTIMIZE": "linkedin",
        "LEARNING_ROADMAP": "roadmap",
        "PORTFOLIO_IDEAS": "portfolio",
        "INTERNATIONAL_RESUME": "international",
        "NETWORKING_STRATEGY": "strategy",
    }

    system = system_map.get(intent)
    if not system:
        return "I'm not sure how to help with that. Could you rephrase?", "text"

    ctx = ""
    if resume:
        ctx += f"RESUME:\n{resume[:3000]}\n\n"
    if jd:
        ctx += f"JOB DESCRIPTION:\n{jd[:2000]}\n\n"
    if extra.get("target_country"):
        ctx += f"TARGET COUNTRY/REGION: {extra['target_country']}\n\n"

    messages = [{"role": "system", "content": system}]
    for m in history[-8:]:
        if m.get("role") in ("user", "assistant") and m.get("content"):
            messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": f"{ctx}User request: {user_message}"})

    resp = client.chat.completions.create(
        model=MODELS["router"],  # gpt-4o-mini — sufficient for these structured outputs
        messages=messages,
        temperature=0.2,
        max_tokens=2000,
    )
    return resp.choices[0].message.content.strip(), response_type_map.get(intent, "text")
