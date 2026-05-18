'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Workflow, MoreVertical, Copy, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/back-button';
import { useStore } from '@/lib/store';
import { toastSectionAdded, toastSectionDeleted } from '@/lib/toast-helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

interface PageProps {
  params: {
    resumeId: string;
  };
}

export default function VersionsPage({ params }: PageProps) {
  const { resumeId } = params;
  const router = useRouter();
  const store = useStore();
  
  const resume = store.resumes.find((r) => r.id === resumeId);
  const versions = store.getResumeVersions(resumeId);
  
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

  useEffect(() => {
    if (!resume) {
      router.push('/my-resumes');
    }
  }, [resume, router]);

  const handleOpen = (versionId: string) => {
    router.push(`/editor/${resumeId}?versionId=${versionId}`);
  };

  const handleDuplicate = (versionId: string) => {
    store.duplicateVersion(resumeId, versionId);
    toastSectionAdded('Version duplicated');
  };

  const handleDelete = (versionId: string) => {
    if (versions.length > 1) {
      store.deleteSection(versionId, versionId);
      toastSectionDeleted('Version deleted');
      setDeleteConfirm({ open: false, id: '' });
    }
  };

  const handleRename = (versionId: string) => {
    if (renameValue.trim()) {
      store.renameVersion(versionId, renameValue);
      setRenamingId(null);
      setRenameValue('');
    }
  };

  const handleToggleSelect = (versionId: string) => {
    setSelectedVersions((prev) => {
      const updated = prev.includes(versionId)
        ? prev.filter((id) => id !== versionId)
        : [...prev, versionId];
      return updated.slice(-2);
    });
  };

  if (!resume) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <BackButton breadcrumb={`My Resumes / ${resume.name}`} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Versions for: <span className="text-primary">{resume.name}</span>
              </h1>
              <p className="text-muted-foreground mt-2">{versions.length} versions available</p>
            </div>
            <div className="flex gap-2">
              {selectedVersions.length === 2 && (
                <Button variant="outline" size="sm" disabled className="gap-2">
                  <Workflow className="w-4 h-4" />
                  Compare (Preview)
                </Button>
              )}
              <Button size="sm" className="gap-2" disabled>
                <Plus className="w-4 h-4" />
                Create Version
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition cursor-pointer"
              onClick={() => handleToggleSelect(version.id)}
            >
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={selectedVersions.includes(version.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggleSelect(version.id);
                  }}
                  className="w-4 h-4"
                />
                <div>
                  {renamingId === version.id ? (
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(version.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(version.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className="mb-1"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className="font-semibold">{version.name}</h3>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen(version.id);
                  }}
                >
                  Open
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(version.id);
                        setRenameValue(version.name);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(version.id);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ open: true, id: version.id });
                      }}
                      className="text-destructive"
                      disabled={versions.length === 1}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteConfirm.id)}>
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
