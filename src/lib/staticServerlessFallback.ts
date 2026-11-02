import {
  normalizeSkillsWithTaxonomy,
  DEFAULT_SKILLS_TAXONOMY,
} from './skillsTaxonomy.ts';
import {
  normalizeCanonicalResume,
  computeGeneralAtsScore,
  computeJobMatchScore,
} from './atsScoringEngine.ts';
import {
  sanitizeJobDescriptionHtml,
  formatSalaryRange,
} from '../types/jobs.ts';
import type { NormalizedJob } from '../types/jobs.ts';
import { generateSubscriptionInvoicePdfBytes } from '../utils/invoicePdf.ts';
import {
  generateSampleJobsExcelBytes,
  parseUploadedJobSheetBuffer,
  normalizeRawRowToJob,
} from '../utils/jobExcelTemplate.ts';
import {
  UNIFIED_SCHEMA_TABLES,
  generatePortableCloudSql,
} from '../schema/unifiedDataSchema.ts';

const LOCAL_DB_STORAGE_KEY = 'careerwave_portable_db_v1';

const ADMIN_EMAILS = new Set([
  'admin@careerwave.in',
  'admin@careerwave.io',
  'superadmin@careerwave.in',
  'poornachandu834@gmail.com',
]);

const DEFAULT_PLANS = [
  {
    id: 'plan_free',
    name: 'Free',
    price_monthly: 0,
    price_yearly: 0,
    billing_interval: 'month',
    feature_limits: {
      resume_tailoring: 2,
      ai_job_match: 5,
      mock_interview: 2,
      linkedin_generation: 1,
      portfolio_generation: 1,
    },
    is_active: true,
    description:
      'Essential career tools for students and professionals exploring internships and full-time roles.',
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    price_monthly: 1499,
    price_yearly: 14990,
    billing_interval: 'month',
    feature_limits: {
      resume_tailoring: 25,
      ai_job_match: 60,
      mock_interview: 15,
      linkedin_generation: 10,
      portfolio_generation: 5,
    },
    is_active: true,
    description:
      'High-volume ATS tailoring, application kits, and spoken voice mock interviews for active job seekers.',
    badge: 'Most Popular',
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    price_monthly: 3999,
    price_yearly: 39990,
    billing_interval: 'month',
    feature_limits: {
      resume_tailoring: 200,
      ai_job_match: 500,
      mock_interview: 100,
      linkedin_generation: 50,
      portfolio_generation: 25,
    },
    is_active: true,
    description:
      'Maximum monthly velocity, deep architectural mock interviews, and custom portfolio publishing.',
    badge: 'Bestseller',
  },
];

const DEFAULT_GATEWAYS = [
  {
    id: 'gw_razorpay',
    gateway_name: 'razorpay',
    display_name: 'Razorpay Checkout',
    description: 'Cards, UPI, NetBanking & Wallets via Razorpay Standard Checkout SDK',
    is_active: true,
    environment: 'sandbox',
    credentials: {
      key_id: 'rzp_test_CareerWaveDemoKey01',
      key_secret: 'rzp_secret_demo_9988776655',
      webhook_secret: 'whsec_rzp_careerwave',
    },
    updated_at: new Date().toISOString(),
    updated_by: 'admin@careerwave.in',
  },
  {
    id: 'gw_cashfree',
    gateway_name: 'cashfree',
    display_name: 'Cashfree Payments',
    description: 'Instant Indian Payment Gateway supporting PG Orders v2023-08-01',
    is_active: true,
    environment: 'sandbox',
    credentials: {
      app_id: 'TEST_CF_APP_98123456',
      secret_key: 'cf_sandbox_secret_9988112233',
      webhook_secret: 'whsec_cf_careerwave',
    },
    updated_at: new Date().toISOString(),
    updated_by: 'admin@careerwave.in',
  },
  {
    id: 'gw_upi',
    gateway_name: 'upi',
    display_name: 'Direct UPI (Intent / VPA QR)',
    description: 'Zero-MDR Direct UPI deep link & dynamic QR code to merchant VPA',
    is_active: true,
    environment: 'live',
    credentials: {
      vpa: 'careerwaves@okaxis',
      merchant_name: 'CareerWaves Technologies',
      mcc: '5734',
    },
    updated_at: new Date().toISOString(),
    updated_by: 'admin@careerwave.in',
  },
];

const DEFAULT_JOBS: NormalizedJob[] = [
  {
    id: 'job-1',
    source: 'jsearch',
    external_id: 'jsearch_razorpay_ai_eng_01',
    title: 'Senior AI Application Engineer',
    company: 'Razorpay',
    company_logo:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    location: 'Bengaluru, Karnataka, India',
    is_remote: true,
    remote: true,
    employment_type: 'full-time',
    job_type: 'Full-time',
    type: 'Full-Time',
    salary_min: 2800000,
    salary_max: 4200000,
    currency: 'INR',
    salary_range: '₹28L – ₹42L/yr',
    apply_url: 'https://razorpay.com/jobs/',
    source_platform: 'Company Site',
    sector: 'FinTech',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    fetched_at: new Date().toISOString(),
    description:
      'Build developer-first generative AI assistants, automated payment risk triage, and intelligent billing workflows across Razorpay core payment infrastructure.\n\n• Design and deploy autonomous LLM agents that resolve complex merchant support and dispute flows with verified citations.\n• Architect low-latency vector search indices and semantic caching layers using PostgreSQL and Redis.\n• Conduct rigorous model evaluations, hallucination monitoring, and latency optimizations.',
    responsibilities: [
      'Design and deploy autonomous LLM agents that resolve complex merchant support and dispute flows with verified citations.',
      'Architect low-latency vector search indices and semantic caching layers using PostgreSQL and Redis.',
      'Conduct rigorous model evaluations, hallucination monitoring, and latency optimizations.',
    ],
    required_skills: [
      'TypeScript',
      'Python',
      'LangChain',
      'LangGraph',
      'PostgreSQL',
      'Redis',
      'System Design',
    ],
    requirements: [
      'TypeScript',
      'Python',
      'LangChain',
      'LangGraph',
      'PostgreSQL',
      'Redis',
      'System Design',
    ],
    tags: ['Generative AI', 'FinTech', 'High Demand', 'Remote Friendly'],
  },
  {
    id: 'job-2',
    source: 'jsearch',
    external_id: 'jsearch_sarvam_agents_intern_02',
    title: 'Autonomous Agents Research Intern',
    company: 'Sarvam AI',
    company_logo:
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=120&auto=format&fit=crop&q=80',
    location: 'Bengaluru, Karnataka, India',
    is_remote: true,
    remote: true,
    employment_type: 'internship',
    job_type: 'Internship',
    type: 'Internship',
    salary_min: 900000,
    salary_max: 1400000,
    currency: 'INR',
    salary_range: '₹9L – ₹14L/yr',
    apply_url: 'https://www.linkedin.com/jobs/search/?keywords=Sarvam+AI+Bengaluru',
    source_platform: 'LinkedIn',
    sector: 'GenAI',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    fetched_at: new Date().toISOString(),
    description:
      'Collaborate with foundational AI researchers on evaluating multi-agent orchestration frameworks, Indic multilingual voice models, and human-in-the-loop debugging interfaces.\n\n• Implement multi-actor agent benchmark testbeds to evaluate tool-calling fidelity under production constraints.\n• Create interactive trace visualizers for agent step-by-step reasoning and memory retrieval.',
    responsibilities: [
      'Implement multi-actor agent benchmark testbeds to evaluate tool-calling fidelity under production constraints.',
      'Create interactive trace visualizers for agent step-by-step reasoning and memory retrieval.',
    ],
    required_skills: [
      'Python',
      'PyTorch',
      'Prompt Engineering',
      'TypeScript',
      'RAG',
      'Large Language Models',
    ],
    requirements: [
      'Python',
      'PyTorch',
      'Prompt Engineering',
      'TypeScript',
      'RAG',
      'Large Language Models',
    ],
    tags: ['GenAI', 'Autonomous Agents', 'Internship'],
  },
  {
    id: 'job-3',
    source: 'jsearch',
    external_id: 'jsearch_databricks_architect_03',
    title: 'Enterprise AI Solutions Architect',
    company: 'Databricks India',
    company_logo:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=120&auto=format&fit=crop&q=80',
    location: 'Bengaluru, Karnataka, India',
    is_remote: false,
    remote: false,
    employment_type: 'full-time',
    job_type: 'Full-time',
    type: 'Full-Time',
    salary_min: 3500000,
    salary_max: 5200000,
    currency: 'INR',
    salary_range: '₹35L – ₹52L/yr',
    apply_url: 'https://www.databricks.com/company/careers/open-positions',
    source_platform: 'Company Site',
    sector: 'Enterprise AI',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    fetched_at: new Date().toISOString(),
    description:
      'Empower enterprise engineering organizations across India to deploy custom LLMs, Unity Catalog governance, and automated Lakehouse AI pipelines.\n\n• Architect enterprise-scale RAG systems integrating Delta Lake, MLflow, and vector indexes.\n• Conduct technical deep dives with VP/Director of Engineering stakeholders.',
    responsibilities: [
      'Architect enterprise-scale RAG systems integrating Delta Lake, MLflow, and secure vector indexes.',
      'Conduct technical deep dives with VP/Director of Engineering stakeholders.',
    ],
    required_skills: ['Python', 'Apache Spark', 'MLflow', 'AWS', 'Kubernetes', 'SQL'],
    requirements: ['Python', 'Apache Spark', 'MLflow', 'AWS', 'Kubernetes', 'SQL'],
    tags: ['Enterprise AI', 'Data Platform', 'Bengaluru'],
  },
  {
    id: 'job-4',
    source: 'jsearch',
    external_id: 'jsearch_postman_fullstack_04',
    title: 'Full Stack Product Engineer (AI Platform)',
    company: 'Postman',
    company_logo:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=120&auto=format&fit=crop&q=80',
    location: 'Bengaluru, Karnataka, India',
    is_remote: true,
    remote: true,
    employment_type: 'full-time',
    job_type: 'Full-time',
    type: 'Full-Time',
    salary_min: 2400000,
    salary_max: 3600000,
    currency: 'INR',
    salary_range: '₹24L – ₹36L/yr',
    apply_url: 'https://www.postman.com/company/careers/',
    source_platform: 'Company Site',
    sector: 'Software',
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
    fetched_at: new Date().toISOString(),
    description:
      'Craft effortless API collaboration and AI agent testing workflows for 30M+ developers building distributed applications.\n\n• Build accessible, high-speed React & TypeScript interfaces with edge caching.\n• Contribute to AI agent protocol test runners and streaming SSE primitives.',
    responsibilities: [
      'Build snappy, accessible UI components with modern TypeScript and edge caching.',
      'Contribute to AI agent test runners and streaming UI primitives.',
    ],
    required_skills: ['TypeScript', 'React', 'Node.js', 'REST APIs', 'GraphQL', 'Docker'],
    requirements: ['TypeScript', 'React', 'Node.js', 'REST APIs', 'GraphQL', 'Docker'],
    tags: ['Software', 'Developer Tools', 'Remote'],
  },
];

interface LocalDbState {
  users: any[];
  plans: any[];
  gateways: any[];
  orders: any[];
  invoices: any[];
  jobs: NormalizedJob[];
  workspaces: Record<string, any>;
  otps: Record<string, { code: string; expiresAt: number }>;
  sessions: Record<string, string>;
}

function getDefaultUsers(): any[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'usr_admin_careerwave_00',
      email: 'admin@careerwave.in',
      password_hash: 'Admin@123',
      full_name: 'CareerWave Super Admin',
      avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=CareerWave+Admin',
      title: 'Platform Administrator',
      target_role: 'Principal AI & SaaS Architect',
      location: 'Hyderabad, India',
      experience_level: 'Senior / Lead (6+ yrs)',
      career_track: 'Generative AI',
      education_or_company: 'CareerWaves Enterprise',
      work_preference: 'Remote',
      career_goal: 'Scale CareerWaves SaaS Platform',
      skills: ['System Architecture', 'AI Governance', 'Cloud Infrastructure', 'TypeScript', 'PostgreSQL'],
      bio: 'Super Administrator managing CareerWaves SaaS operations, billing, and AI infrastructure.',
      onboarding_completed: true,
      role: 'admin',
      status: 'active',
      plan: 'Premium',
      resumes_count: 3,
      applications_count: 8,
      bonus_credits: { resume_tailoring: 50, mock_interview: 50 },
      created_at: now,
      last_active_at: now,
    },
    {
      id: 'usr_admin_poorna_01',
      email: 'poornachandu834@gmail.com',
      password_hash: 'Admin@123',
      full_name: 'Poorna Chandu',
      avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Poorna+Chandu',
      title: 'Founder & Lead AI Engineer',
      target_role: 'AI Systems Architect',
      location: 'Hyderabad, India',
      experience_level: 'Senior / Lead (6+ yrs)',
      career_track: 'Generative AI',
      education_or_company: 'CareerWaves',
      work_preference: 'Hybrid',
      career_goal: 'Lead AI Product & Engineering',
      skills: ['React', 'TypeScript', 'Python', 'Gemini AI', 'Node.js', 'Supabase'],
      bio: 'Founder & Administrator of CareerWaves.',
      onboarding_completed: true,
      role: 'admin',
      status: 'active',
      plan: 'Premium',
      resumes_count: 5,
      applications_count: 14,
      bonus_credits: { resume_tailoring: 50, mock_interview: 50 },
      created_at: now,
      last_active_at: now,
    },
  ];
}

function loadLocalDb(): LocalDbState {
  try {
    const raw = localStorage.getItem(LOCAL_DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : getDefaultUsers(),
        plans: Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : DEFAULT_PLANS,
        gateways:
          Array.isArray(parsed.gateways) && parsed.gateways.length > 0
            ? parsed.gateways
            : DEFAULT_GATEWAYS,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
        jobs: Array.isArray(parsed.jobs) && parsed.jobs.length > 0 ? parsed.jobs : DEFAULT_JOBS,
        workspaces: parsed.workspaces && typeof parsed.workspaces === 'object' ? parsed.workspaces : {},
        otps: parsed.otps && typeof parsed.otps === 'object' ? parsed.otps : {},
        sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
      };
    }
  } catch {
    // ignore corrupt state
  }
  return {
    users: getDefaultUsers(),
    plans: DEFAULT_PLANS,
    gateways: DEFAULT_GATEWAYS,
    orders: [],
    invoices: [],
    jobs: DEFAULT_JOBS,
    workspaces: {},
    otps: {},
    sessions: {},
  };
}

function saveLocalDb(db: LocalDbState) {
  try {
    localStorage.setItem(LOCAL_DB_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignore storage quota errors
  }
}

function jsonResponse(payload: any, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getHeader(headers: Record<string, string>, name: string): string {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return v;
  }
  return '';
}

function resolveLocalUser(db: LocalDbState, headers: Record<string, string>, body?: any): any | null {
  const auth = getHeader(headers, 'authorization');
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (token && db.sessions[token]) {
    const found = db.users.find((u) => u.id === db.sessions[token]);
    if (found) return found;
  }
  const userId = getHeader(headers, 'x-user-id') || body?.userId;
  const userEmail = (getHeader(headers, 'x-user-email') || '').toLowerCase().trim();
  if (userId) {
    const found = db.users.find((u) => u.id === userId);
    if (found) return found;
  }
  if (userEmail) {
    const found = db.users.find((u) => String(u.email || '').toLowerCase() === userEmail);
    if (found) return found;
  }
  // Fallback to currently stored session in localStorage
  try {
    const sessRaw = localStorage.getItem('careerwave_auth_session_v2');
    if (sessRaw) {
      const sess = JSON.parse(sessRaw);
      if (sess?.user?.email) {
        const emailLower = String(sess.user.email).toLowerCase();
        let found = db.users.find((u) => String(u.email || '').toLowerCase() === emailLower);
        if (!found && sess.profile) {
          found = {
            ...sess.profile,
            id: sess.user.id,
            email: emailLower,
            role: ADMIN_EMAILS.has(emailLower) ? 'admin' : sess.profile.role || 'user',
            plan: sess.profile.plan || 'Free',
            status: 'active',
          };
          db.users.unshift(found);
          saveLocalDb(db);
        }
        return found || null;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function ensureUserWorkspace(db: LocalDbState, userId: string) {
  if (!db.workspaces[userId]) {
    db.workspaces[userId] = {
      resume: null,
      tailoredResumes: [],
      applications: [],
      roadmap: null,
      projects: [],
      mockInterviews: [],
      portfolio: null,
      linkedin: null,
      coursesProgress: {},
    };
  }
  return db.workspaces[userId];
}

function scoreJobLocal(job: NormalizedJob, resume: any): NormalizedJob {
  const reqs = Array.isArray(job.required_skills)
    ? job.required_skills
    : Array.isArray(job.requirements)
    ? job.requirements
    : ['TypeScript', 'Python', 'React', 'SQL'];
  const cleanDesc = sanitizeJobDescriptionHtml(job.description);
  const salaryRange =
    job.salary_range || formatSalaryRange(job.salary_min, job.salary_max, job.currency) || undefined;

  let userSkills: string[] = [];
  if (resume?.skills) {
    if (Array.isArray(resume.skills)) {
      userSkills = resume.skills;
    } else {
      userSkills = [
        ...(resume.skills.languages || []),
        ...(resume.skills.frameworks || []),
        ...(resume.skills.cloudAndDevOps || []),
        ...(resume.skills.aiAndData || []),
      ];
    }
  }

  if (userSkills.length === 0) {
    return {
      ...job,
      description: cleanDesc,
      required_skills: reqs,
      requirements: reqs,
      salary_range: salaryRange,
      hasResume: false,
      matchScore: null,
      matchGrade: null,
      matchedSkills: [],
      matchReasons: [],
      missingSkills: reqs.slice(0, 5),
    };
  }

  const lowerUser = userSkills.map((s) => String(s).toLowerCase());
  const matched: string[] = [];
  const missing: string[] = [];
  for (const r of reqs) {
    const rl = r.toLowerCase();
    if (lowerUser.some((u) => u === rl || u.includes(rl) || rl.includes(u))) {
      matched.push(r);
    } else {
      missing.push(r);
    }
  }
  const ratio = reqs.length > 0 ? matched.length / reqs.length : 0.8;
  const score = Math.min(99, Math.max(55, Math.round(56 + ratio * 42)));
  const grade = score >= 90 ? 'A+' : score >= 82 ? 'A' : score >= 75 ? 'B+' : 'B';

  return {
    ...job,
    description: cleanDesc,
    required_skills: reqs,
    requirements: reqs,
    salary_range: salaryRange,
    hasResume: true,
    matchScore: score,
    matchGrade: grade,
    matchedSkills: matched,
    matchReasons:
      matched.length > 0
        ? [`Matched ${matched.slice(0, 4).join(', ')} from your resume profile`]
        : ['Aligned with your engineering career track'],
    missingSkills: missing.slice(0, 5),
  };
}

async function handleLocalApiRequest(
  pathname: string,
  searchParams: URLSearchParams,
  method: string,
  headers: Record<string, string>,
  rawBody: any
): Promise<Response> {
  const db = loadLocalDb();
  let body: any = {};
  if (typeof rawBody === 'string' && rawBody.trim()) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }
  } else if (rawBody && typeof rawBody === 'object') {
    body = rawBody;
  }

  const nowIso = new Date().toISOString();

  // 1. Auth: Register
  if (pathname === '/api/auth/register' && method === 'POST') {
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const cleanName = String(body.full_name || '').trim() || 'CareerWave Member';
    const cleanPassword = String(body.password || '');

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return jsonResponse({ error: 'Please enter a valid email address.' }, 400);
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters.' }, 400);
    }

    const isAdminEmail = ADMIN_EMAILS.has(rawEmail);
    const normalizedSkills = Array.isArray(body.skills)
      ? body.skills.map((s: any) => String(s || '').trim()).filter(Boolean)
      : [];

    let user = db.users.find((u) => String(u.email || '').toLowerCase() === rawEmail);
    if (!user) {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        email: rawEmail,
        password_hash: cleanPassword,
        full_name: cleanName,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
        title: String(body.title || '').trim() || 'Software & AI Engineer',
        target_role: String(body.target_role || '').trim() || 'Full Stack Engineer',
        location: String(body.location || '').trim() || 'India',
        experience_level: String(body.experience_level || '').trim() || 'Early Career (1-3 yrs)',
        career_track: String(body.career_track || '').trim() || 'Generative AI',
        education_or_company: String(body.education_or_company || '').trim(),
        work_preference: String(body.work_preference || '').trim() || 'Hybrid',
        career_goal: String(body.career_goal || '').trim() || 'Land a high-paying full-time role',
        skills: normalizedSkills,
        bio: String(body.bio || '').trim(),
        onboarding_completed: true,
        role: isAdminEmail ? 'admin' : 'user',
        status: 'active',
        plan: isAdminEmail ? 'Premium' : 'Free',
        resumes_count: 0,
        applications_count: 0,
        bonus_credits: {},
        created_at: nowIso,
        last_active_at: nowIso,
      };
      db.users.unshift(user);
    } else {
      user.password_hash = cleanPassword;
      user.full_name = cleanName || user.full_name;
      user.title = String(body.title || user.title || '').trim();
      user.target_role = String(body.target_role || user.target_role || '').trim();
      user.location = String(body.location || user.location || 'India').trim();
      user.experience_level = String(body.experience_level || user.experience_level || '').trim();
      user.career_track = String(body.career_track || user.career_track || '').trim();
      user.education_or_company = String(
        body.education_or_company ?? user.education_or_company ?? ''
      ).trim();
      user.work_preference = String(body.work_preference || user.work_preference || 'Hybrid').trim();
      user.career_goal = String(body.career_goal || user.career_goal || '').trim();
      if (normalizedSkills.length > 0) user.skills = normalizedSkills;
      if (body.bio !== undefined) user.bio = String(body.bio).trim();
      user.onboarding_completed = true;
      user.last_active_at = nowIso;
      if (isAdminEmail) user.role = 'admin';
    }

    const sessionToken = `cw_sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    db.sessions[sessionToken] = user.id;
    ensureUserWorkspace(db, user.id);
    saveLocalDb(db);

    return jsonResponse({
      success: true,
      sessionToken,
      user: { id: user.id, email: user.email, role: user.role },
      profile: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        title: user.title,
        target_role: user.target_role,
        location: user.location,
        experience_level: user.experience_level || '',
        career_track: user.career_track || '',
        education_or_company: user.education_or_company || '',
        work_preference: user.work_preference || '',
        career_goal: user.career_goal || '',
        skills: user.skills || [],
        bio: user.bio || '',
        onboarding_completed: true,
        role: user.role,
        plan: user.plan || 'Free',
      },
    });
  }

  // 2. Auth: Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const cleanPassword = String(body.password || '');
    if (!rawEmail || !cleanPassword) {
      return jsonResponse({ error: 'Please enter your email and password.' }, 400);
    }

    let user = db.users.find((u) => String(u.email || '').toLowerCase() === rawEmail);
    const isAdminEmail = ADMIN_EMAILS.has(rawEmail);

    if (!user) {
      return jsonResponse(
        {
          error: 'No account found with this email. Please create an account first.',
          code: 'USER_NOT_FOUND',
        },
        404
      );
    }

    if (user.password_hash && user.password_hash !== cleanPassword) {
      return jsonResponse(
        {
          error: 'Incorrect password. Please try again.',
          code: 'INVALID_CREDENTIALS',
        },
        401
      );
    }

    user.password_hash = cleanPassword;
    if (isAdminEmail) user.role = 'admin';
    user.last_active_at = nowIso;

    const sessionToken = `cw_sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    db.sessions[sessionToken] = user.id;
    ensureUserWorkspace(db, user.id);
    saveLocalDb(db);

    return jsonResponse({
      success: true,
      sessionToken,
      user: { id: user.id, email: user.email, role: user.role },
      profile: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        title: user.title || '',
        target_role: user.target_role || '',
        location: user.location || 'India',
        experience_level: user.experience_level || '',
        career_track: user.career_track || '',
        education_or_company: user.education_or_company || '',
        work_preference: user.work_preference || '',
        career_goal: user.career_goal || '',
        skills: user.skills || [],
        bio: user.bio || '',
        onboarding_completed: Boolean(user.onboarding_completed),
        role: user.role,
        plan: user.plan || 'Free',
      },
    });
  }

  // 3. Auth: OTP Send & Verify & Logout
  if (pathname === '/api/auth/otp/send' && method === 'POST') {
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    db.otps[rawEmail] = { code: otpCode, expiresAt: Date.now() + 10 * 60 * 1000 };
    saveLocalDb(db);
    return jsonResponse({
      success: true,
      email: rawEmail,
      cooldownSeconds: 60,
      expiresInSeconds: 600,
      otpPreview: otpCode,
    });
  }

  if (pathname === '/api/auth/otp/verify' && method === 'POST') {
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const rawCode = String(body.code || '').trim();
    const rec = db.otps[rawEmail];
    if (rec && rec.code !== rawCode) {
      return jsonResponse({ error: 'Incorrect verification code.' }, 400);
    }
    delete db.otps[rawEmail];
    let user = db.users.find((u) => String(u.email || '').toLowerCase() === rawEmail);
    const isAdminEmail = ADMIN_EMAILS.has(rawEmail);
    if (!user) {
      const localPart = rawEmail.split('@')[0] || 'Member';
      user = {
        id: `usr_${Date.now()}`,
        email: rawEmail,
        full_name: localPart,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(localPart)}`,
        title: '',
        target_role: '',
        location: 'India',
        role: isAdminEmail ? 'admin' : 'user',
        status: 'active',
        plan: isAdminEmail ? 'Premium' : 'Free',
        onboarding_completed: true,
        skills: [],
        created_at: nowIso,
        last_active_at: nowIso,
      };
      db.users.unshift(user);
    }
    const sessionToken = `cw_sess_${Date.now()}`;
    db.sessions[sessionToken] = user.id;
    saveLocalDb(db);
    return jsonResponse({
      success: true,
      sessionToken,
      user: { id: user.id, email: user.email, role: user.role },
      profile: user,
    });
  }

  if (pathname === '/api/auth/logout') {
    return jsonResponse({ success: true });
  }

  // 4. SaaS Status
  if (pathname === '/api/saas/status') {
    const user = resolveLocalUser(db, headers, body);
    const activePlan =
      db.plans.find((p) => p.name === (user?.plan || 'Free')) || db.plans[0] || DEFAULT_PLANS[0];
    const limits = activePlan.feature_limits || DEFAULT_PLANS[0].feature_limits;
    const meters: Record<string, any> = {};
    for (const k of [
      'resume_tailoring',
      'ai_job_match',
      'mock_interview',
      'linkedin_generation',
      'portfolio_generation',
    ]) {
      const baseLimit = Number(limits[k] || 5);
      meters[k] = {
        used: 0,
        baseLimit,
        bonusCredits: 0,
        totalLimit: baseLimit,
        percent: 0,
        nearLimit: false,
        exceeded: false,
      };
    }
    const userInvoices = user
      ? db.invoices.filter((inv) => inv.user_id === user.id || inv.user_email === user.email)
      : [];
    return jsonResponse({
      success: true,
      plans: db.plans,
      user: user || null,
      meters,
      announcements: [],
      invoices: userInvoices,
      tickets: [],
      maintenanceMode: false,
      maintenanceMessage: '',
    });
  }

  // 5. User Workspace & Profile CRUD
  if (pathname === '/api/user/workspace' && method === 'GET') {
    const user = resolveLocalUser(db, headers, body);
    if (!user) {
      return jsonResponse({ success: true, workspace: ensureUserWorkspace(db, 'guest') });
    }
    const ws = ensureUserWorkspace(db, user.id);
    saveLocalDb(db);
    return jsonResponse({ success: true, workspace: ws });
  }

  if (pathname === '/api/user/profile' && (method === 'PATCH' || method === 'POST')) {
    const user = resolveLocalUser(db, headers, body);
    if (!user) return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    Object.assign(user, body, { last_active_at: nowIso });
    saveLocalDb(db);
    return jsonResponse({ success: true, user, profile: user });
  }

  if (pathname === '/api/user/resume' && method === 'POST') {
    const user = resolveLocalUser(db, headers, body);
    const userId = user?.id || 'guest';
    const ws = ensureUserWorkspace(db, userId);
    if (body.resume) ws.resume = body.resume;
    if (body.tailoredResume) {
      ws.tailoredResumes = [body.tailoredResume, ...(ws.tailoredResumes || [])];
    }
    saveLocalDb(db);
    return jsonResponse({
      success: true,
      resume: ws.resume,
      tailoredResumes: ws.tailoredResumes,
    });
  }

  if (pathname === '/api/user/applications' && method === 'POST') {
    const user = resolveLocalUser(db, headers, body);
    const ws = ensureUserWorkspace(db, user?.id || 'guest');
    if (body.application) {
      ws.applications = [body.application, ...(ws.applications || [])];
    }
    saveLocalDb(db);
    return jsonResponse({ success: true, applications: ws.applications });
  }

  if (pathname.startsWith('/api/user/applications/') && (method === 'PATCH' || method === 'DELETE')) {
    const appId = pathname.split('/').pop() || '';
    const user = resolveLocalUser(db, headers, body);
    const ws = ensureUserWorkspace(db, user?.id || 'guest');
    if (method === 'DELETE') {
      ws.applications = (ws.applications || []).filter((a: any) => a.id !== appId);
    } else {
      ws.applications = (ws.applications || []).map((a: any) =>
        a.id === appId ? { ...a, ...body } : a
      );
    }
    saveLocalDb(db);
    return jsonResponse({ success: true, applications: ws.applications });
  }

  if (pathname === '/api/user/roadmap' && method === 'POST') {
    const user = resolveLocalUser(db, headers, body);
    const ws = ensureUserWorkspace(db, user?.id || 'guest');
    ws.roadmap = body.roadmap;
    saveLocalDb(db);
    return jsonResponse({ success: true, roadmap: ws.roadmap });
  }

  if (pathname === '/api/user/projects' && method === 'POST') {
    const user = resolveLocalUser(db, headers, body);
    const ws = ensureUserWorkspace(db, user?.id || 'guest');
    ws.projects = body.projects || [];
    saveLocalDb(db);
    return jsonResponse({ success: true, projects: ws.projects });
  }

  if (pathname === '/api/user/portfolio' && method === 'POST') {
    const user = resolveLocalUser(db, headers, body);
    const ws = ensureUserWorkspace(db, user?.id || 'guest');
    ws.portfolio = body.portfolio;
    saveLocalDb(db);
    return jsonResponse({ success: true, portfolio: ws.portfolio });
  }

  if (pathname === '/api/user/linkedin' && method === 'POST') {
    const user = resolveLocalUser(db, headers, body);
    const ws = ensureUserWorkspace(db, user?.id || 'guest');
    ws.linkedin = body.linkedin;
    saveLocalDb(db);
    return jsonResponse({ success: true, linkedin: ws.linkedin });
  }

  if (pathname === '/api/user/courses-progress' && method === 'POST') {
    const user = resolveLocalUser(db, headers, body);
    const ws = ensureUserWorkspace(db, user?.id || 'guest');
    ws.coursesProgress = {
      ...(ws.coursesProgress || {}),
      [body.courseId]: body.progress,
    };
    saveLocalDb(db);
    return jsonResponse({ success: true, coursesProgress: ws.coursesProgress });
  }

  // 6. Jobs & Admin Excel Upload
  if (pathname === '/api/jobs' || pathname === '/api/jobs/fetch') {
    const user = resolveLocalUser(db, headers, body);
    const ws = user ? ensureUserWorkspace(db, user.id) : null;
    const activeResume = body.resume || ws?.resume || null;
    const scored = db.jobs.map((j) => scoreJobLocal(j, activeResume));
    return jsonResponse({
      success: true,
      jobs: scored,
      totalCount: scored.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
      hasResume: Boolean(activeResume),
      fromCache: false,
      cachedAt: nowIso,
      sources: [{ source: 'jsearch', configured: true, ok: true, count: scored.length }],
      partialFailure: false,
    });
  }

  if (pathname === '/api/admin/jobs/sample-excel') {
    const bytes = generateSampleJobsExcelBytes();
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="CareerWave_Sample_Jobs_Template.xlsx"',
      },
    });
  }

  if (pathname === '/api/admin/jobs/bulk-upload' && method === 'POST') {
    try {
      const base64 = String(body.fileBase64 || '').replace(/^data:[^;]+;base64,/, '');
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const rawRows = parseUploadedJobSheetBuffer(bytes.buffer);
      const importedJobs: NormalizedJob[] = [];
      let skippedCount = 0;
      rawRows.forEach((row, idx) => {
        const normalized = normalizeRawRowToJob(row, idx);
        if (normalized) {
          importedJobs.push(normalized);
        } else {
          skippedCount++;
        }
      });
      db.jobs = [...importedJobs, ...db.jobs];
      saveLocalDb(db);
      return jsonResponse({
        success: true,
        importedCount: importedJobs.length,
        skippedCount,
        importedJobs,
        totalJobsCount: db.jobs.length,
      });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Failed to parse Excel sheet' }, 400);
    }
  }

  if (pathname === '/api/admin/jobs' && method === 'GET') {
    return jsonResponse({ success: true, jobs: db.jobs });
  }

  if (pathname === '/api/admin/jobs' && method === 'POST') {
    const newJob: NormalizedJob = {
      id: `job_admin_${Date.now()}`,
      source: 'jsearch',
      external_id: `admin_${Date.now()}`,
      title: String(body.title || 'Software Engineer'),
      company: String(body.company || 'Tech Company'),
      location: String(body.location || 'Bengaluru, India'),
      is_remote: Boolean(body.is_remote),
      remote: Boolean(body.is_remote),
      employment_type: body.employment_type || 'full-time',
      job_type: body.job_type || 'Full-time',
      type: body.type || 'Full-Time',
      salary_min: Number(body.salary_min || 1200000),
      salary_max: Number(body.salary_max || 2400000),
      currency: 'INR',
      salary_range: body.salary_range || '₹12L – ₹24L/yr',
      apply_url: String(body.apply_url || 'https://linkedin.com/jobs'),
      source_platform: body.source_platform || 'Company Site',
      sector: body.sector || 'Software',
      posted_at: nowIso,
      fetched_at: nowIso,
      description: String(body.description || ''),
      required_skills: Array.isArray(body.required_skills) ? body.required_skills : ['TypeScript', 'React'],
      requirements: Array.isArray(body.required_skills) ? body.required_skills : ['TypeScript', 'React'],
      tags: Array.isArray(body.tags) ? body.tags : ['Featured'],
    };
    db.jobs.unshift(newJob);
    saveLocalDb(db);
    return jsonResponse({ success: true, job: newJob, jobs: db.jobs });
  }

  // 7. Payment Gateways & Checkout & PDF Invoices
  if (pathname === '/api/payment/active-gateways' && method === 'GET') {
    const active = db.gateways
      .filter((g) => g.is_active)
      .map((g) => ({
        gateway_name: g.gateway_name,
        display_name: g.display_name,
        description: g.description,
        environment: g.environment,
        public_config:
          g.gateway_name === 'razorpay'
            ? { key_id: g.credentials?.key_id || 'rzp_test_demo' }
            : g.gateway_name === 'cashfree'
            ? { app_id: g.credentials?.app_id || 'CF_TEST' }
            : {
                vpa: g.credentials?.vpa || 'careerwaves@okaxis',
                merchant_name: g.credentials?.merchant_name || 'CareerWaves',
                mcc: g.credentials?.mcc || '5734',
              },
      }));
    return jsonResponse({ success: true, gateways: active });
  }

  if (pathname === '/api/admin/payment-gateways' && method === 'GET') {
    return jsonResponse({
      success: true,
      gateways: db.gateways,
      orders: db.orders,
    });
  }

  if (pathname.startsWith('/api/admin/payment-gateways') && (method === 'PUT' || method === 'POST')) {
    const parts = pathname.split('/');
    const gwName = parts.length > 4 ? parts[4] : body.gateway_name;
    if (gwName) {
      db.gateways = db.gateways.map((g) =>
        g.gateway_name === gwName
          ? {
              ...g,
              is_active: body.is_active !== undefined ? Boolean(body.is_active) : g.is_active,
              environment: body.environment || g.environment,
              credentials: body.credentials ? { ...g.credentials, ...body.credentials } : g.credentials,
              updated_at: nowIso,
            }
          : g
      );
      saveLocalDb(db);
    }
    return jsonResponse({ success: true, gateways: db.gateways });
  }

  if ((pathname === '/api/payment/checkout' || pathname === '/api/billing/checkout') && method === 'POST') {
    const user = resolveLocalUser(db, headers, body);
    const planName = body.planName || 'Pro';
    const interval = body.billingInterval || 'month';
    const gateway = body.gateway || 'razorpay';
    const amount = planName === 'Premium' ? (interval === 'year' ? 39990 : 3999) : interval === 'year' ? 14990 : 1499;
    const orderId = `ord_${Date.now()}`;
    const invoiceId = `inv_${Date.now()}`;

    const gwConfig = db.gateways.find((g) => g.gateway_name === gateway) || db.gateways[0];
    const order = {
      id: orderId,
      user_id: user?.id || 'guest',
      user_email: user?.email || 'member@careerwave.in',
      user_name: user?.full_name || 'CareerWave Member',
      plan_name: planName,
      billing_interval: interval,
      amount,
      currency: 'INR',
      gateway_name: gateway,
      environment: gwConfig?.environment || 'sandbox',
      gateway_order_id: `${gateway}_${orderId}`,
      status: 'paid',
      created_at: nowIso,
      updated_at: nowIso,
    };
    db.orders.unshift(order);

    const invoice = {
      id: invoiceId,
      user_id: user?.id || 'guest',
      user_email: user?.email || 'member@careerwave.in',
      user_name: user?.full_name || 'CareerWave Member',
      subscription_id: `sub_${Date.now()}`,
      plan_name: planName,
      billing_interval: interval,
      amount,
      currency: 'INR',
      status: 'paid',
      provider_invoice_id: order.gateway_order_id,
      gateway_name: gateway,
      invoice_pdf_url: `/api/billing/invoices/${invoiceId}/pdf`,
      created_at: nowIso,
    };
    db.invoices.unshift(invoice);

    if (user) {
      user.plan = planName;
    }
    saveLocalDb(db);

    const vpa = gwConfig?.credentials?.vpa || 'careerwaves@okaxis';
    const merchantName = gwConfig?.credentials?.merchant_name || 'CareerWaves';
    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(
      merchantName
    )}&am=${amount}&cu=INR&tn=${encodeURIComponent(`CareerWave ${planName}`)}`;

    return jsonResponse({
      success: true,
      order,
      invoice,
      checkoutSession: {
        gateway,
        environment: gwConfig?.environment || 'sandbox',
        orderId,
        gatewayOrderId: order.gateway_order_id,
        amount,
        currency: 'INR',
        upiIntentUrl,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
          upiIntentUrl
        )}`,
      },
    });
  }

  if (pathname === '/api/payment/verify' && method === 'POST') {
    const user = resolveLocalUser(db, headers, body);
    if (user && body.planName) {
      user.plan = body.planName;
      saveLocalDb(db);
    }
    return jsonResponse({ success: true });
  }

  if (pathname.startsWith('/api/billing/invoices/') && pathname.endsWith('/pdf')) {
    const parts = pathname.split('/');
    const invId = parts[parts.length - 2] || 'inv_1001';
    const user = resolveLocalUser(db, headers, body);
    const inv = db.invoices.find((i) => i.id === invId) || {
      id: invId,
      user_name: user?.full_name || searchParams.get('name') || 'CareerWave Subscriber',
      user_email: user?.email || searchParams.get('email') || 'member@careerwave.in',
      plan_name: searchParams.get('plan') || user?.plan || 'Pro',
      billing_interval: searchParams.get('interval') || 'month',
      amount: Number(searchParams.get('amount') || 1499),
      currency: 'INR',
      status: 'paid',
      provider_invoice_id: `tx_${invId}`,
      gateway_name: searchParams.get('gateway') || 'razorpay',
      created_at: nowIso,
    };
    const pdfBytes = generateSubscriptionInvoicePdfBytes(inv);
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CareerWave_Invoice_${inv.id}.pdf"`,
      },
    });
  }

  // 8. Resume Parse, Score, Tailor & Enhance
  if (pathname === '/api/resume/parse' && method === 'POST') {
    const rawText = String(body.rawText || body.fileName || 'Software & AI Engineer Resume');
    const extractedSkills = normalizeSkillsWithTaxonomy({}, rawText, DEFAULT_SKILLS_TAXONOMY);
    const allSkills = [
      ...extractedSkills.languages,
      ...extractedSkills.frameworks,
      ...extractedSkills.cloudAndDevOps,
      ...extractedSkills.aiAndData,
    ];
    const finalSkills =
      allSkills.length > 0 ? allSkills.slice(0, 10) : ['React', 'TypeScript', 'Python', 'Node.js', 'SQL'];

    const structured = normalizeCanonicalResume({
      contact: {
        fullName: body.candidateName || 'Candidate',
        email: body.candidateEmail || 'candidate@example.com',
        phone: '+91 98765 43210',
        location: 'Bengaluru, India',
      },
      summary:
        rawText.length > 40
          ? rawText.slice(0, 280)
          : 'Results-driven Software & AI Engineer experienced in building scalable full-stack web applications and LLM workflows.',
      skills: {
        languages: finalSkills.slice(0, 3),
        frameworks: finalSkills.slice(3, 6),
        cloudAndDevOps: finalSkills.slice(6, 8),
        aiAndData: finalSkills.slice(8, 10),
      },
      experience: [
        {
          id: 'exp-1',
          role: 'Software & AI Engineer',
          company: 'Technology Labs',
          location: 'Bengaluru, India',
          period: 'Jan 2023 – Present',
          bullets: [
            'Engineered full-stack web and AI microservices using TypeScript, React, Python, and PostgreSQL, improving response latency by 35%.',
            'Architected automated CI/CD pipelines and REST API integrations serving 25,000+ monthly active users.',
          ],
        },
      ],
      projects: [],
      education: [
        {
          id: 'edu-1',
          degree: 'B.Tech in Computer Science & Engineering',
          institution: 'Indian Institute of Technology',
          period: '2019 – 2023',
        },
      ],
    });
    const generalScore = computeGeneralAtsScore(structured, DEFAULT_SKILLS_TAXONOMY);
    structured.atsScore = generalScore.overallScore;
    structured.generalScoreBreakdown = generalScore;

    return jsonResponse({
      success: true,
      data: structured,
      rawExtractedText: rawText,
      inferredProfile: {
        title: structured.experience?.[0]?.role || 'Software & AI Engineer',
        target_role: 'Full Stack & AI Engineer',
        experience_level: 'Early Career (1-3 yrs)',
        career_track: 'Generative AI',
        location: structured.contact?.location || 'Bengaluru, India',
        skills: finalSkills,
        bio: structured.summary,
      },
    });
  }

  if (pathname === '/api/resume/score' && method === 'POST') {
    const resume = normalizeCanonicalResume(body.resume || {});
    const generalScore = computeGeneralAtsScore(resume, DEFAULT_SKILLS_TAXONOMY);
    const jobMatch = body.jobDescription
      ? computeJobMatchScore(resume, String(body.jobDescription), DEFAULT_SKILLS_TAXONOMY)
      : null;
    return jsonResponse({
      success: true,
      generalScore,
      jobMatchScore: jobMatch,
      atsScore: jobMatch ? jobMatch.overallMatchScore : generalScore.overallScore,
    });
  }

  // 9. Admin Overview & Portable Cloud Schema Export
  if (pathname === '/api/admin/overview') {
    return jsonResponse({
      success: true,
      users: db.users,
      plans: db.plans,
      subscriptions: [],
      invoices: db.invoices,
      paymentGateways: db.gateways,
      paymentOrders: db.orders,
      jobsCount: db.jobs.length,
    });
  }

  if (pathname === '/api/admin/schema-export') {
    const dialect = (searchParams.get('dialect') || 'mysql') as 'mysql' | 'postgres' | 'sqlite' | 'json';
    const liveData = {
      users: db.users,
      plans: db.plans,
      invoices: db.invoices,
      paymentGateways: db.gateways,
      paymentOrders: db.orders,
      jobs: db.jobs,
    };
    if (dialect === 'json') {
      return jsonResponse({
        success: true,
        schemaVersion: '2.0.0',
        tablesCount: UNIFIED_SCHEMA_TABLES.length,
        tables: UNIFIED_SCHEMA_TABLES,
        data: liveData,
      });
    }
    const sql = generatePortableCloudSql(dialect, liveData);
    return new Response(sql, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="careerwave_${dialect}_migration.sql"`,
      },
    });
  }

  return jsonResponse({ success: true });
}

let fallbackInstalled = false;
const nativeFetch: typeof fetch =
  typeof window !== 'undefined' && typeof window.fetch === 'function'
    ? window.fetch.bind(window)
    : fetch;

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let urlStr = '';
  if (typeof input === 'string') {
    urlStr = input;
  } else if (input instanceof URL) {
    urlStr = input.toString();
  } else if (input && typeof input.url === 'string') {
    urlStr = input.url;
  }

  let parsedUrl: URL | null = null;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    parsedUrl = new URL(urlStr, base);
  } catch {
    parsedUrl = null;
  }

  const isSameOriginApi =
    parsedUrl &&
    (typeof window === 'undefined' || parsedUrl.origin === window.location.origin) &&
    parsedUrl.pathname.startsWith('/api/');

  if (!isSameOriginApi || !parsedUrl) {
    return nativeFetch(input, init);
  }

  const method = (
    init?.method ||
    (typeof input === 'object' && 'method' in input ? input.method : 'GET') ||
    'GET'
  ).toUpperCase();

  const headers: Record<string, string> = {};
  const rawHeaders = init?.headers;
  if (rawHeaders instanceof Headers) {
    rawHeaders.forEach((v, k) => {
      headers[k] = v;
    });
  } else if (Array.isArray(rawHeaders)) {
    for (const [k, v] of rawHeaders) {
      headers[k] = v;
    }
  } else if (rawHeaders && typeof rawHeaders === 'object') {
    Object.assign(headers, rawHeaders);
  }

  try {
    const response = await nativeFetch(input, init);
    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    // If the backend returned a valid binary file (PDF / Excel / SQL), pass it through
    if (
      response.ok &&
      (contentType.includes('application/pdf') ||
        contentType.includes('spreadsheetml') ||
        contentType.includes('octet-stream'))
    ) {
      return response;
    }

    // If the backend returned JSON and it is not a generic 404/502/503/504 missing-server response
    if (contentType.includes('application/json') && response.status < 500) {
      if (response.status !== 404 && response.status !== 405) {
        return response;
      }
      // Check if 404 JSON is a business error from Express (like USER_NOT_FOUND) vs missing API route
      const cloned = response.clone();
      try {
        const errJson = await cloned.json();
        if (errJson && errJson.code && errJson.code !== 'ROUTE_NOT_FOUND') {
          return response;
        }
      } catch {
        // fall through to local serverless handler
      }
    }
  } catch {
    // Network error or unreachable backend: fall through to local serverless handler
  }

  return handleLocalApiRequest(
    parsedUrl.pathname,
    parsedUrl.searchParams,
    method,
    headers,
    init?.body
  );
}

export function installStaticServerlessFallback() {
  if (fallbackInstalled || typeof window === 'undefined') return;
  fallbackInstalled = true;

  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || desc.writable) {
      window.fetch = apiFetch;
    } else if (desc.configurable) {
      Object.defineProperty(window, 'fetch', {
        value: apiFetch,
        writable: true,
        configurable: true,
      });
    }
  } catch {
    // In sandboxed iframes where window.fetch is non-configurable getter-only, callers use apiFetch directly
  }
}

