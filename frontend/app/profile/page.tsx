'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Shield, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, updateUser, changePassword, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await updateUser({ name: name.trim() });
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwMsg('');
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      await changePassword(oldPw, newPw);
      setPwMsg('Password changed successfully.');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Password change failed.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Avatar + name hero */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Profile section */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Profile Information</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Email address</Label>
              <Input value={user?.email || ''} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-name">Display name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            {profileMsg && (
              <div className="rounded-lg bg-primary/10 text-primary text-sm px-3 py-2">{profileMsg}</div>
            )}
            <Button type="submit" disabled={profileSaving} className="gap-2">
              {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </form>
        </div>

        {/* Change password */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old-pw">Current password</Label>
              <Input id="old-pw" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">New password</Label>
              <Input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Confirm new password</Label>
              <Input id="confirm-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" />
            </div>
            {pwError && <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">{pwError}</div>}
            {pwMsg && <div className="rounded-lg bg-primary/10 text-primary text-sm px-3 py-2">{pwMsg}</div>}
            <Button type="submit" disabled={pwSaving} variant="outline" className="gap-2">
              {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </Button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Session</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your account on this device.
          </p>
          <Button variant="destructive" onClick={handleLogout}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
