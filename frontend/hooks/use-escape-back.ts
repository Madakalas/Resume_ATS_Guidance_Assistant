'use client';

import { useEffect } from 'react';

/**
 * Listens for the Escape key and calls the provided callback when pressed.
 * Useful for "go back" actions that can be triggered with Esc.
 */
export function useEscapeBack(onBack: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);
}
