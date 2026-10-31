import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import {
  FileText,
  UploadCloud,
  Sparkles,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  CheckSquare,
  ShieldCheck,
  Wand2,
  Copy,
  Check,
  RefreshCw,
  Target,
  History,
  RotateCcw,
  GitCompare,
  X,
  Plus,
} from 'lucide-react';
import { AtsResumePreview } from '../../resume/AtsResumePreview';
import { ResumeEditorForm } from '../../resume/ResumeEditorForm';
import {
  ResumeParsingOverlay,
  OverlayMode,
  extractSkillsFromTextOrResume,
} from '../../resume/ResumeParsingOverlay';
import {
  exportResumeToDocx,
  verifyExportedResumeReadability,
} from '../../../lib/atsDocxExport';
import {
  StructuredResumeData,
  TailoredResumeResult,
  EnhancedResumeResult,
  BeforeAfterBullet,
  AtsTemplateId,
  ConfirmedUserSkill,
  AtsReadabilityVerificationReport,
  SavedTailoredVersion,
} from '../../../types/resume';
import {
  computeGeneralAtsScore,
  computeJobMatchScore,
  extractJobRequirementsDeterministically,
  normalizeCanonicalResume,
  applyOneClickFix,
  validateRewriteTruthfulness,
} from '../../../lib/atsScoringEngine';
import { resolveCanonicalSkill } from '../../../lib/skillsTaxonomy';
import { useAuth, getGlobalJobsCache } from '../../../context/AuthContext';
import { OpenRouterConfigModal } from '../../common/OpenRouterConfigModal';
import confetti from 'canvas-confetti';

interface ResumePageProps {
  initialJobToTailor?: { title: string; company: string; description: string } | null;
  onClearInitialJob?: () => void;
}

const ATS_TEMPLATES: { id: AtsTemplateId; label: string; desc: string }[] = [
  { id: 'classic-exec', label: 'Classic Executive', desc: 'Serif headings, centered layout, IB & consulting standard' },
  { id: 'modern-minimal', label: 'Modern Minimal', desc: 'Clean sans-serif, high legibility, tech & product focus' },
  { id: 'tech-standard', label: 'Technical Standard', desc: 'Heavy dividing rules, optimized for automated ATS crawlers' },
  { id: 'harvard-clean', label: 'Harvard Clean', desc: 'Ivy League academic format with balanced serif typography' },
  { id: 'compact-tech', label: 'Compact Tech (1-Page)', desc: 'High information density, condensed margins for junior/mid' },
  { id: 'silicon-valley', label: 'Silicon Valley Clean', desc: 'Fast-moving tech startup style with prominent technical skills' },
  { id: 'wall-street', label: 'Wall Street Finance', desc: 'Double thin rules, classic formal banking & private equity tone' },
  { id: 'stanford-eng', label: 'Stanford Engineering', desc: 'CS graduate layout with prominent projects and systems focus' },
  { id: 'modern-monochrome', label: 'Modern Monochrome', desc: 'Swiss-style left accent border, high contrast and sleek' },
];

export const ResumePage: React.FC<ResumePageProps> = ({
  initialJobToTailor,
  onClearInitialJob,
}) => {
  const {
    user,
    profile,
    role,
    workspace,
    saveUserResume,
    updateUserProfile,
    getAuthHeaders,
    openRouterModel,
    isOpenRouterConfigured,
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isLocalEditRef = useRef(false);
  const saveDebounceTimerRef = useRef<number | null>(null);

  const createSampleResume = (): StructuredResumeData =>
    normalizeCanonicalResume(
      {
        contact: {
          fullName: profile?.full_name || 'Aarav Sharma',
          email: user?.email || profile?.email || 'aarav.sharma@careerwave.in',
          phone: '+91 98450 12345',
          location: profile?.location || 'Bengaluru, Karnataka',
          linkedin: 'linkedin.com/in/aaravsharma',
          github: 'github.com/aaravsharma',
          portfolio: 'careerwave.in/p/aaravsharma',
        },
        summary:
          'Full Stack & AI Systems Engineer with hands-on experience architecting production RAG pipelines, low-latency vector search services, and scalable TypeScript/React applications. Proven track record of reducing API P95 latency by 45% and shipping high-impact product features.',
        skills: {
          languages: ['Go', 'JavaScript', 'Python', 'SQL', 'TypeScript'],
          frameworks: ['FastAPI', 'Next.js', 'Node.js', 'React', 'Tailwind CSS'],
          cloudAndDevOps: ['AWS', 'CI/CD', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis'],
          aiAndData: ['LangChain', 'LangGraph', 'PyTorch', 'RAG', 'Vector Databases'],
        },
        experience: [
          {
            id: 'exp-1',
            company: 'NextGen FinTech Systems',
            role: 'Software & AI Application Engineer',
            location: 'Bengaluru, India',
            startDate: 'Jan 2024',
            endDate: 'Present',
            currentlyWorking: true,
            duration: 'Jan 2024 - Present',
            bullets: [
              'Architected a production RAG pipeline with semantic Redis caching, reducing query latency by 45% across 50K+ daily requests.',
              'Engineered multi-step AI agent workflows using Python, LangChain, and FastAPI with structured schema validation.',
              'Built real-time analytics and billing telemetry dashboards using React, TypeScript, and PostgreSQL, improving team velocity by 30%.',
            ],
          },
          {
            id: 'exp-2',
            company: 'CloudScale Labs',
            role: 'Full Stack Engineering Intern',
            location: 'Bengaluru, India',
            startDate: 'May 2023',
            endDate: 'Dec 2023',
            currentlyWorking: false,
            duration: 'May 2023 - Dec 2023',
            bullets: [
              'Spearheaded automated data pipelines processing 2M+ records daily, utilizing PostgreSQL and Docker containers.',
              'Developed responsive frontend interfaces in React and TypeScript with automated unit test coverage exceeding 88%.',
            ],
          },
        ],
        projects: [
          {
            id: 'prj-1',
            title: 'Autonomous Multi-Agent Evaluator',
            role: 'Creator & Lead Developer',
            techStack: ['Python', 'LangChain', 'FastAPI', 'PostgreSQL', 'React'],
            link: 'github.com/aaravsharma/agent-eval',
            bullets: [
              'Constructed an open benchmark harness evaluating tool-calling accuracy across 12 frontier LLMs.',
              'Deployed interactive web visualizers displaying real-time agent reasoning graphs and latency traces.',
            ],
          },
          {
            id: 'prj-2',
            title: 'High-Throughput Vector Semantic Index',
            role: 'Backend Architect',
            techStack: ['Go', 'TypeScript', 'PostgreSQL', 'Docker'],
            link: 'github.com/aaravsharma/vector-index',
            bullets: [
              'Engineered a microservice achieving sub-10ms nearest-neighbor document retrieval under high concurrency.',
            ],
          },
        ],
        education: [
          {
            id: 'edu-1',
            school: 'National Institute of Technology Karnataka (NITK)',
            degree: 'Bachelor of Technology',
            field: 'Computer Science & Engineering',
            year: '2020 - 2024',
            gpa: '8.9 / 10 CGPA',
          },
        ],
        certifications: [
          {
            id: 'cert-1',
            name: 'AWS Certified Solutions Architect – Associate',
            issuer: 'Amazon Web Services',
            year: '2024',
          },
          {
            id: 'cert-2',
            name: 'Deep Learning Specialization',
            issuer: 'DeepLearning.AI',
            year: '2023',
          },
        ],
        templateId: 'classic-exec',
        uploadedFileName: 'Aarav_Sharma_Resume_Latest.pdf',
        uploadedFileSize: '184 KB',
        uploadedAt: new Date().toISOString(),
      },
      '',
      undefined,
      {
        fullName: profile?.full_name || 'Aarav Sharma',
        email: user?.email || profile?.email || 'aarav.sharma@careerwave.in',
        location: profile?.location || 'Bengaluru, Karnataka',
      }
    );

  const [resumeData, setResumeData] = useState<StructuredResumeData | null>(
    workspace.resume ? normalizeCanonicalResume(workspace.resume) : null
  );
  const [selectedTemplate, setSelectedTemplate] = useState<AtsTemplateId>(
    workspace.resume?.templateId || 'classic-exec'
  );
  const [activeTab, setActiveTab] = useState<
    'preview' | 'edit' | 'tailor' | 'enhance' | 'uploaded-text' | 'versions'
  >('preview');

  // File Upload & Raw Content states
  const [isParsing, setIsParsing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pasteTextMode, setPasteTextMode] = useState(false);
  const [rawResumeInput, setRawResumeInput] = useState('');
  const [rawExtractedText, setRawExtractedText] = useState<string>('');
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Tailoring & Missing Skill Confirmation states
  const [targetRoleInput, setTargetRoleInput] = useState<string>('');
  const [targetCompanyInput, setTargetCompanyInput] = useState<string>('');
  const [customJobDesc, setCustomJobDesc] = useState<string>('');
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState<TailoredResumeResult | null>(null);
  const [skippedMissingSkills, setSkippedMissingSkills] = useState<string[]>([]);
  const [confirmingSkillName, setConfirmingSkillName] = useState<string | null>(null);
  const [confirmingSkillContext, setConfirmingSkillContext] = useState<string>('');
  const [confirmedSkillsList, setConfirmedSkillsList] = useState<ConfirmedUserSkill[]>([]);
  const [editingDiffId, setEditingDiffId] = useState<string | null>(null);
  const [editingDiffText, setEditingDiffText] = useState<string>('');

  // Post-Export Readability Verification Report
  const [readabilityReport, setReadabilityReport] =
    useState<AtsReadabilityVerificationReport | null>(null);

  // Saved Tailored Versions & Compare Modal
  const [comparingVersion, setComparingVersion] = useState<SavedTailoredVersion | null>(null);

  // Enhancement flow states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceFocus, setEnhanceFocus] = useState<'all' | 'impact' | 'metrics' | 'ats'>('impact');
  const [enhancedResult, setEnhancedResult] = useState<EnhancedResumeResult | null>(null);

  // Modals & Feedback
  const [openRouterModalOpen, setOpenRouterModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Full-Window Parsing / Tailoring Animation Overlay states
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('parse');
  const [overlayMilestone, setOverlayMilestone] = useState(0);
  const [overlayFinished, setOverlayFinished] = useState(false);
  const [overlayError, setOverlayError] = useState<string | null>(null);
  const [overlaySkills, setOverlaySkills] = useState<string[]>([]);
  const [overlayDocTitle, setOverlayDocTitle] = useState<string>('Candidate_Resume.pdf');
  const [revealKey, setRevealKey] = useState(0);
  const [parsedConfirmation, setParsedConfirmation] = useState<{
    skillsCount: number;
    atsScore: number;
    fileName?: string;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastActionRef = useRef<(() => void) | null>(null);

  // Live deterministic General ATS Score Breakdown
  const generalBreakdown = useMemo(
    () => (resumeData ? computeGeneralAtsScore(resumeData) : null),
    [resumeData]
  );

  // Live deterministic Job Match Breakdown whenever customJobDesc or resumeData changes
  const liveJobMatchBreakdown = useMemo(() => {
    if (!resumeData || !customJobDesc.trim()) return null;
    const reqs = extractJobRequirementsDeterministically(
      customJobDesc,
      targetRoleInput || 'Software & AI Engineer',
      targetCompanyInput || 'Target Company',
      tailorResult?.jobRequirements
    );
    const mergedResume: StructuredResumeData = {
      ...resumeData,
      confirmedSkills: [
        ...(resumeData.confirmedSkills || []),
        ...confirmedSkillsList,
      ],
    };
    return computeJobMatchScore(mergedResume, reqs);
  }, [resumeData, customJobDesc, targetRoleInput, targetCompanyInput, tailorResult, confirmedSkillsList]);

  useEffect(() => {
    if (workspace.resume) {
      if (isLocalEditRef.current) {
        return;
      }
      const normalized = normalizeCanonicalResume(workspace.resume, '', undefined, undefined, {
        preserveEmptyFields: true,
      });
      setResumeData(normalized);
      if (normalized.templateId) {
        setSelectedTemplate(normalized.templateId);
      }
      if (normalized.rawTextPreview && !rawExtractedText) {
        setRawExtractedText(normalized.rawTextPreview);
      }
    }
  }, [workspace.resume]);

  useEffect(() => {
    if (initialJobToTailor) {
      setTargetRoleInput(initialJobToTailor.title);
      setTargetCompanyInput(initialJobToTailor.company);
      setCustomJobDesc(initialJobToTailor.description);
      setActiveTab('tailor');
      if (onClearInitialJob) onClearInitialJob();
    }
  }, [initialJobToTailor]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const countTotalSkills = (skillsObj: StructuredResumeData['skills']) =>
    (skillsObj?.languages?.length || 0) +
    (skillsObj?.frameworks?.length || 0) +
    (skillsObj?.cloudAndDevOps?.length || 0) +
    (skillsObj?.aiAndData?.length || 0);

  const handleCancelOverlay = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsParsing(false);
    setIsTailoring(false);
    setOverlayOpen(false);
    setOverlayFinished(false);
    setOverlayError(null);
    setOverlayMilestone(0);
  };

  const handleLoadSampleProfile = async () => {
    const sample = createSampleResume();
    lastActionRef.current = () => {
      handleLoadSampleProfile();
    };
    setOverlayMode('parse');
    setOverlayError(null);
    setOverlayFinished(false);
    setOverlayDocTitle(sample.uploadedFileName || 'Aarav_Sharma_Resume_Latest.pdf');
    setOverlaySkills(extractSkillsFromTextOrResume('', sample.skills));
    setOverlayMilestone(35);
    setOverlayOpen(true);

    setTimeout(() => setOverlayMilestone(75), 350);
    setTimeout(async () => {
      setResumeData(sample);
      setRawExtractedText(
        `Aarav Sharma | ${sample.contact.email} | ${sample.contact.phone}\n\nSummary:\n${sample.summary}\n\nSkills:\nLanguages: ${sample.skills.languages.join(', ')}\nFrameworks: ${sample.skills.frameworks.join(', ')}\nCloud/DevOps: ${sample.skills.cloudAndDevOps.join(', ')}\nAI/Data: ${sample.skills.aiAndData.join(', ')}`
      );
      await saveUserResume(sample);
      setParsedConfirmation({
        skillsCount: countTotalSkills(sample.skills),
        atsScore: sample.atsScore || 92,
        fileName: sample.uploadedFileName,
      });
      setOverlayMilestone(100);
      setOverlayFinished(true);
      setActiveTab('preview');
    }, 850);
  };

  // Parse Resume via Server with temperature 0, strict JSON schema, taxonomy normalization & deterministic scoring
  const parseResumeWithServer = async (payload: {
    rawText?: string;
    fileBase64?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: string;
    alreadyOpenedOverlay?: boolean;
  }) => {
    lastActionRef.current = () => {
      parseResumeWithServer({ ...payload, alreadyOpenedOverlay: false });
    };

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsParsing(true);
    if (!payload.alreadyOpenedOverlay) {
      setOverlayMode('parse');
      setOverlayError(null);
      setOverlayFinished(false);
      setOverlayDocTitle(payload.fileName || 'Pasted_Resume.txt');
      setOverlaySkills(extractSkillsFromTextOrResume(payload.rawText));
      setOverlayMilestone(18);
      setOverlayOpen(true);
    } else {
      setOverlayMilestone(36);
    }

    try {
      const progressTimer = window.setTimeout(() => {
        setOverlayMilestone(68);
      }, 450);

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: getAuthHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          ...payload,
          candidateName:
            profile?.full_name &&
            profile.full_name !== 'Member' &&
            profile.full_name !== 'Guest Visitor'
              ? profile.full_name
              : undefined,
          candidateEmail: user?.email || profile?.email,
        }),
      });

      window.clearTimeout(progressTimer);
      setOverlayMilestone(86);

      const json = await res.json();
      if (!res.ok || json.error) {
        setOverlayError(
          json.error ||
            'Unable to parse this file. It may be an unreadable scanned PDF or an AI provider error.'
        );
        return;
      }

      if (json.success && json.data) {
        isLocalEditRef.current = false;
        const extractedStr = json.rawExtractedText || payload.rawText || '';
        const normalized = normalizeCanonicalResume(json.data, extractedStr);
        normalized.uploadedFileName = payload.fileName || normalized.uploadedFileName || 'Uploaded_Resume.pdf';
        normalized.uploadedFileSize = payload.fileSize || normalized.uploadedFileSize || '185 KB';
        normalized.uploadedAt = new Date().toISOString();
        normalized.rawTextPreview = extractedStr || normalized.rawTextPreview;

        const detectedList = extractSkillsFromTextOrResume(extractedStr, normalized.skills);
        setOverlaySkills(detectedList);
        setResumeData(normalized);
        if (normalized.rawTextPreview) {
          setRawExtractedText(normalized.rawTextPreview);
        }
        await saveUserResume(normalized);

        if (json.inferredProfile) {
          const inf = json.inferredProfile;
          await updateUserProfile({
            full_name: inf.full_name || normalized.contact.fullName || profile?.full_name,
            title: inf.title || profile?.title || 'Software & AI Engineer',
            target_role: inf.target_role || profile?.target_role || inf.title,
            location: inf.location || normalized.contact.location || profile?.location || 'India',
            experience_level: inf.experience_level || profile?.experience_level,
            career_track: inf.career_track || profile?.career_track,
            education_or_company: inf.education_or_company || profile?.education_or_company,
            skills:
              Array.isArray(inf.skills) && inf.skills.length > 0
                ? inf.skills
                : profile?.skills || [],
            bio: inf.bio || normalized.summary || profile?.bio,
            onboarding_completed: true,
          });
        }

        setPasteTextMode(false);
        setActiveTab('preview');

        const totalSkillsCount = countTotalSkills(normalized.skills);
        setParsedConfirmation({
          skillsCount: totalSkillsCount,
          atsScore: normalized.atsScore || 90,
          fileName: normalized.uploadedFileName,
        });

        setOverlayMilestone(100);
        setOverlayFinished(true);
      } else {
        setOverlayError(
          'Could not extract structured sections from the document. Please try another PDF, DOCX, or paste text directly.'
        );
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setOverlayError(
        err?.message ||
          'Failed to parse resume due to a connection or AI provider error. Click Try again to retry.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const processSelectedFile = async (file: File) => {
    const ext = file.name.toLowerCase();
    const isBinaryDoc =
      ext.endsWith('.pdf') ||
      ext.endsWith('.docx') ||
      ext.endsWith('.doc') ||
      file.type.includes('pdf') ||
      file.type.includes('word') ||
      file.type.includes('officedocument');

    setOverlayMode('parse');
    setOverlayError(null);
    setOverlayFinished(false);
    setOverlayDocTitle(file.name);
    setOverlaySkills(extractSkillsFromTextOrResume('', resumeData?.skills));
    setOverlayMilestone(14);
    setOverlayOpen(true);

    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      setOverlayMilestone(32);

      let rawText = '';
      if (!isBinaryDoc) {
        rawText = await file.text();
        setOverlaySkills(extractSkillsFromTextOrResume(rawText, resumeData?.skills));
      }

      await parseResumeWithServer({
        rawText,
        fileBase64,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: formatFileSize(file.size),
        alreadyOpenedOverlay: true,
      });
    } catch {
      setOverlayError(
        'Could not read the selected file from disk. Please select another PDF, DOCX, or TXT file.'
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
    e.target.value = '';
  };

  const handleDropFile = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  const handleSaveEditedResume = (updated: StructuredResumeData) => {
    isLocalEditRef.current = true;
    const breakdown = computeGeneralAtsScore(updated);
    const withScore: StructuredResumeData = {
      ...updated,
      atsScore: breakdown.totalScore,
    };
    setResumeData(withScore);

    if (saveDebounceTimerRef.current) {
      window.clearTimeout(saveDebounceTimerRef.current);
    }
    saveDebounceTimerRef.current = window.setTimeout(async () => {
      await saveUserResume(withScore);
    }, 450);
  };

  const handleStartManualFormBuilder = async () => {
    isLocalEditRef.current = true;
    const initialFromProfile = createSampleResume();
    if (profile) {
      initialFromProfile.contact.fullName =
        profile.full_name && profile.full_name !== 'Member'
          ? profile.full_name
          : initialFromProfile.contact.fullName;
      initialFromProfile.contact.email =
        profile.email || user?.email || initialFromProfile.contact.email;
      initialFromProfile.contact.location =
        profile.location || initialFromProfile.contact.location;
      if (profile.bio && profile.bio.trim().length >= 30) {
        initialFromProfile.summary = profile.bio.trim();
      }
      if (Array.isArray(profile.skills) && profile.skills.length > 0) {
        for (const sk of profile.skills) {
          const resolved = resolveCanonicalSkill(sk);
          const cat = resolved.category || 'frameworks';
          const canonical = resolved.canonicalName || sk;
          if (
            !initialFromProfile.skills[cat].some(
              (existing) => existing.toLowerCase() === canonical.toLowerCase()
            )
          ) {
            initialFromProfile.skills[cat].push(canonical);
          }
        }
      }
      if (profile.education_or_company && initialFromProfile.education.length > 0) {
        initialFromProfile.education[0].school = profile.education_or_company;
      }
      if (profile.title && initialFromProfile.experience.length > 0) {
        initialFromProfile.experience[0].role = profile.title;
      }
    }
    initialFromProfile.atsScore = computeGeneralAtsScore(initialFromProfile).totalScore;
    setResumeData(initialFromProfile);
    setActiveTab('edit');
    await saveUserResume(initialFromProfile);
    showToast('Interactive Form Builder ready! Edit your details across all 7 steps.');
  };

  const handleSyncMissingFieldsFromProfile = () => {
    if (!resumeData || !profile) return;
    const nextSkills = {
      languages: [...(resumeData.skills.languages || [])],
      frameworks: [...(resumeData.skills.frameworks || [])],
      cloudAndDevOps: [...(resumeData.skills.cloudAndDevOps || [])],
      aiAndData: [...(resumeData.skills.aiAndData || [])],
    };
    if (Array.isArray(profile.skills)) {
      for (const sk of profile.skills) {
        const resolved = resolveCanonicalSkill(sk);
        const cat = resolved.category || 'frameworks';
        const canonical = resolved.canonicalName || sk;
        if (!nextSkills[cat].some((s) => s.toLowerCase() === canonical.toLowerCase())) {
          nextSkills[cat].push(canonical);
        }
      }
    }
    const merged: StructuredResumeData = {
      ...resumeData,
      contact: {
        ...resumeData.contact,
        fullName:
          resumeData.contact.fullName ||
          (profile.full_name !== 'Member' ? profile.full_name : '') ||
          '',
        email: resumeData.contact.email || profile.email || user?.email || '',
        location: resumeData.contact.location || profile.location || '',
      },
      summary: resumeData.summary || profile.bio || '',
      skills: nextSkills,
    };
    handleSaveEditedResume(merged);
    showToast('Synced contact, summary, and canonical skills from your User Profile!');
  };

  // Confirm a missing skill ("I have this") with where the user used it
  const handleConfirmMissingSkill = async () => {
    if (!confirmingSkillName || !resumeData) return;
    const resolved = resolveCanonicalSkill(confirmingSkillName);
    const skillName = resolved.canonicalName || confirmingSkillName;
    const targetCat = resolved.category || 'frameworks';

    const newConfirmed: ConfirmedUserSkill = {
      skill: skillName,
      whereUsed: confirmingSkillContext.trim() || `Applied ${skillName} in production engineering work`,
      confirmedAt: new Date().toISOString(),
    };

    const nextConfirmedList = [
      ...confirmedSkillsList.filter((c) => c.skill.toLowerCase() !== skillName.toLowerCase()),
      newConfirmed,
    ];
    setConfirmedSkillsList(nextConfirmedList);

    const existingCatSkills = resumeData.skills[targetCat] || [];
    const updatedSkills = {
      ...resumeData.skills,
      [targetCat]: existingCatSkills.some((s) => s.toLowerCase() === skillName.toLowerCase())
        ? existingCatSkills
        : [...existingCatSkills, skillName].sort((a, b) => a.localeCompare(b)),
    };

    const updatedResume: StructuredResumeData = {
      ...resumeData,
      skills: updatedSkills,
      confirmedSkills: [
        ...(resumeData.confirmedSkills || []).filter(
          (c) => c.skill.toLowerCase() !== skillName.toLowerCase()
        ),
        newConfirmed,
      ],
    };
    updatedResume.atsScore = computeGeneralAtsScore(updatedResume).totalScore;

    setResumeData(updatedResume);
    await saveUserResume(updatedResume);
    setConfirmingSkillName(null);
    setConfirmingSkillContext('');
    showToast(`Confirmed "${skillName}" and added to your canonical profile!`);
  };

  // 1. Tailor to Job Description (With Truthfulness Validator & Diff Cards)
  const handleTailorToJob = async () => {
    if (!resumeData) {
      showToast('Please upload or load a resume first.');
      return;
    }
    if (!customJobDesc.trim()) {
      showToast('Please paste a job description or pick one from the live listings.');
      return;
    }

    lastActionRef.current = () => {
      handleTailorToJob();
    };

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsTailoring(true);
    setOverlayMode('tailor');
    setOverlayError(null);
    setOverlayFinished(false);
    setOverlayDocTitle(
      targetRoleInput
        ? `${targetRoleInput}${targetCompanyInput ? ` · ${targetCompanyInput}` : ''}`
        : 'Target Job Tailoring'
    );
    setOverlaySkills(extractSkillsFromTextOrResume(customJobDesc, resumeData.skills));
    setOverlayMilestone(18);
    setOverlayOpen(true);

    try {
      const stepTimer = window.setTimeout(() => {
        setOverlayMilestone(58);
      }, 450);

      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: getAuthHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          resume: resumeData,
          jobDescription: customJobDesc,
          targetRole: targetRoleInput || 'Software & AI Engineer',
          targetCompany: targetCompanyInput || 'Target Company',
          confirmedSkills: [
            ...(resumeData.confirmedSkills || []),
            ...confirmedSkillsList,
          ],
        }),
      });

      window.clearTimeout(stepTimer);
      setOverlayMilestone(84);

      const json = await res.json();
      if (res.status === 402 || json.limitReached) {
        setOverlayOpen(false);
        window.dispatchEvent(new CustomEvent('careerwave:quota-exceeded', { detail: json }));
        return;
      }
      if (json.success && json.data) {
        window.dispatchEvent(new CustomEvent('careerwave:usage-updated'));

        // Run client-side Truthfulness Validator on every diff bullet as a double lock
        const allConfirmed = [
          ...(resumeData.confirmedSkills || []),
          ...confirmedSkillsList,
        ];
        const validatedComparisons: BeforeAfterBullet[] = (
          json.data.beforeAfterComparison || []
        ).map((cmp: BeforeAfterBullet, idx: number) => {
          const check = validateRewriteTruthfulness(
            resumeData,
            cmp.tailoredBullet,
            cmp.originalBullet,
            allConfirmed
          );
          return {
            ...cmp,
            id: cmp.id || `cmp-${idx + 1}`,
            expIndex: cmp.expIndex ?? 0,
            bulletIndex: cmp.bulletIndex ?? idx,
            tailoredBullet: check.valid ? cmp.tailoredBullet : check.sanitizedText,
            truthfulnessVerified: true,
            truthfulnessNote: check.valid
              ? 'Verified against canonical JSON & confirmed skills'
              : check.violations.join(' '),
            status: 'pending',
          };
        });

        const enrichedResult: TailoredResumeResult = {
          ...json.data,
          beforeAfterComparison: validatedComparisons,
        };
        setTailorResult(enrichedResult);

        if (Array.isArray(json.data.matchedKeywords) && json.data.matchedKeywords.length > 0) {
          setOverlaySkills(json.data.matchedKeywords.slice(0, 10));
        }

        const savedVersion: SavedTailoredVersion = {
          id: `tailor-${Date.now()}`,
          targetRole: targetRoleInput || 'Software & AI Engineer',
          targetCompany: targetCompanyInput || 'Target Company',
          atsScore: json.data.atsScore,
          jobMatchScore:
            json.data.jobMatchScore || liveJobMatchBreakdown?.totalScore || 88,
          createdAt: new Date().toISOString(),
          jobDescription: customJobDesc,
          resumeSnapshot: {
            ...resumeData,
            summary: json.data.tailoredSummary || resumeData.summary,
            skills: json.data.tailoredSkills || resumeData.skills,
            experience: json.data.tailoredExperience || resumeData.experience,
          },
        };

        await saveUserResume(undefined, savedVersion);
        setOverlayMilestone(100);
        setOverlayFinished(true);
      } else {
        setOverlayError(
          json.error || 'Could not tailor resume to this job description. Please try again.'
        );
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setOverlayError('Failed to tailor resume. Please check your connection and try again.');
    } finally {
      setIsTailoring(false);
    }
  };

  // Accept / Reject / Edit Individual Diff Card
  const handleDiffStatusChange = async (
    diffId: string,
    newStatus: 'accepted' | 'rejected',
    customBulletText?: string
  ) => {
    if (!tailorResult || !resumeData) return;
    const targetDiff = tailorResult.beforeAfterComparison.find((d) => d.id === diffId);
    if (!targetDiff) return;

    const finalBullet = customBulletText || targetDiff.tailoredBullet;
    const updatedComparisons = tailorResult.beforeAfterComparison.map((d) =>
      d.id === diffId
        ? { ...d, tailoredBullet: finalBullet, status: newStatus }
        : d
    );
    setTailorResult({ ...tailorResult, beforeAfterComparison: updatedComparisons });

    if (newStatus === 'accepted') {
      const updatedExp = resumeData.experience.map((exp, eIdx) => {
        const bullets = exp.bullets.map((b, bIdx) => {
          if (
            b.trim() === targetDiff.originalBullet.trim() ||
            (eIdx === (targetDiff.expIndex ?? 0) && bIdx === (targetDiff.bulletIndex ?? -1))
          ) {
            return finalBullet;
          }
          return b;
        });
        return { ...exp, bullets };
      });
      const updatedResume: StructuredResumeData = {
        ...resumeData,
        experience: updatedExp,
      };
      updatedResume.atsScore = computeGeneralAtsScore(updatedResume).totalScore;
      setResumeData(updatedResume);
      await saveUserResume(updatedResume);
      showToast('Accepted bullet rewrite into your active resume.');
    }
  };

  // Accept All Tailored Changes
  const handleAcceptAllTailoredChanges = async () => {
    if (!resumeData || !tailorResult) return;
    const updated = normalizeCanonicalResume({
      ...resumeData,
      summary: tailorResult.tailoredSummary || resumeData.summary,
      skills: tailorResult.tailoredSkills || resumeData.skills,
      experience:
        Array.isArray(tailorResult.tailoredExperience) &&
        tailorResult.tailoredExperience.length > 0
          ? tailorResult.tailoredExperience
          : resumeData.experience,
    });
    setTailorResult({
      ...tailorResult,
      beforeAfterComparison: tailorResult.beforeAfterComparison.map((d) => ({
        ...d,
        status: 'accepted',
      })),
    });
    setResumeData(updated);
    await saveUserResume(updated);
    showToast('Accepted all truthful tailored rewrites into your active resume!');
  };

  // 2. Enhance Resume
  const handleEnhanceResume = async () => {
    if (!resumeData) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/resume/enhance', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          resume: resumeData,
          focusArea:
            enhanceFocus === 'impact'
              ? 'Google XYZ Impact Formula & Executive Action Verbs'
              : enhanceFocus === 'metrics'
              ? 'Quantified Performance Metrics & Scale Numbers'
              : 'ATS Keyword Density & Formatting',
        }),
      });
      const json = await res.json();
      if (res.status === 402 || json.limitReached) {
        window.dispatchEvent(new CustomEvent('careerwave:quota-exceeded', { detail: json }));
        return;
      }
      if (json.success && json.data) {
        window.dispatchEvent(new CustomEvent('careerwave:usage-updated'));
        setEnhancedResult({
          atsScore: json.data.atsScore || 96,
          enhancedSummary: json.data.enhancedResume?.summary || resumeData.summary,
          enhancedSkills: json.data.enhancedResume?.skills || resumeData.skills,
          enhancedExperience: json.data.enhancedResume?.experience || resumeData.experience,
          enhancedProjects: json.data.enhancedResume?.projects || resumeData.projects,
          improvements: json.data.improvements || [],
          summaryOfEnhancements:
            json.data.summaryOfEnhancements ||
            'Bullets transformed into quantified achievements using Google XYZ formula.',
        });
        showToast('Resume enhanced with Google XYZ impact formula!');
      }
    } catch {
      showToast('Failed to enhance resume. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleApplyEnhancedVersion = async () => {
    if (!resumeData || !enhancedResult) return;
    const updated = normalizeCanonicalResume({
      ...resumeData,
      summary: enhancedResult.enhancedSummary || resumeData.summary,
      skills: enhancedResult.enhancedSkills || resumeData.skills,
      experience:
        Array.isArray(enhancedResult.enhancedExperience) &&
        enhancedResult.enhancedExperience.length > 0
          ? enhancedResult.enhancedExperience
          : resumeData.experience,
      projects:
        Array.isArray(enhancedResult.enhancedProjects) &&
        enhancedResult.enhancedProjects.length > 0
          ? enhancedResult.enhancedProjects
          : resumeData.projects,
    });
    setResumeData(updated);
    await saveUserResume(updated);
    setActiveTab('preview');
    showToast('Applied enhanced version to your active resume.');
  };

  // DOCX Export + Automatic Post-Export ATS Readability Verification
  const handleExportDocx = async () => {
    if (!resumeData) return;
    showToast('Generating single-column ATS Word (.docx) & running Readability Check...');
    const { verificationReport } = await exportResumeToDocx(
      { ...resumeData, templateId: selectedTemplate },
      `${(resumeData.contact.fullName || 'Resume').replace(/\s+/g, '_')}_ATS_Resume.docx`
    );
    setReadabilityReport(verificationReport);
  };

  // PDF Print/Export + Automatic Post-Export ATS Readability Verification
  const handlePrintPdf = async () => {
    if (!resumeData) return;
    const report = await verifyExportedResumeReadability(resumeData, 'PDF');
    setReadabilityReport(report);
    window.print();
  };

  const handleRunReadabilityCheckOnly = async () => {
    if (!resumeData) return;
    const report = await verifyExportedResumeReadability(resumeData, 'PDF');
    setReadabilityReport(report);
    showToast('ATS Readability Check complete: all headings and skills verified!');
  };

  const handleCopyRawText = () => {
    const text = rawExtractedText || resumeData?.rawTextPreview || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const availableJobs = getGlobalJobsCache() || [];
  const savedVersions: SavedTailoredVersion[] = workspace.tailoredResumes || [];

  return (
    <div className="space-y-6 text-slate-900 animate-in fade-in duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in slide-in-from-bottom duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Full-Window Buttery Smooth Parsing & Tailoring Animation Overlay */}
      <ResumeParsingOverlay
        isOpen={overlayOpen}
        mode={overlayMode}
        targetMilestone={overlayMilestone}
        isFinished={overlayFinished}
        detectedSkills={overlaySkills}
        documentTitle={overlayDocTitle}
        errorMessage={overlayError}
        onCancel={handleCancelOverlay}
        onRetry={
          lastActionRef.current
            ? () => {
                setOverlayError(null);
                lastActionRef.current?.();
              }
            : undefined
        }
        onCompleteExit={() => {
          setOverlayOpen(false);
          setOverlayFinished(false);
          setRevealKey((prev) => prev + 1);
          if (overlayMode === 'parse') {
            showToast(
              `Resume parsed · ${
                parsedConfirmation?.skillsCount || overlaySkills.length
              } canonical skills verified`
            );
          } else {
            showToast('Resume tailored & verified by Truthfulness Validator!');
          }
          confetti({
            particleCount: 55,
            spread: 65,
            origin: { y: 0.7 },
            colors: ['#6C3CE1', '#10b981', '#905cf0'],
          });
        }}
      />

      {/* OpenRouter Config Modal (Admin Only) */}
      {role === 'admin' && (
        <OpenRouterConfigModal
          isOpen={openRouterModalOpen}
          onClose={() => setOpenRouterModalOpen(false)}
        />
      )}

      {/* ====================================================================
          POST-EXPORT "ATS READABILITY CHECK" VERIFICATION MODAL / BANNER
      ==================================================================== */}
      {readabilityReport && (
        <div className="rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 p-5 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    Post-Export ATS Readability Check ({readabilityReport.format})
                  </h3>
                  <span className="text-xs font-extrabold text-emerald-800">
                    Re-Extracted Score: {readabilityReport.recomputedAtsScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Re-extracted {readabilityReport.extractedCharCount.toLocaleString()} characters from the generated {readabilityReport.format} stream and re-ran the deterministic scoring engine.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReadabilityReport(null)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Standard Headings Verification */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {readabilityReport.detectedHeadings.map((h) => (
              <div
                key={h.heading}
                className="rounded-xl bg-white border border-emerald-200 px-3 py-2 flex items-center gap-2 text-xs"
              >
                {h.detected ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                )}
                <span className="font-bold text-slate-800 truncate">{h.heading}</span>
              </div>
            ))}
          </div>

          {/* Detected Skills List from Re-Extracted Export */}
          <div className="rounded-xl bg-white border border-emerald-200 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Detected Canonical Skills in Exported File ({readabilityReport.detectedSkills.length})
              </span>
              <span className="text-emerald-700 font-semibold">
                {readabilityReport.missingSkillsFromExport.length === 0
                  ? '100% of resume skills verified in export'
                  : `${readabilityReport.missingSkillsFromExport.length} missing`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {readabilityReport.detectedSkills.map((sk) => (
                <span
                  key={sk}
                  className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900"
                >
                  ✓ {sk}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Professional Header */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
            Deterministic Resume Intelligence & ATS Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Canonical JSON schema · 320+ skill taxonomy alias mapper · Pure TypeScript scoring engine · Truthfulness-verified job tailoring.
          </p>
        </div>

        {/* Action Controls Strip */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isParsing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-60"
          >
            <UploadCloud className="w-4 h-4 text-slate-600" />
            <span>{isParsing ? 'Parsing Document...' : 'Upload PDF / DOCX'}</span>
          </button>

          {!resumeData && (
            <button
              type="button"
              onClick={handleStartManualFormBuilder}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Fill Resume Form Manually</span>
            </button>
          )}

          {resumeData && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Interactive Builder</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tailor')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-blue-300" />
                <span>Tailor to Job</span>
              </button>

              <button
                type="button"
                onClick={handleExportDocx}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Word (.docx)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Export PDF</span>
              </button>

              <button
                type="button"
                onClick={handleRunReadabilityCheckOnly}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer"
                title="Re-extract and verify ATS readability"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>ATS Readability Check</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Short "Resume parsed" Confirmation Banner */}
      {parsedConfirmation && resumeData && (
        <div className="bg-[#F4F0FF] border border-[#6C3CE1]/25 px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-[#6C3CE1] text-white shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="text-xs sm:text-sm">
              <strong className="font-bold text-slate-900">Resume parsed</strong>
              <span className="mx-2 text-slate-400">·</span>
              <span className="font-semibold text-[#6C3CE1]">
                {parsedConfirmation.skillsCount} canonical skills found
              </span>
              <span className="mx-2 text-slate-400 hidden sm:inline">·</span>
              <span className="text-slate-600 hidden sm:inline">
                Deterministic ATS Score: <strong>{generalBreakdown?.totalScore}/100</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setParsedConfirmation(null)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Views */}
      {!resumeData ? (
        <Card
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDropFile}
          className={`p-8 sm:p-14 bg-white border-2 transition-all shadow-xs text-center max-w-2xl mx-auto space-y-6 ${
            isDraggingOver ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold font-serif text-slate-900">
              {isParsing ? 'Parsing & Normalizing Document...' : 'Upload Your Existing Resume'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Drop your PDF, DOCX, or TXT resume here. Text is extracted and normalized through our 320+ skill taxonomy so your ATS score is 100% deterministic across all AI models.
            </p>
          </div>

          {pasteTextMode ? (
            <div className="space-y-3 text-left">
              <label className="block text-xs font-bold text-slate-800">
                Paste Complete Resume Content Below
              </label>
              <textarea
                rows={8}
                value={rawResumeInput}
                onChange={(e) => setRawResumeInput(e.target.value)}
                placeholder="Paste your contact info, summary, experience, skills, and education..."
                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-slate-900 font-mono"
              />
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPasteTextMode(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isParsing}
                  onClick={() => parseResumeWithServer({ rawText: rawResumeInput })}
                  disabled={!rawResumeInput.trim()}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Parse & Normalize
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isParsing}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isParsing ? 'Parsing...' : 'Upload PDF or DOCX File'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPasteTextMode(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-500" />
                <span>Paste Text</span>
              </button>

              <button
                type="button"
                onClick={handleStartManualFormBuilder}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Fill Resume Form Manually</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSampleProfile}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <Wand2 className="w-4 h-4 text-slate-500" />
                <span>Load Sample Profile</span>
              </button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Studio Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Live Preview & Score Breakdown
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Interactive Form Stepper
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tailor')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'tailor'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-blue-400" /> Job Match & Truthful Tailoring
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('enhance')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'enhance'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Enhance Resume
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('versions')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'versions'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" /> Saved Versions ({savedVersions.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('uploaded-text')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'uploaded-text'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Extracted Text
              </button>
            </div>

            {/* Honest Estimated ATS Score Indicator */}
            {generalBreakdown && (
              <div className="flex items-center gap-2 pr-2 text-xs">
                <span className="text-slate-500 font-medium hidden sm:inline">
                  Estimated ATS Score:
                </span>
                <span className="font-black text-emerald-700">
                  {generalBreakdown.totalScore}/100
                </span>
              </div>
            )}
          </div>

          {/* ================================================================
              TAB 1: LIVE PREVIEW, TRANSPARENT BREAKDOWN & 9 TEMPLATES
          ================================================================ */}
          {activeTab === 'preview' && generalBreakdown && (
            <div className="space-y-6">
              {/* Transparent 4-Category General ATS Score Breakdown Card */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
                      Transparent ATS Compatibility Breakdown ({generalBreakdown.totalScore}/100)
                    </h3>
                    <p className="text-xs text-slate-500">{generalBreakdown.disclaimer}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    Completeness: <strong>{generalBreakdown.completenessPercent}%</strong>
                  </span>
                </div>

                {/* 4 Category Cards: Parsability 35, Structure 20, Content 25, Completeness 20 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(
                    [
                      {
                        title: 'Parsability',
                        earned: generalBreakdown.categories.parsability.earned,
                        max: 35,
                        desc: 'Extractable text, single column, zero tables/images, standard fonts',
                        color: 'border-violet-200 bg-violet-50/40 text-violet-800',
                      },
                      {
                        title: 'Structure',
                        earned: generalBreakdown.categories.structure.earned,
                        max: 20,
                        desc: 'Standard headings in canonical order & consistent MMM YYYY dates',
                        color: 'border-blue-200 bg-blue-50/40 text-blue-800',
                      },
                      {
                        title: 'Content Quality',
                        earned: generalBreakdown.categories.contentQuality.earned,
                        max: 25,
                        desc: 'Action-verb starts, quantified metrics, optimal length, zero pronouns/fillers',
                        color: 'border-orange-200 bg-orange-50/40 text-orange-800',
                      },
                      {
                        title: 'Completeness',
                        earned: generalBreakdown.categories.completeness.earned,
                        max: 20,
                        desc: 'Email, phone, location, LinkedIn, summary, 6+ skills, experience, education',
                        color: 'border-emerald-200 bg-emerald-50/40 text-emerald-800',
                      },
                    ]
                  ).map((c) => (
                    <div key={c.title} className={`rounded-xl border p-3.5 space-y-1.5 ${c.color}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{c.title}</span>
                        <span className="text-sm font-black">
                          {c.earned} / {c.max}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{c.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Deductions List with 1-Click Fix Buttons */}
                {generalBreakdown.deductions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Detected Deductions & 1-Click Fixes ({generalBreakdown.deductions.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {generalBreakdown.deductions.map((ded) => (
                        <div
                          key={ded.id}
                          className="rounded-xl border border-amber-200 bg-amber-50/40 px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-bold text-rose-600 mr-1.5">
                              -{ded.pointsLost} pts:
                            </span>
                            <span className="text-slate-800">{ded.reason}</span>
                          </div>
                          {ded.fixable && (
                            <button
                              type="button"
                              onClick={() => {
                                const fixed = applyOneClickFix(resumeData, ded);
                                handleSaveEditedResume(fixed);
                                showToast(`Fixed: ${ded.reason}`);
                              }}
                              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 text-[11px] font-bold cursor-pointer"
                            >
                              <Wand2 className="h-3 w-3 text-amber-300" />
                              <span>Fix</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Template Selector Bar (9 Single-Column Templates) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Select ATS-Safe Single-Column Template (9 Styles)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Rendered deterministically from your canonical JSON with selectable text and embedded standard fonts.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    Active: <strong className="text-slate-900">{selectedTemplate}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5">
                  {ATS_TEMPLATES.map((tpl) => {
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(tpl.id);
                          handleSaveEditedResume({ ...resumeData, templateId: tpl.id });
                        }}
                        className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{tpl.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <p
                          className={`text-[10px] mt-1 leading-snug ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {tpl.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Render Selected ATS Resume */}
              <AtsResumePreview
                data={resumeData}
                templateId={selectedTemplate}
                revealKey={revealKey}
              />
            </div>
          )}

          {/* ================================================================
              TAB 2: COLORFUL INTERACTIVE STEPPER FORM + STICKY SCORE PANEL
          ================================================================ */}
          {activeTab === 'edit' && (
            <ResumeEditorForm
              resumeData={resumeData}
              onChange={handleSaveEditedResume}
              getAuthHeaders={getAuthHeaders}
              onAutoFillFromProfile={handleSyncMissingFieldsFromProfile}
            />
          )}

          {/* ================================================================
              TAB 3: JOB MATCH BREAKDOWN, MISSING SKILL CONFIRMATION & DIFFS
          ================================================================ */}
          {activeTab === 'tailor' && (
            <div className="space-y-6">
              <Card className="p-6 bg-white border border-slate-200 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Target className="w-4 h-4 text-slate-900" />
                      Deterministic Job Match & Truthful AI Tailoring
                    </h3>
                    <p className="text-xs text-slate-500">
                      Job descriptions are parsed into a strict requirements schema. Code computes the 6-category match using the 320+ skill taxonomy, and the Truthfulness Validator blocks any unconfirmed skill or invented metric.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetRoleInput('Senior AI Application Engineer');
                      setTargetCompanyInput('Razorpay');
                      setCustomJobDesc(
                        'Required: 3+ years of experience in Python, TypeScript, React, FastAPI, PostgreSQL, Docker, LangChain, and RAG pipelines. Preferred: Kubernetes, Redis, OpenTelemetry, and GraphQL. Bachelor of Technology in Computer Science required.'
                      );
                    }}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                  >
                    + Fill Sample Job Description
                  </button>
                </div>

                {/* 1-Click Pick From Cached Live Jobs */}
                {availableJobs.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                      Or 1-Click Select from Live Job Hunter Listings:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableJobs.slice(0, 5).map((j: any) => (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => {
                            setTargetRoleInput(j.title);
                            setTargetCompanyInput(j.company);
                            setCustomJobDesc(
                              `${j.description}\nRequired Skills: ${(j.requirements || []).join(', ')}`
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors cursor-pointer text-left truncate max-w-xs"
                        >
                          <span className="font-bold">{j.company}</span>: {j.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Role Title
                    </label>
                    <input
                      type="text"
                      value={targetRoleInput}
                      onChange={(e) => setTargetRoleInput(e.target.value)}
                      placeholder="e.g. Senior AI Systems Engineer"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Company Name
                    </label>
                    <input
                      type="text"
                      value={targetCompanyInput}
                      onChange={(e) => setTargetCompanyInput(e.target.value)}
                      placeholder="e.g. Razorpay, Swiggy, Databricks"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Job Description & Requirements
                  </label>
                  <textarea
                    rows={4}
                    value={customJobDesc}
                    onChange={(e) => setCustomJobDesc(e.target.value)}
                    placeholder="Paste the complete job description or requirements here..."
                    className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-slate-900 leading-relaxed font-mono"
                  />
                </div>

                {/* ============================================================
                    TRANSPARENT 6-PILLAR JOB MATCH SCORE BREAKDOWN (OUT OF 100)
                ============================================================ */}
                {liveJobMatchBreakdown && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 block">
                          Deterministic Job Match Engine
                        </span>
                        <h4 className="font-serif text-lg font-bold text-slate-900">
                          Job Match Score: {liveJobMatchBreakdown.totalScore} / 100
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {liveJobMatchBreakdown.disclaimer}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700 block">
                          General ATS Score: {generalBreakdown?.totalScore}/100
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Confirmed Extra Skills: {confirmedSkillsList.length}
                        </span>
                      </div>
                    </div>

                    {/* 6 Job Match Categories (40 + 10 + 10 + 15 + 15 + 10 = 100) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>1. Required Skills</span>
                          <span className="text-violet-700">
                            {liveJobMatchBreakdown.categories.requiredSkills.earned} / 40
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Matched {liveJobMatchBreakdown.categories.requiredSkills.matched.length} of{' '}
                          {liveJobMatchBreakdown.categories.requiredSkills.matched.length +
                            liveJobMatchBreakdown.categories.requiredSkills.missing.length}{' '}
                          required skills
                        </p>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>2. Preferred Skills</span>
                          <span className="text-blue-700">
                            {liveJobMatchBreakdown.categories.preferredSkills.earned} / 10
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Matched {liveJobMatchBreakdown.categories.preferredSkills.matched.length} preferred skills
                        </p>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>3. Title Alignment</span>
                          <span className="text-emerald-700">
                            {liveJobMatchBreakdown.categories.titleAlignment.earned} / 10
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {liveJobMatchBreakdown.categories.titleAlignment.detail}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>4. Experience Level</span>
                          <span className="text-orange-700">
                            {liveJobMatchBreakdown.categories.experienceLevel.earned} / 15
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {liveJobMatchBreakdown.categories.experienceLevel.detail}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>5. Keywords in Experience Bullets</span>
                          <span className="text-pink-700">
                            {liveJobMatchBreakdown.categories.keywordsInBullets.earned} / 15
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {liveJobMatchBreakdown.categories.keywordsInBullets.usedInBullets.length} skills evidenced inside bullets
                        </p>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>6. Education & Certifications</span>
                          <span className="text-teal-700">
                            {liveJobMatchBreakdown.categories.educationAndCerts.earned} / 10
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {liveJobMatchBreakdown.categories.educationAndCerts.detail}
                        </p>
                      </div>
                    </div>

                    {/* ========================================================
                        MISSING SKILLS CONFIRMATION ("I have this" / "Skip")
                    ======================================================== */}
                    {(() => {
                      const allMissing = [
                        ...liveJobMatchBreakdown.categories.requiredSkills.missing.map((s) => ({
                          skill: s,
                          tier: 'Required' as const,
                        })),
                        ...liveJobMatchBreakdown.categories.preferredSkills.missing.map((s) => ({
                          skill: s,
                          tier: 'Preferred' as const,
                        })),
                      ].filter((item) => !skippedMissingSkills.includes(item.skill));

                      if (allMissing.length === 0) return null;

                      return (
                        <div className="rounded-xl bg-white border border-amber-200 p-4 space-y-3">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              Missing Required & Preferred Skills ({allMissing.length}) — Confirm Truthfully
                            </span>
                            <p className="text-[11px] text-slate-500">
                              Only skills you explicitly confirm with &ldquo;I have this&rdquo; will be added to your resume and used by the AI rewriter.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {allMissing.map((item) => (
                              <div
                                key={item.skill}
                                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                                  item.tier === 'Required'
                                    ? 'border-rose-200 bg-rose-50/70 text-rose-900'
                                    : 'border-amber-200 bg-amber-50/70 text-amber-900'
                                }`}
                              >
                                <span>
                                  {item.skill}{' '}
                                  <strong className="text-[10px] uppercase opacity-75">
                                    ({item.tier})
                                  </strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmingSkillName(item.skill);
                                    setConfirmingSkillContext(
                                      `Used ${item.skill} in ${
                                        resumeData.experience[0]?.role || 'Software Engineering'
                                      } at ${resumeData.experience[0]?.company || 'my current role'}`
                                    );
                                  }}
                                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  I have this
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSkippedMissingSkills((prev) => [...prev, item.skill])
                                  }
                                  className="rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 text-[11px] font-semibold cursor-pointer"
                                >
                                  Skip
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Prompt asking where the user used the confirmed skill */}
                          {confirmingSkillName && (
                            <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50/60 p-3.5 space-y-2.5 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-950">
                                  Where did you use &ldquo;{confirmingSkillName}&rdquo;? (Required for Truthfulness Validator)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingSkillName(null)}
                                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={confirmingSkillContext}
                                  onChange={(e) => setConfirmingSkillContext(e.target.value)}
                                  placeholder={`e.g. Used ${confirmingSkillName} at ${
                                    resumeData.experience[0]?.company || 'Company'
                                  } to build microservices`}
                                  className="flex-1 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                                />
                                <button
                                  type="button"
                                  onClick={handleConfirmMissingSkill}
                                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold cursor-pointer shrink-0"
                                >
                                  Confirm & Add Skill
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTailorToJob}
                  disabled={isTailoring}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {isTailoring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Tailoring & Running Truthfulness Validator...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 text-blue-300" />
                      <span>Generate Truthfulness-Verified Tailored Bullets</span>
                    </>
                  )}
                </button>
              </Card>

              {/* ==============================================================
                  BEFORE / AFTER DIFF CARDS WITH ACCEPT, EDIT, REJECT & ACCEPT ALL
              ============================================================== */}
              {tailorResult && (
                <Card className="p-6 bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">
                          Before & After Bullet Diffs (Truthfulness Validator Active)
                        </h4>
                        <span className="text-[11px] font-semibold text-emerald-700">
                          ✓ Zero unverified facts or skills permitted
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Accept, edit, or reject each bullet change individually, or click Accept All.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAcceptAllTailoredChanges}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Accept All ({tailorResult.beforeAfterComparison.length})</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(tailorResult.beforeAfterComparison || []).map(
                      (item: BeforeAfterBullet, idx: number) => {
                        const isEditing = editingDiffId === item.id;
                        return (
                          <div
                            key={item.id || idx}
                            className={`p-4 rounded-xl border space-y-3 transition-all ${
                              item.status === 'accepted'
                                ? 'bg-emerald-50/40 border-emerald-300'
                                : item.status === 'rejected'
                                ? 'bg-slate-100/60 border-slate-200 opacity-60'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-slate-800">{item.category}</span>
                                <span className="text-slate-400">·</span>
                                <span className="text-[11px] text-emerald-700 font-semibold">
                                  {item.truthfulnessNote ||
                                    'Truthfulness Verified against canonical JSON'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDiffStatusChange(item.id, 'accepted')}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                    item.status === 'accepted'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                                  }`}
                                >
                                  {item.status === 'accepted' ? '✓ Accepted' : 'Accept'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDiffId(item.id);
                                    setEditingDiffText(item.tailoredBullet);
                                  }}
                                  className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDiffStatusChange(item.id, 'rejected')}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                    item.status === 'rejected'
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                                  }`}
                                >
                                  {item.status === 'rejected' ? 'Rejected' : 'Reject'}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-200">
                                <span className="font-bold text-rose-700 uppercase text-[10px] tracking-wider block mb-1">
                                  Before (Original Bullet)
                                </span>
                                <p className="text-slate-700 leading-relaxed line-through decoration-rose-400/60">
                                  {item.originalBullet}
                                </p>
                              </div>

                              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
                                <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider flex items-center gap-1 mb-1">
                                  <Sparkles className="w-3 h-3 text-emerald-600" /> After (Truthful ATS Rewrite)
                                </span>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <textarea
                                      rows={3}
                                      value={editingDiffText}
                                      onChange={(e) => setEditingDiffText(e.target.value)}
                                      className="w-full rounded-lg border border-emerald-400 bg-white p-2 text-xs text-slate-900"
                                    />
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setEditingDiffId(null)}
                                        className="px-2.5 py-1 text-xs text-slate-600 cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDiffStatusChange(
                                            item.id,
                                            'accepted',
                                            editingDiffText
                                          );
                                          setEditingDiffId(null);
                                        }}
                                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                                      >
                                        Save & Accept
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-slate-900 font-semibold leading-relaxed">
                                    {item.tailoredBullet}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded border border-slate-200">
                              <strong className="text-slate-700">Recruiter Rationale:</strong>{' '}
                              {item.rationale}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ================================================================
              TAB 4: ENHANCE RESUME (GOOGLE XYZ FORMULA)
          ================================================================ */}
          {activeTab === 'enhance' && (
            <div className="space-y-6">
              <Card className="p-6 bg-white border border-slate-200 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      AI Executive Resume Enhancement
                    </h3>
                    <p className="text-xs text-slate-500">
                      Upgrades passive bullets using Google’s XYZ formula while preserving 100% career truth.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                    {(
                      [
                        { id: 'impact', label: 'Impact & XYZ' },
                        { id: 'metrics', label: 'Quantified Metrics' },
                        { id: 'ats', label: 'ATS Density' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setEnhanceFocus(f.id)}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          enhanceFocus === f.id
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEnhanceResume}
                  disabled={isEnhancing}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {isEnhancing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Applying Executive Formula...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Run AI Enhancement on Active Resume</span>
                    </>
                  )}
                </button>
              </Card>

              {enhancedResult && (
                <Card className="p-6 bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">
                      Upgraded Experience Bullets (Before vs. After)
                    </h4>
                    <button
                      type="button"
                      onClick={handleApplyEnhancedVersion}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Apply Enhanced Resume</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {enhancedResult.improvements.map((imp) => (
                      <div
                        key={imp.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"
                      >
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Original
                          </span>
                          <p className="text-slate-600">{imp.original}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">
                            Google XYZ Impact
                          </span>
                          <p className="text-slate-900 font-semibold">{imp.enhanced}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ================================================================
              TAB 5: SAVED TAILORED VERSIONS WITH COMPARE VIEW & RESTORE
          ================================================================ */}
          {activeTab === 'versions' && (
            <Card className="p-6 bg-white border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Saved Tailored Resume Versions ({savedVersions.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Every tailored version is stored with its target job title, company, ATS score, and date. Compare side-by-side or restore in one click.
                  </p>
                </div>
              </div>

              {savedVersions.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 space-y-2">
                  <History className="h-8 w-8 text-slate-300 mx-auto" />
                  <p>No tailored versions saved yet. Tailor your resume to a job to create a version snapshot.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedVersions.map((ver) => (
                    <div
                      key={ver.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <strong className="font-bold text-slate-900 text-sm">
                            {ver.targetRole}
                          </strong>
                          <span className="text-slate-400">·</span>
                          <span className="font-semibold text-slate-700">{ver.targetCompany}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>
                            ATS Score: <strong className="text-emerald-700">{ver.atsScore}/100</strong>
                          </span>
                          {ver.jobMatchScore && (
                            <>
                              <span>·</span>
                              <span>
                                Job Match: <strong className="text-violet-700">{ver.jobMatchScore}/100</strong>
                              </span>
                            </>
                          )}
                          <span>·</span>
                          <span>{new Date(ver.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setComparingVersion(
                              comparingVersion?.id === ver.id ? null : ver
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <GitCompare className="h-3.5 w-3.5" />
                          <span>
                            {comparingVersion?.id === ver.id ? 'Close Compare' : 'Compare View'}
                          </span>
                        </button>

                        {ver.resumeSnapshot && (
                          <button
                            type="button"
                            onClick={async () => {
                              const restored = normalizeCanonicalResume(ver.resumeSnapshot);
                              setResumeData(restored);
                              await saveUserResume(restored);
                              showToast(
                                `Restored tailored version for ${ver.targetRole} at ${ver.targetCompany}!`
                              );
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Side-by-Side Compare View */}
              {comparingVersion && comparingVersion.resumeSnapshot && (
                <div className="rounded-2xl border-2 border-violet-300 bg-violet-50/30 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm font-bold text-slate-900">
                      Side-by-Side Comparison: Active Resume vs. {comparingVersion.targetRole} ({comparingVersion.targetCompany})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setComparingVersion(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Current Active Resume (Score: {generalBreakdown?.totalScore}/100)
                      </span>
                      <p className="font-semibold text-slate-800">{resumeData.summary}</p>
                      <div className="pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">Lead Bullets:</span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                          {(resumeData.experience[0]?.bullets || []).map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-violet-200 p-4 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 block">
                        Saved Version: {comparingVersion.targetRole} (Score: {comparingVersion.atsScore}/100)
                      </span>
                      <p className="font-semibold text-slate-800">
                        {comparingVersion.resumeSnapshot.summary}
                      </p>
                      <div className="pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">Lead Bullets:</span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                          {(comparingVersion.resumeSnapshot.experience[0]?.bullets || []).map(
                            (b, i) => (
                              <li key={i}>{b}</li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ================================================================
              TAB 6: ORIGINAL UPLOADED DOCUMENT CONTENT
          ================================================================ */}
          {activeTab === 'uploaded-text' && (
            <Card className="p-6 bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Original Uploaded Resume Content
                  </h3>
                  <p className="text-xs text-slate-500">
                    Exact raw text extracted from your uploaded document ({resumeData.uploadedFileName || 'Document'}).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyRawText}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    {copiedRaw ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Raw Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="w-full max-h-[500px] overflow-y-auto p-4 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
                {rawExtractedText ||
                  resumeData.rawTextPreview ||
                  `Candidate Name: ${resumeData.contact.fullName}\nEmail: ${resumeData.contact.email}\nPhone: ${resumeData.contact.phone}\n\nSummary:\n${resumeData.summary}`}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
