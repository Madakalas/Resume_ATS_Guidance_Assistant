'use client';

import { useState, useRef } from 'react';
import { useStore, SectionType, SkillGroup, Project, Experience, Education, Certification } from '@/lib/store';
import { GripVertical, Eye, EyeOff, Plus, Trash2, Pencil, X, ChevronDown, ChevronUp, Lightbulb, Bot, Check, ExternalLink, Link } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MonthYearPicker } from '@/components/ui/month-year-picker';

// ─── icons map ────────────────────────────────────────────────────────────────
const SECTION_ICONS: Record<string, string> = {
  'personal-info': '👤', summary: '🪪', experience: '💼', projects: '📁',
  skills: '🧠', education: '🎓', awards: '🏆', languages: '🌍',
  volunteer: '🤝', publications: '📚', achievements: '⭐', links: '🔗',
  interests: '✨', courses: '📖', references: '🤝', organisations: '🏢',
  declaration: '✍️', custom: '🧩',
};

const ADD_CONTENT_SECTIONS = [
  { type: 'personal-info' as SectionType, label: 'Personal Info', icon: '👤', desc: 'Your name, headline, email, phone, location, and links (LinkedIn, portfolio).' },
  { type: 'summary' as SectionType, label: 'Summary', icon: '📝', desc: 'A short professional summary or objective at the top of your resume.' },
  { type: 'education' as SectionType, label: 'Education', icon: '🎓', desc: 'Add your degrees and schools. Include your focus, honors, or exchange terms.' },
  { type: 'experience' as SectionType, label: 'Professional Experience', icon: '💼', desc: 'Add your professional roles and employer history including internships.' },
  { type: 'skills' as SectionType, label: 'Skills', icon: '🧠', desc: 'Add your hard and soft skills that help you stand out from the crowd today.' },
  { type: 'languages' as SectionType, label: 'Languages', icon: '🌍', desc: 'Add your languages and proficiency level to show your communication range.' },
  { type: 'awards' as SectionType, label: 'Certificates', icon: '🏅', desc: 'Add your industry certificates or licences. Include issuer and date earned.' },
  { type: 'interests' as SectionType, label: 'Interests', icon: '✨', desc: 'Add relevant personal interests that support your career story and cultural fit.' },
  { type: 'projects' as SectionType, label: 'Projects', icon: '📁', desc: 'Add key projects you participated in and highlight your challenges, role, and impact.' },
  { type: 'courses' as SectionType, label: 'Courses', icon: '📖', desc: 'Add online or in-person courses and trainings you joined and completed.' },
  { type: 'achievements' as SectionType, label: 'Awards', icon: '🏆', desc: 'Add your awards and recognitions from industry, competitions, or academia.' },
  { type: 'organisations' as SectionType, label: 'Organisations', icon: '🏢', desc: 'Add your memberships or volunteering with organisations including your role.' },
  { type: 'publications' as SectionType, label: 'Publications', icon: '📚', desc: 'Add publications, articles, or books you wrote or contributed to.' },
  { type: 'references' as SectionType, label: 'References', icon: '🤝', desc: 'Add your references from managers or coworkers, including their contact details.' },
  { type: 'declaration' as SectionType, label: 'Declaration', icon: '✍️', desc: 'Add your declaration by creating or uploading your personal signature.' },
  { type: 'custom' as SectionType, label: 'Custom', icon: '🧩', desc: 'Add a custom section for anything else, or combine sections cleanly.' },
];

// ─── AI button row ────────────────────────────────────────────────────────────
function AIButtons({ actions }: { actions: string[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mt-2">
      <Bot className="w-5 h-5 text-violet-400" />
      {actions.map(a => (
        <button key={a} className="px-3 py-1 rounded-full border border-violet-200 text-violet-600 text-xs font-medium hover:bg-violet-50 transition-colors">
          {a}
        </button>
      ))}
    </div>
  );
}

// ─── Rich text toolbar (static UI, textarea beneath) ─────────────────────────
function RichTextarea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="border rounded-xl overflow-hidden bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b bg-white">
        {[
          { label: 'B', style: 'font-bold text-sm' },
          { label: 'I', style: 'italic text-sm' },
          { label: 'U', style: 'underline text-sm' },
        ].map(({ label, style }) => (
          <button key={label} className={`w-7 h-7 rounded hover:bg-gray-100 ${style} text-gray-700 flex items-center justify-center`}>{label}</button>
        ))}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor"><path d="M2 4h1.5l1 8H2zm3 0h1.5l1 8H5zm-1 2h8v1H4zm0 3h8v1H4z"/></svg>
        </button>
        <button className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500">
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        {/* Alignment buttons */}
        {['left', 'center', 'right', 'justify'].map(a => (
          <button key={a} className={`w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center ${a === 'left' ? 'bg-violet-100' : ''}`}>
            <svg viewBox="0 0 16 16" className="w-4 h-4 text-gray-600" fill="currentColor">
              {a === 'left' && <><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="6" width="10" height="2" rx="1"/><rect x="1" y="10" width="14" height="2" rx="1"/><rect x="1" y="14" width="8" height="2" rx="1"/></>}
              {a === 'center' && <><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3" y="6" width="10" height="2" rx="1"/><rect x="1" y="10" width="14" height="2" rx="1"/><rect x="3" y="14" width="10" height="2" rx="1"/></>}
              {a === 'right' && <><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="5" y="6" width="10" height="2" rx="1"/><rect x="1" y="10" width="14" height="2" rx="1"/><rect x="7" y="14" width="8" height="2" rx="1"/></>}
              {a === 'justify' && <><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="6" width="14" height="2" rx="1"/><rect x="1" y="10" width="14" height="2" rx="1"/><rect x="1" y="14" width="14" height="2" rx="1"/></>}
            </svg>
          </button>
        ))}
      </div>
      <Textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            const ta = taRef.current;
            if (!ta) return;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            // Insert newline — each line becomes a bullet point
            const newVal = value.slice(0, start) + '\n' + value.slice(end);
            onChange(newVal);
            requestAnimationFrame(() => {
              ta.selectionStart = ta.selectionEnd = start + 1;
            });
          }
        }}
        placeholder={placeholder}
        rows={rows}
        className="border-0 bg-gray-50 resize-none rounded-none focus-visible:ring-0 text-sm"
      />
      <div className="px-3 py-1.5 border-t bg-white">
        <span className="text-[10px] text-gray-400">
          Press <kbd className="px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-[10px]">Shift+Enter</kbd> to add a new bullet point
        </span>
      </div>
    </div>
  );
}

// ─── Edit Entry Modal ─────────────────────────────────────────────────────────
function EditEntry({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#f0ede8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
        {/* Done button */}
        <div className="p-4">
          <button onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Check className="w-5 h-5" /> Done
          </button>
        </div>
        <div className="text-center pb-4">
          <button className="text-xs text-gray-500 flex items-center justify-center gap-1 mx-auto hover:text-gray-700">
            <Pencil className="w-3 h-3" /> Go to section design settings
          </button>
        </div>
      </div>
    </div>
  );
}

function EntryCard({ children, onDelete }: { children: React.ReactNode; icon?: string; label?: string; onDelete?: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-[#1e1548]">Edit Entry</h3>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <Lightbulb className="w-4 h-4" /> Get Tips
          </button>
          <button className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">
            <Eye className="w-4 h-4 text-gray-400" />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-red-50">
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── PERSONAL INFO section card ───────────────────────────────────────────────
function PersonalInfoCard({ versionId, section }: { versionId: string; section: any }) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const c = section.content;
  const upd = (patch: any) => store.updateSectionContent(versionId, section.id, patch);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header: click to expand/collapse */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <GripVertical className="w-5 h-5 text-gray-300 flex-shrink-0" />
        <span className="text-xl flex-shrink-0">{SECTION_ICONS['personal-info']}</span>
        <span className="flex-1 font-bold text-[#1e1548] text-sm uppercase tracking-wide">
          {section.title || 'Personal Info'}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {open && (
        <div className="border-t p-5 space-y-4 relative">
          {/* Edit FAB */}
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Pencil className="w-4 h-4" />
          </button>

          <div>
            <p className="font-bold text-xl text-[#1e1548]">{c.fullName || 'Your Name'}</p>
            <p className="text-gray-400 text-sm">{c.headline || 'Professional Title'}</p>
          </div>

          {/* Contact items */}
          <div className="space-y-2">
            {c.email && <div className="flex items-center gap-3 text-sm text-gray-600"><span className="text-lg">✉️</span>{c.email}</div>}
            {c.phone && <div className="flex items-center gap-3 text-sm text-gray-600"><span className="text-lg">📞</span>{c.phone}</div>}
            {(c.city || c.country) && <div className="flex items-center gap-3 text-sm text-gray-600"><span className="text-lg">📍</span>{[c.city, c.country].filter(Boolean).join(', ')}</div>}
            {c.linkedin && <div className="flex items-center gap-3 text-sm text-gray-600"><span className="text-lg">🔗</span>{c.linkedin}</div>}
            {c.github && <div className="flex items-center gap-3 text-sm text-gray-600"><span className="text-lg">💻</span>{c.github}</div>}
            {c.portfolio && <div className="flex items-center gap-3 text-sm text-gray-600"><span className="text-lg">🌐</span>{c.portfolio}</div>}
          </div>

          {/* Photo placeholder */}
          <div className="absolute top-14 right-4 w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>

          {/* Edit fields */}
          <div className="pt-2 border-t space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs font-semibold text-gray-700">Full Name</Label>
            <Input value={c.fullName || ''} onChange={e => upd({ fullName: e.target.value })} placeholder="Your full name" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-semibold text-gray-700">Professional Title</Label>
            <Input value={c.headline || ''} onChange={e => upd({ headline: e.target.value })} placeholder="e.g. Software Developer" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Email</Label>
            <Input value={c.email || ''} onChange={e => upd({ email: e.target.value })} placeholder="you@email.com" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Phone</Label>
            <Input value={c.phone || ''} onChange={e => upd({ phone: e.target.value })} placeholder="+91 99999 99999" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">City</Label>
            <Input value={c.city || ''} onChange={e => upd({ city: e.target.value })} placeholder="Bangalore" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Country</Label>
            <Input value={c.country || ''} onChange={e => upd({ country: e.target.value })} placeholder="India" />
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-semibold text-gray-900">LinkedIn</Label>
            <div className="flex gap-2 mt-1.5">
              <Input value={c.linkedin || ''} onChange={e => upd({ linkedin: e.target.value })} placeholder="Paste your LinkedIn URL" className="flex-1 rounded-lg bg-muted/50 border-border" />
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-100 border border-violet-300 text-violet-700 text-xs font-medium shrink-0">
                <Link className="w-3.5 h-3.5" /> Link
              </span>
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-semibold text-gray-900">GitHub</Label>
            <div className="flex gap-2 mt-1.5">
              <Input value={c.github || ''} onChange={e => upd({ github: e.target.value })} placeholder="Paste your GitHub URL" className="flex-1 rounded-lg bg-muted/50 border-border" />
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-100 border border-violet-300 text-violet-700 text-xs font-medium shrink-0">
                <Link className="w-3.5 h-3.5" /> Link
              </span>
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-semibold text-gray-900">Website</Label>
            <div className="flex gap-2 mt-1.5">
              <Input value={c.portfolio || ''} onChange={e => upd({ portfolio: e.target.value })} placeholder="Paste your portfolio or website URL" className="flex-1 rounded-lg bg-muted/50 border-border" />
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-100 border border-violet-300 text-violet-700 text-xs font-medium shrink-0">
                <Link className="w-3.5 h-3.5" /> Link
              </span>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Nationality</Label>
            <Input value={c.nationality || ''} onChange={e => upd({ nationality: e.target.value })} placeholder="Indian" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Date of Birth</Label>
            <Input value={c.dob || ''} onChange={e => upd({ dob: e.target.value })} placeholder="DD/MM/YYYY" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-semibold text-gray-700">Address</Label>
            <Input value={c.address || ''} onChange={e => upd({ address: e.target.value })} placeholder="Street address" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Zip / Postal Code</Label>
            <Input value={c.zipCode || ''} onChange={e => upd({ zipCode: e.target.value })} placeholder="560001" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Twitter / X</Label>
            <Input value={c.twitter || ''} onChange={e => upd({ twitter: e.target.value })} placeholder="@handle" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">WhatsApp</Label>
            <Input value={c.whatsapp || ''} onChange={e => upd({ whatsapp: e.target.value })} placeholder="+91 99999 99999" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-700">Skype</Label>
            <Input value={c.skype || ''} onChange={e => upd({ skype: e.target.value })} placeholder="live:yourskype" />
          </div>
        </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generic collapsible section card ─────────────────────────────────────────
function SectionCard({ title, icon, children, footer }: { title: string; icon: string; children?: React.ReactNode; footer?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <GripVertical className="w-5 h-5 text-gray-300 cursor-grab" />
        <span className="text-xl">{icon}</span>
        {editingTitle ? (
          <input value={localTitle} onChange={e => setLocalTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)} autoFocus
            className="flex-1 font-bold text-[#1e1548] text-sm bg-transparent border-b border-violet-400 outline-none" onClick={e => e.stopPropagation()} />
        ) : (
          <span className="flex-1 font-bold text-[#1e1548] text-sm uppercase tracking-wide">{localTitle}</span>
        )}
        {!editingTitle && open && (
          <button onClick={e => { e.stopPropagation(); setEditingTitle(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
            <Pencil className="w-3 h-3" /> Edit Heading
          </button>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {/* Body */}
      {open && (
        <>
          {children && <div className="border-t">{children}</div>}
          {footer && <div className="border-t px-5 py-3 flex items-center justify-between" onClick={e => e.stopPropagation()}>{footer}</div>}
        </>
      )}
    </div>
  );
}

// ─── Entry row (drag handle + eye) ────────────────────────────────────────────
function EntryRow({ label, sublabel, onEdit, onHide }: { label: string; sublabel?: string; onEdit: () => void; onHide?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b last:border-b-0 cursor-pointer hover:bg-gray-50/50" onClick={onEdit}>
      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab active:cursor-grabbing" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm text-[#1e1548]">{label}</span>
        {sublabel && <span className="text-gray-400 text-sm">, {sublabel}</span>}
      </div>
      <button onClick={e => { e.stopPropagation(); onHide?.(); }} className="flex-shrink-0">
        <Eye className="w-5 h-5 text-gray-300 hover:text-gray-500" />
      </button>
    </div>
  );
}

// ─── Draggable list of entries (reorder inside a section) ─────────────────────
function DraggableEntryList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[];
  onReorder: (orderedIds: string[]) => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = items.map(i => i.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    const newIds = [...ids];
    newIds.splice(fromIdx, 1);
    newIds.splice(toIdx, 0, dragId);
    onReorder(newIds);
    setDragId(null);
    setDragOverId(null);
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg bg-gray-100 p-2">
      {items.map(item => (
        <div
          key={item.id}
          draggable
          onDragStart={() => setDragId(item.id)}
          onDragOver={e => { e.preventDefault(); setDragOverId(item.id); }}
          onDrop={() => handleDrop(item.id)}
          onDragEnd={() => { setDragId(null); setDragOverId(null); }}
          className={`rounded-lg border border-gray-200 bg-white transition-colors overflow-hidden ${
            dragOverId === item.id ? 'border-violet-400 bg-violet-50/80 ring-1 ring-violet-200' : 'hover:border-gray-300'
          }`}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// ─── EDUCATION section ────────────────────────────────────────────────────────
function EducationSection({ versionId, section }: { versionId: string; section: any }) {
  const store = useStore();
  const schools: Education[] = section.content.schools || [];
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingSchool = schools.find(s => s.id === editingId);

  const addNew = () => {
    store.addEducation(versionId, { school: '', degree: '', startDate: '', endDate: '', location: '' });
  };

  const upd = (id: string, patch: Partial<Education>) => store.updateEducation(versionId, id, patch);

  return (
    <SectionCard title={section.title} icon="🎓"
      footer={
        <>
          <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700"><span className="text-lg">📅</span></button>
          <button onClick={addNew}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#1e1548] hover:bg-gray-50">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
          <button onClick={(e) => { e.stopPropagation(); store.deleteSection(versionId, section.id); }} className="text-gray-400 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      }>
      <DraggableEntryList
        items={schools}
        onReorder={ids => store.reorderEducation(versionId, ids)}
        renderItem={edu => (
          <EntryRow label={edu.degree || 'New Education'} sublabel={edu.school} onEdit={() => setEditingId(edu.id)} />
        )}
      />
      {editingId && editingSchool && (
        <EditEntry onClose={() => setEditingId(null)}>
          <EntryCard onDelete={() => { store.deleteEducation(versionId, editingId); setEditingId(null); }}>
            <div>
              <Label className="font-semibold text-sm">School</Label>
              <div className="flex gap-2 mt-1">
                <Input value={editingSchool.school} onChange={e => upd(editingId, { school: e.target.value })} placeholder="Enter school / university" className="flex-1" />
                <button className="px-3 py-2 rounded-xl border text-sm text-gray-500 flex items-center gap-1 whitespace-nowrap">
                  <ExternalLink className="w-3.5 h-3.5" /> Link
                </button>
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">Degree</Label>
              <Input value={editingSchool.degree} onChange={e => upd(editingId, { degree: e.target.value })} placeholder="Enter Degree / Field Of Study / Exchange Semester" className="mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="font-semibold text-sm">Start Date</Label>
                <div className="mt-1">
                  <MonthYearPicker value={editingSchool.startDate || ''} onChange={v => upd(editingId, { startDate: v })} placeholder="Start date" />
                </div>
              </div>
              <div>
                <Label className="font-semibold text-sm">End Date</Label>
                <div className="mt-1">
                  <MonthYearPicker value={editingSchool.endDate || ''} onChange={v => upd(editingId, { endDate: v })} placeholder="End date" allowPresent={true} />
                </div>
              </div>
              <div>
                <Label className="font-semibold text-sm">Location</Label>
                <Input value={editingSchool.location || ''} onChange={e => upd(editingId, { location: e.target.value })} placeholder="City, Country" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">Description</Label>
              <div className="mt-1">
                <RichTextarea value={editingSchool.grade || ''} onChange={v => upd(editingId, { grade: v })} placeholder="Add a description of your education entry..." />
              </div>
            </div>
            <AIButtons actions={['Improve Writing', 'Suggest Content', 'Grammar Check', 'Shorter']} />
          </EntryCard>
        </EditEntry>
      )}
    </SectionCard>
  );
}

// ─── EXPERIENCE section ───────────────────────────────────────────────────────
function ExperienceSection({ versionId, section }: { versionId: string; section: any }) {
  const store = useStore();
  const roles: Experience[] = section.content.roles || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRole = roles.find(r => r.id === editingId);

  const addNew = () => store.addExperience(versionId, { company: '', title: '', startDate: '', endDate: '', bullets: [] });
  const upd = (id: string, patch: Partial<Experience>) => store.updateExperience(versionId, id, patch);

  return (
    <SectionCard title={section.title} icon="💼"
      footer={
        <>
          <button className="flex items-center gap-1 text-gray-500"><span className="text-lg">📅</span></button>
          <button onClick={addNew}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#1e1548] hover:bg-gray-50">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
          <button onClick={(e) => { e.stopPropagation(); store.deleteSection(versionId, section.id); }} className="text-gray-400 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      }>
      <DraggableEntryList
        items={roles}
        onReorder={ids => store.reorderExperience(versionId, ids)}
        renderItem={role => (
          <EntryRow label={role.title || role.company || 'New Entry'} sublabel={role.company} onEdit={() => setEditingId(role.id)} />
        )}
      />
      {editingId && editingRole && (
        <EditEntry onClose={() => setEditingId(null)}>
          <EntryCard onDelete={() => { store.deleteExperience(versionId, editingId); setEditingId(null); }}>
            <div>
              <Label className="font-semibold text-sm">Employer</Label>
              <div className="flex gap-2 mt-1">
                <Input value={editingRole.company} onChange={e => upd(editingId, { company: e.target.value })} placeholder="Enter employer" className="flex-1" />
                <button className="px-3 py-2 rounded-xl border text-sm text-gray-500 flex items-center gap-1 whitespace-nowrap">
                  <ExternalLink className="w-3.5 h-3.5" /> Link
                </button>
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">Job Title</Label>
              <Input value={editingRole.title} onChange={e => upd(editingId, { title: e.target.value })} placeholder="Enter Job Title" className="mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="font-semibold text-sm">Start Date</Label>
                <div className="mt-1">
                  <MonthYearPicker value={editingRole.startDate} onChange={v => upd(editingId, { startDate: v })} placeholder="Start date" />
                </div>
              </div>
              <div>
                <Label className="font-semibold text-sm">End Date</Label>
                <div className="mt-1">
                  <MonthYearPicker value={editingRole.endDate} onChange={v => upd(editingId, { endDate: v })} placeholder="End date" allowPresent={true} />
                </div>
              </div>
              <div>
                <Label className="font-semibold text-sm">Location</Label>
                <Input value={editingRole.location || ''} onChange={e => upd(editingId, { location: e.target.value })} placeholder="City, Country" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">Description</Label>
              <div className="mt-1">
                <RichTextarea
                  value={editingRole.bullets.join('\n')}
                  onChange={v => upd(editingId, { bullets: v.split('\n').filter(Boolean) })}
                  placeholder="Describe your role & achievements"
                  rows={5}
                />
              </div>
            </div>
            <AIButtons actions={['Improve Writing', 'Suggest Content', 'Grammar Check', 'Shorter']} />
          </EntryCard>
        </EditEntry>
      )}
    </SectionCard>
  );
}

// ─── SKILLS section ───────────────────────────────────────────────────────────
function SkillsSection({ versionId, section }: { versionId: string; section: any }) {
  const store = useStore();
  const groups: SkillGroup[] = section.content.groups || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingGroup = groups.find(g => g.id === editingId);

  const addNew = () => store.addSkillGroup(versionId, 'New Skill Group');

  return (
    <SectionCard title={section.title} icon="🧠"
      footer={
        <>
          <button onClick={addNew}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#1e1548] hover:bg-gray-50">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#5b21b6' }}>
            <Bot className="w-4 h-4" /> AI Skill Suggestions
          </button>
          <button onClick={(e) => { e.stopPropagation(); store.deleteSection(versionId, section.id); }} className="text-gray-400 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      }>
      <DraggableEntryList
        items={groups}
        onReorder={ids => store.reorderSkillGroups(versionId, ids)}
        renderItem={group => (
          <EntryRow label={group.heading || 'New Group'} sublabel={group.items.join(', ').slice(0, 40)} onEdit={() => setEditingId(group.id)} />
        )}
      />
      {editingId && editingGroup && (
        <EditEntry onClose={() => setEditingId(null)}>
          <EntryCard onDelete={() => { store.removeSkillGroup(versionId, editingId); setEditingId(null); }}>
            <div>
              <Label className="font-semibold text-sm">Skill</Label>
              <Input value={editingGroup.heading}
                onChange={e => store.updateSkillGroupHeading(versionId, editingGroup.id, e.target.value)}
                placeholder="Enter Skill" className="mt-1" />
            </div>
            <div>
              <Label className="font-semibold text-sm">Information / Sub-skills</Label>
              <div className="mt-1">
                <RichTextarea
                  value={editingGroup.items.join('\n')}
                  onChange={v => store.updateSkillGroupItems(versionId, editingGroup.id, v.split('\n').filter(Boolean))}
                  placeholder="Enter information or sub-skills"
                />
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">Skill level</Label>
              <select className="w-full mt-1 border rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-500 appearance-none">
                <option value="">Select skill level</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>
            </div>
          </EntryCard>
        </EditEntry>
      )}
    </SectionCard>
  );
}

// ─── SUMMARY section ──────────────────────────────────────────────────────────
function SummarySection({ versionId, section }: { versionId: string; section: any }) {
  const store = useStore();
  const [editing, setEditing] = useState(false);

  return (
    <SectionCard title={section.title} icon="🪪"
      footer={
        <>
          <button onClick={() => setEditing(true)}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#1e1548] hover:bg-gray-50">
            <Pencil className="w-4 h-4" /> Edit Entry
          </button>
          <button onClick={(e) => { e.stopPropagation(); store.deleteSection(versionId, section.id); }} className="text-gray-400 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      }>
      {section.content.text && (
        <div className="px-5 py-3 text-sm text-gray-600 line-clamp-2">{section.content.text}</div>
      )}
      {editing && (
        <EditEntry onClose={() => setEditing(false)}>
          <EntryCard>
            <div>
              <Label className="font-semibold text-sm">Professional Profile</Label>
              <div className="mt-1">
                <RichTextarea
                  value={section.content.text || ''}
                  onChange={v => store.updateSectionContent(versionId, section.id, { text: v })}
                  placeholder="Write a professional summary or objective statement that highlights your key qualifications and career goals..."
                  rows={6}
                />
              </div>
              <AIButtons actions={['Improve Writing', 'Grammar Check', 'Shorter']} />
            </div>
          </EntryCard>
        </EditEntry>
      )}
    </SectionCard>
  );
}

// ─── PROJECTS section ─────────────────────────────────────────────────────────
function ProjectsSection({ versionId, section }: { versionId: string; section: any }) {
  const store = useStore();
  const projects: Project[] = section.content.projects || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingProject = projects.find(p => p.id === editingId);

  const addNew = () => store.addProject(versionId, { name: '', role: '', startDate: '', endDate: '', techStack: [], link: '', bullets: [] });
  const upd = (id: string, patch: Partial<Project>) => store.updateProject(versionId, id, patch);

  return (
    <SectionCard title={section.title} icon="📁"
      footer={
        <>
          <button onClick={addNew}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#1e1548] hover:bg-gray-50">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
          <button onClick={(e) => { e.stopPropagation(); store.deleteSection(versionId, section.id); }} className="text-gray-400 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      }>
      <DraggableEntryList
        items={projects}
        onReorder={ids => store.reorderProjects(versionId, ids)}
        renderItem={proj => (
          <EntryRow label={proj.name || 'New Project'} sublabel={proj.role || undefined} onEdit={() => setEditingId(proj.id)} />
        )}
      />
      {editingId && editingProject && (
        <EditEntry onClose={() => setEditingId(null)}>
          <EntryCard onDelete={() => { store.deleteProject(versionId, editingId); setEditingId(null); }}>
            <div>
              <Label className="font-semibold text-sm">Project title</Label>
              <div className="flex gap-2 mt-1">
                <Input value={editingProject.name} onChange={e => upd(editingId, { name: e.target.value })} placeholder="Enter Project title" className="flex-1" />
                <button className="px-3 py-2 rounded-xl border text-sm text-gray-500 flex items-center gap-1 whitespace-nowrap">
                  <ExternalLink className="w-3.5 h-3.5" /> Link
                </button>
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">Sub title</Label>
              <Input value={editingProject.role || ''} onChange={e => upd(editingId, { role: e.target.value })} placeholder="Enter sub title" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-semibold text-sm">Start Date</Label>
                <div className="mt-1">
                  <MonthYearPicker value={editingProject.startDate || ''} onChange={v => upd(editingId, { startDate: v })} placeholder="Start date" />
                </div>
              </div>
              <div>
                <Label className="font-semibold text-sm">End Date</Label>
                <div className="mt-1">
                  <MonthYearPicker value={editingProject.endDate || ''} onChange={v => upd(editingId, { endDate: v })} placeholder="End date" allowPresent={true} />
                </div>
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">Description</Label>
              <div className="mt-1">
                <RichTextarea
                  value={editingProject.bullets.join('\n')}
                  onChange={v => upd(editingId, { bullets: v.split('\n').filter(Boolean) })}
                  placeholder="Describe the project and its outcomes..."
                  rows={5}
                />
              </div>
            </div>
            <AIButtons actions={['Improve Writing', 'Suggest Content', 'Grammar Check', 'Shorter']} />
          </EntryCard>
        </EditEntry>
      )}
    </SectionCard>
  );
}

// ─── CERTIFICATIONS section ───────────────────────────────────────────────────
function CertificationsSection({ versionId, section }: { versionId: string; section: any }) {
  const store = useStore();
  const certs: Certification[] = section.content.certifications || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingCert = certs.find(c => c.id === editingId);

  const addNew = () => store.addCertification(versionId, { name: '', issuer: '' });
  const upd = (id: string, patch: Partial<Certification>) => store.updateCertification(versionId, id, patch);

  return (
    <SectionCard title={section.title} icon="🏅"
      footer={
        <>
          <button onClick={addNew}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#1e1548] hover:bg-gray-50">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
          <button onClick={(e) => { e.stopPropagation(); store.deleteSection(versionId, section.id); }} className="text-gray-400 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      }>
      <DraggableEntryList
        items={certs}
        onReorder={ids => store.reorderCertifications(versionId, ids)}
        renderItem={cert => (
          <EntryRow label={cert.name || 'New Certificate'} sublabel={cert.issuer} onEdit={() => setEditingId(cert.id)} />
        )}
      />
      {editingId && editingCert && (
        <EditEntry onClose={() => setEditingId(null)}>
          <EntryCard onDelete={() => { store.deleteCertification(versionId, editingId); setEditingId(null); }}>
            <div>
              <Label className="font-semibold text-sm">Certificate Name</Label>
              <Input value={editingCert.name} onChange={e => upd(editingId, { name: e.target.value })} placeholder="Enter certificate name" className="mt-1" />
            </div>
            <div>
              <Label className="font-semibold text-sm">Issuing Organization</Label>
              <Input value={editingCert.issuer} onChange={e => upd(editingId, { issuer: e.target.value })} placeholder="Enter issuer" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-semibold text-sm">Issue Date</Label>
                <div className="mt-1">
                  <MonthYearPicker value={editingCert.issueDate || ''} onChange={v => upd(editingId, { issueDate: v })} placeholder="Issue date" />
                </div>
              </div>
              <div>
                <Label className="font-semibold text-sm">Expiry Date</Label>
                <div className="mt-1">
                  <MonthYearPicker value={editingCert.expiryDate || ''} onChange={v => upd(editingId, { expiryDate: v })} placeholder="Expiry date" allowPresent={true} />
                </div>
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">Credential URL</Label>
              <Input value={editingCert.credentialUrl || ''} onChange={e => upd(editingId, { credentialUrl: e.target.value })} placeholder="https://..." className="mt-1" />
            </div>
          </EntryCard>
        </EditEntry>
      )}
    </SectionCard>
  );
}

// ─── CUSTOM / generic section ─────────────────────────────────────────────────
function CustomSection({ versionId, section }: { versionId: string; section: any }) {
  const store = useStore();
  const [editing, setEditing] = useState(false);

  return (
    <SectionCard title={section.title} icon={SECTION_ICONS[section.type] || '🧩'}
      footer={
        <>
          <button onClick={() => setEditing(true)}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#1e1548] hover:bg-gray-50">
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); store.deleteSection(versionId, section.id); }} className="text-gray-400 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      }>
      {editing && (
        <EditEntry onClose={() => setEditing(false)}>
          <EntryCard>
            <div>
              <Label className="font-semibold text-sm">{section.title}</Label>
              <div className="mt-1">
                <RichTextarea
                  value={section.content.text || ''}
                  onChange={v => store.updateSectionContent(versionId, section.id, { text: v })}
                  placeholder={`Add content for ${section.title}...`}
                />
              </div>
            </div>
          </EntryCard>
        </EditEntry>
      )}
    </SectionCard>
  );
}

// ─── ADD CONTENT MODAL ────────────────────────────────────────────────────────
function AddContentModal({ versionId, onClose }: { versionId: string; onClose: () => void }) {
  const store = useStore();

  const add = (type: SectionType, label: string) => {
    store.addSection(versionId, { type, title: label, visible: true, content: {} });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 pt-16 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-4xl p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-8">
          <h2 className="font-bold text-4xl text-[#1e1548]">Add content</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {ADD_CONTENT_SECTIONS.map(({ type, label, icon, desc }) => (
            <button key={type} onClick={() => add(type, label)}
              className={`p-4 rounded-xl border text-left hover:border-violet-400 hover:bg-violet-50/50 transition-all ${type === 'custom' ? 'border-dashed border-2' : 'border'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="font-semibold text-sm text-[#1e1548]">{label}</span>
              </div>
              <p className="text-xs text-gray-500 leading-snug">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function ContentTab({ versionId }: { versionId: string }) {
  const store = useStore();
  const version = store.versions.find(v => v.id === versionId);
  const [addContentOpen, setAddContentOpen] = useState(false);

  if (!version) return null;

  const sections = [...version.sections].sort((a, b) => a.order - b.order).filter(s => s.visible);

  const renderSection = (section: typeof sections[0]) => {
    switch (section.type) {
      case 'personal-info': return <PersonalInfoCard key={section.id} versionId={versionId} section={section} />;
      case 'education': return <EducationSection key={section.id} versionId={versionId} section={section} />;
      case 'experience': return <ExperienceSection key={section.id} versionId={versionId} section={section} />;
      case 'skills': return <SkillsSection key={section.id} versionId={versionId} section={section} />;
      case 'summary': return <SummarySection key={section.id} versionId={versionId} section={section} />;
      case 'projects': return <ProjectsSection key={section.id} versionId={versionId} section={section} />;
      case 'awards': return <CertificationsSection key={section.id} versionId={versionId} section={section} />;
      default: return <CustomSection key={section.id} versionId={versionId} section={section} />;
    }
  };

  return (
    <div className="space-y-3 pb-24">
      {sections.map(renderSection)}

      {/* Add Content button */}
      <button onClick={() => setAddContentOpen(true)}
        className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus className="w-5 h-5" /> Add Content
      </button>

      {addContentOpen && <AddContentModal versionId={versionId} onClose={() => setAddContentOpen(false)} />}
    </div>
  );
}
