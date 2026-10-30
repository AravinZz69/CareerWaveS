-- ==============================================================================
-- CareerWave: Complete Supabase Database Schema, Security & Storage Policies
-- ==============================================================================

-- 1. Create Enums & Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE app_role AS ENUM ('admin', 'user');
CREATE TYPE application_status AS ENUM ('applied', 'screening', 'interview', 'offer', 'rejected');
CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'internship', 'contract', 'remote');
CREATE TYPE experience_level AS ENUM ('entry', 'mid', 'senior', 'lead');

-- 2. User Roles Table (Separate table for RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- 3. Security Definer Function: has_role
-- Allows checking if a given user has an assigned role (e.g., 'admin') without exposing table directly
CREATE OR REPLACE FUNCTION public.has_role(lookup_user_id UUID, required_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = lookup_user_id
          AND role = required_role
    );
END;
$$;

-- 4. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    title TEXT DEFAULT 'Aspiring AI Specialist',
    bio TEXT,
    target_role TEXT DEFAULT 'Full Stack / AI Engineer',
    years_of_exp INT DEFAULT 1,
    location TEXT DEFAULT 'San Francisco, CA',
    skills TEXT[] DEFAULT ARRAY['Python', 'React', 'TypeScript', 'Machine Learning', 'Tailwind CSS'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: Automatically create profile and assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Resumes Table (Base Resumes)
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Primary Master Resume',
    file_url TEXT,
    file_name TEXT,
    file_size INT,
    raw_text TEXT,
    parsed_skills TEXT[] DEFAULT '{}',
    parsed_experience JSONB DEFAULT '[]'::jsonb,
    ats_score NUMERIC(5, 2) DEFAULT 84.50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT,
    location TEXT NOT NULL,
    job_type job_type DEFAULT 'full-time',
    experience_level experience_level DEFAULT 'entry',
    salary_min INT,
    salary_max INT,
    description TEXT,
    requirements TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tailored Resumes Table
CREATE TABLE IF NOT EXISTS public.tailored_resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    base_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    target_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    job_title TEXT NOT NULL,
    target_company TEXT NOT NULL,
    tailored_content TEXT,
    match_score NUMERIC(5, 2) DEFAULT 92.00,
    improvements TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Job Matches Table
CREATE TABLE IF NOT EXISTS public.job_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
    match_score NUMERIC(5, 2) NOT NULL DEFAULT 88.00,
    matched_skills TEXT[] DEFAULT '{}',
    missing_skills TEXT[] DEFAULT '{}',
    recommendations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    status application_status DEFAULT 'applied',
    notes TEXT,
    applied_date DATE DEFAULT CURRENT_DATE,
    salary_offered INT,
    interview_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Roadmaps Table
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    total_steps INT DEFAULT 12,
    completed_steps INT DEFAULT 4,
    milestones JSONB DEFAULT '[]'::jsonb,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Recommended Projects Table
CREATE TABLE IF NOT EXISTS public.projects_recommended (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Intermediate',
    estimated_hours INT DEFAULT 24,
    description TEXT,
    tech_stack TEXT[] DEFAULT '{}',
    github_template_url TEXT,
    demo_url TEXT,
    learning_outcomes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    instructor TEXT NOT NULL,
    level TEXT DEFAULT 'All Levels',
    duration_hours NUMERIC(4, 1) DEFAULT 18.5,
    rating NUMERIC(3, 2) DEFAULT 4.9,
    students_count INT DEFAULT 12400,
    thumbnail TEXT,
    badge TEXT DEFAULT 'Bestseller',
    price NUMERIC(6, 2) DEFAULT 0.00,
    modules JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Enrollments Table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    progress_percentage INT DEFAULT 0,
    status TEXT DEFAULT 'in_progress',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

-- 15. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    quiz_title TEXT NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
    passed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    certificate_number TEXT UNIQUE NOT NULL,
    credential_url TEXT,
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Mock Interviews Table
CREATE TABLE IF NOT EXISTS public.mock_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role_target TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Medium',
    feedback_score NUMERIC(5, 2) DEFAULT 88.0,
    strengths TEXT[] DEFAULT '{}',
    improvements TEXT[] DEFAULT '{}',
    transcript JSONB DEFAULT '[]'::jsonb,
    duration_mins INT DEFAULT 25,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Portfolios Table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'My Developer & AI Portfolio',
    custom_slug TEXT UNIQUE,
    template TEXT DEFAULT 'modern-purple',
    sections JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects_recommended ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- User Roles Policies
CREATE POLICY "Users can read their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins have full access to user_roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- Resumes Policies (Private per user)
CREATE POLICY "Users can manage their own resumes"
    ON public.resumes FOR ALL
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Tailored Resumes Policies
CREATE POLICY "Users can manage their tailored resumes"
    ON public.tailored_resumes FOR ALL
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Jobs Policies (Public read, admin write)
CREATE POLICY "Anyone can view active jobs"
    ON public.jobs FOR SELECT
    USING (is_active = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage jobs"
    ON public.jobs FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Job Matches Policies
CREATE POLICY "Users can view their job matches"
    ON public.job_matches FOR ALL
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Applications Policies
CREATE POLICY "Users can manage their job applications"
    ON public.applications FOR ALL
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Notifications Policies
CREATE POLICY "Users can view and manage their notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Roadmaps Policies
CREATE POLICY "Users can manage their roadmaps"
    ON public.roadmaps FOR ALL
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Recommended Projects Policies (Public read, admin write)
CREATE POLICY "Anyone can view recommended projects"
    ON public.projects_recommended FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage recommended projects"
    ON public.projects_recommended FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Courses Policies (Public read, admin write)
CREATE POLICY "Anyone can view courses"
    ON public.courses FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage courses"
    ON public.courses FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Enrollments Policies
CREATE POLICY "Users can manage their own course enrollments"
    ON public.enrollments FOR ALL
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Quiz Attempts Policies
CREATE POLICY "Users can manage their own quiz attempts"
    ON public.quiz_attempts FOR ALL
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Certificates Policies
CREATE POLICY "Users can view their own certificates"
    ON public.certificates FOR SELECT
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can issue certificates"
    ON public.certificates FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Mock Interviews Policies
CREATE POLICY "Users can manage their mock interview sessions"
    ON public.mock_interviews FOR ALL
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Portfolios Policies
CREATE POLICY "Public portfolios are viewable by anyone"
    ON public.portfolios FOR SELECT
    USING (is_published = TRUE OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their own portfolio"
    ON public.portfolios FOR ALL
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ==============================================================================
-- Storage Buckets: Resumes (Private) & Portfolios (Public)
-- ==============================================================================

-- Create buckets via Supabase storage API or SQL if storage schema exists
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('resumes', 'resumes', FALSE),
    ('portfolios', 'portfolios', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Resumes (Private to user or admin)
CREATE POLICY "Users can view own resume files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'resumes' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Users can upload own resume files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'resumes' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Users can delete own resume files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'resumes' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

-- Storage RLS: Portfolios (Public Read, Owner Write)
CREATE POLICY "Anyone can view portfolio assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolios');

CREATE POLICY "Users can upload portfolio assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'portfolios' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
