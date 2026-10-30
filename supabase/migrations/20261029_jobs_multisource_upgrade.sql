-- ============================================================================
-- CAREERWAVE MIGRATION: MULTI-SOURCE LIVE JOBS, CACHE & ALERTS UPGRADE
-- ============================================================================
BEGIN;

-- 1. Upgrade public.jobs table with multi-source aggregator columns
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'jsearch',
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS apply_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_platform TEXT NOT NULL DEFAULT 'Company Site',
  ADD COLUMN IF NOT EXISTS company_logo TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_remote BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS employment_type TEXT NOT NULL DEFAULT 'full-time',
  ADD COLUMN IF NOT EXISTS salary_min INTEGER,
  ADD COLUMN IF NOT EXISTS salary_max INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS required_skills TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sector TEXT NOT NULL DEFAULT 'Software',
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure unique constraint on (source, external_id) for idempotent upserts
DO $$ BEGIN
  ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_source_external_id_unique UNIQUE (source, external_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_source_platform ON public.jobs(source_platform);
CREATE INDEX IF NOT EXISTS idx_jobs_is_remote ON public.jobs(is_remote);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON public.jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_fetched_at ON public.jobs(fetched_at DESC);

-- 2. Query cache metadata table to skip refetching identical queries within 30 minutes
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

-- 3. Upgrade public.applications with applied_at and apply_url
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS apply_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_platform TEXT NOT NULL DEFAULT 'Company Site';

-- 4. Upgrade public.notifications with apply_url and external_job_id for deduplicating job alerts
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS apply_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS external_job_id TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_user_ext_job
  ON public.notifications(user_id, external_job_id);

-- 5. RLS Policy on jobs so signed-in users (and public preview) can read jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_select_authenticated" ON public.jobs;
CREATE POLICY "jobs_select_authenticated"
  ON public.jobs FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "jobs_select_all" ON public.jobs;
CREATE POLICY "jobs_select_all"
  ON public.jobs FOR SELECT
  USING (TRUE);

COMMIT;
