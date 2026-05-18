"""
agents/smart_context.py — Smart Context Builder v1.0

This module adds intelligence to RAGA by:
1. Extracting structured insights from resume + JD before routing
2. Building rich context objects passed to every agent
3. Pre-computing useful signals so agents don't repeat analysis

Think of this as RAGA's "working memory" — like how Claude builds
an internal model of what the user wants before responding.
"""

import re
from typing import Optional
from backend.config import MODELS


# ── Resume insight extraction ──────────────────────────────────────────────────
def extract_resume_insights(resume_text: str) -> dict:
    """
    Extract structured signals from resume text without LLM.
    Fast, deterministic, used to augment every agent call.
    """
    if not resume_text or len(resume_text.strip()) < 100:
        return {"level": "unknown", "years_exp": 0, "has_metrics": False, "skills": [], "fresher": True}

    text = resume_text.lower()
    
    # ── Experience level ──────────────────────────────────────────────────────
    year_matches = re.findall(r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+20(\d{2})', text)
    year_ints = [int('20' + y) for _, y in year_matches]
    years_exp = 0
    if len(year_ints) >= 2:
        years_exp = max(year_ints) - min(year_ints)
    
    # Check for explicit year mentions like "3+ years", "5 years experience"
    explicit_years = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)', text)
    if explicit_years:
        max_explicit = max(int(y) for y in explicit_years)
        years_exp = max(years_exp, max_explicit)

    if years_exp == 0 and any(x in text for x in ['fresher', 'fresh graduate', 'no experience', 'looking for entry']):
        level = "fresher"
    elif years_exp <= 1:
        level = "entry"
    elif years_exp <= 3:
        level = "junior"
    elif years_exp <= 6:
        level = "mid"
    elif years_exp <= 10:
        level = "senior"
    else:
        level = "lead"

    # ── Metrics detection ─────────────────────────────────────────────────────
    has_metrics = bool(re.search(r'\d+\s*%|\d+[xX]\s|\d+\s*(users?|requests?|transactions?|customers?|ms\b|seconds?|minutes?|hours?|days?|weeks?|months?|lpa|lakhs?|crore)', text))

    # ── Skills extraction ─────────────────────────────────────────────────────
    tech_keywords = [
        'python', 'java', 'javascript', 'typescript', 'react', 'nodejs', 'node.js',
        'spring boot', 'django', 'fastapi', 'flask', 'sql', 'mysql', 'postgresql',
        'mongodb', 'redis', 'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'git',
        'jenkins', 'ci/cd', 'rest api', 'graphql', 'html', 'css', 'angular', 'vue',
        'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
        'c++', 'c#', 'go', 'rust', 'kotlin', 'swift', 'flutter', 'react native',
        'kafka', 'rabbitmq', 'elasticsearch', 'spark', 'hadoop', 'airflow',
    ]
    found_skills = [s for s in tech_keywords if s in text]

    # ── Production signals ────────────────────────────────────────────────────
    has_prod_signals = any(x in text for x in [
        'production', 'deployed', 'release', 'live', 'users', 'scale', 'performance',
        'monitoring', 'incident', 'on-call', 'sla', 'uptime'
    ])

    # ── Leadership signals ────────────────────────────────────────────────────
    has_leadership = any(x in text for x in [
        'led', 'managed', 'mentored', 'guided', 'headed', 'supervised',
        'team lead', 'tech lead', 'senior', 'principal'
    ])

    # ── Education level ───────────────────────────────────────────────────────
    has_masters = bool(re.search(r'm\.tech|mtech|m\.e\b|master|msc\b|m\.sc', text))
    has_bachelors = bool(re.search(r'b\.tech|btech|b\.e\b|bachelor|bsc\b|b\.sc|engineering', text))
    has_phd = bool(re.search(r'ph\.?d|doctorate', text))

    return {
        "level": level,
        "years_exp": years_exp,
        "has_metrics": has_metrics,
        "has_prod_signals": has_prod_signals,
        "has_leadership": has_leadership,
        "skills": found_skills[:15],
        "skill_count": len(found_skills),
        "fresher": level in ("fresher", "entry") or years_exp == 0,
        "education": "phd" if has_phd else "masters" if has_masters else "bachelors" if has_bachelors else "unknown",
    }


def extract_jd_insights(jd_text: str) -> dict:
    """
    Extract structured signals from JD text without LLM.
    """
    if not jd_text or len(jd_text.strip()) < 100:
        return {"company_type": "unknown", "level": "unknown", "required_skills": [], "is_remote": False}

    text = jd_text.lower()

    # ── Company type detection ────────────────────────────────────────────────
    faang = ['google', 'amazon', 'meta', 'facebook', 'apple', 'microsoft', 'netflix', 'uber', 'airbnb', 'stripe']
    indian_product = ['zerodha', 'razorpay', 'cred', 'swiggy', 'zomato', 'meesho', 'flipkart', 'phonepe', 'paytm', 'freshworks', 'zoho', 'byju', 'ola', 'myntra']
    it_services = ['tcs', 'infosys', 'wipro', 'accenture', 'cognizant', 'capgemini', 'ibm', 'hcl', 'tech mahindra']
    fintech = ['goldman sachs', 'jpmorgan', 'morgan stanley', 'hdfc', 'icici', 'paypal']

    company_type = "startup"  # default
    if any(c in text for c in faang): company_type = "faang"
    elif any(c in text for c in indian_product): company_type = "indian_product"
    elif any(c in text for c in it_services): company_type = "it_services"
    elif any(c in text for c in fintech): company_type = "fintech"

    # ── Level detection ───────────────────────────────────────────────────────
    level = "mid"
    if any(x in text for x in ['0-1 year', '0-2 year', 'fresh', 'fresher', 'entry level', 'entry-level', 'junior', 'associate software engineer']): level = "entry"
    elif any(x in text for x in ['senior', 'sr.', 'lead', 'principal', 'staff engineer', '5+ years', '6+ years', '7+ years']): level = "senior"
    elif any(x in text for x in ['manager', 'director', 'vp ', 'vice president']): level = "manager"

    # ── Required skills ───────────────────────────────────────────────────────
    tech_keywords = ['python', 'java', 'javascript', 'typescript', 'react', 'nodejs', 'sql', 'aws', 'docker', 'kubernetes', 'machine learning', 'c++', 'go', 'kafka', 'redis', 'mongodb', 'spring', 'django', 'flask']
    required_skills = [s for s in tech_keywords if s in text]

    # ── Remote detection ─────────────────────────────────────────────────────
    is_remote = any(x in text for x in ['remote', 'work from home', 'wfh', 'distributed team'])

    # ── Key requirements ─────────────────────────────────────────────────────
    has_system_design = 'system design' in text
    has_dsa = any(x in text for x in ['data structures', 'algorithms', 'leetcode', 'competitive programming'])
    has_ops = any(x in text for x in ['production', 'monitoring', 'incident', 'sre', 'devops'])

    return {
        "company_type": company_type,
        "level": level,
        "required_skills": required_skills[:10],
        "is_remote": is_remote,
        "has_system_design": has_system_design,
        "has_dsa": has_dsa,
        "has_ops": has_ops,
    }


def build_smart_context(resume: str, jd: str, history: list, state: dict) -> str:
    """
    Build a compact smart context string that gets prepended to every agent call.
    This is what makes RAGA "remember" and "reason" about the user's situation.

    Inspired by how Claude builds internal models before responding:
    - What do we know about this person? (inferred facts)
    - What do we know about the target? (JD analysis)
    - What's the gap? (skill match)
    - What mode are we in? (honest/aggressive)
    - What happened before? (recent conversation state)
    """
    resume_insights = extract_resume_insights(resume) if resume else {}
    jd_insights = extract_jd_insights(jd) if jd else {}

    parts = ["# RAGA Smart Context"]

    if resume_insights:
        parts.append(f"""
## Candidate Profile (auto-detected)
- Level: {resume_insights.get('level', 'unknown')} ({resume_insights.get('years_exp', 0)} years)
- Skills found: {', '.join(resume_insights.get('skills', [])[:8]) or 'none detected'}
- Has metrics: {'Yes' if resume_insights.get('has_metrics') else 'No — weak impact bullets'}
- Has production signals: {'Yes' if resume_insights.get('has_prod_signals') else 'No'}
- Leadership signals: {'Yes' if resume_insights.get('has_leadership') else 'No'}
- Education: {resume_insights.get('education', 'unknown')}
- Is fresher: {resume_insights.get('fresher', False)}""")

    if jd_insights:
        parts.append(f"""
## Target Role (auto-detected)
- Company type: {jd_insights.get('company_type', 'unknown')}
- Target level: {jd_insights.get('level', 'unknown')}
- Required skills: {', '.join(jd_insights.get('required_skills', [])[:8]) or 'none detected'}
- Remote: {jd_insights.get('is_remote', False)}
- System design expected: {jd_insights.get('has_system_design', False)}
- DSA expected: {jd_insights.get('has_dsa', False)}
- Ops/prod signals needed: {jd_insights.get('has_ops', False)}""")

    if resume_insights and jd_insights:
        resume_skills = set(resume_insights.get('skills', []))
        jd_skills = set(jd_insights.get('required_skills', []))
        matched = resume_skills & jd_skills
        missing = jd_skills - resume_skills
        parts.append(f"""
## Skill Gap (pre-computed)
- Matched: {', '.join(matched) or 'none'}
- Missing from resume: {', '.join(missing) or 'none — good match'}""")

    mode = state.get('ats_mode', 'HONEST')
    opt_count = state.get(f'{mode.lower()}_optimize_count', 0)
    has_draft = bool(state.get('resume_draft', ''))

    parts.append(f"""
## Session State
- Mode: {mode}
- Optimizations run ({mode}): {opt_count}
- Has optimized draft: {has_draft}
- Original resume saved: {bool(state.get('original_resume', ''))}""")

    return '\n'.join(parts)
