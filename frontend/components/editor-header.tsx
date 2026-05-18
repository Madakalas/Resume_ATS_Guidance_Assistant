'use client';

import { ChevronRight, Download, Share2, Copy, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

export default function EditorHeader() {
  const router = useRouter();

  return (
    <div className="border-b border-border bg-card h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/my-resumes')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">Resume Editor</span>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" disabled>
                <Save className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save (auto-saves)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" disabled>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download PDF (Phase 2)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" disabled>
                <Copy className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate (Phase 2)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" disabled>
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share (Phase 2)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button className="ml-2">Done</Button>
      </div>
    </div>
  );
}
