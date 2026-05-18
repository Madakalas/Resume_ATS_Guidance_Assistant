'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  preview: string;
  pros: string[];
  cons: string[];
}

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'ATS Clean':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'Minimal':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100';
      case 'Modern':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'Classic':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  return (
    <div
      className="group cursor-pointer"
      onClick={() => onSelect(template)}
    >
      <div className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-300 h-full flex flex-col">
        {/* Preview Image */}
        <div className="relative h-64 bg-muted overflow-hidden">
          <img
            src={template.preview}
            alt={template.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col gap-4">
          {/* Title & Description */}
          <div>
            <h3 className="font-bold text-lg text-foreground mb-2">
              {template.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className={getTagColor(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* View Button */}
          <Button
            variant="outline"
            className="w-full mt-auto group/btn"
            onClick={() => onSelect(template)}
          >
            View Details
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
