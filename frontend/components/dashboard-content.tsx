'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResumeCard from '@/components/resume-card';
import EmptyState from '@/components/empty-state';
import { ExportHistoryBar } from '@/components/export-history-bar';
import { useStore } from '@/lib/store';

interface DashboardContentProps {
  onCreateClick: () => void;
  showEmpty: boolean;
}

function formatLastUpdated(updatedAt: string): string {
  const d = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
  return `Updated ${Math.floor(diffDays / 30)} month${diffDays >= 60 ? 's' : ''} ago`;
}

export default function DashboardContent({ onCreateClick, showEmpty }: DashboardContentProps) {
  const store = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [sortBy, setSortBy] = useState('Recently updated');

  const handleCreateAiResume = () => {
    const rid = store.createResume({ name: 'AI-Resume', role: 'AI Generated' });
    router.push(`/editor/${rid}`);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const roles = ['All', 'Backend', 'Full Stack', 'Data', 'General'];
  const sortOptions = ['Recently updated', 'Name', 'Created date'];

  const resumesFromStore = useMemo(() => {
    return store.resumes.map((resume) => {
      const versions = store.getResumeVersions(resume.id);
      const firstVersion = versions[0];
      const sectionCount = firstVersion?.sections?.length ?? 0;
      const total = 7;
      const completed = Math.min(total, sectionCount);
      return {
        id: resume.id,
        name: resume.name,
        role: resume.role || 'General',
        lastUpdated: formatLastUpdated(resume.updatedAt),
        progress: { completed, total },
      };
    });
  }, [store.resumes, store.getResumeVersions]);

  let filtered = resumesFromStore;
  if (selectedRole !== 'All') {
    filtered = filtered.filter((r) => r.role === selectedRole);
  }
  if (searchQuery) {
    filtered = filtered.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if (sortBy === 'Name') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'Recently updated') {
    filtered = [...filtered].sort((a, b) => {
      const rA = store.resumes.find((r) => r.id === a.id);
      const rB = store.resumes.find((r) => r.id === b.id);
      return (rB?.updatedAt ?? '').localeCompare(rA?.updatedAt ?? '');
    });
  }

  if (!mounted) {
    return (
      <main className="flex-1 px-4 md:px-8 py-6 md:py-8">
        <div className="mb-8">
          <div className="h-9 w-48 bg-muted rounded animate-pulse mb-1" />
          <div className="h-5 w-72 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 h-52 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 md:px-8 py-6 md:py-8">
      {showEmpty ? (
        <EmptyState onCreateClick={onCreateClick} />
      ) : (
        <>
          {/* Export History Bar */}
          <ExportHistoryBar />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">Your Resumes</h1>
            <p className="text-muted-foreground">Manage and build your ATS-friendly resumes</p>
          </div>

          {/* Controls Bar */}
          <div className="mb-6 flex flex-col gap-4">
            {/* Top row: Search and Create */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search resumes…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <Button
                onClick={onCreateClick}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 gap-2 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Create New Resume</span>
                <span className="sm:hidden">Create New</span>
              </Button>
              <Button
                onClick={handleCreateAiResume}
                variant="outline"
                className="border-violet-400 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 h-10 gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI-Resume</span>
                <span className="sm:hidden">AI</span>
              </Button>
            </div>

            {/* Bottom row: Filters and Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Role Filter */}
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 border border-border rounded-lg bg-card text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      Role: {role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 border border-border rounded-lg bg-card text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Results count */}
              <div className="text-sm text-muted-foreground py-2 px-4 bg-muted rounded-lg">
                {filtered.length} resume{filtered.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Resume Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((resume) => (
              <ResumeCard
                key={resume.id}
                id={resume.id}
                name={resume.name}
                role={resume.role}
                lastUpdated={resume.lastUpdated}
                progress={resume.progress}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
