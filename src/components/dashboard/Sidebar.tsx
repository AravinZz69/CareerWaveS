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
  Pin,
  PinOff,
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
  onTogglePin?: () => void;
  prefersReducedMotion: boolean;
  mobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
  onSidebarActivity: () => void;
  onSidebarBlur: (e: React.FocusEvent<HTMLElement>) => void;
}

interface TooltipState {
  label: string;
  badge?: string;
  dotColor?: string;
  top: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  onExitToLanding,
  sidebarRef,
  isPinned,
  isExpanded,
  onTogglePin,
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
    icon: React.FC<{ className?: string; strokeWidth?: number }>;
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
    : 'transition-[width,box-shadow] duration-200 ease-out';

  const labelTransitionClass = prefersReducedMotion
    ? 'transition-none duration-0'
    : 'transition-[opacity,transform] duration-200 ease-out';

  const handleItemHover = (
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
    label: string,
    badge?: string,
    dotColor?: string
  ) => {
    if (isExpanded) {
      setTooltip(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      badge,
      dotColor,
      top: rect.top + rect.height / 2,
    });
  };

  return (
    <>
      {/* ====================================================================
          DESKTOP FIXED SIDEBAR (>= 1024px)
          - Fixed to viewport (position: fixed, top-0 left-0, height: 100dvh)
          - Collapsed rail: 72px wide, centered 44x44px buttons, 20px icons, full opacity (1)
          - Expanded: 260px wide, overlays smoothly when unpinned so main content never jumps
          - Auto-collapses after 10 seconds of inactivity unless pinned
      ==================================================================== */}
      <aside
        ref={sidebarRef}
        onMouseEnter={onSidebarActivity}
        onFocusCapture={onSidebarActivity}
        onBlurCapture={onSidebarBlur}
        onMouseLeave={() => setTooltip(null)}
        aria-label="Main Workspace Sidebar"
        className={`fixed top-0 left-0 z-40 hidden lg:flex flex-col h-[100dvh] max-h-[100dvh] bg-white border-r border-slate-200 select-none overflow-hidden ${transitionClass} ${
          isExpanded ? 'w-[260px]' : 'w-[72px]'
        } ${
          isExpanded && !isPinned
            ? 'shadow-[16px_0_40px_-8px_rgba(15,23,42,0.14),4px_0_16px_-2px_rgba(108,60,225,0.09)]'
            : 'shadow-none'
        }`}
      >
        {/* 1. Pinned Top Brand Header */}
        <div
          className={`shrink-0 h-20 border-b border-slate-200 flex items-center ${
            isExpanded ? 'justify-between px-4' : 'justify-center px-0'
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
                  className="h-10 w-auto object-contain group-hover:scale-[1.02] transition-transform"
                />
              </button>

              <div className="flex items-center gap-1 shrink-0">
                {onTogglePin && (
                  <button
                    type="button"
                    onClick={onTogglePin}
                    title={isPinned ? 'Unpin sidebar (Ctrl+B)' : 'Pin sidebar open (Ctrl+B)'}
                    aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
                    className={`rounded-xl p-2 transition-colors cursor-pointer ${
                      isPinned
                        ? 'bg-[#F3EEFF] text-[#6C3CE1]'
                        : 'text-[#334155] hover:bg-[#F3EEFF] hover:text-[#6C3CE1]'
                    }`}
                  >
                    {isPinned ? (
                      <Pin className="h-4 w-4 stroke-[2]" />
                    ) : (
                      <PinOff className="h-4 w-4 stroke-[2]" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onExitToLanding}
                  title="Return to Home"
                  aria-label="Return to Home"
                  className="rounded-xl p-2 text-[#334155] hover:bg-[#F3EEFF] hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  <Home className="h-4 w-4 stroke-[2]" />
                </button>
              </div>
            </>
          ) : (
            /* Collapsed 44x44px Centered Logo Button */
            <button
              type="button"
              onClick={onExitToLanding}
              onMouseEnter={(e) => handleItemHover(e, 'CareerWave Home')}
              onMouseLeave={() => setTooltip(null)}
              aria-label="CareerWave Home"
              className="h-11 w-11 rounded-xl bg-[#FAF8FF] border border-purple-200 flex items-center justify-center p-1.5 hover:border-[#6C3CE1] transition-colors cursor-pointer mx-auto"
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
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden sidebar-scroll py-3 space-y-1.5 ${
            isExpanded ? 'px-3' : 'px-3.5'
          }`}
        >
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
                onMouseEnter={(e) =>
                  handleItemHover(e, item.label, item.badge, item.dotColor)
                }
                onMouseLeave={() => setTooltip(null)}
                onFocus={(e) =>
                  handleItemHover(e, item.label, item.badge, item.dotColor)
                }
                onBlur={() => setTooltip(null)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center rounded-xl text-xs font-semibold cursor-pointer group opacity-100 transition-colors duration-150 ${
                  isExpanded
                    ? 'w-full h-11 justify-between px-3.5'
                    : 'h-11 w-11 mx-auto justify-center px-0'
                } ${
                  isActive
                    ? 'bg-[#6C3CE1] text-white shadow-xs font-bold'
                    : 'text-[#334155] hover:bg-[#F3EEFF] hover:text-[#6C3CE1]'
                }`}
              >
                {/* Left Accent Bar for Active Item */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${
                      isExpanded ? 'left-0 bg-white/90' : '-left-3.5 bg-[#6C3CE1]'
                    }`}
                  />
                )}

                <div
                  className={`flex items-center min-w-0 opacity-100 ${
                    isExpanded ? 'gap-3' : 'justify-center'
                  }`}
                >
                  <div className="relative flex items-center justify-center shrink-0 opacity-100">
                    <Icon
                      strokeWidth={2}
                      className={`h-5 w-5 shrink-0 opacity-100 ${
                        isActive
                          ? 'text-white'
                          : 'text-[#334155] group-hover:text-[#6C3CE1]'
                      }`}
                    />
                    {/* Status dot on the icon when collapsed */}
                    {!isExpanded && item.badge && (
                      <span
                        className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ring-2 ${
                          isActive ? 'ring-[#6C3CE1]' : 'ring-white'
                        } ${item.dotColor || 'bg-[#6C3CE1]'}`}
                      />
                    )}
                  </div>

                  {isExpanded && (
                    <span className={`truncate whitespace-nowrap opacity-100 ${labelTransitionClass}`}>
                      {item.label}
                    </span>
                  )}
                </div>

                {isExpanded && item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-[#6C3CE1]'
                        : item.id === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-[#F3EEFF] text-[#6C3CE1]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Pinned Bottom User Profile + Logout */}
        <div
          className={`shrink-0 border-t border-slate-200 bg-slate-50/80 ${
            isExpanded ? 'p-3.5 space-y-2.5' : 'py-3 px-0 flex flex-col items-center gap-2'
          }`}
        >
          {isExpanded ? (
            <>
              {plan !== 'Premium' && (
                <div className="rounded-xl bg-[#FAF8FF] p-3 text-slate-900 border border-purple-200">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-[#6C3CE1] flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#6C3CE1] shrink-0" />
                      {plan} Plan
                    </span>
                    <button
                      type="button"
                      onClick={() => openUpgradeModal()}
                      className="rounded-lg bg-[#6C3CE1] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#5829C7] transition-colors cursor-pointer shrink-0"
                    >
                      Upgrade
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight line-clamp-1">
                    Unlock unlimited ATS resume tailoring & voice interviews.
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
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-[#6C3CE1]/20 shrink-0"
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
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-[#334155] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="h-4 w-4 stroke-[2]" />
                </button>
              </div>
            </>
          ) : (
            /* Collapsed 44x44px Centered Avatar & Sign Out Buttons */
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
                className="relative h-11 w-11 rounded-xl flex items-center justify-center hover:bg-[#F3EEFF] transition-colors cursor-pointer mx-auto"
              >
                <img
                  src={
                    profile?.avatar_url ||
                    'https://api.dicebear.com/7.x/initials/svg?seed=Member'
                  }
                  alt={profile?.full_name || 'Member'}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-[#6C3CE1]/25"
                />
                <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                onMouseEnter={(e) => handleItemHover(e, 'Sign Out')}
                onMouseLeave={() => setTooltip(null)}
                aria-label="Sign Out"
                className="h-11 w-11 rounded-xl flex items-center justify-center text-[#334155] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer mx-auto"
              >
                <LogOut className="h-5 w-5 stroke-[2]" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Crisp Floating Tooltip to the Right of Collapsed 72px Rail */}
      {!isExpanded && tooltip && (
        <div
          role="tooltip"
          style={{ top: tooltip.top }}
          className="fixed left-[80px] z-50 -translate-y-1/2 pointer-events-none hidden lg:flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg border border-slate-800 whitespace-nowrap"
        >
          <span>{tooltip.label}</span>
          {tooltip.badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#6C3CE1] px-2 py-0.5 text-[10px] font-bold text-white">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  tooltip.dotColor || 'bg-white'
                }`}
              />
              {tooltip.badge}
            </span>
          )}
        </div>
      )}

      {/* ====================================================================
          MOBILE & TABLET SLIDE-IN DRAWER (< 1024px)
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
          className={`fixed inset-0 bg-slate-900/50 ${
            prefersReducedMotion
              ? 'transition-none duration-0'
              : 'transition-opacity duration-200 ease-out'
          } ${mobileDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Slide-in Drawer Panel */}
        <aside
          aria-label="Mobile Navigation Drawer"
          className={`relative z-10 flex h-[100dvh] max-h-[100dvh] w-[260px] max-w-[85vw] flex-col bg-white shadow-2xl border-r border-slate-200 ${
            prefersReducedMotion
              ? 'transition-none duration-0'
              : 'transition-transform duration-200 ease-out'
          } ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Drawer Header */}
          <div className="shrink-0 flex items-center justify-between px-4 h-20 border-b border-slate-200">
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
              className="rounded-xl p-2 text-[#334155] hover:bg-[#F3EEFF] hover:text-[#6C3CE1] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Scrollable Nav */}
          <nav className="flex-1 min-h-0 overflow-y-auto sidebar-scroll px-3 py-3 space-y-1.5">
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
                  className={`w-full h-11 flex items-center justify-between rounded-xl px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#6C3CE1] text-white font-bold shadow-xs'
                      : 'text-[#334155] hover:bg-[#F3EEFF] hover:text-[#6C3CE1]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      strokeWidth={2}
                      className={`h-5 w-5 ${
                        isActive ? 'text-white' : 'text-[#334155]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-[#6C3CE1]'
                          : item.id === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#F3EEFF] text-[#6C3CE1]'
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
          <div className="shrink-0 p-4 border-t border-slate-200 bg-slate-50/80 space-y-3">
            {plan !== 'Premium' && (
              <div className="rounded-xl bg-[#FAF8FF] border border-purple-200 p-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#6C3CE1]">{plan} Plan</span>
                <button
                  type="button"
                  onClick={() => {
                    onCloseMobileDrawer();
                    openUpgradeModal();
                  }}
                  className="rounded-lg bg-[#6C3CE1] px-2.5 py-1 text-[10px] font-bold text-white"
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
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-[#6C3CE1]/20 shrink-0"
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
                className="rounded-xl p-2 text-[#334155] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
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
