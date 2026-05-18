'use client';

import { Version } from '@/app/versions/page';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CompareVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: [Version, Version];
}

const SECTION_LABELS = {
  personalInfo: 'Personal Info',
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  certifications: 'Certifications',
};

export default function CompareVersionsModal({
  isOpen,
  onClose,
  versions,
}: CompareVersionsModalProps) {
  const [v1, v2] = versions;

  // Find differences
  const differences = Object.keys(v1.sections).filter(
    (key) =>
      v1.sections[key as keyof typeof v1.sections] !==
      v2.sections[key as keyof typeof v2.sections]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              View differences between two versions side by side
            </DialogDescription>
          </div>
          <DialogClose className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 pb-6">
            {/* Version Headers */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-foreground">{v1.name}</h3>
                <p className="text-sm text-muted-foreground">{v1.createdAt}</p>
                <p className="text-sm text-muted-foreground mt-1">{v1.targetRole}</p>
              </div>
              <div className="border-l-4 border-accent pl-4">
                <h3 className="font-semibold text-foreground">{v2.name}</h3>
                <p className="text-sm text-muted-foreground">{v2.createdAt}</p>
                <p className="text-sm text-muted-foreground mt-1">{v2.targetRole}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-8 p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-foreground mb-3">Overview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">
                    Sections included: {Object.values(v1.sections).filter(Boolean).length}/7
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Sections included: {Object.values(v2.sections).filter(Boolean).length}/7
                  </p>
                </div>
              </div>
            </div>

            {/* Section Comparison */}
            <div>
              <h4 className="font-medium text-foreground mb-4">Sections Comparison</h4>
              <div className="space-y-3">
                {(Object.keys(SECTION_LABELS) as Array<keyof typeof SECTION_LABELS>).map((section) => {
                  const isIncludedV1 = v1.sections[section];
                  const isIncludedV2 = v2.sections[section];
                  const isDifferent = isIncludedV1 !== isIncludedV2;

                  return (
                    <div
                      key={section}
                      className={`p-3 rounded-lg border ${
                        isDifferent ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' : 'bg-muted/30 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{SECTION_LABELS[section]}</span>
                        <div className="flex gap-2">
                          <Badge
                            variant={isIncludedV1 ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {isIncludedV1 ? 'Included' : 'Excluded'}
                          </Badge>
                          <Badge
                            variant={isIncludedV2 ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {isIncludedV2 ? 'Included' : 'Excluded'}
                          </Badge>
                        </div>
                      </div>
                      {isDifferent && (
                        <div className="mt-2 inline-flex gap-1">
                          <Badge variant="secondary" className="text-xs">
                            Changed
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Differences Summary */}
            {differences.length > 0 && (
              <div className="mt-8 p-4 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
                <h4 className="font-medium text-foreground mb-2">
                  {differences.length} section{differences.length !== 1 ? 's' : ''} differ{differences.length !== 1 ? '' : 's'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {differences.map((section) => (
                    <Badge key={section} variant="secondary" className="text-xs">
                      {SECTION_LABELS[section as keyof typeof SECTION_LABELS]} changed
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {differences.length === 0 && (
              <div className="mt-8 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-foreground font-medium">
                  No differences found. These versions are identical.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
