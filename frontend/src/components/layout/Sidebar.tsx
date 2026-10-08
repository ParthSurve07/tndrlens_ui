'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, Building2, BarChart4, Users, Settings,
  ChevronLeft, ChevronRight, Search, Pin, LogOut, Folder, MoreHorizontal,
  GripVertical, X
} from 'lucide-react';
import { clearAuth, api, type Tender } from '@/lib/api';

const MIN_WIDTH = 220;
const DEFAULT_WIDTH = 280;
const MAX_WIDTH = 420;
const COLLAPSED_WIDTH = 72;
const STORAGE_KEY_WIDTH = 'sidebar-width';
const STORAGE_KEY_COLLAPSED = 'sidebar-collapsed';

const Tooltip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="relative group/tooltip">
    {children}
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg text-[11px] text-[#F8FAFC] font-semibold shadow-xl pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 whitespace-nowrap z-[60]">
      {label}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#334155]" />
    </div>
  </div>
);

interface SidebarProps {
  pinnedTenders?: Tender[];
  onPinToggle?: (id: number) => void;
  onRefreshPinned?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ pinnedTenders = [], onPinToggle, onRefreshPinned }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [width, setWidth] = useState<number>(DEFAULT_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState(false);
  const [preCollapseWidth, setPreCollapseWidth] = useState<number>(DEFAULT_WIDTH);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'value' | 'risk' | 'progress'>('name');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({
    'Road Projects': false, 'Metro Projects': false,
    'Hospital Projects': false, 'Favorites': false
  });
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [hoveredTenderId, setHoveredTenderId] = useState<number | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const [username, setUsername] = useState('User');
  const [role, setRole] = useState('Employee');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUsername(localStorage.getItem('username') || 'User');
      setRole(localStorage.getItem('role') || 'Employee');

      const storedW = localStorage.getItem(STORAGE_KEY_WIDTH);
      if (storedW) {
        const n = parseInt(storedW, 10);
        if (!isNaN(n)) setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n)));
      }
      setIsCollapsed(localStorage.getItem(STORAGE_KEY_COLLAPSED) === 'true');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_WIDTH, String(width));
    }
  }, [width]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(isCollapsed));
    }
  }, [isCollapsed]);

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

  const onHandleDoubleClick = () => {
    setWidth(DEFAULT_WIDTH);
    setIsCollapsed(false);
  };

  const toggleCollapse = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setWidth(preCollapseWidth);
    } else {
      setPreCollapseWidth(width);
      setIsCollapsed(true);
    }
  };

  const menuItems = [
    { id: 'dashboard', name: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'tenders',   name: 'Tender Workspace',    path: '/tenders',   icon: FileText },
    { id: 'company',   name: 'Company Workspace',   path: '/company',   icon: Building2 },
    { id: 'analytics', name: 'Analytics',           path: '/analytics', icon: BarChart4 },
    { id: 'team',      name: 'Team Collaboration',  path: '/team',      icon: Users },
    { id: 'settings',  name: 'Settings',            path: '/settings',  icon: Settings },
  ];

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

  const folderGroups: Record<string, Tender[]> = {
    'Road Projects': [], 'Metro Projects': [], 'Hospital Projects': [], 'Favorites': []
  };
  filtered.forEach(item => {
    const f = getFolderForTender(item.title);
    if (!folderGroups[f]) folderGroups[f] = [];
    folderGroups[f].push(item);
  });

  const getStatusDot = (risk: number) => {
    if (risk < 30) return 'bg-[#10B981]';
    if (risk < 50) return 'bg-[#3B82F6]';
    if (risk < 70) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const effectiveWidth = isCollapsed ? COLLAPSED_WIDTH : width;
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
      {/* Drag-resize handle */}
      <div
        onMouseDown={onMouseDown}
        onDoubleClick={onHandleDoubleClick}
        className="absolute top-0 right-0 w-3 h-full z-50 flex items-center justify-center cursor-col-resize group/resize"
        title="Drag to resize · Double-click to reset"
      >
        <div className="w-1 h-8 rounded-full bg-slate-700 group-hover/resize:bg-indigo-400 group-hover/resize:h-16 transition-all duration-200 flex items-center justify-center">
          <GripVertical size={10} className="text-slate-900 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* App Header / Logo */}
      <div className="p-4 border-b border-slate-border flex items-center justify-between shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold shrink-0 shadow-md">
            T
          </div>
          {showLabels && (
            <div className="flex flex-col overflow-hidden leading-tight">
              <span className="font-bold text-sm text-[var(--text-color)] tracking-tight truncate">TndrLens</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase truncate">Procurement Intelligence</span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg hover:bg-card-bg text-slate-400 hover:text-[var(--text-color)] transition-colors shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="px-3 py-3 space-y-1 border-b border-slate-border shrink-0">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname ? (pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))) : false;
          
          const content = (
            <Link
              key={item.id}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 group relative ${
                isActive
                  ? 'bg-sidebar-active font-semibold shadow-sm'
                  : 'hover-sidebar-item text-slate-400 hover:text-[var(--text-color)]'
              }`}
            >
              <Icon size={18} className={`shrink-0 ${isActive ? 'text-accent' : 'text-slate-400 group-hover:text-[var(--text-color)]'}`} />
              {showLabels && <span className="truncate">{item.name}</span>}
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.id} label={item.name}>
                {content}
              </Tooltip>
            );
          }
          return content;
        })}
      </div>

      {/* Pinned Tenders Section */}
      {!isCollapsed && width >= 200 && (
        <div className="flex-1 flex flex-col min-h-0 px-3 py-3 overflow-hidden">
          <div className="flex items-center justify-between px-2 mb-2 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Pin size={12} className="text-accent" />
              Pinned Workspace Tenders ({pinnedTenders.length})
            </span>
          </div>

          {/* Search box for pinned tenders */}
          <div className="relative mb-2 shrink-0">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pinned..."
              className="w-full bg-dark-bg border border-slate-border rounded-lg py-1 pl-8 pr-2 text-[11px] text-[var(--text-color)] placeholder:text-slate-600 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Folder groups listing */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {Object.entries(folderGroups).map(([folderName, items]) => {
              if (items.length === 0) return null;
              const isCollapsedFolder = collapsedFolders[folderName];

              return (
                <div key={folderName} className="space-y-1">
                  <button
                    onClick={() => setCollapsedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }))}
                    className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-[var(--text-color)] uppercase tracking-wider rounded hover:bg-card-bg transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Folder size={11} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{folderName}</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">({items.length})</span>
                  </button>

                  {!isCollapsedFolder && (
                    <div className="space-y-0.5 pl-2">
                      {items.map((item) => {
                        const isSelected = pathname ? pathname === `/tenders/${item.id}` : false;
                        const risk = item.overall_risk_score || 0;

                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => setHoveredTenderId(item.id)}
                            onMouseLeave={() => setHoveredTenderId(null)}
                            className={`group/item flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-sidebar-active text-accent font-semibold'
                                : 'hover:bg-card-bg text-slate-300 hover:text-[var(--text-color)]'
                            }`}
                          >
                            <Link
                              href={`/tenders/${item.id}`}
                              className="flex items-center gap-2 min-w-0 flex-1"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(risk)} shrink-0`} title={`Risk: ${risk}%`} />
                              <span className="truncate text-[11px] leading-tight">{item.title}</span>
                            </Link>

                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (onPinToggle) {
                                    await onPinToggle(item.id);
                                  } else {
                                    await api.toggleBookmark(item.id);
                                  }
                                  onRefreshPinned?.();
                                }}
                                className="p-1 hover:text-rose-400 text-slate-500 rounded"
                                title="Unpin tender"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account / User Profile Footer */}
      <div className="p-3 border-t border-slate-border shrink-0 bg-surface">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/settings?section=account"
            className="flex items-center gap-2 min-w-0 flex-1 p-1 rounded-lg hover:bg-card-bg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-accent shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            {showLabels && (
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-xs font-bold text-[var(--text-color)] truncate">{username}</span>
                <span className="text-[10px] text-slate-500 truncate capitalize">{role}</span>
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition-colors shrink-0"
            title="Logout session"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
