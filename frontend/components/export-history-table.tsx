'use client';

import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExportRecord {
  id: string;
  fileName: string;
  resume: string;
  version: string;
  timestamp: Date;
  format: string;
}

interface ExportHistoryTableProps {
  exports: ExportRecord[];
  onDelete: (id: string) => void;
}

export function ExportHistoryTable({ exports, onDelete }: ExportHistoryTableProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export History</CardTitle>
        <CardDescription>
          Your recent exports and download options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-xs font-medium text-muted-foreground">
                <th className="text-left py-3 px-4">File Name</th>
                <th className="text-left py-3 px-4">Resume / Version</th>
                <th className="text-left py-3 px-4">Date & Time</th>
                <th className="text-left py-3 px-4">Format</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No exports yet. Generate your first resume export!
                  </td>
                </tr>
              ) : (
                exports.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {record.fileName}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <div>{record.resume}</div>
                      <div className="text-xs text-muted-foreground/70">
                        {record.version}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatDate(record.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-muted rounded border border-border">
                        {record.format}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => onDelete(record.id)}
                          title="Delete export record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
