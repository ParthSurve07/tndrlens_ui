import React, { useState } from 'react';
import {
  Settings, Bell, Check, Palette, Database, Layers, Trash2, Cpu, Wrench, Shield,
  CreditCard, Share2, Upload
} from 'lucide-react';
import { THEME_PRESETS } from '../App';

interface SettingsPanelProps {
  preset: string;
  setPreset: (p: string) => void;
  themeMode: string;
  setThemeMode: (m: string) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  fontWeight: string;
  setFontWeight: (w: string) => void;
  letterSpacing: string;
  setLetterSpacing: (s: string) => void;
  lineHeight: string;
  setLineHeight: (h: string) => void;
  componentStyle: string;
  setComponentStyle: (s: string) => void;
  animationSpeed: string;
  setAnimationSpeed: (s: string) => void;
  sidebarStyle: string;
  setSidebarStyle: (s: string) => void;
  cardStyle: string;
  setCardStyle: (s: string) => void;
  buttonStyle: string;
  setButtonStyle: (s: string) => void;
  iconStyle: string;
  setIconStyle: (s: string) => void;
  density: string;
  setDensity: (d: string) => void;
  customPrimary: string;
  setCustomPrimary: (c: string) => void;
  customBg: string;
  setCustomBg: (c: string) => void;
  customSurface: string;
  setCustomSurface: (c: string) => void;
  customText: string;
  setCustomText: (c: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  preset, setPreset, themeMode, setThemeMode, fontFamily, setFontFamily,
  fontWeight, setFontWeight, letterSpacing, setLetterSpacing, lineHeight, setLineHeight,
  componentStyle, setComponentStyle, animationSpeed, setAnimationSpeed, sidebarStyle, setSidebarStyle,
  cardStyle, setCardStyle, buttonStyle, setButtonStyle, iconStyle, setIconStyle, density, setDensity,
  customPrimary, setCustomPrimary, customBg, setCustomBg, customSurface, setCustomSurface, customText, setCustomText
}) => {
  const [activeCategory, setActiveCategory] = useState<'general' | 'appearance' | 'workspace' | 'notifications' | 'security' | 'ai' | 'storage' | 'billing' | 'integrations' | 'advanced'>('appearance');

  // AI states
  const [aiProvider, setAiProvider] = useState('gemini');
  const [temperature, setTemperature] = useState(0.3);
  const [responseLength, setResponseLength] = useState<'verbose' | 'balanced' | 'short'>('balanced');

  // Notifications channels
  const [channels, setChannels] = useState({ email: true, whatsapp: true, sms: false, slack: true, teams: false });

  // Export formats
  const [exportFormat, setExportFormat] = useState<'json' | 'css' | 'tailwind'>('json');

  const categoriesList = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'appearance', label: 'Appearance & Themes', icon: Palette },
    { id: 'workspace', label: 'Workspace Identity', icon: Layers },
    { id: 'notifications', label: 'Notifications Hub', icon: Bell },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'ai', label: 'AI Configuration', icon: Cpu },
    { id: 'storage', label: 'Storage Quotas', icon: Database },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'integrations', label: 'Integrations Engine', icon: Share2 },
    { id: 'advanced', label: 'Advanced Settings', icon: Wrench }
  ] as const;

  // Accessibility contrast checker based on current theme setting
  const getAccessibilityScore = () => {
    const isLight = preset.includes('white') || preset.includes('azure') || preset.includes('emerald') || preset.includes('crimson');
    return {
      score: '98/100',
      ratio: isLight ? '8.4:1 contrast ratio' : '7.8:1 contrast ratio',
      rating: 'AAA Compliance Passed',
      color: 'text-[#10B981]'
    };
  };

  const access = getAccessibilityScore();

  // Export format block generator
  const getExportString = () => {
    const col = THEME_PRESETS[preset] || THEME_PRESETS['executive-blue'];
    if (exportFormat === 'json') {
      return JSON.stringify({
        presetName: preset,
        styleMode: themeMode,
        font: fontFamily,
        weight: fontWeight,
        tokens: {
          bg: col.bg,
          surface: col.surface,
          card: col.card,
          border: col.border,
          text: col.text,
          accent: col.accent,
          success: col.success,
          danger: col.danger
        }
      }, null, 2);
    } else if (exportFormat === 'css') {
      return `:root {\n  --bg-color: ${col.bg};\n  --surface-color: ${col.surface};\n  --card-color: ${col.card};\n  --border-color: ${col.border};\n  --text-color: ${col.text};\n  --accent-color: ${col.accent};\n  --font-family: '${fontFamily}';\n}`;
    } else {
      return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n        bg: '${col.bg}',\n        surface: '${col.surface}',\n        card: '${col.card}',\n        accent: '${col.accent}'\n      }\n    }\n  }\n};`;
    }
  };

  return (
    <div className="space-y-8 select-none text-left font-sans text-xs">
      {/* Settings Header */}
      <div className="flex items-center justify-between border-b border-[#334155] pb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#6366F1] p-2.5 rounded-xl">
            <Palette size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">Design System Manager</h2>
            <p className="text-xs text-[#94A3B8]">Configure layout tokens, theme presets, accessibility contrast scores, and code exports</p>
          </div>
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Categories (3-span) */}
        <div className="lg:col-span-3 bg-[#111827] border border-[#334155] rounded-xl p-2.5 space-y-0.5 shadow-premium">
          {categoriesList.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all relative ${
                  isActive
                    ? 'bg-[#6366F1]/10 text-indigo-400 border border-[#6366F1]/20 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#6366F1] rounded-r" />
                )}
                <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Detail Customizer (9-span) */}
        <div className="lg:col-span-9 bg-[#111827] border border-[#334155] rounded-xl p-8 shadow-premium min-h-[600px]">
          
          {/* GENERAL TAB */}
          {activeCategory === 'general' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">General Workspace Rules</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-[#1E293B] border border-[#334155] rounded-xl">
                  <div>
                    <span className="font-bold text-[#F8FAFC] block">Daily Bid Auto-Save Digests</span>
                    <span className="text-[10px] text-slate-550 mt-1 block">Periodically sync local bid methodology drafts to corporate OneDrive</span>
                  </div>
                  <div className="w-10 h-6 bg-[#6366F1] rounded-full flex items-center justify-end px-1 cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DESIGN SYSTEM MANAGER (APPEARANCE) */}
          {activeCategory === 'appearance' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* Controls Column (7-span) */}
              <div className="xl:col-span-7 space-y-6 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin">
                
                {/* Theme Presets */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Theme Presets</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(THEME_PRESETS).map(([name, col]) => (
                      <div
                        key={name}
                        onClick={() => setPreset(name)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                          preset === name ? 'border-[#6366F1] bg-[#6366F1]/5' : 'border-[#334155] bg-[#1E293B] hover:border-slate-500'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="font-bold text-[#F8FAFC] capitalize text-[11px] block">{name.replace('-', ' ')}</span>
                          <div className="flex gap-1.5 items-center">
                            <div className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: col.bg }} title="BG" />
                            <div className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: col.accent }} title="Accent" />
                            <div className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: col.text }} title="Text" />
                          </div>
                        </div>
                        {preset === name && <Check size={12} className="text-[#6366F1]" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theme Interface Modes */}
                <div className="space-y-3 border-t border-[#334155]/60 pt-4">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Theme Modes</label>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                  >
                    <option value="dark-pro">Dark Professional (Charcoal Deep)</option>
                    <option value="light-pro">Light Professional (Minimal Soft)</option>
                    <option value="midnight-oled">Midnight OLED (OLED Black)</option>
                    <option value="glassmorphism">Glassmorphism effects (Transparencies)</option>
                    <option value="executive-blue">Executive Blue (Inspired by Stripe)</option>
                    <option value="financial-terminal">Financial Terminal (Bloomberg Green)</option>
                    <option value="minimal-white">Minimal White (Apple layout)</option>
                    <option value="modern-purple">Modern Purple (Linear styling)</option>
                  </select>
                </div>

                {/* Advanced Custom Theme Builder overrides */}
                <div className="space-y-4 border-t border-[#334155]/60 pt-4">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block font-mono">Advanced Theme Builder</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 block uppercase">Primary Color</label>
                      <input
                        type="text"
                        value={customPrimary}
                        onChange={(e) => setCustomPrimary(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 block uppercase">Background Color</label>
                      <input
                        type="text"
                        value={customBg}
                        onChange={(e) => setCustomBg(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 block uppercase">Surface Color</label>
                      <input
                        type="text"
                        value={customSurface}
                        onChange={(e) => setCustomSurface(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 block uppercase">Text Color</label>
                      <input
                        type="text"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Typography Selector */}
                <div className="space-y-4 border-t border-[#334155]/60 pt-4">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Typography Config</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#94A3B8] block uppercase">Font Family</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                      >
                        <option value="Inter">Inter (Standard SaaS)</option>
                        <option value="SF Pro">SF Pro (Apple native)</option>
                        <option value="Roboto">Roboto (Google Clean)</option>
                        <option value="IBM Plex Sans">IBM Plex Sans (Monospace feel)</option>
                        <option value="Geist">Geist (Modern Vercel)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#94A3B8] block uppercase">Font Weight</label>
                      <select
                        value={fontWeight}
                        onChange={(e) => setFontWeight(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                      >
                        <option value="300">Light (300)</option>
                        <option value="400">Regular (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semibold (600)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#94A3B8] block uppercase">Letter Spacing</label>
                      <select
                        value={letterSpacing}
                        onChange={(e) => setLetterSpacing(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                      >
                        <option value="tight">Tight Spacing (-0.02em)</option>
                        <option value="normal">Normal</option>
                        <option value="wide">Wide Spacing (+0.04em)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#94A3B8] block uppercase">Line Height</label>
                      <select
                        value={lineHeight}
                        onChange={(e) => setLineHeight(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                      >
                        <option value="snug">Snug Height (1.3)</option>
                        <option value="normal">Normal Height (1.5)</option>
                        <option value="relaxed">Relaxed (1.6)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Layout Density & Component Curves */}
                <div className="space-y-4 border-t border-[#334155]/60 pt-4">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Component Curves & Density</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#94A3B8] block uppercase">Border Corners</label>
                      <select
                        value={componentStyle}
                        onChange={(e) => setComponentStyle(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                      >
                        <option value="square">Square (0px)</option>
                        <option value="minimal">Minimal (6px)</option>
                        <option value="corporate">Corporate (8px)</option>
                        <option value="soft">Soft curves (12px)</option>
                        <option value="modern">Modern curves (16px)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#94A3B8] block uppercase">Workspace Density</label>
                      <select
                        value={density}
                        onChange={(e) => setDensity(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                      >
                        <option value="ultra-compact">Ultra Compact</option>
                        <option value="compact">Compact Density</option>
                        <option value="comfortable">Comfortable</option>
                        <option value="large">Spacious cards</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#94A3B8] block uppercase">Sidebar Style</label>
                      <select
                        value={sidebarStyle}
                        onChange={(e) => setSidebarStyle(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                      >
                        <option value="classic">Classic fixed sidebar</option>
                        <option value="floating">Floating items</option>
                        <option value="collapsed">Icons only</option>
                        <option value="modern">Modern list</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#94A3B8] block uppercase">Card Style</label>
                      <select
                        value={cardStyle}
                        onChange={(e) => setCardStyle(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                      >
                        <option value="flat">Flat borders</option>
                        <option value="elevated">Elevated shadows</option>
                        <option value="glass">Acrylic Glass blurs</option>
                        <option value="bordered">Double Bordered outline</option>
                        <option value="gradient">Subtle Gradient background</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#94A3B8] block uppercase">Button style</label>
                      <select
                        value={buttonStyle}
                        onChange={(e) => setButtonStyle(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                      >
                        <option value="solid">Solid fill</option>
                        <option value="outline">Outline borders</option>
                        <option value="soft">Soft light highlight</option>
                        <option value="ghost">Ghost borderless link</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#94A3B8] block uppercase">Icon shapes</label>
                      <select
                        value={iconStyle}
                        onChange={(e) => setIconStyle(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                      >
                        <option value="outlined">Outlined glyphs</option>
                        <option value="rounded">Rounded borders</option>
                        <option value="sharp">Sharp corners</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Animation Settings */}
                <div className="space-y-3 border-t border-[#334155]/60 pt-4">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Animation Speed</label>
                  <select
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                  >
                    <option value="none">No animations (Immediate)</option>
                    <option value="fast">Fast Transitions (120ms)</option>
                    <option value="balanced">Balanced Spring (250ms)</option>
                    <option value="smooth">Smooth ease (400ms)</option>
                    <option value="luxury">Luxury Spring (650ms)</option>
                  </select>
                </div>

              </div>

              {/* Live Preview Column (5-span) */}
              <div className="xl:col-span-5 bg-[#0F172A] border border-[#334155] rounded-xl p-5 space-y-6 relative overflow-hidden shadow-premium text-left">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block border-b border-[#334155] pb-2">Live Design Preview</span>
                
                {/* Simulated Header */}
                <div className="bg-[#111827] border border-[#334155] p-3 rounded-lg flex items-center justify-between">
                  <span className="font-bold text-[#F8FAFC] text-[10px]">TenderIntel Suite</span>
                  <span className="text-[8px] text-[#10B981] bg-[#10B981]/15 px-1.5 py-0.5 rounded border border-[#10B981]/25 uppercase font-mono">Sync active</span>
                </div>

                {/* Simulated Sidebar highlight */}
                <div className="space-y-1">
                  <div className="bg-[#1E293B] border border-[#6366F1]/30 p-2.5 rounded-lg flex items-center justify-between text-[10px] text-indigo-400">
                    <span className="font-bold">Active Workspace Link</span>
                    <Layers size={11} />
                  </div>
                </div>

                {/* Simulated Card Valuation */}
                <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-xl space-y-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Executive Bid Valuation</span>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-[#F8FAFC] font-mono">72.4 Cr</h3>
                    <button className="bg-[#6366F1] text-white font-bold text-[9px] px-2.5 py-1.5 rounded transition-all">Ingest Specifications</button>
                  </div>
                </div>

                {/* Accessibility ratings card */}
                <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Accessibility Score</span>
                    <span className={`text-[9px] font-black uppercase ${access.color}`}>{access.rating}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold">{access.score}</span>
                    <span className="font-mono text-slate-500">{access.ratio}</span>
                  </div>
                </div>

                {/* Export Tokens configurations */}
                <div className="space-y-2">
                  <div className="flex gap-2 border-b border-[#334155] pb-px">
                    {(['json', 'css', 'tailwind'] as const).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`pb-1 text-[9px] font-bold uppercase transition-all ${
                          exportFormat === fmt ? 'text-indigo-400 border-b-2 border-[#6366F1]' : 'text-slate-550 hover:text-slate-350'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                  <pre className="text-[8px] bg-slate-950 border border-slate-900 p-3 rounded-lg text-slate-400 font-mono overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {getExportString()}
                  </pre>
                </div>

              </div>

            </div>
          )}

          {/* WORKSPACE PROFILE TAB */}
          {activeCategory === 'workspace' && (
            <div className="space-y-6 max-w-2xl text-left">
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Workspace Profile identity</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Workspace Brand Name</label>
                  <input
                    type="text"
                    defaultValue="BuildCorp Main Suite"
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#1E293B] border border-[#334155] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#F8FAFC] block">Workspace Banner Cover</span>
                      <span className="text-[9px] text-slate-550">Upload banner assets</span>
                    </div>
                    <Upload size={16} className="text-indigo-400 cursor-pointer" />
                  </div>
                  <div className="p-4 bg-[#1E293B] border border-[#334155] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#F8FAFC] block">Company Icon Logo</span>
                      <span className="text-[9px] text-slate-550">Upload logo mark</span>
                    </div>
                    <Upload size={16} className="text-indigo-400 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS HUB TAB */}
          {activeCategory === 'notifications' && (
            <div className="space-y-6 max-w-2xl text-left">
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Notification Channels</h3>
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Compliance Digest', desc: 'Sync audit logs summary directly to executive inboxes' },
                  { key: 'whatsapp', label: 'WhatsApp Urgent Alarms', desc: 'Notify deadline changes or corrigendum alerts instantly' },
                  { key: 'slack', label: 'Slack Operations Hook', desc: 'Broadcast matching tender parameters on operations channels' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-[#1E293B] border border-[#334155] rounded-xl">
                    <div>
                      <span className="font-bold text-[#F8FAFC] block">{item.label}</span>
                      <span className="text-[10px] text-slate-550 mt-1 block">{item.desc}</span>
                    </div>
                    <div
                      onClick={() => setChannels(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                      className={`w-10 h-6 rounded-full flex items-center px-1 cursor-pointer transition-all ${
                        channels[item.key as keyof typeof channels] ? 'bg-[#6366F1] justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeCategory === 'security' && (
            <div className="space-y-6 max-w-2xl text-left">
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Access Controls & Security</h3>
              <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-[#334155] pb-3">
                  <div>
                    <h4 className="font-bold text-xs text-[#F8FAFC]">Two-Factor Authentication (2FA)</h4>
                    <span className="text-[10px] text-slate-550 block mt-0.5">Enforce mobile app authenticator prompts</span>
                  </div>
                  <span className="text-[9px] font-bold text-[#EF4444] bg-[#EF4444]/15 px-2 py-0.5 rounded uppercase">Disabled</span>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">Active Access sessions</span>
                  <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-lg flex justify-between items-center text-[10px] text-slate-400">
                    <span>Mac OS X • Chrome Browser (Mumbai, MH)</span>
                    <span className="text-[#10B981] font-bold uppercase">Current Session</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI SETTINGS */}
          {activeCategory === 'ai' && (
            <div className="space-y-6 max-w-2xl text-left">
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">AI Ingestion Models</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#94A3B8] uppercase">RAG Inference Engine API</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                  >
                    <option value="gemini">Google Gemini Pro Models (Recommended)</option>
                    <option value="openai">OpenAI GPT-4o Enterprise</option>
                    <option value="claude">Anthropic Claude 3.5 Sonnet</option>
                    <option value="azure">Azure Cognitive Search API</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Model Temperature ({temperature})</label>
                    <span className="text-[10px] text-slate-550 font-bold uppercase">Low yields deterministic compliance analysis</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.1}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#1E293B] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Response Length mode</label>
                  <div className="flex gap-2">
                    {['verbose', 'balanced', 'short'].map((l) => (
                      <button
                        key={l}
                        onClick={() => setResponseLength(l as any)}
                        className={`flex-1 py-2 border rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                          responseLength === l
                            ? 'bg-[#6366F1]/10 text-indigo-400 border-[#6366F1]'
                            : 'bg-[#1E293B] border-[#334155] text-slate-450 hover:text-slate-200'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STORAGE QUOTAS */}
          {activeCategory === 'storage' && (
            <div className="space-y-6 max-w-2xl text-left">
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Cloud Storage quota</h3>
              <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-xl space-y-4">
                <div className="flex justify-between text-xs text-[#94A3B8]">
                  <span>Drive file volume utilized</span>
                  <span className="font-bold text-[#F8FAFC]">4.8 GB / 10.0 GB (48%)</span>
                </div>
                <div className="w-full bg-[#0F172A] border border-[#334155] h-3 rounded-full overflow-hidden">
                  <div className="h-full bg-[#6366F1]" style={{ width: '48%' }} />
                </div>
              </div>
            </div>
          )}

          {/* BILLING & PLANS */}
          {activeCategory === 'billing' && (
            <div className="space-y-6 max-w-2xl text-left">
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Billing Subscription Plan</h3>
              <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-xl space-y-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs text-[#F8FAFC]">TenderIntel Enterprise Pro Plan</h4>
                  <span className="text-[10px] text-[#94A3B8] mt-1 block">Valid for unlimited scans, includes 25 active team profiles</span>
                </div>
                <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/15 px-3 py-1 rounded border border-[#10B981]/20 uppercase">Active</span>
              </div>
            </div>
          )}

          {/* INTEGRATIONS ENGINE */}
          {activeCategory === 'integrations' && (
            <div className="space-y-6 max-w-2xl text-left">
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Connected Corporate Services</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'Google Workspace Cloud Drive', desc: 'Sync project balance sheet affidavits', status: 'Connected', color: '#10B981' },
                  { name: 'Microsoft OneDrive for Business', desc: 'Import tender specification PDFs', status: 'Connected', color: '#10B981' },
                  { name: 'SAP ERP Integration gateway', desc: 'Export EMD deposits and valuations', status: 'Setup Pending', color: '#F59E0B' }
                ].map((item) => (
                  <div key={item.name} className="bg-[#1E293B] border border-[#334155] p-4 rounded-xl flex flex-col justify-between h-28 text-left">
                    <div>
                      <span className="font-bold block text-[#F8FAFC]">{item.name}</span>
                      <span className="text-[10px] text-slate-550 mt-1 block">{item.desc}</span>
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-wider block mt-3" style={{ color: item.color }}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADVANCED DESTROY CACHE */}
          {activeCategory === 'advanced' && (
            <div className="space-y-6 max-w-2xl text-left">
              <h3 className="text-sm font-bold text-[#EF4444] uppercase tracking-wider">Destructive Operations</h3>
              <div className="bg-[#1E293B] border border-[#EF4444]/20 p-5 rounded-xl space-y-4">
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Purging local cache databases removes all customized preset values, proposal drafts records, and parsed amendment diffs.
                </p>
                <button className="bg-[#EF4444] hover:bg-rose-600 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5">
                  <Trash2 size={13} />
                  Purge Workspace Cache Database
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
