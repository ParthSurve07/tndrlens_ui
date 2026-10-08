import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Building2, BarChart4, Users, Settings,
  ChevronLeft, ChevronRight, Search, Pin, LogOut, Folder, MoreHorizontal,
  GripVertical, X
} from 'lucide-react';
import { clearAuth } from '../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_WIDTH = 220;
const DEFAULT_WIDTH = 280;
const MAX_WIDTH = 420;
const COLLAPSED_WIDTH = 72;
const STORAGE_KEY_WIDTH = 'sidebar-width';
const STORAGE_KEY_COLLAPSED = 'sidebar-collapsed';

// ─── Props ─────────────────────────────────────────────────────────────────────
interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
  pinnedTenders: any[];
  onSelectTender: (id: number) => void;
  selectedTenderId: number | null;
  onPinToggle: (id: number) => void;
  onWidthChange?: (width: number) => void;
}

// ─── Tooltip ───────────────────────────────────────────────────────────────────
const Tooltip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="relative group/tooltip">
    {children}
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg text-[11px] text-[#F8FAFC] font-semibold shadow-xl pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 whitespace-nowrap z-[60]">
      {label}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#334155]" />
    </div>
  </div>
);

// ─── Component ─────────────────────────────────────────────────────────────────
export const Sidebar: React.FC<SidebarProps> = ({
  currentTab, setCurrentTab, onLogout,
  pinnedTenders, onSelectTender, selectedTenderId, onPinToggle,
  onWidthChange
}) => {
  // ── Restore saved state ──
  const savedWidth = () => {
    const stored = localStorage.getItem(STORAGE_KEY_WIDTH);
    const n = stored ? parseInt(stored, 10) : DEFAULT_WIDTH;
    return isNaN(n) ? DEFAULT_WIDTH : Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n));
  };
  const savedCollapsed = () => localStorage.getItem(STORAGE_KEY_COLLAPSED) === 'true';

  const [width, setWidth] = useState<number>(savedWidth);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(savedCollapsed);
  const [isResizing, setIsResizing] = useState(false);
  const [preCollapseWidth, setPreCollapseWidth] = useState<number>(savedWidth);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'value' | 'risk' | 'progress'>('name');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({
    'Road Projects': false, 'Metro Projects': false,
    'Hospital Projects': false, 'Favorites': false
  });
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [hoveredTenderId, setHoveredTenderId] = useState<number | null>(null);
  const [unconfirmDeleteId, setUnconfirmDeleteId] = useState<number | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const username = localStorage.getItem('username') || 'User';
  const role = localStorage.getItem('role') || 'Employee';

  // ── Persist width & collapsed ──
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WIDTH, String(width));
    onWidthChange?.(isCollapsed ? COLLAPSED_WIDTH : width);
  }, [width, isCollapsed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COLLAPSED, String(isCollapsed));
  }, [isCollapsed]);

  // ── Resize logic ────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = width;
    setIsResizing(true);
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX.current;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      setWidth(next);
      if (isCollapsed) setIsCollapsed(false);
    };

    const onMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, isCollapsed]);

  // Double-click handle → restore default
  const onHandleDoubleClick = () => {
    setWidth(DEFAULT_WIDTH);
    setIsCollapsed(false);
  };

  // ── Collapse toggle ──────────────────────────────────────────────────────────
  const toggleCollapse = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setWidth(preCollapseWidth);
    } else {
      setPreCollapseWidth(width);
      setIsCollapsed(true);
    }
  };

  // ── Menu items ──────────────────────────────────────────────────────────────
  const menuItems = [
    { id: 'dashboard', name: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'tenders',   name: 'Tender Workspace',    icon: FileText },
    { id: 'company',   name: 'Company Workspace',   icon: Building2 },
    { id: 'analytics', name: 'Analytics',           icon: BarChart4 },
    { id: 'team',      name: 'Team Collaboration',  icon: Users },
    { id: 'settings',  name: 'Settings',            icon: Settings },
  ];

  // ── Folder grouping ─────────────────────────────────────────────────────────
  const getFolderForTender = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('highway') || t.includes('road') || t.includes('expressway')) return 'Road Projects';
    if (t.includes('metro') || t.includes('viaduct') || t.includes('dmrc'))      return 'Metro Projects';
    if (t.includes('hospital') || t.includes('medical') || t.includes('pwd'))    return 'Hospital Projects';
    return 'Favorites';
  };

  const filtered = pinnedTenders
    .filter(t => {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.organization || '').toLowerCase().includes(q) ||
        String(t.id).includes(q)
      );
    })
    .sort((a, b) => {
      if (sortKey === 'value')    return b.value - a.value;
      if (sortKey === 'risk')     return (b.overall_risk_score || 0) - (a.overall_risk_score || 0);
      if (sortKey === 'progress') return (b.bid_readiness_score || 80) - (a.bid_readiness_score || 80);
      return a.title.localeCompare(b.title);
    });

  const folderGroups: Record<string, any[]> = {
    'Road Projects': [], 'Metro Projects': [], 'Hospital Projects': [], 'Favorites': []
  };
  filtered.forEach(item => folderGroups[getFolderForTender(item.title)].push(item));

  const getStatusDot = (risk: number) => {
    if (risk < 30) return 'bg-[#10B981]';
    if (risk < 50) return 'bg-[#3B82F6]';
    if (risk < 70) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  // ── Effective width CSS ─────────────────────────────────────────────────────
  const effectiveWidth = isCollapsed ? COLLAPSED_WIDTH : width;
  // Show labels when wide enough
  const showLabels = !isCollapsed && width >= 180;

  return (
    <div
      ref={sidebarRef}
      style={{ width: effectiveWidth, minWidth: effectiveWidth, maxWidth: effectiveWidth }}
      className={`bg-surface border-r border-slate-border flex flex-col h-full relative text-slate-400 select-none shrink-0
        ${isResizing ? '' : 'transition-[width] duration-200 ease-out'}
        ${isResizing ? 'cursor-col-resize' : ''}
      `}
    >
      {/* ── Drag-resize handle ─────────────────────────────────────────────── */}
      <div
        onMouseDown={onMouseDown}
        onDoubleClick={onHandleDoubleClick}
        className="absolute top-0 right-0 w-3 h-full z-50 flex items-center justify-center cursor-col-resize group/resize"
        title="Drag to resize · Double-click to reset"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'ArrowRight') setWidth(w => Math.min(MAX_WIDTH, w + 10));
          if (e.key === 'ArrowLeft')  setWidth(w => Math.max(MIN_WIDTH, w - 10));
        }}
      >
        {/* Visible glow line */}
        <div className={`w-px h-full transition-all duration-150
          ${isResizing
            ? 'bg-accent shadow-[0_0_8px_var(--accent-color)] w-[2px]'
            : 'bg-transparent group-hover/resize:bg-accent/60 group-hover/resize:w-[2px]'}
        `} />
        {/* Grip dots - show on hover */}
        <div className="absolute opacity-0 group-hover/resize:opacity-100 transition-opacity duration-150">
          <GripVertical size={12} className="text-slate-400" />
        </div>
      </div>

      {/* ── Collapse toggle button ─────────────────────────────────────────── */}
      <button
        onClick={toggleCollapse}
        onDoubleClick={() => { setIsCollapsed(false); setWidth(preCollapseWidth || DEFAULT_WIDTH); }}
        className="absolute top-5 -right-3 w-6 h-6 bg-surface border border-slate-border rounded-full flex items-center justify-center text-slate-400 hover:text-accent hover:border-accent/50 transition-all z-50 shadow-sm"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar (double-click to restore)' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
      </button>

      {/* ── Brand / Logo ────────────────────────────────────────────────────── */}
      <div className="h-16 flex items-center px-4 border-b border-slate-border shrink-0 overflow-hidden">
        {isCollapsed ? (
          <Tooltip label="TenderIntel">
            <div className="bg-[#6366F1]/10 border border-[#6366F1]/25 text-accent p-2 rounded-xl flex items-center justify-center mx-auto">
              <FileText size={16} />
            </div>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="bg-[#6366F1]/10 border border-[#6366F1]/25 text-accent p-2 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
            {showLabels && (
              <div className="overflow-hidden min-w-0">
                <span className="font-extrabold text-xs text-[#F8FAFC] block tracking-tight truncate">TenderIntel</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block truncate">Enterprise Suite</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Quick Search ────────────────────────────────────────────────────── */}
      <div className="px-3 py-2.5 shrink-0 border-b border-slate-border/40">
        {isCollapsed ? (
          <Tooltip label="Search Workspace… (Ctrl+K)">
            <button className="w-full flex justify-center py-2 hover-sidebar-item rounded-lg transition-all">
              <Search size={15} className="text-slate-400" />
            </button>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2 bg-dark-bg border border-slate-border rounded-lg px-2.5 py-1.5 text-[10px] text-slate-400 hover:border-accent/50 transition-all cursor-pointer group">
            <Search size={11} className="shrink-0 group-hover:text-accent transition-colors" />
            {showLabels && (
              <>
                <span className="flex-1 truncate">Search Workspace…</span>
                <kbd className="font-mono text-[9px] bg-surface border border-slate-border px-1 py-px rounded hidden sm:block">⌘K</kbd>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Navigation + Pinned ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 px-2">

        {/* Core nav items */}
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id && selectedTenderId === null;
          const btn = (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center rounded-lg transition-all duration-150 group relative
                ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 text-xs font-semibold'}
                ${isActive
                  ? 'bg-sidebar-active text-accent font-bold border border-accent/25'
                  : 'border border-transparent hover-sidebar-item'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-accent rounded-r" />
              )}
              <Icon
                size={15}
                className={`shrink-0 transition-transform duration-150 group-hover:scale-105
                  ${isCollapsed ? '' : 'mr-2.5'}
                  ${isActive ? 'text-accent' : 'text-slate-400 group-hover:text-accent'}`}
              />
              {!isCollapsed && showLabels && (
                <span className="truncate">{item.name}</span>
              )}
            </button>
          );

          return isCollapsed ? (
            <Tooltip key={item.id} label={item.name}>{btn}</Tooltip>
          ) : btn;
        })}

        {/* ── Pinned Workspaces ─────────────────────────────────────────────── */}
        {!isCollapsed && (
          <div className="border-t border-slate-border/40 pt-3 mt-2 space-y-2">
            {/* Header row */}
            <div className="flex items-center justify-between px-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Pin size={9} className="rotate-45" /> Pinned
              </span>
              {pinnedTenders.length > 0 && (
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value as any)}
                  className="bg-transparent border-0 text-[9px] text-slate-500 uppercase outline-none cursor-pointer"
                >
                  <option value="name">Name</option>
                  <option value="value">Value</option>
                  <option value="risk">Risk</option>
                  <option value="progress">Progress</option>
                </select>
              )}
            </div>

            {/* Search filter */}
            {pinnedTenders.length > 0 && showLabels && (
              <div className="relative px-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter pins…"
                  className="w-full bg-dark-bg border border-slate-border rounded-md px-2.5 py-1 text-[10px] text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-accent/60 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            )}

            {/* Empty state */}
            {pinnedTenders.length === 0 && (
              <div className="px-2 py-5 text-center space-y-2">
                <div className="text-lg">📌</div>
                <p className="text-[10px] text-slate-500 leading-relaxed">No pinned workspaces.<br />Star any tender to add it here.</p>
                <button
                  onClick={() => setCurrentTab('tenders')}
                  className="text-[9px] font-bold text-accent hover:underline"
                >
                  Browse Tender Catalog →
                </button>
              </div>
            )}

            {/* Folder groups */}
            {Object.entries(folderGroups).map(([folder, items]) => {
              if (items.length === 0) return null;
              const folderOpen = !collapsedFolders[folder];
              return (
                <div key={folder} className="space-y-0.5">
                  {/* Folder toggle */}
                  <button
                    onClick={() => setCollapsedFolders(p => ({ ...p, [folder]: !p[folder] }))}
                    className="w-full flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors rounded-md hover:bg-slate-800/20"
                  >
                    <ChevronRight size={9} className={`transition-transform duration-150 ${folderOpen ? 'rotate-90' : ''}`} />
                    <Folder size={9} />
                    <span className="truncate">{folder}</span>
                    <span className="ml-auto text-slate-600">{items.length}</span>
                  </button>

                  {/* Tender rows */}
                  {folderOpen && items.map(t => {
                    const isActive = selectedTenderId === t.id && currentTab === 'tenders';
                    const showMenu = hoveredTenderId === t.id;
                    return (
                      <div
                        key={t.id}
                        className="relative pl-3"
                        onMouseEnter={() => setHoveredTenderId(t.id)}
                        onMouseLeave={() => { setHoveredTenderId(null); if (activeMenuId === t.id) setActiveMenuId(null); }}
                      >
                        <button
                          onClick={() => onSelectTender(t.id)}
                          className={`w-full flex items-center gap-2 rounded-lg py-1.5 px-2 text-[11px] transition-all relative
                            ${isActive
                              ? 'bg-sidebar-active text-accent font-bold border border-accent/20'
                              : 'text-slate-400 hover-sidebar-item border border-transparent hover:text-slate-200'}
                          `}
                        >
                          {/* Active indicator stripe */}
                          {isActive && (
                            <div className="absolute left-0 top-[15%] bottom-[15%] w-0.5 bg-accent rounded-r animate-pulse" />
                          )}

                          {/* Status dot */}
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(t.overall_risk_score || 0)}`} />

                          {/* Name */}
                          <span className="truncate flex-1 text-left">{t.title}</span>

                          {/* Progress + menu */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] text-slate-500 font-mono">{t.bid_readiness_score || 80}%</span>
                            {showMenu && (
                              <button
                                onClick={e => { e.stopPropagation(); setActiveMenuId(activeMenuId === t.id ? null : t.id); }}
                                className="p-0.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700/40"
                              >
                                <MoreHorizontal size={10} />
                              </button>
                            )}
                          </div>
                        </button>

                        {/* Hover tooltip */}
                        {showMenu && activeMenuId !== t.id && (
                          <div className="absolute left-full top-0 ml-2 w-52 bg-surface border border-slate-border rounded-xl p-3 shadow-xl z-[60] space-y-2 text-[10px] pointer-events-none">
                            <p className="font-bold text-[#F8FAFC] truncate border-b border-slate-border pb-1">{t.title}</p>
                            <div className="grid grid-cols-2 gap-1 text-slate-400">
                              <span>Value</span>        <span className="text-[#F8FAFC] font-semibold text-right">₹{t.value} Cr</span>
                              <span>Risk</span>         <span className="text-amber-400 font-semibold text-right">{t.overall_risk_score || 0}%</span>
                              <span>Progress</span>     <span className="text-accent font-semibold text-right">{t.bid_readiness_score || 80}%</span>
                              <span>Deadline</span>     <span className="text-[#F8FAFC] font-semibold text-right">{t.submission_deadline || 'N/A'}</span>
                            </div>
                          </div>
                        )}

                        {/* Context menu */}
                        {activeMenuId === t.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-slate-border rounded-xl p-1.5 shadow-xl z-[60] space-y-px">
                            <button
                              onClick={() => { onSelectTender(t.id); setActiveMenuId(null); }}
                              className="w-full text-left px-2.5 py-1.5 text-[10px] font-semibold text-[#F8FAFC] rounded-lg hover:bg-slate-700/40 transition-colors"
                            >▶  Open Workspace</button>
                            <div className="border-t border-slate-border/50 my-1" />
                            {unconfirmDeleteId === t.id ? (
                              <div className="px-2.5 py-1.5 space-y-1.5">
                                <p className="text-[9px] text-slate-400">Remove this pin?</p>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => { onPinToggle(t.id); setActiveMenuId(null); setUnconfirmDeleteId(null); }}
                                    className="flex-1 text-[9px] font-bold bg-rose-500/20 text-rose-400 rounded-md py-1 hover:bg-rose-500/30"
                                  >Remove</button>
                                  <button
                                    onClick={() => setUnconfirmDeleteId(null)}
                                    className="flex-1 text-[9px] font-bold bg-slate-700/40 text-slate-300 rounded-md py-1"
                                  >Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setUnconfirmDeleteId(t.id)}
                                className="w-full text-left px-2.5 py-1.5 text-[10px] font-semibold text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                              >🗑  Remove Pin</button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Collapsed – show pinned icons only */}
        {isCollapsed && pinnedTenders.slice(0, 8).map(t => {
          const isActive = selectedTenderId === t.id && currentTab === 'tenders';
          const initials = t.title.substring(0, 2).toUpperCase();
          return (
            <Tooltip key={t.id} label={t.title}>
              <button
                onClick={() => onSelectTender(t.id)}
                className={`w-full flex justify-center py-2 rounded-lg transition-all relative
                  ${isActive ? 'bg-sidebar-active border border-accent/25' : 'hover-sidebar-item border border-transparent'}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-[20%] bottom-[20%] w-0.5 bg-accent rounded-r" />
                )}
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black
                  ${isActive ? 'bg-accent/20 text-accent' : 'bg-slate-700/60 text-slate-300'}
                `}>
                  {initials}
                </div>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* ── Storage telemetry ────────────────────────────────────────────────── */}
      {!isCollapsed && showLabels && (
        <div className="px-4 py-3 border-t border-slate-border/40 text-[10px] space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">RAG Vector DB</span>
            </div>
            <span className="text-[8px] text-slate-500 font-mono uppercase">Syncing</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Storage</span><span>4.8 / 10 GB</span>
            </div>
            <div className="w-full bg-dark-bg h-1 rounded-full overflow-hidden border border-slate-border">
              <div className="h-full bg-accent rounded-full" style={{ width: '48%' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Profile footer ───────────────────────────────────────────────────── */}
      <div className={`border-t border-slate-border/60 shrink-0 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {isCollapsed ? (
          <Tooltip label={`${username} · ${role}`}>
            <div className="w-8 h-8 rounded-full bg-surface border border-slate-border flex items-center justify-center text-xs font-bold text-accent capitalize mx-auto cursor-pointer">
              {username.substring(0, 2)}
            </div>
          </Tooltip>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-7 h-7 rounded-full bg-surface border border-slate-border flex items-center justify-center text-[10px] font-bold text-accent capitalize shrink-0">
                {username.substring(0, 2)}
              </div>
              {showLabels && (
                <div className="overflow-hidden min-w-0">
                  <p className="text-[11px] font-semibold text-[#F8FAFC] truncate capitalize">{username}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider truncate">{role}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => { clearAuth(); onLogout(); }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-400 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 hover:border-rose-500/25 transition-all"
            >
              <LogOut size={12} />
              {showLabels && <span>Sign Out</span>}
            </button>
          </div>
        )}
      </div>

      {/* ── Resize overlay cursor helper ─────────────────────────────────────── */}
      {isResizing && (
        <div className="fixed inset-0 z-[200] cursor-col-resize" />
      )}
    </div>
  );
};
