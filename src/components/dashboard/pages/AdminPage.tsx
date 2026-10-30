import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Skeleton } from '../../ui/SkeletonLoader';
import { AdminSubSections } from './AdminSubSections';
import { AdminAtsGoldenTestSection } from './AdminAtsGoldenTestSection';
import {
  Shield,
  Lock,
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  BookOpen,
  Briefcase,
  Flag,
  MessageSquare,
  Megaphone,
  History,
  Settings,
  ArrowLeft,
  Search,
  Sparkles,
  TrendingUp,
  DollarSign,
  UserCheck,
  UserPlus,
  Percent,
  Cpu,
  AlertTriangle,
  Trash2,
  X,
  Check,
  PlusCircle,
  Ban,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Menu,
  FlaskConical,
} from 'lucide-react';
import { PlanName, UsageFeature } from '../../../lib/supabase';
import { formatINR } from '../../../utils/currency';
import { useSidebarController } from '../../../hooks/useSidebarController';
import { OpenRouterConfigModal } from '../../common/OpenRouterConfigModal';

interface AdminPageProps {
  onNavigateToOverview: () => void;
  onExitToLanding?: () => void;
}

type AdminSectionId =
  | 'overview'
  | 'ats-test'
  | 'users'
  | 'billing'
  | 'usage'
  | 'content'
  | 'jobs'
  | 'flags'
  | 'support'
  | 'announcements'
  | 'audit'
  | 'settings';

const FEATURE_LABELS: Record<UsageFeature, string> = {
  resume_tailoring: 'Resume Tailorings',
  ai_job_match: 'AI Job Matches',
  mock_interview: 'Mock Interviews',
  linkedin_generation: 'LinkedIn Generations',
  portfolio_generation: 'Portfolio Generations',
};

export const AdminPage: React.FC<AdminPageProps> = ({
  onNavigateToOverview,
  onExitToLanding,
}) => {
  const {
    user,
    role,
    profile,
    signOut,
    refreshSaaSStatus,
    getAuthHeaders,
    openRouterModel,
    isOpenRouterConfigured,
  } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSectionId>('overview');
  const [loading, setLoading] = useState(true);
  const [serverForbidden, setServerForbidden] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [openRouterModalOpen, setOpenRouterModalOpen] = useState(false);
  const [adminTooltip, setAdminTooltip] = useState<{
    label: string;
    badge?: string | number;
    top: number;
  } | null>(null);

  const {
    sidebarRef,
    isPinned,
    isExpanded,
    mobileDrawerOpen: mobileMenuOpen,
    setMobileDrawerOpen: setMobileMenuOpen,
    prefersReducedMotion,
    handleSidebarActivity,
    handleSidebarBlur,
  } = useSidebarController({
    userId: user?.id || profile?.email || 'admin',
    activeRouteKey: activeSection,
  });

  const handleAdminSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    if (onExitToLanding) {
      onExitToLanding();
    } else {
      onNavigateToOverview();
    }
  };

  // Admin Data Stores
  const [overviewData, setOverviewData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [billingData, setBillingData] = useState<any>({
    plans: [],
    subscriptions: [],
    invoices: [],
    failedPayments: [],
  });
  const [usageData, setUsageData] = useState<any>({
    events: [],
    byFeature: [],
    topSpenders: [],
    highUsageAlerts: [],
  });
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  // Users filter & Detail Drawer state
  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [creditFeature, setCreditFeature] = useState<UsageFeature>('resume_tailoring');
  const [creditAmount, setCreditAmount] = useState<number>(5);

  // Plan editor state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planPriceDraft, setPlanPriceDraft] = useState<number>(1499);
  const [planLimitsDraft, setPlanLimitsDraft] = useState<any>({});

  // Custom Confirmation Modal State (No window.confirm!)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchAllAdminData = useCallback(async () => {
    if (role !== 'admin') {
      setServerForbidden(true);
      setLoading(false);
      onNavigateToOverview();
      return;
    }
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const ovRes = await fetch('/api/admin/overview', {
        headers,
      });

      if (ovRes.status === 403 || ovRes.status === 401) {
        setServerForbidden(true);
        setLoading(false);
        onNavigateToOverview();
        return;
      }

      setServerForbidden(false);
      const [
        ovJson,
        usrJson,
        billJson,
        usgJson,
        cntJson,
        jbsJson,
        flgJson,
        supJson,
        annJson,
        audJson,
        setJson,
      ] = await Promise.all([
        ovRes.json(),
        fetch('/api/admin/users', { headers }).then((r) => r.json()),
        fetch('/api/admin/billing', { headers }).then((r) => r.json()),
        fetch('/api/admin/usage', { headers }).then((r) => r.json()),
        fetch('/api/admin/content', { headers }).then((r) => r.json()),
        fetch('/api/admin/jobs', { headers }).then((r) => r.json()),
        fetch('/api/admin/feature-flags', { headers }).then((r) =>
          r.json()
        ),
        fetch('/api/admin/support', { headers }).then((r) => r.json()),
        fetch('/api/admin/announcements', { headers }).then((r) =>
          r.json()
        ),
        fetch('/api/admin/audit-logs', { headers }).then((r) => r.json()),
        fetch('/api/admin/settings', { headers }).then((r) => r.json()),
      ]);

      if (ovJson.success) setOverviewData(ovJson);
      if (usrJson.success) setUsersList(usrJson.users || []);
      if (billJson.success) setBillingData(billJson);
      if (usgJson.success) setUsageData(usgJson);
      if (cntJson.success) setContentItems(cntJson.items || []);
      if (jbsJson.success) setJobsList(jbsJson.jobs || []);
      if (flgJson.success) setFeatureFlags(flgJson.flags || []);
      if (supJson.success) setSupportTickets(supJson.tickets || []);
      if (annJson.success) setAnnouncements(annJson.announcements || []);
      if (audJson.success) setAuditLogs(audJson.logs || []);
      if (setJson.success) setPlatformSettings(setJson.settings);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [role, getAuthHeaders, onNavigateToOverview]);

  useEffect(() => {
    fetchAllAdminData();
  }, [fetchAllAdminData]);

  // If server-side `has_role(uid, 'admin')` rejected the request
  if (role !== 'admin' || serverForbidden) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <Card className="max-w-lg w-full p-8 text-center space-y-5 border border-purple-100 shadow-xl bg-white">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto ring-8 ring-red-50/50">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="coral" size="md">
              HTTP 403 — Server-Side has_role() Guard
            </Badge>
            <h2 className="text-2xl font-bold font-serif-heading text-slate-900">
              Admin Authorization Required
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              The <code className="bg-purple-50 text-[#6C3CE1] px-1.5 py-0.5 rounded font-mono">/admin</code> control center and all <code className="bg-purple-50 text-[#6C3CE1] px-1.5 py-0.5 rounded font-mono">/api/admin/*</code> endpoints are strictly protected server-side via PostgreSQL Security Definer function <code className="bg-purple-50 text-[#6C3CE1] px-1.5 py-0.5 rounded font-mono">public.has_role(auth.uid(), 'admin')</code>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToOverview}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const navSections: { id: AdminSectionId; label: string; icon: any; badge?: string | number }[] = [
    { id: 'overview', label: 'Overview & KPIs', icon: LayoutDashboard },
    { id: 'ats-test', label: 'ATS Golden Test & Taxonomy', icon: FlaskConical, badge: '10×5' },
    { id: 'users', label: 'Users & Quotas', icon: Users, badge: usersList.length },
    {
      id: 'billing',
      label: 'Subscriptions & Billing',
      icon: CreditCard,
      badge: billingData.failedPayments?.length ? `${billingData.failedPayments.length}!` : undefined,
    },
    {
      id: 'usage',
      label: 'Usage & AI Cost',
      icon: Activity,
      badge: usageData.highUsageAlerts?.length || undefined,
    },
    { id: 'content', label: 'Content Manager', icon: BookOpen, badge: contentItems.length },
    { id: 'jobs', label: 'Jobs Moderation', icon: Briefcase, badge: jobsList.length },
    { id: 'flags', label: 'Feature Flags', icon: Flag },
    {
      id: 'support',
      label: 'Support Tickets',
      icon: MessageSquare,
      badge: supportTickets.filter((t) => t.status === 'open').length || undefined,
    },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'audit', label: 'Audit Log', icon: History, badge: auditLogs.length },
    { id: 'settings', label: 'AI & System Settings', icon: Settings },
  ];

  // User Actions
  const selectedUser = usersList.find((u) => u.id === selectedUserId) || null;

  const handleUserAction = async (userId: string, payload: Record<string, any>, toastText: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    showToast(toastText);
    await fetchAllAdminData();
    await refreshSaaSStatus();
  };

  const handleDeleteUser = (u: any) => {
    setConfirmModal({
      title: 'Delete User Account Permanently',
      message: `Are you sure you want to delete ${u.full_name} (${u.email}) and revoke their subscription? This action will be permanently recorded in audit_logs.`,
      confirmLabel: 'Delete User',
      onConfirm: async () => {
        await fetch(`/api/admin/users/${u.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (selectedUserId === u.id) setSelectedUserId(null);
        showToast(`Deleted user ${u.email} (logged to audit_logs).`);
        await fetchAllAdminData();
      },
    });
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      !userSearch.trim() ||
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesPlan = userPlanFilter === 'all' || u.plan === userPlanFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Billing Actions
  const handleSavePlanEdit = async (planId: string) => {
    await fetch(`/api/admin/plans/${planId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        price_monthly: Number(planPriceDraft),
        feature_limits: planLimitsDraft,
      }),
    });
    setEditingPlanId(null);
    showToast('Updated plan pricing and monthly feature limits (logged to audit_logs).');
    await fetchAllAdminData();
    await refreshSaaSStatus();
  };

  const handleTogglePlanActive = async (plan: any) => {
    await fetch(`/api/admin/plans/${plan.id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: !plan.is_active }),
    });
    showToast(`${plan.name} plan ${!plan.is_active ? 'enabled' : 'disabled'}.`);
    await fetchAllAdminData();
  };

  const handleInvoiceAction = async (invId: string, action: 'retry' | 'void') => {
    await fetch(`/api/admin/invoices/${invId}/action`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action }),
    });
    showToast(`Invoice ${invId} ${action === 'retry' ? 'retried & marked paid' : 'voided'}.`);
    await fetchAllAdminData();
    await refreshSaaSStatus();
  };

  const activeSectionMeta =
    navSections.find((s) => s.id === activeSection) || navSections[0];

  const transitionClass = prefersReducedMotion
    ? 'transition-none duration-0'
    : 'transition-all duration-250 ease-in-out';

  const labelTransitionClass = prefersReducedMotion
    ? 'transition-none duration-0'
    : 'transition-[opacity,transform] duration-250 ease-in-out';

  const handleAdminItemHover = (
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
    label: string,
    badge?: string | number
  ) => {
    if (isExpanded) {
      setAdminTooltip(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setAdminTooltip({
      label,
      badge,
      top: rect.top + rect.height / 2,
    });
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-slate-50/50 flex text-slate-900">
      {/* ====================================================================
          DESKTOP FIXED ADMIN SIDEBAR (>= 1024px)
          Locked to viewport (fixed top-0 left-0 h-[100dvh]), internal nav scroll,
          pinned bottom admin card, 10s auto-minimize to 72px rail, floating overlay expand
      ==================================================================== */}
      <aside
        ref={sidebarRef}
        onMouseEnter={handleSidebarActivity}
        onMouseMove={handleSidebarActivity}
        onMouseDown={handleSidebarActivity}
        onClick={handleSidebarActivity}
        onKeyDown={handleSidebarActivity}
        onFocusCapture={handleSidebarActivity}
        onBlurCapture={handleSidebarBlur}
        onMouseLeave={() => setAdminTooltip(null)}
        aria-label="Admin Panel Sidebar"
        className={`fixed top-0 left-0 z-40 hidden lg:flex flex-col h-[100dvh] max-h-[100dvh] bg-white border-r border-slate-200 select-none overflow-hidden ${transitionClass} ${
          isExpanded ? 'w-[272px]' : 'w-[72px]'
        } ${
          isExpanded && !isPinned
            ? 'shadow-[14px_0_36px_-6px_rgba(15,23,42,0.12),4px_0_14px_-2px_rgba(108,60,225,0.08)]'
            : 'shadow-none'
        }`}
      >
        {/* 1. Pinned Top Brand Header & Pin Control */}
        <div
          className={`shrink-0 h-20 border-b border-slate-200 flex items-center ${
            isExpanded ? 'justify-between px-4' : 'justify-center px-2'
          }`}
        >
          {isExpanded ? (
            <div className="flex items-center justify-between w-full gap-2 min-w-0">
              <img
                src="/assets/aistudio/CareerWaves_CWS_Growth_Logo_2a4e39b3.png"
                alt="CareerWave Logo"
                className="h-10 w-auto object-contain"
              />
              <span className="rounded-full bg-[#F4F0FF] border border-purple-200 px-2.5 py-0.5 text-[10px] font-extrabold text-[#6C3CE1] uppercase tracking-wider shrink-0">
                Admin
              </span>
            </div>
          ) : (
            /* Collapsed Small Logo Mark */
            <div
              onMouseEnter={(e) => handleAdminItemHover(e, 'CareerWave Admin Panel', 'Admin')}
              onMouseLeave={() => setAdminTooltip(null)}
              className="relative h-11 w-11 rounded-2xl bg-[#FAF8FF] border border-purple-200 flex items-center justify-center p-1.5"
            >
              <img
                src="/assets/aistudio/CareerWaves_CWS_Growth_Logo_2a4e39b3.png"
                alt="CW Admin"
                className="h-full w-full object-contain"
              />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#6C3CE1] ring-2 ring-white" />
            </div>
          )}
        </div>

        {/* 2. Scrollable Admin Navigation List */}
        <nav
          onScroll={() => setAdminTooltip(null)}
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
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              SaaS Admin Panel (/admin)
            </p>
          </div>

          {navSections.map((sec) => {
            const Icon = sec.icon;
            const active = activeSection === sec.id;
            const hasAlertBadge =
              sec.id === 'billing' || sec.id === 'usage' || sec.id === 'support';

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setAdminTooltip(null);
                  setActiveSection(sec.id);
                }}
                onMouseEnter={(e) => handleAdminItemHover(e, sec.label, sec.badge)}
                onMouseLeave={() => setAdminTooltip(null)}
                onFocus={(e) => handleAdminItemHover(e, sec.label, sec.badge)}
                onBlur={() => setAdminTooltip(null)}
                aria-label={sec.label}
                aria-current={active ? 'page' : undefined}
                className={`relative w-full flex items-center rounded-xl py-2.5 text-xs font-semibold cursor-pointer group ${transitionClass} ${
                  isExpanded
                    ? 'justify-between px-3.5'
                    : 'justify-center px-0'
                } ${
                  active
                    ? 'bg-[#6C3CE1] text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-[#FAF8FF] hover:text-[#6C3CE1]'
                }`}
              >
                <div
                  className={`flex items-center min-w-0 ${
                    isExpanded ? 'gap-2.5' : 'justify-center'
                  }`}
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    {/* Tiny colored dot on the icon when collapsed where a badge existed */}
                    {!isExpanded && sec.badge !== undefined && (
                      <span
                        className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ring-2 ${
                          active ? 'ring-[#6C3CE1]' : 'ring-white'
                        } ${hasAlertBadge ? 'bg-amber-500' : 'bg-[#6C3CE1]'}`}
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
                    {sec.label}
                  </span>
                </div>

                {sec.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 whitespace-nowrap ${labelTransitionClass} ${
                      isExpanded
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-75 w-0 px-0 overflow-hidden pointer-events-none'
                    } ${
                      active
                        ? 'bg-white text-[#6C3CE1]'
                        : 'bg-[#F4F0FF] text-[#6C3CE1]'
                    }`}
                  >
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Pinned Bottom Admin Profile & Sign Out Footer (Never Cut Off) */}
        <div
          className={`shrink-0 border-t border-slate-200 bg-slate-50/70 ${
            isExpanded ? 'p-3.5 space-y-2.5' : 'p-2 flex flex-col items-center gap-2'
          }`}
        >
          {isExpanded ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={
                      profile?.avatar_url ||
                      'https://api.dicebear.com/7.x/initials/svg?seed=Admin'
                    }
                    alt={profile?.full_name || 'Administrator'}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-[#6C3CE1]/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {profile?.full_name || 'Administrator'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {profile?.email || 'admin@careerwave.in'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAdminSignOut}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdminSignOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 py-2 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out of Admin</span>
              </button>
            </>
          ) : (
            <>
              <div
                onMouseEnter={(e) =>
                  handleAdminItemHover(
                    e,
                    `${profile?.full_name || 'Administrator'} (${
                      profile?.email || 'admin@careerwave.in'
                    })`
                  )
                }
                onMouseLeave={() => setAdminTooltip(null)}
                className="relative rounded-full p-0.5"
              >
                <img
                  src={
                    profile?.avatar_url ||
                    'https://api.dicebear.com/7.x/initials/svg?seed=Admin'
                  }
                  alt={profile?.full_name || 'Administrator'}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-[#6C3CE1]/25"
                />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <button
                type="button"
                onClick={handleAdminSignOut}
                onMouseEnter={(e) => handleAdminItemHover(e, 'Sign Out of Admin')}
                onMouseLeave={() => setAdminTooltip(null)}
                aria-label="Sign Out of Admin"
                className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Floating Tooltip for Collapsed 72px Admin Rail */}
      {!isExpanded && adminTooltip && (
        <div
          role="tooltip"
          style={{ top: adminTooltip.top }}
          className="fixed left-[80px] z-50 -translate-y-1/2 pointer-events-none hidden lg:flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg border border-slate-800 whitespace-nowrap"
        >
          <span>{adminTooltip.label}</span>
          {adminTooltip.badge !== undefined && (
            <span className="rounded-full bg-[#6C3CE1] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {adminTooltip.badge}
            </span>
          )}
        </div>
      )}

      {/* ====================================================================
          MOBILE & TABLET ADMIN SLIDE-IN DRAWER (< 1024px)
      ==================================================================== */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div
          onClick={() => setMobileMenuOpen(false)}
          className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs ${
            prefersReducedMotion
              ? 'transition-none duration-0'
              : 'transition-opacity duration-250 ease-in-out'
          } ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          aria-label="Mobile Admin Navigation Drawer"
          className={`relative z-10 flex h-[100dvh] max-h-[100dvh] w-72 max-w-[85vw] flex-col bg-white shadow-2xl border-r border-slate-200 ${
            prefersReducedMotion
              ? 'transition-none duration-0'
              : 'transition-transform duration-250 ease-in-out'
          } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="shrink-0 flex items-center justify-between px-5 h-20 border-b border-slate-200">
            <img
              src="/assets/aistudio/CareerWaves_CWS_Growth_Logo_2a4e39b3.png"
              alt="CareerWave Logo"
              className="h-10 w-auto object-contain"
            />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close Admin Menu"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 min-h-0 overflow-y-auto sidebar-scroll px-4 py-4 space-y-1">
            {navSections.map((sec) => {
              const Icon = sec.icon;
              const active = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(sec.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#6C3CE1] text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{sec.label}</span>
                  </div>
                  {sec.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-[#F4F0FF] text-[#6C3CE1]'
                      }`}
                    >
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="shrink-0 p-4 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={
                  profile?.avatar_url ||
                  'https://api.dicebear.com/7.x/initials/svg?seed=Admin'
                }
                alt={profile?.full_name || 'Administrator'}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-[#6C3CE1]/20 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {profile?.full_name || 'Administrator'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {profile?.email || 'admin@careerwave.in'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAdminSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-50 text-rose-600 py-2.5 text-xs font-bold cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Right Column: Fixed Admin Header + Independently Scrollable Main Content */}
      <div
        className={`flex-1 flex flex-col h-[100dvh] max-h-[100dvh] min-w-0 overflow-hidden ${
          prefersReducedMotion
            ? 'transition-none duration-0'
            : 'transition-[padding-left] duration-250 ease-in-out'
        } ${isPinned ? 'lg:pl-[272px]' : 'lg:pl-[72px]'}`}
      >
        <header className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Open Admin Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-heading text-xl sm:text-2xl font-bold text-slate-900">
                  {activeSectionMeta.label}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <Shield className="w-3 h-3" />
                  Admin Panel
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                CareerWave SaaS Operations & Platform Governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setOpenRouterModalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                isOpenRouterConfigured
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Configure OpenRouter AI Engine & Model"
            >
              <Cpu className="h-3.5 w-3.5 text-slate-500" />
              <span className="truncate max-w-[160px]">
                {isOpenRouterConfigured
                  ? openRouterModel.split('/').pop() || openRouterModel
                  : 'AI Model: Gemini (Default)'}
              </span>
              {isOpenRouterConfigured && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAllAdminData}
              className="text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </Button>

            <button
              type="button"
              onClick={handleAdminSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <OpenRouterConfigModal
          isOpen={openRouterModalOpen}
          onClose={() => setOpenRouterModalOpen(false)}
        />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl w-full mx-auto space-y-6">
          {/* Top Admin Hero Strip */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#6C3CE1] via-[#7E52E8] to-[#905cf0] text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold">
                <Shield className="w-3.5 h-3.5 text-emerald-300" />
                <span>RBAC Verified: public.has_role(auth.uid(), 'admin') === TRUE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-heading text-white">
                CareerWave SaaS Admin Control Center
              </h2>
              <p className="text-xs sm:text-sm text-purple-100">
                Manage users, plans, subscriptions, AI token telemetry, content, feature flags, support, and audit logs.
              </p>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{toastMsg}</span>
              </div>
              <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Responsive Mobile Section Selector */}
          <div className="lg:hidden overflow-x-auto pb-1">
            <div className="flex items-center gap-2 min-w-max">
              {navSections.map((sec) => {
                const Icon = sec.icon;
                const active = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      active
                        ? 'bg-[#6C3CE1] text-white shadow-sm'
                        : 'bg-white border border-purple-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full-Width Admin Section Content */}
          <div>
            <div className="space-y-6">
          {loading && !overviewData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <Card key={n} className="p-5 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </Card>
                ))}
              </div>
              <Card className="p-6">
                <Skeleton className="h-64 w-full" />
              </Card>
            </div>
          ) : (
            <>
              {/* ================================================================
                  SECTION 1: OVERVIEW (8 KPI Cards + 3 Time-Series Charts)
              ================================================================ */}
              {activeSection === 'overview' && overviewData && (
                <div className="space-y-6">
                  {/* 8 KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      {
                        label: 'Total Users',
                        value: overviewData.kpis.totalUsers,
                        sub: '+18% vs last month',
                        icon: Users,
                        color: 'text-[#6C3CE1] bg-[#F4F0FF]',
                      },
                      {
                        label: 'New Signups (7d)',
                        value: overviewData.kpis.newSignupsThisWeek,
                        sub: 'Verified .edu & pro',
                        icon: UserPlus,
                        color: 'text-emerald-600 bg-emerald-50',
                      },
                      {
                        label: 'Active Users',
                        value: overviewData.kpis.activeUsers,
                        sub: 'Non-suspended',
                        icon: UserCheck,
                        color: 'text-blue-600 bg-blue-50',
                      },
                      {
                        label: 'Paying Subscribers',
                        value: overviewData.kpis.payingUsers,
                        sub: 'Pro & Premium tiers',
                        icon: Sparkles,
                        color: 'text-amber-600 bg-amber-50',
                      },
                      {
                        label: 'Monthly Recurring (MRR)',
                        value: formatINR(overviewData.kpis.mrr),
                        sub: 'ARR ' + formatINR(overviewData.kpis.mrr * 12),
                        icon: DollarSign,
                        color: 'text-emerald-600 bg-emerald-50',
                      },
                      {
                        label: 'Monthly Churn',
                        value: `${overviewData.kpis.churnRate}%`,
                        sub: 'Below 3.0% target',
                        icon: TrendingUp,
                        color: 'text-[#FF5B79] bg-red-50',
                      },
                      {
                        label: 'AI Cost This Month',
                        value: formatINR(Math.round(overviewData.kpis.aiCostThisMonth * 85)),
                        sub: 'Gemini Flash + Pro',
                        icon: Cpu,
                        color: 'text-[#6C3CE1] bg-[#F4F0FF]',
                      },
                      {
                        label: 'SaaS Gross Margin',
                        value: `${overviewData.kpis.grossMargin}%`,
                        sub: 'Net of AI token spend',
                        icon: Percent,
                        color: 'text-emerald-600 bg-emerald-50',
                      },
                    ].map((kpi, idx) => {
                      const Icon = kpi.icon;
                      return (
                        <Card
                          key={idx}
                          className="p-5 bg-white border border-purple-100 shadow-soft space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500">
                              {kpi.label}
                            </span>
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpi.color}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-2xl font-extrabold font-serif-heading text-slate-900">
                            {kpi.value}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">{kpi.sub}</div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Charts Row: Signups Over Time & Revenue Over Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Signups Chart */}
                    <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            User Signups & Paying Conversions
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            6-month cohort growth (Total vs. Pro/Premium)
                          </p>
                        </div>
                        <Badge variant="purple" size="sm">
                          +32% MoM
                        </Badge>
                      </div>

                      <div className="h-48 flex items-end gap-3 pt-4 px-2 border-b border-purple-50">
                        {(overviewData.charts.signupsChart || []).map((pt: any) => {
                          const maxVal = 260;
                          const totalH = Math.round((pt.signups / maxVal) * 140);
                          const paidH = Math.round((pt.paying / maxVal) * 140);
                          return (
                            <div
                              key={pt.label}
                              className="flex-1 flex flex-col items-center gap-1.5"
                            >
                              <span className="text-[10px] font-bold text-slate-700">
                                {pt.signups}
                              </span>
                              <div className="w-full flex items-end justify-center gap-1">
                                <div
                                  style={{ height: `${totalH}px` }}
                                  className="w-3.5 rounded-t-lg bg-[#6C3CE1]"
                                  title={`Total Signups: ${pt.signups}`}
                                />
                                <div
                                  style={{ height: `${paidH}px` }}
                                  className="w-3.5 rounded-t-lg bg-emerald-400"
                                  title={`Paying: ${pt.paying}`}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {pt.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Revenue vs AI Cost Chart */}
                    <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            MRR Revenue vs. AI Token Cost (₹)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Monthly recurring revenue in INR scaling against AI compute spend
                          </p>
                        </div>
                        <Badge variant="green" size="sm">
                          98% Gross Margin
                        </Badge>
                      </div>

                      <div className="h-48 flex items-end gap-3 pt-4 px-2 border-b border-purple-50">
                        {(overviewData.charts.revenueChart || []).map((pt: any) => {
                          const maxMrr = 300000;
                          const h = Math.max(14, Math.round((pt.mrr / maxMrr) * 140));
                          return (
                            <div
                              key={pt.label}
                              className="flex-1 flex flex-col items-center gap-1.5"
                            >
                              <span className="text-[10px] font-bold text-emerald-700">
                                {formatINR(pt.mrr)}
                              </span>
                              <div
                                style={{ height: `${h}px` }}
                                className="w-full max-w-[32px] rounded-t-xl bg-gradient-to-t from-[#6C3CE1] to-[#905cf0]"
                              />
                              <span className="text-[10px] font-semibold text-slate-400">
                                {pt.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* Usage Over Time Chart */}
                  <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Daily AI Edge Function Invocations & Token Throughput
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Resume Tailorings, Job Matches, Mock Interviews, LinkedIn & Portfolio Generations
                        </p>
                      </div>
                      <Badge variant="purple" size="sm">
                        Last 7 Days
                      </Badge>
                    </div>

                    <div className="grid grid-cols-7 gap-3 pt-2">
                      {(overviewData.charts.usageByDayChart || []).map((d: any) => (
                        <div
                          key={d.day}
                          className="p-3 rounded-2xl bg-[#FAF8FF] border border-purple-100 text-center space-y-1"
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {d.day}
                          </span>
                          <div className="text-base font-extrabold text-[#6C3CE1]">{d.calls}</div>
                          <div className="text-[10px] text-slate-500">
                            {(d.tokens / 1000).toFixed(0)}k tok
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* ================================================================
                  SECTION 2: USERS (Search, Filters, Detail Drawer, Plan/Credits/Status/Delete)
              ================================================================ */}
              {activeSection === 'users' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif-heading font-bold text-xl text-slate-900">
                        User Directory, Quotas & Access Control
                      </h3>
                      <p className="text-xs text-slate-500">
                        Click any user to open their Detail Drawer, change plan, grant bonus AI credits, suspend/reactivate, or delete.
                      </p>
                    </div>
                  </div>

                  {/* Search & Filters Bar */}
                  <Card className="p-4 bg-white border border-purple-100 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF8FF] border border-purple-100 rounded-xl focus:bg-white focus:outline-none focus:border-[#6C3CE1]"
                      />
                    </div>
                    <select
                      value={userPlanFilter}
                      onChange={(e) => setUserPlanFilter(e.target.value)}
                      className="p-2 text-xs bg-[#FAF8FF] border border-purple-100 rounded-xl font-semibold text-slate-700"
                    >
                      <option value="all">All Plans</option>
                      <option value="Free">Free Plan</option>
                      <option value="Pro">Pro Plan</option>
                      <option value="Premium">Premium Plan</option>
                    </select>
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className="p-2 text-xs bg-[#FAF8FF] border border-purple-100 rounded-xl font-semibold text-slate-700"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </Card>

                  {/* Users Table */}
                  <Card className="p-6 bg-white border border-purple-100 shadow-soft">
                    {filteredUsers.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No users match your search criteria.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-purple-100 text-slate-400 font-semibold">
                              <th className="py-3 pr-3">User</th>
                              <th className="py-3 px-3">Plan</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3">Resumes / Apps</th>
                              <th className="py-3 px-3">AI Calls / Spend</th>
                              <th className="py-3 pl-3 text-right">Manage</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-50">
                            {filteredUsers.map((u) => (
                              <tr key={u.id} className="hover:bg-[#FAF8FF]">
                                <td className="py-3.5 pr-3">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={u.avatar_url}
                                      alt={u.full_name}
                                      className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-100"
                                    />
                                    <div>
                                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                        {u.full_name}
                                        {u.role === 'admin' && (
                                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[#6C3CE1] text-[9px] font-extrabold uppercase">
                                            Admin
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500">{u.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <Badge
                                    variant={
                                      u.plan === 'Premium'
                                        ? 'amber'
                                        : u.plan === 'Pro'
                                        ? 'purple'
                                        : 'green'
                                    }
                                    size="sm"
                                  >
                                    {u.plan}
                                  </Badge>
                                </td>
                                <td className="py-3.5 px-3">
                                  <Badge
                                    variant={u.status === 'active' ? 'green' : 'coral'}
                                    size="sm"
                                  >
                                    {u.status.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="py-3.5 px-3 text-slate-600 font-medium">
                                  {u.resumes_count} Resumes • {u.applications_count} Apps
                                </td>
                                <td className="py-3.5 px-3 text-slate-700 font-semibold">
                                  {u.totalCalls} calls ({formatINR(Math.round(Number(u.totalCost) * 85))})
                                </td>
                                <td className="py-3.5 pl-3 text-right">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSelectedUserId(u.id)}
                                    className="text-xs font-bold"
                                  >
                                    Inspect & Actions
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>

                  {/* Slide-Over User Detail Drawer */}
                  {selectedUser && (
                    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-purple-100 p-6 overflow-y-auto space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
                          <div className="flex items-center gap-3">
                            <img
                              src={selectedUser.avatar_url}
                              alt={selectedUser.full_name}
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#6C3CE1]/30"
                            />
                            <div>
                              <h4 className="font-serif-heading font-bold text-lg text-slate-900">
                                {selectedUser.full_name}
                              </h4>
                              <p className="text-xs text-slate-500">{selectedUser.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedUserId(null)}
                            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-purple-50"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-3 rounded-2xl bg-[#FAF8FF] border border-purple-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Plan Tier
                            </span>
                            <div className="text-sm font-extrabold text-[#6C3CE1] mt-0.5">
                              {selectedUser.plan}
                            </div>
                          </div>
                          <div className="p-3 rounded-2xl bg-[#FAF8FF] border border-purple-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Resumes
                            </span>
                            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                              {selectedUser.resumes_count} Saved
                            </div>
                          </div>
                          <div className="p-3 rounded-2xl bg-[#FAF8FF] border border-purple-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Applications
                            </span>
                            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                              {selectedUser.applications_count} Tracked
                            </div>
                          </div>
                        </div>

                        {/* Usage Meters Breakdown */}
                        <div className="space-y-3">
                          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                            Monthly Quota Usage Meters
                          </h5>
                          {(Object.keys(FEATURE_LABELS) as UsageFeature[]).map((feat) => {
                            const m = selectedUser.meters?.[feat] || {
                              used: 0,
                              totalLimit: 5,
                              bonusCredits: 0,
                              percent: 0,
                            };
                            return (
                              <div
                                key={feat}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs"
                              >
                                <div className="flex justify-between font-semibold">
                                  <span>{FEATURE_LABELS[feat]}</span>
                                  <span>
                                    {m.used} / {m.totalLimit}{' '}
                                    {m.bonusCredits > 0 && (
                                      <strong className="text-[#6C3CE1]">
                                        (+{m.bonusCredits} bonus)
                                      </strong>
                                    )}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      m.percent >= 80 ? 'bg-amber-500' : 'bg-[#6C3CE1]'
                                    }`}
                                    style={{ width: `${Math.min(100, m.percent)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action 1: Change Plan */}
                        <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-purple-100 space-y-3">
                          <h5 className="font-bold text-xs text-slate-900">
                            Change Subscription Plan
                          </h5>
                          <div className="grid grid-cols-3 gap-2">
                            {(['Free', 'Pro', 'Premium'] as PlanName[]).map((p) => (
                              <button
                                key={p}
                                onClick={() =>
                                  handleUserAction(
                                    selectedUser.id,
                                    { action: 'change_plan', plan: p },
                                    `Changed ${selectedUser.full_name} to ${p} plan.`
                                  )
                                }
                                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                  selectedUser.plan === p
                                    ? 'bg-[#6C3CE1] text-white border-[#6C3CE1]'
                                    : 'bg-white text-slate-700 border-purple-200 hover:border-[#6C3CE1]'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action 2: Grant Bonus Credits */}
                        <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-purple-100 space-y-3">
                          <h5 className="font-bold text-xs text-slate-900">
                            Grant Bonus AI Quota Credits
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select
                              value={creditFeature}
                              onChange={(e) => setCreditFeature(e.target.value as UsageFeature)}
                              className="sm:col-span-2 p-2 text-xs bg-white border border-purple-200 rounded-xl"
                            >
                              {(Object.keys(FEATURE_LABELS) as UsageFeature[]).map((f) => (
                                <option key={f} value={f}>
                                  {FEATURE_LABELS[f]}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={creditAmount}
                              onChange={(e) => setCreditAmount(Number(e.target.value))}
                              className="p-2 text-xs bg-white border border-purple-200 rounded-xl font-bold"
                            />
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleUserAction(
                                selectedUser.id,
                                {
                                  action: 'grant_credits',
                                  creditFeature,
                                  creditAmount,
                                },
                                `Granted +${creditAmount} ${creditFeature} credits to ${selectedUser.full_name}.`
                              )
                            }
                            className="w-full text-xs font-bold"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Grant +{creditAmount} Credits
                          </Button>
                        </div>

                        {/* Action 3: Suspend / Reactivate & Delete */}
                        <div className="pt-2 border-t border-purple-100 flex items-center justify-between gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUserAction(
                                selectedUser.id,
                                { action: 'toggle_status' },
                                `${
                                  selectedUser.status === 'active' ? 'Suspended' : 'Reactivated'
                                } ${selectedUser.full_name}.`
                              )
                            }
                            className="flex-1 text-xs font-bold"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            {selectedUser.status === 'active'
                              ? 'Suspend Account'
                              : 'Reactivate Account'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(selectedUser)}
                            className="text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete User
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================================================================
                  SECTION 3: SUBSCRIPTIONS & BILLING
              ================================================================ */}
              {activeSection === 'billing' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-serif-heading font-bold text-xl text-slate-900">
                      Plans, Subscriptions, Invoices & Failed Payments
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure plan prices and monthly quota limits, inspect active subscriptions, and retry failed invoice payments.
                    </p>
                  </div>

                  {/* 3 Editable Plan Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(billingData.plans || []).map((p: any) => {
                      const isEditing = editingPlanId === p.id;
                      return (
                        <Card
                          key={p.id}
                          className="p-5 bg-white border border-purple-100 shadow-soft space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-serif-heading font-bold text-lg text-slate-900">
                                {p.name} Plan
                              </h4>
                              <span className="text-xs text-slate-500">
                                {formatINR(p.price_monthly)}/mo • {formatINR(p.price_yearly)}/yr
                              </span>
                            </div>
                            <Badge variant={p.is_active ? 'green' : 'coral'} size="sm">
                              {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                          </div>

                          {isEditing ? (
                            <div className="space-y-3 text-xs">
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                  Monthly Price (₹)
                                </label>
                                <input
                                  type="number"
                                  value={planPriceDraft}
                                  onChange={(e) => setPlanPriceDraft(Number(e.target.value))}
                                  className="w-full p-2 bg-slate-50 border border-purple-200 rounded-xl font-bold"
                                />
                              </div>
                              {(Object.keys(FEATURE_LABELS) as UsageFeature[]).map((f) => (
                                <div key={f} className="flex items-center justify-between gap-2">
                                  <span className="text-slate-600">{FEATURE_LABELS[f]}</span>
                                  <input
                                    type="number"
                                    value={planLimitsDraft[f] ?? 0}
                                    onChange={(e) =>
                                      setPlanLimitsDraft({
                                        ...planLimitsDraft,
                                        [f]: Number(e.target.value),
                                      })
                                    }
                                    className="w-20 p-1.5 bg-slate-50 border border-purple-200 rounded-lg font-bold text-right"
                                  />
                                </div>
                              ))}
                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleSavePlanEdit(p.id)}
                                  className="flex-1 text-xs font-bold"
                                >
                                  Save Limits
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingPlanId(null)}
                                  className="text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-1.5 text-xs bg-[#FAF8FF] p-3.5 rounded-2xl border border-purple-100">
                                {(Object.keys(FEATURE_LABELS) as UsageFeature[]).map((f) => (
                                  <div key={f} className="flex justify-between">
                                    <span className="text-slate-500">{FEATURE_LABELS[f]}</span>
                                    <span className="font-bold text-slate-900">
                                      {p.feature_limits?.[f]}/mo
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setEditingPlanId(p.id);
                                    setPlanPriceDraft(p.price_monthly);
                                    setPlanLimitsDraft({ ...p.feature_limits });
                                  }}
                                  className="flex-1 text-xs font-bold"
                                >
                                  Edit Quotas & Price
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTogglePlanActive(p)}
                                  className="text-xs"
                                >
                                  {p.is_active ? 'Disable' : 'Enable'}
                                </Button>
                              </div>
                            </>
                          )}
                        </Card>
                      );
                    })}
                  </div>

                  {/* Failed Payments Alert & Action Box */}
                  {(billingData.failedPayments || []).length > 0 && (
                    <Card className="p-5 bg-red-50/70 border border-red-200 space-y-3">
                      <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Failed Payments Requiring Action ({billingData.failedPayments.length})
                      </div>
                      <div className="space-y-2">
                        {billingData.failedPayments.map((fp: any) => (
                          <div
                            key={fp.id}
                            className="p-3.5 rounded-2xl bg-white border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900">
                                {fp.user_name} ({fp.user_email})
                              </span>{' '}
                              — {fp.plan_name} Plan ({formatINR(fp.amount)}) • Invoice #{fp.id}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleInvoiceAction(fp.id, 'retry')}
                                className="text-xs font-bold"
                              >
                                Retry Charge
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleInvoiceAction(fp.id, 'void')}
                                className="text-xs"
                              >
                                Void Invoice
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Subscriptions & Invoices Tables */}
                  <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
                    <h4 className="font-bold text-sm text-slate-900">
                      Active & Past-Due Subscriptions ({billingData.subscriptions?.length || 0})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-purple-100 text-slate-400 font-semibold">
                            <th className="py-2.5 pr-3">Subscriber</th>
                            <th className="py-2.5 px-3">Plan</th>
                            <th className="py-2.5 px-3">Interval</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Period End</th>
                            <th className="py-2.5 pl-3">Provider ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50">
                          {(billingData.subscriptions || []).map((s: any) => (
                            <tr key={s.id} className="hover:bg-[#FAF8FF]">
                              <td className="py-3 pr-3 font-bold text-slate-900">
                                {s.user_name} ({s.user_email})
                              </td>
                              <td className="py-3 px-3 font-semibold text-[#6C3CE1]">
                                {s.plan_name}
                              </td>
                              <td className="py-3 px-3 capitalize">{s.billing_interval}ly</td>
                              <td className="py-3 px-3">
                                <Badge
                                  variant={s.status === 'active' ? 'green' : 'coral'}
                                  size="sm"
                                >
                                  {s.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 text-slate-500">
                                {new Date(s.current_period_end).toLocaleDateString()}
                              </td>
                              <td className="py-3 pl-3 font-mono text-slate-500">
                                {s.provider_subscription_id}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* ================================================================
                  SECTION 4: USAGE & AI COST (>80% Limit Alerts, By Feature, Top Spenders)
              ================================================================ */}
              {activeSection === 'usage' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-serif-heading font-bold text-xl text-slate-900">
                      AI Usage Telemetry, Token Spend & Quota Alerts
                    </h3>
                    <p className="text-xs text-slate-500">
                      Real-time breakdown of AI calls by feature, by user, and by day, plus automated alerts when a user passes 80% of their monthly limit.
                    </p>
                  </div>

                  {/* >80% Quota Alert Box */}
                  {(usageData.highUsageAlerts || []).length > 0 && (
                    <Card className="p-5 bg-amber-50 border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          Users Passing 80% of Monthly Plan Limit ({usageData.highUsageAlerts.length})
                        </div>
                        <Badge variant="amber" size="sm">
                          Proactive Retention Alert
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {usageData.highUsageAlerts.map((al: any, i: number) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-2xl bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{al.user_name}</span> (
                              {al.user_email}) on <strong>{al.plan}</strong> plan has used{' '}
                              <strong className="text-amber-700">
                                {al.used}/{al.limit} ({al.percent}%)
                              </strong>{' '}
                              of <span className="capitalize">{al.feature.replace(/_/g, ' ')}</span>.
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                handleUserAction(
                                  al.user_id,
                                  {
                                    action: 'grant_credits',
                                    creditFeature: al.feature,
                                    creditAmount: 5,
                                  },
                                  `Granted +5 bonus ${al.feature} credits to ${al.user_name}.`
                                )
                              }
                              className="text-xs font-bold shrink-0"
                            >
                              Grant +5 Bonus Credits
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Usage by Feature & Top Spenders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
                      <h4 className="font-bold text-sm text-slate-900">
                        AI Usage & Cost by Feature
                      </h4>
                      <div className="space-y-3">
                        {(usageData.byFeature || []).map((f: any) => (
                          <div
                            key={f.feature}
                            className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-purple-100 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900 capitalize">
                                {f.feature.replace(/_/g, ' ')}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {f.calls} calls • {(f.tokensIn + f.tokensOut).toLocaleString()} tokens
                              </div>
                            </div>
                            <span className="font-mono font-bold text-[#6C3CE1]">
                              {formatINR(Math.round(Number(f.cost) * 85))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
                      <h4 className="font-bold text-sm text-slate-900">
                        Top Spenders by Token Cost
                      </h4>
                      <div className="space-y-3">
                        {(usageData.topSpenders || []).map((u: any, idx: number) => (
                          <div
                            key={u.user_id}
                            className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-purple-100 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#6C3CE1] text-white font-bold flex items-center justify-center text-[10px]">
                                #{idx + 1}
                              </span>
                              <div>
                                <div className="font-bold text-slate-900">{u.user_name}</div>
                                <div className="text-[11px] text-slate-500">
                                  {u.plan} • {u.calls} calls ({u.tokens.toLocaleString()} tokens)
                                </div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-emerald-700">
                              {formatINR(Math.round(Number(u.cost) * 85))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {activeSection === 'ats-test' && (
                <AdminAtsGoldenTestSection
                  getAuthHeaders={getAuthHeaders}
                  onToast={showToast}
                />
              )}

              {/* ================================================================
                  SECTIONS 5 - 11: Content, Jobs, Flags, Support, Announcements, Audit, Settings
              ================================================================ */}
              {(activeSection === 'content' ||
                activeSection === 'jobs' ||
                activeSection === 'flags' ||
                activeSection === 'support' ||
                activeSection === 'announcements' ||
                activeSection === 'audit' ||
                activeSection === 'settings') && (
                <AdminSubSections
                  activeSection={activeSection}
                  contentItems={contentItems}
                  jobsList={jobsList}
                  featureFlags={featureFlags}
                  supportTickets={supportTickets}
                  announcements={announcements}
                  auditLogs={auditLogs}
                  platformSettings={platformSettings}
                  onRefreshAll={fetchAllAdminData}
                  onConfirmAction={(cfg) => setConfirmModal(cfg)}
                  showToast={showToast}
                />
              )}
            </>
          )}
            </div>
          </div>
          </div>
        </main>
      </div>

      {/* Custom Destructive Action Confirmation Dialog */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">{confirmModal.title}</h4>
                <p className="text-xs text-red-600">Logged to immutable admin audit_logs</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  const fn = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await fn();
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                {confirmModal.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
