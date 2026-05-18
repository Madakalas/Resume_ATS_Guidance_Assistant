'use client';

/**
 * raga-response-card.tsx — Rich Response Cards for RAGA AI Mode
 *
 * Instead of a single plain markdown blob, RAGA responses are rendered
 * as typed cards with visual hierarchy, color coding, and UI elements.
 *
 * Card types:
 *  - ats_score     → Score ring + layer bars + table
 *  - optimize      → Change table + score delta + mode badge
 *  - salary        → Salary band table by company type
 *  - score_advisor → Ceiling card + roadmap timeline
 *  - interview     → Question list with category tags
 *  - career        → Career path card
 *  - general       → Standard markdown (current behavior)
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TrendingUp, Target, DollarSign, Brain, Briefcase, BarChart3, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
export type ResponseType = 'ats_score' | 'optimize' | 'salary' | 'score_advisor' | 'interview' | 'career' | 'general';

interface RagaResponseCardProps {
  content: string;
  responseType: ResponseType;
}

// ── Score extraction ───────────────────────────────────────────────────────────
function extractFinalScore(content: string): number | null {
  const m = content.match(/FINAL ATS SCORE[:\s]+(\d+)\s*\/\s*100/i)
    || content.match(/Estimated New ATS Score[:\s]+(\d+)/i)
    || content.match(/Score[:\s]+(\d+)\s*\/\s*100/i)
    || content.match(/\b(\d{2,3})\s*\/\s*100\b/);
  return m ? parseInt(m[1]) : null;
}

function extractScoreDelta(content: string): { from: number; to: number } | null {
  const m = content.match(/up from (\d+)\/100.*?(\d+)\/100/i)
    || content.match(/(\d+)\/100.*?→.*?(\d+)\/100/i)
    || content.match(/from (\d+).*?to (\d+)/i);
  return m ? { from: parseInt(m[1]), to: parseInt(m[2]) } : null;
}

function extractMode(content: string): string {
  if (/aggressive mode/i.test(content)) return 'AGGRESSIVE';
  if (/keyword.optimized/i.test(content)) return 'KEYWORD';
  return 'HONEST';
}

function extractLayerScores(content: string): Array<{ name: string; score: number; weight: string; color: string }> {
  const layers = [
    { key: 'Hard Constraint', label: 'Hard Constraints', weight: '25%', color: 'blue' },
    { key: 'Skill Match', label: 'Skill Match', weight: '20%', color: 'blue' },
    { key: 'Impact', label: 'Impact / Achievement', weight: '15%', color: 'yellow' },
    { key: 'Experience', label: 'Experience Relevance', weight: '15%', color: 'yellow' },
    { key: 'Ownership', label: 'Ownership Depth', weight: '15%', color: 'green' },
    { key: 'Formatting', label: 'Formatting', weight: '5%', color: 'green' },
  ];
  const results: Array<{ name: string; score: number; weight: string; color: string }> = [];
  for (const layer of layers) {
    const m = content.match(new RegExp(layer.key + '[^\\d]*(\\d+)\\s*\\/\\s*100', 'i'));
    if (m) results.push({ name: layer.label, score: parseInt(m[1]), weight: layer.weight, color: layer.color });
  }
  return results;
}

// ── Score ring component ───────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const dash = pct * circ;
  const color = score >= 80 ? '#22c55e' : score >= 65 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Strong' : score >= 65 ? 'Good' : 'Needs Work';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/30" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="64" y="60" textAnchor="middle" fontSize="26" fontWeight="700" fill={color}>{score}</text>
        <text x="64" y="78" textAnchor="middle" fontSize="11" fill="currentColor" className="opacity-60">/100</text>
      </svg>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color, backgroundColor: color + '18' }}>{label}</span>
    </div>
  );
}

// ── Layer bar ──────────────────────────────────────────────────────────────────
function LayerBar({ name, score, weight, color }: { name: string; score: number; weight: string; color: string }) {
  const barColor = color === 'blue' ? '#3b82f6' : color === 'yellow' ? '#f59e0b' : '#22c55e';
  const textColor = color === 'blue' ? 'text-violet-600' : color === 'yellow' ? 'text-yellow-600' : 'text-green-600';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-foreground font-medium">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{weight}</span>
          <span className={`font-bold ${textColor}`}>{score}</span>
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}

// ── Score delta badge ──────────────────────────────────────────────────────────
function ScoreDelta({ from, to }: { from: number; to: number }) {
  const delta = to - from;
  return (
    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
      <div className="text-center">
        <div className="text-2xl font-bold text-muted-foreground">{from}</div>
        <div className="text-xs text-muted-foreground">Before</div>
      </div>
      <div className="flex-1 flex items-center gap-1">
        <div className="flex-1 h-0.5 bg-green-500/40" />
        <span className="text-green-600 font-bold text-sm">+{delta} pts</span>
        <div className="flex-1 h-0.5 bg-green-500/40" />
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{to}</div>
        <div className="text-xs text-muted-foreground">After</div>
      </div>
    </div>
  );
}

// ── Mode badge ─────────────────────────────────────────────────────────────────
function ModeBadge({ mode }: { mode: string }) {
  const styles: Record<string, string> = {
    HONEST: 'bg-green-500/10 text-green-700 border-green-500/30',
    KEYWORD: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30',
    AGGRESSIVE: 'bg-red-500/10 text-red-700 border-red-500/30',
  };
  const icons: Record<string, string> = { HONEST: '🟢', KEYWORD: '🟡', AGGRESSIVE: '🔴' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[mode] || styles.HONEST}`}>
      {icons[mode]} {mode} Mode
    </span>
  );
}

// ── Salary band extractor ──────────────────────────────────────────────────────
interface SalaryBand { type: string; range: string; note: string }
function extractSalaryBands(content: string): SalaryBand[] {
  const bands: SalaryBand[] = [];
  const rows = content.match(/\|\s*([^|]+)\s*\|\s*([^|]+LPA[^|]*)\s*\|\s*([^|]*)\s*\|/gi) || [];
  for (const row of rows) {
    const parts = row.split('|').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2 && /LPA|lpa/i.test(parts[1])) {
      bands.push({ type: parts[0], range: parts[1], note: parts[2] || '' });
    }
  }
  return bands;
}

const COMPANY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  faang:      { bg: 'bg-violet-500/10',   text: 'text-violet-700 dark:text-violet-400',   border: 'border-violet-500/30' },
  product:    { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-500/30' },
  it:         { bg: 'bg-slate-500/10',  text: 'text-slate-700 dark:text-slate-400',  border: 'border-slate-500/30' },
  startup:    { bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-500/30' },
  fintech:    { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/30' },
  default:    { bg: 'bg-muted',         text: 'text-foreground',                      border: 'border-border' },
};

function getSalaryColor(type: string) {
  const t = type.toLowerCase();
  if (t.includes('faang') || t.includes('big tech')) return COMPANY_COLORS.faang;
  if (t.includes('product') || t.includes('startup') && t.includes('indian')) return COMPANY_COLORS.product;
  if (t.includes('service') || t.includes('it') || t.includes('consulting')) return COMPANY_COLORS.it;
  if (t.includes('startup')) return COMPANY_COLORS.startup;
  if (t.includes('fintech') || t.includes('finance')) return COMPANY_COLORS.fintech;
  return COMPANY_COLORS.default;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function RagaResponseCard({ content, responseType }: RagaResponseCardProps) {

  // ── ATS Score Card ─────────────────────────────────────────────────────────
  if (responseType === 'ats_score') {
    const score = extractFinalScore(content);
    const layers = extractLayerScores(content);

    return (
      <div className="space-y-4 w-full">
        {/* Header */}
        <div className="flex items-center gap-2 pb-1 border-b border-border">
          <div className="p-1.5 rounded-lg bg-violet-500/10">
            <Target className="w-4 h-4 text-violet-600" />
          </div>
          <span className="text-sm font-semibold text-foreground">ATS Resume Intelligence</span>
        </div>

        {/* Score + layers */}
        {score !== null && (
          <div className="flex gap-6 items-start">
            <ScoreRing score={score} />
            {layers.length > 0 && (
              <div className="flex-1 space-y-2.5 pt-1">
                {layers.map((l) => <LayerBar key={l.name} {...l} />)}
              </div>
            )}
          </div>
        )}

        {/* Full content as markdown below the visual */}
        <div className="text-sm break-words [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h3]:font-medium [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_p]:my-1.5 [&_ul]:my-2 [&_li]:my-0.5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-muted/50 [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-sm [&_strong]:font-semibold [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // ── Optimize Card ──────────────────────────────────────────────────────────
  if (responseType === 'optimize') {
    const delta = extractScoreDelta(content);
    const mode = extractMode(content);
    const newScore = extractFinalScore(content) || (delta?.to);

    return (
      <div className="space-y-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/10">
              <TrendingUp className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-sm font-semibold text-foreground">Resume Optimization</span>
          </div>
          <ModeBadge mode={mode} />
        </div>

        {/* Score delta */}
        {delta && <ScoreDelta from={delta.from} to={delta.to} />}
        {!delta && newScore && (
          <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/30 rounded-xl px-4 py-3">
            <TrendingUp className="w-5 h-5 text-violet-600 shrink-0" />
            <span className="text-sm font-medium">Estimated new score: <strong className="text-violet-600">{newScore}/100</strong></span>
          </div>
        )}

        {/* Aggressive disclaimer highlight */}
        {mode === 'AGGRESSIVE' && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Aggressive mode — some language is inflated for ATS. Review before interviews.</span>
          </div>
        )}

        {/* Full markdown content */}
        <div className="text-sm break-words [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h3]:font-medium [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:my-2 [&_li]:my-0.5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-muted/50 [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-sm [&_strong]:font-semibold [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // ── Salary Card ────────────────────────────────────────────────────────────
  if (responseType === 'salary') {
    const bands = extractSalaryBands(content);

    return (
      <div className="space-y-4 w-full">
        {/* Header */}
        <div className="flex items-center gap-2 pb-1 border-b border-border">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-foreground">Salary Expectations</span>
        </div>

        {/* Salary cards grid */}
        {bands.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {bands.map((band, i) => {
              const clr = getSalaryColor(band.type);
              return (
                <div key={i} className={`rounded-xl border p-3 ${clr.bg} ${clr.border}`}>
                  <div className={`text-xs font-semibold mb-1 ${clr.text}`}>{band.type}</div>
                  <div className="text-base font-bold text-foreground">{band.range}</div>
                  {band.note && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{band.note}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Markdown below */}
        <div className="text-sm break-words [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:my-1.5 [&_ul]:my-2 [&_li]:my-0.5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-muted/50 [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-sm [&_strong]:font-semibold">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // ── Score Advisor Card ─────────────────────────────────────────────────────
  if (responseType === 'score_advisor') {
    const currentScore = (() => {
      const m = content.match(/Current Score[:\s]*(\d+)/i); return m ? parseInt(m[1]) : null;
    })();
    const ceiling = (() => {
      const m = content.match(/(?:Honest Ceiling|Max[^:]*)[:\s]*(\d+)/i); return m ? parseInt(m[1]) : null;
    })();

    return (
      <div className="space-y-4 w-full">
        {/* Header */}
        <div className="flex items-center gap-2 pb-1 border-b border-border">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <BarChart3 className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-sm font-semibold text-foreground">Score Advisor</span>
        </div>

        {/* Score range visual */}
        {currentScore !== null && ceiling !== null && (
          <div className="bg-muted/40 border border-border rounded-xl p-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Current: <strong className="text-foreground">{currentScore}</strong></span>
              <span>Gap: <strong className="text-amber-600">+{ceiling - currentScore} pts</strong></span>
              <span>Ceiling: <strong className="text-foreground">{ceiling}</strong></span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden relative">
              <div className="h-full bg-amber-400/40 rounded-full" style={{ width: `${ceiling}%` }} />
              <div className="h-full bg-amber-500 rounded-full absolute top-0 left-0 transition-all" style={{ width: `${currentScore}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-amber-600 font-medium">You are here</span>
              <span className="text-xs text-muted-foreground">Realistic ceiling</span>
            </div>
          </div>
        )}

        <div className="text-sm break-words [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:font-medium [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:my-2 [&_li]:my-0.5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-muted/50 [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-sm [&_strong]:font-semibold">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // ── Interview Card ─────────────────────────────────────────────────────────
  if (responseType === 'interview') {
    // Extract numbered questions from content
    const questions = content.match(/^\d+\.\s+.+$/gm) || [];
    const company = content.match(/##[^#\n]*(?:Amazon|Google|Microsoft|Meta|Flipkart|Swiggy|Zomato|TCS|Infosys|Wipro|Qualcomm|Goldman)/i)?.[0]?.replace(/^#+\s*/, '');

    return (
      <div className="space-y-4 w-full">
        {/* Header */}
        <div className="flex items-center gap-2 pb-1 border-b border-border">
          <div className="p-1.5 rounded-lg bg-violet-500/10">
            <Brain className="w-4 h-4 text-violet-600" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Interview Prep{company ? ` — ${company.trim()}` : ''}
          </span>
        </div>

        {/* Question pills preview if many questions */}
        {questions.length > 3 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{questions.length} questions:</span>
            {['Technical', 'Behavioral', 'System Design'].map((tag) => {
              const hasTag = content.toLowerCase().includes(tag.toLowerCase().split(' ')[0]);
              return hasTag ? (
                <span key={tag} className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-700 border border-violet-500/20 rounded-full">{tag}</span>
              ) : null;
            })}
          </div>
        )}

        <div className="text-sm break-words [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h3]:font-medium [&_h3]:mt-3 [&_h3]:mb-2 [&_p]:my-1.5 [&_ul]:my-2 [&_li]:my-1 [&_ol]:my-2 [&_ol_li]:my-1.5 [&_strong]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-violet-500/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-muted/50 [&_th]:text-xs [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // ── Career Card ────────────────────────────────────────────────────────────
  if (responseType === 'career') {
    return (
      <div className="space-y-4 w-full">
        {/* Header */}
        <div className="flex items-center gap-2 pb-1 border-b border-border">
          <div className="p-1.5 rounded-lg bg-purple-500/10">
            <Briefcase className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm font-semibold text-foreground">Career Guidance</span>
        </div>

        <div className="text-sm break-words [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h3]:font-medium [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:my-2 [&_li]:my-0.5 [&_ol]:my-2 [&_ol_li]:my-1 [&_strong]:font-semibold [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-muted/50 [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-sm [&_blockquote]:border-l-4 [&_blockquote]:border-purple-500/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // ── General (default) ──────────────────────────────────────────────────────
  return (
    <div className="break-words text-[15px] leading-relaxed text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:tracking-tight [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-border/60 [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-base [&_p]:my-2.5 [&_p]:leading-[1.65] [&_ul]:my-3 [&_ul]:pl-5 [&_li]:my-1.5 [&_li]:leading-relaxed [&_ol]:my-3 [&_ol]:pl-5 [&_ol_li]:my-1.5 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:border [&_table]:border-border [&_th]:border [&_th]:border-border [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:bg-muted/50 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-sm [&_strong]:font-semibold [&_strong]:text-foreground [&_code]:bg-muted [&_code]:px-2 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-sm [&_code]:font-mono [&_pre]:bg-muted/80 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre]:border [&_pre]:border-border/50 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-lg [&_blockquote]:my-3 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:opacity-90">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// ── Helper: map string to ResponseType ─────────────────────────────────────────
export function toResponseType(s: string | undefined): ResponseType {
  const valid: ResponseType[] = ['ats_score', 'optimize', 'salary', 'score_advisor', 'interview', 'career', 'general'];
  return valid.includes(s as ResponseType) ? (s as ResponseType) : 'general';
}
