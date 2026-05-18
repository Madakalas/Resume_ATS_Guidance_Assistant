'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import { AIModeThreads, type Thread } from '@/components/ai-mode-threads';
import { AIModeChatView } from '@/components/ai-mode-chat-view';
import { listConversations, createConversation, updateConversation, deleteConversation } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function AiModePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const items = await listConversations();
      const list: Thread[] = items.map((t) => ({
        id: t.id,
        title: t.title || 'New chat',
        preview: t.preview || '',
      }));
      setThreads(list);
      if (list.length > 0) {
        if (!activeThreadId || !list.some((t) => t.id === activeThreadId)) {
          setActiveThreadId(list[0].id);
        }
      } else {
        setActiveThreadId(null);
      }
    } catch {
      setThreads([]);
      setActiveThreadId(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) loadConversations();
  }, [authLoading, isAuthenticated]);

  const handleNewChat = useCallback(async () => {
    try {
      const created = await createConversation({ title: 'New chat', preview: '' });
      setThreads((prev) => [{ id: created.id, title: created.title || 'New chat', preview: created.preview || '' }, ...prev]);
      setActiveThreadId(created.id);
    } catch {
      const newId = `thread-${Date.now()}`;
      setThreads((prev) => [{ id: newId, title: 'New chat', preview: '' }, ...prev]);
      setActiveThreadId(newId);
    }
  }, []);

  const handleRenameThread = useCallback(async (threadId: string, title: string) => {
    try {
      await updateConversation(threadId, { title: title.trim() || 'New chat' });
    } catch { /* ignore */ }
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, title: title.trim() || 'New chat' } : t)));
  }, []);

  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      await deleteConversation(threadId);
    } catch { /* ignore */ }
    const rest = threads.filter((t) => t.id !== threadId);
    setThreads(rest);
    if (activeThreadId === threadId) setActiveThreadId(rest[0]?.id ?? null);
  }, [activeThreadId, threads]);

  // Update thread preview/title after a message is sent
  const handleThreadUpdated = useCallback((threadId: string, updates: { title?: string; preview?: string }) => {
    setThreads((prev) => prev.map((t) => t.id === threadId ? { ...t, ...updates } : t));
  }, []);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 border-r border-border">
        <Sidebar />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-border flex-shrink-0">
          <AIModeThreads
            threads={threads}
            activeThreadId={activeThreadId ?? undefined}
            onSelectThread={setActiveThreadId}
            onNewChat={handleNewChat}
            onRenameThread={handleRenameThread}
            onDeleteThread={handleDeleteThread}
            loading={loading}
          />
          {!isAuthenticated && !loading && (
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Sign in to save your conversations</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full text-xs text-primary underline text-left"
              >
                Sign in →
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {activeThreadId ? (
            <AIModeChatView
              key={activeThreadId}
              threadId={activeThreadId}
              onThreadUpdated={handleThreadUpdated}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <p>No conversations yet.</p>
              <button
                onClick={handleNewChat}
                className="text-sm text-primary underline"
              >
                Start a new chat →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
