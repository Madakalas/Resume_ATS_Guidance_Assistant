'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Thread {
  id: string;
  title: string;
  preview?: string;
}

interface AIModeThreadsProps {
  threads: Thread[];
  activeThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onRenameThread?: (threadId: string, title: string) => void;
  onDeleteThread?: (threadId: string) => void;
  loading?: boolean;
}

export function AIModeThreads({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onRenameThread,
  onDeleteThread,
  loading = false,
}: AIModeThreadsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  const handleStartRename = (e: React.MouseEvent, thread: Thread) => {
    e.stopPropagation();
    setEditingId(thread.id);
    setEditTitle(thread.title);
  };

  const handleSaveRename = (threadId: string) => {
    const t = editTitle.trim() || 'New chat';
    onRenameThread?.(threadId, t);
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    onDeleteThread?.(threadId);
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      <div className="p-4 border-b border-border">
        <Button className="w-full gap-2" size="sm" onClick={onNewChat} disabled={loading}>
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {loading ? (
          <div className="text-sm text-muted-foreground p-3">Loading…</div>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              className={`group group flex items-center gap-1 w-full p-2 rounded-lg transition-colors ${
                activeThreadId === thread.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary'
              }`}
            >
              {editingId === thread.id ? (
                <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={inputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(thread.id);
                      if (e.key === 'Escape') { setEditingId(null); setEditTitle(''); }
                    }}
                    onBlur={() => handleSaveRename(thread.id)}
                    className="flex-1 min-w-0 px-2 py-1 text-sm border rounded bg-background"
                  />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectThread(thread.id)}
                    className="flex-1 min-w-0 text-left p-1.5 rounded"
                  >
                    <div className="font-medium text-sm text-foreground truncate">{thread.title}</div>
                    {(thread.preview ?? '').trim() && (
                      <div className="text-xs text-muted-foreground truncate">{thread.preview}</div>
                    )}
                  </button>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(e, thread)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, thread.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        <p>AI resume analysis</p>
      </div>
    </div>
  );
}
