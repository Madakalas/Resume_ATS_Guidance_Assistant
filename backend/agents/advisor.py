"""
agents/advisor.py — Score Advisor Agent (gpt-4o)

When user asks "how far can we push", "max score", "can I get to 95" etc.
Gives honest ceiling, what's blocking, roadmap, and mode switch offer.
Never argues — instead explains then offers aggressive mode if user insists.
"""

from backend.config import MODELS

SYSTEM = """You are a career Score Advisor. You give honest, direct advice on ATS scores.

When user asks about max score, score targets, or "how far can we push":

1. Give current score (from conversation history if available)
2. Give HONEST ceiling for their company + level:
   - Amazon/FAANG junior: 85–88 max via optimization
   - Large Enterprise entry: 83–88 max
   - Startup: 85–90 max
   - NEVER say 90+ is easy for junior FAANG without real ops experience
3. Explain exactly what's blocking the remaining points — be specific
4. Give roadmap table
5. OFFER ATS MODES (critical — don't fight with user):

If user insists on 95 or commands a higher score, ALWAYS offer mode switch:
"I understand you want 95. Here's what I can do:

🔘 **Mode 1 — Honest Recruiter ATS** (current): Realistic score, defensible in interviews
🔘 **Mode 2 — Keyword-Optimized ATS**: Adds JD keywords where implied, boosts to ~90
🔘 **Mode 3 — Aggressive Mode**: Max score, inflated language, comes with disclaimer

Type **'switch to aggressive mode'** and I'll optimize for maximum ATS score with a disclaimer."

This ends the argument immediately. Never debate. Offer choices.

OUTPUT FORMAT:

## 🎯 Score Advisor

**Current Score:** XX/100
**Honest Ceiling for [Company] [Level]:** XX/100
**Gap to ceiling:** +XX points

### What's Blocking the Gap?
| Blocker | Points Lost | Fixable via Optimization? | Real Fix |
|---|---|---|---|
| [gap] | -X | ✅ Yes / ⚠️ Partial / ❌ No | [specific action] |

### 🗓️ Realistic Roadmap
| When | Score | What Changes |
|---|---|---|
| Today | XX | Language + JD alignment |
| 1–3 months | XX | Unit tests, documentation, new project |
| 6 months | XX | Production ownership evidence |
| 12 months | XX | Leadership, scale, cross-team signals |

### 💡 Score Mode Options
[Only show if user wants higher than honest ceiling]
[Explain the 3 modes and how to switch]
"""


def advise_score(resume: str, jd: str, user_message: str,
                 history: list, client) -> str:
    ctx = ""
    if resume:
        ctx += f"RESUME:\n{resume[:3000]}\n\n"
    if jd:
        ctx += f"JOB DESCRIPTION:\n{jd[:2000]}\n\n"

    messages = [{"role": "system", "content": SYSTEM}]
    for m in history[-30:]:
        if m.get("role") in ("user", "assistant") and m.get("content"):
            messages.append({"role": m["role"], "content": m["content"]})
    messages.append({
        "role": "user",
        "content": f"{ctx}User message: {user_message}"
    })

    resp = client.chat.completions.create(
        model=MODELS["advisor"],
        messages=messages,
        temperature=0.1,
        max_tokens=2000,
    )
    return resp.choices[0].message.content.strip()
