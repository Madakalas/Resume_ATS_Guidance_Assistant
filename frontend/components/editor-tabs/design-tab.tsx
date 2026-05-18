'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { ChevronDown, ChevronRight, AlertCircle, Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

// ─── accent presets ─────────────────────────────────────────────────────────
const ACCENT_PRESETS = [
  'none', '#374151', '#1e6b5e', '#5b8ba0', '#006d77', '#1a3a5c',
  '#2c5f8a', '#5b8ab0', '#8ab4cc', '#7ec8e3', '#4b2c7a',
  '#7b2a5a', '#c07090', '#d94f75', '#e06b70', 'custom',
];

// ─── font data ───────────────────────────────────────────────────────────────
const FONTS = {
  serif: ['Lora', 'Source Serif Pro', 'Zilla Slab', 'PT Serif', 'Literata', 'EB Garamond', 'Latin Modern', 'Aleo', 'Crimson Pro', 'Cormorant Garamond', 'Vollkorn', 'Amiri', 'Crimson Text', 'Alegreya'],
  sans: ['Source Sans Pro', 'Karla', 'Mulish', 'Lato', 'Titillium Web', 'Work Sans', 'Barlow', 'Jost', 'Fira Sans', 'Roboto', 'Rubik', 'Asap', 'Nunito', 'Open Sans', 'IBM Plex Sans'],
  mono: ['Inconsolata', 'Source Code Pro', 'IBM Plex Mono', 'Overpass Mono', 'Space Mono', 'Courier Prime'],
};

// ─── section heading style thumbnails ────────────────────────────────────────
const HEADING_STYLES = [
  {
    id: 'plain', label: 'Plain',
    preview: (
      <div className="w-full text-left">
        <div className="text-[9px] font-bold text-gray-800 uppercase tracking-wide leading-tight">SUMMARY</div>
        <div className="h-px mt-0.5" />
      </div>
    )
  },
  {
    id: 'box', label: 'Box',
    preview: (
      <div className="w-full text-left">
        <div className="text-[9px] font-bold text-gray-800 uppercase border border-gray-700 px-1 py-0.5 inline-block">SUMMARY</div>
      </div>
    )
  },
  {
    id: 'underline', label: 'Underline',
    preview: (
      <div className="w-full text-left">
        <div className="text-[9px] font-bold text-gray-800 uppercase tracking-wide leading-tight">SUMMARY</div>
        <div className="h-px bg-gray-700 mt-0.5" />
      </div>
    )
  },
  {
    id: 'double-underline', label: '2x Underline',
    preview: (
      <div className="w-full text-left">
        <div className="text-[9px] font-bold text-gray-800 uppercase tracking-wide leading-tight">SUMMARY</div>
        <div className="h-px bg-gray-700 mt-0.5" />
        <div className="h-px bg-gray-700 mt-0.5" />
      </div>
    )
  },
  {
    id: 'filled', label: 'Filled',
    preview: (
      <div className="w-full">
        <div className="text-[9px] font-bold text-white uppercase bg-gray-700 px-1 py-0.5 text-center">SUMMARY</div>
      </div>
    )
  },
  {
    id: 'line-left', label: 'Line Left',
    preview: (
      <div className="w-full text-left">
        <div className="text-[9px] font-bold text-gray-800 uppercase border-l-2 border-violet-600 pl-1">SUMMARY</div>
        <div className="h-px bg-gray-200 mt-0.5 ml-2" />
      </div>
    )
  },
  {
    id: 'overline', label: 'Overline',
    preview: (
      <div className="w-full text-left">
        <div className="h-px bg-gray-700 mb-0.5" />
        <div className="text-[9px] font-bold text-gray-800 uppercase tracking-wide">SUMMARY</div>
      </div>
    )
  },
  {
    id: 'wavy', label: 'Wavy',
    preview: (
      <div className="w-full text-left">
        <div className="text-[9px] font-bold text-gray-800 uppercase tracking-wide">SUMMARY</div>
        <svg viewBox="0 0 60 6" className="w-full h-1.5"><path d="M0,3 Q5,0 10,3 Q15,6 20,3 Q25,0 30,3 Q35,6 40,3 Q45,0 50,3 Q55,6 60,3" fill="none" stroke="#6366f1" strokeWidth="1.5"/></svg>
      </div>
    )
  },
];


// ─── entry layout style thumbnails ───────────────────────────────────────────
const ENTRY_LAYOUTS = [
  { id: 1, preview: (
    <svg viewBox="0 0 80 36" className="w-16 h-8">
      <rect x="4" y="4" width="48" height="3" rx="1" fill="#9ca3af"/>
      <rect x="56" y="4" width="20" height="3" rx="1" fill="#d1d5db"/>
      <rect x="4" y="10" width="30" height="2" rx="1" fill="#d1d5db"/>
      <rect x="4" y="15" width="72" height="2" rx="1" fill="#e5e7eb"/>
      <rect x="4" y="20" width="60" height="2" rx="1" fill="#e5e7eb"/>
      <rect x="4" y="25" width="66" height="2" rx="1" fill="#e5e7eb"/>
    </svg>
  )},
  { id: 2, preview: (
    <svg viewBox="0 0 80 36" className="w-16 h-8">
      <rect x="4" y="4" width="20" height="3" rx="1" fill="#d1d5db"/>
      <rect x="4" y="10" width="48" height="3" rx="1" fill="#9ca3af"/>
      <rect x="56" y="10" width="20" height="3" rx="1" fill="#d1d5db"/>
      <rect x="4" y="16" width="72" height="2" rx="1" fill="#e5e7eb"/>
      <rect x="4" y="21" width="60" height="2" rx="1" fill="#e5e7eb"/>
      <rect x="4" y="26" width="66" height="2" rx="1" fill="#e5e7eb"/>
    </svg>
  )},
  { id: 3, preview: (
    <svg viewBox="0 0 80 36" className="w-16 h-8">
      <rect x="4" y="4" width="28" height="3" rx="1" fill="#9ca3af"/>
      <rect x="36" y="4" width="40" height="3" rx="1" fill="#d1d5db"/>
      <rect x="4" y="10" width="72" height="2" rx="1" fill="#e5e7eb"/>
      <rect x="4" y="15" width="60" height="2" rx="1" fill="#e5e7eb"/>
      <rect x="4" y="20" width="66" height="2" rx="1" fill="#e5e7eb"/>
    </svg>
  )},
  { id: 4, preview: (
    <svg viewBox="0 0 80 36" className="w-16 h-8">
      <rect x="4" y="4" width="72" height="3" rx="1" fill="#9ca3af"/>
      <rect x="4" y="10" width="72" height="2" rx="1" fill="#e5e7eb"/>
      <rect x="4" y="15" width="60" height="2" rx="1" fill="#e5e7eb"/>
      <rect x="4" y="20" width="66" height="2" rx="1" fill="#e5e7eb"/>
      <rect x="4" y="25" width="50" height="2" rx="1" fill="#e5e7eb"/>
    </svg>
  )},
];

// ─── collapsible section wrapper ─────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-[15px] text-gray-900">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-5">{children}</div>}
    </div>
  );
}

// ─── option button ────────────────────────────────────────────────────────────
function OptBtn({ active, onClick, children, className = '' }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
        active ? 'border-violet-600 bg-violet-50 text-violet-700 ring-1 ring-violet-400' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
      } ${className}`}
    >
      {children}
    </button>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function DesignTab({ versionId }: { versionId: string }) {
  const store = useStore();
  const version = store.versions.find(v => v.id === versionId);
  const photoRef = useRef<HTMLInputElement>(null);

  if (!version) return null;

  const d = version.settings.design;
  const s = version.settings;
  const atsSafe = s.atsSafeMode;

  const D = (patch: any) => store.updateDesignSettings(versionId, patch);
  const S = (patch: any) => store.updateSettings(versionId, patch);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => D({ photoUrl: ev.target?.result as string, showPhoto: true });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 pb-8">
      {atsSafe && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>ATS Safe Mode is enabled. Some design options are locked.</span>
        </div>
      )}

      {/* ── LAYOUT & SPACING ───────────────────────────────────────────── */}
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 pt-2">Layout & Spacing</div>

      <Section title="Layout">
        {/* Columns */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Columns</Label>
          <div className="flex gap-3">
            {([
              { val: 'one', svg: <svg viewBox="0 0 60 42" className="w-12 h-8"><rect x="4" y="6" width="52" height="4" rx="1" fill="#d1d5db"/><rect x="4" y="14" width="52" height="4" rx="1" fill="#d1d5db"/><rect x="4" y="22" width="52" height="4" rx="1" fill="#d1d5db"/><rect x="4" y="30" width="40" height="4" rx="1" fill="#d1d5db"/></svg>, label: 'One' },
              { val: 'two', svg: <svg viewBox="0 0 60 42" className="w-12 h-8"><rect x="4" y="6" width="24" height="4" rx="1" fill="#d1d5db"/><rect x="32" y="6" width="24" height="4" rx="1" fill="#d1d5db"/><rect x="4" y="14" width="24" height="4" rx="1" fill="#d1d5db"/><rect x="32" y="14" width="24" height="4" rx="1" fill="#d1d5db"/><rect x="4" y="22" width="24" height="4" rx="1" fill="#d1d5db"/><rect x="32" y="22" width="24" height="4" rx="1" fill="#d1d5db"/></svg>, label: 'Two' },
              { val: 'mix', svg: <svg viewBox="0 0 60 42" className="w-12 h-8"><rect x="4" y="6" width="52" height="4" rx="1" fill="#a78bfa"/><rect x="4" y="14" width="52" height="4" rx="1" fill="#a78bfa"/><rect x="4" y="22" width="24" height="4" rx="1" fill="#d1d5db"/><rect x="32" y="22" width="24" height="4" rx="1" fill="#d1d5db"/></svg>, label: 'Mix' },
            ] as const).map(({ val, svg, label }) => (
              <button key={val} onClick={() => S({ layoutColumns: val })}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${s.layoutColumns === val ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                {svg}
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Header Position — only show for Two or Mix columns */}
        {(s.layoutColumns === 'two' || s.layoutColumns === 'mix') && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Header Position</Label>
            <div className="flex gap-3">
              {([
                { val: 'top', svg: <svg viewBox="0 0 40 32" className="w-10 h-8"><rect x="0" y="0" width="40" height="12" rx="2" fill="#7c3aed"/><rect x="2" y="14" width="36" height="3" rx="1" fill="#d1d5db"/><rect x="2" y="19" width="30" height="3" rx="1" fill="#d1d5db"/><rect x="2" y="24" width="36" height="3" rx="1" fill="#d1d5db"/></svg>, label: 'Top' },
                { val: 'left', svg: <svg viewBox="0 0 40 32" className="w-10 h-8"><rect x="0" y="0" width="16" height="32" rx="2" fill="#7c3aed"/><rect x="18" y="4" width="20" height="3" rx="1" fill="#d1d5db"/><rect x="18" y="10" width="20" height="3" rx="1" fill="#d1d5db"/><rect x="18" y="16" width="16" height="3" rx="1" fill="#d1d5db"/></svg>, label: 'Left' },
                { val: 'right', svg: <svg viewBox="0 0 40 32" className="w-10 h-8"><rect x="24" y="0" width="16" height="32" rx="2" fill="#7c3aed"/><rect x="2" y="4" width="20" height="3" rx="1" fill="#d1d5db"/><rect x="2" y="10" width="20" height="3" rx="1" fill="#d1d5db"/><rect x="2" y="16" width="16" height="3" rx="1" fill="#d1d5db"/></svg>, label: 'Right' },
              ] as const).map(({ val, svg, label }) => (
                <button key={val} onClick={() => S({ headerPosition: val })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${s.headerPosition === val ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  {svg}
                  <span className="text-xs text-gray-600">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Column Width — only show for Two or Mix columns */}
        {(s.layoutColumns === 'two' || s.layoutColumns === 'mix') && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Column Width</Label>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Left {s.columnWidthLeft}% · Right {100 - s.columnWidthLeft}%</div>
                <div className="flex items-center gap-2">
                  <Slider value={[s.columnWidthLeft]} min={20} max={80} step={5} onValueChange={([v]) => S({ columnWidthLeft: v })} className="flex-1" />
                  <div className="flex gap-1">
                    <button onClick={() => S({ columnWidthLeft: Math.max(20, s.columnWidthLeft - 5) })} className="w-7 h-7 rounded border text-sm">−</button>
                    <button onClick={() => S({ columnWidthLeft: Math.min(80, s.columnWidthLeft + 5) })} className="w-7 h-7 rounded border text-sm">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section title="Spacing">
        {/* Font Size: 9–13pt */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold text-gray-700">Font Size</Label>
            <span className="text-xs text-gray-500">{s.fontSize}pt</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[9, 10, 11, 12, 13].map(v => (
              <button key={v} onClick={() => S({ fontSize: v })}
                className={`w-10 h-9 rounded-lg border text-xs font-medium transition-all ${s.fontSize === v ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Line Height: 1.1–1.5 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold text-gray-700">Line Height</Label>
            <span className="text-xs text-gray-500">{s.lineHeight}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[1.1, 1.2, 1.3, 1.4, 1.5].map(v => (
              <button key={v} onClick={() => S({ lineHeight: v })}
                className={`w-12 h-9 rounded-lg border text-xs font-medium transition-all ${s.lineHeight === v ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Left & Right Margin: 10–26mm, step 2 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold text-gray-700">Left &amp; Right Margin</Label>
            <span className="text-xs text-gray-500">{s.marginLeftRight}mm</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[10, 12, 14, 16, 18, 20, 22, 24, 26].map(v => (
              <button key={v} onClick={() => S({ marginLeftRight: v })}
                className={`w-10 h-9 rounded-lg border text-xs font-medium transition-all ${s.marginLeftRight === v ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Top & Bottom Margin: 10–26mm, step 2 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold text-gray-700">Top &amp; Bottom Margin</Label>
            <span className="text-xs text-gray-500">{s.marginTopBottom}mm</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[10, 12, 14, 16, 18, 20, 22, 24, 26].map(v => (
              <button key={v} onClick={() => S({ marginTopBottom: v })}
                className={`w-10 h-9 rounded-lg border text-xs font-medium transition-all ${s.marginTopBottom === v ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Space between Entries: dash indicators */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold text-gray-700">Space between Entries</Label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(v => (
              <button key={v} onClick={() => S({ spaceBetweenEntries: v })}
                className={`min-w-[2.2rem] h-9 px-1.5 rounded-lg border text-xs font-medium transition-all ${s.spaceBetweenEntries === v ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}>
                {'–'.repeat(v + 1)}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Entry Layout">
        {/* 4 thumbnail layouts */}
        <div className="space-y-2">
          <div className="flex gap-3 flex-wrap">
            {ENTRY_LAYOUTS.map(({ id, preview }) => (
              <button key={id} onClick={() => S({ entryLayoutStyle: id as 1|2|3|4 })}
                className={`p-2 rounded-xl border-2 transition-all ${s.entryLayoutStyle === id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                {preview}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Title &amp; subtitle size</Label>
          <div className="flex gap-2">
            {(['s', 'm', 'l'] as const).map(sz => (
              <OptBtn key={sz} active={s.titleSubtitleSize === sz} onClick={() => S({ titleSubtitleSize: sz })}>{sz.toUpperCase()}</OptBtn>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Subtitle style</Label>
          <div className="flex gap-2">
            <OptBtn active={s.subtitleStyle === 'normal'} onClick={() => S({ subtitleStyle: 'normal' })}>Normal</OptBtn>
            <OptBtn active={s.subtitleStyle === 'bold'} onClick={() => S({ subtitleStyle: 'bold' })}><strong>Bold</strong></OptBtn>
            <OptBtn active={s.subtitleStyle === 'italic'} onClick={() => S({ subtitleStyle: 'italic' })}><em>Italic</em></OptBtn>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Subtitle placement</Label>
          <div className="flex gap-2">
            <OptBtn active={s.subtitlePlacement === 'same-line'} onClick={() => S({ subtitlePlacement: 'same-line' })}>Try Same Line</OptBtn>
            <OptBtn active={s.subtitlePlacement === 'next-line'} onClick={() => S({ subtitlePlacement: 'next-line' })}>Next Line</OptBtn>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="indent" checked={s.indentBody} onCheckedChange={v => S({ indentBody: !!v })} />
          <label htmlFor="indent" className="text-sm text-gray-700 cursor-pointer">Indent body</label>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">List style</Label>
          <div className="flex gap-2">
            <OptBtn active={s.listStyle === 'bullet'} onClick={() => S({ listStyle: 'bullet' })}>• Bullet</OptBtn>
            <OptBtn active={s.listStyle === 'hyphen'} onClick={() => S({ listStyle: 'hyphen' })}>− Hyphen</OptBtn>
          </div>
        </div>
      </Section>

      {/* ── DESIGN ────────────────────────────────────────────────────────── */}
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 pt-2">Design</div>

      <Section title="Font">
        {/* Category tabs */}
        <div className="flex gap-2">
          {(['serif', 'sans', 'mono'] as const).map(cat => (
            <button key={cat} onClick={() => D({ fontCategory: cat })}
              className={`flex flex-col items-center px-5 py-3 rounded-xl border-2 transition-all ${d.fontCategory === cat ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <span className={`text-xl font-bold ${d.fontCategory === cat ? 'text-violet-600' : 'text-gray-700'}`} style={{ fontFamily: cat === 'serif' ? 'Georgia,serif' : cat === 'mono' ? 'monospace' : 'sans-serif' }}>Aa</span>
              <span className={`text-xs mt-0.5 capitalize ${d.fontCategory === cat ? 'text-violet-600' : 'text-gray-500'}`}>{cat}</span>
            </button>
          ))}
        </div>

        {/* Font grid */}
        <div className="grid grid-cols-3 gap-2">
          {FONTS[d.fontCategory].map(font => (
            <button key={font} onClick={() => D({ fontFamily: font })}
              className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all text-left ${d.fontFamily === font ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}
              style={{ fontFamily: font }}>
              {font}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Colors" defaultOpen={true}>
        {/* Color mode */}
        <div className="flex gap-3">
          {([
            { val: 'basic', label: 'Basic', icon: <div className="w-8 h-8 rounded-full bg-violet-100 border-2 border-violet-400" /> },
            { val: 'advanced', label: 'Advanced', icon: <div className="w-8 h-8 rounded-full" style={{ background: 'linear-gradient(135deg, #9ca3af 50%, white 50%)' }} /> },
            { val: 'border', label: 'Border', icon: <div className="w-8 h-8 rounded-full border-2 border-gray-400 bg-white" /> },
          ] as const).map(({ val, label, icon }) => (
            <button key={val} onClick={() => D({ colorMode: val })}
              className={`flex flex-col items-center gap-1 transition-all ${d.colorMode === val ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}>
              {icon}
              <span className="text-xs text-gray-600">{label}</span>
            </button>
          ))}
        </div>

        {/* Accent / Multi / Image */}
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-900 text-white text-xs rounded-lg font-medium">Accent</button>
          <button className="px-4 py-2 bg-white border text-gray-600 text-xs rounded-lg flex items-center gap-1.5"><span className="font-bold text-gray-400">T</span><div className="w-4 h-4 bg-gray-200 rounded" />Multi</button>
          <button className="px-4 py-2 bg-white border text-gray-600 text-xs rounded-lg">Image</button>
        </div>

        {/* Color swatches */}
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((color, i) => (
            <button key={i} onClick={() => color !== 'custom' && color !== 'none' && D({ accentColor: color })}
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${d.accentColor === color ? 'border-violet-500 scale-110' : 'border-transparent'}`}
              style={color === 'none' ? { background: 'white', border: '1.5px solid #d1d5db' } : color === 'custom' ? { background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' } : { background: color }}>
              {color === 'none' && <span className="text-gray-400 text-xs leading-none">⊘</span>}
            </button>
          ))}
          {/* Custom color picker hidden input */}
          <input type="color" value={d.accentColor} onChange={e => D({ accentColor: e.target.value })} className="w-8 h-8 rounded-full cursor-pointer border-0 p-0" style={{ appearance: 'none' }} title="Custom color" />
        </div>

        {/* Apply accent color to checkboxes */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Apply accent color</Label>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              { key: 'accentApplyName', label: 'Name' },
              { key: 'accentApplyDots', label: 'Dots/Bars/Bubbles' },
              { key: 'accentApplyJobTitle', label: 'Job title' },
              { key: 'accentApplyDates', label: 'Dates' },
              { key: 'accentApplyHeadings', label: 'Headings' },
              { key: 'accentApplyLinkIcons', label: 'Link icons' },
              { key: 'accentApplyHeadingsLine', label: 'Headings Line' },
              { key: 'accentApplyHeaderIcons', label: 'Header icons' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox id={key} checked={(d as any)[key]} onCheckedChange={v => D({ [key]: !!v })} />
                <label htmlFor={key} className="text-sm text-gray-700 cursor-pointer">{label}</label>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Section Headings" defaultOpen={true}>
        {/* 8 style thumbnails */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Style</Label>
          <div className="grid grid-cols-4 gap-2">
            {HEADING_STYLES.map(({ id, label, preview }) => (
              <button key={id} onClick={() => D({ sectionHeadingStyle: id as any })}
                className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center min-h-[52px] transition-all ${d.sectionHeadingStyle === id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center justify-center w-full px-1">{preview}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Capitalization</Label>
          <div className="flex gap-2">
            <OptBtn active={d.sectionHeadingCaps === 'capitalize'} onClick={() => D({ sectionHeadingCaps: 'capitalize' })}>Capitalize</OptBtn>
            <OptBtn active={d.sectionHeadingCaps === 'uppercase'} onClick={() => D({ sectionHeadingCaps: 'uppercase' })}>Uppercase</OptBtn>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Size</Label>
          <div className="flex gap-2">
            {(['s', 'm', 'l', 'xl'] as const).map(sz => (
              <OptBtn key={sz} active={d.sectionHeadingSize === sz} onClick={() => D({ sectionHeadingSize: sz })}>{sz.toUpperCase()}</OptBtn>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Icons</Label>
          <div className="flex gap-2">
            {(['none', 'outline', 'filled'] as const).map(ic => (
              <OptBtn key={ic} active={d.sectionHeadingIcons === ic} onClick={() => D({ sectionHeadingIcons: ic })} className="capitalize">{ic}</OptBtn>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Link Styling" defaultOpen={true}>
        <div className="space-y-3">
          {[
            { key: 'linkUnderline', label: 'Underline' },
            { key: 'linkBlueColor', label: 'Blue color' },
            { key: 'linkIcon', label: 'Link icon' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox id={key} checked={(d as any)[key]} onCheckedChange={v => D({ [key]: !!v })} />
              <label htmlFor={key} className="text-sm text-gray-700 cursor-pointer">{label}</label>
            </div>
          ))}
          {d.linkIcon && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => D({ linkIconStyle: 'chain' })}
                className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${d.linkIconStyle === 'chain' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:border-gray-300'}`}>
                🔗
              </button>
              <button onClick={() => D({ linkIconStyle: 'external' })}
                className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${d.linkIconStyle === 'external' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:border-gray-300'}`}>
                ↗
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 pt-2">Header</div>

      <Section title="Personal Details">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Align</Label>
          <div className="flex gap-3">
            {([
              { val: 'left', svg: <svg viewBox="0 0 48 32" className="w-10 h-7"><rect x="4" y="8" width="20" height="3" rx="1" fill="#9ca3af"/><circle cx="33" cy="9" r="4" fill="#9ca3af"/><rect x="4" y="14" width="40" height="2" rx="1" fill="#d1d5db"/><rect x="4" y="19" width="32" height="2" rx="1" fill="#d1d5db"/><rect x="4" y="24" width="36" height="2" rx="1" fill="#d1d5db"/></svg>, label: 'Left' },
              { val: 'center', svg: <svg viewBox="0 0 48 32" className="w-10 h-7"><circle cx="24" cy="8" r="4" fill="#9ca3af"/><rect x="8" y="14" width="32" height="2" rx="1" fill="#d1d5db"/><rect x="12" y="19" width="24" height="2" rx="1" fill="#d1d5db"/><rect x="10" y="24" width="28" height="2" rx="1" fill="#d1d5db"/></svg>, label: 'Center' },
              { val: 'right', svg: <svg viewBox="0 0 48 32" className="w-10 h-7"><circle cx="14" cy="9" r="4" fill="#9ca3af"/><rect x="24" y="8" width="20" height="3" rx="1" fill="#9ca3af"/><rect x="4" y="14" width="40" height="2" rx="1" fill="#d1d5db"/><rect x="12" y="19" width="32" height="2" rx="1" fill="#d1d5db"/><rect x="8" y="24" width="36" height="2" rx="1" fill="#d1d5db"/></svg>, label: 'Right' },
            ] as const).map(({ val, svg, label }) => (
              <button key={val} onClick={() => {
                // Auto-reset split→inline when switching to center
                const arrangement = val === 'center' && d.headerArrangement === 'split' ? 'inline' : d.headerArrangement;
                D({ headerAlignment: val, headerArrangement: arrangement });
              }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${d.headerAlignment === val ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                {svg}
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Arrangement</Label>
          <div className="flex gap-2">
            {([
              { val: 'stacked', svg: <svg viewBox="0 0 56 24" className="w-12 h-5"><rect x="4" y="3" width="48" height="3" rx="1" fill="#d1d5db"/><rect x="4" y="9" width="48" height="3" rx="1" fill="#d1d5db"/><rect x="4" y="15" width="48" height="3" rx="1" fill="#d1d5db"/></svg>, label: 'Stacked' },
              { val: 'inline', svg: <svg viewBox="0 0 56 24" className="w-12 h-5"><rect x="4" y="8" width="12" height="3" rx="1" fill="#a78bfa"/><rect x="18" y="8" width="12" height="3" rx="1" fill="#a78bfa"/><rect x="32" y="8" width="12" height="3" rx="1" fill="#a78bfa"/><rect x="46" y="8" width="6" height="3" rx="1" fill="#a78bfa"/></svg>, label: 'Inline' },
              { val: 'split', svg: <svg viewBox="0 0 56 24" className="w-12 h-5"><rect x="4" y="3" width="20" height="3" rx="1" fill="#d1d5db"/><rect x="32" y="3" width="20" height="3" rx="1" fill="#d1d5db"/><rect x="4" y="9" width="20" height="3" rx="1" fill="#d1d5db"/><rect x="32" y="9" width="20" height="3" rx="1" fill="#d1d5db"/></svg>, label: 'Split' },
            ] as const)
              .filter(({ val }) => d.headerAlignment === 'center' ? val !== 'split' : true)
              .map(({ val, svg, label }) => (
                <button key={val} onClick={() => {
                  // If switching to center and split was selected, reset to inline
                  D({ headerArrangement: val });
                }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${d.headerArrangement === val ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  {svg}
                  <span className="text-xs text-gray-500">{label}</span>
                </button>
              ))}
          </div>
          {d.headerAlignment === 'center' && (
            <p className="text-xs text-gray-400">Split arrangement not available for center alignment</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Contact style</Label>
          <div className="flex gap-2">
            <OptBtn active={d.headerContactStyle === 'icon'} onClick={() => D({ headerContactStyle: 'icon' })}>☺ Icon</OptBtn>
            <OptBtn active={d.headerContactStyle === 'bullet'} onClick={() => D({ headerContactStyle: 'bullet' })}>• Bullet</OptBtn>
            <OptBtn active={d.headerContactStyle === 'bar'} onClick={() => D({ headerContactStyle: 'bar' })}>| Bar</OptBtn>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="headerSep" checked={d.headerSeparator} onCheckedChange={v => D({ headerSeparator: !!v })} />
          <label htmlFor="headerSep" className="text-sm text-gray-700 cursor-pointer">Show separator line below header</label>
        </div>
      </Section>

      <Section title="Name" defaultOpen={true}>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Size</Label>
          <div className="flex gap-2">
            {(['xs', 's', 'm', 'l', 'xl'] as const).map(sz => (
              <OptBtn key={sz} active={d.nameSize === sz} onClick={() => D({ nameSize: sz })}>{sz.toUpperCase()}</OptBtn>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="nameBold" checked={d.nameBold} onCheckedChange={v => D({ nameBold: !!v })} />
          <label htmlFor="nameBold" className="text-sm text-gray-700 cursor-pointer">Name bold</label>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Font</Label>
          <div className="flex gap-2">
            <OptBtn active={d.nameFont === 'body'} onClick={() => D({ nameFont: 'body' })}>Body Font</OptBtn>
            <OptBtn active={d.nameFont === 'creative'} onClick={() => D({ nameFont: 'creative' })}>Creative</OptBtn>
          </div>
        </div>
      </Section>

      <Section title="Professional Title" defaultOpen={true}>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Size</Label>
          <div className="flex gap-2">
            {(['s', 'm', 'l'] as const).map(sz => (
              <OptBtn key={sz} active={d.titleSize === sz} onClick={() => D({ titleSize: sz })}>{sz.toUpperCase()}</OptBtn>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Position</Label>
          <div className="flex gap-2">
            <OptBtn active={d.titlePlacement === 'same-line'} onClick={() => D({ titlePlacement: 'same-line' })}>Try Same Line</OptBtn>
            <OptBtn active={d.titlePlacement === 'below'} onClick={() => D({ titlePlacement: 'below' })}>Below</OptBtn>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Style</Label>
          <div className="flex gap-2">
            <OptBtn active={d.titleStyle === 'normal'} onClick={() => D({ titleStyle: 'normal' })}>Normal</OptBtn>
            <OptBtn active={d.titleStyle === 'italic'} onClick={() => D({ titleStyle: 'italic' })}><em>Italic</em></OptBtn>
            <OptBtn active={d.titleStyle === 'bold'} onClick={() => D({ titleStyle: 'bold' })}><strong>Bold</strong></OptBtn>
          </div>
        </div>
      </Section>

      <Section title="Photo" defaultOpen={true}>
        <div className="flex items-center gap-2 mb-2">
          <Checkbox id="showPhoto" checked={d.showPhoto} onCheckedChange={v => D({ showPhoto: !!v })} />
          <label htmlFor="showPhoto" className="text-sm text-gray-700 cursor-pointer">Show photo</label>
        </div>

        {d.showPhoto && (
          <>
            <div className="flex items-center gap-4">
              {d.photoUrl ? (
                <div className="relative">
                  <img src={d.photoUrl} alt="Profile"
                    className={`object-cover ${d.photoShape === 'circle' ? 'rounded-full' : d.photoShape === 'rounded' ? 'rounded-xl' : 'rounded'} ${d.photoSize === 'sm' ? 'w-14 h-14' : d.photoSize === 'lg' ? 'w-24 h-24' : 'w-18 h-18'}`}
                    style={{ width: d.photoSize === 'sm' ? 56 : d.photoSize === 'lg' ? 96 : 72, height: d.photoSize === 'sm' ? 56 : d.photoSize === 'lg' ? 96 : 72 }} />
                  <button onClick={() => D({ photoUrl: '', showPhoto: false })} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs ${d.photoShape === 'circle' ? 'rounded-full' : d.photoShape === 'rounded' ? 'rounded-xl' : 'rounded'}`}
                  style={{ width: 72, height: 72 }}>Photo</div>
              )}
              <div className="space-y-2">
                <button onClick={() => photoRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" /> Upload Photo
                </button>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Shape</Label>
              <div className="flex gap-2">
                <OptBtn active={d.photoShape === 'circle'} onClick={() => D({ photoShape: 'circle' })}>⬤ Circle</OptBtn>
                <OptBtn active={d.photoShape === 'square'} onClick={() => D({ photoShape: 'square' })}>■ Square</OptBtn>
                <OptBtn active={d.photoShape === 'rounded'} onClick={() => D({ photoShape: 'rounded' })}>▣ Rounded</OptBtn>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Size</Label>
              <div className="flex gap-2">
                <OptBtn active={d.photoSize === 'sm'} onClick={() => D({ photoSize: 'sm' })}>Small</OptBtn>
                <OptBtn active={d.photoSize === 'md'} onClick={() => D({ photoSize: 'md' })}>Medium</OptBtn>
                <OptBtn active={d.photoSize === 'lg'} onClick={() => D({ photoSize: 'lg' })}>Large</OptBtn>
              </div>
            </div>
          </>
        )}
      </Section>

      {/* ── SECTIONS ──────────────────────────────────────────────────────── */}
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 pt-2">Sections</div>

      <Section title="Skills" defaultOpen={true}>
        {/* Top row: Grid | Level | Compact | Bubble */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {(['grid', 'level', 'compact', 'bubble'] as const).map(l => (
              <OptBtn key={l} active={d.skillsLayout === l} onClick={() => D({ skillsLayout: l })} className="text-xs capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</OptBtn>
            ))}
          </div>
        </div>

        {/* Grid sub-options: column count icons (1-4 bars) matching screenshot */}
        {d.skillsLayout === 'grid' && (
          <div className="space-y-2 mt-2">
            <div className="flex gap-2">
              {([1, 2, 3, 4] as const).map(n => (
                <button key={n} onClick={() => D({ skillsColumns: n })}
                  className={`p-2 rounded-lg border-2 transition-all ${d.skillsColumns === n ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <svg viewBox="0 0 32 20" className="w-8 h-5">
                    {Array.from({ length: n }).map((_, i) => {
                      const w = (32 - (n + 1) * 2) / n;
                      const x = 2 + i * (w + 2);
                      return (
                        <g key={i}>
                          <rect x={x} y="2" width={w} height="3" rx="1" fill="#a78bfa"/>
                          <rect x={x} y="7" width={w} height="2" rx="1" fill="#d1d5db"/>
                          <rect x={x} y="11" width={w * 0.8} height="2" rx="1" fill="#d1d5db"/>
                          <rect x={x} y="15" width={w * 0.9} height="2" rx="1" fill="#d1d5db"/>
                        </g>
                      );
                    })}
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Level sub-options: Text | Dots | Bar */}
        {d.skillsLayout === 'level' && (
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-3 gap-2">
              {(['text', 'dots', 'bar'] as const).map(sub => (
                <OptBtn key={sub} active={(d as any).skillsLevelStyle === sub} onClick={() => D({ skillsLevelStyle: sub })} className="text-xs capitalize">{sub.charAt(0).toUpperCase() + sub.slice(1)}</OptBtn>
              ))}
            </div>
          </div>
        )}

        {/* Compact sub-options: Bullet | Pipe | New Line | Comma + Dash/Colon/Bracket */}
        {d.skillsLayout === 'compact' && (
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-4 gap-2">
              {(['bullet', 'pipe', 'newline', 'comma'] as const).map(sub => (
                <OptBtn key={sub} active={(d as any).skillsCompactStyle === sub} onClick={() => D({ skillsCompactStyle: sub })} className="text-xs">{sub === 'newline' ? 'New Line' : sub.charAt(0).toUpperCase() + sub.slice(1)}</OptBtn>
              ))}
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Subinfo Style</Label>
              <div className="grid grid-cols-3 gap-2">
                <OptBtn active={d.skillsSubinfo === 'dash'} onClick={() => D({ skillsSubinfo: 'dash' })} className="text-xs">– Dash</OptBtn>
                <OptBtn active={d.skillsSubinfo === 'colon'} onClick={() => D({ skillsSubinfo: 'colon' })} className="text-xs">: Colon</OptBtn>
                <OptBtn active={d.skillsSubinfo === 'bracket'} onClick={() => D({ skillsSubinfo: 'bracket' })} className="text-xs">() Bracket</OptBtn>
              </div>
            </div>
          </div>
        )}

        {/* Bubble sub-options: Dash/Colon/Bracket only */}
        {d.skillsLayout === 'bubble' && (
          <div className="space-y-2 mt-2">
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Subinfo Style</Label>
            <div className="grid grid-cols-3 gap-2">
              <OptBtn active={d.skillsSubinfo === 'dash'} onClick={() => D({ skillsSubinfo: 'dash' })} className="text-xs">– Dash</OptBtn>
              <OptBtn active={d.skillsSubinfo === 'colon'} onClick={() => D({ skillsSubinfo: 'colon' })} className="text-xs">: Colon</OptBtn>
              <OptBtn active={d.skillsSubinfo === 'bracket'} onClick={() => D({ skillsSubinfo: 'bracket' })} className="text-xs">() Bracket</OptBtn>
            </div>
          </div>
        )}
      </Section>

      <Section title="Profile" defaultOpen={true}>
        <div className="flex items-center gap-2">
          <Checkbox id="showProfileHeading" checked={d.showProfileHeading} onCheckedChange={v => D({ showProfileHeading: !!v })} />
          <label htmlFor="showProfileHeading" className="text-sm text-gray-700 cursor-pointer">Show profile heading</label>
        </div>
      </Section>

      <Section title="Education" defaultOpen={true}>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Title &amp; Subtitle Order</Label>
          <div className="flex gap-2">
            <OptBtn active={d.educationOrder === 'degree-school'} onClick={() => D({ educationOrder: 'degree-school' })}>Degree, School</OptBtn>
            <OptBtn active={d.educationOrder === 'school-degree'} onClick={() => D({ educationOrder: 'school-degree' })}>School, Degree</OptBtn>
          </div>
        </div>
      </Section>

      <Section title="Work Experience" defaultOpen={true}>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Order title/subtitle</Label>
          <div className="flex gap-2">
            <OptBtn active={d.experienceOrder === 'title-company'} onClick={() => D({ experienceOrder: 'title-company' })}>Job Title – Employer</OptBtn>
            <OptBtn active={d.experienceOrder === 'company-title'} onClick={() => D({ experienceOrder: 'company-title' })}>Employer – Job Title</OptBtn>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Employment History</Label>
          <div className="flex items-center gap-2">
            <Checkbox id="groupPromo" checked={d.groupPromotions} onCheckedChange={v => D({ groupPromotions: !!v })} />
            <label htmlFor="groupPromo" className="text-sm text-gray-700 cursor-pointer">Group promotions</label>
          </div>
        </div>
      </Section>

      <Section title="Footer" defaultOpen={true}>
        <div className="flex items-center gap-2">
          <Checkbox id="showFooter" checked={d.showFooter} onCheckedChange={v => D({ showFooter: !!v })} />
          <label htmlFor="showFooter" className="text-sm text-gray-700 cursor-pointer">Show footer</label>
        </div>
        {d.showFooter && (
          <div className="space-y-2 pt-2">
            {[
              { key: 'footerPageNumbers', label: 'Page numbers' },
              { key: 'footerEmail', label: 'Email' },
              { key: 'footerName', label: 'Name' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox id={key} checked={(d as any)[key]} onCheckedChange={v => D({ [key]: !!v })} />
                <label htmlFor={key} className="text-sm text-gray-700 cursor-pointer">{label}</label>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
