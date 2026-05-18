'use client';

import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export default function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 md:px-8 py-6 md:py-8">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Create your first resume
        </h2>
        
        <p className="text-muted-foreground mb-8">
          Start building an ATS-friendly resume that gets noticed by recruiters and hiring systems.
        </p>
        
        <Button
          onClick={onCreateClick}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Create New Resume
        </Button>
      </div>
    </main>
  );
}
