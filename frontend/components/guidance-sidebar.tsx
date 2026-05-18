'use client';

import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const atsRules = [
  {
    icon: <CheckCircle className="w-4 h-4" />,
    title: 'Use standard fonts',
    description: 'Stick to Arial, Calibri, or Times New Roman for ATS compatibility',
  },
  {
    icon: <CheckCircle className="w-4 h-4" />,
    title: 'Simple formatting',
    description: 'Avoid tables, columns, and complex layouts that scanners cannot parse',
  },
  {
    icon: <CheckCircle className="w-4 h-4" />,
    title: 'Keywords matter',
    description: 'Match job description keywords to improve scanning accuracy',
  },
  {
    icon: <CheckCircle className="w-4 h-4" />,
    title: 'Chronological order',
    description: 'List work experience from most recent to oldest',
  },
  {
    icon: <CheckCircle className="w-4 h-4" />,
    title: 'Include metrics',
    description: 'Quantify achievements with numbers and percentages',
  },
];

const commonMistakes = [
  {
    icon: <AlertCircle className="w-4 h-4" />,
    title: 'Headers/footers',
    description: 'Avoid repeated headers/footers—they confuse parsers',
  },
  {
    icon: <AlertCircle className="w-4 h-4" />,
    title: 'Images and logos',
    description: 'ATS systems skip images; text-only resumes work best',
  },
  {
    icon: <AlertCircle className="w-4 h-4" />,
    title: 'Unconventional dates',
    description: 'Use standard formats (MM/YYYY) for consistency',
  },
  {
    icon: <AlertCircle className="w-4 h-4" />,
    title: 'Excessive bullets',
    description: 'Keep bullets concise and scannable (under 2 lines each)',
  },
  {
    icon: <AlertCircle className="w-4 h-4" />,
    title: 'Special characters',
    description: 'Avoid symbols; use standard punctuation instead',
  },
];

export function GuidanceSidebar() {
  return (
    <div className="space-y-6 sticky top-[120px]">
      {/* ATS Export Rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            ATS Export Rules
          </CardTitle>
          <CardDescription className="text-xs">
            Best practices for ATS-friendly resumes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {atsRules.map((rule, idx) => (
              <div key={idx} className="flex gap-2">
                <div className="text-primary flex-shrink-0 mt-0.5">
                  {rule.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {rule.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Mistakes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Common Mistakes
          </CardTitle>
          <CardDescription className="text-xs">
            Avoid these to improve ATS parsing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commonMistakes.map((mistake, idx) => (
              <div key={idx} className="flex gap-2">
                <div className="text-destructive flex-shrink-0 mt-0.5">
                  {mistake.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {mistake.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {mistake.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <p className="text-xs text-foreground/80 leading-relaxed">
            <span className="font-medium">Pro tip:</span> Export in ATS Safe Mode to automatically remove formatting that could cause parsing issues.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
