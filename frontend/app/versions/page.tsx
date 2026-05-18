'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Sidebar from '@/components/sidebar';
import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui/button';
import VersionsList from '@/components/versions-list';
import { toastSectionAdded, toastSectionDeleted } from '@/lib/toast-helpers';
import { useEscapeBack } from '@/hooks/use-escape-back';

// Custom Version type for the versions page (extends ResumeVersion with UI fields)
export interface Version {
  id: string;
  name: string;
  resumeId: string;
  createdAt: string;
  updatedAt: string;
  targetRole: string;
  notes: string;
}

export default function VersionsPage() {
  const router = useRouter();
  const store = useStore();
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});

  // Handle escape key to go back
  useEscapeBack(() => router.back());

  // Convert ResumeVersion to Version format
  const versions: Version[] = store.versions.map((v) => ({
    id: v.id,
    name: v.name,
    resumeId: v.resumeId,
    createdAt: new Date(v.createdAt).toLocaleDateString(),
    updatedAt: v.updatedAt,
    targetRole: store.resumes.find((r) => r.id === v.resumeId)?.role || 'Unknown',
    notes: '',
  }));

  const handleToggleSelect = (versionId: string) => {
    setSelectedVersions((prev) =>
      prev.includes(versionId)
        ? prev.filter((id) => id !== versionId)
        : [...prev, versionId]
    );
  };

  const handleRename = (versionId: string, newName: string) => {
    store.renameVersion(versionId, newName);
    toastSectionAdded('Version renamed');
  };

  const handleUpdateNotes = (versionId: string, notes: string) => {
    // Notes would be stored in a real app - for now just close the editor
    const newNotes = { ...editingNotes };
    delete newNotes[versionId];
    setEditingNotes(newNotes);
  };

  const handleDuplicate = (versionId: string) => {
    const version = store.versions.find((v) => v.id === versionId);
    if (version) {
      store.duplicateVersion(version.resumeId, versionId);
      toastSectionAdded('Version duplicated');
    }
  };

  const handleDelete = (versionId: string) => {
    store.deleteVersion(versionId);
    toastSectionDeleted('Version deleted');
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 border-r border-border bg-sidebar">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
            <BackButton breadcrumb="Dashboard" />
            <h1 className="text-3xl font-bold text-foreground mt-4">Versions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track your resume versions
            </p>
          </div>
        </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {selectedVersions.length > 0 && (
          <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedVersions.length} version{selectedVersions.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVersions([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        <VersionsList
          versions={versions}
          selectedVersions={selectedVersions}
          onToggleSelect={handleToggleSelect}
          onRename={handleRename}
          onUpdateNotes={handleUpdateNotes}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          editingNotes={editingNotes}
          setEditingNotes={setEditingNotes}
        />
      </div>
      </div>
    </div>
  );
}
