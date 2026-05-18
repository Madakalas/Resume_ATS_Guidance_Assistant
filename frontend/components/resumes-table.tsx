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
import { MoreVertical, FileText, Copy, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Resume {
  id: string;
  name: string;
  role: string;
  versions: number;
  lastUpdated: string;
  status: 'Draft' | 'Ready' | 'Exported';
}

interface ResumesTableProps {
  resumes: Resume[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
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

export function ResumesTable({
  resumes,
  selectedIds,
  onSelectAll,
  onSelectOne,
}: ResumesTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <table className="w-full">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left">
              <Checkbox
                checked={selectedIds.size === resumes.length && resumes.length > 0}
                onCheckedChange={onSelectAll}
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              Resume Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              Role
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              Versions
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              Last Updated
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {resumes.map((resume) => (
            <tr
              key={resume.id}
              className="hover:bg-muted/30 transition-colors"
            >
              <td className="px-4 py-3">
                <Checkbox
                  checked={selectedIds.has(resume.id)}
                  onCheckedChange={() => onSelectOne(resume.id)}
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {resume.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-foreground">{resume.role}</td>
              <td className="px-4 py-3 text-sm text-foreground">{resume.versions}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {resume.lastUpdated}
              </td>
              <td className="px-4 py-3">
                <Badge className={getStatusBadgeColor(resume.status)}>
                  {resume.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href="/editor" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Open
                      </Link>
                    </DropdownMenuItem>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
