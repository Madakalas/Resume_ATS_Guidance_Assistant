'use client';

import { Button } from '@/components/ui/button';
import { Copy, Trash2, Download, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onDuplicate,
  onDelete,
  onExport,
}: BulkActionsBarProps) {
  return (
    <div className="mb-6 flex items-center gap-4 p-4 bg-accent/10 border border-accent rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
      <span className="text-sm font-medium text-foreground flex-1">
        {selectedCount} {selectedCount === 1 ? 'resume' : 'resumes'} selected
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          className="flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
