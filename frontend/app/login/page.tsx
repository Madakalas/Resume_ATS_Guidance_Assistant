'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signedUpMessage, setSignedUpMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get('signedup') === '1') setSignedUpMessage(true);
    const err = searchParams.get('error');
    if (err === 'access_denied') setError('Sign-in was cancelled.');
    else if (err === 'token_exchange') setError('Google sign-in failed. Please try again.');
    else if (err === 'no_email') setError('No email from Google. Use another sign-in method.');
    else if (err === 'config') setError('Google sign-in is not configured.');
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) router.replace('/');
  }, [isAuthenticated, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const isUserNotFound = error.toLowerCase().includes('sign up') || error.toLowerCase().includes('not found');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">RF</span>
            </div>
            <span className="font-semibold text-lg">ResumeForge</span>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-card-foreground mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email and password to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {signedUpMessage && (
              <div className="rounded-lg bg-primary/10 text-primary text-sm px-3 py-2">
                Account created! Please sign in below.
              </div>
            )}
            {error && (
              <div className={`rounded-lg text-sm px-3 py-2 ${isUserNotFound ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                <p>{error}</p>
                {isUserNotFound && (
                  <p className="mt-2">
                    <Link href="/signup" className="font-medium underline hover:no-underline">
                      Sign up now →
                    </Link>
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={submitting}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <a
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/auth/google`}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </a>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
