// @ts-nocheck — Supabase Deno Edge Function runtime
// ============================================================================
// SUPABASE EDGE FUNCTION: "fetch-jobs"
// Multi-Source Live Job Aggregator (JSearch RapidAPI + Adzuna + Jooble)
// - Calls enabled aggregator APIs in parallel via Promise.allSettled
// - Normalizes every listing into NormalizedJob
// - Sanitizes HTML descriptions & validates https:// apply_url
// - De-duplicates by normalized (title + company + location) keeping best apply link
// - Caches in public.jobs with upsert on (source, external_id) and skips
//   refetching the same query within 30 minutes unless forceRefresh = true
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

export interface NormalizedJobRecord {
  source: string;
  external_id: string;
  title: string;
  company: string;
  company_logo: string;
  location: string;
  is_remote: boolean;
  employment_type: EmploymentType;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  description: string;
  required_skills: string[];
  posted_at: string;
  apply_url: string;
  source_platform: SourcePlatform;
  sector: string;
  fetched_at: string;
}

function isValidHttpsUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

function sanitizeDescription(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
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

function detectPlatform(publisher?: string | null, applyUrl?: string | null): SourcePlatform {
  const combined = `${publisher || ''} ${applyUrl || ''}`.toLowerCase();
  if (combined.includes('linkedin')) return 'LinkedIn';
  if (combined.includes('indeed')) return 'Indeed';
  if (combined.includes('apna')) return 'Apna';
  if (combined.includes('naukri')) return 'Naukri';
  if (combined.includes('adzuna')) return 'Adzuna';
  if (combined.includes('jooble')) return 'Jooble';
  if (combined.includes('google')) return 'Google';
  return 'Company Site';
}

function normalizeEmpType(raw?: string | null, title?: string | null): EmploymentType {
  const combined = `${raw || ''} ${title || ''}`.toLowerCase();
  if (combined.includes('intern') || combined.includes('trainee')) return 'internship';
  if (combined.includes('part-time') || combined.includes('part time') || combined.includes('parttime')) return 'part-time';
  if (combined.includes('contract') || combined.includes('freelance') || combined.includes('temporary')) return 'contract';
  return 'full-time';
}

function extractSkillsFromText(text: string): string[] {
  const catalog = [
    'Python', 'TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'SQL', 'PostgreSQL',
    'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'PyTorch', 'TensorFlow',
    'LangChain', 'LangGraph', 'RAG', 'FastAPI', 'Java', 'Spring Boot', 'Go', 'Rust', 'GraphQL',
    'REST APIs', 'Tailwind CSS', 'Git', 'CI/CD', 'Terraform', 'Apache Spark', 'Kafka',
    'Snowflake', 'Tableau', 'Power BI', 'Machine Learning', 'Deep Learning', 'System Design',
  ];
  const lower = (text || '').toLowerCase();
  const matched = catalog.filter((skill) => {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(lower);
  });
  return matched.length > 0 ? matched.slice(0, 8) : ['TypeScript', 'Python', 'SQL', 'Cloud Systems'];
}

function inferSector(title: string, description: string, requestedSector?: string): string {
  if (requestedSector && requestedSector !== 'All') return requestedSector;
  const text = `${title} ${description}`.toLowerCase();
  if (/\b(genai|generative ai|llm|rag|langchain|langgraph|agentic)\b/.test(text)) return 'GenAI';
  if (/\b(machine learning|deep learning|pytorch|tensorflow|nlp|mlops|ai architect)\b/.test(text)) return 'Enterprise AI';
  if (/\b(fintech|payment|trading|quant|banking|upi|risk)\b/.test(text)) return 'FinTech';
  if (/\b(data analyst|analytics|bi|tableau|power bi|snowflake|spark|etl|data engineer)\b/.test(text)) return 'Analytics';
  if (/\b(devops|sre|kubernetes|terraform|cloud|consulting)\b/.test(text)) return 'IT Services';
  return 'Software';
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 14000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 1. Primary Source: JSearch API on RapidAPI
async function fetchFromJSearch(params: {
  query: string;
  location: string;
  remote: boolean;
  dateWindow: string;
  employmentType: string;
  sector: string;
  page: number;
  apiKey: string;
}): Promise<NormalizedJobRecord[]> {
  const datePostedMap: Record<string, string> = {
    '24h': 'today',
    '72h': '3days',
    '7d': 'week',
    all: 'month',
  };
  const empMap: Record<string, string> = {
    'full-time': 'FULLTIME',
    internship: 'INTERN',
    'part-time': 'PARTTIME',
    contract: 'CONTRACTOR',
  };

  const searchQuery = `${params.query || params.sector || 'Software Engineer'} in ${params.location || 'India'}`.trim();
  const url = new URL('https://jsearch.p.rapidapi.com/search');
  url.searchParams.set('query', searchQuery);
  url.searchParams.set('page', String(Math.max(1, params.page || 1)));
  url.searchParams.set('num_pages', '1');
  url.searchParams.set('date_posted', datePostedMap[params.dateWindow] || 'week');
  if (params.remote) {
    url.searchParams.set('remote_jobs_only', 'true');
  }
  if (params.employmentType && empMap[params.employmentType]) {
    url.searchParams.set('employment_types', empMap[params.employmentType]);
  }

  const res = await fetchWithTimeout(url.toString(), {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': params.apiKey,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  });

  if (res.status === 429) {
    throw new Error('JSearch rate limit exceeded (HTTP 429).');
  }
  if (!res.ok) {
    throw new Error(`JSearch HTTP ${res.status}`);
  }

  const payload = await res.json();
  const items = Array.isArray(payload?.data) ? payload.data : [];
  const nowIso = new Date().toISOString();

  return items.map((item: any): NormalizedJobRecord => {
    const title = String(item.job_title || 'Software Engineer').trim();
    const company = String(item.employer_name || 'Technology Partner').trim();
    const city = [item.job_city, item.job_state, item.job_country].filter(Boolean).join(', ');
    const location = city || params.location || 'India';
    const description = sanitizeDescription(item.job_description || '');
    const applyUrl = isValidHttpsUrl(item.job_apply_link)
      ? item.job_apply_link.trim()
      : isValidHttpsUrl(item.job_google_link)
      ? item.job_google_link.trim()
      : '';

    const rawMin = typeof item.job_min_salary === 'number' ? item.job_min_salary : null;
    const rawMax = typeof item.job_max_salary === 'number' ? item.job_max_salary : null;
    const currency = String(item.job_salary_currency || 'INR').toUpperCase();

    return {
      source: 'jsearch',
      external_id: String(item.job_id || `${company}_${title}_${location}`),
      title,
      company,
      company_logo:
        isValidHttpsUrl(item.employer_logo)
          ? item.employer_logo
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(company)}`,
      location,
      is_remote: Boolean(item.job_is_remote) || /remote/i.test(location),
      employment_type: normalizeEmpType(item.job_employment_type, title),
      salary_min: rawMin ? Math.round(rawMin) : null,
      salary_max: rawMax ? Math.round(rawMax) : null,
      currency,
      description: description || `${title} role at ${company} (${location}).`,
      required_skills: Array.isArray(item.job_required_skills) && item.job_required_skills.length > 0
        ? item.job_required_skills.map((s: any) => String(s))
        : extractSkillsFromText(`${title} ${description}`),
      posted_at: item.job_posted_at_datetime_utc
        ? new Date(item.job_posted_at_datetime_utc).toISOString()
        : nowIso,
      apply_url: applyUrl,
      source_platform: detectPlatform(item.job_publisher, applyUrl),
      sector: inferSector(title, description, params.sector),
      fetched_at: nowIso,
    };
  });
}

// 2. Secondary Source: Adzuna API
async function fetchFromAdzuna(params: {
  query: string;
  location: string;
  remote: boolean;
  dateWindow: string;
  sector: string;
  page: number;
  appId: string;
  appKey: string;
}): Promise<NormalizedJobRecord[]> {
  const country = /united states|usa|san francisco|new york|seattle/i.test(params.location) ? 'us' : 'in';
  const pageNum = Math.max(1, params.page || 1);
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${pageNum}`);
  url.searchParams.set('app_id', params.appId);
  url.searchParams.set('app_key', params.appKey);
  url.searchParams.set('results_per_page', '15');
  url.searchParams.set('what', params.query || params.sector || 'Software Engineer');
  if (params.location && params.location !== 'All') {
    url.searchParams.set('where', params.location);
  }
  if (params.dateWindow === '24h') url.searchParams.set('max_days_old', '1');
  else if (params.dateWindow === '72h') url.searchParams.set('max_days_old', '3');
  else if (params.dateWindow === '7d') url.searchParams.set('max_days_old', '7');

  const res = await fetchWithTimeout(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Adzuna HTTP ${res.status}`);
  }

  const payload = await res.json();
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const nowIso = new Date().toISOString();

  return results.map((item: any): NormalizedJobRecord => {
    const title = sanitizeDescription(item.title || 'Software Engineer');
    const company = String(item.company?.display_name || 'Hiring Organization').trim();
    const location = String(item.location?.display_name || params.location || 'India').trim();
    const description = sanitizeDescription(item.description || '');
    const applyUrl = isValidHttpsUrl(item.redirect_url) ? item.redirect_url.trim() : '';

    return {
      source: 'adzuna',
      external_id: String(item.id || `${company}_${title}`),
      title,
      company,
      company_logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(company)}`,
      location,
      is_remote: params.remote || /remote/i.test(`${title} ${location} ${description}`),
      employment_type: normalizeEmpType(item.contract_time || item.contract_type, title),
      salary_min: typeof item.salary_min === 'number' ? Math.round(item.salary_min) : null,
      salary_max: typeof item.salary_max === 'number' ? Math.round(item.salary_max) : null,
      currency: country === 'in' ? 'INR' : 'USD',
      description,
      required_skills: extractSkillsFromText(`${title} ${description}`),
      posted_at: item.created ? new Date(item.created).toISOString() : nowIso,
      apply_url: applyUrl,
      source_platform: 'Adzuna',
      sector: inferSector(title, description, params.sector),
      fetched_at: nowIso,
    };
  });
}

// 3. Secondary Source: Jooble API
async function fetchFromJooble(params: {
  query: string;
  location: string;
  remote: boolean;
  sector: string;
  page: number;
  apiKey: string;
}): Promise<NormalizedJobRecord[]> {
  const url = `https://jooble.org/api/${encodeURIComponent(params.apiKey)}`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keywords: `${params.query || params.sector || 'Software Engineer'}${params.remote ? ' remote' : ''}`,
      location: params.location || 'India',
      page: String(Math.max(1, params.page || 1)),
    }),
  });

  if (!res.ok) {
    throw new Error(`Jooble HTTP ${res.status}`);
  }

  const payload = await res.json();
  const items = Array.isArray(payload?.jobs) ? payload.jobs : [];
  const nowIso = new Date().toISOString();

  return items.map((item: any): NormalizedJobRecord => {
    const title = sanitizeDescription(item.title || 'Software Engineer');
    const company = String(item.company || 'Enterprise Employer').trim();
    const location = String(item.location || params.location || 'India').trim();
    const description = sanitizeDescription(item.snippet || '');
    const applyUrl = isValidHttpsUrl(item.link) ? item.link.trim() : '';

    return {
      source: 'jooble',
      external_id: String(item.id || `${company}_${title}_${location}`),
      title,
      company,
      company_logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(company)}`,
      location,
      is_remote: params.remote || /remote/i.test(`${title} ${location}`),
      employment_type: normalizeEmpType(item.type, title),
      salary_min: null,
      salary_max: null,
      currency: 'INR',
      description,
      required_skills: extractSkillsFromText(`${title} ${description}`),
      posted_at: item.updated ? new Date(item.updated).toISOString() : nowIso,
      apply_url: applyUrl,
      source_platform: detectPlatform(item.source, applyUrl) === 'Company Site' ? 'Jooble' : detectPlatform(item.source, applyUrl),
      sector: inferSector(title, description, params.sector),
      fetched_at: nowIso,
    };
  });
}

function deduplicateJobs(jobs: NormalizedJobRecord[]): NormalizedJobRecord[] {
  const map = new Map<string, NormalizedJobRecord>();
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/\b(private|pvt|limited|ltd|inc|corp|india|technologies|labs)\b/g, '')
      .replace(/[^a-z0-9]/g, '');

  for (const job of jobs) {
    const key = `${norm(job.title)}__${norm(job.company)}__${norm(job.location.split(',')[0])}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, job);
      continue;
    }
    const existingHasValidLink = isValidHttpsUrl(existing.apply_url);
    const candidateHasValidLink = isValidHttpsUrl(job.apply_url);
    if (candidateHasValidLink && !existingHasValidLink) {
      map.set(key, job);
    }
  }
  return Array.from(map.values());
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || body.role || '').trim();
    const location = String(body.location || 'India').trim();
    const remote = Boolean(body.remote);
    const dateWindow = String(body.dateWindow || body.timeframe || '7d').trim();
    const sector = String(body.sector || 'All').trim();
    const employmentType = String(body.employmentType || 'all').trim();
    const page = Math.max(1, Number(body.page) || 1);
    const forceRefresh = Boolean(body.forceRefresh);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    const querySignature = JSON.stringify({
      q: query.toLowerCase(),
      loc: location.toLowerCase(),
      rem: remote,
      dw: dateWindow,
      sec: sector,
      emp: employmentType,
      p: page,
    });

    // 1. Check 30-minute query cache in Supabase if not forceRefresh
    if (supabase && !forceRefresh) {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: cachedMeta } = await supabase
        .from('job_query_cache')
        .select('*')
        .eq('query_hash', querySignature)
        .gte('fetched_at', thirtyMinsAgo)
        .maybeSingle();

      if (cachedMeta && Array.isArray(cachedMeta.job_ids) && cachedMeta.job_ids.length > 0) {
        const { data: cachedRows } = await supabase
          .from('jobs')
          .select('*')
          .in('external_id', cachedMeta.job_ids);

        if (cachedRows && cachedRows.length > 0) {
          return new Response(
            JSON.stringify({
              success: true,
              fromCache: true,
              cachedAt: cachedMeta.fetched_at,
              jobs: cachedRows,
              sources: cachedMeta.sources_status || [],
              partialFailure: false,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 2. Read aggregator secrets from Supabase Edge Function environment
    const jsearchKey = (Deno.env.get('JSEARCH_API_KEY') || '').trim();
    const adzunaAppId = (Deno.env.get('ADZUNA_APP_ID') || '').trim();
    const adzunaAppKey = (Deno.env.get('ADZUNA_APP_KEY') || '').trim();
    const joobleKey = (Deno.env.get('JOOBLE_API_KEY') || '').trim();

    const tasks: Promise<{ source: string; jobs: NormalizedJobRecord[] }>[] = [];
    const sourcesStatus: any[] = [];

    if (jsearchKey) {
      tasks.push(
        fetchFromJSearch({
          query,
          location,
          remote,
          dateWindow,
          employmentType,
          sector,
          page,
          apiKey: jsearchKey,
        }).then((jobs) => ({ source: 'jsearch', jobs }))
      );
    } else {
      sourcesStatus.push({ source: 'jsearch', configured: false, ok: false, count: 0 });
    }

    if (adzunaAppId && adzunaAppKey) {
      tasks.push(
        fetchFromAdzuna({
          query,
          location,
          remote,
          dateWindow,
          sector,
          page,
          appId: adzunaAppId,
          appKey: adzunaAppKey,
        }).then((jobs) => ({ source: 'adzuna', jobs }))
      );
    } else {
      sourcesStatus.push({ source: 'adzuna', configured: false, ok: false, count: 0 });
    }

    if (joobleKey) {
      tasks.push(
        fetchFromJooble({
          query,
          location,
          remote,
          sector,
          page,
          apiKey: joobleKey,
        }).then((jobs) => ({ source: 'jooble', jobs }))
      );
    } else {
      sourcesStatus.push({ source: 'jooble', configured: false, ok: false, count: 0 });
    }

    // 3. Execute enabled sources in parallel with Promise.allSettled
    const settled = await Promise.allSettled(tasks);
    const collected: NormalizedJobRecord[] = [];
    let partialFailure = false;

    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        collected.push(...outcome.value.jobs);
        sourcesStatus.push({
          source: outcome.value.source,
          configured: true,
          ok: true,
          count: outcome.value.jobs.length,
        });
      } else {
        partialFailure = true;
        sourcesStatus.push({
          source: 'aggregator',
          configured: true,
          ok: false,
          count: 0,
          error: outcome.reason?.message || 'Source request failed',
        });
      }
    }

    const deduped = deduplicateJobs(collected);

    // 4. Upsert normalized jobs into public.jobs on (source, external_id)
    if (supabase && deduped.length > 0) {
      await supabase.from('jobs').upsert(deduped, { onConflict: 'source,external_id' });
      await supabase.from('job_query_cache').upsert({
        query_hash: querySignature,
        query_params: { query, location, remote, dateWindow, sector, employmentType, page },
        job_ids: deduped.map((j) => j.external_id),
        sources_status: sourcesStatus,
        fetched_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        fromCache: false,
        cachedAt: new Date().toISOString(),
        jobs: deduped,
        sources: sourcesStatus,
        partialFailure,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Failed to fetch multi-source jobs.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
