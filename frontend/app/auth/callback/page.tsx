'use client';

import { useEffect, useState } from 'react';

const REFRESH_TOKEN_KEY = 'rf_refresh_token';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash?.slice(1) || '';
    const params = new URLSearchParams(hash);
    const refreshToken = params.get('refresh_token');

    if (!refreshToken) {
      setStatus('error');
      setMessage('Missing tokens. Please try signing in again.');
      return;
    }

    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      setStatus('success');
      setMessage('Success! Redirecting…');
      window.location.href = '/';
    } catch {
      setStatus('error');
      setMessage('Could not save session. Please try again.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <div className="animate-pulse text-muted-foreground">{message}</div>
        )}
        {status === 'success' && (
          <p className="text-foreground">{message}</p>
        )}
        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-destructive">{message}</p>
            <a href="/login" className="text-sm text-primary underline">
              Back to login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
