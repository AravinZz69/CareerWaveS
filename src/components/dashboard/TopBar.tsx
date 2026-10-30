import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  LogOut,
  User,
  Shield,
  Sparkles,
  CheckCheck,
  Menu,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardPageId } from './DashboardShell';
import { OpenRouterConfigModal } from '../common/OpenRouterConfigModal';

interface TopBarProps {
  activePage: DashboardPageId;
  onSelectPage: (page: DashboardPageId) => void;
  onExitToLanding: () => void;
  onOpenSearch?: () => void;
  onOpenMobileDrawer?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activePage,
  onSelectPage,
  onExitToLanding,
  onOpenSearch,
  onOpenMobileDrawer,
}) => {
  const {
    profile,
    role,
    plan,
    signOut,
    openUpgradeModal,
    openRouterModel,
    isOpenRouterConfigured,
  } = useAuth();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [openRouterModalOpen, setOpenRouterModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setNotifications(d.notifications || []);
          setUnreadCount(d.unreadCount || 0);
        }
      })
      .catch(() => {});
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/alerts/mark-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await signOut();
    onExitToLanding();
  };

  const pageLabels: Record<DashboardPageId, string> = {
    overview: 'Career Overview',
    resume: 'ATS Resume Studio',
    jobs: 'Live Job Hunter',
    applications: 'Application Tracker',
    interviews: 'Live Voice Interviewer',
    roadmap: 'Career Roadmap & Skill Gap',
    projects: 'Portfolio Projects',
    courses: 'Courses & Certifications',
    linkedin: 'LinkedIn Optimizer',
    portfolio: 'Portfolio Website Builder',
    settings: 'Account & Billing Settings',
    admin: 'SaaS Administration',
  };

  return (
    <header className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
      {/* OpenRouter Modal (Admin Only) */}
      {role === 'admin' && (
        <OpenRouterConfigModal
          isOpen={openRouterModalOpen}
          onClose={() => setOpenRouterModalOpen(false)}
        />
      )}

      {/* Left: Mobile Menu Button + Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="lg:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {pageLabels[activePage] || 'Workspace'}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Trigger */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-400 hover:border-slate-400 hover:bg-white transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <span>Search jobs, tools, or courses...</span>
          </span>
          <kbd className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Plan Badge, Notifications, Profile Dropdown (OpenRouter visible to Admin only) */}
      <div className="flex items-center gap-2.5">
        {role === 'admin' && (
          <button
            type="button"
            onClick={() => setOpenRouterModalOpen(true)}
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              isOpenRouterConfigured
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Configure OpenRouter AI Engine & Model"
          >
            <Cpu className="h-3.5 w-3.5 text-slate-500" />
            <span className="truncate max-w-[140px]">
              {isOpenRouterConfigured
                ? openRouterModel.split('/').pop() || openRouterModel
                : 'OpenRouter'}
            </span>
            {isOpenRouterConfigured && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => openUpgradeModal()}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-slate-600" />
          <span>{plan} Plan</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl border border-slate-200 z-50 animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                <span className="font-serif text-sm font-bold text-slate-900">
                  Job Match Alerts
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:underline cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No new job alerts right now.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifOpen(false);
                        onSelectPage('jobs');
                      }}
                      className={`rounded-xl p-2.5 text-xs cursor-pointer transition-colors ${
                        n.isRead
                          ? 'bg-slate-50 text-slate-600'
                          : 'bg-slate-100 border border-slate-200 font-semibold text-slate-900'
                      }`}
                    >
                      <p className="font-bold text-slate-900">{n.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {n.timeAgo}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
          >
            <img
              src={
                profile?.avatar_url ||
                'https://api.dicebear.com/7.x/initials/svg?seed=Member'
              }
              alt={profile?.full_name || 'Member'}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
            />
            <span className="hidden sm:inline text-xs font-bold text-slate-800 max-w-[110px] truncate">
              {profile?.full_name || 'Member'}
            </span>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-200 z-50 animate-in fade-in duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {profile?.full_name || 'Member'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {profile?.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onSelectPage('settings');
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left"
              >
                <User className="h-4 w-4 text-slate-500" />
                <span>Account & Plan</span>
              </button>

              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setOpenRouterModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left"
                >
                  <Cpu className="h-4 w-4 text-slate-500" />
                  <span>AI Model Settings</span>
                </button>
              )}

              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onSelectPage('admin');
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer text-left"
                >
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span>Admin Panel</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left border-t border-slate-100 mt-1 pt-1.5"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
