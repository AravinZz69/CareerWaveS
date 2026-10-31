import { createClient } from '@supabase/supabase-js';

// Read from Vite env or localStorage if user configured via the UI modal
const getSupabaseConfig = () => {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_URL') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_ANON_KEY') : null;

  return {
    url: localUrl || import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
};

const { url, anonKey } = getSupabaseConfig();

export const isSupabaseConfigured = Boolean(
  url &&
  anonKey &&
  url.startsWith('http') &&
  !url.includes('your-project-id')
);

// Export a safe Supabase client (uses placeholder URL if unconfigured so app doesn't crash)
export const supabase = createClient(
  isSupabaseConfigured ? url : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? anonKey : 'placeholder-anon-key'
);

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;

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
} from '../schema/unifiedDataSchema';
