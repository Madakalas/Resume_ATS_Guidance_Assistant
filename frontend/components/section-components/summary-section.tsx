'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SummarySection({
  data,
  onChange,
}: {
  data: string;
  onChange: (data: string) => void;
}) {
  const charCount = data.length;
  const maxChars = 300;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="summary" className="text-sm font-medium">
          Professional Summary
        </Label>
        <span className="text-xs text-muted-foreground">
          {charCount}/{maxChars}
        </span>
      </div>
      <Textarea
        id="summary"
        value={data}
        onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
        placeholder="Write a brief summary of your professional background and key achievements..."
        className="min-h-24 resize-none"
      />
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Keep it concise and impactful. 2-3 sentences recommended.
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Improve
              </Button>
            </TooltipTrigger>
            <TooltipContent>AI improvement coming in Phase 2</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
