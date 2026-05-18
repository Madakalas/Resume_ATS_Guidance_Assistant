'use client';

import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  preview: string;
  pros: string[];
  cons: string[];
}

interface TemplateDetailDrawerProps {
  template: Template;
  onClose: () => void;
  onUse: () => void;
}

export default function TemplateDetailDrawer({
  template,
  onClose,
  onUse,
}: TemplateDetailDrawerProps) {
  // Lock scroll on body when drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background z-50 shadow-2xl animate-in slide-in-from-right overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{template.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Preview */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Preview</h3>
            <div className="rounded-lg overflow-hidden border border-border bg-muted aspect-[8.5/11] max-h-96">
              <img
                src={template.preview}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* ATS Information */}
          <div className="space-y-6">
            {/* Pros */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-foreground">
                  ATS Advantages
                </h3>
              </div>
              <ul className="space-y-2">
                {template.pros.map((pro, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    <span className="text-foreground text-sm">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-foreground">
                  Considerations
                </h3>
              </div>
              <ul className="space-y-2">
                {template.cons.map((con, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                    <span className="text-foreground text-sm">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="sticky bottom-0 bg-background border-t border-border p-6 -m-6">
            <Button
              onClick={onUse}
              className="w-full h-11"
            >
              Use This Template
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
