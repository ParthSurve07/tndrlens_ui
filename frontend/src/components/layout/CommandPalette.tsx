'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Monitor, Plus, User, Sparkles } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const actions = [
    {
      label: 'Jump to Dashboard',
      action: () => { router.push('/dashboard'); onClose(); },
      icon: Monitor
    },
    {
      label: 'Ingest Tender Specifications PDF',
      action: () => { router.push('/tenders'); onClose(); },
      icon: Plus
    },
    {
      label: 'Audit Company Profile parameters',
      action: () => { router.push('/company'); onClose(); },
      icon: User
    },
    {
      label: 'Clarify with AI Procurement Copilot',
      action: () => { router.push('/tenders/1'); onClose(); },
      icon: Sparkles
    }
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 select-none"
    >
      <div className="w-full max-w-xl bg-surface border border-slate-border rounded-xl shadow-2xl overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-border flex items-center gap-3">
          <Search className="text-slate-400" size={16} />
          <input
            type="text"
            autoFocus
            placeholder="Search workspace actions..."
            className="w-full bg-transparent border-0 outline-none text-[var(--text-color)] placeholder:text-slate-500"
          />
          <button
            onClick={onClose}
            className="text-[10px] bg-card-bg border border-slate-border px-2 py-0.5 rounded text-slate-400 hover:text-[var(--text-color)]"
          >
            ESC
          </button>
        </div>

        <div className="p-2 space-y-0.5 text-left">
          {actions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.label}
                onClick={opt.action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card-bg text-accent transition-colors"
              >
                <Icon size={14} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
