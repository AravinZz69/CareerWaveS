import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  Sparkles,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

export type OverlayMode = 'parse' | 'tailor' | 'linkedin';

export interface ResumeParsingOverlayProps {
  isOpen: boolean;
  mode?: OverlayMode;
  /**
   * Real milestone target percentage (0..100) driven by actual steps:
   * e.g., 10 = uploading, 28 = reading/extracting text, 58 = AI structuring, 85 = scoring, 100 = completed
   */
  targetMilestone: number;
  /**
   * True only when the underlying async operation has genuinely finished and succeeded.
   */
  isFinished: boolean;
  /**
   * Detected skills from the user's resume or job text. Falls back to intelligent defaults while extracting.
   */
  detectedSkills?: string[];
  /**
   * Optional document or target title shown subtly in the card header
   */
  documentTitle?: string;
  /**
   * Friendly error message if parsing/tailoring/optimizing failed
   */
  errorMessage?: string | null;
  /**
   * Called when user clicks Cancel
   */
  onCancel: () => void;
  /**
   * Called when user clicks Try Again in the error state
   */
  onRetry?: () => void;
  /**
   * Called after the 100% finish celebration and 400ms fade-out complete
   */
  onCompleteExit?: () => void;
}

const STAGES_BY_MODE: Record<OverlayMode, string[]> = {
  parse: [
    'Uploading your resume',
    'Reading the document',
    'Detecting sections',
    'Extracting contact details',
    'Finding skills',
    'Understanding experience',
    'Mapping projects',
    'Checking ATS compatibility',
    'Finalizing',
  ],
  tailor: [
    'Reading target job description',
    'Analyzing role requirements',
    'Detecting sections',
    'Matching core skills',
    'Aligning summary & keywords',
    'Rewriting experience bullets',
    'Mapping project impact',
    'Checking ATS compatibility',
    'Finalizing',
  ],
  linkedin: [
    'Reading profile & resume data',
    'Analyzing recruiter search intent',
    'Detecting sections',
    'Extracting core skills & keywords',
    'Crafting headline variations',
    'Writing high-impact About summary',
    'Quantifying experience bullets',
    'Computing recruiter visibility score',
    'Finalizing',
  ],
};

const TIPS_BY_MODE: Record<OverlayMode, string[]> = {
  parse: [
    'ATS systems prefer simple, single-column layouts',
    'Standard section headings like Experience and Education improve ATS parsing accuracy',
    'Quantified impact bullets increase recruiter interview callbacks by up to 40%',
    'Listing exact technical keywords from the job description boosts ATS ranking',
    'Clean typography and consistent date formats ensure zero data loss in enterprise screeners',
  ],
  tailor: [
    'ATS systems prefer simple, single-column layouts',
    'Mirroring exact phrasing from the job description helps pass automated keyword filters',
    'Google’s XYZ formula turns passive responsibilities into measurable achievements',
    'Recruiters spend an average of 6–8 seconds on the initial resume scan',
  ],
  linkedin: [
    'Profiles with keyword-rich headlines appear in up to 3x more recruiter searches',
    'First-person storytelling in your About section drives higher recruiter engagement',
    'Pinning top technical skills to each role strengthens LinkedIn search ranking',
    'ATS systems and recruiter tools reward clear, quantified outcome statements',
  ],
};

const DEFAULT_SKILLS = [
  'Python',
  'SQL',
  'TypeScript',
  'React',
  'Node.js',
  'AWS',
  'PostgreSQL',
  'Docker',
  'System Design',
  'REST APIs',
];

// Precomputed orbital positions around the centerpiece card (x, y offsets in px, plus mid-curve control offsets)
const ORBIT_SLOTS = [
  { x: -162, y: -110, midX: -95, midY: -135 },
  { x: 164, y: -102, midX: 110, midY: -130 },
  { x: -178, y: -24, midX: -120, midY: -45 },
  { x: 180, y: -16, midX: 125, midY: -35 },
  { x: -166, y: 66, midX: -115, midY: 45 },
  { x: 168, y: 72, midX: 115, midY: 50 },
  { x: -120, y: 142, midX: -75, midY: 115 },
  { x: 124, y: 144, midX: 80, midY: 118 },
  { x: -64, y: -162, midX: -35, midY: -130 },
  { x: 72, y: -160, midX: 40, midY: -128 },
];

// Faint ambient background particles (GPU transform/opacity only)
const AMBIENT_PARTICLES = [
  { id: 1, x: -210, y: -140, size: 6, delay: 0 },
  { id: 2, x: 220, y: -130, size: 8, delay: 0.6 },
  { id: 3, x: -240, y: 40, size: 5, delay: 1.2 },
  { id: 4, x: 235, y: 65, size: 7, delay: 0.3 },
  { id: 5, x: -150, y: 175, size: 6, delay: 0.9 },
  { id: 6, x: 165, y: 180, size: 5, delay: 1.5 },
];

/**
 * Extracts real skill keywords from raw resume text or structured skills
 */
export function extractSkillsFromTextOrResume(
  rawText?: string,
  structuredSkills?: {
    languages?: string[];
    frameworks?: string[];
    cloudAndDevOps?: string[];
    aiAndData?: string[];
  }
): string[] {
  const collected: string[] = [];
  if (structuredSkills) {
    const all = [
      ...(structuredSkills.languages || []),
      ...(structuredSkills.frameworks || []),
      ...(structuredSkills.cloudAndDevOps || []),
      ...(structuredSkills.aiAndData || []),
    ];
    for (const s of all) {
      const clean = String(s).trim();
      if (clean && !collected.includes(clean)) {
        collected.push(clean);
      }
    }
  }

  if (rawText && collected.length < 10) {
    const knownCandidates = [
      'Python',
      'SQL',
      'TypeScript',
      'JavaScript',
      'React',
      'Next.js',
      'Node.js',
      'FastAPI',
      'Java',
      'C++',
      'Go',
      'PostgreSQL',
      'MongoDB',
      'Redis',
      'AWS',
      'Docker',
      'Kubernetes',
      'GraphQL',
      'PyTorch',
      'TensorFlow',
      'LangChain',
      'Git',
      'Linux',
      'Tailwind',
      'Spring Boot',
      'Azure',
      'GCP',
    ];
    const lower = rawText.toLowerCase();
    for (const kw of knownCandidates) {
      if (lower.includes(kw.toLowerCase()) && !collected.includes(kw)) {
        collected.push(kw);
      }
      if (collected.length >= 10) break;
    }
  }

  if (collected.length === 0) {
    return DEFAULT_SKILLS.slice(0, 8);
  }
  return collected.slice(0, 10);
}

export const ResumeParsingOverlay: React.FC<ResumeParsingOverlayProps> = ({
  isOpen,
  mode = 'parse',
  targetMilestone,
  isFinished,
  detectedSkills,
  documentTitle,
  errorMessage,
  onCancel,
  onRetry,
  onCompleteExit,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const retryBtnRef = useRef<HTMLButtonElement>(null);

  // Smoothed display progress (0..100) that never jumps backward and creeps gently
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  // Celebratory finish state when progress hits 100%
  const [isCelebratingFinish, setIsCelebratingFinish] = useState<boolean>(false);
  // Controls internal visibility so we can run the 400ms fade-out cleanly
  const [internalVisible, setInternalVisible] = useState<boolean>(false);
  // Rotating tip index
  const [tipIndex, setTipIndex] = useState<number>(0);

  const openTimestampRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const targetRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);
  const finishTriggeredRef = useRef<boolean>(false);
  const onCompleteExitRef = useRef(onCompleteExit);

  useEffect(() => {
    onCompleteExitRef.current = onCompleteExit;
  }, [onCompleteExit]);

  useEffect(() => {
    targetRef.current = Math.max(targetRef.current, Math.min(99, targetMilestone));
  }, [targetMilestone]);

  useEffect(() => {
    finishedRef.current = isFinished;
  }, [isFinished]);

  const stages = STAGES_BY_MODE[mode] || STAGES_BY_MODE.parse;
  const tips = TIPS_BY_MODE[mode] || TIPS_BY_MODE.parse;

  const activeSkills = useMemo(() => {
    const list =
      detectedSkills && detectedSkills.length > 0 ? detectedSkills : DEFAULT_SKILLS;
    return list.slice(0, 10);
  }, [detectedSkills]);

  // Lock background scroll & initialize state when opened
  useEffect(() => {
    if (isOpen) {
      setInternalVisible(true);
      setIsCelebratingFinish(false);
      setDisplayProgress(2);
      progressRef.current = 2;
      targetRef.current = Math.max(12, Math.min(95, targetMilestone || 15));
      finishedRef.current = isFinished;
      finishTriggeredRef.current = false;
      openTimestampRef.current = performance.now();

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus primary interactive control for accessibility
      const focusTimer = window.setTimeout(() => {
        if (errorMessage && retryBtnRef.current) {
          retryBtnRef.current.focus();
        } else if (cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        }
      }, 60);

      return () => {
        document.body.style.overflow = prevOverflow;
        window.clearTimeout(focusTimer);
      };
    } else {
      setInternalVisible(false);
    }
  }, [isOpen]);

  // Focus trap inside overlay (Tab / Shift+Tab & Escape)
  useEffect(() => {
    if (!internalVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [internalVisible, onCancel]);

  // Rotate helpful tips every 3.4 seconds
  useEffect(() => {
    if (!internalVisible || errorMessage) return;
    const interval = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3400);
    return () => window.clearInterval(interval);
  }, [internalVisible, errorMessage, tips.length]);

  // Buttery-smooth 60fps progress loop using requestAnimationFrame
  // Enforces minimum 2000ms display time so the overlay never flashes
  useEffect(() => {
    if (!internalVisible || errorMessage) return;

    let rafId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(64, now - lastTime) / 1000;
      lastTime = now;

      const elapsedMs = now - openTimestampRef.current;
      const minDurationPassed = elapsedMs >= 2000;
      const current = progressRef.current;

      let nextVal = current;

      if (finishedRef.current && minDurationPassed) {
        // Smoothly glide to 100% once both parsing is done AND minimum 2s has elapsed
        const remaining = 100 - current;
        nextVal = current + Math.max(1.4, remaining * 0.18);
        if (nextVal >= 99.6) {
          nextVal = 100;
        }
      } else if (finishedRef.current && !minDurationPassed) {
        // Parsing finished early (< 2s): pace smoothly toward 94% over the 2s window
        const timeRatio = Math.min(1, elapsedMs / 1950);
        const pacedTarget = 12 + timeRatio * 84;
        if (pacedTarget > current) {
          nextVal = current + (pacedTarget - current) * 0.14;
        } else {
          nextVal = Math.min(96, current + dt * 6);
        }
      } else {
        // Still waiting on real parsing steps:
        // Slowly creep the target milestone forward (up to 92%) so it never looks frozen
        const maxCreep = 92;
        if (targetRef.current < maxCreep) {
          targetRef.current = Math.min(maxCreep, targetRef.current + dt * 4.2);
        }
        const diff = targetRef.current - current;
        if (diff > 0) {
          nextVal = current + Math.max(dt * 2.2, diff * 0.065);
        }
      }

      // Never allow backward jumps
      const clamped = Math.min(100, Math.max(current, nextVal));
      progressRef.current = clamped;
      setDisplayProgress(clamped);

      if (clamped >= 100 && !finishTriggeredRef.current) {
        finishTriggeredRef.current = true;
        setIsCelebratingFinish(true);
        // Hold brief completion pulse + chip fly-in, then trigger exit
        window.setTimeout(() => {
          setInternalVisible(false);
          window.setTimeout(() => {
            onCompleteExitRef.current?.();
          }, 400);
        }, 520);
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [internalVisible, errorMessage]);

  // Compute current active stage index (0 .. stages.length - 1) from displayProgress
  const currentStageIndex = useMemo(() => {
    if (displayProgress >= 99) return stages.length - 1;
    const idx = Math.floor((displayProgress / 96) * stages.length);
    return Math.max(0, Math.min(stages.length - 1, idx));
  }, [displayProgress, stages.length]);

  // Which document sections inside the centerpiece card have lit up into real structure
  // 1. Header block, 2. Summary, 3. Experience, 4. Projects, 5. Education
  const litSections = useMemo(() => {
    return {
      header: displayProgress >= 12,
      summary: displayProgress >= 28,
      experience: displayProgress >= 46,
      projects: displayProgress >= 66,
      education: displayProgress >= 82,
    };
  }, [displayProgress]);

  // How many skill chips have popped out into the orbiting cloud
  const visibleChipCount = useMemo(() => {
    if (displayProgress < 32) return 0;
    if (isCelebratingFinish || displayProgress >= 95) return activeSkills.length;
    const ratio = (displayProgress - 32) / 58;
    return Math.min(
      activeSkills.length,
      Math.max(1, Math.floor(ratio * activeSkills.length) + 1)
    );
  }, [displayProgress, isCelebratingFinish, activeSkills.length]);

  // SVG Circular Progress Ring Geometry
  const ringRadius = 196;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset =
    ringCircumference - (Math.min(100, Math.max(0, displayProgress)) / 100) * ringCircumference;

  const modeHeading =
    mode === 'tailor'
      ? 'Tailoring Your Resume to Role'
      : mode === 'linkedin'
      ? 'Optimizing Your LinkedIn Profile'
      : 'Structuring & Scoring Your Resume';

  return (
    <AnimatePresence>
      {internalVisible && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={modeHeading}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: internalVisible ? 0.3 : 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden px-4 py-6 sm:py-8 select-none"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.84)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Subtle Drifting White-and-Lavender / Violet Ambient Gradient Backdrop (GPU transform & opacity only) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <motion.div
              animate={
                prefersReducedMotion
                  ? { opacity: 0.65 }
                  : {
                      x: [-28, 32, -28],
                      y: [-18, 24, -18],
                      scale: [1, 1.06, 1],
                    }
              }
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-32 left-1/2 -ml-[340px] h-[680px] w-[680px] rounded-full opacity-70"
              style={{
                background:
                  'radial-gradient(circle, rgba(244,240,255,0.95) 0%, rgba(108,60,225,0.13) 48%, rgba(255,255,255,0) 72%)',
              }}
            />
            <motion.div
              animate={
                prefersReducedMotion
                  ? { opacity: 0.5 }
                  : {
                      x: [24, -30, 24],
                      y: [20, -22, 20],
                      scale: [1.04, 0.96, 1.04],
                    }
              }
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-40 left-1/2 -ml-[260px] h-[560px] w-[560px] rounded-full opacity-60"
              style={{
                background:
                  'radial-gradient(circle, rgba(175,137,246,0.18) 0%, rgba(244,240,255,0.8) 52%, rgba(255,255,255,0) 75%)',
              }}
            />
          </div>

          {/* Screen-reader live status announcement */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {errorMessage
              ? `Error: ${errorMessage}`
              : isCelebratingFinish
              ? `Resume parsed. ${activeSkills.length} skills found.`
              : `${stages[currentStageIndex]} — ${Math.round(displayProgress)} percent complete`}
          </div>

          {/* Top Header Strip */}
          <div className="relative z-10 flex w-full max-w-2xl items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#F4F0FF] border border-[#6C3CE1]/20 text-[#6C3CE1] shadow-2xs">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-widest text-[#6C3CE1]">
                  CareerWave ATS Studio
                </span>
                <h2 className="font-serif-heading text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {modeHeading}
                </h2>
              </div>
            </div>

            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-2xs transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6C3CE1]/30 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          </div>

          {/* Main Centerpiece Area or Friendly Error State */}
          {errorMessage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="relative z-10 my-auto w-full max-w-md rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-soft-lg space-y-5"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                <AlertCircle className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif-heading text-xl font-bold text-slate-900">
                  We couldn&apos;t process this document
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 text-left text-[11px] text-slate-500 border border-slate-200/80 space-y-1">
                <p className="font-semibold text-slate-700">Quick troubleshooting tips:</p>
                <p>• Ensure the PDF contains selectable text rather than a scanned image.</p>
                <p>• Try uploading a DOCX or TXT version, or paste your resume text directly.</p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                {onRetry && (
                  <button
                    ref={retryBtnRef}
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#6C3CE1] px-5 py-2.5 text-xs font-semibold text-white shadow-soft hover:bg-[#5B2FD1] transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Try again</span>
                  </button>
                )}
              </div>
            </motion.div>
          ) : prefersReducedMotion ? (
            /* Reduced Motion Mode: Calm gentle fade card + clean horizontal progress bar */
            <div className="relative z-10 my-auto w-full max-w-md rounded-3xl border border-[#6C3CE1]/20 bg-white/95 p-8 text-center shadow-soft-lg space-y-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F0FF] text-[#6C3CE1] border border-[#6C3CE1]/20">
                <FileCheck2 className="h-7 w-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif-heading text-xl font-bold text-slate-900">
                  {isCelebratingFinish ? 'Resume parsed' : stages[currentStageIndex]}
                </h3>
                <p className="text-xs text-slate-500 font-medium tabular-nums">
                  {Math.round(displayProgress)}% complete
                </p>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F4F0FF] border border-[#6C3CE1]/15">
                <div
                  className="h-full rounded-full bg-[#6C3CE1] transition-transform duration-200 ease-out origin-left"
                  style={{
                    transform: `scaleX(${Math.min(1, Math.max(0, displayProgress / 100))})`,
                  }}
                />
              </div>

              {visibleChipCount > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {activeSkills.slice(0, visibleChipCount).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-[#F4F0FF] px-2.5 py-1 text-[11px] font-semibold text-[#6C3CE1] border border-[#6C3CE1]/20"
                    >
                      <Check className="h-3 w-3" />
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-500 italic">{tips[tipIndex]}</p>
            </div>
          ) : (
            /* Full 60fps GPU-Accelerated Centerpiece Animation */
            <div className="relative z-10 my-auto flex flex-col items-center justify-center">
              {/* Responsive stage container that scales cleanly on mobile portrait */}
              <div className="relative flex h-[380px] w-[380px] sm:h-[430px] sm:w-[430px] items-center justify-center scale-[0.78] xs:scale-[0.86] sm:scale-95 md:scale-100 transition-transform">
                {/* Slow Pulsing Depth Ring Behind Card */}
                <motion.div
                  animate={
                    isCelebratingFinish
                      ? { scale: [1, 1.16, 1.05], opacity: [0.45, 0.75, 0] }
                      : { scale: [0.94, 1.06, 0.94], opacity: [0.22, 0.42, 0.22] }
                  }
                  transition={{
                    duration: isCelebratingFinish ? 0.5 : 4.2,
                    repeat: isCelebratingFinish ? 0 : Infinity,
                    ease: 'easeInOut',
                  }}
                  className="pointer-events-none absolute h-[340px] w-[340px] rounded-full border border-[#6C3CE1]/25 bg-[#F4F0FF]/40"
                />

                {/* Secondary Outer Halo Ring */}
                <motion.div
                  animate={{
                    scale: [1.02, 0.95, 1.02],
                    opacity: [0.12, 0.25, 0.12],
                  }}
                  transition={{
                    duration: 5.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="pointer-events-none absolute h-[418px] w-[418px] rounded-full border border-[#6C3CE1]/15"
                />

                {/* Faint Floating Ambient Depth Particles */}
                {AMBIENT_PARTICLES.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ x: p.x, y: p.y, opacity: 0.2 }}
                    animate={{
                      x: [p.x, p.x + (p.id % 2 === 0 ? 10 : -10), p.x],
                      y: [p.y, p.y - 14, p.y],
                      opacity: [0.2, 0.55, 0.2],
                    }}
                    transition={{
                      duration: 4.5 + p.id * 0.4,
                      delay: p.delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="pointer-events-none absolute rounded-full bg-[#6C3CE1]/40"
                    style={{ width: p.size, height: p.size }}
                  />
                ))}

                {/* Circular Progress Ring Around the Card */}
                <motion.svg
                  viewBox="0 0 420 420"
                  animate={
                    isCelebratingFinish
                      ? { scale: [1, 1.045, 0.98], opacity: [1, 1, 0.85] }
                      : { scale: 1, opacity: 1 }
                  }
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="pointer-events-none absolute h-[412px] w-[412px] -rotate-90"
                >
                  <defs>
                    <linearGradient id="cwProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6C3CE1" />
                      <stop offset="55%" stopColor="#905cf0" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                  {/* Track circle */}
                  <circle
                    cx="210"
                    cy="210"
                    r={ringRadius}
                    fill="none"
                    stroke="rgba(108, 60, 225, 0.10)"
                    strokeWidth="3.5"
                  />
                  {/* Smoothly filling progress arc */}
                  <circle
                    cx="210"
                    cy="210"
                    r={ringRadius}
                    fill="none"
                    stroke="url(#cwProgressGrad)"
                    strokeWidth={isCelebratingFinish ? '5' : '4'}
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </motion.svg>

                {/* Orbiting Skill Chips Popping Out of Document Along Curved Paths */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <AnimatePresence>
                    {activeSkills.slice(0, visibleChipCount).map((skill, idx) => {
                      const slot = ORBIT_SLOTS[idx % ORBIT_SLOTS.length];
                      // When celebrating finish, chips fly neatly into their final aligned badge cluster
                      const finalX = isCelebratingFinish ? slot.x * 0.42 : slot.x;
                      const finalY = isCelebratingFinish ? slot.y * 0.42 : slot.y;

                      return (
                        <motion.div
                          key={skill}
                          initial={{ opacity: 0, scale: 0.35, x: 0, y: 12 }}
                          animate={{
                            opacity: isCelebratingFinish ? [1, 1, 0] : 1,
                            scale: isCelebratingFinish ? [1.05, 0.75] : 1,
                            x: isCelebratingFinish
                              ? finalX
                              : [0, slot.midX, slot.x, slot.x + (idx % 2 === 0 ? 5 : -5), slot.x],
                            y: isCelebratingFinish
                              ? finalY
                              : [12, slot.midY, slot.y, slot.y + (idx % 2 === 0 ? -6 : 6), slot.y],
                          }}
                          transition={
                            isCelebratingFinish
                              ? {
                                  duration: 0.42,
                                  ease: [0.22, 1, 0.36, 1],
                                }
                              : {
                                  opacity: { duration: 0.28 },
                                  scale: {
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 18,
                                  },
                                  x: {
                                    duration: 3.6,
                                    times: [0, 0.18, 0.38, 0.7, 1],
                                    ease: 'easeInOut',
                                  },
                                  y: {
                                    duration: 3.6,
                                    times: [0, 0.18, 0.38, 0.7, 1],
                                    ease: 'easeInOut',
                                  },
                                }
                          }
                          className="absolute flex items-center gap-1.5 rounded-full border border-[#6C3CE1]/25 bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow-soft"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-[#6C3CE1]" />
                          <span>{skill}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Floating Resume Document Card in the Center */}
                <motion.div
                  animate={
                    isCelebratingFinish
                      ? {
                          y: 0,
                          scale: [1, 1.04, 0.92],
                          opacity: [1, 1, 0.92],
                        }
                      : {
                          y: [-5, 5, -5],
                          scale: 1,
                          opacity: 1,
                        }
                  }
                  transition={
                    isCelebratingFinish
                      ? { duration: 0.46, ease: [0.22, 1, 0.36, 1] }
                      : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }
                  }
                  className={`relative h-[284px] w-[224px] overflow-hidden rounded-2xl border bg-white p-4 transition-colors duration-300 ${
                    isCelebratingFinish
                      ? 'border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.28)]'
                      : 'border-[#6C3CE1]/25 shadow-soft-lg'
                  }`}
                >
                  {/* Subtle Shimmer Overlay on Skeleton Lines */}
                  {!isCelebratingFinish && (
                    <motion.div
                      animate={{ x: [-240, 240] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="pointer-events-none absolute inset-y-0 w-28 -skew-x-12 opacity-40"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(244,240,255,0.9) 50%, rgba(255,255,255,0) 100%)',
                      }}
                    />
                  )}

                  {/* Glowing Purple Scan Beam Sweeping Smoothly Down the Page Again and Again */}
                  {!isCelebratingFinish && (
                    <motion.div
                      animate={{ y: [-24, 276] }}
                      transition={{
                        duration: 2.1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(108,60,225,0) 0%, rgba(108,60,225,0.18) 75%, rgba(108,60,225,0.65) 100%)',
                        borderBottom: '2px solid #6C3CE1',
                      }}
                    />
                  )}

                  {/* Document Structure Sections Inside Card */}
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    {/* 1. HEADER BLOCK */}
                    <div
                      className={`rounded-xl p-2 transition-colors duration-300 ${
                        litSections.header
                          ? 'bg-[#F4F0FF]/90 border border-[#6C3CE1]/20'
                          : 'bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors duration-300 shrink-0 ${
                              litSections.header
                                ? 'bg-[#6C3CE1] text-white'
                                : 'bg-slate-200 text-transparent'
                            }`}
                          >
                            CW
                          </div>
                          <div className="space-y-1 min-w-0">
                            {litSections.header ? (
                              <p className="truncate text-[10px] font-bold text-slate-900">
                                {documentTitle || 'Candidate Profile'}
                              </p>
                            ) : (
                              <div className="h-2.5 w-24 rounded bg-slate-200" />
                            )}
                            <div className="flex items-center gap-1">
                              <span
                                className={`h-1.5 w-10 rounded ${
                                  litSections.header ? 'bg-[#6C3CE1]/50' : 'bg-slate-200'
                                }`}
                              />
                              <span
                                className={`h-1.5 w-8 rounded ${
                                  litSections.header ? 'bg-[#6C3CE1]/35' : 'bg-slate-200'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                        {litSections.header && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#6C3CE1] shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* 2. SUMMARY BLOCK */}
                    <div
                      className={`rounded-lg px-2.5 py-1.5 transition-colors duration-300 ${
                        litSections.summary
                          ? 'bg-[#FAF8FF] border border-[#6C3CE1]/15'
                          : 'bg-slate-50/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[8px] font-bold uppercase tracking-wider ${
                            litSections.summary ? 'text-[#6C3CE1]' : 'text-slate-400'
                          }`}
                        >
                          Summary
                        </span>
                        {litSections.summary && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#6C3CE1]" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`h-1.5 w-full rounded transition-colors duration-300 ${
                            litSections.summary ? 'bg-slate-700/70' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`h-1.5 w-4/5 rounded transition-colors duration-300 ${
                            litSections.summary ? 'bg-slate-500/60' : 'bg-slate-200'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 3. EXPERIENCE BLOCK */}
                    <div
                      className={`rounded-lg px-2.5 py-1.5 transition-colors duration-300 ${
                        litSections.experience
                          ? 'bg-[#FAF8FF] border border-[#6C3CE1]/15'
                          : 'bg-slate-50/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[8px] font-bold uppercase tracking-wider ${
                            litSections.experience ? 'text-[#6C3CE1]' : 'text-slate-400'
                          }`}
                        >
                          Experience
                        </span>
                        {litSections.experience && (
                          <span className="text-[8px] font-semibold text-[#6C3CE1]">XYZ</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div
                            className={`h-1.5 w-20 rounded ${
                              litSections.experience ? 'bg-slate-800/80' : 'bg-slate-200'
                            }`}
                          />
                          <div
                            className={`h-1.5 w-8 rounded ${
                              litSections.experience ? 'bg-[#6C3CE1]/50' : 'bg-slate-200'
                            }`}
                          />
                        </div>
                        <div
                          className={`h-1.5 w-11/12 rounded ${
                            litSections.experience ? 'bg-slate-600/60' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`h-1.5 w-3/4 rounded ${
                            litSections.experience ? 'bg-slate-500/50' : 'bg-slate-200'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 4. PROJECTS BLOCK */}
                    <div
                      className={`rounded-lg px-2.5 py-1.5 transition-colors duration-300 ${
                        litSections.projects
                          ? 'bg-[#FAF8FF] border border-[#6C3CE1]/15'
                          : 'bg-slate-50/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[8px] font-bold uppercase tracking-wider ${
                            litSections.projects ? 'text-[#6C3CE1]' : 'text-slate-400'
                          }`}
                        >
                          Projects & Skills
                        </span>
                        {litSections.projects && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[0, 1, 2].map((chipIdx) => (
                          <span
                            key={chipIdx}
                            className={`h-2.5 w-11 rounded-full transition-colors duration-300 ${
                              litSections.projects
                                ? 'bg-[#6C3CE1]/20 border border-[#6C3CE1]/30'
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* 5. EDUCATION BLOCK */}
                    <div
                      className={`rounded-lg px-2.5 py-1.5 transition-colors duration-300 ${
                        litSections.education
                          ? 'bg-emerald-50/80 border border-emerald-200'
                          : 'bg-slate-50/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[8px] font-bold uppercase tracking-wider ${
                            litSections.education ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          Education & ATS Check
                        </span>
                        {litSections.education && (
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        )}
                      </div>
                      <div
                        className={`mt-1 h-1.5 w-4/5 rounded ${
                          litSections.education ? 'bg-emerald-600/60' : 'bg-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Bottom Status Ticker, Completed Stage Pills & Rotating Tip */}
          {!errorMessage && (
            <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center space-y-3">
              {/* Percentage + Single-Line Crossfade/Slide Status Ticker */}
              <div className="flex flex-col items-center space-y-1.5">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F4F0FF] px-3 py-0.5 text-xs font-bold text-[#6C3CE1] border border-[#6C3CE1]/20 tabular-nums">
                  <span>{Math.round(displayProgress)}%</span>
                  {isCelebratingFinish && (
                    <span className="text-emerald-600 font-semibold">• Complete</span>
                  )}
                </div>

                <div className="relative h-8 w-full min-w-[290px] sm:min-w-[380px] flex items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isCelebratingFinish ? 'done' : stages[currentStageIndex]}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                      className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-slate-900"
                    >
                      {currentStageIndex > 0 || isCelebratingFinish ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-[#6C3CE1] shrink-0" />
                      )}
                      <span>
                        {isCelebratingFinish
                          ? `Resume parsed · ${activeSkills.length} skills found`
                          : stages[currentStageIndex]}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Completed Stage Micro-Checks Strip */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-lg px-2">
                {stages.map((stageLabel, idx) => {
                  const isDone = idx < currentStageIndex || isCelebratingFinish;
                  const isCurrent = idx === currentStageIndex && !isCelebratingFinish;
                  if (!isDone && !isCurrent) return null;
                  return (
                    <motion.span
                      key={stageLabel}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        isDone
                          ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200'
                          : 'bg-[#F4F0FF] text-[#6C3CE1] border-[#6C3CE1]/25'
                      }`}
                    >
                      {isDone && <Check className="h-2.5 w-2.5 stroke-[2.5]" />}
                      <span>{stageLabel}</span>
                    </motion.span>
                  );
                })}
              </div>

              {/* Rotating Tip Below Ticker */}
              <div className="h-5 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={tipIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-xs text-slate-500"
                  >
                    Tip: &ldquo;{tips[tipIndex]}&rdquo;
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
