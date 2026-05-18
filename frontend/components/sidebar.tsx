'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Zap, Download, HelpCircle, GitBranch, Sparkles, User, Settings, LogOut, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', href: '/' },
  { icon: <GitBranch className="w-5 h-5" />, label: 'Versions', href: '/versions' },
  { icon: <Zap className="w-5 h-5" />, label: 'Templates', href: '/templates' },
  { icon: <Download className="w-5 h-5" />, label: 'Export Center', href: '/export' },
  { icon: <Sparkles className="w-5 h-5" />, label: 'AI Mode', href: '/ai-mode' },
  { icon: <HelpCircle className="w-5 h-5" />, label: 'Help', href: '#' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const authUser = mounted && user ? { email: user.email, name: user.name } : null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Branding */}
      <div className="px-4 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <span className="text-primary-foreground font-bold text-sm">RF</span>
          </div>
          <div>
            <h1 className="font-semibold text-sm text-sidebar-foreground">ResumeForge</h1>
            <p className="text-xs text-sidebar-foreground/60">Builder</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href!);
          const content = (
            <>
              {item.icon}
              <span>{item.label}</span>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              {content}
            </button>
          );
        })}
      </div>
      
      {/* Account Section */}
      <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
        {authUser ? (
          <>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/30">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-foreground">
                  {(authUser.name || authUser.email).slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{authUser.name || 'User'}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{authUser.email}</p>
              </div>
            </div>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
            <Link href="/signup" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <UserPlus className="w-4 h-4" />
              <span>Sign up</span>
            </Link>
          </>
        )}
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
        <p>© 2024 ResumeForge</p>
        <p className="text-sidebar-foreground/40 mt-1">ATS-First Resume Builder</p>
      </div>
    </div>
  );
}
