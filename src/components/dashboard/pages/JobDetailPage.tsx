import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Mail,
  FileText,
  ExternalLink,
  Bookmark,
  Loader2,
  Share2,
  Globe,
  Building2,
} from 'lucide-react';
import {
  NormalizedJob,
  isValidHttpsApplyUrl,
  sanitizeJobDescriptionHtml,
  formatPostedRelativeTime,
  formatSalaryRange,
} from '../../../types/jobs';

interface JobDetailPageProps {
  job: NormalizedJob | any;
  hasResume: boolean;
  candidateName: string;
  onBack: () => void;
  onApplyExternal: (job: NormalizedJob | any) => void;
  onSaveJob: (job: NormalizedJob | any) => void;
  onTailorResume: () => void;
  onUploadResume: () => void;
  pendingConfirmJob?: NormalizedJob | null;
  onConfirmAppliedStatus?: (job: NormalizedJob | any, didApply: boolean) => void;
}

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

export const JobDetailPage: React.FC<JobDetailPageProps> = ({
  job,
  hasResume,
  candidateName,
  onBack,
  onApplyExternal,
  onSaveJob,
  onTailorResume,
  onUploadResume,
  pendingConfirmJob,
  onConfirmAppliedStatus,
}) => {
  const [kitLoading, setKitLoading] = useState(false);
  const [kitData, setKitData] = useState<any | null>(null);
  const [kitTab, setKitTab] = useState<'outreach' | 'questions' | 'topics'>('outreach');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  const validApplyUrl = isValidHttpsApplyUrl(job.apply_url);
  const sourcePlatform = job.source_platform || 'Company Site';
  const badgeStyle =
    SOURCE_BADGE_STYLES[sourcePlatform] || SOURCE_BADGE_STYLES['Company Site'];
  const salaryDisplay =
    job.salary_range || formatSalaryRange(job.salary_min, job.salary_max, job.currency);
  const postedLabel = formatPostedRelativeTime(job.posted_at);
  const cleanDescription = sanitizeJobDescriptionHtml(job.description);
  const requiredSkills: string[] =
    Array.isArray(job.required_skills) && job.required_skills.length > 0
      ? job.required_skills
      : Array.isArray(job.requirements)
      ? job.requirements
      : [];
  const isRemote = Boolean(job.is_remote ?? job.remote);
  const empTypeLabel =
    job.employment_type === 'internship'
      ? 'Internship'
      : job.employment_type === 'part-time'
      ? 'Part-time'
      : job.employment_type === 'contract'
      ? 'Contract'
      : job.job_type || 'Full-time';

  const handleGenerateKit = async () => {
    setKitLoading(true);
    try {
      const response = await fetch('/api/jobs/application-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: {
            ...job,
            requirements: requiredSkills,
          },
          candidateName,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setKitData(result.data);
      }
    } catch {
      // Fallback handled cleanly
    } finally {
      setKitLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShareJob = () => {
    const shareTarget = validApplyUrl ? job.apply_url : window.location.href;
    navigator.clipboard.writeText(shareTarget);
    setCopiedKey('share_link');
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleOpenOriginalPosting = () => {
    if (!validApplyUrl) return;
    window.open(job.apply_url, '_blank', 'noopener,noreferrer');
  };

  const handleApplyClick = () => {
    if (!validApplyUrl) return;
    onApplyExternal(job);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button & Original Posting Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 border border-[#EDE5FF] hover:bg-[#FAF8FF] transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-[#6C3CE1]" />
          <span>Back to All Live Jobs</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareJob}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 border border-[#EDE5FF] hover:bg-[#FAF8FF] transition-all cursor-pointer"
          >
            {copiedKey === 'share_link' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-[#6C3CE1]" />
                <span>Share / Copy Link</span>
              </>
            )}
          </button>

          {validApplyUrl ? (
            <button
              onClick={handleOpenOriginalPosting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF8FF] px-3.5 py-2 text-xs font-semibold text-[#6C3CE1] border border-[#E2D4FF] hover:bg-[#F3ECFF] transition-all cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>View original posting</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-400 border border-slate-200">
              Link unavailable
            </span>
          )}
        </div>
      </div>

      {/* Post-Apply Confirmation Prompt Banner */}
      {pendingConfirmJob && pendingConfirmJob.id === job.id && onConfirmAppliedStatus && (
        <div className="rounded-2xl bg-[#FAF8FF] border border-[#6C3CE1]/30 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6C3CE1] text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Did you complete your application for {job.title} at {job.company}?
              </p>
              <p className="text-[11px] text-slate-500">
                Confirm to keep your Kanban Application Tracker synchronized.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onConfirmAppliedStatus(job, true)}
              className="rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
            >
              Mark as Applied
            </button>
            <button
              onClick={() => onConfirmAppliedStatus(job, false)}
              className="rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Not yet
            </button>
          </div>
        </div>
      )}

      {/* Course-Detail-Style Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1E1438] via-[#2C1B54] to-[#4A269E] p-7 md:p-9 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-semibold text-purple-200 border border-white/15">
                via {sourcePlatform}
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {job.sector} • {empTypeLabel}
              </span>
              {isRemote && (
                <span className="rounded-md bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-300/20">
                  Remote Friendly
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {job.company_logo && !logoError ? (
                <img
                  src={job.company_logo}
                  alt={job.company}
                  onError={() => setLogoError(true)}
                  className="h-16 w-16 rounded-2xl object-cover border-2 border-white/20 bg-white"
                />
              ) : (
                <div className="h-16 w-16 rounded-2xl border-2 border-white/20 bg-white/10 flex items-center justify-center text-white font-serif text-xl font-bold">
                  {(job.company || 'C').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold leading-tight">
                  {job.title}
                </h1>
                <p className="text-sm text-purple-200 font-medium mt-1 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{job.company}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-purple-100 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-purple-300" />
                <span>{job.location}</span>
              </div>
              {salaryDisplay && (
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <span>{salaryDisplay}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-purple-300" />
                <span>{postedLabel}</span>
              </div>
            </div>
          </div>

          {/* Primary Actions Box */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 flex flex-col gap-3 min-w-[270px]">
            {validApplyUrl ? (
              <button
                onClick={handleApplyClick}
                className="w-full rounded-xl bg-white text-[#1E1438] hover:bg-purple-50 py-3 px-4 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply on {sourcePlatform}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                disabled
                className="w-full rounded-xl bg-white/20 text-white/60 py-3 px-4 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Link unavailable</span>
              </button>
            )}

            <button
              onClick={onTailorResume}
              className="w-full rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] text-white py-2.5 px-4 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/15"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tailor Resume to This Role</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSaveJob(job)}
                className="w-full rounded-xl bg-white/5 hover:bg-white/15 text-purple-100 py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>Save Job</span>
              </button>
              <button
                onClick={handleShareJob}
                className="w-full rounded-xl bg-white/5 hover:bg-white/15 text-purple-100 py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{copiedKey === 'share_link' ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main 12-Col Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Role Overview, Responsibilities, Skills & Application Kit */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-white p-6 border border-[#EDE5FF] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold border ${badgeStyle}`}>
                  via {sourcePlatform}
                </span>
                {isRemote && (
                  <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold">
                    Remote
                  </span>
                )}
              </div>
              {validApplyUrl && (
                <button
                  onClick={handleOpenOriginalPosting}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#6C3CE1] hover:underline cursor-pointer"
                >
                  <span>View original posting</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div>
              <h2 className="font-serif text-lg font-bold text-slate-900 mb-2">
                Role Description
              </h2>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {cleanDescription}
              </div>
            </div>

            {Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900 mb-3">
                  Key Responsibilities
                </h3>
                <ul className="space-y-2.5">
                  {job.responsibilities.map((resp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-[#6C3CE1] shrink-0 mt-0.5" />
                      <span>{sanitizeJobDescriptionHtml(resp)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-serif text-base font-bold text-slate-900 mb-3">
                Required Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((req: string) => {
                  const isMatched = (job.matchedSkills || []).some(
                    (m: string) => m.toLowerCase() === req.toLowerCase()
                  );
                  return (
                    <span
                      key={req}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                        isMatched
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-[#FAF8FF] border-[#E2D4FF] text-[#6C3CE1]'
                      }`}
                    >
                      {req}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 1-Click AI Application Kit */}
          <div className="rounded-2xl bg-white p-6 border border-[#EDE5FF] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F3ECFF] px-3 py-1 text-[11px] font-bold text-[#6C3CE1] mb-1">
                  <Sparkles className="h-3 w-3" /> AI APPLICATION KIT
                </span>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Recruiter Email, Cover Letter & Interview Prep
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!kitData && (
                  <button
                    onClick={handleGenerateKit}
                    disabled={kitLoading}
                    className="rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-4 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer flex items-center gap-2 disabled:opacity-60"
                  >
                    {kitLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating Kit...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Kit</span>
                      </>
                    )}
                  </button>
                )}
                {validApplyUrl ? (
                  <button
                    onClick={handleApplyClick}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Apply Now</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed"
                  >
                    Link unavailable
                  </button>
                )}
              </div>
            </div>

            {kitData && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-[#EDE5FF] pb-3">
                  {[
                    { id: 'outreach', label: 'Cold Email & Cover Letter' },
                    { id: 'questions', label: 'Likely Interview Questions' },
                    { id: 'topics', label: 'Topics to Prepare' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setKitTab(t.id as any)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer transition-all ${
                        kitTab === t.id
                          ? 'bg-[#6C3CE1] text-white'
                          : 'bg-[#FAF8FF] text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {kitTab === 'outreach' && (
                  <div className="space-y-4 text-xs">
                    <div className="rounded-xl bg-[#FAF8FF] border border-[#EDE5FF] p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-[#6C3CE1]" />
                          Recruiter Cold Email
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              `Subject: ${kitData.emailDraft?.subject}\n\n${kitData.emailDraft?.body}`,
                              'email'
                            )
                          }
                          className="inline-flex items-center gap-1 text-[#6C3CE1] font-semibold cursor-pointer"
                        >
                          {copiedKey === 'email' ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>{copiedKey === 'email' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="font-semibold text-slate-800">
                        Subject: {kitData.emailDraft?.subject}
                      </p>
                      <pre className="whitespace-pre-wrap font-sans text-slate-600 leading-relaxed">
                        {kitData.emailDraft?.body}
                      </pre>
                    </div>

                    <div className="rounded-xl bg-[#FAF8FF] border border-[#EDE5FF] p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-[#6C3CE1]" />
                          Tailored Cover Letter
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              `${kitData.coverLetter?.salutation}\n\n${kitData.coverLetter?.body}\n\n${kitData.coverLetter?.closing}`,
                              'cover'
                            )
                          }
                          className="inline-flex items-center gap-1 text-[#6C3CE1] font-semibold cursor-pointer"
                        >
                          {copiedKey === 'cover' ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>{copiedKey === 'cover' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-slate-600 leading-relaxed">
                        {kitData.coverLetter?.salutation}
                        {'\n\n'}
                        {kitData.coverLetter?.body}
                        {'\n\n'}
                        {kitData.coverLetter?.closing}
                      </pre>
                    </div>
                  </div>
                )}

                {kitTab === 'questions' && (
                  <div className="space-y-3 text-xs">
                    {(kitData.interviewQuestions?.technical || []).map(
                      (q: any, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-xl bg-[#FAF8FF] border border-[#EDE5FF] p-4 space-y-1.5"
                        >
                          <span className="rounded-md bg-[#F3ECFF] px-2.5 py-0.5 text-[10px] font-bold text-[#6C3CE1]">
                            Technical • {q.difficulty}
                          </span>
                          <p className="font-bold text-slate-900">{q.question}</p>
                          <p className="text-slate-600">
                            <strong>Approach:</strong> {q.idealApproach}
                          </p>
                        </div>
                      )
                    )}
                    {(kitData.interviewQuestions?.hr || []).map((q: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-amber-50/50 border border-amber-200/70 p-4 space-y-1.5"
                      >
                        <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                          Behavioral ({q.framework})
                        </span>
                        <p className="font-bold text-slate-900">{q.question}</p>
                        <p className="text-slate-600">{q.whatRecruiterLooksFor}</p>
                      </div>
                    ))}
                  </div>
                )}

                {kitTab === 'topics' && (
                  <div className="space-y-3 text-xs">
                    {(kitData.topicsToPrepare || []).map((t: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-[#FAF8FF] border border-[#EDE5FF] p-4 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{t.topic}</span>
                          <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-[#6C3CE1]">
                            {t.priority} Priority
                          </span>
                        </div>
                        <p className="text-slate-600">{t.summary}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Apply CTA inside Application Kit */}
                <div className="pt-3 border-t border-[#EDE5FF] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Ready to submit your application on {sourcePlatform}?
                  </span>
                  {validApplyUrl ? (
                    <button
                      onClick={handleApplyClick}
                      className="rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-4 py-2 text-xs font-bold text-white cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Open {sourcePlatform} & Track Application</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">
                      Link unavailable
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Resume Match Diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-white p-6 border border-[#EDE5FF] space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">
              A–F Resume Match Analysis
            </h3>

            {!hasResume ? (
              <div className="rounded-xl bg-[#FAF8FF] border border-dashed border-[#E2D4FF] p-6 text-center space-y-3">
                <p className="text-xs text-slate-600">
                  Upload your resume to see your personalized A–F match grade, matched skills, and missing keywords for this role.
                </p>
                <button
                  onClick={onUploadResume}
                  className="rounded-xl bg-[#6C3CE1] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Upload Resume
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF8FF] border border-[#EDE5FF]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6C3CE1] text-white font-serif text-2xl font-bold shrink-0">
                    {job.matchGrade || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {job.matchScore || 90}% Resume Match
                    </p>
                    <p className="text-xs text-slate-500">
                      Evaluated deterministically against your active resume skills
                    </p>
                  </div>
                </div>

                {job.matchReasons?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Why You Match</p>
                    {job.matchReasons.map((reason: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50/70 rounded-xl p-2.5"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                {job.missingSkills?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      Missing Skills to Highlight or Add
                    </p>
                    {job.missingSkills.map((ms: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50/80 rounded-xl p-2.5"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{ms}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={onTailorResume}
                  className="w-full rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] py-3 text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  Tailor Resume to Inject Missing Keywords
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
