'use client';

import { Download, CheckCircle2 } from 'lucide-react';

interface Tip {
  id: string;
  title: string;
  description: string;
}

interface Export {
  id: string;
  name: string;
  date: string;
  format: string;
}

const atsTips: Tip[] = [
  {
    id: '1',
    title: 'Use Standard Fonts',
    description: 'Stick to Arial, Calibri, or Times New Roman for maximum compatibility.',
  },
  {
    id: '2',
    title: 'Avoid Graphics',
    description: 'Skip images, charts, and fancy formatting. ATS systems read text only.',
  },
  {
    id: '3',
    title: 'Include Keywords',
    description: 'Match job description keywords naturally throughout your resume.',
  },
  {
    id: '4',
    title: 'Simple Structure',
    description: 'Use clear headings and bullet points for easy parsing by systems.',
  },
];

const mockExports: Export[] = [
  {
    id: '1',
    name: 'Backend Engineer – US ATS.pdf',
    date: '2 days ago',
    format: 'PDF',
  },
  {
    id: '2',
    name: 'Full Stack Developer.pdf',
    date: '1 week ago',
    format: 'PDF',
  },
  {
    id: '3',
    name: 'Data Scientist – Analytics.docx',
    date: '3 days ago',
    format: 'DOCX',
  },
];

export default function RightPanel() {
  return (
    <div className="h-full overflow-y-auto flex flex-col">
      {/* ATS Tips Section */}
      <div className="px-6 py-6 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4">Quick Tips (ATS)</h3>
        <div className="space-y-3">
          {atsTips.map((tip) => (
            <div key={tip.id} className="p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer">
              <p className="text-xs font-medium text-foreground mb-1">{tip.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export History Section */}
      <div className="px-6 py-6 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground mb-4">Export History</h3>
        <div className="space-y-2">
          {mockExports.map((exp) => (
            <div
              key={exp.id}
              className="p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {exp.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{exp.date}</p>
                </div>
                <button className="p-1.5 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <Download className="w-4 h-4 text-primary" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                  {exp.format}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>Need help? Check our</p>
          <a href="#" className="text-primary hover:underline font-medium">
            documentation
          </a>
        </div>
      </div>
    </div>
  );
}
