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
  CheckCircle2,
  AlertTriangle,
  Share2,
  SlidersHorizontal,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
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
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<'rows' | 'grid'>('rows');
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
            pageSize: 15,
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
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
            Job Hunter — Live Jobs & Internships
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daily verified admin sheet postings & live roles across LinkedIn, Indeed, Apna, Naukri, Google, Adzuna & Company Career Pages. Click any row to expand full details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

      {/* Job Listings (Expandable Rows by default, or Cards Grid) */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((skeleton) => (
            <div
              key={skeleton}
              className="rounded-2xl bg-white p-4 border border-slate-200 flex items-center justify-between gap-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-52 rounded bg-slate-200" />
                  <div className="h-3 w-36 rounded bg-slate-100" />
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="h-6 w-24 rounded-lg bg-slate-100" />
                <div className="h-6 w-28 rounded-lg bg-slate-100" />
                <div className="h-8 w-24 rounded-xl bg-slate-200" />
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
      ) : viewLayout === 'rows' ? (
        <>
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-200">
            {/* Desktop Table Column Header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <div className="col-span-4">Company & Role</div>
              <div className="col-span-2">Type & Sector</div>
              <div className="col-span-2">Location & Mode</div>
              <div className="col-span-2">Salary / Stipend</div>
              <div className="col-span-2 text-right">Match & Actions</div>
            </div>

            {jobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const salaryDisplay =
                job.salary_range ||
                formatSalaryRange(job.salary_min, job.salary_max, job.currency) ||
                'Competitive INR';
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
              const isDailySheetPost =
                job.source === 'verified_feed' ||
                (Array.isArray(job.tags) && job.tags.includes('Admin Daily Posting'));

              return (
                <div
                  key={job.id}
                  className={`transition-colors ${
                    isExpanded ? 'bg-[#FAF8FF]/60' : 'hover:bg-slate-50/90'
                  }`}
                >
                  {/* Summary Row (Click anywhere on row to expand/collapse details) */}
                  <div
                    onClick={() =>
                      setExpandedJobId((prev) => (prev === job.id ? null : job.id))
                    }
                    className="px-4 sm:px-5 py-4 cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-3 items-center"
                  >
                    {/* Col 1-4: Logo, Role Title, Company, Source Badge */}
                    <div className="lg:col-span-4 flex items-center gap-3 min-w-0">
                      {job.company_logo && !failedLogos[job.id] ? (
                        <img
                          src={job.company_logo}
                          alt={job.company}
                          onError={() =>
                            setFailedLogos((prev) => ({ ...prev, [job.id]: true }))
                          }
                          className="h-11 w-11 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-xl border border-slate-200 bg-[#FAF8FF] text-[#6C3CE1] flex items-center justify-center font-serif text-sm font-bold shrink-0">
                          {(job.company || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span className="font-serif text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#6C3CE1] truncate">
                            {job.title}
                          </span>
                          {isDailySheetPost && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              Daily Sheet
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {job.company}
                          </span>
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${platformStyle}`}
                          >
                            {platform}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {postedLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Col 5-6: Employment Type & Sector */}
                    <div className="lg:col-span-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                          empLabel === 'Internship'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {empLabel}
                      </span>
                      <span className="inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {job.sector}
                      </span>
                    </div>

                    {/* Col 7-8: Location & Remote Mode */}
                    <div className="lg:col-span-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.location}</span>
                      {isRemote && (
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          Remote
                        </span>
                      )}
                    </div>

                    {/* Col 9-10: Compensation */}
                    <div className="lg:col-span-2 text-xs font-bold text-emerald-700">
                      {salaryDisplay}
                    </div>

                    {/* Col 11-12: Match Grade + Direct Apply + Expand Chevron */}
                    <div
                      className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hasResume && job.matchGrade && (
                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-bold border ${
                            job.matchGrade.startsWith('A')
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : job.matchGrade.startsWith('B')
                              ? 'bg-[#F3ECFF] text-[#6C3CE1] border-[#E2D4FF]'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {job.matchGrade} ({job.matchScore}%)
                        </span>
                      )}

                      {validApplyUrl ? (
                        <button
                          onClick={() => handleApplyExternal(job)}
                          className="rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-3 py-1.5 text-xs font-bold text-white shadow-2xs cursor-pointer inline-flex items-center gap-1 transition-all"
                        >
                          <span>Apply</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">No Link</span>
                      )}

                      <button
                        onClick={() =>
                          setExpandedJobId((prev) => (prev === job.id ? null : job.id))
                        }
                        aria-label={isExpanded ? 'Collapse job details' : 'Expand job details'}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[#6C3CE1]" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Row Details Accordion */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 bg-white border-t border-slate-200/80 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                        {/* Left 8 cols: Full Description, Responsibilities, Skills */}
                        <div className="lg:col-span-8 space-y-4">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Role Overview & Description
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {sanitizeJobDescriptionHtml(job.description)}
                            </p>
                          </div>

                          {Array.isArray(job.responsibilities) &&
                            job.responsibilities.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                  Key Responsibilities
                                </h4>
                                <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                                  {job.responsibilities.map((resp, idx) => (
                                    <li key={idx}>{resp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {skillsList.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Required Skills & Keywords
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {skillsList.map((skill: string) => (
                                  <span
                                    key={skill}
                                    className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right 4 cols: Direct Applying Link Card + Match Analysis + Actions */}
                        <div className="lg:col-span-4 space-y-3">
                          <div className="rounded-2xl bg-[#FAF8FF] border border-[#E2D4FF] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C3CE1]">
                                Direct Applying Link
                              </span>
                              <span
                                className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${platformStyle}`}
                              >
                                via {platform}
                              </span>
                            </div>

                            {validApplyUrl ? (
                              <>
                                <p className="text-[11px] text-slate-600 font-mono truncate bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                  {job.apply_url}
                                </p>
                                <button
                                  onClick={() => handleApplyExternal(job)}
                                  className="w-full rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-4 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
                                >
                                  <span>Apply Now on {platform}</span>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <p className="text-xs text-slate-500">
                                Direct external application link not provided.
                              </p>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                onClick={() =>
                                  onTailorResume?.({
                                    title: job.title,
                                    company: job.company,
                                    description: job.description,
                                  })
                                }
                                className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-[#6C3CE1]" />
                                <span>Tailor Resume</span>
                              </button>
                              <button
                                onClick={() => setSelectedJob(job)}
                                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span>Full Kit & Email</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#E2D4FF]/60">
                              <button
                                onClick={() => handleSaveJob(job)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#6C3CE1] cursor-pointer"
                              >
                                <Bookmark className="h-3.5 w-3.5" />
                                <span>Save to Tracker</span>
                              </button>
                              <button
                                onClick={() => handleShareJobCard(job)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#6C3CE1] cursor-pointer"
                              >
                                {copiedJobId === job.id ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copied Link</span>
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="h-3.5 w-3.5" />
                                    <span>Copy Apply Link</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {hasResume && job.matchReasons && job.matchReasons.length > 0 && (
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
                              <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{job.matchReasons[0]}</span>
                              </p>
                              {job.missingSkills && job.missingSkills.length > 0 && (
                                <p className="text-[11px] text-slate-600">
                                  Missing skills: {job.missingSkills.slice(0, 4).join(', ')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
