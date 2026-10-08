'use client';

import React from 'react';
import { Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center select-none"
    >
      <div className="bg-surface border border-slate-border rounded-xl p-6 w-full max-w-sm shadow-2xl text-left text-xs space-y-4">
        <h3 className="font-bold text-[var(--text-color)] border-b border-slate-border pb-2 flex items-center gap-2">
          <Keyboard size={16} className="text-accent" /> Keyboard Shortcuts Map
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Toggle Command Palette</span>
            <kbd className="bg-card-bg border border-slate-border px-2 py-0.5 rounded font-mono text-[10px]">Ctrl + K</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Pin/Unpin Current Tender</span>
            <kbd className="bg-card-bg border border-slate-border px-2 py-0.5 rounded font-mono text-[10px]">Ctrl + Shift + P</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Go to Appearance Settings</span>
            <kbd className="bg-card-bg border border-slate-border px-2 py-0.5 rounded font-mono text-[10px]">Ctrl + P</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Back / Close Modal</span>
            <kbd className="bg-card-bg border border-slate-border px-2 py-0.5 rounded font-mono text-[10px]">ESC</kbd>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-accent hover:opacity-90 text-white rounded-lg py-2 font-bold text-center text-xs transition-all"
        >
          Close Guide
        </button>
      </div>
    </div>
  );
};
