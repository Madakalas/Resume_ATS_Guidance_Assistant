'use client';

import { ReactNode, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/lib/auth';

/**
 * Bridges AuthContext → window.__getAuthHeaders so lib/api.ts
 * can inject the Bearer token without circular imports.
 */
function AuthBridge() {
  const { getAuthHeaders } = useAuth();
  useEffect(() => {
    (window as any).__getAuthHeaders = getAuthHeaders;
    return () => { delete (window as any).__getAuthHeaders; };
  }, [getAuthHeaders]);
  return null;
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <AuthBridge />
      {children}
      <Toaster
        position="bottom-right"
        expand
        richColors
        theme="system"
      />
    </AuthProvider>
  );
}
