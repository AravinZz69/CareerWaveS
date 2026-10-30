import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  User,
  Lock,
  Briefcase,
  GraduationCap,
  MapPin,
  Target,
  Plus,
  Loader2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Feature flag: Email OTP verification is disabled (kept intact in codebase, not removed)
export const ENABLE_EMAIL_OTP_VERIFICATION = false;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess: () => void;
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

const SUGGESTED_SKILLS = [
  'React',
  'TypeScript',
  'Python',
  'Node.js',
  'Next.js',
  'PyTorch',
  'LangChain / RAG',
  'SQL / PostgreSQL',
  'AWS / Cloud',
  'System Design',
  'Docker',
  'Java',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess,
}) => {
  const {
    sendEmailOtp,
    verifyEmailOtp,
    registerWithPassword,
    loginWithPassword,
    saveUserResume,
  } = useAuth();

  // Mode & Step state for Name/Email/Password + Onboarding flow
  const [authMode, setAuthMode] = useState<'signup' | 'login'>(
    initialMode === 'login' ? 'login' : 'signup'
  );
  const [signupStep, setSignupStep] = useState<'credentials' | 'onboarding'>('credentials');

  // Account credentials
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Onboarding profile questions
  const [title, setTitle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Early Career (1-3 yrs)');
  const [targetRole, setTargetRole] = useState('');
  const [careerTrack, setCareerTrack] = useState('Generative AI');
  const [educationOrCompany, setEducationOrCompany] = useState('');
  const [location, setLocation] = useState('Bengaluru, India');
  const [workPreference, setWorkPreference] = useState('Hybrid');
  const [careerGoal, setCareerGoal] = useState('Land a high-paying full-time role');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'React',
    'TypeScript',
    'Python',
  ]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [bio, setBio] = useState('');
  const [isAutoFillingOnboarding, setIsAutoFillingOnboarding] = useState(false);
  const [onboardingParsedResume, setOnboardingParsedResume] = useState<any | null>(null);
  const onboardingResumeInputRef = React.useRef<HTMLInputElement | null>(null);

  // Preserved Email OTP verification state (disabled by ENABLE_EMAIL_OTP_VERIFICATION = false)
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [otpPreview, setOtpPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode === 'login' ? 'login' : 'signup');
      setSignupStep('credentials');
      setStep('email');
      setOtpCode('');
      setError(null);
      setInfoMessage(null);
      setOtpPreview(null);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  // ============================================================================
  // Preserved Email OTP Handlers (Kept intact, disabled when flag is false)
  // ============================================================================
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await sendEmailOtp(trimmedEmail);
      if (result.error) {
        setError(result.error);
        if (result.cooldownSeconds) {
          setCooldown(result.cooldownSeconds);
        }
      } else {
        setStep('verify');
        setCooldown(result.cooldownSeconds || 60);
        setOtpPreview(result.otpPreview || null);
        setInfoMessage(`We sent a 6-digit one-time verification code to ${trimmedEmail}.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || submitting) return;
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);
    try {
      const result = await sendEmailOtp(email.trim().toLowerCase());
      if (result.error) {
        setError(result.error);
        if (result.cooldownSeconds) {
          setCooldown(result.cooldownSeconds);
        }
      } else {
        setCooldown(result.cooldownSeconds || 60);
        setOtpPreview(result.otpPreview || null);
        setInfoMessage('A fresh 6-digit verification code has been sent to your email.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = otpCode.replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await verifyEmailOtp(email.trim().toLowerCase(), cleanCode);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Name, Email & Password + Career Profile Onboarding Handlers
  // ============================================================================
  const handleCredentialsContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSignupStep('onboarding');
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = () => {
    const clean = customSkillInput.trim();
    if (!clean) return;
    if (!selectedSkills.includes(clean)) {
      setSelectedSkills((prev) => [...prev, clean]);
    }
    setCustomSkillInput('');
  };

  const handleOnboardingResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError(null);
    setInfoMessage(null);
    setIsAutoFillingOnboarding(true);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          fileBase64,
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
          fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          candidateEmail: email.trim().toLowerCase() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        setError(json.error || 'Could not extract details from this resume file.');
        return;
      }

      const parsed = json.data;
      const inf = json.inferredProfile || {};

      if (
        parsed.contact?.fullName &&
        parsed.contact.fullName !== 'Candidate' &&
        parsed.contact.fullName !== 'Guest Visitor'
      ) {
        setFullName(parsed.contact.fullName);
      }
      if (inf.title || parsed.experience?.[0]?.role) {
        setTitle(inf.title || parsed.experience[0].role);
      }
      if (inf.target_role || parsed.experience?.[0]?.role) {
        setTargetRole(inf.target_role || parsed.experience[0].role);
      }
      if (inf.experience_level) {
        setExperienceLevel(inf.experience_level);
      }
      if (inf.career_track) {
        setCareerTrack(inf.career_track);
      }
      if (inf.education_or_company) {
        setEducationOrCompany(inf.education_or_company);
      }
      if (parsed.contact?.location || inf.location) {
        setLocation(parsed.contact?.location || inf.location);
      }
      if (Array.isArray(inf.skills) && inf.skills.length > 0) {
        setSelectedSkills(inf.skills);
      }
      if (inf.bio || parsed.summary) {
        setBio(inf.bio || parsed.summary);
      }

      setOnboardingParsedResume({
        ...parsed,
        uploadedFileName: file.name,
        uploadedFileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        uploadedAt: new Date().toISOString(),
        rawTextPreview: json.rawExtractedText || rawText || parsed.rawTextPreview,
      });

      setInfoMessage(`Auto-filled all onboarding fields from "${file.name}"!`);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse resume for onboarding auto-fill.');
    } finally {
      setIsAutoFillingOnboarding(false);
    }
  };

  const handleCompleteSignupWithOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter your current role or headline.');
      return;
    }
    if (!targetRole.trim()) {
      setError('Please enter the target role you are aiming for.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerWithPassword({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        title: title.trim(),
        experience_level: experienceLevel,
        target_role: targetRole.trim(),
        career_track: careerTrack,
        education_or_company: educationOrCompany.trim(),
        location: location.trim() || 'India',
        work_preference: workPreference,
        career_goal: careerGoal,
        skills: selectedSkills,
        bio:
          bio.trim() ||
          `${title.trim()} targeting ${targetRole.trim()} roles (${experienceLevel}). Focused on ${careerTrack}.`,
      });

      if (result.error) {
        setError(result.error);
      } else {
        if (onboardingParsedResume) {
          await saveUserResume(onboardingParsedResume);
        }
        onSuccess();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginWithPassword(cleanEmail, password);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181028]/60 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className={`relative w-full ${
          !ENABLE_EMAIL_OTP_VERIFICATION && authMode === 'signup' && signupStep === 'onboarding'
            ? 'max-w-2xl'
            : 'max-w-md'
        } rounded-2xl bg-white p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(108,60,225,0.28)] border border-[#EDE5FF] max-h-[92vh] overflow-y-auto transition-all`}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-[#F5F0FF] hover:text-[#6C3CE1] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-5">
          <img
            src="/assets/aistudio/CareerWaves_CWS_Growth_Logo_2a4e39b3.png"
            alt="CareerWave Logo"
            className="h-12 w-auto object-contain"
          />
          <div className="border-l border-slate-200 pl-3">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {ENABLE_EMAIL_OTP_VERIFICATION
                ? 'Secure Access'
                : authMode === 'signup' && signupStep === 'onboarding'
                ? 'Step 2 of 2 • Career Onboarding'
                : 'Account & Profile Setup'}
            </span>
            <span className="block text-[11px] font-medium text-slate-400">
              {ENABLE_EMAIL_OTP_VERIFICATION
                ? 'Passwordless Email OTP'
                : 'Personalized AI Career Workspace'}
            </span>
          </div>
        </div>

        {/* ====================================================================
            DISABLED EMAIL OTP VERIFICATION FLOW (Kept intact, not removed)
           ==================================================================== */}
        {ENABLE_EMAIL_OTP_VERIFICATION ? (
          <>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-1.5">
              {step === 'email' ? 'Sign in to CareerWave' : 'Enter verification code'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {step === 'email'
                ? 'Enter your email address to receive a secure one-time sign-in code.'
                : `Enter the 6-digit code sent to ${email.trim().toLowerCase()}`}
            </p>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && !error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] text-white font-semibold py-3.5 px-5 text-sm shadow-lg shadow-[#6C3CE1]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{submitting ? 'Sending verification code...' : 'Send One-Time Code'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {otpPreview && (
                  <div className="rounded-xl bg-[#F5F0FF] border border-[#DDD0FF] p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#6C3CE1]" />
                      <span className="text-xs font-medium text-slate-700">
                        Your one-time code:{' '}
                        <strong className="font-mono text-sm font-bold text-[#6C3CE1] tracking-widest">
                          {otpPreview}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpCode(otpPreview)}
                      className="text-xs font-semibold text-[#6C3CE1] hover:underline cursor-pointer"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    6-Digit One-Time Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-center font-mono text-2xl font-bold tracking-[0.4em] text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || otpCode.length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] text-white font-semibold py-3.5 px-5 text-sm shadow-lg shadow-[#6C3CE1]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{submitting ? 'Verifying code...' : 'Verify & Sign In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtpCode('');
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Change email
                  </button>

                  <button
                    type="button"
                    disabled={cooldown > 0 || submitting}
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1.5 font-semibold text-[#6C3CE1] hover:text-[#5829C7] disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${submitting ? 'animate-spin' : ''}`} />
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          /* ====================================================================
             ACTIVE AUTH FLOW: Name, Email, Password + Onboarding Profile Questions
             ==================================================================== */
          <>
            {signupStep === 'credentials' && (
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setError(null);
                  }}
                  className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                  className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {authMode === 'login' ? (
              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                    Welcome Back
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mb-4">
                    Sign in with your email and password to access your career workspace.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] text-white font-semibold py-3.5 px-5 text-sm shadow-lg shadow-[#6C3CE1]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : signupStep === 'credentials' ? (
              /* SIGN UP STEP 1: Name, Email, Password */
              <form onSubmit={handleCredentialsContinue} className="space-y-4">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                    Create Your Account
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mb-4">
                    Enter your name, email, and password, then answer a few onboarding questions to build your career profile.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] text-white font-semibold py-3.5 px-5 text-sm shadow-lg shadow-[#6C3CE1]/25 transition-all cursor-pointer"
                >
                  <span>Continue to Onboarding Questions</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              /* SIGN UP STEP 2: Career Profile Onboarding Questions */
              <form onSubmit={handleCompleteSignupWithOnboarding} className="space-y-4">
                <input
                  ref={onboardingResumeInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleOnboardingResumeUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                      Build Your Career Profile
                    </h2>
                    <p className="text-xs text-slate-500">
                      Hi {fullName.split(' ')[0]}! Upload your resume to auto-fill or answer below.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isAutoFillingOnboarding}
                      onClick={() => onboardingResumeInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#6C3CE1]/10 hover:bg-[#6C3CE1]/15 border border-[#6C3CE1]/30 px-3 py-1.5 text-xs font-bold text-[#6C3CE1] cursor-pointer disabled:opacity-50"
                    >
                      {isAutoFillingOnboarding ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Parsing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload Resume to Auto-Fill</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupStep('credentials')}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>
                  </div>
                </div>

                {/* Q1 & Q2: Current Role & Target Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      1. Current Role / Headline *
                    </label>
                    <div className="relative">
                      <Briefcase className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Full Stack & AI Developer"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      2. Target Dream Role *
                    </label>
                    <div className="relative">
                      <Target className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Generative AI Engineer"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Q3 & Q4: Experience Level & Career Track */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      3. Experience Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none"
                    >
                      {EXPERIENCE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4. Primary Career Track
                    </label>
                    <select
                      value={careerTrack}
                      onChange={(e) => setCareerTrack(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none"
                    >
                      {CAREER_TRACKS.map((track) => (
                        <option key={track} value={track}>
                          {track}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Q5 & Q6: College/Company & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      5. University / Current Organization
                    </label>
                    <div className="relative">
                      <GraduationCap className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={educationOrCompany}
                        onChange={(e) => setEducationOrCompany(e.target.value)}
                        placeholder="e.g. IIT Bombay / NextGen Labs"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      6. Preferred Location
                    </label>
                    <div className="relative">
                      <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Bengaluru, India"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Q7 & Q8: Work Mode & Career Goal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      7. Preferred Work Mode
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {WORK_PREFERENCES.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setWorkPreference(mode)}
                          className={`rounded-lg py-2 text-xs font-semibold border transition-all cursor-pointer ${
                            workPreference === mode
                              ? 'bg-[#6C3CE1] text-white border-[#6C3CE1]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      8. Primary Career Goal
                    </label>
                    <select
                      value={careerGoal}
                      onChange={(e) => setCareerGoal(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none"
                    >
                      {CAREER_GOALS.map((goal) => (
                        <option key={goal} value={goal}>
                          {goal}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Q9: Top Technical Skills */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    9. Key Technical Skills (Select or add your top skills)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {SUGGESTED_SKILLS.map((skill) => {
                      const active = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all cursor-pointer ${
                            active
                              ? 'bg-[#6C3CE1] text-white border-[#6C3CE1]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#6C3CE1]/40'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                    {selectedSkills
                      .filter((s) => !SUGGESTED_SKILLS.includes(s))
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-[#6C3CE1] text-white border border-[#6C3CE1] cursor-pointer"
                        >
                          {skill} ×
                        </button>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSkill();
                        }
                      }}
                      placeholder="Add custom skill (e.g. Kubernetes, GraphQL)..."
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Q10: Short Bio / Career Summary */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    10. Professional Summary / Bio (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your background, projects, or what you're excited to build next..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 focus:border-[#6C3CE1] focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] text-white font-semibold py-3.5 px-5 text-sm shadow-lg shadow-[#6C3CE1]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account & Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Complete Profile & Launch Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-[#6C3CE1]" />
          <span>All onboarding data is saved directly to your User Profile</span>
        </div>
      </div>
    </div>
  );
};

