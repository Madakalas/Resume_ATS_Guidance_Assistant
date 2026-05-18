'use client';

import { useState } from 'react';
import { useStore, SectionType } from '@/lib/store';
import { Eye, EyeOff, Trash2, GripVertical, Plus } from 'lucide-react';

const SECTION_ICONS: Record<string, string> = {
  'personal-info': '👤', summary: '📝', experience: '💼', projects: '📁',
  skills: '🧠', education: '🎓', awards: '🏆', custom: '📋',
  languages: '🌍', volunteer: '🤝', publications: '📚', achievements: '⭐', links: '🔗',
};

const PRESET_SECTIONS: { type: SectionType; label: string }[] = [
  { type: 'languages', label: '🌍 Languages' },
  { type: 'volunteer', label: '🤝 Volunteer' },
  { type: 'publications', label: '📚 Publications' },
  { type: 'achievements', label: '⭐ Achievements' },
  { type: 'links', label: '🔗 Links' },
  { type: 'custom', label: '📋 Custom' },
];

export default function SectionsTab({ versionId }: { versionId: string }) {
  const store = useStore();
  const version = store.versions.find(v => v.id === versionId);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  if (!version) return null;

  const sections = [...version.sections].sort((a, b) => a.order - b.order);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = sections.map(s => s.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    const newIds = [...ids];
    newIds.splice(fromIdx, 1);
    newIds.splice(toIdx, 0, dragId);
    store.reorderSections(versionId, newIds);
    setDragId(null);
    setDragOverId(null);
  };

  const addSection = (type: SectionType, title: string) => {
    store.addSection(versionId, { type, title, visible: true, content: {} });
    setAddingSection(false);
    setCustomTitle('');
  };

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h3 className="font-semibold text-base text-gray-900 mb-1">Manage Sections</h3>
        <p className="text-xs text-gray-500">Drag to reorder · Toggle eye to show/hide · Delete to remove</p>
      </div>

      <div className="space-y-2">
        {sections.map(section => (
          <div
            key={section.id}
            draggable
            onDragStart={() => setDragId(section.id)}
            onDragOver={e => { e.preventDefault(); setDragOverId(section.id); }}
            onDrop={() => handleDrop(section.id)}
            onDragEnd={() => { setDragId(null); setDragOverId(null); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
              dragOverId === section.id ? 'border-violet-400 bg-violet-50 shadow' : 'bg-white border-gray-200 hover:border-gray-300'
            } ${!section.visible ? 'opacity-50' : ''}`}
          >
            <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span className="text-base">{SECTION_ICONS[section.type] || '📋'}</span>
            <span className="flex-1 text-sm font-medium text-gray-800">{section.title}</span>

            <button
              onClick={() => store.toggleSectionVisibility(versionId, section.id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title={section.visible ? 'Hide' : 'Show'}
            >
              {section.visible
                ? <Eye className="w-4 h-4 text-gray-400" />
                : <EyeOff className="w-4 h-4 text-gray-300" />}
            </button>

            {section.type !== 'personal-info' && (
              <button
                onClick={() => store.deleteSection(versionId, section.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add section */}
      {addingSection ? (
        <div className="border rounded-xl p-4 bg-white space-y-3">
          <p className="text-sm font-medium text-gray-700">Add Section</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_SECTIONS.map(({ type, label }) => (
              <button key={type} onClick={() => addSection(type, label.replace(/^.+ /, ''))}
                className="px-3 py-2 text-xs rounded-lg border border-gray-200 hover:border-violet-400 hover:bg-violet-50 text-gray-700 transition-all text-left">
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              placeholder="Custom section name…"
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              onKeyDown={e => e.key === 'Enter' && customTitle.trim() && addSection('custom', customTitle.trim())}
            />
            <button onClick={() => customTitle.trim() && addSection('custom', customTitle.trim())}
              className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors">
              Add
            </button>
            <button onClick={() => { setAddingSection(false); setCustomTitle(''); }}
              className="px-3 py-1.5 text-gray-500 text-sm rounded-lg border hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddingSection(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all">
          <Plus className="w-4 h-4" /> Add Section
        </button>
      )}
    </div>
  );
}
