/**
 * lib/api.ts — ResumeForge API Client v2
 *
 * Auth-aware: all requests pass Authorization: Bearer <access_token>
 * via a global helper set by AuthProvider.
 * Conversations + messages are user-scoped and stored in MongoDB.
 */

const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  'http://localhost:8000';

export const BASE = `${String(API_BASE).replace(/\/$/, '')}/api`;

type ExperienceLevel = 'fresher' | 'junior' | 'middle' | 'senior' | 'lead' | 'manager';

// ── Get auth headers injected by AuthProvider ─────────────────────────────
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const fn = (window as any).__getAuthHeaders;
    return fn ? fn() : {};
  } catch {
    return {};
  }
}

function getStoredAtsMode(): 'HONEST' | 'KEYWORD' | 'AGGRESSIVE' {
  if (typeof window === 'undefined') return 'HONEST';
  try {
    const v = localStorage.getItem('ats_mode_choice');
    if (v === 'GAMING') return 'AGGRESSIVE';
    return v === 'KEYWORD' || v === 'AGGRESSIVE' ? v : 'HONEST';
  } catch { return 'HONEST'; }
}

function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  try { return localStorage.getItem('ats_openai_api_key') || ''; } catch { return ''; }
}

// ── Auth-aware fetch ──────────────────────────────────────────────────────
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const existingHeaders = (options.headers || {}) as Record<string, string>;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...existingHeaders,
  };
  return fetch(`${BASE}${path}`, { ...options, headers });
}

// ── Core chat ─────────────────────────────────────────────────────────────
// ── Per-mode draft state passed with every chat request ──────────────────
export interface ChangedSection { key: string; label: string; content: string; }

export interface ChatState {
  resume_draft?: string;
  active_jd_text?: string;
  original_resume?: string;
  last_optimization_mode?: string;
  confirmed_facts?: Record<string, unknown>;
  unconfirmed_claims?: Record<string, unknown>;
  artifact_source?: string;
  honest_resume_draft?: string;
  keyword_resume_draft?: string;
  aggressive_resume_draft?: string;
  honest_optimize_count?: number;
  keyword_optimize_count?: number;
  aggressive_optimize_count?: number;
  honest_draft_hash?: string;
  keyword_draft_hash?: string;
  aggressive_draft_hash?: string;
  response_type?: string;
  changed_sections?: ChangedSection[]; // backend-detected changed sections after optimize
}

async function callChat(
  message: string,
  history: Array<{ role: string; content: string }>,
  opts: {
    resume_text?: string;
    jd_text?: string;
    resume_name?: string;
    jd_name?: string;
    ats_mode?: 'HONEST' | 'KEYWORD' | 'AGGRESSIVE';
    conversation_id?: string;
    chatState?: ChatState;
  } = {},
): Promise<{ reply: string; chatState: ChatState }> {
  const s = opts.chatState || {};
  const res = await apiFetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      resume_text:     opts.resume_text  || '',
      jd_text:         opts.jd_text      || '',
      resume_name:     opts.resume_name  || '',
      jd_name:         opts.jd_name      || '',
      ats_mode:        opts.ats_mode     || getStoredAtsMode(),
      resume_draft:    s.resume_draft    || '',
      active_jd_text:  s.active_jd_text  || '',
      api_key:         getStoredApiKey(),
      conversation_id: opts.conversation_id || null,
      original_resume:          s.original_resume          || '',
      last_optimization_mode:   s.last_optimization_mode   || '',
      confirmed_facts:          s.confirmed_facts          || {},
      unconfirmed_claims:       s.unconfirmed_claims       || {},
      artifact_source:          s.artifact_source          || '',
      honest_resume_draft:      s.honest_resume_draft      || '',
      keyword_resume_draft:     s.keyword_resume_draft     || '',
      aggressive_resume_draft:  s.aggressive_resume_draft  || '',
      honest_optimize_count:    s.honest_optimize_count    || 0,
      keyword_optimize_count:   s.keyword_optimize_count   || 0,
      aggressive_optimize_count:s.aggressive_optimize_count|| 0,
      honest_draft_hash:        s.honest_draft_hash        || '',
      keyword_draft_hash:       s.keyword_draft_hash       || '',
      aggressive_draft_hash:    s.aggressive_draft_hash    || '',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = (err as { detail?: string }).detail || '';
    if (detail.toLowerCase().includes('api key') || res.status === 401) {
      throw new Error('No OpenAI API key found. Go to AI Mode → ⚙️ Settings and enter your key.');
    }
    throw new Error(detail || `Backend error ${res.status}`);
  }

  const data = await res.json();
  const newState: ChatState = {
    resume_draft:             data.resume_draft             || '',
    active_jd_text:           data.active_jd_text           || '',
    original_resume:          data.original_resume          || '',
    last_optimization_mode:   data.last_optimization_mode   || '',
    confirmed_facts:          data.confirmed_facts          || {},
    unconfirmed_claims:       data.unconfirmed_claims        || {},
    artifact_source:          data.artifact_source          || '',
    honest_resume_draft:      data.honest_resume_draft      || '',
    keyword_resume_draft:     data.keyword_resume_draft     || '',
    aggressive_resume_draft:  data.aggressive_resume_draft  || '',
    honest_optimize_count:    data.honest_optimize_count    || 0,
    keyword_optimize_count:   data.keyword_optimize_count   || 0,
    aggressive_optimize_count:data.aggressive_optimize_count|| 0,
    honest_draft_hash:        data.honest_draft_hash        || '',
    keyword_draft_hash:       data.keyword_draft_hash       || '',
    aggressive_draft_hash:    data.aggressive_draft_hash    || '',
    response_type:            data.response_type            || 'general',
    changed_sections:         data.changed_sections          || [],
  };
  return { reply: (data.reply as string) || '', chatState: newState };
}

// ── Load conversation_state from backend ──────────────────────────────────
export async function loadConversationState(convId: string): Promise<ChatState | null> {
  try {
    const res = await apiFetch(`/conversation-state/${convId}`);
    if (!res.ok) return null;
    return await res.json() as ChatState;
  } catch {
    return null;
  }
}

// ── uploadDocument ────────────────────────────────────────────────────────
export async function uploadDocument(
  file: File,
  type: 'resume' | 'job_description',
): Promise<{ document_id: string; extracted_text_preview?: string; text?: string }> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('file_type', type === 'job_description' ? 'jd' : 'resume');
  const res = await apiFetch('/upload', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Upload failed');
  return { document_id: '', extracted_text_preview: data.parsed_text || '', text: data.parsed_text || '' };
}

// ── getGreeting ───────────────────────────────────────────────────────────
export async function getGreeting(_apiKey?: string): Promise<{ reply: string }> {
  const res = await apiFetch('/greeting', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to load greeting');
  return res.json();
}

// ── getDocumentText ───────────────────────────────────────────────────────
export async function getDocumentText(documentId: string): Promise<{ text: string; document_id: string }> {
  const res = await apiFetch(`/document/${documentId}/text`);
  if (!res.ok) throw new Error('Failed to get document text');
  return res.json();
}

// ── uploadText ────────────────────────────────────────────────────────────
export async function uploadText(text: string, type: 'resume' | 'job_description', filename: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const file = new File([blob], filename || 'text.txt', { type: 'text/plain' });
  return uploadDocument(file, type);
}

// ── fullAnalysis ──────────────────────────────────────────────────────────
export async function fullAnalysis(
  resume: string,
  jd: string,
  experienceLevel: ExperienceLevel = 'middle',
  candidateName?: string | null,
  conversationId?: string,
): Promise<{ markdown: string; ats_score: number; verdict?: string }> {
  const message =
    `Please run a complete ATS score analysis of my resume against this job description.\n\n` +
    (candidateName ? `Candidate: ${candidateName}\n` : '') +
    `Experience level: ${experienceLevel}\n\nJOB DESCRIPTION:\n${jd}`;
  const reply = await callChat(message, [], { resume_text: resume, jd_text: jd, conversation_id: conversationId });
  const scoreMatch = reply.match(/(\d{1,3})\s*\/\s*100/);
  const ats_score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
  return { markdown: reply, ats_score, verdict: undefined };
}

// ── getJdSummary ──────────────────────────────────────────────────────────
export async function getJdSummary(jobDescriptionText: string) {
  const message =
    `Analyze this job description and provide a structured summary with:\n` +
    `- Role title, company, location, seniority level\n- 2-3 sentence summary\n` +
    `- Key responsibilities (up to 8)\n- Must-have skills\n- Nice-to-have skills\n` +
    `- ATS keywords\n- ATS checklist\n- 6 interview questions\n\nJOB DESCRIPTION:\n${jobDescriptionText}`;
  const reply = await callChat(message, [], { jd_text: jobDescriptionText });

  const extractList = (pattern: RegExp): string[] => {
    const m = reply.match(new RegExp(pattern.source + '[\\s\\S]*?(?=\\n#{1,3} |\\n\\*{2}[A-Z]|$)', 'i'));
    if (!m) return [];
    return m[0].split('\n').filter((l) => /^[-•*\d]/.test(l.trim()))
      .map((l) => l.replace(/^[-•*\d.)+\s]+/, '').trim()).filter(Boolean).slice(0, 10);
  };
  const field = (pat: RegExp): string => {
    const m = reply.match(new RegExp(pat.source + '[*\\s:]+([^\\n*]+)', 'i'));
    return (m?.[1] || '').replace(/\*+/g, '').trim();
  };

  return {
    role_title:          field(/role|title|position/),
    company:             field(/company|organization|employer/),
    location:            field(/location|office|city/),
    seniority:           field(/seniority|level|experience/),
    summary:             reply.split('\n').find((l) => l.length > 80 && !l.startsWith('#')) || '',
    responsibilities:    extractList(/responsibilities|duties/),
    must_have_skills:    extractList(/must.have|required\s+skills/),
    nice_to_have_skills: extractList(/nice.to.have|good\s+to\s+have|preferred/),
    keywords:            extractList(/keywords/),
    ats_checklist:       extractList(/ats\s+checklist|checklist/),
    interview_questions: extractList(/interview\s+questions?/),
  };
}

// ── getResumeReview ───────────────────────────────────────────────────────
export async function getResumeReview(resumeText: string, targetRole?: string) {
  const message =
    `Review my resume and provide:\n1. 3-5 key strengths\n2. 3-5 gaps or weaknesses\n` +
    `3. Top 3 immediate fixes\n4. 2-3 bullet rewrites (Before: ... After: ...)\n\n` +
    (targetRole ? `Target role: ${targetRole}\n\n` : '') + `RESUME:\n${resumeText}`;
  const reply = await callChat(message, [], { resume_text: resumeText });

  const extractBullets = (pattern: RegExp): string[] => {
    const m = reply.match(new RegExp(pattern.source + '[\\s\\S]*?(?=\\n#{1,4} |\\n\\d\\.|\\n\\*{2}\\d|$)', 'i'));
    if (!m) return [];
    return m[0].split('\n').filter((l) => /^[-•*✔⚠✅❌\d]/.test(l.trim()))
      .map((l) => l.replace(/^[-•*✔⚠✅❌\d.)+\s]+/, '').trim()).filter(Boolean).slice(0, 6);
  };
  const rewrites: Array<{ before: string; after: string }> = [];
  const rw = [...reply.matchAll(/Before[:\s*]+([^\n]+)\n[*\s]*After[:\s*]+([^\n]+)/gi)];
  for (const m of rw) { if (rewrites.length >= 3) break; rewrites.push({ before: m[1].trim(), after: m[2].trim() }); }

  return {
    strengths: extractBullets(/strengths?/),
    gaps:      extractBullets(/gaps?|weaknesses?/),
    top_fixes: extractBullets(/top\s+fixes?|fixes?|improvements?|immediately/),
    rewrites,
  };
}

// ── optimizeResume ────────────────────────────────────────────────────────
export async function optimizeResume(resume: string, jd: string, _experienceLevel: ExperienceLevel = 'middle') {
  const message =
    `Optimize my resume section by section for this job description. ` +
    `For each section show the section name and optimized content.\n\nJOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resume}`;
  const reply = await callChat(message, [], { resume_text: resume, jd_text: jd });

  const sections: Array<{ section_name: string; optimized_content: string }> = [];
  const matches = [...reply.matchAll(/#{1,3}\s*(?:【\s*)?([^】\n#*]+?)(?:\s*】)?\s*\n([\s\S]*?)(?=\n#{1,3}\s|$)/g)];
  for (const m of matches) {
    const name = m[1].trim(); const content = m[2].trim();
    if (name && content.length > 10) sections.push({ section_name: name, optimized_content: content });
  }
  if (!sections.length) sections.push({ section_name: 'Optimized Resume', optimized_content: reply });
  return { sections };
}

// ── chatWithHistory ───────────────────────────────────────────────────────
export async function chatWithHistory(
  messages: Array<{ role: string; content: string }>,
  conversationId?: string,
  explicitResumeText?: string,
  explicitJdText?: string,
  chatState?: ChatState,
): Promise<{ answer: string; chatState: ChatState }> {
  if (!messages.length) return { answer: '', chatState: chatState || {} };
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return { answer: '', chatState: chatState || {} };

  const history = messages.slice(0, -1);

  let resume_text = explicitResumeText || '';
  let jd_text = explicitJdText || '';

  // If not provided explicitly, check the chatState for active texts
  if (!resume_text && chatState?.resume_draft) resume_text = chatState.resume_draft;
  if (!jd_text && chatState?.active_jd_text) jd_text = chatState.active_jd_text;

  // Last resort: scan history
  if (!resume_text || !jd_text) {
    for (const m of messages) {
      if (m.role === 'user') {
        if (!resume_text && m.content.length > 300 && /experience|skills|education|summary|b\.tech|bachelor|university/i.test(m.content)) {
          resume_text = m.content;
        }
        if (!jd_text && m.content.length > 200 && /responsibilities|requirements|qualifications|job description|key job/i.test(m.content)) {
          jd_text = m.content;
        }
      }
    }
  }

  const result = await callChat(lastUser.content, history, {
    resume_text, jd_text,
    conversation_id: conversationId,
    chatState,
  });
  return { answer: result.reply, chatState: result.chatState };
}

export async function getATSScore(resume: string, jd: string, experienceLevel: ExperienceLevel = 'middle') {
  const result = await fullAnalysis(resume, jd, experienceLevel);
  return { score: result.ats_score, markdown: result.markdown };
}

export async function interactiveAnalysis(resume: string, jd: string, experienceLevel: ExperienceLevel = 'middle') {
  return fullAnalysis(resume, jd, experienceLevel);
}

export async function keywordPlan(resume: string, jd: string) {
  const message = `Create a keyword gap plan: which JD keywords are present in my resume, which are missing, and exactly how to add them.\n\nJD:\n${jd}\n\nRESUME:\n${resume}`;
  const plan = await callChat(message, [], { resume_text: resume, jd_text: jd });
  return { plan };
}

export function buildAnalysisPayload(params: {
  resume_text: string; job_description_text: string;
  experience_level: ExperienceLevel; candidate_name?: string | null;
}): Record<string, unknown> {
  return { resume_text: params.resume_text, job_description_text: params.job_description_text, experience_level: params.experience_level, candidate_name: params.candidate_name ?? undefined };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONVERSATIONS API
// ══════════════════════════════════════════════════════════════════════════════
export interface ConversationItem { id: string; title: string; preview: string; updated_at: number; message_count?: number; }
export interface MessageItem { id: string; conversation_id: string; role: 'user' | 'assistant'; content: string; created_at: number; }

export async function listConversations(): Promise<ConversationItem[]> {
  const res = await apiFetch('/conversations');
  if (!res.ok) return [];
  return res.json();
}

export async function createConversation(payload: { title?: string; preview?: string }): Promise<ConversationItem> {
  const res = await apiFetch('/conversations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function updateConversation(id: string, payload: { title?: string; preview?: string }): Promise<ConversationItem> {
  const res = await apiFetch(`/conversations/${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update conversation');
  return res.json();
}

export async function deleteConversation(id: string): Promise<{ success: boolean }> {
  const res = await apiFetch(`/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return res.json();
}

export async function getConversationMessages(convId: string): Promise<MessageItem[]> {
  const res = await apiFetch(`/conversations/${encodeURIComponent(convId)}/messages`);
  if (!res.ok) return [];
  return res.json();
}

export async function addMessage(convId: string, role: 'user' | 'assistant', content: string): Promise<MessageItem> {
  const res = await apiFetch(`/conversations/${encodeURIComponent(convId)}/messages`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, content }),
  });
  if (!res.ok) throw new Error('Failed to add message');
  return res.json();
}

// ══════════════════════════════════════════════════════════════════════════════
// THREADS (backwards-compat aliases)
// ══════════════════════════════════════════════════════════════════════════════
export interface ThreadItem { id: string; title: string; preview: string; updated_at: number; }

export async function listThreads(): Promise<ThreadItem[]> {
  const res = await apiFetch('/threads');
  if (!res.ok) return [];
  return res.json();
}

export async function createThread(payload: { id?: string; title?: string; preview?: string }): Promise<ThreadItem> {
  const res = await apiFetch('/threads', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create thread');
  return res.json();
}

export async function updateThread(threadId: string, payload: { title?: string; preview?: string }): Promise<ThreadItem> {
  const res = await apiFetch(`/threads/${encodeURIComponent(threadId)}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update thread');
  return res.json();
}

export async function deleteThread(threadId: string): Promise<{ success: boolean }> {
  const res = await apiFetch(`/threads/${encodeURIComponent(threadId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete thread');
  return res.json();
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH legacy helpers
// ══════════════════════════════════════════════════════════════════════════════
const USER_CACHE_KEY = 'rf_user_cache';

export function getStoredAuthToken(): string | null { return null; }
export function setStoredAuth(_token: string, _user: { email: string; name: string }): void {}
export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem('rf_refresh_token'); localStorage.removeItem(USER_CACHE_KEY); } catch {}
}
export function getStoredAuthUser(): { email: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  try { const raw = localStorage.getItem(USER_CACHE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export interface AuthSignupPayload { email: string; password: string; name?: string; }
export interface AuthLoginPayload  { email: string; password: string; }
export interface AuthResponse      { success: boolean; access_token: string; refresh_token: string; user: { email: string; name: string }; }

export async function authSignup(payload: AuthSignupPayload): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email, password: payload.password, name: payload.name ?? '' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).detail ?? 'Signup failed');
  return data as AuthResponse;
}

export async function authLogin(payload: AuthLoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email, password: payload.password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).detail ?? 'Login failed');
  return data as AuthResponse;
}
