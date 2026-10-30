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
  remote?: boolean; // backwards-compatibility alias
  employment_type: EmploymentType;
  job_type?: string; // backwards-compatibility alias
  type?: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  salary_range?: string;
  description: string;
  responsibilities?: string[];
  required_skills: string[];
  requirements?: string[]; // backwards-compatibility alias
  posted_at: string;
  apply_url: string;
  source_platform: SourcePlatform;
  source?: string; // aggregator key: 'jsearch' | 'adzuna' | 'jooble' | 'verified_feed'
  sector: string;
  fetched_at: string;
  tags?: string[];
  // Resume match fields populated per user
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

/**
 * Validates that an apply_url is a safe, well-formed https:// URL.
 */
export function isValidHttpsApplyUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === 'https:' &&
      Boolean(parsed.hostname) &&
      parsed.hostname.includes('.') &&
      !/^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitizes HTML or raw text in job descriptions to prevent XSS while preserving readable paragraphs and bullets.
 */
export function sanitizeJobDescriptionHtml(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<(iframe|object|embed|form|input|button|meta|link)[^>]*?>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|form|input|button|meta|link)[^>]*?\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Formats an ISO timestamp into "Posted X hours ago" or "Posted X days ago".
 */
export function formatPostedRelativeTime(postedAt?: string | null): string {
  if (!postedAt) return 'Posted recently';
  const ts = new Date(postedAt).getTime();
  if (Number.isNaN(ts)) return 'Posted recently';
  const diffMs = Math.max(0, Date.now() - ts);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) {
    return diffMins <= 5 ? 'Posted just now' : `Posted ${diffMins} mins ago`;
  }
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `Posted ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `Posted ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
  return `Posted ${Math.floor(diffDays / 30)} mo ago`;
}

/**
 * Formats salary range in INR (₹) or original currency.
 */
export function formatSalaryRange(
  salaryMin?: number | null,
  salaryMax?: number | null,
  currency = 'INR'
): string | null {
  if (!salaryMin && !salaryMax) return null;
  const minVal = salaryMin || salaryMax || 0;
  const maxVal = salaryMax || salaryMin || 0;
  if (minVal <= 0 && maxVal <= 0) return null;

  const curr = (currency || 'INR').toUpperCase();
  if (curr === 'INR' || curr === '₹') {
    const fmt = (n: number) => {
      if (n >= 100000) {
        const lakhs = +(n / 100000).toFixed(1).replace(/\.0$/, '');
        return `₹${lakhs}L`;
      }
      return `₹${n.toLocaleString('en-IN')}`;
    };
    return minVal === maxVal ? `${fmt(minVal)}/yr` : `${fmt(minVal)} – ${fmt(maxVal)}/yr`;
  }

  const symbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : `${curr} `;
  const fmtIntl = (n: number) => `${symbol}${Math.round(n).toLocaleString('en-US')}`;
  return minVal === maxVal ? `${fmtIntl(minVal)}/yr` : `${fmtIntl(minVal)} – ${fmtIntl(maxVal)}/yr`;
}

/**
 * Scores how direct/authoritative an apply URL is so deduplication keeps the best apply link.
 */
export function scoreApplyUrlQuality(url?: string | null): number {
  if (!isValidHttpsApplyUrl(url)) return 0;
  const u = (url || '').toLowerCase();
  let score = 10;
  // Direct ATS / company career portals get highest priority
  if (
    /greenhouse\.io|lever\.co|ashbyhq\.com|workday\.com|myworkdayjobs\.com|smartrecruiters\.com|bamboohr\.com|eightfold\.ai|rippling\.com|darwinbox\.in|keka\.com/i.test(
      u
    )
  ) {
    score += 30;
  } else if (/linkedin\.com\/jobs\/view|naukri\.com\/job-listings|apna\.co\/job|indeed\.com\/viewjob/i.test(u)) {
    score += 22;
  } else if (/linkedin\.com|indeed\.com|naukri\.com|apna\.co|glassdoor\.co/i.test(u)) {
    score += 15;
  } else if (!/google\.com\/search/i.test(u)) {
    // Company direct career domain
    score += 25;
  }
  if (u.length > 28) score += 4;
  return score;
}

export function normalizeDedupeKey(job: Pick<NormalizedJob, 'title' | 'company' | 'location'>): string {
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/\b(private|pvt|limited|ltd|inc|corp|llp|india|technologies|technology|labs|solutions)\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  const locPart = (job.location || '')
    .toLowerCase()
    .split(',')[0]
    .replace(/bangalore/g, 'bengaluru')
    .replace(/[^a-z0-9]/g, '');
  return `${norm(job.title)}__${norm(job.company)}__${locPart || 'india'}`;
}

/**
 * De-duplicates jobs by normalized (title + company + location) and keeps the listing with the best apply_url.
 */
export function deduplicateNormalizedJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const map = new Map<string, NormalizedJob>();
  for (const job of jobs) {
    const key = normalizeDedupeKey(job);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, job);
      continue;
    }
    const existingUrlScore = scoreApplyUrlQuality(existing.apply_url);
    const candidateUrlScore = scoreApplyUrlQuality(job.apply_url);
    if (
      candidateUrlScore > existingUrlScore ||
      (candidateUrlScore === existingUrlScore &&
        (job.description?.length || 0) > (existing.description?.length || 0))
    ) {
      map.set(key, {
        ...job,
        required_skills:
          job.required_skills?.length >= (existing.required_skills?.length || 0)
            ? job.required_skills
            : existing.required_skills,
        salary_min: job.salary_min ?? existing.salary_min,
        salary_max: job.salary_max ?? existing.salary_max,
      });
    }
  }
  return Array.from(map.values());
}

/**
 * Infers normalized SourcePlatform from publisher/source string or apply_url.
 */
export function detectSourcePlatform(
  publisherOrSource?: string | null,
  applyUrl?: string | null
): SourcePlatform {
  const combined = `${publisherOrSource || ''} ${applyUrl || ''}`.toLowerCase();
  if (combined.includes('linkedin')) return 'LinkedIn';
  if (combined.includes('indeed')) return 'Indeed';
  if (combined.includes('apna')) return 'Apna';
  if (combined.includes('naukri')) return 'Naukri';
  if (combined.includes('adzuna')) return 'Adzuna';
  if (combined.includes('jooble')) return 'Jooble';
  if (combined.includes('google')) return 'Google';
  return 'Company Site';
}

/**
 * Infers normalized EmploymentType from raw string or title.
 */
export function normalizeEmploymentType(
  rawType?: string | null,
  title?: string | null
): EmploymentType {
  const combined = `${rawType || ''} ${title || ''}`.toLowerCase();
  if (combined.includes('intern') || combined.includes('trainee') || combined.includes('apprentice')) {
    return 'internship';
  }
  if (combined.includes('part-time') || combined.includes('part time') || combined.includes('parttime')) {
    return 'part-time';
  }
  if (
    combined.includes('contract') ||
    combined.includes('freelance') ||
    combined.includes('consultant') ||
    combined.includes('temporary')
  ) {
    return 'contract';
  }
  return 'full-time';
}

/**
 * Infers sector from title, description, and skills.
 */
export function inferJobSector(
  title: string,
  description: string,
  explicitSector?: string
): string {
  if (explicitSector && explicitSector !== 'All') return explicitSector;
  const text = `${title} ${description}`.toLowerCase();
  if (/\b(genai|generative ai|llm|rag|langchain|langgraph|prompt|agentic)\b/.test(text)) {
    return 'GenAI';
  }
  if (/\b(machine learning|deep learning|pytorch|tensorflow|nlp|computer vision|ai architect|mlops)\b/.test(text)) {
    return 'Enterprise AI';
  }
  if (/\b(fintech|payment|trading|quant|banking|upi|ledger|risk)\b/.test(text)) {
    return 'FinTech';
  }
  if (/\b(data analyst|analytics|bi|tableau|power bi|snowflake|spark|etl|data engineer|clickhouse)\b/.test(text)) {
    return 'Analytics';
  }
  if (/\b(devops|sre|kubernetes|terraform|cloud infrastructure|aws|gcp|azure|consulting|sap)\b/.test(text)) {
    return 'IT Services';
  }
  return 'Software';
}
