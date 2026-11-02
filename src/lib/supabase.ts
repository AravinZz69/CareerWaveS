import { createClient } from '@supabase/supabase-js';

// Single canonical Supabase configuration reader
const getSupabaseConfig = () => {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = (typeof process !== 'undefined' && process.env) || {};
  const envUrl = String(metaEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || '').trim();
  const envPublishableKey = String(
    metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
      metaEnv.VITE_SUPABASE_ANON_KEY ||
      procEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
      procEnv.VITE_SUPABASE_ANON_KEY ||
      ''
  ).trim();

  const localUrl =
    typeof window !== 'undefined' ? (localStorage.getItem('VITE_SUPABASE_URL') || '').trim() : '';
  const localKey =
    typeof window !== 'undefined'
      ? (
          localStorage.getItem('VITE_SUPABASE_PUBLISHABLE_KEY') ||
          localStorage.getItem('VITE_SUPABASE_ANON_KEY') ||
          ''
        ).trim()
      : '';

  return {
    url: envUrl || localUrl,
    publishableKey: envPublishableKey || localKey,
  };
};

const { url, publishableKey } = getSupabaseConfig();

export const SUPABASE_URL = url;
export const SUPABASE_PUBLISHABLE_KEY = publishableKey;
export const SUPABASE_ANON_KEY = publishableKey;

export const missingSupabaseEnvVars: string[] = [];
if (!url || !url.startsWith('http') || url.includes('your-project-id')) {
  missingSupabaseEnvVars.push('VITE_SUPABASE_URL');
}
if (!publishableKey || publishableKey === 'placeholder-anon-key' || publishableKey.length < 15) {
  missingSupabaseEnvVars.push('VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const isSupabaseConfigured = missingSupabaseEnvVars.length === 0;

// Single shared Supabase client instance
export const supabase = createClient(
  isSupabaseConfigured ? url : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? publishableKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Classifies and logs any Supabase Auth, PostgREST, or Edge Function error with the exact
 * failing URL and specific reason (offline, timeout, invalid credentials, email already registered,
 * weak password, rate limit, endpoint not found, project unavailable).
 */
export function formatBackendError(err: any, failingUrl: string): string {
  const status = Number(err?.status || err?.statusCode || 0);
  const code = String(err?.code || '').toLowerCase();
  const rawMessage = String(
    err?.message || err?.error_description || err?.error || err || ''
  ).trim();

  console.error('[CareerWave Backend Error]', {
    failingUrl,
    status: status || undefined,
    code: code || undefined,
    message: rawMessage,
    rawError: err,
  });

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return `You are offline. Unable to reach ${failingUrl}. Please check your internet connection.`;
  }

  if (
    err?.name === 'AbortError' ||
    code.includes('timeout') ||
    /timeout|timed out|deadline exceeded/i.test(rawMessage)
  ) {
    return `Request timed out while contacting ${failingUrl}. Please try again.`;
  }

  if (
    code === 'invalid_credentials' ||
    /invalid login credentials|invalid email or password|invalid_grant|incorrect password/i.test(
      rawMessage
    )
  ) {
    return 'Invalid credentials: The email or password you entered is incorrect.';
  }

  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    status === 409 ||
    /user already registered|already registered|already exists|duplicate key value/i.test(
      rawMessage
    )
  ) {
    return 'Email already registered: An account with this email already exists. Please sign in instead.';
  }

  if (
    code === 'weak_password' ||
    /weak password|password should be at least|password must be at least|password is too short/i.test(
      rawMessage
    )
  ) {
    return 'Weak password: Password must be at least 6 characters long.';
  }

  if (
    status === 429 ||
    code.includes('rate_limit') ||
    code === 'over_email_send_rate_limit' ||
    /rate limit|too many requests|429/i.test(rawMessage)
  ) {
    return `Rate limit exceeded on ${failingUrl}. Please wait a moment before trying again.`;
  }

  if (status === 404 || code === 'not_found' || /\b404\b|endpoint not found|not found/i.test(rawMessage)) {
    return `Endpoint not found (HTTP 404): ${failingUrl}. Ensure the Supabase table or Edge Function is deployed.`;
  }

  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /failed to fetch|networkerror|load failed|enotfound|project.*paused|service unavailable/i.test(
      rawMessage
    )
  ) {
    return `Project unavailable: Could not reach Supabase at ${failingUrl}. Check that VITE_SUPABASE_URL is valid and the Supabase project is active.`;
  }

  return rawMessage || `Request failed at ${failingUrl}.`;
}

// Re-export all database & SaaS types from our single canonical schema file
export type {
  AppRole,
  UserStatus,
  PlanName,
  UsageFeature,
  UserProfile,
  FeatureLimits,
  PlanRecord,
  SubscriptionRecord,
  InvoiceRecord,
  UsageEventRecord,
  FeatureFlagRecord,
  AuditLogRecord,
  TicketMessageRecord,
  SupportTicketRecord,
  AnnouncementRecord,
  ResumeRecord,
  TailoredResumeRecord,
  JobRecord,
  JobMatchRecord,
  ApplicationRecord,
  NotificationRecord,
  RoadmapRecord,
  RecommendedProjectRecord,
  CourseRecord,
  EnrollmentRecord,
  QuizAttemptRecord,
  CertificateRecord,
  MockInterviewRecord,
  PortfolioRecord,
} from '../schema/unifiedDataSchema.ts';
