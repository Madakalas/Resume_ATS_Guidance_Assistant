'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import DashboardContent from '@/components/dashboard-content';
import { AIInsightsPanel } from '@/components/ai-insights-panel';
import { CreateResumeModal } from '@/components/modals/create-resume-modal';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const store = useStore();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  const handleCreateResume = (data: { name: string; role: string }) => {
    const resumeId = store.createResume({ name: data.name, role: data.role });
    if (resumeId) router.push(`/editor/${resumeId}`);
  };

  if (!mounted || authLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-border bg-sidebar">
        <Sidebar />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <DashboardContent
              onCreateClick={() => setCreateModalOpen(true)}
              showEmpty={store.resumes.length === 0}
            />
          </div>
        </div>
        
        {/* AI Insights Panel - hidden on tablet/mobile */}
        <div className="hidden lg:block lg:w-80 border-l border-border">
          <AIInsightsPanel />
        </div>
      </div>

      <CreateResumeModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateResume={handleCreateResume}
      />
    </div>
  );
}
