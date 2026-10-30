import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Kanban,
  Mic,
  Map,
  FolderGit2,
  GraduationCap,
  Share2,
  Globe,
  Settings,
  ShieldAlert,
  LogOut,
  Home,
  X,
  Sparkles,
} from 'lucide-react';
import { DashboardPageId } from './DashboardShell';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activePage: DashboardPageId;
  onSelectPage: (page: DashboardPageId) => void;
  onExitToLanding: () => void;
  sidebarRef: React.RefObject<HTMLElement | null>;
  isPinned: boolean;
  isExpanded: boolean;
  prefersReducedMotion: boolean;
  mobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
  onSidebarActivity: () => void;
  onSidebarBlur: (e: React.FocusEvent<HTMLElement>) => void;
}

interface TooltipState {
  label: string;
  badge?: string;
  top: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  onExitToLanding,
  sidebarRef,
  isPinned,
  isExpanded,
  prefersReducedMotion,
  mobileDrawerOpen,
  onCloseMobileDrawer,
  onSidebarActivity,
  onSidebarBlur,
}) => {
  const { profile, role, plan, signOut, openUpgradeModal } = useAuth();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const navItems: {
    id: DashboardPageId;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
    dotColor?: string;
    adminOnly?: boolean;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'resume',
      label: 'Resume Studio',
      icon: FileText,
      badge: 'ATS',
      dotColor: 'bg-[#6C3CE1]',
    },
    {
      id: 'jobs',
      label: 'Job Hunter',
      icon: Briefcase,
      badge: 'Live',
      dotColor: 'bg-emerald-500',
    },
    { id: 'applications', label: 'Applications', icon: Kanban },
    {
      id: 'interviews',
      label: 'Voice Interview',
      icon: Mic,
      badge: 'Voice',
      dotColor: 'bg-sky-500',
    },
    { id: 'roadmap', label: 'Roadmap & Skills', icon: Map },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'courses', label: 'Courses & Certs', icon: GraduationCap },
    { id: 'linkedin', label: 'LinkedIn Studio', icon: Share2 },
    { id: 'portfolio', label: 'Portfolio Builder', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: ShieldAlert,
      badge: 'Admin',
      dotColor: 'bg-amber-500',
      adminOnly: true,
    },
  ];

  // Hide admin navigation and links from non-admins
  const visibleItems = navItems.filter((item) => !item.adminOnly || role === 'admin');

  const handleLogout = async () => {
    onCloseMobileDrawer();
    await signOut();
    onExitToLanding();
  };

  const transitionClass = prefersReducedMotion
    ? 'transition-none duration-0'
    : 'transition-all duration-250 ease-in-out';

  const labelTransitionClass = prefersReducedMotion
    ? 'transition-none duration-0'
    : 'transition-[opacity,transform] duration-250 ease-in-out';

  const handleItemHover = (
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
    label: string,
    badge?: string
  ) => {
    if (isExpanded) {
      setTooltip(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      badge,
      top: rect.top + rect.height / 2,
    });
  };

  return (
    <>
      {/* ====================================================================
          DESKTOP FIXED SIDEBAR (>= 1024px)
          Locked to viewport (fixed top-0 left-0 h-[100dvh]), internal nav scroll,
          pinned bottom user card, 3s auto-minimize to 72px rail, pinned when expanded
      ==================================================================== */}
      <aside
        ref={sidebarRef}
        onMouseEnter={onSidebarActivity}
        onMouseMove={onSidebarActivity}
        onMouseDown={onSidebarActivity}
        onClick={onSidebarActivity}
        onKeyDown={onSidebarActivity}
        onFocusCapture={onSidebarActivity}
        onBlurCapture={onSidebarBlur}
        onMouseLeave={() => setTooltip(null)}
        aria-label="Main Workspace Sidebar"
        className={`fixed top-0 left-0 z-40 hidden lg:flex flex-col h-[100dvh] max-h-[100dvh] bg-white border-r border-slate-200 select-none overflow-hidden ${transitionClass} ${
          isExpanded ? 'w-[272px]' : 'w-[72px]'
        } ${
          isExpanded && !isPinned
            ? 'shadow-[14px_0_36px_-6px_rgba(15,23,42,0.12),4px_0_14px_-2px_rgba(108,60,225,0.07)]'
            : 'shadow-none'
        }`}
      >
        {/* 1. Pinned Top Brand Header */}
        <div
          className={`shrink-0 h-20 border-b border-slate-200 flex items-center ${
            isExpanded ? 'justify-between px-4' : 'justify-center px-2'
          }`}
        >
          {isExpanded ? (
            <>
              <button
                type="button"
                onClick={onExitToLanding}
                className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none min-w-0"
              >
                <img
                  src="/assets/aistudio/CareerWaves_CWS_Growth_Logo_2a4e39b3.png"
                  alt="CareerWave Logo"
                  className="h-11 w-auto object-contain group-hover:scale-[1.02] transition-transform"
                />
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onExitToLanding}
                  title="Return to Home"
                  aria-label="Return to Home"
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <Home className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            /* Collapsed Small Logo Mark */
            <button
              type="button"
              onClick={onExitToLanding}
              onMouseEnter={(e) => handleItemHover(e, 'CareerWave Home')}
              onMouseLeave={() => setTooltip(null)}
              aria-label="CareerWave Home"
              className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 hover:border-slate-300 transition-colors cursor-pointer"
            >
              <img
                src="/assets/aistudio/CareerWaves_CWS_Growth_Logo_2a4e39b3.png"
                alt="CW"
                className="h-full w-full object-contain"
              />
            </button>
          )}
        </div>

        {/* 2. Scrollable Middle Navigation List */}
        <nav
          onScroll={() => setTooltip(null)}
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden sidebar-scroll py-4 space-y-1 ${
            isExpanded ? 'px-3' : 'px-2'
          }`}
        >
          <div
            className={`px-3 mb-2 overflow-hidden whitespace-nowrap ${labelTransitionClass} ${
              isExpanded
                ? 'opacity-100 translate-x-0 h-4'
                : 'opacity-0 -translate-x-2 h-0 mb-0 pointer-events-none'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </p>
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTooltip(null);
                  onSelectPage(item.id);
                }}
                onMouseEnter={(e) => handleItemHover(e, item.label, item.badge)}
                onMouseLeave={() => setTooltip(null)}
                onFocus={(e) => handleItemHover(e, item.label, item.badge)}
                onBlur={() => setTooltip(null)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center rounded-xl py-2.5 text-xs font-semibold cursor-pointer group ${transitionClass} ${
                  isExpanded
                    ? 'justify-between px-3.5'
                    : 'justify-center px-0'
                } ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div
                  className={`flex items-center min-w-0 ${
                    isExpanded ? 'gap-3' : 'justify-center'
                  }`}
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-slate-900'
                      }`}
                    />
                    {/* Tiny colored dot on the icon when collapsed where a badge existed */}
                    {!isExpanded && item.badge && (
                      <span
                        className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ring-2 ${
                          isActive ? 'ring-slate-900' : 'ring-white'
                        } ${item.dotColor || 'bg-[#6C3CE1]'}`}
                      />
                    )}
                  </div>

                  <span
                    className={`truncate whitespace-nowrap ${labelTransitionClass} ${
                      isExpanded
                        ? 'opacity-100 translate-x-0 w-auto'
                        : 'opacity-0 -translate-x-2 w-0 overflow-hidden pointer-events-none'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 whitespace-nowrap ${labelTransitionClass} ${
                      isExpanded
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-75 w-0 px-0 overflow-hidden pointer-events-none'
                    } ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.id === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Pinned Bottom User Card & Compact Upgrade Strip (Never Cut Off) */}
        <div
          className={`shrink-0 border-t border-slate-200 bg-slate-50/70 ${
            isExpanded ? 'p-3.5 space-y-2.5' : 'p-2 flex flex-col items-center gap-2'
          }`}
        >
          {isExpanded ? (
            <>
              {plan !== 'Premium' && (
                <div className="rounded-xl bg-slate-900 p-3 text-white shadow-2xs border border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-amber-300 shrink-0" />
                      {plan} Plan
                    </span>
                    <button
                      type="button"
                      onClick={() => openUpgradeModal()}
                      className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    >
                      Upgrade
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                    Unlock higher resume tailorings & live voice prep.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={
                      profile?.avatar_url ||
                      'https://api.dicebear.com/7.x/initials/svg?seed=Member'
                    }
                    alt={profile?.full_name || 'Member'}
                    className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {profile?.full_name || 'Member'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {profile?.email || ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            /* Collapsed Bottom User Avatar & Sign Out Icon */
            <>
              <button
                type="button"
                onClick={() => onSelectPage('settings')}
                onMouseEnter={(e) =>
                  handleItemHover(
                    e,
                    `${profile?.full_name || 'Member'} (${plan} Plan)`
                  )
                }
                onMouseLeave={() => setTooltip(null)}
                aria-label="Account Settings"
                className="relative rounded-full p-0.5 hover:ring-2 hover:ring-slate-300 transition-all cursor-pointer"
              >
                <img
                  src={
                    profile?.avatar_url ||
                    'https://api.dicebear.com/7.x/initials/svg?seed=Member'
                  }
                  alt={profile?.full_name || 'Member'}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                onMouseEnter={(e) => handleItemHover(e, 'Sign Out')}
                onMouseLeave={() => setTooltip(null)}
                aria-label="Sign Out"
                className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Floating Tooltip for Collapsed 72px Rail (Fixed outside overflow-y-auto so never clipped) */}
      {!isExpanded && tooltip && (
        <div
          role="tooltip"
          style={{ top: tooltip.top }}
          className="fixed left-[80px] z-50 -translate-y-1/2 pointer-events-none hidden lg:flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg border border-slate-800 whitespace-nowrap"
        >
          <span>{tooltip.label}</span>
          {tooltip.badge && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {tooltip.badge}
            </span>
          )}
        </div>
      )}

      {/* ====================================================================
          MOBILE & TABLET SLIDE-IN DRAWER (< 1024px)
          Opened by menu button in header, dark overlay, closes on route change,
          overlay tap, and Escape key. No auto-minimize.
      ==================================================================== */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileDrawerOpen}
      >
        {/* Dark Backdrop Overlay */}
        <div
          onClick={onCloseMobileDrawer}
          className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs ${
            prefersReducedMotion
              ? 'transition-none duration-0'
              : 'transition-opacity duration-250 ease-in-out'
          } ${mobileDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Slide-in Drawer Panel */}
        <aside
          aria-label="Mobile Navigation Drawer"
          className={`relative z-10 flex h-[100dvh] max-h-[100dvh] w-72 max-w-[85vw] flex-col bg-white shadow-2xl border-r border-slate-200 ${
            prefersReducedMotion
              ? 'transition-none duration-0'
              : 'transition-transform duration-250 ease-in-out'
          } ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Drawer Header */}
          <div className="shrink-0 flex items-center justify-between px-5 h-20 border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                onCloseMobileDrawer();
                onExitToLanding();
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src="/assets/aistudio/CareerWaves_CWS_Growth_Logo_2a4e39b3.png"
                alt="CareerWave Logo"
                className="h-10 w-auto object-contain"
              />
            </button>
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              aria-label="Close Navigation Drawer"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Scrollable Nav */}
          <nav className="flex-1 min-h-0 overflow-y-auto sidebar-scroll px-3.5 py-4 space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Workspace
            </p>
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectPage(item.id);
                    onCloseMobileDrawer();
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.id === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Pinned Drawer User Footer */}
          <div className="shrink-0 p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
            {plan !== 'Premium' && (
              <div className="rounded-xl bg-slate-900 p-3 text-white flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{plan} Plan</span>
                <button
                  type="button"
                  onClick={() => {
                    onCloseMobileDrawer();
                    openUpgradeModal();
                  }}
                  className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-slate-900"
                >
                  Upgrade
                </button>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={
                    profile?.avatar_url ||
                    'https://api.dicebear.com/7.x/initials/svg?seed=Member'
                  }
                  alt={profile?.full_name || 'Member'}
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {profile?.full_name || 'Member'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {profile?.email || ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};
