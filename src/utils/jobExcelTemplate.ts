import * as XLSX from 'xlsx';
import {
  NormalizedJob,
  SourcePlatform,
  EmploymentType,
  detectSourcePlatform,
  normalizeEmploymentType,
  inferJobSector,
  formatSalaryRange,
  sanitizeJobDescriptionHtml,
} from '../types/jobs';

export interface ExcelColumnSpec {
  header: string;
  required: boolean;
  exampleJob: string;
  exampleInternship: string;
  description: string;
  acceptedAliases: string[];
}

export const EXCEL_JOB_COLUMNS: ExcelColumnSpec[] = [
  {
    header: 'Company Name',
    required: true,
    exampleJob: 'Razorpay',
    exampleInternship: 'Sarvam AI',
    description: 'Hiring organization or company name.',
    acceptedAliases: ['company name', 'company', 'employer', 'organization', 'firm', 'hiring company'],
  },
  {
    header: 'Role',
    required: true,
    exampleJob: 'Senior AI Application Engineer',
    exampleInternship: 'Generative AI & LLM Engineering Intern',
    description: 'Job or internship title / role.',
    acceptedAliases: ['role', 'job title', 'title', 'position', 'designation', 'profile', 'internship role'],
  },
  {
    header: 'Employment Type',
    required: true,
    exampleJob: 'Full-time',
    exampleInternship: 'Internship',
    description: 'Type of opening: Full-time, Internship, Part-time, or Contract.',
    acceptedAliases: ['employment type', 'job type', 'type', 'category type', 'opening type', 'job or internship'],
  },
  {
    header: 'Applying Link',
    required: true,
    exampleJob: 'https://razorpay.com/jobs/',
    exampleInternship: 'https://www.sarvam.ai/careers',
    description: 'Direct https:// URL where candidates click Apply to submit their application.',
    acceptedAliases: [
      'applying link',
      'apply link',
      'apply url',
      'application link',
      'application url',
      'job link',
      'job url',
      'link',
      'url',
    ],
  },
  {
    header: 'Location',
    required: false,
    exampleJob: 'Bengaluru, Karnataka, India',
    exampleInternship: 'Bengaluru / Remote, India',
    description: 'City, state, or Remote.',
    acceptedAliases: ['location', 'city', 'job location', 'place', 'office location'],
  },
  {
    header: 'Work Mode',
    required: false,
    exampleJob: 'Hybrid',
    exampleInternship: 'Remote',
    description: 'Remote, Hybrid, or On-site (or Yes/No for Remote).',
    acceptedAliases: ['work mode', 'remote', 'is remote', 'mode', 'workplace type'],
  },
  {
    header: 'Salary / Stipend',
    required: false,
    exampleJob: '₹24L – ₹36L/yr',
    exampleInternship: '₹45,000/month (₹5.4L/yr)',
    description: 'Annual CTC range (e.g., ₹18L – ₹28L/yr) or monthly internship stipend.',
    acceptedAliases: ['salary / stipend', 'salary', 'stipend', 'ctc', 'compensation', 'package', 'salary range', 'pay'],
  },
  {
    header: 'Sector',
    required: false,
    exampleJob: 'FinTech',
    exampleInternship: 'GenAI',
    description: 'Software, GenAI, Enterprise AI, FinTech, Analytics, or IT Services.',
    acceptedAliases: ['sector', 'domain', 'industry', 'department', 'track'],
  },
  {
    header: 'Required Skills',
    required: false,
    exampleJob: 'TypeScript, React, Python, LangGraph, PostgreSQL, AWS',
    exampleInternship: 'Python, PyTorch, Prompt Engineering, RAG, FastAPI',
    description: 'Comma-separated list of technical or business skills.',
    acceptedAliases: ['required skills', 'skills', 'key skills', 'tech stack', 'requirements', 'technologies'],
  },
  {
    header: 'Job Description',
    required: false,
    exampleJob:
      'Build high-throughput AI payment workflows, developer copilots, and scalable microservices. Collaborate with product and engineering teams to ship low-latency features.',
    exampleInternship:
      'Work closely with the foundational AI team to build multi-agent evaluation pipelines, RAG benchmarks, and voice model demos.',
    description: 'Summary of the role, responsibilities, and eligibility criteria.',
    acceptedAliases: ['job description', 'description', 'about job', 'details', 'summary', 'role description'],
  },
  {
    header: 'Source Platform',
    required: false,
    exampleJob: 'Company Site',
    exampleInternship: 'LinkedIn',
    description: 'Company Site, LinkedIn, Indeed, Naukri, Apna, or Google.',
    acceptedAliases: ['source platform', 'source', 'platform', 'portal', 'posted on'],
  },
  {
    header: 'Company Logo URL',
    required: false,
    exampleJob: 'https://api.dicebear.com/7.x/initials/svg?seed=Razorpay',
    exampleInternship: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarvam+AI',
    description: 'Optional direct https:// image link for company logo (auto-generated if left blank).',
    acceptedAliases: ['company logo url', 'logo', 'logo url', 'company logo'],
  },
];

export const SAMPLE_EXCEL_ROWS: Record<string, string>[] = [
  {
    'Company Name': 'Razorpay',
    Role: 'Senior AI Application Engineer',
    'Employment Type': 'Full-time',
    'Applying Link': 'https://razorpay.com/jobs/',
    Location: 'Bengaluru, Karnataka, India',
    'Work Mode': 'Hybrid',
    'Salary / Stipend': '₹28L – ₹42L/yr',
    Sector: 'FinTech',
    'Required Skills': 'TypeScript, Python, React, LangGraph, PostgreSQL, Redis, System Design',
    'Job Description':
      'Build developer-first generative AI assistants, automated payment risk triage, and intelligent billing workflows across Razorpay core payment infrastructure. Design autonomous LLM agents and low-latency vector search indices.',
    'Source Platform': 'Company Site',
    'Company Logo URL': '',
  },
  {
    'Company Name': 'Sarvam AI',
    Role: 'Generative AI & Autonomous Agents Intern',
    'Employment Type': 'Internship',
    'Applying Link': 'https://www.linkedin.com/jobs/search/?keywords=Sarvam+AI+Bengaluru',
    Location: 'Bengaluru, Karnataka, India',
    'Work Mode': 'Remote',
    'Salary / Stipend': '₹60,000/month (₹7.2L/yr)',
    Sector: 'GenAI',
    'Required Skills': 'Python, PyTorch, Prompt Engineering, TypeScript, RAG, Large Language Models',
    'Job Description':
      'Collaborate with foundational AI researchers on evaluating multi-agent orchestration frameworks, Indic multilingual voice models, and human-in-the-loop debugging interfaces.',
    'Source Platform': 'LinkedIn',
    'Company Logo URL': '',
  },
  {
    'Company Name': 'Postman',
    Role: 'Full Stack Product Engineer (AI Platform)',
    'Employment Type': 'Full-time',
    'Applying Link': 'https://www.postman.com/company/careers/open-positions/',
    Location: 'Bengaluru, Karnataka, India',
    'Work Mode': 'Remote',
    'Salary / Stipend': '₹24L – ₹36L/yr',
    Sector: 'Software',
    'Required Skills': 'TypeScript, React, Node.js, REST APIs, GraphQL, Docker',
    'Job Description':
      'Craft effortless API collaboration and AI agent testing workflows for 30M+ developers building distributed applications. Build accessible React 19 & TypeScript interfaces with edge caching.',
    'Source Platform': 'Company Site',
    'Company Logo URL': '',
  },
  {
    'Company Name': 'PhonePe',
    Role: 'Software Development Engineer Intern (Payments & UPI)',
    'Employment Type': 'Internship',
    'Applying Link': 'https://www.phonepe.com/careers/',
    Location: 'Pune, Maharashtra, India',
    'Work Mode': 'On-site',
    'Salary / Stipend': '₹80,000/month (₹9.6L/yr)',
    Sector: 'FinTech',
    'Required Skills': 'Java, TypeScript, SQL, Redis, REST APIs, Data Structures',
    'Job Description':
      'Join the core UPI switch and merchant settlements engineering group to build high-availability services processing billions of monthly transactions. Write clean, well-tested services and observability dashboards.',
    'Source Platform': 'Company Site',
    'Company Logo URL': '',
  },
  {
    'Company Name': 'Zepto',
    Role: 'Data Science & Demand Forecasting Intern',
    'Employment Type': 'Internship',
    'Applying Link': 'https://www.zeptonow.com/careers',
    Location: 'Bengaluru, Karnataka, India',
    'Work Mode': 'Hybrid',
    'Salary / Stipend': '₹50,000/month (₹6L/yr)',
    Sector: 'Analytics',
    'Required Skills': 'Python, SQL, Pandas, Machine Learning, Apache Spark, Tableau',
    'Job Description':
      'Work with the Quick-Commerce Data Science squad to optimize 10-minute delivery ETA predictions, dark-store inventory replenishment, and real-time rider dispatch algorithms.',
    'Source Platform': 'Company Site',
    'Company Logo URL': '',
  },
  {
    'Company Name': 'Google India',
    Role: 'Cloud AI Customer Engineer (GenAI & Vertex)',
    'Employment Type': 'Full-time',
    'Applying Link': 'https://www.google.com/about/careers/applications/jobs/results/?location=India&q=AI%20Engineer',
    Location: 'Hyderabad, Telangana, India',
    'Work Mode': 'Hybrid',
    'Salary / Stipend': '₹32L – ₹48L/yr',
    Sector: 'GenAI',
    'Required Skills': 'Python, TypeScript, GCP, Kubernetes, Large Language Models, RAG',
    'Job Description':
      'Guide digital natives and enterprise engineering leaders in architecting multimodal AI applications, RAG grounding pipelines, and Kubernetes inference clusters.',
    'Source Platform': 'Google',
    'Company Logo URL': '',
  },
];

export interface ParsedSheetJobRow {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  job: NormalizedJob;
}

function normalizeHeaderKey(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findColumnValue(rowObj: Record<string, any>, aliases: string[]): string {
  const entries = Object.entries(rowObj);
  for (const [k, v] of entries) {
    const normK = normalizeHeaderKey(k);
    if (aliases.some((alias) => normK === normalizeHeaderKey(alias) || normK.includes(normalizeHeaderKey(alias)))) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        return String(v).trim();
      }
    }
  }
  return '';
}

function parseSalaryNumbers(rawSalary: string): {
  min: number | null;
  max: number | null;
  rangeText: string | undefined;
} {
  const clean = String(rawSalary || '').trim();
  if (!clean) return { min: null, max: null, rangeText: undefined };

  // Check if monthly stipend like "₹45,000/month" or "50000/mo"
  const isMonthly = /month|\/mo|per\s*month|stipend/i.test(clean);
  const lakhMatches = [...clean.matchAll(/(\d+(?:\.\d+)?)\s*(?:l|lpa|lakhs?)\b/gi)];
  if (lakhMatches.length >= 2) {
    const min = Math.round(parseFloat(lakhMatches[0][1]) * 100000);
    const max = Math.round(parseFloat(lakhMatches[1][1]) * 100000);
    return { min, max, rangeText: clean };
  }
  if (lakhMatches.length === 1) {
    const val = Math.round(parseFloat(lakhMatches[0][1]) * 100000);
    return { min: val, max: val, rangeText: clean };
  }

  const numMatches = [...clean.replace(/,/g, '').matchAll(/(\d{4,8})/g)];
  if (numMatches.length >= 2) {
    const n1 = parseInt(numMatches[0][1], 10);
    const n2 = parseInt(numMatches[1][1], 10);
    return {
      min: isMonthly ? n1 * 12 : n1,
      max: isMonthly ? n2 * 12 : n2,
      rangeText: clean,
    };
  }
  if (numMatches.length === 1) {
    const n1 = parseInt(numMatches[0][1], 10);
    const annualized = isMonthly ? n1 * 12 : n1 < 100 ? n1 * 100000 : n1;
    return {
      min: annualized,
      max: annualized,
      rangeText: clean,
    };
  }

  return { min: null, max: null, rangeText: clean };
}

export function normalizeRawRowToJob(rawRow: Record<string, any>, rowIndex: number): ParsedSheetJobRow {
  const company = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[0].acceptedAliases);
  const title = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[1].acceptedAliases);
  const rawType = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[2].acceptedAliases);
  let rawApplyUrl = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[3].acceptedAliases);
  const location =
    findColumnValue(rawRow, EXCEL_JOB_COLUMNS[4].acceptedAliases) || 'Bengaluru / Pan-India';
  const workMode = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[5].acceptedAliases) || 'Hybrid';
  const rawSalary = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[6].acceptedAliases);
  const rawSector = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[7].acceptedAliases);
  const rawSkills = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[8].acceptedAliases);
  const rawDesc = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[9].acceptedAliases);
  const rawPlatform = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[10].acceptedAliases);
  const rawLogo = findColumnValue(rawRow, EXCEL_JOB_COLUMNS[11].acceptedAliases);

  const errors: string[] = [];
  if (!company) errors.push('Missing Company Name');
  if (!title) errors.push('Missing Role / Job Title');

  if (rawApplyUrl && !/^https?:\/\//i.test(rawApplyUrl)) {
    rawApplyUrl = `https://${rawApplyUrl}`;
  } else if (rawApplyUrl && /^http:\/\//i.test(rawApplyUrl)) {
    rawApplyUrl = rawApplyUrl.replace(/^http:\/\//i, 'https://');
  }

  if (!rawApplyUrl) {
    errors.push('Missing Applying Link');
  } else {
    try {
      const parsedUrl = new URL(rawApplyUrl);
      if (!parsedUrl.hostname.includes('.')) {
        errors.push('Invalid Applying Link URL');
      }
    } catch {
      errors.push('Invalid Applying Link URL');
    }
  }

  const employmentType: EmploymentType = normalizeEmploymentType(rawType, title);
  const isRemote =
    /remote|yes|true|work from home|wfh/i.test(workMode) || /remote/i.test(location);

  const salaryParsed = parseSalaryNumbers(rawSalary);
  const skills = rawSkills
    ? rawSkills
        .split(/[,;|•\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : ['Software Engineering', 'Problem Solving', 'System Design'];

  const cleanDescription =
    sanitizeJobDescriptionHtml(rawDesc) ||
    `${title} (${employmentType === 'internship' ? 'Internship' : 'Full-Time'}) opportunity at ${company} in ${location}. Apply directly via the verified application link.`;

  const responsibilities = cleanDescription
    .split(/\n|•|\.(?=\s+[A-Z])/)
    .map((line) => line.replace(/^[-*•\s]+/, '').trim())
    .filter((line) => line.length > 18)
    .slice(0, 5);

  const sourcePlatform: SourcePlatform = detectSourcePlatform(rawPlatform, rawApplyUrl);
  const sector = inferJobSector(title, `${cleanDescription} ${skills.join(' ')}`, rawSector);
  const nowIso = new Date().toISOString();
  const uniqueId = `admin_sheet_${Date.now()}_${rowIndex}`;

  const logoUrl =
    rawLogo && /^https:\/\//i.test(rawLogo)
      ? rawLogo
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(company || 'CW')}`;

  const job: NormalizedJob = {
    id: uniqueId,
    external_id: uniqueId,
    source: 'verified_feed',
    title: title || 'Untitled Role',
    company: company || 'Untitled Company',
    company_logo: logoUrl,
    location,
    is_remote: isRemote,
    remote: isRemote,
    employment_type: employmentType,
    job_type:
      employmentType === 'internship'
        ? 'Internship'
        : employmentType === 'part-time'
        ? 'Part-time'
        : employmentType === 'contract'
        ? 'Contract'
        : 'Full-time',
    type: employmentType === 'internship' ? 'Internship' : 'Full-Time',
    salary_min: salaryParsed.min,
    salary_max: salaryParsed.max,
    currency: 'INR',
    salary_range:
      salaryParsed.rangeText ||
      formatSalaryRange(salaryParsed.min, salaryParsed.max, 'INR') ||
      (employmentType === 'internship' ? 'Competitive Stipend' : 'Competitive INR'),
    description: cleanDescription,
    responsibilities:
      responsibilities.length > 0
        ? responsibilities
        : [
            `Collaborate with engineering and product teams at ${company} on core ${sector} deliverables.`,
            `Write clean, maintainable code using ${skills.slice(0, 3).join(', ')}.`,
          ],
    required_skills: skills,
    requirements: skills,
    posted_at: nowIso,
    fetched_at: nowIso,
    apply_url: rawApplyUrl || 'https://careerwave.in',
    source_platform: sourcePlatform,
    sector,
    tags: [
      'Admin Daily Posting',
      employmentType === 'internship' ? 'Internship' : 'Full-Time',
      workMode || (isRemote ? 'Remote' : 'On-site'),
      sector,
    ],
  };

  return {
    rowNumber: rowIndex + 2, // 1-indexed + header row
    valid: errors.length === 0,
    errors,
    job,
  };
}

/**
 * Parses an ArrayBuffer / Uint8Array from an uploaded .xlsx, .xls, or .csv file into NormalizedJob rows.
 */
export function parseUploadedJobSheetBuffer(buffer: ArrayBuffer | Uint8Array): ParsedSheetJobRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  return rawRows
    .filter((row) =>
      Object.values(row).some((val) => val !== undefined && val !== null && String(val).trim() !== '')
    )
    .map((row, idx) => normalizeRawRowToJob(row, idx));
}

/**
 * Parses pasted CSV / TSV text (e.g. copied directly from Google Sheets or Excel) into NormalizedJob rows.
 */
export function parsePastedSpreadsheetText(rawText: string): ParsedSheetJobRow[] {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return [];
  const workbook = XLSX.read(trimmed, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  return rawRows
    .filter((row) =>
      Object.values(row).some((val) => val !== undefined && val !== null && String(val).trim() !== '')
    )
    .map((row, idx) => normalizeRawRowToJob(row, idx));
}

/**
 * Generates the Sample Excel Workbook (.xlsx) as a Uint8Array (usable in both browser and Node server).
 */
export function generateSampleJobsExcelBytes(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Daily_Jobs_Posting (Sample rows for Jobs & Internships)
  const wsJobs = XLSX.utils.json_to_sheet(SAMPLE_EXCEL_ROWS);
  wsJobs['!cols'] = [
    { wch: 22 }, // Company Name
    { wch: 36 }, // Role
    { wch: 16 }, // Employment Type
    { wch: 48 }, // Applying Link
    { wch: 26 }, // Location
    { wch: 14 }, // Work Mode
    { wch: 24 }, // Salary / Stipend
    { wch: 16 }, // Sector
    { wch: 44 }, // Required Skills
    { wch: 65 }, // Job Description
    { wch: 16 }, // Source Platform
    { wch: 35 }, // Company Logo URL
  ];
  XLSX.utils.book_append_sheet(wb, wsJobs, 'Daily_Jobs_Posting');

  // Sheet 2: Column_Format_Guide (Instructions for Admin)
  const guideRows = EXCEL_JOB_COLUMNS.map((col) => ({
    'Column Header': col.header,
    Required: col.required ? 'REQUIRED' : 'Optional',
    'What to Enter': col.description,
    'Job Example': col.exampleJob,
    'Internship Example': col.exampleInternship,
    'Also Accepts Header Names': col.acceptedAliases.join(', '),
  }));
  const wsGuide = XLSX.utils.json_to_sheet(guideRows);
  wsGuide['!cols'] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 52 },
    { wch: 34 },
    { wch: 34 },
    { wch: 44 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Column_Format_Guide');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

/**
 * Triggers a browser download of the Sample Excel (.xlsx) template for daily job/internship postings.
 */
export function downloadSampleJobsExcel(): void {
  const bytes = generateSampleJobsExcelBytes();
  const blob = new Blob([bytes as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CareerWave-Daily-Jobs-Internships-Sample.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/**
 * Triggers a browser download of the Sample CSV (.csv) template for Google Sheets / Excel.
 */
export function downloadSampleJobsCsv(): void {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_EXCEL_ROWS);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CareerWave-Daily-Jobs-Internships-Sample.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}
