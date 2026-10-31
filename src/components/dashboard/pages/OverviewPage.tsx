import React from 'react';
import {
  FileText,
  Briefcase,
  Kanban,
  Mic,
  Map,
  GraduationCap,
  ArrowRight,
  Upload,
  CheckCircle2,
  Clock,
  ChevronRight,
  Target,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { DashboardPageId } from '../DashboardShell';

interface OverviewPageProps {
  onNavigate: (page: DashboardPageId) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const { profile, plan, workspace, meters, openUpgradeModal } = useAuth();

  const hasResume = Boolean(workspace.resume);
  const tailoredCount = workspace.tailoredResumes?.length || 0;
  const applicationsCount = workspace.applications?.length || 0;
  const interviewsCount = workspace.mockInterviews?.length || 0;
  const hasRoadmap = Boolean(workspace.roadmap);

  const firstName = (profile?.full_name || 'Member').split(' ')[0];

  return (
    <div className="space-y-8 text-slate-900">
      {/* Executive Welcome Banner (Pure White & Slate Theme) */}
      <div className="rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-xs border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {firstName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {hasResume
                ? 'Your active resume is analyzed and ready. Tailor it to live roles, track your pipeline, or practice spoken technical interview questions.'
                : 'Upload your resume to begin. The engine extracts your technical skills, scores live job postings, and personalizes your career roadmap.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('resume')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-2xs hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4 text-slate-700" />
              <span>{hasResume ? 'Open Resume Studio' : 'Upload Resume'}</span>
            </button>
            <button
              onClick={() => onNavigate('interviews')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Mic className="h-4 w-4 text-slate-300" />
              <span>Voice Interview</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Career Profile & Onboarding Summary Card */}
      <div className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <img
              src={
                profile?.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  profile?.full_name || 'Member'
                )}`
              }
              alt={profile?.full_name || 'User'}
              className="h-12 w-12 rounded-xl object-cover border border-slate-200 bg-slate-100"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
                  {profile?.full_name || 'CareerWave Member'}
                </h3>
                {profile?.experience_level && (
                  <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    {profile.experience_level}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {profile?.title || 'Software & AI Professional'} • {profile?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>View & Edit User Profile</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Target Role
            </span>
            <span className="mt-0.5 block text-xs font-bold text-slate-900 truncate">
              {profile?.target_role || 'Full Stack / AI Engineer'}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Career Track
            </span>
            <span className="mt-0.5 block text-xs font-bold text-slate-900 truncate">
              {profile?.career_track || 'Generative AI'}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Organization / College
            </span>
            <span className="mt-0.5 block text-xs font-bold text-slate-900 truncate">
              {profile?.education_or_company || 'Add in Profile'}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Location & Work Mode
            </span>
            <span className="mt-0.5 block text-xs font-bold text-slate-900 truncate">
              {profile?.location || 'India'} ({profile?.work_preference || 'Hybrid'})
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60 col-span-2 sm:col-span-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Career Goal
            </span>
            <span className="mt-0.5 block text-xs font-bold text-slate-900 truncate">
              {profile?.career_goal || 'Land a high-paying role'}
            </span>
          </div>
        </div>

        {profile?.skills && profile.skills.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Skills:</span>
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* KPI Cards Strip (Clean Slate Borders & White Backgrounds) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('resume')}
          className="rounded-2xl bg-white p-5 border border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                hasResume
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {hasResume ? 'Active' : 'Missing'}
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-slate-900">
            {hasResume ? `${1 + tailoredCount}` : '0'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasResume ? `1 Base • ${tailoredCount} Tailored` : 'Upload your resume'}
          </p>
        </div>

        <div
          onClick={() => onNavigate('applications')}
          className="rounded-2xl bg-white p-5 border border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
              <Kanban className="h-4.5 w-4.5" />
            </div>
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              Pipeline
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-slate-900">
            {applicationsCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {applicationsCount === 0 ? 'No applications tracked' : 'Tracked applications'}
          </p>
        </div>

        <div
          onClick={() => onNavigate('interviews')}
          className="rounded-2xl bg-white p-5 border border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
              <Mic className="h-4.5 w-4.5" />
            </div>
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              Voice
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-slate-900">
            {interviewsCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {interviewsCount === 0 ? 'No sessions completed' : 'Completed mock sessions'}
          </p>
        </div>

        <div
          onClick={() => onNavigate('roadmap')}
          className="rounded-2xl bg-white p-5 border border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
              <Map className="h-4.5 w-4.5" />
            </div>
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              Readiness
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-slate-900">
            {hasRoadmap ? `${workspace.roadmap.readinessScore || 78}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasRoadmap ? 'Target role score' : 'Generate roadmap'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          {/* Resume Status Card */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-bold text-slate-900">
                Active Resume Document
              </h3>
              <button
                onClick={() => onNavigate('resume')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
              >
                {hasResume ? 'Manage in Resume Studio →' : 'Upload Resume →'}
              </button>
            </div>

            {hasResume ? (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {workspace.resume.contact?.fullName || profile?.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {workspace.resume.contact?.email || profile?.email} • {tailoredCount} tailored version(s)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('jobs')}
                  className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer shrink-0 shadow-2xs"
                >
                  Match Jobs
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    No active resume uploaded
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
                    Upload your PDF or DOCX resume to calculate live job match grades and tailor to openings.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('resume')}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-2xs cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Resume</span>
                </button>
              </div>
            )}
          </div>

          {/* Applications Snapshot */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-bold text-slate-900">
                Application Pipeline
              </h3>
              <button
                onClick={() => onNavigate('applications')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
              >
                Open Board →
              </button>
            </div>

            {applicationsCount === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-7 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-slate-900">
                    No tracked applications yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                    Save roles from Job Hunter to organize applications through interview and offer stages.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('jobs')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                >
                  <span>Explore Openings</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {workspace.applications.slice(0, 4).map((app: any) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{app.role || app.position}</p>
                      <p className="text-slate-500">{app.company}</p>
                    </div>
                    <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                      {app.stage || app.status || 'Saved'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns */}
        <div className="lg:col-span-5 space-y-6">
          {/* Voice Interview Card */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-bold text-slate-900">
                Spoken Voice Interviews
              </h3>
              <button
                onClick={() => onNavigate('interviews')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
              >
                Practice →
              </button>
            </div>

            {interviewsCount === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center space-y-2.5">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-slate-900">
                    No interview sessions recorded
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Speak directly with the AI interviewer and receive objective evaluation rubrics.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('interviews')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer shadow-2xs"
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Start Mock Session</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {workspace.mockInterviews.slice(0, 3).map((s: any) => (
                  <div
                    key={s.id}
                    onClick={() => onNavigate('interviews')}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex items-center justify-between cursor-pointer hover:border-slate-400 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{s.role}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(s.created_at).toLocaleDateString('en-IN')} • {s.difficulty}
                      </p>
                    </div>
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      {s.report?.overallScore ?? 85}/100
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Plan Quotas */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-slate-900">
                Monthly Usage Quotas ({plan})
              </h3>
              <button
                onClick={() => openUpgradeModal()}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
              >
                Upgrade
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Resume Tailorings & Enhancements</span>
                <span className="font-bold text-slate-900">
                  {meters.resume_tailoring?.used ?? 0} / {meters.resume_tailoring?.totalLimit ?? 2}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Job Matches & Application Kits</span>
                <span className="font-bold text-slate-900">
                  {meters.ai_job_match?.used ?? 0} / {meters.ai_job_match?.totalLimit ?? 5}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Voice Mock Interviews</span>
                <span className="font-bold text-slate-900">
                  {meters.mock_interview?.used ?? 0} / {meters.mock_interview?.totalLimit ?? 2}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
