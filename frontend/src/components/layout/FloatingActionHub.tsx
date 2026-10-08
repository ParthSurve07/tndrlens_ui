'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, PenTool } from 'lucide-react';

export const FloatingActionHub: React.FC = () => {
  const router = useRouter();
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const floatingMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floatingMenuRef.current && !floatingMenuRef.current.contains(event.target as Node)) {
        setShowFloatingMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={floatingMenuRef} className="fixed bottom-6 right-6 z-40 select-none">
      {showFloatingMenu && (
        <div className="bg-surface border border-slate-border rounded-xl p-2.5 shadow-2xl mb-3 flex flex-col gap-2 text-xs text-left w-48">
          <button
            onClick={() => { router.push('/tenders'); setShowFloatingMenu(false); }}
            className="flex items-center gap-2 p-2 hover:bg-card-bg rounded-md text-[var(--text-color)]"
          >
            <Plus size={13} className="text-accent" />
            <span>Create Tender</span>
          </button>
          <button
            onClick={() => { router.push('/tenders/1'); setShowFloatingMenu(false); }}
            className="flex items-center gap-2 p-2 hover:bg-card-bg rounded-md text-[var(--text-color)]"
          >
            <PenTool size={13} className="text-accent" />
            <span>Draft Proposal</span>
          </button>
        </div>
      )}
      <button
        onClick={() => setShowFloatingMenu(!showFloatingMenu)}
        className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-xl hover:opacity-90 transition-all font-bold text-lg"
        title="Quick Actions Command Hub"
      >
        {showFloatingMenu ? '×' : '+'}
      </button>
    </div>
  );
};
