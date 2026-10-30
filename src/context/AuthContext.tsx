import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          error: data.error || 'Unable to create your account. Please try again.',
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
      return { error: 'Account creation failed due to a network error. Please try again.' };
    }
  };

  const loginWithPassword = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          error: data.error || 'Invalid email or password.',
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
      return { error: 'Sign in failed due to a network error. Please try again.' };
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
