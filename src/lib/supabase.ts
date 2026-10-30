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

// Database Types matching our 25-table schema + SaaS foundations
export type AppRole = 'admin' | 'user';
export type UserStatus = 'active' | 'suspended';
export type PlanName = 'Free' | 'Pro' | 'Premium';
export type UsageFeature =
  | 'resume_tailoring'
  | 'ai_job_match'
  | 'mock_interview'
  | 'linkedin_generation'
  | 'portfolio_generation';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  title: string;
  target_role: string;
  years_of_exp: number;
  location: string;
  skills: string[];
  role?: AppRole;
  status?: UserStatus;
  plan?: PlanName;
  bio?: string;
  created_at?: string;
}

export interface FeatureLimits {
  resume_tailoring: number;
  ai_job_match: number;
  mock_interview: number;
  linkedin_generation: number;
  portfolio_generation: number;
}

export interface PlanRecord {
  id: string;
  name: PlanName;
  price_monthly: number;
  price_yearly: number;
  billing_interval: 'month' | 'year';
  feature_limits: FeatureLimits;
  is_active: boolean;
  description?: string;
  badge?: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  plan_id: string;
  plan_name: PlanName;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  billing_interval: 'month' | 'year';
  current_period_end: string;
  provider_customer_id: string;
  provider_subscription_id: string;
  bonus_credits?: Partial<FeatureLimits>;
  created_at: string;
}

export interface InvoiceRecord {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subscription_id: string;
  plan_name: PlanName;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'failed' | 'void';
  provider_invoice_id: string;
  invoice_pdf_url: string;
  created_at: string;
}

export interface UsageEventRecord {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  feature: UsageFeature;
  tokens_in: number;
  tokens_out: number;
  estimated_cost: number;
  timestamp: string;
}

export interface FeatureFlagRecord {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  allowed_plans: PlanName[];
  updated_at: string;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface TicketMessageRecord {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'user' | 'admin';
  message: string;
  created_at: string;
}

export interface SupportTicketRecord {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_plan: PlanName;
  subject: string;
  category: 'billing' | 'technical' | 'ai_quality' | 'account';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  messages: TicketMessageRecord[];
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'promo' | 'maintenance';
  target_plan: 'all' | PlanName;
  is_active: boolean;
  created_at: string;
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  title: string;
  file_url: string;
  ats_score: number;
  parsed_skills: string[];
  created_at: string;
}

export interface TailoredResumeRecord {
  id: string;
  user_id: string;
  resume_id: string;
  job_id?: string;
  target_role: string;
  target_company: string;
  tailored_summary: string;
  tailored_bullets: string[];
  match_score: number;
  created_at: string;
}

export interface JobRecord {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  job_type?: string;
  type?: 'Full-Time' | 'Internship' | 'Remote' | 'Contract';
  experience_level?: string;
  salary_min: number;
  salary_max: number;
  salary_range?: string;
  description: string;
  requirements: string[];
  match_percentage?: number;
  match_score?: number;
  posted_at?: string;
  created_at?: string;
  is_active?: boolean;
  tags: string[];
  track?: string;
}

export interface JobMatchRecord {
  id: string;
  user_id: string;
  job_id: string;
  match_score: number;
  missing_skills: string[];
  matched_skills: string[];
  created_at: string;
}

export interface ApplicationRecord {
  id: string;
  user_id: string;
  job_id?: string;
  company: string;
  position: string;
  status: 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  applied_date: string;
  interview_date?: string;
  notes?: string;
  salary_offered?: number;
  salary?: string;
  logo?: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'match' | 'application' | 'course' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface RoadmapRecord {
  id: string;
  user_id: string;
  title?: string;
  track_name?: string;
  category?: string;
  description?: string;
  target_role?: string;
  total_steps?: number;
  completed_steps?: number;
  progress_percent?: number;
  milestones: {
    id?: string;
    title: string;
    status?: 'completed' | 'in-progress' | 'locked';
    completed?: boolean;
    duration: string;
    skills?: string[];
    resourcesCount?: number;
  }[];
}

export interface RecommendedProjectRecord {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tech_stack: string[];
  estimated_hours: number;
  description: string;
  badge?: 'Popular' | 'Trending' | 'Bestseller';
}

export interface CourseRecord {
  id: string;
  title: string;
  instructor: string;
  instructor_role?: string;
  rating: number;
  students_count: number | string;
  duration?: string;
  duration_hours?: number;
  level: string;
  badge?: 'Bestseller' | 'Popular' | 'Trending' | string;
  image_url?: string;
  thumbnail?: string;
  track?: string;
  price: number | string;
  enrolled?: boolean;
  progress?: number;
}

export interface EnrollmentRecord {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
  last_accessed: string;
}

export interface QuizAttemptRecord {
  id: string;
  user_id: string;
  course_id: string;
  quiz_title: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}

export interface CertificateRecord {
  id: string;
  user_id: string;
  course_id: string;
  certificate_title: string;
  credential_code: string;
  issued_at: string;
}

export interface MockInterviewRecord {
  id: string;
  user_id: string;
  target_role: string;
  interview_type: 'Technical' | 'Behavioral' | 'System Design';
  overall_score: number;
  confidence_score: number;
  feedback_summary: string;
  completed_at: string;
}

export interface PortfolioRecord {
  id: string;
  user_id: string;
  slug: string;
  theme: string;
  is_published: boolean;
  public_url: string;
  views_count: number;
}
