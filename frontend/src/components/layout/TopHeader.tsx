'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Monitor, Keyboard, User, ChevronDown, Check } from 'lucide-react';
import { THEME_PRESETS } from '@/lib/theme';
import { useTheme } from './ThemeProvider';
import { clearAuth } from '@/lib/api';

interface TopHeaderProps {
  onOpenCommandPalette: () => void;
  onOpenShortcutsModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenCommandPalette,
  onOpenShortcutsModal,
}) => {
  const router = useRouter();
  const { preset, setPreset, setThemeMode } = useTheme();

  const [activeWorkspace, setActiveWorkspace] = useState('BuildCorp Main Suite');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (workspaceRef.current && !workspaceRef.current.contains(target)) {
        setShowWorkspaceMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setShowThemeMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setShowNotificationMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const notifications = [
    { id: 1, text: 'Corrigendum detected: deadline revised to 2026-09-15.', time: '10m' },
    { id: 2, text: 'Contractor license Class-A expires in 30 days.', time: '2h' },
    { id: 3, text: 'Specifications parsed for Elevated Viaduct.', time: '1d' }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface border-b border-slate-border flex items-center justify-between px-8 shrink-0 select-none">
      <div className="flex items-center gap-6">
        {/* Workspace Dropdown */}
        <div ref={workspaceRef} className="relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="flex items-center gap-2 text-xs font-bold text-[var(--text-color)] hover:opacity-80 transition-all"
          >
            <span>{activeWorkspace}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>
          {showWorkspaceMenu && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-surface border border-slate-border rounded-lg p-1.5 shadow-xl space-y-0.5 z-40">
              {['BuildCorp Main Suite', 'West Zone Infrastructure Project', 'Delhi Metro JV Syndicate'].map((w) => (
                <button
                  key={w}
                  onClick={() => { setActiveWorkspace(w); setShowWorkspaceMenu(false); }}
                  className="w-full text-left text-xs px-2.5 py-2 rounded-md hover:bg-card-bg text-[var(--text-color)] flex justify-between items-center"
                >
                  <span>{w}</span>
                  {activeWorkspace === w && <Check size={12} className="text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Command Palette Trigger */}
        <div onClick={onOpenCommandPalette} className="relative w-64 hidden md:block cursor-pointer">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            readOnly
            placeholder="Search index (Ctrl+K)..."
            className="w-full bg-dark-bg border border-slate-border rounded-lg py-1.5 pl-9 pr-4 text-xs text-[var(--text-color)] placeholder-slate-500 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Presets Dropdown */}
        <div ref={themeMenuRef} className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 text-slate-400 hover:text-[var(--text-color)] transition-colors"
            title="Select Theme Preset"
          >
            <Monitor size={15} />
          </button>
          {showThemeMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-slate-border rounded-lg p-1.5 shadow-xl space-y-0.5 z-40 max-h-60 overflow-y-auto">
              {Object.keys(THEME_PRESETS).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPreset(p); setThemeMode(p); setShowThemeMenu(false); }}
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded-md hover:bg-card-bg text-[var(--text-color)] flex justify-between items-center capitalize"
                >
                  <span>{p.replace('-', ' ')}</span>
                  {preset === p && <Check size={12} className="text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Shortcuts Modal Trigger */}
        <button
          onClick={onOpenShortcutsModal}
          className="p-2 text-slate-400 hover:text-[var(--text-color)] transition-colors"
          title="Keyboard Shortcuts Map"
        >
          <Keyboard size={15} />
        </button>

        {/* Notifications Dropdown */}
        <div ref={notificationMenuRef} className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-2 text-slate-400 hover:text-[var(--text-color)] transition-colors relative"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger-custom rounded-full"></span>
          </button>
          {showNotificationMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-slate-border rounded-lg p-3 shadow-xl z-40 text-xs text-left space-y-2.5">
              <h4 className="font-bold text-[var(--text-color)] border-b border-slate-border pb-1.5">Notifications Alert</h4>
              {notifications.map(n => (
                <div key={n.id} className="flex justify-between items-start gap-2 border-b border-slate-border/40 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-400 text-[11px] leading-relaxed">{n.text}</span>
                  <span className="text-[9px] text-slate-500 font-mono shrink-0">{n.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Sync Status */}
        <span className="text-[10px] font-bold text-success-custom bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/25 flex items-center gap-1.5">
          <span className="w-1 h-1 bg-success-custom rounded-full animate-pulse"></span>
          Sync
        </span>

        {/* Profile Avatar Menu */}
        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-accent cursor-pointer"
          >
            <User size={13} />
          </button>
          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-slate-border rounded-lg p-1.5 shadow-xl space-y-0.5 z-40 text-xs text-left">
              <span className="block px-2.5 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Action</span>
              <Link
                href="/company"
                onClick={() => setShowProfileMenu(false)}
                className="account-menu-item block w-full text-left px-2.5 py-2 rounded-md hover:bg-card-bg text-[var(--text-color)]"
              >
                My Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="account-menu-item block w-full text-left px-2.5 py-2 rounded-md hover:bg-card-bg text-[var(--text-color)]"
              >
                Appearance
              </Link>
              <button
                onClick={() => { onOpenShortcutsModal(); setShowProfileMenu(false); }}
                className="account-menu-item w-full text-left px-2.5 py-2 rounded-md hover:bg-card-bg text-[var(--text-color)]"
              >
                Keyboard Shortcuts
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-2.5 py-2 rounded-md hover:bg-rose-950/20 text-rose-400 border-t border-slate-border/50 mt-1"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
