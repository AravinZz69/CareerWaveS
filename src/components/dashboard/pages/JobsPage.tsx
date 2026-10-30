import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  Check,
  Bookmark,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Share2,
  SlidersHorizontal,
  Briefcase,
  Building2,
} from 'lucide-react';
import { JobDetailPage } from './JobDetailPage';
import { useAuth } from '../../../context/AuthContext';
import {
  NormalizedJob,
  SourcePlatform,
  EmploymentType,
  JobDateWindow,
  JobSortOption,
  isValidHttpsApplyUrl,
  sanitizeJobDescriptionHtml,
  formatPostedRelativeTime,
  formatSalaryRange,
} from '../../../types/jobs';

interface JobsPageProps {
  onTailorResume?: (job: { title: string; company: string; description: string }) => void;
  onSaveToTracker?: (job: any, status?: 'Saved' | 'Applied') => void;
  onNavigateToApplications?: () => void;
  onNavigateToResume?: () => void;
}

const SOURCE_PLATFORMS: (SourcePlatform | 'All')[] = [
  'All',
  'LinkedIn',
  'Indeed',
  'Apna',
  'Naukri',
  'Google',
  'Company Site',
  'Adzuna',
  'Jooble',
];

const SOURCE_BADGE_STYLES: Record<string, string> = {
  LinkedIn: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/25',
  Indeed: 'bg-[#2164F3]/10 text-[#2164F3] border-[#2164F3]/25',
  Apna: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Naukri: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Google: 'bg-sky-50 text-sky-700 border-sky-200',
  Adzuna: 'bg-teal-50 text-teal-700 border-teal-200',
  Jooble: 'bg-amber-50 text-amber-800 border-amber-200',
  'Company Site': 'bg-[#F3ECFF] text-[#6C3CE1] border-[#E2D4FF]',
};

const SECTORS = ['All', 'Software', 'GenAI', 'Enterprise AI', 'FinTech', 'Analytics', 'IT Services'];

const LOCATIONS = [
  'India',
  'All',
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Chennai',
  'Gurugram',
  'Remote',
];

const EMPLOYMENT_TYPES: { id: EmploymentType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Types' },
  { id: 'full-time', label: 'Full-time' },
  { id: 'internship', label: 'Internship' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'contract', label: 'Contract' },
];

export const JobsPage: React.FC<JobsPageProps> = ({
  onTailorResume,
  onSaveToTracker,
  onNavigateToResume,
}) => {
  const { user, profile, workspace, saveUserApplication } = useAuth();

  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [hasResume, setHasResume] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Filters & Sorting
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [timeframe, setTimeframe] = useState<JobDateWindow>('all');
  const [sector, setSector] = useState('All');
  const [locationFilter, setLocationFilter] = useState('India');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [employmentType, setEmploymentType] = useState<EmploymentType | 'all'>('all');
  const [sourcePlatform, setSourcePlatform] = useState<SourcePlatform | 'All'>('All');
  const [sortBy, setSortBy] = useState<JobSortOption>('best_match');
  const [page, setPage] = useState<number>(1);

  // Detail & Interactive States
  const [selectedJob, setSelectedJob] = useState<NormalizedJob | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [partialFailureBanner, setPartialFailureBanner] = useState<string | null>(null);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});
  const [pendingConfirmJob, setPendingConfirmJob] = useState<NormalizedJob | null>(null);

  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  }, []);

  const showError = useCallback((msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4500);
  }, []);

  const fetchJobs = useCallback(
    async (opts?: { targetPage?: number; forceRefresh?: boolean; append?: boolean }) => {
      const targetPage = opts?.targetPage ?? 1;
      const forceRefresh = Boolean(opts?.forceRefresh);
      if (targetPage > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        let activeResume = workspace?.resume || null;
        if (!activeResume) {
          try {
            const saved = localStorage.getItem('careerwave_parsed_resume_v2');
            if (saved) activeResume = JSON.parse(saved);
          } catch {
            // ignore
          }
        }

        const response = await fetch('/api/jobs/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            role: roleFilter,
            location: locationFilter,
            remote: remoteOnly,
            dateWindow: timeframe,
            timeframe,
            sector,
            employmentType,
            sourcePlatform,
            sortBy,
            page: targetPage,
            pageSize: 8,
            forceRefresh,
            resume: activeResume,
          }),
        });

        if (!response.ok) {
          throw new Error(`Unable to fetch jobs (HTTP ${response.status}).`);
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
          setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : data.jobs.length);
          setHasMore(Boolean(data.hasMore));
          setHasResume(Boolean(data.hasResume || activeResume));
          setPage(targetPage);

          if (data.partialFailure) {
            setPartialFailureBanner(
              data.partialFailureMessage || 'Some sources are unavailable'
            );
          } else {
            setPartialFailureBanner(null);
          }
        }
      } catch (err: any) {
        showError(err?.message || 'Unable to refresh job listings right now.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      query,
      roleFilter,
      locationFilter,
      remoteOnly,
      timeframe,
      sector,
      employmentType,
      sourcePlatform,
      sortBy,
      workspace?.resume,
      showError,
    ]
  );

  // Trigger fetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs({ targetPage: 1, forceRefresh: false });
    }, 180);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  // Infinite scroll observer
  useEffect(() => {
    const node = loadMoreTriggerRef.current;
    if (!node || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchJobs({ targetPage: page + 1 });
        }
      },
      { rootMargin: '180px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchJobs]);

  const handleSaveJob = useCallback(
    async (job: NormalizedJob) => {
      const salaryDisplay =
        job.salary_range ||
        formatSalaryRange(job.salary_min, job.salary_max, job.currency) ||
        'Competitive INR';
      await saveUserApplication({
        id: `app_${job.id}`,
        job_id: job.id,
        company: job.company,
        position: job.title,
        location: job.location,
        status: 'Saved',
        matchGrade: job.matchGrade || 'A',
        appliedDate: new Date().toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        salary: salaryDisplay,
        url: job.apply_url,
        apply_url: job.apply_url,
        source_platform: job.source_platform,
        logo: job.company_logo,
      });
      onSaveToTracker?.(job, 'Saved');
      showToast(`Saved "${job.title}" at ${job.company} to your Application Tracker.`);
    },
    [saveUserApplication, onSaveToTracker, showToast]
  );

  const handleApplyExternal = useCallback(
    async (job: NormalizedJob) => {
      if (!isValidHttpsApplyUrl(job.apply_url)) {
        showError('Direct application link is unavailable for this listing.');
        return;
      }

      // 1. Open original job page in a NEW TAB immediately
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');

      // 2. Create or update row in applications with status "Applied" and applied_at
      const nowIso = new Date().toISOString();
      const salaryDisplay =
        job.salary_range ||
        formatSalaryRange(job.salary_min, job.salary_max, job.currency) ||
        'Competitive INR';

      await saveUserApplication({
        id: `app_${job.id}`,
        job_id: job.id,
        company: job.company,
        position: job.title,
        location: job.location,
        status: 'Applied',
        matchGrade: job.matchGrade || 'A',
        appliedDate: new Date().toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        applied_at: nowIso,
        salary: salaryDisplay,
        url: job.apply_url,
        apply_url: job.apply_url,
        source_platform: job.source_platform,
        logo: job.company_logo,
      });

      onSaveToTracker?.(job, 'Applied');

      // 3. Show required toast + set return confirmation banner
      showToast('Application tracked. Good luck!');
      setPendingConfirmJob(job);
    },
    [saveUserApplication, onSaveToTracker, showToast, showError]
  );

  const handleConfirmAppliedStatus = useCallback(
    async (job: NormalizedJob, didApply: boolean) => {
      const salaryDisplay =
        job.salary_range ||
        formatSalaryRange(job.salary_min, job.salary_max, job.currency) ||
        'Competitive INR';

      await saveUserApplication({
        id: `app_${job.id}`,
        job_id: job.id,
        company: job.company,
        position: job.title,
        location: job.location,
        status: didApply ? 'Applied' : 'Saved',
        matchGrade: job.matchGrade || 'A',
        appliedDate: new Date().toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        applied_at: didApply ? new Date().toISOString() : undefined,
        salary: salaryDisplay,
        url: job.apply_url,
        apply_url: job.apply_url,
        source_platform: job.source_platform,
        logo: job.company_logo,
      });

      setPendingConfirmJob(null);
      showToast(
        didApply
          ? `Confirmed "${job.title}" as Applied in your tracker!`
          : `Moved "${job.title}" to Saved so you can apply later.`
      );
    },
    [saveUserApplication, showToast]
  );

  const handleShareJobCard = (job: NormalizedJob) => {
    const urlToCopy = isValidHttpsApplyUrl(job.apply_url)
      ? job.apply_url
      : window.location.href;
    navigator.clipboard.writeText(urlToCopy);
    setCopiedJobId(job.id);
    showToast(`Copied link for ${job.title} at ${job.company}`);
    setTimeout(() => setCopiedJobId(null), 2000);
  };

  if (selectedJob) {
    return (
      <div className="space-y-4">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-semibold shadow-lg flex items-center gap-2 border border-white/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        <JobDetailPage
          job={selectedJob}
          hasResume={hasResume}
          candidateName={profile?.full_name || user?.email?.split('@')[0] || 'Candidate'}
          onBack={() => setSelectedJob(null)}
          onApplyExternal={handleApplyExternal}
          onSaveJob={handleSaveJob}
          pendingConfirmJob={pendingConfirmJob}
          onConfirmAppliedStatus={handleConfirmAppliedStatus}
          onTailorResume={() =>
            onTailorResume?.({
              title: selectedJob.title,
              company: selectedJob.company,
              description: selectedJob.description,
            })
          }
          onUploadResume={() => onNavigateToResume?.()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Floating Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-semibold shadow-lg flex items-center gap-2 border border-white/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      {errorToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-rose-950 text-rose-100 px-4 py-3 text-xs font-semibold shadow-lg flex items-center gap-2 border border-rose-700">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F3ECFF] border border-[#E2D4FF] px-3 py-1 text-xs font-semibold text-[#6C3CE1] mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#6C3CE1]" /> Multi-Platform Live Job Aggregator
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
            Live Jobs & Internships Feed
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time verified openings aggregated across LinkedIn, Indeed, Apna, Naukri, Google, Adzuna, Jooble & Company Career Pages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!hasResume && (
            <button
              onClick={() => onNavigateToResume?.()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-amber-700" />
              <span>Upload Resume for A–F Match Grades</span>
            </button>
          )}
          <button
            onClick={() => fetchJobs({ targetPage: 1, forceRefresh: true })}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#6C3CE1] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh jobs</span>
          </button>
        </div>
      </div>

      {/* Partial Source Failure Banner */}
      {partialFailureBanner && (
        <div className="rounded-2xl bg-amber-50/90 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-semibold">Some sources are unavailable:</span>
            <span className="text-amber-800">{partialFailureBanner}</span>
          </div>
          <button
            onClick={() => setPartialFailureBanner(null)}
            className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Post-Apply Return Prompt ("Did you apply? Mark as Applied / Not yet") */}
      {pendingConfirmJob && (
        <div className="rounded-2xl bg-[#FAF8FF] border border-[#6C3CE1]/30 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6C3CE1] text-white shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Did you apply to <span className="text-[#6C3CE1]">{pendingConfirmJob.title}</span> at{' '}
                {pendingConfirmJob.company}?
              </p>
              <p className="text-[11px] text-slate-500">
                Opened via {pendingConfirmJob.source_platform}. Keep your Kanban Application Tracker accurate:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleConfirmAppliedStatus(pendingConfirmJob, true)}
              className="rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
            >
              Mark as Applied
            </button>
            <button
              onClick={() => handleConfirmAppliedStatus(pendingConfirmJob, false)}
              className="rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Not yet
            </button>
          </div>
        </div>
      )}

      {/* Search & Multi-Source Filter Console */}
      <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-2xs space-y-4">
        {/* Row 1: Keyword Search + Role Filter + Date Window (24h / 72h / 7d / All) + Sort */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, company, or skill (e.g. LangGraph, Razorpay)..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#6C3CE1]"
            />
          </div>

          <div className="md:col-span-3 relative">
            <Briefcase className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              placeholder="Role filter (e.g. AI Engineer, Intern)..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#6C3CE1]"
            />
          </div>

          {/* Date Window Toggle */}
          <div className="md:col-span-3 flex items-center gap-1 rounded-xl bg-slate-50 p-1 border border-slate-200">
            {[
              { id: '24h', label: '24h' },
              { id: '72h', label: '72h' },
              { id: '7d', label: '7d' },
              { id: 'all', label: 'All' },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as JobDateWindow)}
                className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === tf.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-2 flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#6C3CE1] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as JobSortOption)}
              aria-label="Sort jobs"
              className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="best_match">Sort: Best Match</option>
              <option value="newest">Sort: Newest</option>
              <option value="salary">Sort: Salary</option>
            </select>
          </div>
        </div>

        {/* Row 2: Source Platform Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Source:
          </span>
          {SOURCE_PLATFORMS.map((sp) => (
            <button
              key={sp}
              onClick={() => setSourcePlatform(sp)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                sourcePlatform === sp
                  ? 'bg-[#6C3CE1] text-white border-[#6C3CE1] shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sp === 'All' ? 'All Sources' : sp}
            </button>
          ))}
        </div>

        {/* Row 3: Sector Chips + Employment Type + Location (Default India) + Remote Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Sector:
            </span>
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  sector === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Employment Type Selector */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Type:</span>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType | 'all')}
                aria-label="Employment type"
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {EMPLOYMENT_TYPES.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Selector (Default India) */}
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200">
              <MapPin className="h-3.5 w-3.5 text-[#6C3CE1]" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                aria-label="Location filter"
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === 'All' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Remote Only Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded text-[#6C3CE1] focus:ring-[#6C3CE1]"
              />
              <span>Remote Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-900">{jobs.length}</strong> of{' '}
          <strong className="text-slate-900">{totalCount || jobs.length}</strong> verified live jobs
          {sourcePlatform !== 'All' ? ` from ${sourcePlatform}` : ''}
          {locationFilter !== 'All' ? ` in ${locationFilter}` : ''}
        </span>
        {hasResume && (
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Scored against your active ATS resume
          </span>
        )}
      </div>

      {/* Job Cards Grid / Skeletons / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((skeleton) => (
            <div
              key={skeleton}
              className="rounded-2xl bg-white p-6 border border-slate-200 space-y-4 animate-pulse"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 rounded bg-slate-200" />
                    <div className="h-5 w-48 rounded bg-slate-200" />
                    <div className="h-3.5 w-32 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-7 w-24 rounded-xl bg-slate-200" />
              </div>
              <div className="h-3.5 w-64 rounded bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-5/6 rounded bg-slate-100" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 rounded-lg bg-slate-100" />
                <div className="h-6 w-20 rounded-lg bg-slate-100" />
                <div className="h-6 w-16 rounded-lg bg-slate-100" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <div className="h-9 w-36 rounded-xl bg-slate-200" />
                <div className="h-9 w-28 rounded-xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 border border-slate-200 text-center space-y-3">
          <Search className="h-8 w-8 text-slate-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-slate-900">
            No jobs found, try widening filters
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try clearing your role keyword, switching the date window to All, or selecting All Sources.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setRoleFilter('');
              setTimeframe('all');
              setSector('All');
              setLocationFilter('India');
              setRemoteOnly(false);
              setEmploymentType('all');
              setSourcePlatform('All');
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => {
              const salaryDisplay =
                job.salary_range ||
                formatSalaryRange(job.salary_min, job.salary_max, job.currency);
              const postedLabel = formatPostedRelativeTime(job.posted_at);
              const validApplyUrl = isValidHttpsApplyUrl(job.apply_url);
              const platform = job.source_platform || 'Company Site';
              const platformStyle =
                SOURCE_BADGE_STYLES[platform] || SOURCE_BADGE_STYLES['Company Site'];
              const isRemote = Boolean(job.is_remote ?? job.remote);
              const skillsList =
                Array.isArray(job.required_skills) && job.required_skills.length > 0
                  ? job.required_skills
                  : job.requirements || [];
              const empLabel =
                job.employment_type === 'internship'
                  ? 'Internship'
                  : job.employment_type === 'part-time'
                  ? 'Part-time'
                  : job.employment_type === 'contract'
                  ? 'Contract'
                  : job.job_type || 'Full-time';

              return (
                <div
                  key={job.id}
                  className="rounded-2xl bg-white p-6 border border-slate-200 shadow-2xs hover:border-[#6C3CE1]/40 hover:shadow-xs transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {job.company_logo && !failedLogos[job.id] ? (
                          <img
                            src={job.company_logo}
                            alt={job.company}
                            onError={() =>
                              setFailedLogos((prev) => ({ ...prev, [job.id]: true }))
                            }
                            className="h-12 w-12 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl border border-slate-200 bg-[#FAF8FF] text-[#6C3CE1] flex items-center justify-center font-serif text-base font-bold shrink-0">
                            {(job.company || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${platformStyle}`}
                            >
                              via {platform}
                            </span>
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                              {job.sector} • {empLabel}
                            </span>
                            {isRemote && (
                              <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                Remote
                              </span>
                            )}
                          </div>

                          <h3
                            onClick={() => setSelectedJob(job)}
                            className="font-serif text-lg font-bold text-slate-900 hover:text-[#6C3CE1] cursor-pointer leading-snug transition-colors"
                          >
                            {job.title}
                          </h3>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            <span>{job.company}</span>
                          </p>
                        </div>
                      </div>

                      {/* A-F AI Match Grade Badge */}
                      {hasResume && job.matchGrade ? (
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold border ${
                              job.matchGrade.startsWith('A')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : job.matchGrade.startsWith('B')
                                ? 'bg-[#F3ECFF] text-[#6C3CE1] border-[#E2D4FF]'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            Grade {job.matchGrade} ({job.matchScore}%)
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onNavigateToResume?.()}
                          className="rounded-xl bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-700 cursor-pointer shrink-0"
                        >
                          Upload to Score
                        </button>
                      )}
                    </div>

                    {/* Location, Salary Range, Posted Relative Time */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      {salaryDisplay && (
                        <span className="font-bold text-emerald-700">{salaryDisplay}</span>
                      )}
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {postedLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {sanitizeJobDescriptionHtml(job.description)}
                    </p>

                    {/* Required Skills */}
                    <div className="flex flex-wrap gap-1.5">
                      {skillsList.slice(0, 6).map((req: string) => (
                        <span
                          key={req}
                          className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
                        >
                          {req}
                        </span>
                      ))}
                    </div>

                    {hasResume && job.matchReasons && job.matchReasons.length > 0 && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] space-y-1">
                        <p className="font-semibold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{job.matchReasons[0]}</span>
                        </p>
                        {job.missingSkills && job.missingSkills.length > 0 && (
                          <p className="text-slate-600">
                            Missing skills: {job.missingSkills.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions: Apply (opens original link in new tab), Tailor Resume, View Details, Save, Share */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {validApplyUrl ? (
                        <button
                          onClick={() => handleApplyExternal(job)}
                          className="rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-3.5 py-2 text-xs font-bold text-white shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <span>Apply</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          disabled
                          title="Original https:// application link unavailable"
                          className="rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                        >
                          Link unavailable
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedJob(job)}
                        className="rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-white shadow-2xs cursor-pointer"
                      >
                        Details & Kit
                      </button>

                      <button
                        onClick={() =>
                          onTailorResume?.({
                            title: job.title,
                            company: job.company,
                            description: job.description,
                          })
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[#6C3CE1]" />
                        <span>Tailor Resume</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleShareJobCard(job)}
                        title="Share / Copy job link"
                        className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        {copiedJobId === job.id ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSaveJob(job)}
                        title="Save to Applications"
                        className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        <Bookmark className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite Scroll Sentinel & Load More Button */}
          <div ref={loadMoreTriggerRef} className="pt-4 flex flex-col items-center justify-center">
            {hasMore && (
              <button
                onClick={() => fetchJobs({ targetPage: page + 1 })}
                disabled={loadingMore}
                className="rounded-xl bg-white border border-slate-300 hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#6C3CE1]" />
                    <span>Loading more jobs...</span>
                  </>
                ) : (
                  <span>Load More Jobs ({totalCount - jobs.length} remaining)</span>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
