'use client';

import { Menu, Settings, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-16 border-b border-border bg-card sticky top-0 z-50">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Left: Logo and Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">RF</span>
            </div>
            <span className="hidden sm:inline text-lg font-semibold text-foreground">ResumeForge</span>
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Dashboard
          </a>
          <a href="/my-resumes" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            My Resumes
          </a>
          <a href="/versions" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Versions
          </a>
          <a href="/templates" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Templates
          </a>
          <a href="/export" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Export
          </a>
        </nav>

        {/* Right: Auth / Profile */}
        {!isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => router.push('/signup')}>
              Sign up
            </Button>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-primary-foreground">{initials}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground leading-tight">{displayName}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{user?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="pb-1">
                <p className="font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground font-normal truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/profile')}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
