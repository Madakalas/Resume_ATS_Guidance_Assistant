'use client';

import { useState } from 'react';
import { MoreVertical, Copy, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Version } from '@/app/versions/page';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VersionCardProps {
  version: Version;
  onRename: (versionId: string, newName: string) => void;
  onDuplicate: (versionId: string) => void;
  onDelete: (versionId: string) => void;
}

export default function VersionCard({
  version,
  onRename,
  onDuplicate,
  onDelete,
}: VersionCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(version.name);

  const handleRenameConfirm = () => {
    if (newName.trim()) {
      onRename(version.id, newName.trim());
      setIsRenaming(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center justify-between">
      {/* Primary Actions */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/editor">
          <Button size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Open
          </Button>
        </Link>
        {isRenaming ? (
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New version name"
              className="h-9 w-40"
              autoFocus
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleRenameConfirm}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsRenaming(false);
                setNewName(version.name);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : null}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => setIsRenaming(true)}
            className="gap-2 cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDuplicate(version.id)}
            className="gap-2 cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(version.id)}
            className="gap-2 cursor-pointer text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
