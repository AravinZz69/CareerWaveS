export interface ResumeContact {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking?: boolean;
  duration: string;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  role?: string;
  techStack: string[];
  link?: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  year: string;
  gpa?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export type ResumeSectionId =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications';

export interface ConfirmedUserSkill {
  skill: string;
  whereUsed: string;
  confirmedAt: string;
}

export type AtsTemplateId =
  | 'classic-exec'
  | 'modern-minimal'
  | 'tech-standard'
  | 'harvard-clean'
  | 'compact-tech'
  | 'silicon-valley'
  | 'wall-street'
  | 'stanford-eng'
  | 'modern-monochrome';

export interface StructuredResumeData {
  id?: string;
  contact: ResumeContact;
  summary: string;
  skills: {
    languages: string[];
    frameworks: string[];
    cloudAndDevOps: string[];
    aiAndData: string[];
  };
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  sectionOrder?: ResumeSectionId[];
  confirmedSkills?: ConfirmedUserSkill[];
  templateId: AtsTemplateId;
  atsScore?: number;
  uploadedFileName?: string;
  uploadedFileSize?: string;
  uploadedAt?: string;
  rawTextPreview?: string;
}

export interface AtsScoreDeduction {
  id: string;
  category: 'parsability' | 'structure' | 'contentQuality' | 'completeness';
  pointsLost: number;
  reason: string;
  fixable: boolean;
  fixType?:
    | 'remove-pronouns'
    | 'remove-filler-words'
    | 'strengthen-action-verbs'
    | 'add-metrics'
    | 'standardize-dates'
    | 'standardize-section-order'
    | 'fill-summary'
    | 'fill-linkedin'
    | 'fill-phone-location'
    | 'trim-bullet-length';
  targetSection?: ResumeSectionId | 'contact';
  targetIndex?: number;
}

export interface GeneralAtsScoreBreakdown {
  totalScore: number; // out of 100
  disclaimer: string;
  categories: {
    parsability: { earned: number; max: 35; details: string[] };
    structure: { earned: number; max: 20; details: string[] };
    contentQuality: { earned: number; max: 25; details: string[] };
    completeness: { earned: number; max: 20; details: string[] };
  };
  deductions: AtsScoreDeduction[];
  completenessPercent: number;
  checklist: {
    label: string;
    passed: boolean;
    section: ResumeSectionId | 'contact';
  }[];
}

export interface JobRequirementsSchema {
  title: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  yearsOfExperience: number;
  education: string[];
  certifications: string[];
}

export interface JobMatchDeduction {
  id: string;
  category:
    | 'requiredSkills'
    | 'preferredSkills'
    | 'titleAlignment'
    | 'experienceLevel'
    | 'keywordsInBullets'
    | 'educationAndCerts';
  pointsLost: number;
  reason: string;
  missingSkill?: string;
  fixable: boolean;
}

export interface JobMatchScoreBreakdown {
  totalScore: number; // out of 100
  disclaimer: string;
  categories: {
    requiredSkills: { earned: number; max: 40; matched: string[]; missing: string[] };
    preferredSkills: { earned: number; max: 10; matched: string[]; missing: string[] };
    titleAlignment: { earned: number; max: 10; detail: string };
    experienceLevel: { earned: number; max: 15; candidateYears: number; requiredYears: number; detail: string };
    keywordsInBullets: { earned: number; max: 15; usedInBullets: string[]; onlyInSkillsList: string[] };
    educationAndCerts: { earned: number; max: 10; detail: string };
  };
  deductions: JobMatchDeduction[];
  jobRequirements: JobRequirementsSchema;
}

export interface TruthfulnessValidationResult {
  valid: boolean;
  violations: string[];
  sanitizedText: string;
}

export interface BeforeAfterBullet {
  id: string;
  category: string;
  expIndex?: number;
  bulletIndex?: number;
  originalBullet: string;
  tailoredBullet: string;
  rationale: string;
  truthfulnessVerified?: boolean;
  truthfulnessNote?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'edited';
}

export interface TailoredResumeResult {
  atsScore: number;
  jobMatchScore?: number;
  generalScoreBreakdown?: GeneralAtsScoreBreakdown;
  jobMatchBreakdown?: JobMatchScoreBreakdown;
  jobRequirements?: JobRequirementsSchema;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingRequiredSkills?: string[];
  missingPreferredSkills?: string[];
  tailoredSummary: string;
  tailoredSkills: {
    languages: string[];
    frameworks: string[];
    cloudAndDevOps: string[];
    aiAndData: string[];
  };
  tailoredExperience: ExperienceItem[];
  beforeAfterComparison: BeforeAfterBullet[];
}

export interface SavedTailoredVersion {
  id: string;
  targetRole: string;
  targetCompany: string;
  atsScore: number;
  jobMatchScore?: number;
  createdAt: string;
  jobDescription?: string;
  resumeSnapshot?: StructuredResumeData;
}

export interface AtsReadabilityVerificationReport {
  format: 'PDF' | 'DOCX';
  verifiedAt: string;
  extractedCharCount: number;
  recomputedAtsScore: number;
  scoreBreakdown: GeneralAtsScoreBreakdown;
  detectedHeadings: {
    heading: string;
    detected: boolean;
  }[];
  detectedSkills: string[];
  missingSkillsFromExport: string[];
  passedAllChecks: boolean;
}

export interface EnhancedResumeResult {
  atsScore: number;
  enhancedSummary: string;
  enhancedSkills: {
    languages: string[];
    frameworks: string[];
    cloudAndDevOps: string[];
    aiAndData: string[];
  };
  enhancedExperience: ExperienceItem[];
  enhancedProjects: ProjectItem[];
  improvements: {
    id: string;
    section: string;
    original: string;
    enhanced: string;
    rationale: string;
  }[];
  summaryOfEnhancements: string;
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  remote: boolean;
  sector: 'FinTech' | 'IT Services' | 'Enterprise AI' | 'GenAI' | 'Analytics' | 'Software';
  job_type: 'Full-time' | 'Internship' | 'Contract';
  salary_min: number;
  salary_max: number;
  posted_at: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  tags: string[];
  matchScore: number;
  matchGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  matchReasons: string[];
  missingSkills: string[];
  saved?: boolean;
  applied?: boolean;
}

export interface ApplicationKitData {
  emailDraft: {
    subject: string;
    recipientRole: string;
    body: string;
  };
  coverLetter: {
    salutation: string;
    body: string;
    closing: string;
  };
  interviewQuestions: {
    technical: {
      question: string;
      difficulty: 'Medium' | 'Hard';
      keyConcepts: string[];
      idealApproach: string;
    }[];
    hr: {
      question: string;
      framework: 'STAR';
      whatRecruiterLooksFor: string;
      samplePoints: string[];
    }[];
  };
  topicsToPrepare: {
    priority: 'High' | 'Medium';
    topic: string;
    category: string;
    summary: string;
  }[];
}

export interface JobNotification {
  id: string;
  title: string;
  message: string;
  jobId: string;
  company: string;
  timeAgo: string;
  isRead: boolean;
  matchScore: number;
}
