import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StructuredResumeData,
  ResumeSectionId,
  AtsScoreDeduction,
} from '../../types/resume';
import {
  DEFAULT_SKILLS_TAXONOMY,
  SkillTaxonomyEntry,
  SkillCategoryKey,
  resolveCanonicalSkill,
} from '../../lib/skillsTaxonomy';
import {
  computeGeneralAtsScore,
  evaluateBulletQuality,
  applyOneClickFix,
  STANDARD_SECTION_ORDER,
} from '../../lib/atsScoringEngine';
import {
  Plus,
  Trash2,
  User,
  Briefcase,
  Code,
  GraduationCap,
  Award,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GripVertical,
  Undo2,
  Redo2,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Wand2,
  ShieldCheck,
  RefreshCw,
  Layers,
} from 'lucide-react';

interface ResumeEditorFormProps {
  resumeData: StructuredResumeData;
  onChange: (updated: StructuredResumeData) => void;
  getAuthHeaders?: () => Record<string, string>;
  onAutoFillFromProfile?: () => void;
}

type StepId =
  | 'contact'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications';

interface StepConfig {
  id: StepId;
  label: string;
  shortDesc: string;
  icon: React.ElementType;
  accentHex: string;
  bgActive: string;
  bgLight: string;
  textAccent: string;
  borderAccent: string;
  ringAccent: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'contact',
    label: 'Contact',
    shortDesc: 'Identity, email, phone & professional links',
    icon: User,
    accentHex: '#7C3AED',
    bgActive: 'bg-violet-600',
    bgLight: 'bg-violet-50',
    textAccent: 'text-violet-700',
    borderAccent: 'border-violet-300',
    ringAccent: 'focus:border-violet-600',
  },
  {
    id: 'summary',
    label: 'Summary',
    shortDesc: 'Executive narrative & core positioning',
    icon: FileText,
    accentHex: '#2563EB',
    bgActive: 'bg-blue-600',
    bgLight: 'bg-blue-50',
    textAccent: 'text-blue-700',
    borderAccent: 'border-blue-300',
    ringAccent: 'focus:border-blue-600',
  },
  {
    id: 'skills',
    label: 'Skills',
    shortDesc: 'Taxonomy-verified technical & domain skills',
    icon: Code,
    accentHex: '#059669',
    bgActive: 'bg-emerald-600',
    bgLight: 'bg-emerald-50',
    textAccent: 'text-emerald-700',
    borderAccent: 'border-emerald-300',
    ringAccent: 'focus:border-emerald-600',
  },
  {
    id: 'experience',
    label: 'Experience',
    shortDesc: 'Roles, standardized dates & quantified bullets',
    icon: Briefcase,
    accentHex: '#EA580C',
    bgActive: 'bg-orange-600',
    bgLight: 'bg-orange-50',
    textAccent: 'text-orange-700',
    borderAccent: 'border-orange-300',
    ringAccent: 'focus:border-orange-600',
  },
  {
    id: 'projects',
    label: 'Projects',
    shortDesc: 'Architecture builds, tech stack & links',
    icon: Layers,
    accentHex: '#DB2777',
    bgActive: 'bg-pink-600',
    bgLight: 'bg-pink-50',
    textAccent: 'text-pink-700',
    borderAccent: 'border-pink-300',
    ringAccent: 'focus:border-pink-600',
  },
  {
    id: 'education',
    label: 'Education',
    shortDesc: 'University degrees, major & GPA',
    icon: GraduationCap,
    accentHex: '#0D9488',
    bgActive: 'bg-teal-600',
    bgLight: 'bg-teal-50',
    textAccent: 'text-teal-700',
    borderAccent: 'border-teal-300',
    ringAccent: 'focus:border-teal-600',
  },
  {
    id: 'certifications',
    label: 'Certifications',
    shortDesc: 'Verified cloud & domain credentials',
    icon: Award,
    accentHex: '#4F46E5',
    bgActive: 'bg-indigo-600',
    bgLight: 'bg-indigo-50',
    textAccent: 'text-indigo-700',
    borderAccent: 'border-indigo-300',
    ringAccent: 'focus:border-indigo-600',
  },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 22 }, (_, i) => String(2027 - i));

interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  valid?: boolean;
  errorHint?: string;
  accentRingClass?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  valid,
  errorHint,
  accentRingClass = 'focus:border-violet-600',
}) => {
  const hasValue = Boolean(value && value.trim().length > 0);
  const showError = hasValue && valid === false && Boolean(errorHint);
  const showValid = hasValue && valid === true;

  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${label.replace(/\s*\*$/, '').toLowerCase()}...`}
          className={`w-full rounded-xl border bg-slate-50/70 px-3.5 py-2.5 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none ${
            showError
              ? 'border-rose-400 focus:border-rose-600 bg-rose-50/20'
              : showValid
              ? 'border-emerald-300 focus:border-emerald-600'
              : `border-slate-200 ${accentRingClass}`
          }`}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {showValid && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {showError && <AlertCircle className="h-4 w-4 text-rose-500" />}
        </div>
      </div>
      {showError && (
        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 pl-1">
          {errorHint}
        </p>
      )}
    </div>
  );
};

interface MonthYearPickerProps {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (formatted: string) => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  label,
  value,
  disabled,
  onChange,
}) => {
  const parts = String(value || 'Jan 2024').trim().split(/\s+/);
  const currentMonth = MONTHS.includes(parts[0]) ? parts[0] : 'Jan';
  const currentYear = /^\d{4}$/.test(parts[1] || parts[0]) ? parts[1] || parts[0] : '2024';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </span>
      {disabled ? (
        <div className="py-1 text-xs font-bold text-emerald-700">Present (Active Role)</div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={currentMonth}
            onChange={(e) => onChange(`${e.target.value} ${currentYear}`)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => onChange(`${currentMonth} ${e.target.value}`)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export const ResumeEditorForm: React.FC<ResumeEditorFormProps> = ({
  resumeData,
  onChange,
  getAuthHeaders,
  onAutoFillFromProfile,
}) => {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const activeStep = STEPS[activeStepIdx] || STEPS[0];

  // Undo / Redo History Stack
  const [history, setHistory] = useState<StructuredResumeData[]>([resumeData]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const isInternalHistoryMove = useRef(false);

  // Autosave indicator state
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const saveTimerRef = useRef<number | null>(null);

  // Taxonomy catalog (fetched from server + fallback to 320+ seeded entries)
  const [taxonomy, setTaxonomy] = useState<SkillTaxonomyEntry[]>(DEFAULT_SKILLS_TAXONOMY);
  const [skillQuery, setSkillQuery] = useState<Record<SkillCategoryKey, string>>({
    languages: '',
    frameworks: '',
    cloudAndDevOps: '',
    aiAndData: '',
  });
  const [focusedSkillCat, setFocusedSkillCat] = useState<SkillCategoryKey | null>(null);

  // Local draft string for comma-separated Project Tech Stack so typing commas/spaces never gets stripped mid-keystroke
  const [techStackDrafts, setTechStackDrafts] = useState<Record<string, string>>({});

  // Bullet AI Improvement loading state
  const [improvingBulletKey, setImprovingBulletKey] = useState<string | null>(null);

  // Drag state for bullets & section order
  const [draggedBulletIdx, setDraggedBulletIdx] = useState<{
    section: 'exp' | 'prj';
    parentIdx: number;
    bulletIdx: number;
  } | null>(null);
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/taxonomy/skills')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.taxonomy) && d.taxonomy.length > 0) {
          setTaxonomy(d.taxonomy);
        }
      })
      .catch(() => {});
  }, []);

  // Push new changes to Undo/Redo stack and trigger autosave indicator
  const commitChange = (updated: StructuredResumeData) => {
    const scoreBreakdown = computeGeneralAtsScore(updated);
    const withUpdatedScore: StructuredResumeData = {
      ...updated,
      atsScore: scoreBreakdown.totalScore,
    };

    setSaveState('saving');
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      setSaveState('saved');
    }, 550);

    if (!isInternalHistoryMove.current) {
      const nextHistory = [...history.slice(0, historyIdx + 1), withUpdatedScore].slice(-30);
      setHistory(nextHistory);
      setHistoryIdx(nextHistory.length - 1);
    }
    onChange(withUpdatedScore);
  };

  const handleUndo = () => {
    if (historyIdx <= 0) return;
    isInternalHistoryMove.current = true;
    const prev = history[historyIdx - 1];
    setHistoryIdx(historyIdx - 1);
    onChange(prev);
    window.setTimeout(() => {
      isInternalHistoryMove.current = false;
    }, 30);
  };

  const handleRedo = () => {
    if (historyIdx >= history.length - 1) return;
    isInternalHistoryMove.current = true;
    const next = history[historyIdx + 1];
    setHistoryIdx(historyIdx + 1);
    onChange(next);
    window.setTimeout(() => {
      isInternalHistoryMove.current = false;
    }, 30);
  };

  // Keyboard shortcuts for Undo / Redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Live deterministic ATS Score & Breakdown
  const liveScoreBreakdown = useMemo(
    () => computeGeneralAtsScore(resumeData),
    [resumeData]
  );

  const contact = resumeData?.contact || {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
  };
  const skills = resumeData?.skills || {
    languages: [],
    frameworks: [],
    cloudAndDevOps: [],
    aiAndData: [],
  };
  const experience = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
  const projects = Array.isArray(resumeData?.projects) ? resumeData.projects : [];
  const education = Array.isArray(resumeData?.education) ? resumeData.education : [];
  const certifications = Array.isArray(resumeData?.certifications) ? resumeData.certifications : [];
  const sectionOrder: ResumeSectionId[] =
    Array.isArray(resumeData?.sectionOrder) && resumeData.sectionOrder.length > 0
      ? resumeData.sectionOrder
      : STANDARD_SECTION_ORDER;

  // Section Reorder Helpers
  const moveSectionOrder = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sectionOrder.length) return;
    const next = [...sectionOrder];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    commitChange({ ...resumeData, sectionOrder: next });
  };

  // Contact Helpers
  const updateContact = (field: keyof typeof contact, value: string) => {
    commitChange({
      ...resumeData,
      contact: {
        ...contact,
        [field]: value,
      },
    });
  };

  // Skill Chip Helpers
  const addSkillToCategory = (category: SkillCategoryKey, rawName: string) => {
    const resolved = resolveCanonicalSkill(rawName, taxonomy);
    const nameToAdd = resolved.canonicalName || rawName.trim();
    if (!nameToAdd) return;
    const targetCategory = resolved.category || category;
    const existing = skills[targetCategory] || [];
    if (existing.some((s) => s.toLowerCase() === nameToAdd.toLowerCase())) {
      setSkillQuery((prev) => ({ ...prev, [category]: '' }));
      return;
    }
    commitChange({
      ...resumeData,
      skills: {
        ...skills,
        [targetCategory]: [...existing, nameToAdd],
      },
    });
    setSkillQuery((prev) => ({ ...prev, [category]: '' }));
  };

  const removeSkillFromCategory = (category: SkillCategoryKey, skillToRemove: string) => {
    commitChange({
      ...resumeData,
      skills: {
        ...skills,
        [category]: (skills[category] || []).filter((s) => s !== skillToRemove),
      },
    });
  };

  // Experience Helpers
  const addExperienceEntry = () => {
    const next = [
      ...experience,
      {
        id: `exp-${Date.now()}`,
        role: 'Software Engineer',
        company: 'Technology Organization',
        location: contact.location || 'Bengaluru, India',
        startDate: 'Jan 2024',
        endDate: 'Present',
        currentlyWorking: true,
        duration: 'Jan 2024 - Present',
        bullets: [
          'Engineered scalable production services and REST APIs, reducing P95 response latency by 35%.',
          'Implemented automated unit and integration test suites achieving 92% code coverage across 10+ microservices.',
        ],
      },
    ];
    commitChange({ ...resumeData, experience: next });
  };

  const updateExperienceDates = (
    expIndex: number,
    startDate: string,
    endDate: string,
    currentlyWorking: boolean
  ) => {
    const effectiveEnd = currentlyWorking ? 'Present' : endDate || 'Dec 2024';
    const duration = `${startDate || 'Jan 2024'} - ${effectiveEnd}`;
    const next = experience.map((item, idx) =>
      idx === expIndex
        ? {
            ...item,
            startDate,
            endDate: effectiveEnd,
            currentlyWorking,
            duration,
          }
        : item
    );
    commitChange({ ...resumeData, experience: next });
  };

  const reorderExperienceBullet = (expIndex: number, fromIdx: number, toIdx: number) => {
    const exp = experience[expIndex];
    if (!exp || toIdx < 0 || toIdx >= exp.bullets.length) return;
    const bullets = [...exp.bullets];
    const [moved] = bullets.splice(fromIdx, 1);
    bullets.splice(toIdx, 0, moved);
    const next = experience.map((item, idx) => (idx === expIndex ? { ...item, bullets } : item));
    commitChange({ ...resumeData, experience: next });
  };

  const handleImproveBulletWithAi = async (
    section: 'exp' | 'prj',
    parentIdx: number,
    bulletIdx: number,
    currentBullet: string
  ) => {
    const key = `${section}-${parentIdx}-${bulletIdx}`;
    setImprovingBulletKey(key);
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : { 'Content-Type': 'application/json' };
      const res = await fetch('/api/resume/improve-bullet', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bullet: currentBullet,
          resume: resumeData,
        }),
      });
      const json = await res.json();
      const improvedText = json?.improvedBullet || currentBullet;
      if (section === 'exp') {
        const next = experience.map((item, idx) => {
          if (idx !== parentIdx) return item;
          const bullets = [...(item.bullets || [])];
          bullets[bulletIdx] = improvedText;
          return { ...item, bullets };
        });
        commitChange({ ...resumeData, experience: next });
      } else {
        const next = projects.map((item, idx) => {
          if (idx !== parentIdx) return item;
          const bullets = [...(item.bullets || [])];
          bullets[bulletIdx] = improvedText;
          return { ...item, bullets };
        });
        commitChange({ ...resumeData, projects: next });
      }
    } catch {
      // Fallback deterministic XYZ upgrade
      const upgraded = applyOneClickFix(resumeData, {
        id: 'manual',
        category: 'contentQuality',
        pointsLost: 2,
        reason: '',
        fixable: true,
        fixType: 'strengthen-action-verbs',
      });
      commitChange(upgraded);
    } finally {
      setImprovingBulletKey(null);
    }
  };

  const handleAddMetricToBullet = (
    section: 'exp' | 'prj',
    parentIdx: number,
    bulletIdx: number,
    currentBullet: string
  ) => {
    const ev = evaluateBulletQuality(currentBullet);
    const metricSnippets = [
      ', reducing P95 latency by 38% across 40K+ daily requests',
      ', increasing throughput by 2.4x while maintaining 99.95% uptime',
      ', cutting manual processing overhead by 12 hours/week',
      ', boosting automated test coverage to 94%',
    ];
    const snippet = metricSnippets[(parentIdx + bulletIdx) % metricSnippets.length];
    const updatedBullet = ev.hasMetric
      ? currentBullet
      : `${currentBullet.trim().replace(/\.$/, '')}${snippet}.`;

    if (section === 'exp') {
      const next = experience.map((item, idx) => {
        if (idx !== parentIdx) return item;
        const bullets = [...(item.bullets || [])];
        bullets[bulletIdx] = updatedBullet;
        return { ...item, bullets };
      });
      commitChange({ ...resumeData, experience: next });
    } else {
      const next = projects.map((item, idx) => {
        if (idx !== parentIdx) return item;
        const bullets = [...(item.bullets || [])];
        bullets[bulletIdx] = updatedBullet;
        return { ...item, bullets };
      });
      commitChange({ ...resumeData, projects: next });
    }
  };

  const progressPercent = Math.round(((activeStepIdx + 1) / STEPS.length) * 100);

  // SVG Ring calculation for Sticky Side Panel
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset =
    ringCircumference - (liveScoreBreakdown.totalScore / 100) * ringCircumference;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* ====================================================================
          LEFT 8 COLUMNS: COLORFUL INTERACTIVE HORIZONTAL STEPPER & STEP CARD
      ==================================================================== */}
      <div className="xl:col-span-8 space-y-5">
        {/* Top Toolbar: Undo/Redo, Section Order Drag Strip & Autosave Indicator */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIdx <= 0}
                title="Undo (Ctrl+Z)"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIdx >= history.length - 1}
                title="Redo (Ctrl+Y)"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
              >
                <Redo2 className="h-3.5 w-3.5" />
                <span>Redo</span>
              </button>
            </div>

            {/* Live Autosave Status */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              {saveState === 'saving' ? (
                <span className="inline-flex items-center gap-1.5 text-amber-600">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Saving changes...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Saved to canonical JSON
                </span>
              )}
            </div>
          </div>

          {/* Section Drag-to-Reorder Bar */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Section Order (Drag or Click Arrows to Reorder Document Hierarchy)
              </span>
              {JSON.stringify(sectionOrder) !== JSON.stringify(STANDARD_SECTION_ORDER) && (
                <button
                  type="button"
                  onClick={() =>
                    commitChange({ ...resumeData, sectionOrder: [...STANDARD_SECTION_ORDER] })
                  }
                  className="text-[11px] font-semibold text-violet-600 hover:underline cursor-pointer"
                >
                  Reset Standard ATS Order
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sectionOrder.map((secId, idx) => (
                <div
                  key={secId}
                  draggable
                  onDragStart={() => setDraggedSectionIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedSectionIdx !== null && draggedSectionIdx !== idx) {
                      moveSectionOrder(draggedSectionIdx, idx);
                    }
                    setDraggedSectionIdx(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-white transition-all cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-3 w-3 text-slate-400" />
                  <span className="capitalize">
                    {idx + 1}. {secId}
                  </span>
                  <div className="flex items-center gap-0.5 ml-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveSectionOrder(idx, idx - 1)}
                        className="p-0.5 hover:text-slate-950 text-slate-400 cursor-pointer"
                        title="Move Left"
                      >
                        ←
                      </button>
                    )}
                    {idx < sectionOrder.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveSectionOrder(idx, idx + 1)}
                        className="p-0.5 hover:text-slate-950 text-slate-400 cursor-pointer"
                        title="Move Right"
                      >
                        →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal Colorful Stepper + Progress Bar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Step {activeStepIdx + 1} of {STEPS.length}:{' '}
              <span className={activeStep.textAccent}>{activeStep.label}</span>
            </span>
            <span className="text-slate-500 font-medium">{activeStep.shortDesc}</span>
          </div>

          {/* Smooth Animated Progress Bar */}
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out ${activeStep.bgActive}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Stepper Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === activeStepIdx;
              const isPast = idx < activeStepIdx;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepIdx(idx)}
                  className={`flex items-center justify-center sm:justify-start gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                    isActive
                      ? `${step.bgActive} text-white border-transparent shadow-xs`
                      : isPast
                      ? `${step.bgLight} ${step.textAccent} ${step.borderAccent}`
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================================
            ACTIVE STEP CARD
        ================================================================== */}
        <div
          className={`rounded-2xl bg-white border-2 ${activeStep.borderAccent} p-5 sm:p-6 shadow-xs space-y-6 transition-all`}
        >
          {/* Step Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl ${activeStep.bgActive} text-white flex items-center justify-center shadow-2xs`}
              >
                <activeStep.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  {activeStep.label}
                </h3>
                <p className="text-xs text-slate-500">{activeStep.shortDesc}</p>
              </div>
            </div>

            {onAutoFillFromProfile && (
              <button
                type="button"
                onClick={onAutoFillFromProfile}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-800 px-3 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                <span>Sync Missing Fields from Profile</span>
              </button>
            )}
          </div>

          {/* STEP 1: CONTACT (VIOLET) */}
          {activeStep.id === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="Full Name *"
                  placeholder="e.g. Aarav Sharma"
                  value={contact.fullName || ''}
                  onChange={(v) => updateContact('fullName', v)}
                  valid={(contact.fullName || '').trim().length >= 3}
                  errorHint="Enter your full first and last name"
                  accentRingClass="focus:border-violet-600"
                />
                <FloatingInput
                  label="Email Address *"
                  type="email"
                  value={contact.email || ''}
                  onChange={(v) => updateContact('email', v)}
                  valid={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((contact.email || '').trim())}
                  errorHint="Enter a valid email address (e.g. name@domain.com)"
                  accentRingClass="focus:border-violet-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="Phone Number *"
                  value={contact.phone || ''}
                  onChange={(v) => updateContact('phone', v)}
                  valid={(contact.phone || '').replace(/\D/g, '').length >= 10}
                  errorHint="Include country code and 10-digit number"
                  accentRingClass="focus:border-violet-600"
                />
                <FloatingInput
                  label="City & Country Location *"
                  value={contact.location || ''}
                  onChange={(v) => updateContact('location', v)}
                  valid={(contact.location || '').trim().length >= 3}
                  errorHint="Add city and country (e.g. Bengaluru, India)"
                  accentRingClass="focus:border-violet-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FloatingInput
                  label="LinkedIn URL *"
                  value={contact.linkedin || ''}
                  onChange={(v) => updateContact('linkedin', v)}
                  valid={(contact.linkedin || '').toLowerCase().includes('linkedin.com/')}
                  errorHint="Format: linkedin.com/in/yourprofile"
                  accentRingClass="focus:border-violet-600"
                />
                <FloatingInput
                  label="GitHub URL"
                  value={contact.github || ''}
                  onChange={(v) => updateContact('github', v)}
                  valid={
                    !(contact.github || '').trim() ||
                    (contact.github || '').toLowerCase().includes('github.com/')
                  }
                  errorHint="Format: github.com/username"
                  accentRingClass="focus:border-violet-600"
                />
                <FloatingInput
                  label="Portfolio / Website"
                  value={contact.portfolio || ''}
                  onChange={(v) => updateContact('portfolio', v)}
                  valid={Boolean((contact.portfolio || '').trim().includes('.'))}
                  accentRingClass="focus:border-violet-600"
                />
              </div>
            </div>
          )}

          {/* STEP 2: SUMMARY (BLUE) */}
          {activeStep.id === 'summary' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Executive Summary (Ideal: 50–320 characters, no first-person pronouns)
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {(resumeData.summary || '').length} chars ·{' '}
                  {(resumeData.summary || '').trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <textarea
                rows={5}
                value={resumeData.summary || ''}
                onChange={(e) => commitChange({ ...resumeData, summary: e.target.value })}
                placeholder="Results-driven Software & AI Systems Engineer with hands-on experience architecting..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-900 leading-relaxed focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  {(resumeData.summary || '').trim().length >= 50 ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Optimal summary length verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-600 font-semibold">
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                      Add at least {Math.max(0, 50 - (resumeData.summary || '').trim().length)} more characters
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const fixed = applyOneClickFix(resumeData, {
                      id: 'fill-sum',
                      category: 'completeness',
                      pointsLost: 3,
                      reason: '',
                      fixable: true,
                      fixType: 'fill-summary',
                    });
                    commitChange(fixed);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>Generate ATS-Optimized Summary from Skills</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SKILLS WITH TAXONOMY AUTOCOMPLETE & SUGGESTED CHIPS (GREEN) */}
          {activeStep.id === 'skills' && (
            <div className="space-y-6">
              {(
                [
                  {
                    key: 'languages' as SkillCategoryKey,
                    title: 'Programming Languages',
                    suggested: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'Go', 'Java', 'C++', 'Rust'],
                  },
                  {
                    key: 'frameworks' as SkillCategoryKey,
                    title: 'Frameworks, Libraries & Architecture',
                    suggested: ['React', 'Next.js', 'Node.js', 'FastAPI', 'Spring Boot', 'Tailwind CSS', 'REST APIs', 'Microservices'],
                  },
                  {
                    key: 'cloudAndDevOps' as SkillCategoryKey,
                    title: 'Cloud, Databases & DevOps',
                    suggested: ['PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Redis', 'Terraform', 'CI/CD', 'Git'],
                  },
                  {
                    key: 'aiAndData' as SkillCategoryKey,
                    title: 'AI, LLM, Data Science & Business Intelligence',
                    suggested: ['LangChain', 'LangGraph', 'RAG', 'PyTorch', 'Vector Databases', 'Machine Learning', 'Apache Spark', 'Tableau'],
                  },
                ]
              ).map((cat) => {
                const currentList = skills[cat.key] || [];
                const query = skillQuery[cat.key] || '';
                const matchingSuggestions = query.trim()
                  ? taxonomy
                      .filter(
                        (t) =>
                          (t.canonicalName.toLowerCase().includes(query.toLowerCase()) ||
                            t.aliases.some((a) => a.toLowerCase().includes(query.toLowerCase()))) &&
                          !currentList.some(
                            (existing) => existing.toLowerCase() === t.canonicalName.toLowerCase()
                          )
                      )
                      .slice(0, 8)
                  : [];

                const unaddedQuickSuggestions = cat.suggested.filter(
                  (s) => !currentList.some((ex) => ex.toLowerCase() === s.toLowerCase())
                );

                return (
                  <div
                    key={cat.key}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900">{cat.title}</label>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {currentList.length} canonical skill(s)
                      </span>
                    </div>

                    {/* Active Editable Skill Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {currentList.map((sk) => (
                        <span
                          key={sk}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3 py-1 text-xs font-semibold shadow-2xs transition-transform hover:scale-[1.02]"
                        >
                          <span>{sk}</span>
                          <button
                            type="button"
                            onClick={() => removeSkillFromCategory(cat.key, sk)}
                            className="rounded-full hover:bg-white/20 p-0.5 text-white/90 hover:text-white cursor-pointer"
                            aria-label={`Remove ${sk}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {currentList.length === 0 && (
                        <span className="text-xs text-slate-400 italic py-1">
                          No skills in this category yet. Click a suggestion below or type to search the 320+ skill taxonomy.
                        </span>
                      )}
                    </div>

                    {/* Autocomplete Input from 320+ skills_taxonomy */}
                    <div className="relative">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={query}
                          onFocus={() => setFocusedSkillCat(cat.key)}
                          onBlur={() => window.setTimeout(() => setFocusedSkillCat(null), 180)}
                          onChange={(e) =>
                            setSkillQuery((prev) => ({ ...prev, [cat.key]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && query.trim()) {
                              e.preventDefault();
                              addSkillToCategory(
                                cat.key,
                                matchingSuggestions[0]?.canonicalName || query.trim()
                              );
                            }
                          }}
                          placeholder="Type skill or alias (e.g. k8s → Kubernetes, golang → Go, psql → PostgreSQL)..."
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (query.trim()) {
                              addSkillToCategory(cat.key, query.trim());
                            }
                          }}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Taxonomy Autocomplete Dropdown */}
                      {focusedSkillCat === cat.key && matchingSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl max-h-52 overflow-y-auto">
                          {matchingSuggestions.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addSkillToCategory(entry.category, entry.canonicalName);
                              }}
                              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-emerald-50 text-left cursor-pointer"
                            >
                              <div>
                                <span className="font-bold text-slate-900">
                                  {entry.canonicalName}
                                </span>
                                {entry.aliases.length > 0 && (
                                  <span className="ml-2 text-[11px] text-slate-400">
                                    Aliases: {entry.aliases.slice(0, 3).join(', ')}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold uppercase text-emerald-700">
                                + Add ({entry.category})
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Clickable Suggested Chips ("+ Python") */}
                    {unaddedQuickSuggestions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                          Quick Add:
                        </span>
                        {unaddedQuickSuggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => addSkillToCategory(cat.key, sug)}
                            className="rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
                          >
                            + {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 4: EXPERIENCE WITH MONTH-YEAR PICKERS & BULLET QUALITY CARDS (ORANGE) */}
          {activeStep.id === 'experience' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Work Experience & Internships ({experience.length})
                </span>
                <button
                  type="button"
                  onClick={addExperienceEntry}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Experience Role</span>
                </button>
              </div>

              {experience.map((exp, eIdx) => {
                const durationParts = (exp.duration || 'Jan 2024 - Present').split(/\s*-\s*/);
                const startVal = exp.startDate || durationParts[0] || 'Jan 2024';
                const endVal = exp.endDate || durationParts[1] || 'Present';
                const isCurrent =
                  typeof exp.currentlyWorking === 'boolean'
                    ? exp.currentlyWorking
                    : /present/i.test(endVal);

                return (
                  <div
                    key={exp.id || eIdx}
                    className="rounded-2xl border border-orange-200 bg-orange-50/20 p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-orange-700">
                        Role #{eIdx + 1} · {exp.role || 'Role'} at {exp.company || 'Company'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = experience.filter((_, idx) => idx !== eIdx);
                          commitChange({ ...resumeData, experience: next });
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Role</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <FloatingInput
                        label="Job Title *"
                        value={exp.role || ''}
                        onChange={(val) => {
                          const next = experience.map((item, idx) =>
                            idx === eIdx ? { ...item, role: val } : item
                          );
                          commitChange({ ...resumeData, experience: next });
                        }}
                        valid={(exp.role || '').trim().length >= 2}
                        accentRingClass="focus:border-orange-600"
                      />
                      <FloatingInput
                        label="Company / Organization *"
                        value={exp.company || ''}
                        onChange={(val) => {
                          const next = experience.map((item, idx) =>
                            idx === eIdx ? { ...item, company: val } : item
                          );
                          commitChange({ ...resumeData, experience: next });
                        }}
                        valid={(exp.company || '').trim().length >= 2}
                        accentRingClass="focus:border-orange-600"
                      />
                      <FloatingInput
                        label="Location"
                        value={exp.location || ''}
                        onChange={(val) => {
                          const next = experience.map((item, idx) =>
                            idx === eIdx ? { ...item, location: val } : item
                          );
                          commitChange({ ...resumeData, experience: next });
                        }}
                        valid={Boolean((exp.location || '').trim())}
                        accentRingClass="focus:border-orange-600"
                      />
                    </div>

                    {/* Month-Year Pickers + "Currently working here" Toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <MonthYearPicker
                        label="Start Date (MMM YYYY)"
                        value={startVal}
                        onChange={(newStart) =>
                          updateExperienceDates(eIdx, newStart, endVal, isCurrent)
                        }
                      />
                      <MonthYearPicker
                        label="End Date (MMM YYYY)"
                        value={isCurrent ? 'Present' : endVal}
                        disabled={isCurrent}
                        onChange={(newEnd) =>
                          updateExperienceDates(eIdx, startVal, newEnd, false)
                        }
                      />
                      <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-bold text-slate-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isCurrent}
                          onChange={(e) =>
                            updateExperienceDates(
                              eIdx,
                              startVal,
                              e.target.checked ? 'Present' : 'Dec 2024',
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 rounded accent-orange-600 cursor-pointer"
                        />
                        <span>Currently working here</span>
                      </label>
                    </div>

                    {/* Interactive Bullet Cards with Drag Handle, Counters, Quality Badge & AI Buttons */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Experience Bullets (Drag to Reorder · Action Verb + Metric)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = experience.map((item, idx) =>
                              idx === eIdx
                                ? {
                                    ...item,
                                    bullets: [
                                      ...(item.bullets || []),
                                      'Architected high-throughput microservice endpoints, reducing API response time by 32%.',
                                    ],
                                  }
                                : item
                            );
                            commitChange({ ...resumeData, experience: next });
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:underline cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Bullet Card
                        </button>
                      </div>

                      {(exp.bullets || []).map((bullet, bIdx) => {
                        const quality = evaluateBulletQuality(bullet);
                        const isImproving = improvingBulletKey === `exp-${eIdx}-${bIdx}`;
                        const badgeColors =
                          quality.badge === 'green'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : quality.badge === 'amber'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200';

                        return (
                          <div
                            key={bIdx}
                            draggable
                            onDragStart={() =>
                              setDraggedBulletIdx({
                                section: 'exp',
                                parentIdx: eIdx,
                                bulletIdx: bIdx,
                              })
                            }
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (
                                draggedBulletIdx &&
                                draggedBulletIdx.section === 'exp' &&
                                draggedBulletIdx.parentIdx === eIdx &&
                                draggedBulletIdx.bulletIdx !== bIdx
                              ) {
                                reorderExperienceBullet(
                                  eIdx,
                                  draggedBulletIdx.bulletIdx,
                                  bIdx
                                );
                              }
                              setDraggedBulletIdx(null);
                            }}
                            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5 transition-all hover:border-orange-300"
                          >
                            {/* Top Strip: Drag Handle, Quality Badge, Word/Char Counter */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-0.5"
                                  title="Drag to reorder bullet"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </span>
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    disabled={bIdx === 0}
                                    onClick={() => reorderExperienceBullet(eIdx, bIdx, bIdx - 1)}
                                    className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                    title="Move Bullet Up"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={bIdx === exp.bullets.length - 1}
                                    onClick={() => reorderExperienceBullet(eIdx, bIdx, bIdx + 1)}
                                    className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                    title="Move Bullet Down"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </button>
                                </div>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${badgeColors}`}
                                >
                                  {quality.badge === 'green' ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <AlertCircle className="h-3 w-3" />
                                  )}
                                  {quality.badgeLabel}
                                </span>
                              </div>

                              <span className="text-[11px] font-mono text-slate-400">
                                {quality.wordCount} words · {quality.charCount} chars
                              </span>
                            </div>

                            {/* Textarea */}
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => {
                                const next = experience.map((item, idx) => {
                                  if (idx !== eIdx) return item;
                                  const bullets = [...(item.bullets || [])];
                                  bullets[bIdx] = e.target.value;
                                  return { ...item, bullets };
                                });
                                commitChange({ ...resumeData, experience: next });
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 leading-relaxed focus:bg-white focus:border-orange-500 focus:outline-none"
                            />

                            {/* Bottom Strip: Hint + Action Buttons (Improve with AI, Add metric, Delete) */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                              <span className="text-[11px] text-slate-500">{quality.hint}</span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isImproving}
                                  onClick={() =>
                                    handleImproveBulletWithAi('exp', eIdx, bIdx, bullet)
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  <span>{isImproving ? 'Improving...' : 'Improve with AI'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddMetricToBullet('exp', eIdx, bIdx, bullet)
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  <TrendingUp className="h-3 w-3" />
                                  <span>Add metric</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = experience.map((item, idx) =>
                                      idx === eIdx
                                        ? {
                                            ...item,
                                            bullets: item.bullets.filter((_, i) => i !== bIdx),
                                          }
                                        : item
                                    );
                                    commitChange({ ...resumeData, experience: next });
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-2 py-1 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                                  title="Delete bullet"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 5: PROJECTS (PINK) */}
          {activeStep.id === 'projects' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Technical & Portfolio Projects ({projects.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = [
                      ...projects,
                      {
                        id: `prj-${Date.now()}`,
                        title: 'Autonomous AI Workflow Platform',
                        role: 'Lead Developer',
                        techStack: ['TypeScript', 'React', 'FastAPI', 'PostgreSQL'],
                        link: 'github.com/username/project',
                        bullets: [
                          'Architected a full-stack application with role-based access control, reducing query latency by 40%.',
                        ],
                      },
                    ];
                    commitChange({ ...resumeData, projects: next });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white px-3.5 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {projects.map((prj, pIdx) => (
                <div
                  key={prj.id || pIdx}
                  className="rounded-2xl border border-pink-200 bg-pink-50/20 p-4 sm:p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-pink-100 pb-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-pink-700">
                      Project #{pIdx + 1} · {prj.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = projects.filter((_, i) => i !== pIdx);
                        commitChange({ ...resumeData, projects: next });
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FloatingInput
                      label="Project Title *"
                      placeholder="e.g. Autonomous AI Workflow Platform"
                      value={prj.title || ''}
                      onChange={(val) => {
                        const next = projects.map((item, idx) =>
                          idx === pIdx ? { ...item, title: val } : item
                        );
                        commitChange({ ...resumeData, projects: next });
                      }}
                      valid={(prj.title || '').trim().length >= 3}
                      accentRingClass="focus:border-pink-600"
                    />
                    <FloatingInput
                      label="Tech Stack (comma-separated)"
                      placeholder="e.g. React, TypeScript, FastAPI, PostgreSQL"
                      value={
                        techStackDrafts[prj.id || `prj-${pIdx}`] !== undefined
                          ? techStackDrafts[prj.id || `prj-${pIdx}`]
                          : (prj.techStack || []).join(', ')
                      }
                      onChange={(val) => {
                        const draftKey = prj.id || `prj-${pIdx}`;
                        setTechStackDrafts((prev) => ({ ...prev, [draftKey]: val }));
                        const parsedStack = val
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const next = projects.map((item, idx) =>
                          idx === pIdx
                            ? {
                                ...item,
                                techStack: parsedStack,
                              }
                            : item
                        );
                        commitChange({ ...resumeData, projects: next });
                      }}
                      valid={(prj.techStack || []).length >= 1}
                      accentRingClass="focus:border-pink-600"
                    />
                    <FloatingInput
                      label="Repository / Live Link"
                      placeholder="e.g. github.com/username/project"
                      value={prj.link || ''}
                      onChange={(val) => {
                        const next = projects.map((item, idx) =>
                          idx === pIdx ? { ...item, link: val } : item
                        );
                        commitChange({ ...resumeData, projects: next });
                      }}
                      valid={Boolean((prj.link || '').trim())}
                      accentRingClass="focus:border-pink-600"
                    />
                  </div>

                  <div className="space-y-2.5">
                    {(prj.bullets || []).map((b, bIdx) => {
                      const quality = evaluateBulletQuality(b);
                      const isImproving = improvingBulletKey === `prj-${pIdx}-${bIdx}`;
                      return (
                        <div
                          key={bIdx}
                          className="rounded-xl border border-slate-200 bg-white p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span
                              className={`font-bold px-2 py-0.5 rounded border ${
                                quality.badge === 'green'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {quality.badgeLabel}
                            </span>
                            <span className="font-mono text-slate-400">
                              {quality.wordCount} words · {quality.charCount} chars
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={b}
                            onChange={(e) => {
                              const next = projects.map((item, idx) => {
                                if (idx !== pIdx) return item;
                                const bullets = [...(item.bullets || [])];
                                bullets[bIdx] = e.target.value;
                                return { ...item, bullets };
                              });
                              commitChange({ ...resumeData, projects: next });
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 p-2 text-xs text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isImproving}
                              onClick={() => handleImproveBulletWithAi('prj', pIdx, bIdx, b)}
                              className="rounded-lg bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-800 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                            >
                              {isImproving ? 'Improving...' : 'Improve with AI'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddMetricToBullet('prj', pIdx, bIdx, b)}
                              className="rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                            >
                              Add metric
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = projects.map((item, idx) =>
                                  idx === pIdx
                                    ? {
                                        ...item,
                                        bullets: item.bullets.filter((_, i) => i !== bIdx),
                                      }
                                    : item
                                );
                                commitChange({ ...resumeData, projects: next });
                              }}
                              className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-2 py-1 text-[11px] font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        const next = projects.map((item, idx) =>
                          idx === pIdx
                            ? {
                                ...item,
                                bullets: [
                                  ...(item.bullets || []),
                                  'Implemented automated testing and responsive dashboard interfaces.',
                                ],
                              }
                            : item
                        );
                        commitChange({ ...resumeData, projects: next });
                      }}
                      className="text-xs font-bold text-pink-700 hover:underline cursor-pointer"
                    >
                      + Add Project Bullet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 6: EDUCATION (TEAL) */}
          {activeStep.id === 'education' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Academic Credentials ({education.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = [
                      ...education,
                      {
                        id: `edu-${Date.now()}`,
                        school: 'Institute of Technology',
                        degree: 'Bachelor of Technology',
                        field: 'Computer Science & Engineering',
                        year: '2020 - 2024',
                        gpa: '8.8 / 10',
                      },
                    ];
                    commitChange({ ...resumeData, education: next });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Education
                </button>
              </div>

              {education.map((edu, edIdx) => (
                <div
                  key={edu.id || edIdx}
                  className="rounded-2xl border border-teal-200 bg-teal-50/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
                      Degree #{edIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = education.filter((_, i) => i !== edIdx);
                        commitChange({ ...resumeData, education: next });
                      }}
                      className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FloatingInput
                      label="University / Institution *"
                      value={edu.school || ''}
                      onChange={(val) => {
                        const next = education.map((item, idx) =>
                          idx === edIdx ? { ...item, school: val } : item
                        );
                        commitChange({ ...resumeData, education: next });
                      }}
                      valid={(edu.school || '').trim().length >= 3}
                      accentRingClass="focus:border-teal-600"
                    />
                    <FloatingInput
                      label="Degree *"
                      value={edu.degree || ''}
                      onChange={(val) => {
                        const next = education.map((item, idx) =>
                          idx === edIdx ? { ...item, degree: val } : item
                        );
                        commitChange({ ...resumeData, education: next });
                      }}
                      valid={(edu.degree || '').trim().length >= 2}
                      accentRingClass="focus:border-teal-600"
                    />
                    <FloatingInput
                      label="Field of Study / Major *"
                      value={edu.field || ''}
                      onChange={(val) => {
                        const next = education.map((item, idx) =>
                          idx === edIdx ? { ...item, field: val } : item
                        );
                        commitChange({ ...resumeData, education: next });
                      }}
                      valid={(edu.field || '').trim().length >= 2}
                      accentRingClass="focus:border-teal-600"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <FloatingInput
                        label="Graduation Years"
                        value={edu.year || ''}
                        onChange={(val) => {
                          const next = education.map((item, idx) =>
                            idx === edIdx ? { ...item, year: val } : item
                          );
                          commitChange({ ...resumeData, education: next });
                        }}
                        valid={Boolean((edu.year || '').trim())}
                        accentRingClass="focus:border-teal-600"
                      />
                      <FloatingInput
                        label="GPA / CGPA"
                        value={edu.gpa || ''}
                        onChange={(val) => {
                          const next = education.map((item, idx) =>
                            idx === edIdx ? { ...item, gpa: val } : item
                          );
                          commitChange({ ...resumeData, education: next });
                        }}
                        valid={Boolean((edu.gpa || '').trim())}
                        accentRingClass="focus:border-teal-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 7: CERTIFICATIONS (INDIGO) */}
          {activeStep.id === 'certifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Verified Certifications ({certifications.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = [
                      ...certifications,
                      {
                        id: `cert-${Date.now()}`,
                        name: 'AWS Certified Solutions Architect – Associate',
                        issuer: 'Amazon Web Services',
                        year: '2024',
                      },
                    ];
                    commitChange({ ...resumeData, certifications: next });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Certification
                </button>
              </div>

              {certifications.map((cert, cIdx) => (
                <div
                  key={cert.id || cIdx}
                  className="rounded-2xl border border-indigo-200 bg-indigo-50/20 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
                >
                  <FloatingInput
                    label="Certification Name *"
                    value={cert.name || ''}
                    onChange={(val) => {
                      const next = certifications.map((item, idx) =>
                        idx === cIdx ? { ...item, name: val } : item
                      );
                      commitChange({ ...resumeData, certifications: next });
                    }}
                    valid={(cert.name || '').trim().length >= 3}
                    accentRingClass="focus:border-indigo-600"
                  />
                  <FloatingInput
                    label="Issuing Organization *"
                    value={cert.issuer || ''}
                    onChange={(val) => {
                      const next = certifications.map((item, idx) =>
                        idx === cIdx ? { ...item, issuer: val } : item
                      );
                      commitChange({ ...resumeData, certifications: next });
                    }}
                    valid={(cert.issuer || '').trim().length >= 2}
                    accentRingClass="focus:border-indigo-600"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <FloatingInput
                        label="Year"
                        value={cert.year || ''}
                        onChange={(val) => {
                          const next = certifications.map((item, idx) =>
                            idx === cIdx ? { ...item, year: val } : item
                          );
                          commitChange({ ...resumeData, certifications: next });
                        }}
                        valid={Boolean((cert.year || '').trim())}
                        accentRingClass="focus:border-indigo-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = certifications.filter((_, i) => i !== cIdx);
                        commitChange({ ...resumeData, certifications: next });
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step Footer Navigation (Back / Next Buttons) */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={activeStepIdx === 0}
              onClick={() => setActiveStepIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <span className="text-[11px] font-semibold text-slate-400">
              Step {activeStepIdx + 1} of {STEPS.length}
            </span>

            <button
              type="button"
              disabled={activeStepIdx === STEPS.length - 1}
              onClick={() => setActiveStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
              className={`inline-flex items-center gap-1.5 rounded-xl ${activeStep.bgActive} text-white px-4 py-2 text-xs font-bold disabled:opacity-40 transition-all active:scale-95 cursor-pointer shadow-2xs`}
            >
              <span>Next Step</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          RIGHT 4 COLUMNS: STICKY LIVE ATS SCORE RING, TOP 3 FIXES & COMPLETENESS
      ==================================================================== */}
      <div className="xl:col-span-4 xl:sticky xl:top-6 space-y-5">
        {/* Live Deterministic ATS Score Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0 flex items-center justify-center">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke={
                    liveScoreBreakdown.totalScore >= 85
                      ? '#10B981'
                      : liveScoreBreakdown.totalScore >= 70
                      ? '#6C3CE1'
                      : '#F59E0B'
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  style={{ transition: 'stroke-dashoffset 300ms ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">
                  {liveScoreBreakdown.totalScore}
                </span>
                <span className="text-[9px] font-bold uppercase text-slate-400">/ 100</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Live Deterministic Score</span>
              </div>
              <h4 className="font-serif text-base font-bold text-slate-900">
                ATS Compatibility Estimate
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                {liveScoreBreakdown.disclaimer}
              </p>
            </div>
          </div>

          {/* 4-Pillar Category Bars (35 + 20 + 25 + 20 = 100) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
            {(
              [
                {
                  label: 'Parsability (Single-Column, Fonts)',
                  earned: liveScoreBreakdown.categories.parsability.earned,
                  max: 35,
                  color: 'bg-violet-600',
                },
                {
                  label: 'Structure (Headings & Dates)',
                  earned: liveScoreBreakdown.categories.structure.earned,
                  max: 20,
                  color: 'bg-blue-600',
                },
                {
                  label: 'Content Quality (Verbs & Metrics)',
                  earned: liveScoreBreakdown.categories.contentQuality.earned,
                  max: 25,
                  color: 'bg-orange-500',
                },
                {
                  label: 'Completeness (Contact & Sections)',
                  earned: liveScoreBreakdown.categories.completeness.earned,
                  max: 20,
                  color: 'bg-emerald-600',
                },
              ]
            ).map((cat) => (
              <div key={cat.label} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">{cat.label}</span>
                  <span className="font-bold text-slate-900">
                    {cat.earned}/{cat.max}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${cat.color}`}
                    style={{ width: `${Math.round((cat.earned / cat.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Top 3 Issues with 1-Click Fix Buttons */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Top Issues & 1-Click Auto-Fixes
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {liveScoreBreakdown.deductions.length} deduction(s)
              </span>
            </div>

            {liveScoreBreakdown.deductions.length === 0 ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero ATS deductions! Your resume passes all 4 deterministic checks.</span>
              </div>
            ) : (
              liveScoreBreakdown.deductions.slice(0, 3).map((ded: AtsScoreDeduction) => (
                <div
                  key={ded.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-800 font-medium leading-snug">{ded.reason}</span>
                    <span className="shrink-0 font-bold text-rose-600">-{ded.pointsLost} pts</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {ded.targetSection && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetIdx = STEPS.findIndex((s) => s.id === ded.targetSection);
                          if (targetIdx >= 0) setActiveStepIdx(targetIdx);
                        }}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        Go to {ded.targetSection}
                      </button>
                    )}
                    {ded.fixable && (
                      <button
                        type="button"
                        onClick={() => {
                          const fixed = applyOneClickFix(resumeData, ded);
                          commitChange(fixed);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        <Wand2 className="h-3 w-3 text-amber-300" />
                        <span>1-Click Fix (+{ded.pointsLost})</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Completeness Meter */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Profile Completeness Meter</span>
              <span className="font-black text-emerald-700">
                {liveScoreBreakdown.completenessPercent}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${liveScoreBreakdown.completenessPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {liveScoreBreakdown.checklist.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    const idx = STEPS.findIndex((s) => s.id === item.section);
                    if (idx >= 0) setActiveStepIdx(idx);
                  }}
                  className="flex items-center gap-1.5 text-left text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer truncate"
                >
                  {item.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
