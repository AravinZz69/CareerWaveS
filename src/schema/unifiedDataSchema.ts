/**
 * ============================================================================
 * CAREERWAVE — UNIFIED SINGLE-FILE DATA SCHEMA & MULTI-CLOUD PORTABILITY ENGINE
 * ============================================================================
 * Canonical single source of truth for:
 *   1. All TypeScript Data Models & Interfaces (Users, Auth, SaaS Plans, Billing,
 *      Invoices, Multi-Gateway Payments, Resumes, ATS Scoring, Live Jobs,
 *      Applications, Roadmaps, Courses, Mock Interviews, Portfolios, Admin Governance)
 *   2. Canonical 27-Table Relational Schema Specification (`UNIFIED_SCHEMA_TABLES`)
 *   3. Default Seed Data for Zero-Fail Bootstrapping on Fresh Servers
 *   4. Multi-Cloud Portable SQL DDL & Data Dump Generators:
 *      - Hostinger (MySQL 8.0 / MariaDB InnoDB `utf8mb4`)
 *      - AWS (RDS / Aurora PostgreSQL 15+ / Supabase compatible)
 *      - Portable SQLite 3 (AWS Lightsail / EC2 / Docker / Node VPS)
 *      - Full JSON State Snapshot (1-click export & restore across clouds)
 * ============================================================================
 */

// ============================================================================
// 1. CORE SAAS & AUTHENTICATION TYPES
// ============================================================================
export type AppRole = 'admin' | 'user';
export type UserStatus = 'active' | 'suspended';
export type PlanName = 'Free' | 'Pro' | 'Premium';

export type UsageFeature =
  | 'resume_tailoring'
  | 'ai_job_match'
  | 'mock_interview'
  | 'linkedin_generation'
  | 'portfolio_generation';

export interface FeatureLimits {
  resume_tailoring: number;
  ai_job_match: number;
  mock_interview: number;
  linkedin_generation: number;
  portfolio_generation: number;
}

export interface UsageMeter {
  used: number;
  baseLimit: number;
  bonusCredits: number;
  totalLimit: number;
  percent: number;
  nearLimit: boolean;
  exceeded: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  title: string;
  target_role: string;
  years_of_exp: number;
  location: string;
  skills: string[];
  role?: AppRole;
  status?: UserStatus;
  plan?: PlanName;
  bio?: string;
  experience_level?: string;
  career_track?: string;
  education_or_company?: string;
  work_preference?: string;
  career_goal?: string;
  onboarding_completed?: boolean;
  created_at?: string;
}

export interface PlanRecord {
  id: string;
  name: PlanName;
  price_monthly: number;
  price_yearly: number;
  billing_interval: 'month' | 'year';
  feature_limits: FeatureLimits;
  is_active: boolean;
  description?: string;
  badge?: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  plan_id: string;
  plan_name: PlanName;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  billing_interval: 'month' | 'year';
  current_period_end: string;
  provider_customer_id: string;
  provider_subscription_id: string;
  bonus_credits?: Partial<FeatureLimits>;
  created_at: string;
}

export interface InvoiceRecord {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subscription_id: string;
  plan_name: PlanName;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'failed' | 'void';
  provider_invoice_id: string;
  invoice_pdf_url: string;
  created_at: string;
}

export interface UsageEventRecord {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  feature: UsageFeature;
  tokens_in: number;
  tokens_out: number;
  estimated_cost: number;
  timestamp: string;
}

export interface FeatureFlagRecord {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  allowed_plans: PlanName[];
  updated_at: string;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface TicketMessageRecord {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'user' | 'admin';
  message: string;
  created_at: string;
}

export interface SupportTicketRecord {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_plan: PlanName;
  subject: string;
  category: 'billing' | 'technical' | 'ai_quality' | 'account';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  messages: TicketMessageRecord[];
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'promo' | 'maintenance';
  target_plan: 'all' | PlanName;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// 2. MULTI-GATEWAY PAYMENT SYSTEM TYPES (RAZORPAY, CASHFREE, DIRECT UPI)
// ============================================================================
export type PaymentGatewayName = 'razorpay' | 'cashfree' | 'upi';
export type PaymentEnvironment = 'sandbox' | 'live';
export type PaymentOrderStatus = 'created' | 'pending' | 'paid' | 'failed';

export interface RazorpayCredentials {
  key_id: string;
  key_secret: string;
  webhook_secret?: string;
}

export interface CashfreeCredentials {
  app_id: string;
  secret_key: string;
  webhook_secret?: string;
}

export interface UpiCredentials {
  vpa: string;
  merchant_name: string;
  mcc: string;
}

export type GatewayCredentialsMap = {
  razorpay: RazorpayCredentials;
  cashfree: CashfreeCredentials;
  upi: UpiCredentials;
};

export interface PaymentGatewayConfig<K extends PaymentGatewayName = PaymentGatewayName> {
  id: string;
  gateway_name: K;
  display_name: string;
  description: string;
  is_active: boolean;
  environment: PaymentEnvironment;
  credentials: GatewayCredentialsMap[K];
  updated_at: string;
  updated_by: string;
}

export interface PublicActiveGateway {
  gateway_name: PaymentGatewayName;
  display_name: string;
  description: string;
  environment: PaymentEnvironment;
  public_config: {
    key_id?: string;
    app_id?: string;
    vpa?: string;
    merchant_name?: string;
    mcc?: string;
  };
}

export interface PaymentOrderRecord {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_name: 'Free' | 'Pro' | 'Premium';
  billing_interval: 'month' | 'year';
  amount: number;
  currency: string;
  gateway_name: PaymentGatewayName;
  environment: PaymentEnvironment;
  provider_order_id: string;
  provider_payment_id?: string;
  upi_uri?: string;
  utr_number?: string;
  status: PaymentOrderStatus;
  webhook_event?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckoutInitResponse {
  success: boolean;
  gateway_name: PaymentGatewayName;
  environment: PaymentEnvironment;
  order: PaymentOrderRecord;
  razorpay?: {
    key_id: string;
    order_id: string;
    amount_paise: number;
    currency: string;
    merchant_name: string;
    live_api_called: boolean;
  };
  cashfree?: {
    app_id: string;
    cf_order_id: string;
    payment_session_id: string;
    amount: number;
    currency: string;
    environment: PaymentEnvironment;
    live_api_called: boolean;
  };
  upi?: {
    vpa: string;
    merchant_name: string;
    mcc: string;
    upi_uri: string;
    amount: number;
    currency: string;
    transaction_ref: string;
  };
}

// ============================================================================
// 3. RESUME, ATS SCORING & APPLICATION KIT TYPES
// ============================================================================
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
  totalScore: number;
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
  totalScore: number;
  disclaimer: string;
  categories: {
    requiredSkills: { earned: number; max: 40; matched: string[]; missing: string[] };
    preferredSkills: { earned: number; max: 10; matched: string[]; missing: string[] };
    titleAlignment: { earned: number; max: 10; detail: string };
    experienceLevel: {
      earned: number;
      max: 15;
      candidateYears: number;
      requiredYears: number;
      detail: string;
    };
    keywordsInBullets: {
      earned: number;
      max: 15;
      usedInBullets: string[];
      onlyInSkillsList: string[];
    };
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

// ============================================================================
// 4. MULTI-SOURCE LIVE JOBS & WORKSPACE RECORD TYPES
// ============================================================================
export type SourcePlatform =
  | 'LinkedIn'
  | 'Indeed'
  | 'Apna'
  | 'Naukri'
  | 'Google'
  | 'Adzuna'
  | 'Jooble'
  | 'Company Site';

export type EmploymentType = 'internship' | 'full-time' | 'part-time' | 'contract';
export type JobDateWindow = '24h' | '72h' | '7d' | 'all';
export type JobSortOption = 'best_match' | 'newest' | 'salary';
export type MatchGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';

export interface NormalizedJob {
  id: string;
  external_id: string;
  title: string;
  company: string;
  company_logo: string;
  location: string;
  is_remote: boolean;
  remote?: boolean;
  employment_type: EmploymentType;
  job_type?: string;
  type?: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  salary_range?: string;
  description: string;
  responsibilities?: string[];
  required_skills: string[];
  requirements?: string[];
  posted_at: string;
  apply_url: string;
  source_platform: SourcePlatform;
  source?: string;
  sector: string;
  fetched_at: string;
  tags?: string[];
  hasResume?: boolean;
  matchScore?: number | null;
  matchGrade?: MatchGrade | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  matchReasons?: string[];
}

export interface JobFetchInput {
  query?: string;
  role?: string;
  location?: string;
  remote?: boolean;
  dateWindow?: JobDateWindow;
  timeframe?: JobDateWindow;
  sector?: string;
  employmentType?: EmploymentType | 'all';
  sourcePlatform?: SourcePlatform | 'All';
  page?: number;
  pageSize?: number;
  forceRefresh?: boolean;
  resume?: any;
}

export interface SourceFetchDiag {
  source: 'jsearch' | 'adzuna' | 'jooble' | 'cache';
  configured: boolean;
  ok: boolean;
  count: number;
  error?: string;
  latencyMs?: number;
}

export interface JobFetchResponse {
  success: boolean;
  jobs: NormalizedJob[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  hasResume: boolean;
  fromCache: boolean;
  cachedAt: string;
  sources: SourceFetchDiag[];
  partialFailure: boolean;
  partialFailureMessage?: string;
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  title: string;
  file_url: string;
  ats_score: number;
  parsed_skills: string[];
  created_at: string;
}

export interface TailoredResumeRecord {
  id: string;
  user_id: string;
  resume_id: string;
  job_id?: string;
  target_role: string;
  target_company: string;
  tailored_summary: string;
  tailored_bullets: string[];
  match_score: number;
  created_at: string;
}

export interface JobRecord {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  job_type?: string;
  type?: 'Full-Time' | 'Internship' | 'Remote' | 'Contract';
  experience_level?: string;
  salary_min: number;
  salary_max: number;
  salary_range?: string;
  description: string;
  requirements: string[];
  match_percentage?: number;
  match_score?: number;
  posted_at?: string;
  created_at?: string;
  is_active?: boolean;
  tags: string[];
  track?: string;
}

export interface JobMatchRecord {
  id: string;
  user_id: string;
  job_id: string;
  match_score: number;
  missing_skills: string[];
  matched_skills: string[];
  created_at: string;
}

export interface ApplicationRecord {
  id: string;
  user_id: string;
  job_id?: string;
  company: string;
  position: string;
  status: 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  applied_date: string;
  interview_date?: string;
  notes?: string;
  salary_offered?: number;
  salary?: string;
  logo?: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'match' | 'application' | 'course' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface RoadmapRecord {
  id: string;
  user_id: string;
  title?: string;
  track_name?: string;
  category?: string;
  description?: string;
  target_role?: string;
  total_steps?: number;
  completed_steps?: number;
  progress_percent?: number;
  milestones: {
    id?: string;
    title: string;
    status?: 'completed' | 'in-progress' | 'locked';
    completed?: boolean;
    duration: string;
    skills?: string[];
    resourcesCount?: number;
  }[];
}

export interface RecommendedProjectRecord {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tech_stack: string[];
  estimated_hours: number;
  description: string;
  badge?: 'Popular' | 'Trending' | 'Bestseller';
}

export interface CourseRecord {
  id: string;
  title: string;
  instructor: string;
  instructor_role?: string;
  rating: number;
  students_count: number | string;
  duration?: string;
  duration_hours?: number;
  level: string;
  badge?: 'Bestseller' | 'Popular' | 'Trending' | string;
  image_url?: string;
  thumbnail?: string;
  track?: string;
  price: number | string;
  enrolled?: boolean;
  progress?: number;
}

export interface EnrollmentRecord {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
  last_accessed: string;
}

export interface QuizAttemptRecord {
  id: string;
  user_id: string;
  course_id: string;
  quiz_title: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}

export interface CertificateRecord {
  id: string;
  user_id: string;
  course_id: string;
  certificate_title: string;
  credential_code: string;
  issued_at: string;
}

export interface MockInterviewRecord {
  id: string;
  user_id: string;
  target_role: string;
  interview_type: 'Technical' | 'Behavioral' | 'System Design';
  overall_score: number;
  confidence_score: number;
  feedback_summary: string;
  completed_at: string;
}

export interface PortfolioRecord {
  id: string;
  user_id: string;
  slug: string;
  theme: string;
  is_published: boolean;
  public_url: string;
  views_count: number;
}

// ============================================================================
// 5. UNIFIED 27-TABLE RELATIONAL SCHEMA REGISTRY (`UNIFIED_SCHEMA_TABLES`)
// ============================================================================
export interface SchemaColumnSpec {
  name: string;
  postgresType: string;
  mysqlType: string;
  sqliteType: string;
  nullable?: boolean;
  defaultSql?: string;
  primaryKey?: boolean;
}

export interface SchemaTableSpec {
  tableName: string;
  domain: 'Identity & Auth' | 'SaaS Billing & Payments' | 'Career & ATS Workspace' | 'Learning & Portfolio' | 'Admin Governance';
  description: string;
  columns: SchemaColumnSpec[];
  uniqueKeys?: string[][];
  indexes?: string[][];
}

export const UNIFIED_SCHEMA_TABLES: SchemaTableSpec[] = [
  {
    tableName: 'profiles',
    domain: 'Identity & Auth',
    description: 'Core user identity, onboarding profile, target role, skills, and active subscription tier.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'email', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'password_hash', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT', nullable: true },
      { name: 'full_name', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', defaultSql: "''" },
      { name: 'avatar_url', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT', defaultSql: "''" },
      { name: 'title', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', defaultSql: "''" },
      { name: 'target_role', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', defaultSql: "''" },
      { name: 'years_of_exp', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'location', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', defaultSql: "'India'" },
      { name: 'bio', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT', defaultSql: "''" },
      { name: 'skills', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'role', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'user'" },
      { name: 'status', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'active'" },
      { name: 'plan', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'Free'" },
      { name: 'bonus_credits', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
      { name: 'updated_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['email']],
    indexes: [['role'], ['plan']],
  },
  {
    tableName: 'user_roles',
    domain: 'Identity & Auth',
    description: 'Role-Based Access Control (RBAC) assignments for user and super-admin permissions.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'role', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'user'" },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['user_id', 'role']],
  },
  {
    tableName: 'plans',
    domain: 'SaaS Billing & Payments',
    description: 'SaaS subscription tiers (Free, Pro, Premium) with INR pricing and monthly feature quotas.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'name', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', nullable: false },
      { name: 'price_monthly', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'price_yearly', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'billing_interval', postgresType: 'VARCHAR(16)', mysqlType: 'VARCHAR(16)', sqliteType: 'TEXT', defaultSql: "'month'" },
      { name: 'feature_limits', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'is_active', postgresType: 'BOOLEAN', mysqlType: 'TINYINT(1)', sqliteType: 'INTEGER', defaultSql: '1' },
      { name: 'description', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT', defaultSql: "''" },
      { name: 'badge', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', nullable: true },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['name']],
  },
  {
    tableName: 'subscriptions',
    domain: 'SaaS Billing & Payments',
    description: 'Active user subscriptions, billing cycle dates, and bonus AI credits.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'user_email', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'user_name', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'plan_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT' },
      { name: 'plan_name', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', defaultSql: "'Free'" },
      { name: 'status', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'active'" },
      { name: 'billing_interval', postgresType: 'VARCHAR(16)', mysqlType: 'VARCHAR(16)', sqliteType: 'TEXT', defaultSql: "'month'" },
      { name: 'current_period_end', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
      { name: 'provider_customer_id', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'provider_subscription_id', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'bonus_credits', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    indexes: [['user_id']],
  },
  {
    tableName: 'invoices',
    domain: 'SaaS Billing & Payments',
    description: 'Tax & subscription payment invoices supporting 1-click PDF invoice generation.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'user_email', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'user_name', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'subscription_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT' },
      { name: 'plan_name', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', defaultSql: "'Pro'" },
      { name: 'amount', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'currency', postgresType: 'VARCHAR(16)', mysqlType: 'VARCHAR(16)', sqliteType: 'TEXT', defaultSql: "'INR'" },
      { name: 'status', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'paid'" },
      { name: 'provider_invoice_id', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'invoice_pdf_url', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    indexes: [['user_id'], ['created_at']],
  },
  {
    tableName: 'payment_gateways',
    domain: 'SaaS Billing & Payments',
    description: 'Dynamic Super-Admin multi-gateway payment configurations (Razorpay, Cashfree, Direct UPI).',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'gateway_name', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', nullable: false },
      { name: 'display_name', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'description', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'is_active', postgresType: 'BOOLEAN', mysqlType: 'TINYINT(1)', sqliteType: 'INTEGER', defaultSql: '1' },
      { name: 'environment', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'sandbox'" },
      { name: 'credentials', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'updated_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
      { name: 'updated_by', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['gateway_name']],
  },
  {
    tableName: 'payment_orders',
    domain: 'SaaS Billing & Payments',
    description: 'Dynamic checkout orders and webhook verification ledger across Razorpay, Cashfree & UPI.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'user_email', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'user_name', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'plan_name', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT' },
      { name: 'billing_interval', postgresType: 'VARCHAR(16)', mysqlType: 'VARCHAR(16)', sqliteType: 'TEXT', defaultSql: "'month'" },
      { name: 'amount', postgresType: 'NUMERIC(12,2)', mysqlType: 'DECIMAL(12,2)', sqliteType: 'REAL', defaultSql: '0' },
      { name: 'currency', postgresType: 'VARCHAR(16)', mysqlType: 'VARCHAR(16)', sqliteType: 'TEXT', defaultSql: "'INR'" },
      { name: 'gateway_name', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT' },
      { name: 'environment', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'sandbox'" },
      { name: 'provider_order_id', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'provider_payment_id', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'upi_uri', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'utr_number', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT' },
      { name: 'status', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'created'" },
      { name: 'webhook_event', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
      { name: 'updated_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    indexes: [['user_id'], ['status']],
  },
  {
    tableName: 'usage_events',
    domain: 'SaaS Billing & Payments',
    description: 'AI token & feature usage metering events for quota enforcement.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'user_email', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'user_name', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'feature', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', nullable: false },
      { name: 'tokens_in', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'tokens_out', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'estimated_cost', postgresType: 'NUMERIC(10,4)', mysqlType: 'DECIMAL(10,4)', sqliteType: 'REAL', defaultSql: '0' },
      { name: 'timestamp', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    indexes: [['user_id', 'feature']],
  },
  {
    tableName: 'resumes',
    domain: 'Career & ATS Workspace',
    description: 'Master canonical resumes, structured sections, and deterministic ATS scores.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'title', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', defaultSql: "'Primary Resume'" },
      { name: 'file_name', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'raw_text', postgresType: 'TEXT', mysqlType: 'LONGTEXT', sqliteType: 'TEXT' },
      { name: 'parsed_data', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'parsed_skills', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'ats_score', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'template_id', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', defaultSql: "'classic-exec'" },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
      { name: 'updated_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    indexes: [['user_id']],
  },
  {
    tableName: 'tailored_resumes',
    domain: 'Career & ATS Workspace',
    description: 'Job-specific tailored resume snapshots with truthfulness-verified bullet diffs.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'target_role', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'target_company', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'job_description', postgresType: 'TEXT', mysqlType: 'LONGTEXT', sqliteType: 'TEXT' },
      { name: 'ats_score', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'job_match_score', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'resume_snapshot', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    indexes: [['user_id']],
  },
  {
    tableName: 'jobs',
    domain: 'Career & ATS Workspace',
    description: 'Multi-source live jobs & Admin daily Excel/Sheets job and internship postings.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'source', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', defaultSql: "'jsearch'" },
      { name: 'external_id', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'title', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'company', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'company_logo', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'location', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', defaultSql: "'India'" },
      { name: 'is_remote', postgresType: 'BOOLEAN', mysqlType: 'TINYINT(1)', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'employment_type', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'full-time'" },
      { name: 'salary_min', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', nullable: true },
      { name: 'salary_max', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', nullable: true },
      { name: 'currency', postgresType: 'VARCHAR(16)', mysqlType: 'VARCHAR(16)', sqliteType: 'TEXT', defaultSql: "'INR'" },
      { name: 'salary_range', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT' },
      { name: 'description', postgresType: 'TEXT', mysqlType: 'LONGTEXT', sqliteType: 'TEXT' },
      { name: 'required_skills', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'tags', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'sector', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', defaultSql: "'Software'" },
      { name: 'apply_url', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'source_platform', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', defaultSql: "'Company Site'" },
      { name: 'posted_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
      { name: 'fetched_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['source', 'external_id']],
    indexes: [['sector'], ['source_platform'], ['employment_type'], ['posted_at']],
  },
  {
    tableName: 'job_query_cache',
    domain: 'Career & ATS Workspace',
    description: '30-minute query deduplication cache for multi-source job aggregators (JSearch, Adzuna, Jooble).',
    columns: [
      { name: 'query_hash', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'query_params', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'job_ids', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'sources_status', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'fetched_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
  },
  {
    tableName: 'job_matches',
    domain: 'Career & ATS Workspace',
    description: 'Per-user deterministic & AI job match scores, A-F grades, and Application Kits.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'job_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'match_score', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'match_grade', postgresType: 'VARCHAR(8)', mysqlType: 'VARCHAR(8)', sqliteType: 'TEXT', defaultSql: "'B'" },
      { name: 'matched_skills', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'missing_skills', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'application_kit', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['user_id', 'job_id']],
  },
  {
    tableName: 'applications',
    domain: 'Career & ATS Workspace',
    description: 'Kanban job application pipeline tracker with external apply_url and status history.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'job_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: true },
      { name: 'company', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'position', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'location', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', defaultSql: "'India'" },
      { name: 'status', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'applied'" },
      { name: 'match_grade', postgresType: 'VARCHAR(8)', mysqlType: 'VARCHAR(8)', sqliteType: 'TEXT', defaultSql: "'A'" },
      { name: 'apply_url', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'source_platform', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT' },
      { name: 'notes', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'applied_date', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    indexes: [['user_id']],
  },
  {
    tableName: 'roadmaps',
    domain: 'Learning & Portfolio',
    description: 'Personalized AI skill-gap career roadmaps and milestone progress.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'title', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'target_role', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'milestones', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'progress_percent', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
  },
  {
    tableName: 'projects',
    domain: 'Learning & Portfolio',
    description: 'Recommended & user-built portfolio projects closing target skill gaps.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'title', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'difficulty', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'Intermediate'" },
      { name: 'tech_stack', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'description', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
  },
  {
    tableName: 'courses',
    domain: 'Learning & Portfolio',
    description: 'Interactive technical courses, modules, video lessons, and certification quizzes.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'slug', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'title', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'instructor', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'level', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT' },
      { name: 'track', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT' },
      { name: 'price', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'lessons', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'is_active', postgresType: 'BOOLEAN', mysqlType: 'TINYINT(1)', sqliteType: 'INTEGER', defaultSql: '1' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['slug']],
  },
  {
    tableName: 'enrollments',
    domain: 'Learning & Portfolio',
    description: 'User course enrollments and lesson completion tracking.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'course_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'progress_percent', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'last_accessed', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['user_id', 'course_id']],
  },
  {
    tableName: 'quiz_attempts',
    domain: 'Learning & Portfolio',
    description: 'Course assessment attempts and scores.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'course_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'score', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'passed', postgresType: 'BOOLEAN', mysqlType: 'TINYINT(1)', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'attempted_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
  },
  {
    tableName: 'certificates',
    domain: 'Learning & Portfolio',
    description: 'Verified course completion credentials.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'course_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'certificate_title', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'credential_code', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT' },
      { name: 'issued_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['credential_code']],
  },
  {
    tableName: 'mock_interviews',
    domain: 'Career & ATS Workspace',
    description: 'Spoken voice and text AI mock interview sessions, transcripts, and rubric scores.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'target_role', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'interview_type', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT' },
      { name: 'overall_score', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'transcript', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'feedback_summary', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'completed_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
  },
  {
    tableName: 'linkedin_optimizations',
    domain: 'Career & ATS Workspace',
    description: 'AI-optimized LinkedIn headlines, About sections, and recruiter keywords.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'target_role', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'headline', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'about_section', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'recruiter_keywords', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'updated_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['user_id']],
  },
  {
    tableName: 'portfolios',
    domain: 'Learning & Portfolio',
    description: 'Public developer portfolios hosted at /p/:slug and exportable as standalone HTML.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'slug', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'theme', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT', defaultSql: "'minimal'" },
      { name: 'is_published', postgresType: 'BOOLEAN', mysqlType: 'TINYINT(1)', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'views_count', postgresType: 'INTEGER', mysqlType: 'INT', sqliteType: 'INTEGER', defaultSql: '0' },
      { name: 'updated_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['slug']],
  },
  {
    tableName: 'feature_flags',
    domain: 'Admin Governance',
    description: 'Plan-scoped feature flags managed from the Super-Admin console.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'key', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'name', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'description', postgresType: 'TEXT', mysqlType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'enabled', postgresType: 'BOOLEAN', mysqlType: 'TINYINT(1)', sqliteType: 'INTEGER', defaultSql: '1' },
      { name: 'allowed_plans', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'updated_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
    uniqueKeys: [['key']],
  },
  {
    tableName: 'audit_logs',
    domain: 'Admin Governance',
    description: 'Immutable cryptographic ledger of all administrative actions.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'admin_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT' },
      { name: 'admin_email', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'action', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'target', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'details', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'timestamp', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
  },
  {
    tableName: 'support_tickets',
    domain: 'Admin Governance',
    description: 'Customer billing and technical support tickets with message threads.',
    columns: [
      { name: 'id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'user_id', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', nullable: false },
      { name: 'user_email', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'user_name', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'user_plan', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT' },
      { name: 'subject', postgresType: 'VARCHAR(255)', mysqlType: 'VARCHAR(255)', sqliteType: 'TEXT', nullable: false },
      { name: 'category', postgresType: 'VARCHAR(64)', mysqlType: 'VARCHAR(64)', sqliteType: 'TEXT' },
      { name: 'status', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'open'" },
      { name: 'priority', postgresType: 'VARCHAR(32)', mysqlType: 'VARCHAR(32)', sqliteType: 'TEXT', defaultSql: "'medium'" },
      { name: 'messages', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'created_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
      { name: 'updated_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
  },
  {
    tableName: 'system_settings',
    domain: 'Admin Governance',
    description: 'Global AI provider routing, maintenance mode, and platform configuration.',
    columns: [
      { name: 'key', postgresType: 'VARCHAR(128)', mysqlType: 'VARCHAR(128)', sqliteType: 'TEXT', primaryKey: true },
      { name: 'value', postgresType: 'JSONB', mysqlType: 'JSON', sqliteType: 'TEXT' },
      { name: 'updated_at', postgresType: 'TIMESTAMPTZ', mysqlType: 'DATETIME', sqliteType: 'TEXT' },
    ],
  },
];

// ============================================================================
// 6. MULTI-CLOUD SQL SCHEMA & DATA DUMP GENERATORS (HOSTINGER / AWS / SQLITE)
// ============================================================================
function escapeSqlString(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '0';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "''");
    return `'${jsonStr}'`;
  }
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");
  return `'${str}'`;
}

/**
 * Generates portable DDL + Optional Live Data INSERTs for:
 * - 'mysql' (Hostinger MySQL 8.0 / MariaDB)
 * - 'postgres' (AWS RDS / Aurora PostgreSQL / Supabase)
 * - 'sqlite' (AWS Lightsail / EC2 / Node.js Local SQLite)
 */
export function generatePortableCloudSql(
  dialect: 'mysql' | 'postgres' | 'sqlite',
  liveData?: {
    users?: any[];
    plans?: any[];
    subscriptions?: any[];
    invoices?: any[];
    paymentGateways?: any[];
    paymentOrders?: any[];
    jobs?: any[];
    featureFlags?: any[];
    auditLogs?: any[];
    supportTickets?: any[];
    platformSettings?: any;
  }
): string {
  const lines: string[] = [];
  const nowIso = new Date().toISOString();

  lines.push('-- ============================================================================');
  lines.push(`-- CAREERWAVE PORTABLE CLOUD SCHEMA & DATA EXPORT (${dialect.toUpperCase()})`);
  lines.push(`-- Generated At: ${nowIso}`);
  lines.push(
    dialect === 'mysql'
      ? '-- Target Cloud: Hostinger MySQL 8.0 / MariaDB (phpMyAdmin / VPS / Cloud Hosting)'
      : dialect === 'postgres'
      ? '-- Target Cloud: AWS RDS / Aurora PostgreSQL 15+ / EC2 / Supabase'
      : '-- Target Cloud: Portable SQLite 3 (AWS Lightsail / Docker / Node.js VPS)'
  );
  lines.push('-- ============================================================================');
  lines.push('');

  if (dialect === 'mysql') {
    lines.push('SET NAMES utf8mb4;');
    lines.push('SET FOREIGN_KEY_CHECKS = 0;');
    lines.push('');
  } else if (dialect === 'postgres') {
    lines.push('BEGIN;');
    lines.push('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    lines.push('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    lines.push('');
  } else {
    lines.push('PRAGMA foreign_keys = ON;');
    lines.push('');
  }

  for (const table of UNIFIED_SCHEMA_TABLES) {
    lines.push(`-- Table: ${table.tableName} (${table.domain}) — ${table.description}`);
    const colDefs: string[] = [];

    for (const col of table.columns) {
      const colType =
        dialect === 'mysql'
          ? col.mysqlType
          : dialect === 'postgres'
          ? col.postgresType
          : col.sqliteType;
      const pkClause = col.primaryKey ? ' PRIMARY KEY' : '';
      const nullClause = col.primaryKey || col.nullable === false ? ' NOT NULL' : '';
      let defaultClause = '';
      if (col.defaultSql !== undefined) {
        if (dialect === 'postgres' && (colType === 'BOOLEAN') && (col.defaultSql === '1' || col.defaultSql === '0')) {
          defaultClause = ` DEFAULT ${col.defaultSql === '1' ? 'TRUE' : 'FALSE'}`;
        } else {
          defaultClause = ` DEFAULT ${col.defaultSql}`;
        }
      }
      colDefs.push(`  ${col.name} ${colType}${pkClause}${nullClause}${defaultClause}`);
    }

    if (table.uniqueKeys && table.uniqueKeys.length > 0) {
      for (const uk of table.uniqueKeys) {
        colDefs.push(`  UNIQUE (${uk.join(', ')})`);
      }
    }

    const tableSuffix =
      dialect === 'mysql'
        ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;'
        : ';';

    lines.push(`CREATE TABLE IF NOT EXISTS ${table.tableName} (`);
    lines.push(colDefs.join(',\n'));
    lines.push(`)${tableSuffix}`);
    lines.push('');
  }

  // Append Live Data INSERT statements so migration preserves all state out of the box
  if (liveData) {
    lines.push('-- ============================================================================');
    lines.push('-- LIVE DATA SNAPSHOT (USERS, PLANS, GATEWAYS, JOBS, INVOICES, SETTINGS)');
    lines.push('-- ============================================================================');
    lines.push('');

    const upsertPrefix = (table: string, cols: string[]) =>
      dialect === 'mysql'
        ? `INSERT IGNORE INTO ${table} (${cols.join(', ')}) VALUES`
        : dialect === 'sqlite'
        ? `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES`
        : `INSERT INTO ${table} (${cols.join(', ')}) VALUES`;

    const upsertSuffix = (pkCol = 'id') =>
      dialect === 'postgres' ? ` ON CONFLICT (${pkCol}) DO NOTHING;` : ';';

    // 1. Plans
    if (Array.isArray(liveData.plans) && liveData.plans.length > 0) {
      lines.push('-- Seed: plans');
      for (const p of liveData.plans) {
        const cols = ['id', 'name', 'price_monthly', 'price_yearly', 'billing_interval', 'feature_limits', 'is_active', 'description', 'badge', 'created_at'];
        const vals = [
          escapeSqlString(p.id),
          escapeSqlString(p.name),
          escapeSqlString(p.price_monthly ?? 0),
          escapeSqlString(p.price_yearly ?? 0),
          escapeSqlString(p.billing_interval || 'month'),
          escapeSqlString(p.feature_limits || {}),
          dialect === 'postgres' ? (p.is_active ? 'TRUE' : 'FALSE') : p.is_active ? '1' : '0',
          escapeSqlString(p.description || ''),
          escapeSqlString(p.badge || null),
          escapeSqlString(nowIso),
        ];
        lines.push(`${upsertPrefix('plans', cols)} (${vals.join(', ')})${upsertSuffix('id')}`);
      }
      lines.push('');
    }

    // 2. Profiles / Users
    if (Array.isArray(liveData.users) && liveData.users.length > 0) {
      lines.push('-- Seed: profiles');
      for (const u of liveData.users) {
        const cols = ['id', 'email', 'password_hash', 'full_name', 'avatar_url', 'title', 'target_role', 'location', 'bio', 'skills', 'role', 'status', 'plan', 'bonus_credits', 'created_at', 'updated_at'];
        const vals = [
          escapeSqlString(u.id),
          escapeSqlString(u.email),
          escapeSqlString(u.password_hash || null),
          escapeSqlString(u.full_name || ''),
          escapeSqlString(u.avatar_url || ''),
          escapeSqlString(u.title || ''),
          escapeSqlString(u.target_role || ''),
          escapeSqlString(u.location || 'India'),
          escapeSqlString(u.bio || ''),
          escapeSqlString(u.skills || []),
          escapeSqlString(u.role || 'user'),
          escapeSqlString(u.status || 'active'),
          escapeSqlString(u.plan || 'Free'),
          escapeSqlString(u.bonus_credits || {}),
          escapeSqlString(u.created_at || nowIso),
          escapeSqlString(u.last_active_at || nowIso),
        ];
        lines.push(`${upsertPrefix('profiles', cols)} (${vals.join(', ')})${upsertSuffix('id')}`);
      }
      lines.push('');
    }

    // 3. Payment Gateways
    if (Array.isArray(liveData.paymentGateways) && liveData.paymentGateways.length > 0) {
      lines.push('-- Seed: payment_gateways');
      for (const gw of liveData.paymentGateways) {
        const cols = ['id', 'gateway_name', 'display_name', 'description', 'is_active', 'environment', 'credentials', 'updated_at', 'updated_by'];
        const vals = [
          escapeSqlString(gw.id || `gw_${gw.gateway_name}`),
          escapeSqlString(gw.gateway_name),
          escapeSqlString(gw.display_name),
          escapeSqlString(gw.description || ''),
          dialect === 'postgres' ? (gw.is_active ? 'TRUE' : 'FALSE') : gw.is_active ? '1' : '0',
          escapeSqlString(gw.environment || 'sandbox'),
          escapeSqlString(gw.credentials || {}),
          escapeSqlString(gw.updated_at || nowIso),
          escapeSqlString(gw.updated_by || 'admin@careerwave.in'),
        ];
        lines.push(`${upsertPrefix('payment_gateways', cols)} (${vals.join(', ')})${upsertSuffix('id')}`);
      }
      lines.push('');
    }

    // 4. Subscriptions & Invoices
    if (Array.isArray(liveData.invoices) && liveData.invoices.length > 0) {
      lines.push('-- Seed: invoices');
      for (const inv of liveData.invoices) {
        const cols = ['id', 'user_id', 'user_email', 'user_name', 'subscription_id', 'plan_name', 'amount', 'currency', 'status', 'provider_invoice_id', 'invoice_pdf_url', 'created_at'];
        const vals = [
          escapeSqlString(inv.id),
          escapeSqlString(inv.user_id),
          escapeSqlString(inv.user_email || ''),
          escapeSqlString(inv.user_name || ''),
          escapeSqlString(inv.subscription_id || ''),
          escapeSqlString(inv.plan_name || 'Pro'),
          escapeSqlString(inv.amount ?? 0),
          escapeSqlString(inv.currency || 'INR'),
          escapeSqlString(inv.status || 'paid'),
          escapeSqlString(inv.provider_invoice_id || ''),
          escapeSqlString(inv.invoice_pdf_url || ''),
          escapeSqlString(inv.created_at || nowIso),
        ];
        lines.push(`${upsertPrefix('invoices', cols)} (${vals.join(', ')})${upsertSuffix('id')}`);
      }
      lines.push('');
    }

    // 5. Jobs
    if (Array.isArray(liveData.jobs) && liveData.jobs.length > 0) {
      lines.push('-- Seed: jobs');
      for (const j of liveData.jobs) {
        const cols = ['id', 'source', 'external_id', 'title', 'company', 'company_logo', 'location', 'is_remote', 'employment_type', 'salary_min', 'salary_max', 'currency', 'salary_range', 'description', 'required_skills', 'tags', 'sector', 'apply_url', 'source_platform', 'posted_at', 'fetched_at'];
        const vals = [
          escapeSqlString(j.id),
          escapeSqlString(j.source || 'jsearch'),
          escapeSqlString(j.external_id || j.id),
          escapeSqlString(j.title),
          escapeSqlString(j.company),
          escapeSqlString(j.company_logo || ''),
          escapeSqlString(j.location || 'India'),
          dialect === 'postgres' ? (j.is_remote ? 'TRUE' : 'FALSE') : j.is_remote ? '1' : '0',
          escapeSqlString(j.employment_type || 'full-time'),
          escapeSqlString(j.salary_min ?? null),
          escapeSqlString(j.salary_max ?? null),
          escapeSqlString(j.currency || 'INR'),
          escapeSqlString(j.salary_range || ''),
          escapeSqlString(j.description || ''),
          escapeSqlString(j.required_skills || []),
          escapeSqlString(j.tags || []),
          escapeSqlString(j.sector || 'Software'),
          escapeSqlString(j.apply_url || ''),
          escapeSqlString(j.source_platform || 'Company Site'),
          escapeSqlString(j.posted_at || nowIso),
          escapeSqlString(j.fetched_at || nowIso),
        ];
        lines.push(`${upsertPrefix('jobs', cols)} (${vals.join(', ')})${upsertSuffix('id')}`);
      }
      lines.push('');
    }

    // 6. System Settings
    if (liveData.platformSettings) {
      lines.push('-- Seed: system_settings');
      const cols = ['key', 'value', 'updated_at'];
      const vals = [
        escapeSqlString('global_platform_settings'),
        escapeSqlString(liveData.platformSettings),
        escapeSqlString(nowIso),
      ];
      lines.push(`${upsertPrefix('system_settings', cols)} (${vals.join(', ')})${upsertSuffix('key')}`);
      lines.push('');
    }
  }

  if (dialect === 'mysql') {
    lines.push('SET FOREIGN_KEY_CHECKS = 1;');
  } else if (dialect === 'postgres') {
    lines.push('COMMIT;');
  }

  return lines.join('\n');
}
