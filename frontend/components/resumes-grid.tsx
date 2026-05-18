'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';

interface Resume {
  id: string;
  name: string;
  role: string;
  versions: number;
  lastUpdated: string;
  status: 'Draft' | 'Ready' | 'Exported';
}

interface ResumesGridProps {
  resumes: Resume[];
  selectedIds: Set<string>;
  onSelectOne: (id: string) => void;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Draft':
      return 'bg-muted text-muted-foreground';
    case 'Ready':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Exported':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function ResumesGrid({
  resumes,
  selectedIds,
  onSelectOne,
}: ResumesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow relative group"
        >
          {/* Checkbox */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Checkbox
              checked={selectedIds.has(resume.id)}
              onCheckedChange={() => onSelectOne(resume.id)}
            />
          </div>

          {/* Content */}
          <div className="pr-8">
            <div className="flex items-start gap-3 mb-3">
              <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
              <h3 className="text-base font-semibold text-foreground leading-tight">
                {resume.name}
              </h3>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Role:</span>
                <span className="text-sm font-medium text-foreground">{resume.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Versions:</span>
                <span className="text-sm font-medium text-foreground">{resume.versions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Updated:</span>
                <span className="text-sm text-muted-foreground">{resume.lastUpdated}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <Badge className={getStatusBadgeColor(resume.status)}>
                {resume.status}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link href="/editor" className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Open
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
