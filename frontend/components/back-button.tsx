'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEscapeBack } from '@/hooks/use-escape-back';

interface BackButtonProps {
  breadcrumb?: string;
  onBack?: () => void;
}

export function BackButton({ breadcrumb = 'Dashboard', onBack }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
    router.back();
  };

  // Hook for Escape key support
  useEscapeBack(handleBack);

  return (
    <div className="flex items-center gap-2 mb-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className="h-9 w-9"
        title="Go back (Esc)"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        {breadcrumb}
      </span>
      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
        Esc
      </span>
    </div>
  );
}
