'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { ShortcutsModal } from '@/components/layout/ShortcutsModal';
import { FloatingActionHub } from '@/components/layout/FloatingActionHub';
import { api, getAuthToken, type Tender } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [pinnedTenders, setPinnedTenders] = useState<Tender[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const fetchPinnedTenders = async () => {
    try {
      const data = await api.getSavedTenders();
      setPinnedTenders(data);
    } catch (err) {
      console.error('Failed to load pinned tenders', err);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      fetchPinnedTenders();
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPinnedTenders();
    }
  }, [pathname, isAuthenticated]);

  // Global keydown listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPalette(false);
        setShowShortcutsModal(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowPalette(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        router.push('/settings');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg text-slate-400 text-xs">
        Loading session...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans relative">
      <Sidebar
        pinnedTenders={pinnedTenders}
        onRefreshPinned={fetchPinnedTenders}
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-dark-bg">
        <TopHeader
          onOpenCommandPalette={() => setShowPalette(true)}
          onOpenShortcutsModal={() => setShowShortcutsModal(true)}
        />

        <main className="flex-1 overflow-y-auto bg-dark-bg">
          <div className="max-w-[1600px] mx-auto p-8 w-full">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
      />

      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <FloatingActionHub />
    </div>
  );
}
