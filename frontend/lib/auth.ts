'use client';

/**
 * lib/auth.ts — Authentication context + helpers
 *
 * Mirrors Claude-style auth:
 *  - Access token stored in memory (not localStorage) for security
 *  - Refresh token stored in localStorage (long-lived)
 *  - Auto-refresh access token before expiry
 *  - User profile cached in localStorage for fast render
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';

const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  'http://localhost:8000';
const BASE = `${String(API_BASE).replace(/\/$/, '')}/api`;

const REFRESH_TOKEN_KEY  = 'rf_refresh_token';
const USER_CACHE_KEY     = 'rf_user_cache';

// ── Types ──────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  created_at?: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

// ── Storage helpers ────────────────────────────────────────────────────────
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(REFRESH_TOKEN_KEY); } catch { return null; }
}

function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(REFRESH_TOKEN_KEY, token); } catch {}
}

function clearRefreshToken(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(REFRESH_TOKEN_KEY); } catch {}
}

function getCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCachedUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {}
}

// ── API calls ──────────────────────────────────────────────────────────────
async function apiPost(path: string, body: object, token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).detail || `Request failed (${res.status})`);
  return data;
}

async function apiGet(path: string, token?: string | null) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).detail || `Request failed (${res.status})`);
  return data;
}

async function apiPatch(path: string, body: object, token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).detail || `Request failed (${res.status})`);
  return data;
}

// ── Context ────────────────────────────────────────────────────────────────
import React from 'react';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Access token lives in memory only
  const accessTokenRef = useRef<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(getCachedUser);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAuth = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
    setCachedUser(null);
    clearRefreshToken();
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  const scheduleRefresh = useCallback((expiresIn: number) => {
    // Refresh 2 minutes before expiry
    const delay = Math.max((expiresIn - 120) * 1000, 30_000);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      await refreshAccessToken();
    }, delay);
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const rt = getRefreshToken();
    if (!rt) return null;
    try {
      const data = await apiPost('/auth/refresh', { refresh_token: rt });
      accessTokenRef.current = data.access_token;
      setRefreshToken(data.refresh_token);
      const u: AuthUser = data.user;
      setUser(u);
      setCachedUser(u);
      scheduleRefresh(data.expires_in || 3600);
      return data.access_token;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth, scheduleRefresh]);

  // On mount: try to restore session via refresh token
  useEffect(() => {
    const init = async () => {
      const rt = getRefreshToken();
      if (!rt) {
        setLoading(false);
        return;
      }
      await refreshAccessToken();
      setLoading(false);
    };
    init();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost('/auth/login', { email, password });
    accessTokenRef.current = data.access_token;
    setRefreshToken(data.refresh_token);
    const u: AuthUser = data.user;
    setUser(u);
    setCachedUser(u);
    scheduleRefresh(data.expires_in || 3600);
  }, [scheduleRefresh]);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const data = await apiPost('/auth/signup', { email, password, name: name || '' });
    accessTokenRef.current = data.access_token;
    setRefreshToken(data.refresh_token);
    const u: AuthUser = data.user;
    setUser(u);
    setCachedUser(u);
    scheduleRefresh(data.expires_in || 3600);
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    try {
      if (accessTokenRef.current) {
        await apiPost('/auth/logout', {}, accessTokenRef.current);
      }
    } catch {}
    clearAuth();
  }, [clearAuth]);

  const updateUser = useCallback(async (updates: Partial<AuthUser>) => {
    const token = accessTokenRef.current || await refreshAccessToken();
    if (!token) throw new Error('Not authenticated');
    const updated = await apiPatch('/auth/me', updates, token);
    const u: AuthUser = updated;
    setUser(u);
    setCachedUser(u);
  }, [refreshAccessToken]);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    const token = accessTokenRef.current || await refreshAccessToken();
    if (!token) throw new Error('Not authenticated');
    await apiPost('/auth/change-password', { old_password: oldPassword, new_password: newPassword }, token);
  }, [refreshAccessToken]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = accessTokenRef.current;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const value: AuthContextType = {
    user,
    accessToken: accessTokenRef.current,
    loading,
    isAuthenticated: !!user && !!accessTokenRef.current,
    login,
    signup,
    logout,
    refreshAccessToken,
    updateUser,
    changePassword,
    getAuthHeaders,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ── Backwards compat helpers (for existing code that uses localStorage-based auth) ──
export function getStoredAuthToken(): string | null {
  return null; // access tokens are now in-memory only
}

export function setStoredAuth(_token: string, _user: { email: string; name: string }): void {
  // no-op — handled by AuthProvider
}

export function clearStoredAuth(): void {
  clearRefreshToken();
  setCachedUser(null);
}

export function getStoredAuthUser(): { email: string; name: string } | null {
  return getCachedUser();
}
