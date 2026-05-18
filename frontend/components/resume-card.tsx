'use client';

import { MoreVertical, Copy, Trash2, Edit2, Check, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { toastSectionAdded, toastSectionDeleted } from '@/lib/toast-helpers';

interface ResumeCardProps {
  id: string;
  name: string;
  role: string;
  lastUpdated: string;
  progress: { completed: number; total: number };
}

export default function ResumeCard({ id, name, role, lastUpdated, progress }: ResumeCardProps) {
  const store = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const progressPercent = (progress.completed / progress.total) * 100;

  useEffect(() => {
    if (renaming) {
      setRenameValue(name);
      setTimeout(() => renameInputRef.current?.select(), 50);
    }
  }, [renaming, name]);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== name) {
      store.renameResume(id, trimmed);
      toastSectionAdded('Resume renamed');
    }
    setRenaming(false);
  };

  const cancelRename = () => {
    setRenameValue(name);
    setRenaming(false);
  };

  const handleRename = (e: Event) => {
    e.preventDefault();
    setRenaming(true);
  };

  const handleDuplicate = (e: Event) => {
    e.preventDefault();
    store.duplicateResume(id);
    toastSectionAdded('Resume duplicated');
  };

  const handleDeleteClick = (e: Event) => {
    e.preventDefault();
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    store.deleteResume(id);
    toastSectionDeleted('Resume deleted');
    setDeleteOpen(false);
  };

  return (
    <div
      className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with name/actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-2">
          {renaming ? (
            /* ── Inline rename UI ── */
            <div
              className="flex items-center gap-1.5 -mx-1 px-1 py-0.5 rounded-lg border border-primary/50 bg-primary/5"
              onClick={(e) => e.preventDefault()}
            >
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') cancelRename();
                }}
                className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-foreground outline-none"
                maxLength={60}
              />
              <button
                type="button"
                onClick={commitRename}
                className="shrink-0 p-1 rounded text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={cancelRename}
                className="shrink-0 p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
                title="Cancel"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h3 className="text-base font-semibold text-foreground line-clamp-2">{name}</h3>
          )}
          <p className="text-xs text-muted-foreground mt-1">{lastUpdated}</p>
        </div>

        {!renaming && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem className="cursor-pointer" onSelect={handleRename}>
                <Edit2 className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onSelect={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-destructive" onSelect={handleDeleteClick}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{name}&quot; and all its versions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Tag */}
      <div className="mb-4">
        <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
          {role}
        </span>
      </div>

      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">Progress</p>
          <p className="text-xs font-semibold text-foreground">
            {progress.completed}/{progress.total}
          </p>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action button */}
      <Link href={`/editor/${id}`}>
        <Button
          className={`w-full h-10 transition-all duration-200 ${
            isHovered
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted'
          }`}
        >
          Open
        </Button>
      </Link>
    </div>
  );
}
