'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FileText, Plus, Send, ChevronDown, User, Bot, Loader2,
  Copy, Trash2, Pencil, RotateCw, X, CheckCircle2,
  Zap, Eye, ChevronRight, ChevronUp, Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RagaResponseCard, toResponseType } from '@/components/raga-response-card';

import { toastError, toastFileAttached } from '@/lib/toast-helpers';
import ResumePreview from '@/components/resume-preview';
import {
  chatWithHistory,
  fullAnalysis,
  getDocumentText,
  getGreeting,
  getJdSummary,
  getResumeReview,
  optimizeResume,
  uploadDocument,
  getConversationMessages,
  updateConversation,
  loadConversationState,
  type ChatState,
  type ChangedSection,
} from '@/lib/api';
import { useStore } from '@/lib/store';

// ── ATS mode ──────────────────────────────────────────────────────────────────
export const ATS_MODE_STORAGE = 'ats_mode_choice';
export type AtsModeType = 'HONEST' | 'KEYWORD' | 'AGGRESSIVE';

function loadAtsMode(): AtsModeType {
  if (typeof window === 'undefined') return 'HONEST';
  try {
    const v = localStorage.getItem(ATS_MODE_STORAGE) as string | null;
    if (v === 'GAMING') return 'AGGRESSIVE';
    return v === 'KEYWORD' || v === 'AGGRESSIVE' ? v : 'HONEST';
  } catch { return 'HONEST'; }
}
function saveAtsMode(mode: AtsModeType) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(ATS_MODE_STORAGE, mode); } catch { /* ignore */ }
}
const ATS_MODE_SHORT: Record<AtsModeType, string> = {
  HONEST: 'Honest', KEYWORD: 'Keyword', AGGRESSIVE: 'Aggressive',
};

export type AnalysisMode = 'EMPTY' | 'JD_ONLY' | 'RESUME_ONLY' | 'BOTH';
export function getAnalysisMode(resumeText: string, jdText: string): AnalysisMode {
  const hasR = (resumeText || '').trim().length > 0;
  const hasJ = (jdText || '').trim().length > 0;
  if (hasR && hasJ) return 'BOTH';
  if (hasJ) return 'JD_ONLY';
  if (hasR) return 'RESUME_ONLY';
  return 'EMPTY';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: { name: string; size: string }[];
  isMarkdown?: boolean;
  hasChanges?: boolean;
  responseType?: string; // ats_score | optimize | salary | score_advisor | interview | career | general
}

interface PendingResumeRequest { resumeText: string; jdText: string; }

interface AIModeChatViewProps {
  threadId?: string;
  onThreadUpdated?: (threadId: string, updates: { title?: string; preview?: string }) => void;
}

export type AttachedFileKind = 'job_description' | 'resume';
export interface AttachedFile {
  id: string;
  kind: AttachedFileKind;
  name: string;
  size: string;
  charCount: number;
  text: string;
}

interface AutomateState {
  messageId: string;
  changedSections: ChangedSection[];
  selectedResumeId: string | null;
  selectedVersionId: string | null;
  selectedSectionKeys: string[];
  step: 'select-resume' | 'select-sections' | 'done';
  isNewResume?: boolean; // user chose "Create AI-Resume"
}

// Per-message inline preview state
interface PreviewState {
  resumeId: string | null;
  open: boolean;
  pickingResume: boolean; // show resume picker
}

const STORAGE_KEY_PREFIX = 'aimode_thread_';
const ARTIFACT_KEY_PREFIX = 'aimode_artifacts_';
const CHAT_STATE_KEY_PREFIX = 'aimode_chatstate_';
const MAX_UPLOAD_BYTES = 1024 * 1024;
const MAX_ATTACHED_FILES = 3;

function looksLikeJdText(text: string): boolean {
  if (text.length < 200) return false;
  return /job\s*description|key\s*responsibilities|required\s*skills|minimum\s*qualifications|basic\s*qualifications|preferred\s*qualifications|we\s*are\s*looking|what\s*you.ll\s*do|about\s*the\s*role/i.test(text);
}
function looksLikeResumeText(text: string): boolean {
  if (text.length < 200) return false;
  const signals = ['experience', 'education', 'skills', 'projects', 'summary', 'b.tech', 'bachelor', 'university', 'college', 'linkedin', 'github', 'objective'];
  return signals.filter((s) => text.toLowerCase().includes(s)).length >= 3;
}
function isConversationalMessage(text: string): boolean {
  const t = text.trim();
  if (t.length < 150) return true;
  if (!looksLikeJdText(text) && !looksLikeResumeText(text)) return true;
  return false;
}
function parseCandidateNameFromResume(text: string): string {
  const t = (text || '').trim();
  if (!t) return '';
  const firstLine = t.split(/\r?\n/).map((l) => l.trim()).find(Boolean) || '';
  const m = firstLine.match(/^Personal:\s*([^|\n]+?)(\s{2,}|\s\||$)/i);
  const candidate = (m?.[1] || firstLine).replace(/\b(Summary|Skills|Experience|Projects|Education)\b:.*/i, '').trim();
  const words = candidate.split(/\s+/).filter(Boolean);
  return (words.length >= 2 && words.length <= 6 && candidate.length <= 60) ? candidate : '';
}

function loadStoredMessages(threadId: string): Message[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + threadId);
    if (!raw) return null;
    const data = JSON.parse(raw) as { messages: Array<{ id: string; role: string; content: string; timestamp: string; isMarkdown?: boolean; hasChanges?: boolean }> };
    return (data.messages || []).map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content, timestamp: new Date(m.timestamp), isMarkdown: m.isMarkdown, hasChanges: m.hasChanges }));
  } catch { return null; }
}
function saveStoredMessages(threadId: string, messages: Message[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY_PREFIX + threadId, JSON.stringify({ messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp.toISOString(), isMarkdown: m.isMarkdown, hasChanges: m.hasChanges })) })); } catch { /* ignore */ }
}

interface PersistedArtifacts { resumeText: string; resumeName: string; jdText: string; jdName: string; }
function loadPersistedArtifacts(tid: string): PersistedArtifacts {
  if (typeof window === 'undefined') return { resumeText: '', resumeName: '', jdText: '', jdName: '' };
  try { const raw = localStorage.getItem(ARTIFACT_KEY_PREFIX + tid); if (!raw) return { resumeText: '', resumeName: '', jdText: '', jdName: '' }; return JSON.parse(raw); } catch { return { resumeText: '', resumeName: '', jdText: '', jdName: '' }; }
}
function savePersistedArtifacts(tid: string, a: PersistedArtifacts) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(ARTIFACT_KEY_PREFIX + tid, JSON.stringify(a)); } catch { /* ignore */ }
}
function loadPersistedChatState(tid: string): ChatState {
  if (typeof window === 'undefined') return {};
  try { const raw = localStorage.getItem(CHAT_STATE_KEY_PREFIX + tid); if (!raw) return {}; return JSON.parse(raw); } catch { return {}; }
}
function savePersistedChatState(tid: string, state: ChatState) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(CHAT_STATE_KEY_PREFIX + tid, JSON.stringify(state)); } catch { /* ignore */ }
}

function detectChangedSections(content: string): ChangedSection[] {
  const hasOpt = /original.*→.*updated|changes applied|optimization|score impact|✏️|optimized|resume optimization/i.test(content);
  if (!hasOpt) return [];
  const sections: ChangedSection[] = [];
  const checks: Array<{ key: string; label: string; patterns: RegExp[] }> = [
    { key: 'summary', label: 'Summary / Objective', patterns: [/summary/i, /objective/i] },
    { key: 'experience', label: 'Professional Experience', patterns: [/experience/i, /employment/i] },
    { key: 'skills', label: 'Skills', patterns: [/skills/i, /competencies/i] },
    { key: 'projects', label: 'Projects', patterns: [/projects?/i] },
    { key: 'education', label: 'Education', patterns: [/education/i] },
    { key: 'certifications', label: 'Certifications', patterns: [/certifications?/i] },
  ];
  const lower = content.toLowerCase();
  for (const { key, label, patterns } of checks) {
    if (patterns.some((p) => p.test(lower))) {
      sections.push({ key, label, content: extractSection(content, key) });
    }
  }
  return sections;
}

function extractSection(content: string, key: string): string {
  const headerMap: Record<string, string[]> = {
    summary: ['SUMMARY', 'OBJECTIVE', 'PROFILE'],
    experience: ['PROFESSIONAL EXPERIENCE', 'WORK EXPERIENCE', 'EXPERIENCE'],
    skills: ['SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES'],
    projects: ['PROJECTS', 'KEY PROJECTS'],
    education: ['EDUCATION'],
    certifications: ['CERTIFICATIONS'],
  };
  const headers = headerMap[key] || [];
  const lines = content.split('\n');
  let inSection = false;
  const out: string[] = [];
  const allHeaders = Object.values(headerMap).flat();
  for (const line of lines) {
    const up = line.trim().toUpperCase();
    if (headers.some((h) => up === h || up.includes(h))) { inSection = true; continue; }
    if (inSection) {
      if (allHeaders.some((h) => up === h) && out.length > 0) break;
      out.push(line);
    }
  }
  return out.join('\n').trim().slice(0, 1500);
}

function extractOptimizedResume(content: string): string {
  const match = content.match(/(?:📝 Full Optimized Resume|---\n)([\s\S]+?)(?:\n---|\n🗓️|$)/i);
  if (match?.[1]?.trim().length > 200) return match[1].trim();
  if (looksLikeResumeText(content)) return content;
  return '';
}

export function AIModeChatView({ threadId, onThreadUpdated }: AIModeChatViewProps) {
  const tid = threadId || '1';
  const store = useStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [atsMode, setAtsMode] = useState<AtsModeType>(() => loadAtsMode());
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [pendingResume, setPendingResume] = useState<PendingResumeRequest | null>(null);

  const [chatState, setChatState] = useState<ChatState>({});
  const [activeResumeText, setActiveResumeText] = useState('');
  const [activeResumeFileName, setActiveResumeFileName] = useState('');
  const [activeJdText, setActiveJdText] = useState('');
  const [activeJdFileName, setActiveJdFileName] = useState('');
  const [stagedFiles, setStagedFiles] = useState<AttachedFile[]>([]);

  const [automateState, setAutomateState] = useState<AutomateState | null>(null);
  const [automateApplying, setAutomateApplying] = useState(false);
  const [automateSuccess, setAutomateSuccess] = useState<string | null>(null);
  const [editingUserMessageId, setEditingUserMessageId] = useState<string | null>(null);
  const [previewStates, setPreviewStates] = useState<Map<string, PreviewState>>(new Map());
  const [messageSections, setMessageSections] = useState<Map<string, ChangedSection[]>>(new Map());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingUploadTypeRef = useRef<'resume' | 'job_description'>('job_description');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  // Load thread state on mount (artifacts + chatState from server + localStorage)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const a = loadPersistedArtifacts(tid);
      if (!cancelled) { setActiveResumeText(a.resumeText); setActiveResumeFileName(a.resumeName); setActiveJdText(a.jdText); setActiveJdFileName(a.jdName); }
      const local = loadPersistedChatState(tid);
      if (!cancelled) setChatState(local);
      try {
        const server = await loadConversationState(tid);
        if (!cancelled && server && Object.keys(server).length > 0) {
          setChatState(server);
          savePersistedChatState(tid, server);
          if (!a.resumeText && server.resume_draft) { setActiveResumeText(server.resume_draft); setActiveResumeFileName('AI draft'); }
          if (!a.jdText && server.active_jd_text) { setActiveJdText(server.active_jd_text); setActiveJdFileName('loaded'); }
        }
      } catch { /* use local */ }
      setStagedFiles([]); setInput(''); setPendingResume(null); setAutomateState(null); setAutomateSuccess(null); setPreviewStates(new Map()); setMessageSections(new Map()); setEditingUserMessageId(null);
    };
    load();
    return () => { cancelled = true; };
  }, [tid]);

  useEffect(() => { savePersistedArtifacts(tid, { resumeText: activeResumeText, resumeName: activeResumeFileName, jdText: activeJdText, jdName: activeJdFileName }); }, [tid, activeResumeText, activeResumeFileName, activeJdText, activeJdFileName]);
  useEffect(() => { if (Object.keys(chatState).length > 0) savePersistedChatState(tid, chatState); }, [tid, chatState]);

  const resizeTextarea = () => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = 'auto'; el.style.height = `${Math.min(Math.max(el.scrollHeight, 44), 280)}px`;
  };
  useEffect(() => { resizeTextarea(); }, [input]);

  // Load messages
  useEffect(() => {
    setMessages([]);
    let cancelled = false;
    const load = async () => {
      try {
        const dbMsgs = await getConversationMessages(tid);
        if (!cancelled && dbMsgs?.length > 0) {
          setMessages(dbMsgs.map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content, timestamp: new Date(m.created_at * 1000), isMarkdown: m.role === 'assistant' })));
          return;
        }
      } catch { /* fall through */ }
      const stored = loadStoredMessages(tid);
      if (stored?.length) { if (!cancelled) setMessages(stored); return; }
      getGreeting()
        .then(({ reply }) => { if (!cancelled) setMessages([{ id: '1', role: 'assistant', content: reply, timestamp: new Date(), isMarkdown: true }]); })
        .catch(() => { if (!cancelled) setMessages([{ id: '1', role: 'assistant', content: "👋 Hi! I'm **RAGA** — your Resume ATS Guidance Assistant.\n\nUpload your resume + JD using **＋**, or paste them directly. I'll analyze automatically — no commands needed! 😊", timestamp: new Date(), isMarkdown: true }]); });
    };
    load();
    return () => { cancelled = true; };
  }, [tid]);

  useEffect(() => {
    if (!messages.length) return;
    saveStoredMessages(tid, messages);
    const firstUser = messages.find((m) => m.role === 'user');
    if (firstUser && onThreadUpdated) {
      const title = firstUser.content.slice(0, 60) || 'New chat';
      onThreadUpdated(tid, { title, preview: firstUser.content.slice(0, 120) });
      updateConversation(tid, { title, preview: firstUser.content.slice(0, 120) }).catch(() => {});
    }
  }, [tid, messages]);

  useEffect(() => {
    if (!showUploadMenu) return;
    const close = (e: MouseEvent) => { if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node)) setShowUploadMenu(false); };
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close);
  }, [showUploadMenu]);

  useEffect(() => {
    if (!showModeDropdown) return;
    const close = (e: MouseEvent) => { if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) setShowModeDropdown(false); };
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close);
  }, [showModeDropdown]);

  const addMsg = (msg: Omit<Message, 'id' | 'timestamp'>) =>
    setMessages((prev) => [...prev, { ...msg, id: (Date.now() + Math.random()).toString(), timestamp: new Date() }]);

  const handleSendMessage = async (contentOverride?: string) => {
    const rawContent = typeof contentOverride === 'string' ? contentOverride : undefined;
    let curResume = activeResumeText, curResumeName = activeResumeFileName;
    let curJd = activeJdText, curJdName = activeJdFileName;
    for (const f of stagedFiles) {
      if (f.kind === 'resume') { curResume = f.text; curResumeName = f.name; }
      else { curJd = f.text; curJdName = f.name; }
    }
    if (curResume !== activeResumeText) { setActiveResumeText(curResume); setActiveResumeFileName(curResumeName); }
    if (curJd !== activeJdText) { setActiveJdText(curJd); setActiveJdFileName(curJdName); }

    const hasArtifacts = (curResume || curJd).trim().length > 0;
    const userContent = (rawContent ?? input.trim()) || (hasArtifacts ? 'Analyze my documents.' : '');
    if ((!userContent && !hasArtifacts) || isLoading) return;

    // If user edited a message: truncate to before that message (remove it + following reply), then send new content so backend gets truncated history
    let baseMessages = messages;
    if (editingUserMessageId) {
      const idx = messages.findIndex((m) => m.id === editingUserMessageId);
      if (idx >= 0) baseMessages = messages.slice(0, idx);
      setEditingUserMessageId(null);
    }

    const attachmentMeta = stagedFiles.map((f) => ({ name: f.name, size: f.size }));
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userContent, timestamp: new Date(), attachments: attachmentMeta.length ? attachmentMeta : undefined };
    const newMessages = [...baseMessages, userMsg];
    setMessages(newMessages);
    if (rawContent === undefined) setInput('');
    setStagedFiles([]);

    // Pending resume flow
    if (pendingResume && (userContent.length < 120 || /^\s*(yes|yeah|yep|ok|sure|generate|rewrite|do it|please)\s*$/i.test(userContent.trim()))) {
      const { resumeText: rText, jdText: jText } = pendingResume;
      setPendingResume(null); setIsLoading(true);
      try {
        const opt = await optimizeResume(rText, jText);
        const secs = Array.isArray(opt?.sections) ? opt.sections : [];
        const lines = ['——— Your optimized resume ———', ''];
        secs.forEach((s: any) => { lines.push(`【 ${s.section_name || 'Section'} 】`); if (s.optimized_content) lines.push(s.optimized_content); lines.push(''); });
        lines.push('Copy this into your resume editor or ask for changes.');
        addMsg({ role: 'assistant', content: lines.join('\n') });
      } catch (e) { console.error(e); toastError('Failed to generate. Try again.'); } finally { setIsLoading(false); }
      return;
    }

    const msgIsJd = looksLikeJdText(userContent);
    const msgIsResume = looksLikeResumeText(userContent) && !msgIsJd;
    if (msgIsJd) { curJd = userContent; setActiveJdText(userContent); setActiveJdFileName('pasted JD'); }
    if (msgIsResume && !curResume) { curResume = userContent; setActiveResumeText(userContent); setActiveResumeFileName('pasted resume'); }

    // CRITICAL FIX: use latest draft for optimizer, not original upload
    const resumeForReq = chatState.resume_draft || curResume.trim();
    const jdForReq = chatState.active_jd_text || curJd.trim();
    const isConvo = isConversationalMessage(userContent);

    const runChat = async (resForReq: string, jdForR: string) => {
      const chatMsgs = newMessages.map((m) => ({ role: m.role, content: m.content }));
      const result = await chatWithHistory(chatMsgs, tid, resForReq || undefined, jdForR || undefined, chatState);
      setChatState(result.chatState);

      // Use backend-detected changed sections (preferred) or fallback to regex
      const backendSections = result.chatState?.changed_sections || [];
      const changed = backendSections.length > 0 ? backendSections : detectChangedSections(result.answer);

      const newMsgId = (Date.now() + Math.random()).toString();
      if (changed.length > 0) {
        setMessageSections((prev) => new Map(prev).set(newMsgId, changed));
      }
      setMessages((prev) => [...prev, {
        id: newMsgId, role: 'assistant',
        content: result.answer, timestamp: new Date(), isMarkdown: true,
        hasChanges: changed.length > 0,
        responseType: result.chatState?.response_type || 'general',
      }]);
    };

    if (isConvo) {
      setIsLoading(true);
      try { await runChat(curResume.trim(), curJd.trim()); }
      catch (e) { console.error(e); toastError('Failed to get reply. Try again.'); }
      finally { setIsLoading(false); }
      return;
    }

    const mode = getAnalysisMode(resumeForReq, jdForReq);
    const candidateName = parseCandidateNameFromResume(curResume) || undefined;

    if (mode === 'BOTH') {
      setIsLoading(true);
      try { const r = await fullAnalysis(resumeForReq, jdForReq, 'middle', candidateName, tid); addMsg({ role: 'assistant', content: r.markdown, isMarkdown: true }); setPendingResume({ resumeText: resumeForReq, jdText: jdForReq }); }
      catch (e) { console.error(e); toastError('Failed to analyze. Try again.'); }
      finally { setIsLoading(false); }
      return;
    }

    if (mode === 'JD_ONLY') {
      setIsLoading(true);
      try {
        const s = await getJdSummary(jdForReq);
        const parts = ["JD received ✅ Upload or paste your **resume** to get the full ATS score.\n\n", `**${s.role_title || 'Role'}**${s.company ? ` at ${s.company}` : ''}`, s.summary ? `\n\n${s.summary}` : '', s.responsibilities.length ? '\n\n**Responsibilities:**\n' + s.responsibilities.slice(0, 8).map((r) => '• ' + r).join('\n') : '', s.must_have_skills.length ? '\n\n**Must-have:** ' + s.must_have_skills.join(', ') : '', s.keywords.length ? '\n\n**ATS Keywords:** ' + s.keywords.join(', ') : ''];
        addMsg({ role: 'assistant', content: parts.join(''), isMarkdown: true });
      } catch (e) { console.error(e); toastError('Failed to get JD summary. Try again.'); }
      finally { setIsLoading(false); }
      return;
    }

    if (mode === 'RESUME_ONLY') {
      setIsLoading(true);
      try {
        const r = await getResumeReview(resumeForReq);
        const bullets = [...r.strengths.map((s) => '✔ ' + s), ...r.gaps.map((g) => '⚠ ' + g), r.top_fixes.length ? '**Top fixes:** ' + r.top_fixes.join('; ') : '', ...r.rewrites.slice(0, 3).map((rw) => `**Before:** ${rw.before}\n**After:** ${rw.after}`)].filter(Boolean);
        addMsg({ role: 'assistant', content: "Resume received ✅ Paste or upload a **job description** to get the full ATS score.\n\n" + bullets.join('\n\n'), isMarkdown: true });
      } catch (e) { console.error(e); toastError('Failed to get resume review. Try again.'); }
      finally { setIsLoading(false); }
      return;
    }

    setIsLoading(true);
    try { await runChat(resumeForReq, jdForReq); }
    catch (e) { console.error(e); toastError('Failed to get reply. Try again.'); }
    finally { setIsLoading(false); }
  };

  const addStagedFile = (entry: AttachedFile) => setStagedFiles((prev) => prev.length >= MAX_ATTACHED_FILES ? (toastError(`Max ${MAX_ATTACHED_FILES} files.`), prev) : [...prev, entry]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { toastError(`File must be ≤ 1 MB.`); e.target.value = ''; return; }
    const kind = pendingUploadTypeRef.current === 'resume' ? 'resume' : 'job_description';
    setShowUploadMenu(false);
    const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const clear = () => { if (fileInputRef.current) fileInputRef.current.value = ''; if (resumeFileInputRef.current) resumeFileInputRef.current.value = ''; };
    try {
      const result = await uploadDocument(file, kind);
      const text = result.extracted_text_preview || result.text || '';
      if (typeof text === 'string' && text.trim()) { addStagedFile({ id, kind, name: file.name, size: sizeStr, charCount: text.trim().length, text: text.trim() }); toastFileAttached(`${kind === 'resume' ? 'Resume' : 'JD'}: ${file.name} — ready to send`); }
      else if (result.document_id) { const { text: t } = await getDocumentText(result.document_id); if (t?.trim()) { addStagedFile({ id, kind, name: file.name, size: sizeStr, charCount: t.trim().length, text: t.trim() }); toastFileAttached(`${kind === 'resume' ? 'Resume' : 'JD'}: ${file.name} — ready to send`); } else toastError('No text extracted. Try PDF or TXT.'); }
      else toastError('Text extraction failed. Try PDF or TXT.');
    } catch (err) { console.error(err); toastError('Could not read file.'); } finally { clear(); }
  };

  const clearActiveResume = () => { setActiveResumeText(''); setActiveResumeFileName(''); setChatState((p) => ({ ...p, resume_draft: '', original_resume: '' })); addMsg({ role: 'assistant', content: "Resume cleared. Upload or paste a new resume whenever you're ready.", isMarkdown: true }); };
  const clearActiveJd = () => { setActiveJdText(''); setActiveJdFileName(''); setChatState((p) => ({ ...p, active_jd_text: '' })); addMsg({ role: 'assistant', content: "JD cleared. Paste or upload a new JD whenever you're ready.", isMarkdown: true }); };

  // ── AUTOMATE ────────────────────────────────────────────────────────────────
  const handleAutomateClick = (messageId: string, content: string) => {
    // If already showing automate panel for this message → close
    if (automateState?.messageId === messageId && automateState?.step !== 'done') {
      setAutomateState(null);
      return;
    }
    // Get changed sections from backend (stored per message) OR fallback to regex
    const backendSections = messageSections.get(messageId) || [];
    const changed = backendSections.length > 0 ? backendSections : detectChangedSections(content);
    if (!changed.length) {
      toastError('No resume changes detected in this message. Try asking RAGA to optimize your resume first.');
      return;
    }
    setAutomateState({ messageId, changedSections: changed, selectedResumeId: null, selectedVersionId: null, selectedSectionKeys: [], step: 'select-resume' });
    setAutomateSuccess(null);
  };

  const handleAutomateResumeSelect = (resumeId: string, versionId: string) => {
    setAutomateState((p) => p ? { ...p, selectedResumeId: resumeId, selectedVersionId: versionId, step: 'select-sections', isNewResume: false } : null);
  };

  const handleCreateNewResume = () => {
    // Create a new "AI-Resume" and skip to section selection with ALL sections pre-selected
    const newResumeId = store.createResume({ name: 'AI-Resume', role: 'AI Generated' });
    // Need to read from store directly after creation
    const allVersions = useStore.getState().versions;
    const newVersion = allVersions.find((v) => v.resumeId === newResumeId);
    if (!newVersion) { toastError('Failed to create new resume.'); return; }
    setAutomateState((p) => p ? {
      ...p,
      selectedResumeId: newResumeId,
      selectedVersionId: newVersion.id,
      step: 'select-sections',
      isNewResume: true,
      // Auto-select all detected sections
      selectedSectionKeys: p.changedSections.map((s) => s.key),
    } : null);
  };

  const toggleSection = (key: string) => setAutomateState((p) => {
    if (!p) return null;
    const has = p.selectedSectionKeys.includes(key);
    return { ...p, selectedSectionKeys: has ? p.selectedSectionKeys.filter((k) => k !== key) : [...p.selectedSectionKeys, key] };
  });

  const handleAutomateApply = async () => {
    if (!automateState?.selectedVersionId || !automateState.selectedSectionKeys.length) return;
    setAutomateApplying(true);
    try {
      // Always read latest version from store (may have just been created)
      const getVersion = () => useStore.getState().versions.find((v) => v.id === automateState.selectedVersionId);
      const version = getVersion();
      if (!version) throw new Error('Version not found');

      const SECTION_TYPE_MAP: Record<string, string> = {
        summary: 'summary', experience: 'experience', skills: 'skills',
        projects: 'projects', education: 'education',
        certifications: 'awards', achievements: 'achievements',
        languages: 'languages',
      };

      for (const key of automateState.selectedSectionKeys) {
        const sec = automateState.changedSections.find((s) => s.key === key);
        if (!sec) continue;

        const targetType = SECTION_TYPE_MAP[key] || key;

        // Get the latest version each iteration (addSection mutates store)
        const latestVersion = getVersion();
        if (!latestVersion) continue;

        let storeSec = latestVersion.sections.find((s) => s.type === targetType);

        // Section doesn't exist → create it via store.addSection (works for both new and existing resumes)
        if (!storeSec) {
          const emptyContent: Record<string, any> =
            key === 'summary'    ? { text: '' } :
            key === 'experience' ? { roles: [] } :
            key === 'skills'     ? { groups: [] } :
            key === 'projects'   ? { projects: [] } :
            key === 'education'  ? { schools: [] } :
            { text: '' };

          store.addSection(automateState.selectedVersionId, {
            type: targetType as any,
            title: sec.label,
            visible: true,
            content: emptyContent,
          });

          // Re-read after addSection
          const after = getVersion();
          storeSec = after?.sections.find((s) => s.type === targetType);
          if (!storeSec) continue; // shouldn't happen
        }

        // ── Apply content by section type ─────────────────────────────────
        if (key === 'summary') {
          // Clean markdown headers/formatting from summary text
          const text = sec.content
            .replace(/^#+\s*/gm, '')
            .replace(/\*\*/g, '')
            .trim()
            .slice(0, 800);
          store.updateSectionContent(automateState.selectedVersionId, storeSec.id, { text });

        } else if (key === 'skills') {
          // Parse skill lines — handle both "Group: item1, item2" and "• item" formats
          const rawLines = sec.content.split('\n').map((l) => l.trim()).filter(Boolean);
          const groups: Array<{ id: string; heading: string; items: string[] }> = [];
          let currentGroup: { id: string; heading: string; items: string[] } | null = null;

          for (const line of rawLines) {
            // Check for "Group Name: item1, item2" pattern
            const groupMatch = line.match(/^\*?\*?([^:•\-*]+?)\*?\*?:\s*(.+)$/);
            if (groupMatch && !line.startsWith('•') && !line.startsWith('-')) {
              const heading = groupMatch[1].trim();
              const items = groupMatch[2].split(/[,•]/).map((s) => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
              groups.push({ id: `sg-${Date.now()}-${groups.length}`, heading, items });
              currentGroup = null;
            } else {
              // Plain bullet line
              const item = line.replace(/^[•\-\*]\s*/, '').trim();
              if (item && item.length > 1) {
                if (!currentGroup) {
                  currentGroup = { id: `sg-${Date.now()}-misc`, heading: 'Skills', items: [] };
                  groups.push(currentGroup);
                }
                currentGroup.items.push(item);
              }
            }
          }

          // If no groups parsed, fall back to single group
          if (!groups.length) {
            const items = rawLines
              .map((l) => l.replace(/^[•\-\*]\s*/, '').replace(/^#+\s*/, '').trim())
              .filter((l) => l && l.length > 1 && l.length < 80);
            groups.push({ id: `sg-${Date.now()}`, heading: 'Skills', items: items.slice(0, 25) });
          }

          // Preserve existing groups if they exist, just update items
          const existing = storeSec.content;
          const existingGroups = (existing.groups || []) as any[];
          let finalGroups;
          if (existingGroups.length > 0 && groups.length > 0) {
            // Merge: update existing group items with new content
            if (groups.length >= existingGroups.length) {
              finalGroups = existingGroups.map((eg: any, i: number) =>
                i < groups.length ? { ...eg, items: groups[i].items } : eg
              );
            } else {
              finalGroups = groups.map((g, i) =>
                i < existingGroups.length ? { ...existingGroups[i], items: g.items } : g
              );
            }
          } else {
            finalGroups = groups;
          }
          store.updateSectionContent(automateState.selectedVersionId, storeSec.id, { groups: finalGroups });

        } else if (key === 'experience') {
          const lines = sec.content.split('\n');
          // Extract bullets (lines starting with • - *)
          const bullets = lines
            .filter((l) => /^[•\-\*]/.test(l.trim()))
            .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
            .filter((l) => l && l.length > 5)
            .slice(0, 8);

          // Try to extract title/company from first non-bullet line
          const titleLine = lines.find((l) => l.trim() && !/^[•\-\*]/.test(l.trim()) && !/^#+/.test(l.trim()));
          const titleParts = titleLine?.split(/[|,–—@]/).map((s) => s.trim()).filter(Boolean) || [];

          const existing = storeSec.content;
          const roles = (existing.roles || []) as any[];

          if (roles.length > 0 && bullets.length > 0) {
            // Update first role's bullets
            const updated = {
              ...existing,
              roles: roles.map((exp: any, i: number) => i === 0 ? { ...exp, bullets } : exp),
            };
            store.updateSectionContent(automateState.selectedVersionId, storeSec.id, updated);
          } else {
            // Create new role entry
            store.updateSectionContent(automateState.selectedVersionId, storeSec.id, {
              roles: [{
                id: `exp-${Date.now()}`,
                company: titleParts[1] || 'Company',
                title: titleParts[0] || 'Role',
                location: titleParts[2] || '',
                startDate: '',
                endDate: 'Present',
                bullets: bullets.length > 0 ? bullets : [sec.content.slice(0, 200)],
                tech: [],
              }],
            });
          }

        } else if (key === 'projects') {
          const lines = sec.content.split('\n').filter((l) => l.trim());
          const existing = storeSec.content;
          const projects = (existing.projects || []) as any[];

          // Parse individual projects — each project block starts with a non-bullet line
          const projectBlocks: Array<{ name: string; bullets: string[] }> = [];
          let currentProject: { name: string; bullets: string[] } | null = null;
          for (const line of lines) {
            if (/^[•\-\*]/.test(line.trim())) {
              if (currentProject) currentProject.bullets.push(line.replace(/^[•\-\*]\s*/, '').trim());
            } else if (line.trim() && !/^#+/.test(line)) {
              currentProject = { name: line.replace(/\*\*/g, '').trim(), bullets: [] };
              projectBlocks.push(currentProject);
            }
          }

          if (projects.length > 0 && projectBlocks.length > 0) {
            // Update existing project bullets
            const updated = {
              ...existing,
              projects: projects.map((p: any, i: number) =>
                i < projectBlocks.length
                  ? { ...p, bullets: projectBlocks[i].bullets.slice(0, 6) }
                  : p
              ),
            };
            store.updateSectionContent(automateState.selectedVersionId, storeSec.id, updated);
          } else if (projectBlocks.length > 0) {
            store.updateSectionContent(automateState.selectedVersionId, storeSec.id, {
              projects: projectBlocks.map((pb, i) => ({
                id: `proj-${Date.now()}-${i}`,
                name: pb.name,
                role: '', startDate: '', endDate: '', techStack: [], link: '',
                bullets: pb.bullets.slice(0, 6),
              })),
            });
          } else {
            // Fallback: all lines as bullets for first project
            const bullets = lines.filter((l) => /^[•\-\*]/.test(l.trim())).map((l) => l.replace(/^[•\-\*]\s*/, '').trim());
            if (bullets.length > 0) {
              if (projects.length > 0) {
                store.updateSectionContent(automateState.selectedVersionId, storeSec.id, {
                  projects: projects.map((p: any, i: number) => i === 0 ? { ...p, bullets: bullets.slice(0, 6) } : p),
                });
              } else {
                store.updateSectionContent(automateState.selectedVersionId, storeSec.id, {
                  projects: [{ id: `proj-${Date.now()}`, name: 'Project', role: '', startDate: '', endDate: '', techStack: [], link: '', bullets: bullets.slice(0, 6) }],
                });
              }
            }
          }

        } else if (key === 'education') {
          const lines = sec.content.split('\n').filter((l) => l.trim() && !/^[•\-\*]/.test(l.trim()));
          const existing = storeSec.content;
          const schools = (existing.schools || []) as any[];
          // Try to extract degree/school from lines
          const degreeLine = lines[0] || '';
          const schoolLine = lines[1] || '';

          if (schools.length > 0) {
            store.updateSectionContent(automateState.selectedVersionId, storeSec.id, {
              schools: schools.map((s: any, i: number) =>
                i === 0 ? { ...s, degree: degreeLine || s.degree, school: schoolLine || s.school } : s
              ),
            });
          } else {
            store.updateSectionContent(automateState.selectedVersionId, storeSec.id, {
              schools: [{
                id: `edu-${Date.now()}`,
                school: schoolLine || 'University',
                degree: degreeLine || 'Degree',
                field: '', startDate: '', endDate: '', grade: '', location: '',
              }],
            });
          }

        } else {
          // Generic sections (certifications, achievements, languages)
          const text = sec.content.replace(/^#+\s*/gm, '').trim().slice(0, 800);
          store.updateSectionContent(automateState.selectedVersionId, storeSec.id, { text });
        }
      }

      const resumeName = store.resumes.find((r) => r.id === automateState.selectedResumeId)?.name || 'resume';
      const count = automateState.selectedSectionKeys.length;
      setAutomateSuccess(`✅ Pasted to "${resumeName}" — ${count} section${count !== 1 ? 's' : ''} updated successfully!`);
      // Keep panel open but reset to 'done' — user can reuse by clicking Automate again
      setAutomateState((p) => p ? { ...p, step: 'done' } : null);
    } catch (e) {
      console.error(e);
      toastError('Failed to apply changes. Please try manually.');
    } finally {
      setAutomateApplying(false);
    }
  };

  // ── PREVIEW (inline per-message) ─────────────────────────────────────────
  const handlePreviewClick = (messageId: string) => {
    setPreviewStates((prev) => {
      const cur = prev.get(messageId);
      if (!cur) {
        // Start: show resume picker
        return new Map(prev).set(messageId, { resumeId: null, open: true, pickingResume: true });
      }
      if (cur.pickingResume) {
        // Close picker
        return new Map(prev).set(messageId, { ...cur, open: false, pickingResume: false });
      }
      // Toggle collapse
      return new Map(prev).set(messageId, { ...cur, open: !cur.open });
    });
  };

  const handlePreviewResumeSelect = (messageId: string, resumeId: string) => {
    setPreviewStates((prev) => new Map(prev).set(messageId, { resumeId, open: true, pickingResume: false }));
  };

  const hasActiveResume = activeResumeText.trim().length > 0 || (chatState.resume_draft || '').trim().length > 0;
  const hasActiveJd = activeJdText.trim().length > 0 || (chatState.active_jd_text || '').trim().length > 0;
  const displayResumeName = activeResumeFileName || (chatState.resume_draft ? 'AI draft' : '');
  const displayJdName = activeJdFileName || (chatState.active_jd_text ? 'loaded' : '');

  const sidePanel = automateState && automateState.step !== 'done';

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* MAIN CHAT */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Artifact banner */}
        {(hasActiveResume || hasActiveJd) && (
          <div className="border-b border-border bg-muted/30 px-4 py-2 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium mr-1">Active context:</span>
            {hasActiveResume && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-xs px-3 py-1">
                <CheckCircle2 className="w-3 h-3" />Resume: {displayResumeName || 'uploaded'}
                <button type="button" onClick={clearActiveResume} className="ml-1 hover:text-destructive" title="Remove"><X className="w-3 h-3" /></button>
              </span>
            )}
            {hasActiveJd && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-700 dark:text-violet-400 text-xs px-3 py-1">
                <CheckCircle2 className="w-3 h-3" />JD: {displayJdName || 'uploaded'}
                <button type="button" onClick={clearActiveJd} className="ml-1 hover:text-destructive" title="Remove"><X className="w-3 h-3" /></button>
              </span>
            )}
            {atsMode !== 'HONEST' && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${atsMode === 'AGGRESSIVE' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}>
                {atsMode} mode
              </span>
            )}
          </div>
        )}

        {automateSuccess && (
          <div className="border-b border-green-500/40 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-green-800 dark:text-green-300">{automateSuccess}</span>
            </div>
            <button type="button" onClick={() => setAutomateSuccess(null)} className="p-1 rounded text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 shrink-0 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message, messageIndex) => (
              <div key={message.id} className={`group/msg flex gap-3 ${message.role === 'user' ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-sm ${message.role === 'user' ? 'bg-primary border-primary/30 text-primary-foreground' : 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/25 text-primary'}`}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`flex flex-col gap-1 min-w-0 ${message.role === 'user' ? 'max-w-[85%]' : 'max-w-full'}`}>
                  <div className={
                    message.role === 'user'
                      ? 'px-4 py-3 rounded-2xl break-words bg-primary text-primary-foreground rounded-br-md rounded-tl-md shadow-md'
                      : 'w-full rounded-2xl rounded-tl-md rounded-br-2xl overflow-hidden shadow-lg border border-border/60 bg-gradient-to-br from-card via-card to-muted/20'
                  }>
                    {message.role === 'assistant' && (
                      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/50" aria-hidden />
                    )}
                    <div className={message.role === 'assistant' ? 'px-5 py-4' : 'px-4 py-3'}>
                    {message.isMarkdown ? (
                      <RagaResponseCard
                        content={message.content}
                        responseType={toResponseType(message.responseType)}
                      />
                    ) : (
                      <p className={`whitespace-pre-line break-words ${message.role === 'user' ? 'text-sm' : 'text-[15px] leading-relaxed text-foreground'}`}>{message.content}</p>
                    )}
                    {message.attachments && (
                      <div className="mt-2 pt-2 border-t border-current/20 space-y-1">
                        {message.attachments.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs"><FileText className="w-3 h-3" /><span>{f.name}</span><span className="opacity-60">({f.size})</span></div>
                        ))}
                      </div>
                    )}
                    </div>
                  </div>

                  {message.role === 'assistant' && messageIndex > 0 && (
                    <div className="flex items-center gap-1.5 px-1 mt-1.5 flex-wrap">
                      <button type="button" onClick={() => navigator?.clipboard?.writeText(message.content)} className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-medium bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => setMessages((p) => { const n = p.filter((m) => m.id !== message.id); saveStoredMessages(tid, n); return n; })} className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-medium bg-muted/70 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border border-transparent hover:border-destructive/30" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      {message.hasChanges && (
                        <>
                          {/* Automate — always available, unlimited */}
                          <button
                            type="button"
                            onClick={() => handleAutomateClick(message.id, message.content)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm ${
                              automateState?.messageId === message.id && automateState?.step !== 'done'
                                ? 'bg-violet-700 text-white ring-2 ring-violet-400'
                                : 'bg-violet-600 hover:bg-violet-700 text-white'
                            }`}
                            title="Automate — paste AI suggestions into your resume">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Automate</span>
                          </button>
                          {/* Preview — inline resume picker */}
                          <button
                            type="button"
                            onClick={() => handlePreviewClick(message.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              previewStates.has(message.id) && previewStates.get(message.id)?.open
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-muted text-foreground border-border'
                            }`}
                            title="Preview a resume inline">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {message.role === 'user' && (
                    <div className="flex items-center gap-1.5 px-1 justify-end flex-row-reverse flex-wrap">
                      <button type="button" onClick={() => { setEditingUserMessageId(message.id); setInput(message.content); textareaRef.current?.focus(); }} className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-medium bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => handleSendMessage(message.content)} className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-medium bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Resend"><RotateCw className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground px-1" suppressHydrationWarning>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>

                  {/* ── INLINE PREVIEW for this message ── */}
                  {(() => {
                    const ps = previewStates.get(message.id);
                    if (!ps) return null;

                    // Resume picker mode
                    if (ps.pickingResume) {
                      return (
                        <div className="mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden w-full max-w-sm">
                          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                            <span className="text-xs font-semibold flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-primary" />Pick a resume to preview</span>
                            <button type="button" onClick={() => setPreviewStates((prev) => { const n = new Map(prev); n.delete(message.id); return n; })} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                            {store.resumes.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-3">No resumes yet. Create one in the editor.</p>
                            ) : (
                              store.resumes.map((resume) => {
                                const vers = store.versions.filter((v) => v.resumeId === resume.id);
                                return vers.map((ver) => (
                                  <button key={ver.id} type="button"
                                    onClick={() => handlePreviewResumeSelect(message.id, resume.id)}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted/70 border border-transparent hover:border-border flex items-center justify-between">
                                    <span className="font-medium truncate">{resume.name}</span>
                                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{ver.name}</span>
                                  </button>
                                ));
                              })
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Preview mode — show resume
                    const selectedResume = store.resumes.find((r) => r.id === ps.resumeId);
                    const selectedVersion = store.versions.find((v) => v.resumeId === ps.resumeId);
                    if (!selectedVersion) return null;

                    return (
                      <div className="mt-2 rounded-xl border border-border shadow-lg overflow-hidden w-full">
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                          <span className="text-xs font-semibold flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            Preview: {selectedResume?.name || 'Resume'}
                          </span>
                          <div className="flex items-center gap-1">
                            {/* Change resume */}
                            <button type="button" onClick={() => setPreviewStates((prev) => new Map(prev).set(message.id, { resumeId: null, open: true, pickingResume: true }))} className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted">Change</button>
                            {/* Collapse toggle */}
                            <button type="button" onClick={() => setPreviewStates((prev) => { const cur = prev.get(message.id); if (!cur) return prev; return new Map(prev).set(message.id, { ...cur, open: !cur.open }); })} className="p-1 rounded hover:bg-muted text-muted-foreground">
                              {ps.open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {/* Close */}
                            <button type="button" onClick={() => setPreviewStates((prev) => { const n = new Map(prev); n.delete(message.id); return n; })} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {ps.open && (
                          <div className="overflow-auto max-h-[600px] bg-[#e8e5e0] flex items-start justify-center py-4 px-2">
                            <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', marginBottom: '-28%' }}>
                              <ResumePreview version={selectedVersion} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-sm bg-gradient-to-br from-primary/15 to-primary/5 border-primary/25 text-primary"><Bot className="w-4 h-4" /></div>
                <div className="rounded-2xl rounded-tl-md rounded-br-2xl overflow-hidden shadow-lg border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 px-5 py-4 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="max-w-3xl mx-auto p-4">
            {stagedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {stagedFiles.map((f) => (
                  <div key={f.id} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm">
                    <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium truncate max-w-[14rem]">{f.kind === 'resume' ? '📄 Resume' : '📋 JD'}: {f.name}</span>
                    <span className="text-xs text-muted-foreground">({f.charCount.toLocaleString()} chars)</span>
                    <button type="button" onClick={() => setStagedFiles((p) => p.filter((x) => x.id !== f.id))} className="ml-0.5 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-0 bg-background border border-input rounded-[1.75rem] shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent min-h-[52px] relative">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt" className="hidden" />
              <input type="file" ref={resumeFileInputRef} onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt" className="hidden" />

              <div className="relative" ref={uploadMenuRef}>
                <button type="button" onClick={() => setShowUploadMenu((v) => !v)} className="flex items-center justify-center w-12 h-12 shrink-0 text-muted-foreground hover:text-foreground rounded-l-[1.75rem] transition-colors" title="Upload file">
                  <Plus className="w-5 h-5" strokeWidth={2} />
                </button>
                {showUploadMenu && (
                  <div className="absolute bottom-full left-0 mb-1 z-50 w-56 rounded-xl border border-border bg-card shadow-xl p-2 space-y-1">
                    <button type="button" onClick={() => { pendingUploadTypeRef.current = 'job_description'; setShowUploadMenu(false); fileInputRef.current?.click(); }} className="w-full rounded-lg border border-border bg-muted/50 hover:bg-muted px-3 py-2 text-sm flex items-center gap-2 font-medium"><FileText className="w-4 h-4 shrink-0" />Upload Job Description</button>
                    <button type="button" onClick={() => { pendingUploadTypeRef.current = 'resume'; setShowUploadMenu(false); resumeFileInputRef.current?.click(); }} className="w-full rounded-lg border border-border bg-muted/50 hover:bg-muted px-3 py-2 text-sm flex items-center gap-2 font-medium"><FileText className="w-4 h-4 shrink-0" />Upload Resume</button>
                  </div>
                )}
              </div>

              <textarea ref={textareaRef} value={input} onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={hasActiveResume && hasActiveJd ? 'Ask about your resume and JD…' : hasActiveResume ? 'Resume loaded ✅ — upload a JD to get ATS score, or ask anything…' : hasActiveJd ? 'JD loaded ✅ — upload your resume to get ATS score, or ask anything…' : 'Type a message, or paste / upload your resume and job description…'}
                className="flex-1 min-h-[44px] max-h-[280px] py-3 px-2 border-0 bg-transparent resize-none focus:outline-none text-base placeholder:text-muted-foreground overflow-hidden" rows={1} style={{ height: 44 }} />

              <div className="relative shrink-0 mr-1 mb-1.5" ref={modeDropdownRef}>
                <button type="button" onClick={() => setShowModeDropdown((v) => !v)} className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium bg-muted/60 hover:bg-muted text-foreground border border-border/50 min-w-[5rem]">
                  <span>{ATS_MODE_SHORT[atsMode]}</span><ChevronDown className="w-4 h-4 shrink-0 opacity-70" />
                </button>
                {showModeDropdown && (
                  <><div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowModeDropdown(false)} />
                  <div className="absolute right-0 bottom-full mb-1 z-50 min-w-[8rem] rounded-xl border border-border bg-card shadow-xl py-1">
                    {(['HONEST', 'KEYWORD', 'AGGRESSIVE'] as const).map((m) => (
                      <button key={m} type="button" onClick={() => { saveAtsMode(m); setAtsMode(m); setShowModeDropdown(false); }} className={`w-full text-left px-3 py-2 text-sm ${atsMode === m ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/60 text-foreground'}`}>{ATS_MODE_SHORT[m]}</button>
                    ))}
                  </div></>
                )}
              </div>

              <button type="button" onClick={() => handleSendMessage()} disabled={(!input.trim() && !stagedFiles.length && !hasActiveResume && !hasActiveJd) || isLoading}
                className="flex items-center justify-center w-10 h-10 shrink-0 mr-2 mb-1.5 rounded-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:pointer-events-none transition-colors" title="Send">
                <Send className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── AUTOMATE SIDE PANEL ── */}
      {automateState && automateState.step !== 'done' && (
        <div className="w-[380px] shrink-0 border-l border-border flex flex-col bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-violet-50 to-background dark:from-violet-950/20">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {automateState.step === 'select-resume' ? 'Select Resume' : 'Select Sections'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {automateState.step === 'select-resume' ? 'Step 1 of 2' : 'Step 2 of 2'}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setAutomateState(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">

            {/* ── STEP 1: Select Resume ── */}
            {automateState.step === 'select-resume' && (
              <>
                <p className="text-xs text-muted-foreground pb-1">
                  Choose which resume to update with RAGA's AI suggestions.
                </p>

                {/* Existing resumes */}
                {store.resumes.length > 0 && store.resumes.map((resume) => {
                  const versions = store.versions.filter((v) => v.resumeId === resume.id);
                  return (
                    <div key={resume.id} className="border border-border rounded-xl overflow-hidden">
                      <div className="px-3 py-2 bg-muted/50 border-b border-border">
                        <p className="text-xs font-semibold">{resume.name}</p>
                        <p className="text-xs text-muted-foreground">{resume.role || 'General'}</p>
                      </div>
                      {versions.map((v) => (
                        <button key={v.id} type="button" onClick={() => handleAutomateResumeSelect(resume.id, v.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors group">
                          <span className="text-foreground">{v.name}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-600 transition-colors" />
                        </button>
                      ))}
                    </div>
                  );
                })}

                {/* Create AI-Resume option */}
                <button
                  type="button"
                  onClick={handleCreateNewResume}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-violet-400/60 hover:border-violet-500 bg-violet-50/50 dark:bg-violet-950/10 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-700 transition-colors">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-violet-700 dark:text-violet-400">Create AI-Resume</p>
                    <p className="text-xs text-muted-foreground">Start a new resume from scratch with AI suggestions</p>
                  </div>
                </button>

                {store.resumes.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    No existing resumes — create one above or in the Editor.
                  </p>
                )}
              </>
            )}

            {/* ── STEP 2: Select Sections ── */}
            {automateState.step === 'select-sections' && (
              <>
                {/* Resume badge */}
                <div className="flex items-center gap-2 pb-1">
                  <div className="flex-1 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs font-medium truncate">
                      {automateState.isNewResume ? '✨ New AI-Resume' : store.resumes.find((r) => r.id === automateState.selectedResumeId)?.name || 'Resume'}
                    </p>
                  </div>
                  <button type="button"
                    onClick={() => setAutomateState((p) => p ? { ...p, step: 'select-resume', selectedResumeId: null, selectedVersionId: null } : null)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted">
                    Change
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Select which sections to paste into your resume:
                </p>

                {/* Select/Deselect All */}
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => setAutomateState((p) => p ? { ...p, selectedSectionKeys: p.changedSections.map((s) => s.key) } : null)}
                    className="flex-1 text-xs py-1 rounded-lg border border-border hover:bg-muted text-muted-foreground">
                    Select All
                  </button>
                  <button type="button"
                    onClick={() => setAutomateState((p) => p ? { ...p, selectedSectionKeys: [] } : null)}
                    className="flex-1 text-xs py-1 rounded-lg border border-border hover:bg-muted text-muted-foreground">
                    Clear All
                  </button>
                </div>

                {/* Section checkboxes */}
                {automateState.changedSections.map((sec) => {
                  const selected = automateState.selectedSectionKeys.includes(sec.key);
                  return (
                    <button key={sec.key} type="button" onClick={() => toggleSection(sec.key)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? 'border-violet-500/60 bg-violet-50 dark:bg-violet-950/20 shadow-sm'
                          : 'border-border hover:bg-muted/50'
                      }`}>
                      <div className={`w-5 h-5 rounded-md border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                        selected ? 'border-violet-600 bg-violet-600' : 'border-muted-foreground/50'
                      }`}>
                        {selected && <span className="text-white text-xs leading-none font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{sec.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{sec.content.slice(0, 120)}{sec.content.length > 120 ? '…' : ''}</p>
                      </div>
                    </button>
                  );
                })}

                {automateState.changedSections.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No changed sections detected.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer with Apply button */}
          {automateState.step === 'select-sections' && (
            <div className="p-4 border-t border-border space-y-2">
              <button type="button" onClick={handleAutomateApply}
                disabled={automateState.selectedSectionKeys.length === 0 || automateApplying}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-semibold shadow-md transition-all">
                {automateApplying
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Pasting…</>
                  : <><Zap className="w-4 h-4" />Paste {automateState.selectedSectionKeys.length > 0 ? `${automateState.selectedSectionKeys.length} section${automateState.selectedSectionKeys.length > 1 ? 's' : ''}` : 'changes'}</>
                }
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
