"""
agents/diff_agent.py — Section Diff Agent v3

Extracts the FULL OPTIMIZED RESUME from the bot response.

The optimizer outputs the full resume in one of these formats:
  1. Between --- delimiters
  2. After a "## Full Resume" / "Full Optimized Resume" header
  3. As the bulk of the response after the change table

We try all approaches before falling back to LLM.
"""

import re
import json
from backend.config import MODELS


# ─── Extract the full optimized resume block from bot response ────────────────

def _extract_resume_block(bot_response: str) -> str:
    """
    Pull the full optimized resume text from the optimizer response.
    Tries multiple extraction strategies in order of reliability.
    Returns empty string if no resume block found.
    """
    # Strategy 1: Between two --- lines (original format)
    pattern = r'---\s*\n([\s\S]{200,}?)\n---'
    matches = re.findall(pattern, bot_response)
    if matches:
        candidate = max(matches, key=len).strip()
        if _looks_like_resume_block(candidate):
            return candidate

    # Strategy 2: After a "Full" resume header
    full_headers = [
        r'#{1,3}\s*(?:📝\s*)?(?:Full(?:\s+Complete)?|Complete|Optimized|Updated|Rewritten)\s+Resume\b',
        r'#{1,3}\s*Your\s+(?:Optimized|Updated|New|Improved)\s+Resume\b',
        r'---+\s*\n',  # single --- then content
        r'\[FULL COMPLETE RESUME[^\]]*\]',
        r'FULL RESUME[:\s]*\n',
    ]
    for pattern in full_headers:
        m = re.search(pattern, bot_response, re.IGNORECASE)
        if m:
            after = bot_response[m.end():].strip()
            # Cut at roadmap/footer sections
            stop_patterns = [
                r'\n#{1,3}\s*(?:🗓️?|Roadmap|Timeline|What\'s Next|Next Steps)',
                r'\n\*\*Roadmap',
                r'\n\|\s*When\s*\|',
                r'\n---\s*\n#{1,3}',
            ]
            for stop in stop_patterns:
                stop_m = re.search(stop, after, re.IGNORECASE)
                if stop_m:
                    after = after[:stop_m.start()].strip()
            if len(after) > 200 and _looks_like_resume_block(after):
                return after

    # Strategy 3: Fallback — everything after first --- in a long response
    idx = bot_response.find('\n---\n')
    if idx == -1:
        idx = bot_response.find('\n---')
    if idx != -1:
        after = bot_response[idx + 4:].strip()
        stop_patterns = ['### 🗓', '**Roadmap', '| When |', '## 🗓', '### 💡']
        for stop in stop_patterns:
            si = after.find(stop)
            if si != -1:
                after = after[:si].strip()
        if len(after) > 200 and _looks_like_resume_block(after):
            return after

    # Strategy 4: If the entire response looks like a resume (no analysis tables), use it all
    if _looks_like_resume_block(bot_response) and '| # |' not in bot_response and 'Score Impact' not in bot_response:
        return bot_response.strip()

    return ''


def _looks_like_resume_block(text: str) -> bool:
    """Check if text looks like actual resume content (not analysis tables)."""
    if len(text) < 150:
        return False
    signals = [
        'experience', 'education', 'skills', 'projects', 'summary',
        'b.tech', 'bachelor', 'university', 'college', 'linkedin',
        'github', 'objective', 'professional', 'email', 'phone'
    ]
    lower = text.lower()
    matched = sum(1 for s in signals if s in lower)
    return matched >= 3


# ─── Parse sections from extracted resume text ────────────────────────────────

SECTION_HEADERS = {
    'summary': [
        'SUMMARY', 'PROFESSIONAL SUMMARY', 'OBJECTIVE', 'CAREER OBJECTIVE',
        'PROFILE', 'ABOUT ME', 'OVERVIEW',
    ],
    'experience': [
        'PROFESSIONAL EXPERIENCE', 'WORK EXPERIENCE', 'EXPERIENCE',
        'EMPLOYMENT HISTORY', 'CAREER HISTORY',
    ],
    'skills': [
        'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'KEY SKILLS',
        'TECHNOLOGIES', 'TECH STACK',
    ],
    'projects': [
        'PROJECTS', 'KEY PROJECTS', 'PERSONAL PROJECTS', 'NOTABLE PROJECTS',
        'SELECTED PROJECTS',
    ],
    'education': [
        'EDUCATION', 'ACADEMIC BACKGROUND', 'QUALIFICATIONS',
    ],
    'certifications': [
        'CERTIFICATIONS', 'CERTIFICATES', 'LICENSES & CERTIFICATIONS',
    ],
    'achievements': [
        'ACHIEVEMENTS', 'AWARDS', 'HONORS', 'ACCOMPLISHMENTS',
    ],
    'languages': [
        'LANGUAGES', 'LANGUAGE SKILLS',
    ],
}


def _normalise_header(line: str) -> str:
    """Strip markdown and extra formatting from a header line."""
    s = line.strip()
    s = re.sub(r'^#+\s*', '', s)
    s = re.sub(r'\*+', '', s)
    s = re.sub(r'[_`]', '', s)
    s = re.sub(r'[:–—]$', '', s)
    s = re.sub(r'[^\w\s]', ' ', s)
    return s.strip().upper()


def _is_section_header(line: str):
    """Returns (key, original_line) or (None, line)."""
    norm = _normalise_header(line)
    if not norm or len(norm) > 70:
        return None, line
    for key, headers in SECTION_HEADERS.items():
        for h in headers:
            if norm == h or norm.startswith(h):
                return key, line
    return None, line


def _parse_sections_from_resume(resume_text: str) -> dict:
    """Parse a full resume text into {section_key: content_string}."""
    sections = {}
    current_key = None
    lines = resume_text.split('\n')

    for line in lines:
        key, _ = _is_section_header(line)
        if key:
            current_key = key
            if key not in sections:
                sections[key] = []
        elif current_key is not None:
            sections[current_key].append(line)

    result = {}
    for key, content_lines in sections.items():
        text = '\n'.join(content_lines).strip()
        text = re.sub(r'\n{3,}', '\n\n', text)
        if text and len(text) > 10:
            result[key] = text[:1500]

    return result


# ─── Main entry point ─────────────────────────────────────────────────────────

LABELS = {
    'summary': 'Summary',
    'experience': 'Professional Experience',
    'skills': 'Skills',
    'projects': 'Projects',
    'education': 'Education',
    'certifications': 'Certifications',
    'achievements': 'Achievements',
    'languages': 'Languages',
}


def detect_changed_sections(
    original_resume: str,
    bot_response: str,
    history: list,
    client,
) -> list:
    """
    Extract changed sections from optimizer bot response.
    Returns [{key, label, content}] for each changed section.
    """
    # Step 1: Extract the full optimized resume block
    resume_block = _extract_resume_block(bot_response)

    if resume_block:
        parsed = _parse_sections_from_resume(resume_block)
        if parsed:
            orig_sections = _parse_sections_from_resume(original_resume) if original_resume else {}
            result = []
            for key, content in parsed.items():
                orig_content = orig_sections.get(key, '')
                if not orig_content or content.strip() != orig_content.strip():
                    result.append({
                        'key': key,
                        'label': LABELS.get(key, key.title()),
                        'content': content,
                    })
            if result:
                return result
            # Nothing differs — return all parsed (useful for new resume builds)
            return [{'key': k, 'label': LABELS.get(k, k.title()), 'content': v}
                    for k, v in parsed.items()]

        # Resume block found but sections parsing failed — use LLM on the block
        return _llm_diff(original_resume, resume_block, client)

    # Step 2: No resume block found — check if this is an optimization response at all
    opt_signals = [
        'resume optimization', 'changes applied', 'optimized', 'score impact',
        'honest mode', 'keyword mode', 'aggressive mode', 'rewritten',
        '✏️', 'original →', '→ updated', 'what changed', 'what was changed',
        'new ats score', 'estimated score',
    ]
    is_opt_response = any(s in bot_response.lower() for s in opt_signals)

    # Also check if the bulk of the response looks like a resume
    if not is_opt_response and _looks_like_resume_block(bot_response):
        is_opt_response = True

    if not is_opt_response:
        return []

    return _llm_diff(original_resume, bot_response, client)


def _llm_diff(original_resume: str, bot_response: str, client) -> list:
    """LLM fallback — ask model to extract actual resume section content."""
    SYSTEM = """\
You are a resume section extractor. Extract ACTUAL RESUME CONTENT from the given text.

CRITICAL:
- Extract ONLY real resume content (job bullets, summary paragraph, skills list, project descriptions)
- NEVER extract from score tables, change logs, ATS analysis, or markdown tables
- "content" must be ready-to-use resume text for that section
- Output ONLY valid JSON array, no markdown fences

Format: [{"key": "summary", "label": "Summary", "content": "actual resume text"}]
Valid keys: summary, experience, skills, projects, education, certifications, achievements, languages
"""
    prompt = (
        f"ORIGINAL RESUME:\n{(original_resume or '')[:2000]}\n\n"
        f"TEXT TO EXTRACT FROM:\n{(bot_response or '')[:4000]}\n\n"
        "Extract changed/improved resume section content. JSON array only."
    )

    try:
        resp = client.chat.completions.create(
            model=MODELS.get('optimizer', 'gpt-4o-mini'),
            messages=[
                {'role': 'system', 'content': SYSTEM},
                {'role': 'user', 'content': prompt},
            ],
            temperature=0.05,
            max_tokens=1500,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        raw = raw.strip()

        if not raw or raw == '[]':
            return []

        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            return []

        valid_keys = set(LABELS.keys())
        result = []
        for item in parsed:
            if not isinstance(item, dict):
                continue
            key = str(item.get('key', '')).strip().lower()
            label = str(item.get('label', '')).strip()
            content = str(item.get('content', '')).strip()
            # Reject table-like content
            if (key in valid_keys and content
                    and content.count('|') < 3
                    and not re.search(r'\+\d+\s*pts?', content)):
                result.append({
                    'key': key,
                    'label': label or LABELS.get(key, key.title()),
                    'content': content[:1500],
                })
        return result

    except Exception:
        return []
