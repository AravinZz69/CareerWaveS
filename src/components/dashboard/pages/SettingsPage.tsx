import React, { useState, useEffect } from 'react';
import {
  User,
  CreditCard,
  BarChart3,
  LifeBuoy,
  Download,
  CheckCircle2,
  Sparkles,
  FileText,
  Send,
  MessageSquare,
  Briefcase,
  GraduationCap,
  MapPin,
  Target,
  Plus,
  X,
  Upload,
  Loader2,
} from 'lucide-react';
import { useAuth, UsageFeature } from '../../../context/AuthContext';
import { formatINR } from '../../../utils/currency';

interface SettingsPageProps {
  onOpenLegal?: (tab: 'terms' | 'privacy' | 'refund') => void;
}

const EXPERIENCE_LEVELS = [
  'Student / Final Year',
  'Fresher (0-1 yr)',
  'Early Career (1-3 yrs)',
  'Mid-Senior (3-6 yrs)',
  'Senior / Lead (6+ yrs)',
];

const CAREER_TRACKS = [
  'Generative AI',
  'Enterprise AI',
  'Full Stack Engineering',
  'Data Science & Analytics',
  'FinTech Systems',
  'Cloud & DevOps',
];

const WORK_PREFERENCES = ['Hybrid', 'Remote', 'On-site'];

const CAREER_GOALS = [
  'Land a high-paying full-time role',
  'Transition into AI / ML Engineering',
  'Secure a top tech internship',
  'Crack FAANG / Product interviews',
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenLegal }) => {
  const {
    user,
    profile,
    plan,
    plans,
    meters,
    invoices,
    tickets,
    openUpgradeModal,
    refreshSaaSStatus,
    updateUserProfile,
    saveUserResume,
    getAuthHeaders,
  } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [title, setTitle] = useState(profile?.title || '');
  const [targetRole, setTargetRole] = useState(profile?.target_role || '');
  const [location, setLocation] = useState(profile?.location || 'India');
  const [experienceLevel, setExperienceLevel] = useState(
    profile?.experience_level || 'Early Career (1-3 yrs)'
  );
  const [careerTrack, setCareerTrack] = useState(profile?.career_track || 'Generative AI');
  const [educationOrCompany, setEducationOrCompany] = useState(
    profile?.education_or_company || ''
  );
  const [workPreference, setWorkPreference] = useState(profile?.work_preference || 'Hybrid');
  const [careerGoal, setCareerGoal] = useState(
    profile?.career_goal || 'Land a high-paying full-time role'
  );
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [bio, setBio] = useState(profile?.bio || '');
  const [savedToast, setSavedToast] = useState(false);
  const [isAutoFillingResume, setIsAutoFillingResume] = useState(false);
  const [autoFillMessage, setAutoFillMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const resumeInputRef = React.useRef<HTMLInputElement | null>(null);

  // Support ticket state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('technical');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketToast, setTicketToast] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setTitle(profile.title || '');
      setTargetRole(profile.target_role || '');
      setLocation(profile.location || 'India');
      setExperienceLevel(profile.experience_level || 'Early Career (1-3 yrs)');
      setCareerTrack(profile.career_track || 'Generative AI');
      setEducationOrCompany(profile.education_or_company || '');
      setWorkPreference(profile.work_preference || 'Hybrid');
      setCareerGoal(profile.career_goal || 'Land a high-paying full-time role');
      setSkills(Array.isArray(profile.skills) ? profile.skills : []);
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleAddSkill = () => {
    const clean = newSkillInput.trim();
    if (!clean) return;
    if (!skills.includes(clean)) {
      setSkills((prev) => [...prev, clean]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      full_name: fullName,
      title,
      target_role: targetRole,
      location,
      experience_level: experienceLevel,
      career_track: careerTrack,
      education_or_company: educationOrCompany,
      work_preference: workPreference,
      career_goal: careerGoal,
      skills,
      bio,
      onboarding_completed: true,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleResumeUploadAutoFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsAutoFillingResume(true);
    setAutoFillMessage(null);

    try {
      const ext = file.name.toLowerCase();
      const isBinaryDoc =
        ext.endsWith('.pdf') ||
        ext.endsWith('.docx') ||
        ext.endsWith('.doc') ||
        file.type.includes('pdf') ||
        file.type.includes('word') ||
        file.type.includes('officedocument');

      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      let rawText = '';
      if (!isBinaryDoc) {
        rawText = await file.text();
      }

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          rawText,
          fileBase64,
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
          fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          candidateEmail: user?.email || profile?.email,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        setAutoFillMessage({
          type: 'error',
          text:
            json.error ||
            'Could not extract profile details from this file. Please try a readable PDF, DOCX, or TXT resume.',
        });
        return;
      }

      const parsed = json.data;
      const inferred = json.inferredProfile || {};

      const rawContactName = String(parsed.contact?.fullName || inferred.full_name || '').trim();
      const extractedName =
        rawContactName &&
        rawContactName !== 'Candidate' &&
        rawContactName !== 'Member' &&
        rawContactName !== 'Guest Visitor'
          ? rawContactName
          : fullName || profile?.full_name || '';

      const extractedLocation =
        String(parsed.contact?.location || inferred.location || '').trim() ||
        location ||
        'India';

      const latestExp =
        Array.isArray(parsed.experience) && parsed.experience.length > 0
          ? parsed.experience[0]
          : null;
      const latestEdu =
        Array.isArray(parsed.education) && parsed.education.length > 0
          ? parsed.education[0]
          : null;
      const latestProj =
        Array.isArray(parsed.projects) && parsed.projects.length > 0
          ? parsed.projects[0]
          : null;

      const extractedTitle =
        String(inferred.title || latestExp?.role || latestProj?.role || '').trim() ||
        title ||
        'Software & AI Engineer';
      const extractedTargetRole =
        String(inferred.target_role || latestExp?.role || '').trim() ||
        targetRole ||
        extractedTitle;
      const extractedOrg =
        String(
          inferred.education_or_company ||
            (latestExp?.company && latestExp.company !== 'Technology Organization'
              ? latestExp.company
              : '') ||
            (latestEdu?.school && latestEdu.school !== 'University / Institute of Technology'
              ? latestEdu.school
              : '')
        ).trim() ||
        educationOrCompany ||
        '';
      const extractedBio =
        String(inferred.bio || parsed.summary || '').trim() || bio || '';

      const groupedSkills = parsed.skills || {};
      const resumeSkillList = Array.from(
        new Set(
          [
            ...(Array.isArray(inferred.skills) ? inferred.skills : []),
            ...(Array.isArray(groupedSkills.languages) ? groupedSkills.languages : []),
            ...(Array.isArray(groupedSkills.frameworks) ? groupedSkills.frameworks : []),
            ...(Array.isArray(groupedSkills.cloudAndDevOps) ? groupedSkills.cloudAndDevOps : []),
            ...(Array.isArray(groupedSkills.aiAndData) ? groupedSkills.aiAndData : []),
          ]
            .map((s) => String(s || '').trim())
            .filter(Boolean)
        )
      );

      const allExtractedSkills =
        resumeSkillList.length > 0 ? resumeSkillList : skills;

      const inferredExpLevel =
        inferred.experience_level ||
        (() => {
          const expCount = Array.isArray(parsed.experience) ? parsed.experience.length : 0;
          if (expCount === 0) return 'Student / Final Year';
          if (expCount === 1) return 'Fresher (0-1 yr)';
          if (expCount === 2) return 'Early Career (1-3 yrs)';
          return 'Mid-Senior (3-6 yrs)';
        })();

      const inferredTrack =
        inferred.career_track ||
        (() => {
          const aiCount = Array.isArray(groupedSkills.aiAndData) ? groupedSkills.aiAndData.length : 0;
          const cloudCount = Array.isArray(groupedSkills.cloudAndDevOps)
            ? groupedSkills.cloudAndDevOps.length
            : 0;
          const fwCount = Array.isArray(groupedSkills.frameworks) ? groupedSkills.frameworks.length : 0;
          if (aiCount >= 3) return 'Generative AI';
          if (cloudCount >= 3 && cloudCount > fwCount) return 'Cloud & DevOps';
          if (fwCount >= 2) return 'Full Stack Engineering';
          return careerTrack || 'Generative AI';
        })();

      const inferredWorkPref = inferred.work_preference || workPreference || 'Hybrid';
      const inferredCareerGoal =
        inferred.career_goal || careerGoal || 'Land a high-paying full-time role';

      setFullName(extractedName);
      setTitle(extractedTitle);
      setTargetRole(extractedTargetRole);
      setLocation(extractedLocation);
      setExperienceLevel(inferredExpLevel);
      setCareerTrack(inferredTrack);
      setEducationOrCompany(extractedOrg);
      setWorkPreference(inferredWorkPref);
      setCareerGoal(inferredCareerGoal);
      setSkills(allExtractedSkills);
      setBio(extractedBio);

      // Save canonical resume to user's workspace state & backend so ATS Studio & Job Matches stay in sync
      await saveUserResume({
        ...parsed,
        uploadedFileName: file.name,
        uploadedFileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        uploadedAt: new Date().toISOString(),
        rawTextPreview: json.rawExtractedText || rawText || parsed.rawTextPreview,
      });

      await updateUserProfile({
        full_name: extractedName,
        title: extractedTitle,
        target_role: extractedTargetRole,
        location: extractedLocation,
        experience_level: inferredExpLevel,
        career_track: inferredTrack,
        education_or_company: extractedOrg,
        work_preference: inferredWorkPref,
        career_goal: inferredCareerGoal,
        skills: allExtractedSkills,
        bio: extractedBio,
        onboarding_completed: true,
      });

      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3500);
      setAutoFillMessage({
        type: 'success',
        text: `Auto-filled profile from "${file.name}" (${allExtractedSkills.length} skills, role "${extractedTitle}", ${
          extractedOrg ? `organization "${extractedOrg}", ` : ''
        }location "${extractedLocation}", and bio saved).`,
      });
    } catch (err: any) {
      setAutoFillMessage({
        type: 'error',
        text: err?.message || 'Failed to parse resume for auto-fill. Please try again.',
      });
    } finally {
      setIsAutoFillingResume(false);
    }
  };

  const handleExportAccountData = async () => {
    try {
      const res = await fetch('/api/account/export', {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `careerwave-account-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Ignore
    }
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setTicketSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          subject: ticketSubject,
          category: ticketCategory,
          priority: ticketPriority,
          message: ticketMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTicketSubject('');
        setTicketMessage('');
        setTicketToast('Support ticket submitted! Our team will respond shortly.');
        await refreshSaaSStatus();
        setTimeout(() => setTicketToast(null), 4000);
      }
    } finally {
      setTicketSubmitting(false);
    }
  };

  const activePlanObj = plans.find((p) => p.name === plan);
  const currentMonthlyPrice =
    activePlanObj?.price_monthly ?? (plan === 'Premium' ? 3999 : plan === 'Pro' ? 1499 : 0);

  const featureLabels: Record<UsageFeature, string> = {
    resume_tailoring: 'ATS Resume Tailorings',
    ai_job_match: 'Job Matches & Application Kits',
    mock_interview: 'Spoken Voice Mock Interviews',
    linkedin_generation: 'LinkedIn Optimizations',
    portfolio_generation: 'Portfolio Website Deployments',
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
          User Profile & Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          View and manage your onboarding career profile, skills, monthly plan quotas, and billing in Indian Rupees (₹).
        </p>
      </div>

      {/* Onboarding & Career Profile Overview Banner */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <img
              src={
                profile?.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  profile?.full_name || 'Member'
                )}`
              }
              alt={profile?.full_name || 'User Avatar'}
              className="h-16 w-16 rounded-2xl object-cover border border-slate-200 bg-slate-100"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  {profile?.full_name || fullName || 'CareerWave Member'}
                </h3>
                <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {plan} Plan
                </span>
                {profile?.experience_level && (
                  <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                    {profile.experience_level}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                {profile?.title || title || 'Software & AI Professional'} •{' '}
                <span className="text-slate-500">{profile?.email || user?.email}</span>
              </p>
              {(profile?.bio || bio) && (
                <p className="text-xs text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
                  {profile?.bio || bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleResumeUploadAutoFill}
              className="hidden"
            />
            <button
              type="button"
              disabled={isAutoFillingResume}
              onClick={() => resumeInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] disabled:opacity-60 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
            >
              {isAutoFillingResume ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting Resume Details...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Resume to Auto-Fill</span>
                </>
              )}
            </button>
          </div>
        </div>

        {autoFillMessage && (
          <div
            className={`mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs font-medium border ${
              autoFillMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{autoFillMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoFillMessage(null)}
              className="text-current opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Onboarding Profile Snapshot Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Target Role
            </span>
            <span className="mt-1 block text-xs font-bold text-slate-900 truncate">
              {profile?.target_role || targetRole || 'Not set'}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Career Track
            </span>
            <span className="mt-1 block text-xs font-bold text-slate-900 truncate">
              {profile?.career_track || careerTrack || 'Generative AI'}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Experience Level
            </span>
            <span className="mt-1 block text-xs font-bold text-slate-900 truncate">
              {profile?.experience_level || experienceLevel || 'Early Career'}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              College / Company
            </span>
            <span className="mt-1 block text-xs font-bold text-slate-900 truncate">
              {profile?.education_or_company || educationOrCompany || 'Not specified'}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Location & Mode
            </span>
            <span className="mt-1 block text-xs font-bold text-slate-900 truncate">
              {profile?.location || location || 'India'} ({profile?.work_preference || workPreference || 'Hybrid'})
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Primary Goal
            </span>
            <span className="mt-1 block text-xs font-bold text-slate-900 truncate">
              {profile?.career_goal || careerGoal || 'Full-time role'}
            </span>
          </div>
        </div>

        {/* Skills Badges Strip */}
        {(profile?.skills?.length || skills.length) > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Profile Skills:</span>
            {(profile?.skills?.length ? profile.skills : skills).map((skill) => (
              <span
                key={skill}
                className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Complete Editable Profile + Subscription & Invoices */}
        <div className="lg:col-span-7 space-y-6">
          {/* Editable Profile & Onboarding Details Card */}
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl bg-white p-6 border border-slate-200 shadow-2xs space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Edit Personal & Onboarding Profile
                  </h3>
                  <p className="text-xs text-slate-500">
                    All onboarding responses and profile attributes are editable below
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isAutoFillingResume}
                  onClick={() => resumeInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDD0FF] bg-[#F5F0FF] hover:bg-[#EDE5FF] disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  {isAutoFillingResume ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Auto-Filling...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      <span>Auto-Fill from Resume</span>
                    </>
                  )}
                </button>
                {savedToast && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Profile Saved
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Account Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || user?.email || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Current Headline / Role Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full Stack & AI Engineer"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Dream Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Generative AI Engineer"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Primary Career Track
                </label>
                <select
                  value={careerTrack}
                  onChange={(e) => setCareerTrack(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  {CAREER_TRACKS.map((track) => (
                    <option key={track} value={track}>
                      {track}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  University / Current Organization
                </label>
                <input
                  type="text"
                  value={educationOrCompany}
                  onChange={(e) => setEducationOrCompany(e.target.value)}
                  placeholder="e.g. IIT Bombay / NextGen Labs"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Preferred Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Hyderabad, Pune, or Remote"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Preferred Work Mode
                </label>
                <select
                  value={workPreference}
                  onChange={(e) => setWorkPreference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  {WORK_PREFERENCES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Primary Career Goal
                </label>
                <select
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  {CAREER_GOALS.map((goal) => (
                    <option key={goal} value={goal}>
                      {goal}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Technical Skills
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-slate-300 hover:text-white cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add a skill (e.g. React, Python, System Design)..."
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Professional Summary / Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short summary of your background, goals, and core strengths..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
              >
                Save Profile Changes
              </button>
            </div>
          </form>

          {/* Subscription & Billing Card */}
          <div className="rounded-2xl bg-white p-6 border border-[#EDE5FF] shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0FF] text-[#6C3CE1]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Subscription & Billing
                  </h3>
                  <p className="text-xs text-slate-500">
                    All plans and invoices are billed in Indian Rupees (₹)
                  </p>
                </div>
              </div>

              <button
                onClick={() => openUpgradeModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-4 py-2 text-xs font-semibold text-white shadow-sm cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{plan === 'Premium' ? 'Manage Plan' : 'Upgrade Plan'}</span>
              </button>
            </div>

            <div className="rounded-2xl bg-[#FAF8FF] border border-[#E6DCFF] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg font-bold text-slate-900">
                    {plan} Plan
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activePlanObj?.description ||
                    'Includes monthly allocations for ATS resume tailoring, job matches, and voice interviews.'}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="font-serif text-2xl font-bold text-slate-900">
                  {formatINR(currentMonthlyPrice)}
                </span>
                <span className="text-xs text-slate-400">/month</span>
              </div>
            </div>

            {/* Invoices Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Billing Invoices
              </h4>
              {invoices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  No paid invoices recorded yet for your account.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400">
                        <th className="py-2 font-semibold">Invoice</th>
                        <th className="py-2 font-semibold">Plan</th>
                        <th className="py-2 font-semibold">Amount</th>
                        <th className="py-2 font-semibold">Status</th>
                        <th className="py-2 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-2.5 font-mono text-slate-700">{inv.id}</td>
                          <td className="py-2.5 font-semibold text-slate-900">
                            {inv.plan_name}
                          </td>
                          <td className="py-2.5 font-bold text-slate-900">
                            {formatINR(inv.amount)}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400">
                            {new Date(inv.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Data Export & Legal */}
          <div className="rounded-2xl bg-white p-6 border border-[#EDE5FF] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900">
                Export Your Career Data
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download a complete JSON archive of your profile, resumes, applications, and billing history.
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#6C3CE1] font-semibold">
                <button
                  onClick={() => onOpenLegal?.('terms')}
                  className="hover:underline cursor-pointer"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => onOpenLegal?.('privacy')}
                  className="hover:underline cursor-pointer"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => onOpenLegal?.('refund')}
                  className="hover:underline cursor-pointer"
                >
                  Refund Policy
                </button>
              </div>
            </div>

            <button
              onClick={handleExportAccountData}
              className="inline-flex items-center gap-2 rounded-xl border border-[#6C3CE1]/30 bg-[#FAF8FF] px-4 py-2.5 text-xs font-semibold text-[#6C3CE1] hover:bg-[#F3ECFF] transition-colors cursor-pointer shrink-0"
            >
              <Download className="h-4 w-4" />
              Export Data (JSON)
            </button>
          </div>
        </div>

        {/* Right Column: Monthly Usage Quotas + Support Helpdesk */}
        <div className="lg:col-span-5 space-y-6">
          {/* Usage Meters */}
          <div className="rounded-2xl bg-white p-6 border border-[#EDE5FF] shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0FF] text-[#6C3CE1]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Monthly Feature Usage
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time quota tracking on your {plan} plan
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {(Object.keys(featureLabels) as UsageFeature[]).map((feat) => {
                const m = meters[feat];
                return (
                  <div key={feat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {featureLabels[feat]}
                      </span>
                      <span className="font-bold text-slate-900">
                        {m?.used ?? 0} / {m?.totalLimit ?? 2}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          m?.exceeded
                            ? 'bg-rose-500'
                            : m?.nearLimit
                            ? 'bg-amber-500'
                            : 'bg-[#6C3CE1]'
                        }`}
                        style={{ width: `${m?.percent ?? 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support Ticket Submission & History */}
          <div className="rounded-2xl bg-white p-6 border border-[#EDE5FF] shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0FF] text-[#6C3CE1]">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Priority Member Support
                </h3>
                <p className="text-xs text-slate-500">
                  Need help with billing or a career tool? Open a ticket.
                </p>
              </div>
            </div>

            {ticketToast && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
                {ticketToast}
              </div>
            )}

            <form onSubmit={handleCreateSupportTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Brief summary of your question..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#6C3CE1] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 bg-white"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing & Plan</option>
                    <option value="account">Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe how we can help..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-[#6C3CE1] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={ticketSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] py-2.5 text-xs font-semibold text-white cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{ticketSubmitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
              </button>
            </form>

            {tickets.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Your Support Tickets
                </p>
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl bg-[#FAF8FF] border border-[#EDE5FF] p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{t.subject}</span>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-[#6C3CE1]">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {t.messages?.length || 1} message(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
