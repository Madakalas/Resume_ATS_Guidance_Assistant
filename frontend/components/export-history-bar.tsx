'use client';

import Link from 'next/link';
import { FileText, Download } from 'lucide-react';
import { useStore } from '@/lib/store';

export function ExportHistoryBar() {
  const lastExports = useStore((state) => state.getLastExports(3));

  if (lastExports.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-secondary/30 rounded-lg border border-secondary">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Recent Exports</span>
          </div>
          
          <div className="flex items-center gap-2">
            {lastExports.map((record) => (
              <button
                key={record.id}
                className="px-3 py-1 text-xs bg-background border border-border rounded hover:bg-accent transition-colors flex items-center gap-1"
                title={`${record.fileName} - ${new Date(record.exportedAt).toLocaleDateString()}`}
              >
                <FileText className="w-3 h-3" />
                {record.format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <Link
          href="/export"
          className="text-xs text-primary hover:underline font-medium"
        >
          View all
        </Link>
      </div>
    </div>
  );
}
