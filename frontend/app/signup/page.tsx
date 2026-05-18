'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signup(email.trim(), password, name.trim() || undefined);
      // Signup also logs in — redirect to dashboard
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-xl font-semibold text-card-foreground mb-1">Create an account</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your details to get started.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name (optional)</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={submitting}
            >
              {submitting ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
