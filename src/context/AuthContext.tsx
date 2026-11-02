import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_URL,
  formatBackendError,
} from '../lib/supabase';
import { apiFetch as fetch } from '../lib/staticServerlessFallback';

export type AppRole = 'admin' | 'user';
export type PlanName = 'Free' | 'Pro' | 'Premium';
export type UsageFeature =
  | 'resume_tailoring'
  | 'ai_job_match'
  | 'mock_interview'
  | 'linkedin_generation'
  | 'portfolio_generation';

export interface UsageMeter {
  used: number;
  baseLimit: number;
  bonusCredits: number;
  totalLimit: number;
  percent: number;
  nearLimit: boolean;
  exceeded: boolean;
}

export interface SaaSPlan {
  id: string;
  name: PlanName;
  price_monthly: number;
  price_yearly: number;
  billing_interval: 'month' | 'year';
  feature_limits: Record<UsageFeature, number>;
  is_active: boolean;
  description: string;
  badge?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: AppRole;
  title?: string;
  target_role?: string;
  location?: string;
  experience_level?: string;
  career_track?: string;
  education_or_company?: string;
  work_preference?: string;
  career_goal?: string;
  skills?: string[];
  bio?: string;
  onboarding_completed?: boolean;
  plan?: PlanName;
}

export interface RegisterWithOnboardingPayload {
  full_name: string;
  email: string;
  password: string;
  title?: string;
  experience_level?: string;
  target_role?: string;
  career_track?: string;
  education_or_company?: string;
  location?: string;
  work_preference?: string;
  career_goal?: string;
  skills?: string[];
  bio?: string;
}

export interface UserWorkspace {
  resume: any | null;
  tailoredResumes: any[];
  applications: any[];
  roadmap: any | null;
  projects: any[];
  mockInterviews: any[];
  portfolio: any | null;
  linkedin: any | null;
  coursesProgress: Record<string, any>;
}

const EMPTY_WORKSPACE: UserWorkspace = {
  resume: null,
  tailoredResumes: [],
  applications: [],
  roadmap: null,
  projects: [],
  mockInterviews: [],
  portfolio: null,
  linkedin: null,
  coursesProgress: {},
};

const SESSION_STORAGE_KEY = 'careerwave_auth_session_v2';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  role: AppRole;
  plan: PlanName;
  plans: SaaSPlan[];
  meters: Record<UsageFeature, UsageMeter>;
  announcements: any[];
  invoices: any[];
  tickets: any[];
  maintenanceMode: boolean;
  maintenanceMessage: string;
  loading: boolean;
  workspace: UserWorkspace;
  upgradeModalOpen: boolean;
  upgradeTriggerFeature: string | null;
  openUpgradeModal: (featureLabel?: string) => void;
  closeUpgradeModal: () => void;
  openRouterKey: string;
  openRouterModel: string;
  isOpenRouterConfigured: boolean;
  saveOpenRouterConfig: (key: string, model: string) => void;
  clearOpenRouterConfig: () => void;
  testOpenRouterConnection: (
    testKey?: string,
    testModel?: string
  ) => Promise<{ success: boolean; message?: string; error?: string; model?: string }>;
  getAuthHeaders: (
    overrideUser?: { id: string; email: string } | null,
    overrideToken?: string | null
  ) => Record<string, string>;
  sendEmailOtp: (email: string) => Promise<{
    error: string | null;
    cooldownSeconds?: number;
    otpPreview?: string;
  }>;
  verifyEmailOtp: (
    email: string,
    code: string
  ) => Promise<{ error: string | null; role?: AppRole }>;
  registerWithPassword: (
    payload: RegisterWithOnboardingPayload
  ) => Promise<{ error: string | null; role?: AppRole }>;
  loginWithPassword: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; role?: AppRole }>;
  signOut: () => Promise<void>;
  refreshSaaSStatus: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  saveUserResume: (resume?: any, tailoredResume?: any) => Promise<void>;
  saveUserApplication: (application: any) => Promise<void>;
  updateUserApplication: (id: string, updates: any) => Promise<void>;
  deleteUserApplication: (id: string) => Promise<void>;
  saveUserRoadmap: (roadmap: any) => Promise<void>;
  saveUserProjects: (projects: any[]) => Promise<void>;
  saveUserPortfolio: (portfolio: any) => Promise<void>;
  saveUserLinkedIn: (linkedin: any) => Promise<void>;
  saveUserCourseProgress: (courseId: string, progress: number) => Promise<void>;
  checkoutPlan: (planName: PlanName, interval: 'month' | 'year') => Promise<boolean>;
}

const defaultMeters: Record<UsageFeature, UsageMeter> = {
  resume_tailoring: {
    used: 0,
    baseLimit: 2,
    bonusCredits: 0,
    totalLimit: 2,
    percent: 0,
    nearLimit: false,
    exceeded: false,
  },
  ai_job_match: {
    used: 0,
    baseLimit: 5,
    bonusCredits: 0,
    totalLimit: 5,
    percent: 0,
    nearLimit: false,
    exceeded: false,
  },
  mock_interview: {
    used: 0,
    baseLimit: 2,
    bonusCredits: 0,
    totalLimit: 2,
    percent: 0,
    nearLimit: false,
    exceeded: false,
  },
  linkedin_generation: {
    used: 0,
    baseLimit: 1,
    bonusCredits: 0,
    totalLimit: 1,
    percent: 0,
    nearLimit: false,
    exceeded: false,
  },
  portfolio_generation: {
    used: 0,
    baseLimit: 1,
    bonusCredits: 0,
    totalLimit: 1,
    percent: 0,
    nearLimit: false,
    exceeded: false,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==============================================================================
// Global Jobs Preloading & Instant In-Memory Cache
// ==============================================================================
export let globalJobsCache: any[] = [];
export function getGlobalJobsCache(): any[] {
  if (globalJobsCache.length > 0) return globalJobsCache;
  try {
    const raw = sessionStorage.getItem('careerwave_jobs_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalJobsCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Non-fatal
  }
  return [];
}

export function preloadJobs() {
  fetch('/api/jobs')
    .then((r) => r.json())
    .then((d) => {
      if (d.success && Array.isArray(d.jobs)) {
        globalJobsCache = d.jobs;
        try {
          sessionStorage.setItem('careerwave_jobs_cache', JSON.stringify(d.jobs));
        } catch {
          // ignore quota
        }
      }
    })
    .catch(() => {});
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole>('user');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanName>('Free');
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [meters, setMeters] = useState<Record<UsageFeature, UsageMeter>>(defaultMeters);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<UserWorkspace>(EMPTY_WORKSPACE);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeTriggerFeature, setUpgradeTriggerFeature] = useState<string | null>(null);

  // OpenRouter Model & API Key Configuration State
  const [openRouterKey, setOpenRouterKeyState] = useState<string>(() => {
    return localStorage.getItem('careerwave_openrouter_key') || '';
  });
  const [openRouterModel, setOpenRouterModelState] = useState<string>(() => {
    return (
      localStorage.getItem('careerwave_openrouter_model') ||
      'google/gemini-2.5-flash'
    );
  });

  const isOpenRouterConfigured = Boolean(openRouterKey.trim().length > 6);

  const saveOpenRouterConfig = (key: string, model: string) => {
    const cleanKey = key.trim();
    const cleanModel = model.trim() || 'google/gemini-2.5-flash';
    setOpenRouterKeyState(cleanKey);
    setOpenRouterModelState(cleanModel);
    localStorage.setItem('careerwave_openrouter_key', cleanKey);
    localStorage.setItem('careerwave_openrouter_model', cleanModel);
  };

  const clearOpenRouterConfig = () => {
    setOpenRouterKeyState('');
    setOpenRouterModelState('google/gemini-2.5-flash');
    localStorage.removeItem('careerwave_openrouter_key');
    localStorage.removeItem('careerwave_openrouter_model');
  };

  const testOpenRouterConnection = async (testKey?: string, testModel?: string) => {
    const key = (testKey ?? openRouterKey).trim();
    const model = (testModel ?? openRouterModel).trim() || 'google/gemini-2.5-flash';
    try {
      const res = await fetch('/api/ai/test-openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, model }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error testing OpenRouter.' };
    }
  };

  // Immediate background job prefetching on website open
  useEffect(() => {
    preloadJobs();
  }, []);

  const getAuthHeaders = useCallback(
    (overrideUser?: { id: string; email: string } | null, overrideToken?: string | null) => {
      const activeUser = overrideUser !== undefined ? overrideUser : user;
      const activeToken = overrideToken !== undefined ? overrideToken : sessionToken;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeUser?.id) headers['x-user-id'] = activeUser.id;
      if (activeUser?.email) headers['x-user-email'] = activeUser.email;
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;
      if (openRouterKey) headers['x-openrouter-key'] = openRouterKey;
      if (openRouterModel) headers['x-openrouter-model'] = openRouterModel;
      return headers;
    },
    [user, sessionToken, openRouterKey, openRouterModel]
  );

  const refreshSaaSStatus = useCallback(
    async (overrideUser?: { id: string; email: string } | null, overrideToken?: string | null) => {
      const targetUser = overrideUser !== undefined ? overrideUser : user;
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: supaPlans } = await supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('price_monthly', { ascending: true });
          if (Array.isArray(supaPlans) && supaPlans.length > 0) {
            setPlans(supaPlans as SaaSPlan[]);
          }

          if (targetUser?.id) {
            const [profileRes, onboardingRes, subRes, usageRes, invRes, annRes] = await Promise.all([
              supabase.from('profiles').select('*').eq('id', targetUser.id).maybeSingle(),
              supabase
                .from('user_onboarding')
                .select('*')
                .eq('user_id', targetUser.id)
                .maybeSingle(),
              supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', targetUser.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
              supabase.from('usage_events').select('*').eq('user_id', targetUser.id),
              supabase
                .from('invoices')
                .select('*')
                .eq('user_id', targetUser.id)
                .order('created_at', { ascending: false }),
              supabase.from('announcements').select('*').eq('is_active', true),
            ]);

            if (profileRes.data) {
              const p = profileRes.data;
              const ob = onboardingRes.data;
              const activePlanName: PlanName =
                (subRes.data?.plan_name as PlanName) || (p.plan as PlanName) || 'Free';
              setPlan(activePlanName);
              setRole((p.role as AppRole) || 'user');
              setProfile((prev) => ({
                id: p.id,
                email: p.email || targetUser.email,
                full_name: p.full_name || prev?.full_name || 'Member',
                avatar_url: p.avatar_url || prev?.avatar_url || '',
                role: (p.role as AppRole) || prev?.role || 'user',
                title: ob?.current_role || p.title || prev?.title || '',
                target_role: ob?.target_role || p.target_role || prev?.target_role || '',
                location: ob?.location || p.location || prev?.location || 'India',
                experience_level:
                  ob?.experience_level || p.experience_level || prev?.experience_level || '',
                career_track: ob?.career_track || p.career_track || prev?.career_track || '',
                education_or_company:
                  ob?.university || p.education_or_company || prev?.education_or_company || '',
                work_preference:
                  ob?.work_mode || p.work_preference || prev?.work_preference || '',
                career_goal: ob?.career_goal || p.career_goal || prev?.career_goal || '',
                skills: Array.isArray(ob?.key_skills)
                  ? ob.key_skills
                  : Array.isArray(p.skills)
                  ? p.skills
                  : prev?.skills || [],
                bio: p.bio ?? prev?.bio ?? '',
                onboarding_completed: Boolean(
                  ob?.completed ?? p.onboarding_completed ?? prev?.onboarding_completed
                ),
                plan: activePlanName,
              }));

              const matchedPlan =
                (supaPlans || []).find((pl: any) => pl.name === activePlanName) || null;
              const limits = matchedPlan?.feature_limits || {
                resume_tailoring: 2,
                ai_job_match: 5,
                mock_interview: 2,
                linkedin_generation: 1,
                portfolio_generation: 1,
              };
              const usageRows = Array.isArray(usageRes.data) ? usageRes.data : [];
              const nextMeters = { ...defaultMeters };
              for (const feat of Object.keys(defaultMeters) as UsageFeature[]) {
                const usedCount = usageRows.filter((u: any) => u.feature === feat).length;
                const baseLim = Number(limits[feat] ?? defaultMeters[feat].baseLimit);
                const bonus = Number(p.bonus_credits?.[feat] || 0);
                const totalLim = baseLim + bonus;
                const pct = totalLim > 0 ? Math.min(100, Math.round((usedCount / totalLim) * 100)) : 0;
                nextMeters[feat] = {
                  used: usedCount,
                  baseLimit: baseLim,
                  bonusCredits: bonus,
                  totalLimit: totalLim,
                  percent: pct,
                  nearLimit: pct >= 80 && usedCount < totalLim,
                  exceeded: usedCount >= totalLim,
                };
              }
              setMeters(nextMeters);
            }
            if (Array.isArray(invRes.data)) setInvoices(invRes.data);
            if (Array.isArray(annRes.data)) setAnnouncements(annRes.data);
            return;
          }
        }

        const res = await fetch('/api/saas/status', {
          headers: getAuthHeaders(targetUser, overrideToken),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          if (data.plans) setPlans(data.plans);
          if (targetUser && data.user) {
            setPlan(data.user.plan || 'Free');
            setRole(data.user.role || 'user');
            setMeters(data.meters || defaultMeters);
            setAnnouncements(data.announcements || []);
            setInvoices(data.invoices || []);
            setTickets(data.tickets || []);
            setMaintenanceMode(Boolean(data.maintenanceMode));
            setMaintenanceMessage(data.maintenanceMessage || '');
            setProfile((prev) => {
              const merged: UserProfile = {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.full_name || prev?.full_name || 'Member',
                avatar_url: data.user.avatar_url || prev?.avatar_url || '',
                role: data.user.role || prev?.role || 'user',
                title: data.user.title ?? prev?.title ?? '',
                target_role: data.user.target_role ?? prev?.target_role ?? '',
                location: data.user.location ?? prev?.location ?? 'India',
                experience_level: data.user.experience_level ?? prev?.experience_level ?? '',
                career_track: data.user.career_track ?? prev?.career_track ?? '',
                education_or_company:
                  data.user.education_or_company ?? prev?.education_or_company ?? '',
                work_preference: data.user.work_preference ?? prev?.work_preference ?? '',
                career_goal: data.user.career_goal ?? prev?.career_goal ?? '',
                skills: Array.isArray(data.user.skills)
                  ? data.user.skills
                  : prev?.skills ?? [],
                bio: data.user.bio ?? prev?.bio ?? '',
                onboarding_completed:
                  data.user.onboarding_completed ?? prev?.onboarding_completed ?? false,
                plan: data.user.plan || prev?.plan || 'Free',
              };
              return merged;
            });
          }
        }
      } catch {
        // Non-fatal
      }
    },
    [user, getAuthHeaders]
  );

  const refreshWorkspace = useCallback(
    async (overrideUser?: { id: string; email: string } | null, overrideToken?: string | null) => {
      const targetUser = overrideUser !== undefined ? overrideUser : user;
      if (!targetUser) {
        setWorkspace(EMPTY_WORKSPACE);
        return;
      }
      try {
        const res = await fetch('/api/user/workspace', {
          headers: getAuthHeaders(targetUser, overrideToken),
        });
        if (res.status === 401) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setUser(null);
          setProfile(null);
          setRole('user');
          setSessionToken(null);
          setWorkspace(EMPTY_WORKSPACE);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.workspace) {
          setWorkspace({
            ...EMPTY_WORKSPACE,
            ...data.workspace,
          });
        }
      } catch {
        // Non-fatal
      }
    },
    [user, getAuthHeaders]
  );

  // Restore saved session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedRaw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          if (parsed?.user?.id && parsed?.user?.email) {
            setUser(parsed.user);
            setProfile(parsed.profile);
            setRole(parsed.profile?.role || 'user');
            setSessionToken(parsed.sessionToken || null);
            await Promise.all([
              refreshSaaSStatus(parsed.user, parsed.sessionToken),
              refreshWorkspace(parsed.user, parsed.sessionToken),
            ]);
          }
        } else {
          // Fetch public plans for pricing section even when logged out
          await refreshSaaSStatus(null, null);
        }
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    const handleQuotaExceeded = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setUpgradeTriggerFeature(detail?.feature || 'plan_limit');
      setUpgradeModalOpen(true);
      refreshSaaSStatus();
    };
    const handleUsageUpdated = () => {
      refreshSaaSStatus();
    };
    window.addEventListener('careerwave:quota-exceeded', handleQuotaExceeded);
    window.addEventListener('careerwave:usage-updated', handleUsageUpdated);
    return () => {
      window.removeEventListener('careerwave:quota-exceeded', handleQuotaExceeded);
      window.removeEventListener('careerwave:usage-updated', handleUsageUpdated);
    };
  }, [refreshSaaSStatus]);

  const openUpgradeModal = (featureLabel?: string) => {
    setUpgradeTriggerFeature(featureLabel || null);
    setUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setUpgradeModalOpen(false);
    setUpgradeTriggerFeature(null);
  };

  const sendEmailOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: { shouldCreateUser: true },
          });
        } catch {
          // Continue with CareerWave OTP verification service
        }
      }

      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          error: data.error || 'Unable to send verification code. Please try again.',
          cooldownSeconds: data.retryAfterSeconds,
        };
      }
      return {
        error: null,
        cooldownSeconds: data.cooldownSeconds || 60,
        otpPreview: data.otpPreview,
      };
    } catch {
      return { error: 'Network error while sending verification code. Please try again.' };
    }
  };

  const verifyEmailOtp = async (email: string, code: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanCode,
            type: 'email',
          });
        } catch {
          // Continue with server OTP verification
        }
      }

      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          error: data.error || 'Invalid or expired verification code.',
        };
      }

      const nextUser = { id: data.user.id, email: data.user.email };
      const nextProfile: UserProfile = {
        id: data.profile.id,
        email: data.profile.email,
        full_name: data.profile.full_name,
        avatar_url: data.profile.avatar_url,
        role: data.profile.role,
        title: data.profile.title || '',
        target_role: data.profile.target_role || '',
        location: data.profile.location || 'India',
        experience_level: data.profile.experience_level || '',
        career_track: data.profile.career_track || '',
        education_or_company: data.profile.education_or_company || '',
        work_preference: data.profile.work_preference || '',
        career_goal: data.profile.career_goal || '',
        skills: Array.isArray(data.profile.skills) ? data.profile.skills : [],
        bio: data.profile.bio || '',
        onboarding_completed: Boolean(data.profile.onboarding_completed),
        plan: data.profile.plan || 'Free',
      };

      setUser(nextUser);
      setProfile(nextProfile);
      setRole(nextProfile.role);
      setPlan(nextProfile.plan || 'Free');
      setSessionToken(data.sessionToken || null);

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          user: nextUser,
          profile: nextProfile,
          sessionToken: data.sessionToken,
        })
      );

      await Promise.all([
        refreshSaaSStatus(nextUser, data.sessionToken),
        refreshWorkspace(nextUser, data.sessionToken),
      ]);

      return { error: null, role: nextProfile.role };
    } catch {
      return { error: 'Verification failed due to a network error. Please try again.' };
    }
  };

  const registerWithPassword = async (payload: RegisterWithOnboardingPayload) => {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.full_name.trim() || 'CareerWave Member';
    const isAdminEmail =
      cleanEmail === 'admin@careerwave.in' ||
      cleanEmail === 'admin@careerwave.io' ||
      cleanEmail === 'superadmin@careerwave.in' ||
      cleanEmail === 'poornachandu834@gmail.com';

    try {
      if (isSupabaseConfigured && supabase) {
        const signUpUrl = `${SUPABASE_URL}/auth/v1/signup`;
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: payload.password,
          options: {
            data: {
              full_name: cleanName,
              title: payload.title || '',
              target_role: payload.target_role || '',
              experience_level: payload.experience_level || '',
              career_track: payload.career_track || '',
              education_or_company: payload.education_or_company || '',
              location: payload.location || 'India',
              work_preference: payload.work_preference || 'Hybrid',
              career_goal: payload.career_goal || '',
              skills: payload.skills || [],
              onboarding_completed: true,
            },
          },
        });

        if (signUpError) {
          const formatted = formatBackendError(signUpError, signUpUrl);
          return { error: formatted.userMessage };
        }

        let activeSession = signUpData.session;
        let activeSupaUser = signUpData.user;

        // Sign in immediately with no OTP or email verification wait if session wasn't returned directly
        if (!activeSession && activeSupaUser) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: payload.password,
          });
          if (!signInErr && signInData.session) {
            activeSession = signInData.session;
            activeSupaUser = signInData.user;
          }
        }

        if (activeSupaUser) {
          const userId = activeSupaUser.id;
          const userRole: AppRole = isAdminEmail ? 'admin' : 'user';
          const userPlan: PlanName = isAdminEmail ? 'Premium' : 'Free';
          const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            cleanName
          )}`;

          // Save career onboarding answers to profiles and user_onboarding with RLS
          await Promise.allSettled([
            supabase.from('profiles').upsert({
              id: userId,
              email: cleanEmail,
              full_name: cleanName,
              avatar_url: avatarUrl,
              role: userRole,
              plan: userPlan,
              title: payload.title || '',
              target_role: payload.target_role || '',
              experience_level: payload.experience_level || '',
              career_track: payload.career_track || '',
              education_or_company: payload.education_or_company || '',
              location: payload.location || 'India',
              work_preference: payload.work_preference || 'Hybrid',
              career_goal: payload.career_goal || '',
              skills: payload.skills || [],
              bio: payload.bio || '',
              onboarding_completed: true,
              updated_at: new Date().toISOString(),
            }),
            supabase.from('user_onboarding').upsert(
              {
                user_id: userId,
                current_role: payload.title || '',
                target_role: payload.target_role || '',
                experience_level: payload.experience_level || '',
                career_track: payload.career_track || '',
                university: payload.education_or_company || '',
                location: payload.location || 'India',
                work_mode: payload.work_preference || 'Hybrid',
                career_goal: payload.career_goal || '',
                key_skills: payload.skills || [],
                completed: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            ),
          ]);

          const nextUser = { id: userId, email: cleanEmail };
          const nextProfile: UserProfile = {
            id: userId,
            email: cleanEmail,
            full_name: cleanName,
            avatar_url: avatarUrl,
            role: userRole,
            title: payload.title || '',
            target_role: payload.target_role || '',
            location: payload.location || 'India',
            experience_level: payload.experience_level || '',
            career_track: payload.career_track || '',
            education_or_company: payload.education_or_company || '',
            work_preference: payload.work_preference || 'Hybrid',
            career_goal: payload.career_goal || '',
            skills: payload.skills || [],
            bio: payload.bio || '',
            onboarding_completed: true,
            plan: userPlan,
          };

          const token = activeSession?.access_token || `supa_${userId}`;
          setUser(nextUser);
          setProfile(nextProfile);
          setRole(userRole);
          setPlan(userPlan);
          setSessionToken(token);

          localStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({
              user: nextUser,
              profile: nextProfile,
              sessionToken: token,
            })
          );

          await Promise.all([
            refreshSaaSStatus(nextUser, token),
            refreshWorkspace(nextUser, token),
          ]);

          return { error: null, role: userRole };
        }
      }

      // Local state fallback when running in offline/sandbox preview
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const formatted = formatBackendError(
          { status: res.status, message: data.error || 'Registration failed' },
          '/api/auth/register'
        );
        return {
          error: formatted.userMessage,
        };
      }

      const nextUser = { id: data.user.id, email: data.user.email };
      const nextProfile: UserProfile = {
        id: data.profile.id,
        email: data.profile.email,
        full_name: data.profile.full_name,
        avatar_url: data.profile.avatar_url,
        role: data.profile.role,
        title: data.profile.title || '',
        target_role: data.profile.target_role || '',
        location: data.profile.location || 'India',
        experience_level: data.profile.experience_level || '',
        career_track: data.profile.career_track || '',
        education_or_company: data.profile.education_or_company || '',
        work_preference: data.profile.work_preference || '',
        career_goal: data.profile.career_goal || '',
        skills: Array.isArray(data.profile.skills) ? data.profile.skills : [],
        bio: data.profile.bio || '',
        onboarding_completed: Boolean(data.profile.onboarding_completed),
        plan: data.profile.plan || 'Free',
      };

      setUser(nextUser);
      setProfile(nextProfile);
      setRole(nextProfile.role);
      setPlan(nextProfile.plan || 'Free');
      setSessionToken(data.sessionToken || null);

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          user: nextUser,
          profile: nextProfile,
          sessionToken: data.sessionToken,
        })
      );

      await Promise.all([
        refreshSaaSStatus(nextUser, data.sessionToken),
        refreshWorkspace(nextUser, data.sessionToken),
      ]);

      return { error: null, role: nextProfile.role };
    } catch (err: any) {
      const formatted = formatBackendError(err, `${SUPABASE_URL || 'local'}/auth/v1/signup`);
      return { error: formatted.userMessage };
    }
  };

  const loginWithPassword = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (isSupabaseConfigured && supabase) {
        const loginUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) {
          const formatted = formatBackendError(signInError, loginUrl);
          return { error: formatted.userMessage };
        }

        if (signInData.user) {
          const userId = signInData.user.id;
          const meta = signInData.user.user_metadata || {};
          const [profRes, obRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
            supabase.from('user_onboarding').select('*').eq('user_id', userId).maybeSingle(),
          ]);

          const p = profRes.data || {};
          const ob = obRes.data || {};
          const isAdminEmail =
            cleanEmail === 'admin@careerwave.in' ||
            cleanEmail === 'admin@careerwave.io' ||
            cleanEmail === 'superadmin@careerwave.in' ||
            cleanEmail === 'poornachandu834@gmail.com';
          const userRole: AppRole = isAdminEmail ? 'admin' : (p.role as AppRole) || 'user';
          const userPlan: PlanName = (p.plan as PlanName) || (isAdminEmail ? 'Premium' : 'Free');

          const nextUser = { id: userId, email: cleanEmail };
          const nextProfile: UserProfile = {
            id: userId,
            email: cleanEmail,
            full_name: p.full_name || meta.full_name || cleanEmail.split('@')[0],
            avatar_url:
              p.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                p.full_name || meta.full_name || cleanEmail
              )}`,
            role: userRole,
            title: ob.current_role || p.title || meta.title || '',
            target_role: ob.target_role || p.target_role || meta.target_role || '',
            location: ob.location || p.location || meta.location || 'India',
            experience_level:
              ob.experience_level || p.experience_level || meta.experience_level || '',
            career_track: ob.career_track || p.career_track || meta.career_track || '',
            education_or_company:
              ob.university || p.education_or_company || meta.education_or_company || '',
            work_preference: ob.work_mode || p.work_preference || meta.work_preference || 'Hybrid',
            career_goal: ob.career_goal || p.career_goal || meta.career_goal || '',
            skills: Array.isArray(ob.key_skills)
              ? ob.key_skills
              : Array.isArray(p.skills)
              ? p.skills
              : Array.isArray(meta.skills)
              ? meta.skills
              : [],
            bio: p.bio || '',
            onboarding_completed: Boolean(
              ob.completed ?? p.onboarding_completed ?? meta.onboarding_completed ?? true
            ),
            plan: userPlan,
          };

          const token = signInData.session?.access_token || `supa_${userId}`;
          setUser(nextUser);
          setProfile(nextProfile);
          setRole(userRole);
          setPlan(userPlan);
          setSessionToken(token);

          localStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({
              user: nextUser,
              profile: nextProfile,
              sessionToken: token,
            })
          );

          await Promise.all([
            refreshSaaSStatus(nextUser, token),
            refreshWorkspace(nextUser, token),
          ]);

          return { error: null, role: userRole };
        }
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const formatted = formatBackendError(
          { status: res.status, code: data.code, message: data.error || 'Invalid email or password' },
          '/api/auth/login'
        );
        return {
          error: formatted.userMessage,
        };
      }

      const nextUser = { id: data.user.id, email: data.user.email };
      const nextProfile: UserProfile = {
        id: data.profile.id,
        email: data.profile.email,
        full_name: data.profile.full_name,
        avatar_url: data.profile.avatar_url,
        role: data.profile.role,
        title: data.profile.title || '',
        target_role: data.profile.target_role || '',
        location: data.profile.location || 'India',
        experience_level: data.profile.experience_level || '',
        career_track: data.profile.career_track || '',
        education_or_company: data.profile.education_or_company || '',
        work_preference: data.profile.work_preference || '',
        career_goal: data.profile.career_goal || '',
        skills: Array.isArray(data.profile.skills) ? data.profile.skills : [],
        bio: data.profile.bio || '',
        onboarding_completed: Boolean(data.profile.onboarding_completed),
        plan: data.profile.plan || 'Free',
      };

      setUser(nextUser);
      setProfile(nextProfile);
      setRole(nextProfile.role);
      setPlan(nextProfile.plan || 'Free');
      setSessionToken(data.sessionToken || null);

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          user: nextUser,
          profile: nextProfile,
          sessionToken: data.sessionToken,
        })
      );

      await Promise.all([
        refreshSaaSStatus(nextUser, data.sessionToken),
        refreshWorkspace(nextUser, data.sessionToken),
      ]);

      return { error: null, role: nextProfile.role };
    } catch (err: any) {
      const formatted = formatBackendError(
        err,
        `${SUPABASE_URL || 'local'}/auth/v1/token?grant_type=password`
      );
      return { error: formatted.userMessage };
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore client signout error
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // Ignore server logout error
    }

    // Clear all client state, local storage, and cached workspace data
    localStorage.removeItem(SESSION_STORAGE_KEY);
    try {
      sessionStorage.removeItem('careerwave_jobs_cache');
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
    setRole('user');
    setPlan('Free');
    setSessionToken(null);
    setMeters(defaultMeters);
    setInvoices([]);
    setTickets([]);
    setWorkspace(EMPTY_WORKSPACE);

    window.dispatchEvent(new CustomEvent('careerwave:signed-out'));
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const baseProfile: UserProfile = profile || {
      id: user?.id || 'local-user',
      email: user?.email || '',
      full_name: updates.full_name || 'Member',
      avatar_url: '',
      role: role || 'user',
      title: '',
      target_role: '',
      location: 'India',
      experience_level: 'Early Career (1-3 yrs)',
      career_track: 'Generative AI',
      education_or_company: '',
      work_preference: 'Hybrid',
      career_goal: 'Land a high-paying full-time role',
      skills: [],
      bio: '',
      onboarding_completed: true,
      plan: plan || 'Free',
    };

    const optimisticProfile: UserProfile = {
      ...baseProfile,
      ...updates,
    };

    setProfile(optimisticProfile);
    if (user) {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          user,
          profile: optimisticProfile,
          sessionToken,
        })
      );
    }

    if (!user) return;

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.allSettled([
          supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: optimisticProfile.full_name,
            avatar_url: optimisticProfile.avatar_url,
            title: optimisticProfile.title || '',
            target_role: optimisticProfile.target_role || '',
            location: optimisticProfile.location || 'India',
            experience_level: optimisticProfile.experience_level || '',
            career_track: optimisticProfile.career_track || '',
            education_or_company: optimisticProfile.education_or_company || '',
            work_preference: optimisticProfile.work_preference || 'Hybrid',
            career_goal: optimisticProfile.career_goal || '',
            skills: optimisticProfile.skills || [],
            bio: optimisticProfile.bio || '',
            onboarding_completed: Boolean(optimisticProfile.onboarding_completed),
            updated_at: new Date().toISOString(),
          }),
          supabase.from('user_onboarding').upsert(
            {
              user_id: user.id,
              current_role: optimisticProfile.title || '',
              target_role: optimisticProfile.target_role || '',
              experience_level: optimisticProfile.experience_level || '',
              career_track: optimisticProfile.career_track || '',
              university: optimisticProfile.education_or_company || '',
              location: optimisticProfile.location || 'India',
              work_mode: optimisticProfile.work_preference || 'Hybrid',
              career_goal: optimisticProfile.career_goal || '',
              key_skills: optimisticProfile.skills || [],
              completed: Boolean(optimisticProfile.onboarding_completed),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          ),
        ]);
      } catch {
        // non-fatal
      }
    }

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        const mergedServerProfile: UserProfile = {
          ...optimisticProfile,
          ...(data.profile || {}),
          ...updates,
        };
        setProfile(mergedServerProfile);
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            user,
            profile: mergedServerProfile,
            sessionToken,
          })
        );
      }
    } catch {
      // Non-fatal: optimistic state already saved
    }
  };

  const saveUserResume = async (resume?: any, tailoredResume?: any) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/resume', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ resume, tailoredResume }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace((prev) => ({
          ...prev,
          resume: data.resume ?? prev.resume,
          tailoredResumes: data.tailoredResumes ?? prev.tailoredResumes,
        }));
      }
    } catch {
      // Non-fatal
    }
  };

  const saveUserApplication = async (application: any) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/applications', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ application }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace((prev) => ({
          ...prev,
          applications: data.applications || [],
        }));
      }
    } catch {
      // Non-fatal
    }
  };

  const updateUserApplication = async (id: string, updates: any) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user/applications/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace((prev) => ({
          ...prev,
          applications: data.applications || [],
        }));
      }
    } catch {
      // Non-fatal
    }
  };

  const deleteUserApplication = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user/applications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace((prev) => ({
          ...prev,
          applications: data.applications || [],
        }));
      }
    } catch {
      // Non-fatal
    }
  };

  const saveUserRoadmap = async (roadmap: any) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/roadmap', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ roadmap }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace((prev) => ({ ...prev, roadmap: data.roadmap }));
      }
    } catch {
      // Non-fatal
    }
  };

  const saveUserProjects = async (projects: any[]) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/projects', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ projects }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace((prev) => ({ ...prev, projects: data.projects || [] }));
      }
    } catch {
      // Non-fatal
    }
  };

  const saveUserPortfolio = async (portfolio: any) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/portfolio', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ portfolio }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace((prev) => ({ ...prev, portfolio: data.portfolio }));
      }
    } catch {
      // Non-fatal
    }
  };

  const saveUserLinkedIn = async (linkedin: any) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/linkedin', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ linkedin }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace((prev) => ({ ...prev, linkedin: data.linkedin }));
      }
    } catch {
      // Non-fatal
    }
  };

  const saveUserCourseProgress = async (courseId: string, progress: number) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/courses-progress', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ courseId, progress }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace((prev) => ({
          ...prev,
          coursesProgress: data.coursesProgress || {
            ...prev.coursesProgress,
            [courseId]: progress,
          },
        }));
      }
    } catch {
      // Non-fatal
    }
  };

  const checkoutPlan = async (planName: PlanName, billingInterval: 'month' | 'year') => {
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ planName, billingInterval }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshSaaSStatus();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        plan,
        plans,
        meters,
        announcements,
        invoices,
        tickets,
        maintenanceMode,
        maintenanceMessage,
        loading,
        workspace,
        upgradeModalOpen,
        upgradeTriggerFeature,
        openUpgradeModal,
        closeUpgradeModal,
        openRouterKey,
        openRouterModel,
        isOpenRouterConfigured,
        saveOpenRouterConfig,
        clearOpenRouterConfig,
        testOpenRouterConnection,
        getAuthHeaders,
        sendEmailOtp,
        verifyEmailOtp,
        registerWithPassword,
        loginWithPassword,
        signOut,
        refreshSaaSStatus,
        refreshWorkspace,
        updateUserProfile,
        saveUserResume,
        saveUserApplication,
        updateUserApplication,
        deleteUserApplication,
        saveUserRoadmap,
        saveUserProjects,
        saveUserPortfolio,
        saveUserLinkedIn,
        saveUserCourseProgress,
        checkoutPlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
