'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Version } from '@/app/versions/page';
import VersionCard from './version-card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface VersionsListProps {
  versions: Version[];
  selectedVersions: string[];
  onToggleSelect: (versionId: string) => void;
  onRename: (versionId: string, newName: string) => void;
  onUpdateNotes: (versionId: string, notes: string) => void;
  onDuplicate: (versionId: string) => void;
  onDelete: (versionId: string) => void;
  editingNotes: { [key: string]: string };
  setEditingNotes: (notes: { [key: string]: string }) => void;
}

export default function VersionsList({
  versions,
  selectedVersions,
  onToggleSelect,
  onRename,
  onUpdateNotes,
  onDuplicate,
  onDelete,
  editingNotes,
  setEditingNotes,
}: VersionsListProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set(['v1']));

  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const sortedVersions = [...versions].reverse();

  return (
    <div className="space-y-3">
      {sortedVersions.map((version) => (
        <div
          key={version.id}
          className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors"
        >
          {/* Version Header */}
          <div className="flex items-center gap-3 p-4 bg-muted/30">
            <Checkbox
              checked={selectedVersions.includes(version.id)}
              onCheckedChange={() => onToggleSelect(version.id)}
              className="mt-0.5"
            />

            <button
              onClick={() => toggleExpanded(version.id)}
              className="flex items-center gap-2 flex-1 hover:opacity-70 transition-opacity"
            >
              {expandedVersions.has(version.id) ? (
                <ChevronUp className="w-4 h-4 text-primary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
              <div className="text-left flex-1">
                <h3 className="font-semibold text-foreground">{version.name}</h3>
                <p className="text-sm text-muted-foreground">{version.createdAt}</p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {version.targetRole}
              </span>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedVersions.has(version.id) && (
            <div className="border-t border-border p-4 space-y-4 bg-background/50">
              {/* Notes Section */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Notes</label>
                {editingNotes[version.id] !== undefined ? (
                  <div className="flex gap-2">
                    <Textarea
                      value={editingNotes[version.id]}
                      onChange={(e) =>
                        setEditingNotes({ ...editingNotes, [version.id]: e.target.value })
                      }
                      placeholder="Add notes about this version..."
                      className="flex-1 resize-none"
                      rows={2}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => onUpdateNotes(version.id, editingNotes[version.id])}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newNotes = { ...editingNotes };
                          delete newNotes[version.id];
                          setEditingNotes(newNotes);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingNotes({ ...editingNotes, [version.id]: version.notes })}
                    className="w-full p-3 rounded-lg border border-dashed border-border bg-muted/50 text-left text-foreground hover:border-primary/50 hover:bg-muted transition-colors"
                  >
                    {version.notes || '+ Add notes'}
                  </button>
                )}
              </div>

              {/* Actions */}
              <VersionCard version={version} onRename={onRename} onDuplicate={onDuplicate} onDelete={onDelete} />
            </div>
          )}
        </div>
      ))}

      {versions.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">No versions yet. Create your first version to get started.</p>
        </div>
      )}
    </div>
  );
}
