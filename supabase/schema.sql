-- ============================================================================
-- CAREERWAVE PRODUCTION SAAS — COMPLETE SUPABASE POSTGRESQL SCHEMA (RUN ALL)
-- ============================================================================
-- Safe & Idempotent: Can be executed multiple times in the Supabase SQL Editor.
-- Includes:
--   1. Extensions & Custom Enum Types
--   2. Core Identity, Profiles & RBAC (user_roles + has_role() SECURITY DEFINER)
--   3. SaaS Plans (INR ₹), Subscriptions, Invoices & AI Usage Metering
--   4. User Workspace Tables (Resumes, Tailored Resumes, Jobs, Matches,
--      Applications, Roadmaps, Projects, Courses, Lessons, Enrollments,
--      Quiz Attempts, Certificates, Mock Interviews, LinkedIn, Portfolios)
--   5. Admin Governance (Feature Flags, Audit Logs, Support Tickets,
--      Ticket Messages, Announcements, Notifications, System Settings)
--   6. Supabase Storage Buckets & Storage RLS Policies (resumes, certificates, avatars)
--   7. Row-Level Security (RLS) Policies for Every Table
--   8. Auth Triggers (Auto-create Profile, Role & Free Subscription on Signup)
--   9. Production Seed Data (Free/Pro/Premium INR Plans, Feature Flags, 12 Courses)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTENSIONS & CUSTOM ENUM TYPES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_status AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_name AS ENUM ('Free', 'Pro', 'Premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('paid', 'open', 'failed', 'void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.usage_feature AS ENUM (
    'resume_tailoring',
    'ai_job_match',
    'mock_interview',
    'linkedin_generation',
    'portfolio_generation'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM (
    'saved',
    'applied',
    'screening',
    'interview',
    'offer',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. CORE IDENTITY, PROFILES & RBAC
-- ============================================================================

-- 2.1 profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  target_role TEXT NOT NULL DEFAULT '',
  years_of_exp INTEGER NOT NULL DEFAULT 0,
  location TEXT NOT NULL DEFAULT 'India',
  bio TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  status public.user_status NOT NULL DEFAULT 'active',
  plan public.plan_name NOT NULL DEFAULT 'Free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.2 user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- 2.3 Server-Side Security Definer Function: has_role()
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- ============================================================================
-- 3. SAAS PLANS (INR ₹), SUBSCRIPTIONS, INVOICES & USAGE METERING
-- ============================================================================

-- 3.1 plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name public.plan_name UNIQUE NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0, -- Stored in INR (₹)
  price_yearly INTEGER NOT NULL DEFAULT 0,  -- Stored in INR (₹)
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  feature_limits JSONB NOT NULL DEFAULT '{
    "resume_tailoring": 2,
    "ai_job_match": 5,
    "mock_interview": 2,
    "linkedin_generation": 1,
    "portfolio_generation": 1
  }'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT NOT NULL DEFAULT '',
  badge TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  plan_name public.plan_name NOT NULL DEFAULT 'Free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  provider_customer_id TEXT NOT NULL DEFAULT '',
  provider_subscription_id TEXT NOT NULL DEFAULT '',
  bonus_credits JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.3 invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_name public.plan_name NOT NULL DEFAULT 'Pro',
  amount INTEGER NOT NULL DEFAULT 0, -- Amount in INR (₹)
  currency TEXT NOT NULL DEFAULT 'INR',
  status public.invoice_status NOT NULL DEFAULT 'paid',
  provider_invoice_id TEXT NOT NULL DEFAULT '',
  invoice_pdf_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 usage_events
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature public.usage_feature NOT NULL,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(10, 4) NOT NULL DEFAULT 0, -- Cost in INR (₹)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_feature_time
  ON public.usage_events (user_id, feature, timestamp DESC);

-- 3.5 Helper RPC to check & record AI feature quota in one atomic call
CREATE OR REPLACE FUNCTION public.check_and_record_ai_usage(
  _user_id UUID,
  _feature public.usage_feature,
  _tokens_in INTEGER DEFAULT 450,
  _tokens_out INTEGER DEFAULT 650,
  _estimated_cost NUMERIC DEFAULT 0.45
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_name public.plan_name;
  v_limits JSONB;
  v_bonus JSONB;
  v_base_limit INTEGER;
  v_bonus_limit INTEGER;
  v_total_limit INTEGER;
  v_used INTEGER;
BEGIN
  -- Get active subscription plan and bonus credits
  SELECT s.plan_name, COALESCE(s.bonus_credits, '{}'::jsonb), p.feature_limits
  INTO v_plan_name, v_bonus, v_limits
  FROM public.subscriptions s
  LEFT JOIN public.plans p ON p.name = s.plan_name
  WHERE s.user_id = _user_id
  LIMIT 1;

  IF v_plan_name IS NULL THEN
    v_plan_name := 'Free';
    SELECT feature_limits INTO v_limits FROM public.plans WHERE name = 'Free' LIMIT 1;
    v_bonus := '{}'::jsonb;
  END IF;

  v_base_limit := COALESCE((v_limits ->> _feature::text)::INTEGER, 2);
  v_bonus_limit := COALESCE((v_bonus ->> _feature::text)::INTEGER, 0);
  v_total_limit := v_base_limit + v_bonus_limit;

  -- Count usage in current calendar month
  SELECT COUNT(*)
  INTO v_used
  FROM public.usage_events
  WHERE user_id = _user_id
    AND feature = _feature
    AND timestamp >= date_trunc('month', NOW());

  IF v_used >= v_total_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'plan', v_plan_name,
      'feature', _feature,
      'used', v_used,
      'limit', v_total_limit,
      'error', format('Monthly %s limit (%s/%s) reached on %s plan. Please upgrade your plan.', _feature, v_used, v_total_limit, v_plan_name)
    );
  END IF;

  -- Record the usage event
  INSERT INTO public.usage_events (user_id, feature, tokens_in, tokens_out, estimated_cost)
  VALUES (_user_id, _feature, _tokens_in, _tokens_out, _estimated_cost);

  RETURN jsonb_build_object(
    'allowed', TRUE,
    'plan', v_plan_name,
    'feature', _feature,
    'used', v_used + 1,
    'limit', v_total_limit
  );
END;
$$;

-- ============================================================================
-- 4. USER WORKSPACE TABLES
-- ============================================================================

-- 4.1 resumes
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Primary Resume',
  file_name TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  raw_text TEXT NOT NULL DEFAULT '',
  parsed_data JSONB NOT NULL DEFAULT '{
    "contact": {},
    "summary": "",
    "skills": [],
    "experience": [],
    "projects": [],
    "education": [],
    "certifications": []
  }'::jsonb,
  parsed_skills TEXT[] NOT NULL DEFAULT '{}',
  ats_score INTEGER NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT 'B',
  sub_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  keywords_present TEXT[] NOT NULL DEFAULT '{}',
  keywords_missing TEXT[] NOT NULL DEFAULT '{}',
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  template_id TEXT NOT NULL DEFAULT 'classic-ats',
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

DROP TRIGGER IF EXISTS trg_resumes_updated_at ON public.resumes;
CREATE TRIGGER trg_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4.2 tailored_resumes
CREATE TABLE IF NOT EXISTS public.tailored_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  job_id UUID,
  target_role TEXT NOT NULL DEFAULT '',
  target_company TEXT NOT NULL DEFAULT '',
  job_description TEXT NOT NULL DEFAULT '',
  tailored_summary TEXT NOT NULL DEFAULT '',
  tailored_bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  tailored_skills TEXT[] NOT NULL DEFAULT '{}',
  matched_keywords TEXT[] NOT NULL DEFAULT '{}',
  missing_keywords TEXT[] NOT NULL DEFAULT '{}',
  match_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tailored_resumes_user_id ON public.tailored_resumes(user_id);

-- 4.3 jobs (Live cached jobs from JSearch, Adzuna, Jooble & verified feeds)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'jsearch',
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT 'India',
  is_remote BOOLEAN NOT NULL DEFAULT FALSE,
  employment_type TEXT NOT NULL DEFAULT 'full-time' CHECK (employment_type IN ('internship', 'full-time', 'part-time', 'contract')),
  job_type TEXT NOT NULL DEFAULT 'Full-Time',
  type TEXT NOT NULL DEFAULT 'Full-Time',
  work_mode TEXT NOT NULL DEFAULT 'Hybrid',
  experience_level TEXT NOT NULL DEFAULT 'Mid-Level',
  salary_min INTEGER, -- In INR or specified currency
  salary_max INTEGER, -- In INR or specified currency
  currency TEXT NOT NULL DEFAULT 'INR',
  salary_range TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  sector TEXT NOT NULL DEFAULT 'Software',
  track TEXT NOT NULL DEFAULT 'Software',
  apply_url TEXT NOT NULL DEFAULT '',
  source_platform TEXT NOT NULL DEFAULT 'Company Site',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON public.jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_fetched_at ON public.jobs(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_sector ON public.jobs(sector);
CREATE INDEX IF NOT EXISTS idx_jobs_source_platform ON public.jobs(source_platform);

-- 4.4 job_matches (Per-user AI job match scores & grades)
CREATE TABLE IF NOT EXISTS public.job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  match_score INTEGER NOT NULL DEFAULT 0,
  match_grade TEXT NOT NULL DEFAULT 'B',
  matched_skills TEXT[] NOT NULL DEFAULT '{}',
  missing_skills TEXT[] NOT NULL DEFAULT '{}',
  reasons TEXT[] NOT NULL DEFAULT '{}',
  application_kit JSONB NOT NULL DEFAULT '{
    "email_draft": "",
    "cover_letter": "",
    "technical_questions": [],
    "hr_questions": [],
    "topics_to_prepare": []
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_matches_user_id ON public.job_matches(user_id);

-- 4.5 applications (Kanban job application tracker)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  tailored_resume_id UUID REFERENCES public.tailored_resumes(id) ON DELETE SET NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'India',
  status public.application_status NOT NULL DEFAULT 'saved',
  match_grade TEXT NOT NULL DEFAULT 'A',
  applied_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  interview_date TIMESTAMPTZ,
  salary_offered INTEGER,
  salary TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  apply_url TEXT NOT NULL DEFAULT '',
  source_platform TEXT NOT NULL DEFAULT 'Company Site',
  logo TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);

DROP TRIGGER IF EXISTS trg_applications_updated_at ON public.applications;
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4.6 roadmaps (Skill gap analysis & career roadmap timeline)
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Career Roadmap',
  track_name TEXT NOT NULL DEFAULT 'Software Engineering',
  category TEXT NOT NULL DEFAULT 'Engineering',
  description TEXT NOT NULL DEFAULT '',
  target_role TEXT NOT NULL DEFAULT 'Full Stack Developer',
  skill_gap_report JSONB NOT NULL DEFAULT '{
    "current_skills": [],
    "missing_skills": [],
    "readiness_score": 0
  }'::jsonb,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_steps INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);

DROP TRIGGER IF EXISTS trg_roadmaps_updated_at ON public.roadmaps;
CREATE TRIGGER trg_roadmaps_updated_at
  BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4.7 projects (AI-recommended portfolio projects closing skill gaps)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  skill_closed TEXT NOT NULL DEFAULT '',
  estimated_hours INTEGER NOT NULL DEFAULT 12,
  description TEXT NOT NULL DEFAULT '',
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  github_url TEXT NOT NULL DEFAULT '',
  live_url TEXT NOT NULL DEFAULT '',
  badge TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4.8 courses (Catalog of 12 courses & certifications)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  instructor TEXT NOT NULL DEFAULT 'CareerWave Faculty',
  instructor_role TEXT NOT NULL DEFAULT 'Principal Architect',
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.8,
  students_count INTEGER NOT NULL DEFAULT 1200,
  duration TEXT NOT NULL DEFAULT '8h 30m',
  duration_hours NUMERIC(5, 1) NOT NULL DEFAULT 8.5,
  level TEXT NOT NULL DEFAULT 'Intermediate',
  badge TEXT,
  image_url TEXT NOT NULL DEFAULT '',
  track TEXT NOT NULL DEFAULT 'Enterprise AI',
  price INTEGER NOT NULL DEFAULT 0, -- In INR (₹)
  lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
  quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.9 enrollments (Per-user course progress & completed lessons)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 1,
  completed_lesson_ids TEXT[] NOT NULL DEFAULT '{}',
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);

-- 4.10 quiz_attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  quiz_title TEXT NOT NULL DEFAULT 'Course Assessment',
  score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);

-- 4.11 certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_title TEXT NOT NULL,
  credential_code TEXT UNIQUE NOT NULL,
  pdf_url TEXT NOT NULL DEFAULT '',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);

-- 4.12 mock_interviews (Real-time voice & text AI interview sessions)
CREATE TABLE IF NOT EXISTS public.mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  interview_type TEXT NOT NULL DEFAULT 'Technical' CHECK (interview_type IN ('Technical', 'Behavioral', 'System Design', 'HR')),
  difficulty TEXT NOT NULL DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  mode TEXT NOT NULL DEFAULT 'voice' CHECK (mode IN ('voice', 'text')),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  overall_score INTEGER NOT NULL DEFAULT 0,
  technical_score INTEGER NOT NULL DEFAULT 0,
  communication_score INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  question_evaluations JSONB NOT NULL DEFAULT '[]'::jsonb,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  improvements TEXT[] NOT NULL DEFAULT '{}',
  feedback_summary TEXT NOT NULL DEFAULT '',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id ON public.mock_interviews(user_id);

-- 4.13 linkedin_optimizations
CREATE TABLE IF NOT EXISTS public.linkedin_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL DEFAULT '',
  target_role TEXT NOT NULL DEFAULT '',
  profile_score INTEGER NOT NULL DEFAULT 0,
  headline TEXT NOT NULL DEFAULT '',
  about_section TEXT NOT NULL DEFAULT '',
  experience_bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills TEXT[] NOT NULL DEFAULT '{}',
  recruiter_keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_linkedin_optimizations_updated_at ON public.linkedin_optimizations;
CREATE TRIGGER trg_linkedin_optimizations_updated_at
  BEFORE UPDATE ON public.linkedin_optimizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4.14 portfolios (Publicly shareable at /p/:slug)
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  theme TEXT NOT NULL DEFAULT 'minimal',
  hero_title TEXT NOT NULL DEFAULT '',
  hero_subtitle TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  public_url TEXT NOT NULL DEFAULT '',
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_slug ON public.portfolios(slug);

DROP TRIGGER IF EXISTS trg_portfolios_updated_at ON public.portfolios;
CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. ADMIN GOVERNANCE, SUPPORT, ANNOUNCEMENTS & NOTIFICATIONS
-- ============================================================================

-- 5.1 feature_flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  allowed_plans TEXT[] NOT NULL DEFAULT ARRAY['Free', 'Pro', 'Premium'],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.2 audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- 5.3 support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  user_plan public.plan_name NOT NULL DEFAULT 'Free',
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'technical' CHECK (category IN ('billing', 'technical', 'ai_quality', 'account')),
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5.4 ticket_messages
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL DEFAULT '',
  sender_role TEXT NOT NULL DEFAULT 'user' CHECK (sender_role IN ('user', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);

-- 5.5 announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'promo', 'maintenance')),
  target_plan TEXT NOT NULL DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.6 notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('match', 'application', 'course', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- 5.7 system_settings (Maintenance mode, global configuration)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. SUPABASE STORAGE BUCKETS & STORAGE RLS POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('resumes', 'resumes', FALSE),
  ('certificates', 'certificates', TRUE),
  ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can read their own resumes" ON storage.objects;
CREATE POLICY "Users can read their own resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Anyone can view avatars and certificates" ON storage.objects;
CREATE POLICY "Anyone can view avatars and certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'certificates'));

DROP POLICY IF EXISTS "Authenticated users can upload avatars and certificates" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars and certificates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('avatars', 'certificates')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES FOR EVERY TABLE
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 7.1 profiles policies (Users read/update own profile; Admins read/update all; No self-delete)
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 7.2 user_roles policies
DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_admin"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7.3 plans policies (Public read; Admin write)
DROP POLICY IF EXISTS "plans_select_all" ON public.plans;
CREATE POLICY "plans_select_all"
  ON public.plans FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "plans_admin_manage" ON public.plans;
CREATE POLICY "plans_admin_manage"
  ON public.plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7.4 subscriptions policies
DROP POLICY IF EXISTS "subscriptions_select_own_or_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own_or_admin"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "subscriptions_modify_own_or_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_modify_own_or_admin"
  ON public.subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 7.5 invoices policies
DROP POLICY IF EXISTS "invoices_select_own_or_admin" ON public.invoices;
CREATE POLICY "invoices_select_own_or_admin"
  ON public.invoices FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "invoices_insert_own_or_admin" ON public.invoices;
CREATE POLICY "invoices_insert_own_or_admin"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 7.6 usage_events policies
DROP POLICY IF EXISTS "usage_events_select_own_or_admin" ON public.usage_events;
CREATE POLICY "usage_events_select_own_or_admin"
  ON public.usage_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "usage_events_insert_own_or_admin" ON public.usage_events;
CREATE POLICY "usage_events_insert_own_or_admin"
  ON public.usage_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 7.7 Per-user workspace tables (resumes, tailored_resumes, job_matches, applications,
--     roadmaps, projects, enrollments, quiz_attempts, certificates, mock_interviews,
--     linkedin_optimizations, notifications)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'resumes',
    'tailored_resumes',
    'job_matches',
    'applications',
    'roadmaps',
    'projects',
    'enrollments',
    'quiz_attempts',
    'certificates',
    'mock_interviews',
    'linkedin_optimizations',
    'notifications'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I_owner_or_admin" ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY "%I_owner_or_admin" ON public.%I FOR ALL TO authenticated
       USING (auth.uid() = user_id OR public.has_role(auth.uid(), ''admin''))
       WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), ''admin''));',
      t, t
    );
  END LOOP;
END $$;

-- 7.8 portfolios policies (Public can view published portfolios at /p/:slug; Owner/Admin full access)
DROP POLICY IF EXISTS "portfolios_public_published_read" ON public.portfolios;
CREATE POLICY "portfolios_public_published_read"
  ON public.portfolios FOR SELECT
  USING (is_published = TRUE OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "portfolios_owner_or_admin_write" ON public.portfolios;
CREATE POLICY "portfolios_owner_or_admin_write"
  ON public.portfolios FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 7.9 jobs & courses policies (Readable by all; Writable by Admin)
DROP POLICY IF EXISTS "jobs_select_all" ON public.jobs;
CREATE POLICY "jobs_select_all"
  ON public.jobs FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "jobs_admin_write" ON public.jobs;
CREATE POLICY "jobs_admin_write"
  ON public.jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "courses_select_all" ON public.courses;
CREATE POLICY "courses_select_all"
  ON public.courses FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "courses_admin_write" ON public.courses;
CREATE POLICY "courses_admin_write"
  ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7.10 support_tickets & ticket_messages policies
DROP POLICY IF EXISTS "support_tickets_owner_or_admin" ON public.support_tickets;
CREATE POLICY "support_tickets_owner_or_admin"
  ON public.support_tickets FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "ticket_messages_owner_or_admin" ON public.ticket_messages;
CREATE POLICY "ticket_messages_owner_or_admin"
  ON public.ticket_messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id
        AND (st.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id
        AND (st.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- 7.11 Admin governance policies (feature_flags, announcements, system_settings, audit_logs)
DROP POLICY IF EXISTS "feature_flags_read_all" ON public.feature_flags;
CREATE POLICY "feature_flags_read_all"
  ON public.feature_flags FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "feature_flags_admin_write" ON public.feature_flags;
CREATE POLICY "feature_flags_admin_write"
  ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "announcements_read_all" ON public.announcements;
CREATE POLICY "announcements_read_all"
  ON public.announcements FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "announcements_admin_write" ON public.announcements;
CREATE POLICY "announcements_admin_write"
  ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "system_settings_read_all" ON public.system_settings;
CREATE POLICY "system_settings_read_all"
  ON public.system_settings FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "system_settings_admin_write" ON public.system_settings;
CREATE POLICY "system_settings_admin_write"
  ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "audit_logs_admin_only" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_only"
  ON public.audit_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 8. AUTH TRIGGERS (AUTO-PROVISION PROFILE, ROLE & FREE SUBSCRIPTION ON SIGNUP)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_plan_id UUID;
  v_display_name TEXT;
BEGIN
  v_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    initcap(replace(split_part(NEW.email, '@', 1), '.', ' '))
  );

  -- 1. Create profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url, location, status, plan)
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    'India',
    'active',
    'Free'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Assign 'user' role (and 'admin' role if email matches admin account)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF lower(NEW.email) IN ('admin@careerwave.in', 'admin@careerwave.ai', 'founder@careerwave.in') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- 3. Provision default Free subscription
  SELECT id INTO v_free_plan_id FROM public.plans WHERE name = 'Free' LIMIT 1;

  INSERT INTO public.subscriptions (
    user_id,
    plan_id,
    plan_name,
    status,
    billing_interval,
    current_period_start,
    current_period_end
  )
  VALUES (
    NEW.id,
    v_free_plan_id,
    'Free',
    'active',
    'month',
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 9. PRODUCTION SEED DATA (INR ₹ PLANS, FEATURE FLAGS, SYSTEM SETTINGS, 12 COURSES)
-- ============================================================================

-- 9.1 Seed 3 SaaS Plans in Indian Rupees (₹)
INSERT INTO public.plans (name, price_monthly, price_yearly, billing_interval, feature_limits, is_active, description, badge)
VALUES
  (
    'Free',
    0,
    0,
    'month',
    '{"resume_tailoring": 2, "ai_job_match": 5, "mock_interview": 2, "linkedin_generation": 1, "portfolio_generation": 1}'::jsonb,
    TRUE,
    'Essential career tools to build your first ATS-ready resume and explore roles.',
    NULL
  ),
  (
    'Pro',
    1499,
    14990,
    'month',
    '{"resume_tailoring": 25, "ai_job_match": 100, "mock_interview": 15, "linkedin_generation": 10, "portfolio_generation": 5}'::jsonb,
    TRUE,
    'Accelerated job search with high-volume resume tailoring, live voice mock interviews, and job match scoring.',
    'Popular'
  ),
  (
    'Premium',
    3999,
    39990,
    'month',
    '{"resume_tailoring": 999, "ai_job_match": 999, "mock_interview": 100, "linkedin_generation": 50, "portfolio_generation": 25}'::jsonb,
    TRUE,
    'Unlimited career acceleration with priority AI voice interviewing, executive LinkedIn branding, and custom portfolio hosting.',
    'Bestseller'
  )
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  feature_limits = EXCLUDED.feature_limits,
  description = EXCLUDED.description,
  badge = EXCLUDED.badge,
  updated_at = NOW();

-- 9.2 Seed Feature Flags
INSERT INTO public.feature_flags (key, name, description, enabled, allowed_plans)
VALUES
  ('voice_mock_interview', 'Live Spoken Voice AI Interviewer', 'Real-time spoken voice interview agent with adaptive follow-up questions.', TRUE, ARRAY['Free', 'Pro', 'Premium']),
  ('apify_live_jobs', 'Live Job Feed Sync', 'Real-time job & internship ingestion with 24h/72h/7d freshness filters.', TRUE, ARRAY['Free', 'Pro', 'Premium']),
  ('ats_resume_tailor', 'AI Resume Tailoring & Keyword Diff', 'Rewrites resume summary and bullets to match target job descriptions.', TRUE, ARRAY['Free', 'Pro', 'Premium']),
  ('portfolio_publishing', 'Public Portfolio Hosting (/p/username)', 'Instant public portfolio deployment with custom themes and HTML export.', TRUE, ARRAY['Free', 'Pro', 'Premium']),
  ('linkedin_optimizer', 'LinkedIn Profile & Recruiter SEO', 'Generates high-converting headlines, About sections, and recruiter keywords.', TRUE, ARRAY['Free', 'Pro', 'Premium'])
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 9.3 Seed System Settings
INSERT INTO public.system_settings (key, value)
VALUES
  ('maintenance_mode', '{"enabled": false, "message": "CareerWave is undergoing scheduled maintenance."}'::jsonb),
  ('currency', '{"code": "INR", "symbol": "₹"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 9.4 Seed 12 Career Courses & Certifications (INR ₹ Pricing)
INSERT INTO public.courses (slug, title, instructor, instructor_role, rating, students_count, duration, duration_hours, level, badge, track, price, lessons, quiz_questions)
VALUES
  (
    'enterprise-rag-architectures',
    'Enterprise AI & Production RAG Architectures',
    'Dr. Aarav Mehta',
    'Principal AI Architect',
    4.9,
    4820,
    '12h 30m',
    12.5,
    'Advanced',
    'Bestseller',
    'Enterprise AI',
    0,
    '[{"id":"l1","title":"Vector Indexing & Hybrid Search","duration":"45m","videoUrl":"https://www.youtube.com/embed/dQw4w9WgXcQ"},{"id":"l2","title":"Chunking Strategies & Reranking","duration":"55m","videoUrl":"https://www.youtube.com/embed/dQw4w9WgXcQ"},{"id":"l3","title":"Guardrails, Eval & Hallucination Control","duration":"60m","videoUrl":"https://www.youtube.com/embed/dQw4w9WgXcQ"}]'::jsonb,
    '[{"q":"Which retrieval technique combines BM25 lexical matching with dense embeddings?","options":["Hybrid Search","Greedy Decoding","Beam Search","LoRA"],"answer":0}]'::jsonb
  ),
  (
    'generative-ai-llm-fine-tuning',
    'Generative AI Engineering & LLM Fine-Tuning',
    'Ananya Krishnan',
    'Staff ML Engineer',
    4.8,
    3910,
    '10h 15m',
    10.2,
    'Intermediate',
    'Trending',
    'Generative AI',
    0,
    '[{"id":"l1","title":"Transformer Internals & Attention","duration":"50m"},{"id":"l2","title":"PEFT, LoRA & QLoRA Workflows","duration":"65m"},{"id":"l3","title":"Inference Optimization & vLLM","duration":"45m"}]'::jsonb,
    '[{"q":"What does LoRA stand for in parameter-efficient fine-tuning?","options":["Low-Rank Adaptation","Linear Output Regularized Attention","Local Representation Alignment","Layered Optimization Routing"],"answer":0}]'::jsonb
  ),
  (
    'fintech-high-throughput-payments',
    'FinTech Core: UPI, Ledgers & Distributed Payment Systems',
    'Rohan Kulkarni',
    'VP of Engineering, FinTech',
    4.9,
    3150,
    '11h 00m',
    11.0,
    'Advanced',
    'Popular',
    'FinTech',
    0,
    '[{"id":"l1","title":"Double-Entry Immutable Ledgers","duration":"55m"},{"id":"l2","title":"Idempotency & Distributed Locks","duration":"50m"},{"id":"l3","title":"Real-Time Fraud Scoring Pipelines","duration":"60m"}]'::jsonb,
    '[{"q":"Why are idempotency keys critical in payment APIs?","options":["To prevent duplicate charges on network retries","To compress JSON payloads","To speed up CSS rendering","To bypass TLS handshakes"],"answer":0}]'::jsonb
  ),
  (
    'modern-data-analytics-dbt-snowflake',
    'Data Analytics: SQL Mastery, dbt & Executive Dashboards',
    'Priya Nair',
    'Lead Analytics Engineer',
    4.7,
    5240,
    '9h 45m',
    9.8,
    'Beginner',
    'Bestseller',
    'Data Analytics',
    0,
    '[{"id":"l1","title":"Window Functions & CTE Optimization","duration":"45m"},{"id":"l2","title":"Dimensional Modeling with dbt","duration":"50m"},{"id":"l3","title":"Cohort Retention & Funnel Metrics","duration":"40m"}]'::jsonb,
    '[{"q":"Which SQL clause partitions rows for window functions without collapsing them?","options":["OVER (PARTITION BY ...)","GROUP BY","HAVING","DISTINCT ON"],"answer":0}]'::jsonb
  ),
  (
    'fullstack-typescript-system-design',
    'Full-Stack TypeScript, Next.js & Scalable System Design',
    'Vikramaditya Rao',
    'Principal Software Engineer',
    4.9,
    6190,
    '14h 20m',
    14.3,
    'Intermediate',
    'Bestseller',
    'Software',
    0,
    '[{"id":"l1","title":"Type-Safe API Contracts & Edge Caching","duration":"50m"},{"id":"l2","title":"Database Indexing & Connection Pooling","duration":"55m"},{"id":"l3","title":"Horizontal Scaling & Rate Limiting","duration":"60m"}]'::jsonb,
    '[{"q":"Which HTTP status code represents rate limiting?","options":["429 Too Many Requests","401 Unauthorized","502 Bad Gateway","304 Not Modified"],"answer":0}]'::jsonb
  ),
  (
    'cloud-native-devops-kubernetes',
    'IT Services & Cloud Native DevOps with Kubernetes',
    'Siddharth Verma',
    'Cloud Practice Lead',
    4.8,
    2890,
    '10h 30m',
    10.5,
    'Intermediate',
    'Popular',
    'IT Services',
    0,
    '[{"id":"l1","title":"Container Security & Multi-Stage Builds","duration":"45m"},{"id":"l2","title":"Kubernetes Pods, Services & Ingress","duration":"60m"},{"id":"l3","title":"GitOps with ArgoCD & Terraform","duration":"55m"}]'::jsonb,
    '[{"q":"Which Kubernetes object manages stateless pod replicas and rolling updates?","options":["Deployment","ConfigMap","PersistentVolume","Secret"],"answer":0}]'::jsonb
  ),
  (
    'multi-agent-ai-orchestration',
    'Autonomous AI Agents & Tool-Calling Workflows',
    'Dr. Aarav Mehta',
    'Principal AI Architect',
    4.9,
    3420,
    '8h 45m',
    8.8,
    'Advanced',
    'Trending',
    'Generative AI',
    0,
    '[{"id":"l1","title":"Structured Outputs & Schema Validation","duration":"40m"},{"id":"l2","title":"ReAct Loops & Memory Persistence","duration":"50m"},{"id":"l3","title":"Multi-Agent Routing & Observability","duration":"55m"}]'::jsonb,
    '[{"q":"What is the primary purpose of function calling in LLMs?","options":["Connecting models to deterministic external tools and APIs","Reducing GPU temperature","Increasing font legibility","Encrypting weights"],"answer":0}]'::jsonb
  ),
  (
    'dsa-coding-interview-patterns',
    'Data Structures, Algorithms & Coding Interview Patterns',
    'Karan Malhotra',
    'Senior Staff Engineer',
    4.9,
    7450,
    '16h 00m',
    16.0,
    'Intermediate',
    'Bestseller',
    'Software',
    0,
    '[{"id":"l1","title":"Sliding Window & Two Pointers","duration":"60m"},{"id":"l2","title":"Trees, Tries & Graph Traversals","duration":"70m"},{"id":"l3","title":"Dynamic Programming State Transitions","duration":"75m"}]'::jsonb,
    '[{"q":"What is the time complexity of looking up a word of length L in a Trie?","options":["O(L)","O(N log N)","O(2^L)","O(L^2)"],"answer":0}]'::jsonb
  ),
  (
    'enterprise-cybersecurity-zero-trust',
    'Enterprise Cloud Security, IAM & Zero-Trust Architecture',
    'Meera Deshmukh',
    'Chief Information Security Officer',
    4.8,
    2180,
    '9h 15m',
    9.2,
    'Advanced',
    'Popular',
    'IT Services',
    0,
    '[{"id":"l1","title":"OAuth 2.0, OIDC & JWT Hardening","duration":"50m"},{"id":"l2","title":"Row-Level Security & Least Privilege","duration":"45m"},{"id":"l3","title":"Automated Threat Detection & SOC","duration":"50m"}]'::jsonb,
    '[{"q":"What principle states that users should only have access to resources strictly needed for their role?","options":["Principle of Least Privilege","Bell-LaPadula Chaos","Open Relay Policy","Kerckhoffs Assumption"],"answer":0}]'::jsonb
  ),
  (
    'quantitative-risk-algotrading-fintech',
    'Quantitative Risk Modeling & Algorithmic FinTech Systems',
    'Rohan Kulkarni',
    'VP of Engineering, FinTech',
    4.7,
    1940,
    '8h 20m',
    8.3,
    'Advanced',
    'Trending',
    'FinTech',
    0,
    '[{"id":"l1","title":"Order Book Microstructure & Latency","duration":"45m"},{"id":"l2","title":"Value at Risk (VaR) & Monte Carlo","duration":"55m"},{"id":"l3","title":"Regulatory Compliance & Audit Trails","duration":"40m"}]'::jsonb,
    '[{"q":"Which metric estimates the maximum potential portfolio loss over a given time frame at a confidence interval?","options":["Value at Risk (VaR)","Gross Merchandise Value","Net Promoter Score","Click-Through Rate"],"answer":0}]'::jsonb
  ),
  (
    'product-analytics-ab-testing',
    'Product Analytics, Experimentation & A/B Testing Science',
    'Priya Nair',
    'Lead Analytics Engineer',
    4.8,
    3680,
    '7h 50m',
    7.8,
    'Beginner',
    'Popular',
    'Data Analytics',
    0,
    '[{"id":"l1","title":"Hypothesis Design & Sample Size Power","duration":"45m"},{"id":"l2","title":"p-Values, Confidence Intervals & Pitfalls","duration":"50m"},{"id":"l3","title":"North Star Metrics & Guardrail KPIs","duration":"40m"}]'::jsonb,
    '[{"q":"What error occurs when you falsely conclude a treatment has an effect when it does not?","options":["Type I Error (False Positive)","Type II Error (False Negative)","Out-of-Memory Error","Syntax Error"],"answer":0}]'::jsonb
  ),
  (
    'ai-governance-mlops-enterprise',
    'Enterprise MLOps, Model Registry & AI Governance',
    'Ananya Krishnan',
    'Staff ML Engineer',
    4.8,
    2640,
    '9h 30m',
    9.5,
    'Intermediate',
    'Trending',
    'Enterprise AI',
    0,
    '[{"id":"l1","title":"Feature Stores & Data Drift Monitoring","duration":"50m"},{"id":"l2","title":"CI/CD for ML Pipelines & Canary Rollouts","duration":"55m"},{"id":"l3","title":"Model Lineage, Bias Audits & Compliance","duration":"45m"}]'::jsonb,
    '[{"q":"What phenomenon describes a degradation in model accuracy caused by changes in production input distribution?","options":["Data Drift","Gradient Clipping","Weight Decay","Batch Normalization"],"answer":0}]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  lessons = EXCLUDED.lessons,
  quiz_questions = EXCLUDED.quiz_questions;

-- ============================================================================
-- 10. MULTI-SOURCE JOB QUERY CACHE & DYNAMIC MULTI-GATEWAY PAYMENTS
-- ============================================================================

-- 10.1 job_query_cache (30-minute query deduplication cache)
CREATE TABLE IF NOT EXISTS public.job_query_cache (
  query_hash TEXT PRIMARY KEY,
  query_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  job_ids TEXT[] NOT NULL DEFAULT '{}',
  sources_status JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.job_query_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_query_cache_read_authenticated" ON public.job_query_cache;
CREATE POLICY "job_query_cache_read_authenticated"
  ON public.job_query_cache FOR SELECT TO authenticated
  USING (TRUE);

-- 10.2 payment_gateways (Dynamic Razorpay, Cashfree, Direct UPI configurations)
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name TEXT NOT NULL UNIQUE CHECK (gateway_name IN ('razorpay', 'cashfree', 'upi')),
  display_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

-- 10.3 payment_orders (Dynamic checkout orders & webhook verification ledger)
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  plan_name TEXT NOT NULL,
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  gateway_name TEXT NOT NULL CHECK (gateway_name IN ('razorpay', 'cashfree', 'upi')),
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),
  provider_order_id TEXT,
  provider_payment_id TEXT,
  upi_uri TEXT,
  utr_number TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'paid', 'failed')),
  webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage payment_gateways" ON public.payment_gateways;
CREATE POLICY "Admins manage payment_gateways"
  ON public.payment_gateways FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users read own payment_orders" ON public.payment_orders;
CREATE POLICY "Users read own payment_orders"
  ON public.payment_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage all payment_orders" ON public.payment_orders;
CREATE POLICY "Admins manage all payment_orders"
  ON public.payment_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.payment_gateways (gateway_name, display_name, description, is_active, environment, credentials, updated_by)
VALUES
  (
    'razorpay',
    'Razorpay Checkout',
    'Accept UPI, Credit/Debit Cards, NetBanking, and Wallets via Razorpay Standard Checkout.',
    TRUE,
    'sandbox',
    '{"key_id": "rzp_test_CareerWave9X2A", "key_secret": "rzp_secret_test_89a7c6b5d4e3f2", "webhook_secret": "whsec_rzp_careerwave_live"}'::jsonb,
    'admin@careerwave.in'
  ),
  (
    'cashfree',
    'Cashfree Payments',
    'Instant seamless checkout with Cashfree PG Orders API, Cards, UPI & NetBanking.',
    TRUE,
    'sandbox',
    '{"app_id": "TEST1029384756CAREERWAVE", "secret_key": "cfsk_ma_test_98a7b6c5d4e3f2g1h0", "webhook_secret": "whsec_cf_careerwave_live"}'::jsonb,
    'admin@careerwave.in'
  ),
  (
    'upi',
    'Direct UPI (Intent / QR)',
    'Zero-MDR Direct NPCI UPI Intent link & Dynamic VPA QR Code for Google Pay, PhonePe, Paytm & BHIM.',
    TRUE,
    'live',
    '{"vpa": "careerwave.ai@okaxis", "merchant_name": "CareerWave Technologies", "mcc": "5734"}'::jsonb,
    'admin@careerwave.in'
  )
ON CONFLICT (gateway_name) DO NOTHING;

COMMIT;
