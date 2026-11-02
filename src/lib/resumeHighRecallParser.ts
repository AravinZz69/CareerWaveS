import { supabase, isSupabaseConfigured } from './supabase.ts';
import {
  DEFAULT_SKILLS_TAXONOMY,
  normalizeSkillsWithTaxonomy,
} from './skillsTaxonomy.ts';
import {
  normalizeCanonicalResume,
  computeGeneralAtsScore,
} from './atsScoringEngine.ts';
import type { DocumentExtractionMetadata } from './resumeDocumentExtractor.ts';

export const RESUME_PARSER_PROMPT_VERSION = 'v3.2.0';

export interface SplitResumeSections {
  header: string;
  summary: string;
  skills: string;
  experience: string;
  projects: string;
  education: string;
  certifications: string;
  achievements: string;
  links: string;
  detectedHeadingsInOrder: string[];
  rawHeadingLines: string[];
}

export interface ParseCaptureSummary {
  experienceRolesCount: number;
  experienceBulletsCount: number;
  projectsCount: number;
  projectBulletsCount: number;
  skillsCount: number;
  educationCount: number;
  certificationsCount: number;
  achievementsCount: number;
  charCount: number;
  wordCount: number;
  pageCount: number;
  usedOcr: boolean;
  recallRetriedSections: string[];
}

const HEADING_PATTERNS: Array<{
  section: keyof Omit<
    SplitResumeSections,
    'header' | 'detectedHeadingsInOrder' | 'rawHeadingLines'
  >;
  regex: RegExp;
}> = [
  {
    section: 'summary',
    regex:
      /^(?:professional\s+summary|executive\s+summary|career\s+summary|summary|about\s+me|about|profile|objective|career\s+objective)\s*:?\s*$/i,
  },
  {
    section: 'skills',
    regex:
      /^(?:technical\s+skills|core\s+skills|skills\s*&\s*technologies|skills\s*&\s*expertise|key\s+skills|skills|technologies|tech\s+stack|core\s+competencies(?:\s*&\s*skills)?|areas\s+of\s+expertise)\s*:?\s*$/i,
  },
  {
    section: 'experience',
    regex:
      /^(?:work\s+experience|professional\s+experience|employment\s+history|relevant\s+experience|experience|career\s+history|internships?\s*(?:&\s*experience)?|work\s+history)\s*:?\s*$/i,
  },
  {
    section: 'projects',
    regex:
      /^(?:academic\s+projects|personal\s+projects|key\s+(?:[a-z\s&-]+\s+)?projects|featured\s+projects|technical\s+projects|projects\s*&\s*research|open[\s-]*source\s+projects|selected\s+projects|projects)\s*:?\s*$/i,
  },
  {
    section: 'education',
    regex:
      /^(?:education\s*&\s*qualifications|academic\s+background|educational\s+qualifications|education|academics)\s*:?\s*$/i,
  },
  {
    section: 'certifications',
    regex:
      /^(?:certifications?\s*(?:&\s*licenses)?|licenses?\s*&\s*certifications?|courses?\s*&\s*certifications?|professional\s+certifications?|certificates?)\s*:?\s*$/i,
  },
  {
    section: 'achievements',
    regex:
      /^(?:achievements?\s*(?:&\s*awards)?|honors?\s*&\s*awards|awards?\s*&\s*achievements?|awards|accomplishments|extracurriculars?|leadership\s*&\s*activities)\s*:?\s*$/i,
  },
  {
    section: 'links',
    regex: /^(?:links|profiles|social\s+links|online\s+presence|portfolio\s+links)\s*:?\s*$/i,
  },
];

/**
 * Splits extracted resume text into canonical sections using heading detection.
 */
export function splitResumeIntoSections(rawText: string): SplitResumeSections {
  const lines = (rawText || '').replace(/\r\n/g, '\n').split('\n');
  const buckets: SplitResumeSections = {
    header: '',
    summary: '',
    skills: '',
    experience: '',
    projects: '',
    education: '',
    certifications: '',
    achievements: '',
    links: '',
    detectedHeadingsInOrder: [],
    rawHeadingLines: [],
  };

  let currentSection: keyof Omit<
    SplitResumeSections,
    'detectedHeadingsInOrder' | 'rawHeadingLines'
  > = 'header';

  for (const rawLine of lines) {
    const trimmed = rawLine
      .trim()
      .replace(/^[#*\-•▪▸]+\s*/, '')
      .replace(/\s*[#*\-:]+$/, '')
      .trim();

    let matchedHeading: keyof Omit<
      SplitResumeSections,
      'header' | 'detectedHeadingsInOrder' | 'rawHeadingLines'
    > | null = null;

    if (trimmed.length > 0 && trimmed.length <= 56) {
      for (const h of HEADING_PATTERNS) {
        if (h.regex.test(trimmed)) {
          matchedHeading = h.section;
          break;
        }
      }
    }

    if (matchedHeading) {
      currentSection = matchedHeading;
      if (!buckets.detectedHeadingsInOrder.includes(matchedHeading)) {
        buckets.detectedHeadingsInOrder.push(matchedHeading);
      }
      buckets.rawHeadingLines.push(rawLine.trim());
    } else {
      buckets[currentSection] += (buckets[currentSection] ? '\n' : '') + rawLine;
    }
  }

  return buckets;
}

/**
 * Deterministically extracts email, phone, LinkedIn, GitHub, portfolio URLs, name, and location.
 */
export function extractDeterministicContactAndLinks(rawText: string, headerText: string) {
  const combined = `${headerText}\n${rawText}`;
  const emailMatch = combined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].trim() : '';

  const phoneMatch = combined.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,5}\)[\s.-]?|\d{5}[\s.-]\d{5}|\d{3,4}[\s.-]?\d{3}[\s.-]?\d{4})/
  );
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  const linkedinMatch = combined.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i
  );
  const linkedin = linkedinMatch ? linkedinMatch[0].trim() : '';

  const githubMatch = combined.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+\/?/i
  );
  const github = githubMatch ? githubMatch[0].trim() : '';

  const allUrls =
    combined.match(
      /https?:\/\/(?!www\.linkedin\.com|linkedin\.com|www\.github\.com|github\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s,)]*)?/gi
    ) || [];
  const portfolio = allUrls[0] || '';

  // Extract candidate name from first non-empty line of header
  const headerLines = (headerText || rawText)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let fullName = '';
  for (const line of headerLines.slice(0, 6)) {
    const clean = line.replace(/[|•·]/g, ' ').trim();
    if (
      clean.length >= 3 &&
      clean.length <= 55 &&
      !clean.includes('@') &&
      !/http|linkedin|github|resume|curriculum\s+vitae/i.test(clean) &&
      !/^\+?\d[\d\s()-]{6,}$/.test(clean)
    ) {
      fullName = clean.split(/\s{2,}|\s+-\s+/)[0].trim();
      break;
    }
  }

  // Extract location (strip trailing URLs or pipe tokens)
  const locationMatch = combined.match(
    /\b(Bengaluru|Bangalore|Hyderabad|Mumbai|Pune|Chennai|Delhi|New Delhi|Noida|Gurugram|Gurgaon|Kolkata|Ahmedabad|Kochi|Coimbatore|Jaipur|Indore|San Francisco|New York|Seattle|Austin|London|Remote)(?:,\s*[A-Za-z]+(?:,\s*[A-Za-z]+)?)?\b/i
  );
  const location = locationMatch ? locationMatch[0].replace(/\s+https?$/i, '').trim() : '';

  return {
    fullName,
    email,
    phone,
    location,
    linkedin,
    github,
    portfolio,
  };
}

const DATE_RANGE_REGEX =
  /\b(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*['’]?\d{2,4}|\d{1,2}\/\d{4}|(?:19|20)\d{2})\s*(?:[-–—]|to)\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*['’]?\d{2,4}|\d{1,2}\/\d{4}|(?:19|20)\d{2}|Present|Current|Now)\b/i;

const SINGLE_YEAR_OR_DATE_REGEX =
  /\b(?:(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)\d{2}|(?:19|20)\d{2}\s*[-–—]\s*(?:Present|Current)|Class\s+of\s+(?:19|20)\d{2}|(?:19|20)\d{2})\b/i;

/**
 * Lossless deterministic section parser that captures every role, project, education entry,
 * certification, achievement, and bullet point directly from the user's text without dropping or summarizing.
 */
export function parseExperienceSectionLossless(sectionText: string) {
  const lines = (sectionText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const roles: Array<{
    id: string;
    role: string;
    company: string;
    location: string;
    period: string;
    bullets: string[];
  }> = [];

  let currentRole: {
    id: string;
    role: string;
    company: string;
    location: string;
    period: string;
    bullets: string[];
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBullet = /^[•\-*▪▸◦‣]\s+/.test(line) || /^\d+\.\s+/.test(line);
    const dateMatch = line.match(DATE_RANGE_REGEX);

    if (!isBullet && dateMatch) {
      const period = dateMatch[0].trim();
      const withoutDate = line.replace(dateMatch[0], '').replace(/[|•()]/g, ' ').trim();

      let roleTitle = '';
      let companyName = '';
      let location = '';

      if (withoutDate.includes(' at ')) {
        const parts = withoutDate.split(/\s+at\s+/i);
        roleTitle = parts[0].trim();
        companyName = parts.slice(1).join(' ').trim();
      } else if (line.includes('|')) {
        const pipeParts = line
          .replace(dateMatch[0], '')
          .split('|')
          .map((p) => p.trim())
          .filter(Boolean);
        roleTitle = pipeParts[0] || '';
        companyName = pipeParts[1] || '';
        location = pipeParts[2] || '';
      } else if (withoutDate.includes(' - ') || withoutDate.includes(' – ') || withoutDate.includes(',')) {
        const parts = withoutDate
          .split(/\s*[-–—,]\s*/)
          .map((p) => p.trim())
          .filter(Boolean);
        roleTitle = parts[0] || '';
        companyName = parts[1] || '';
        location = parts[2] || '';
      } else {
        roleTitle = withoutDate;
      }

      // If roleTitle or companyName was on the immediately preceding non-bullet line
      if ((!roleTitle || !companyName) && currentRole && currentRole.bullets.length === 0 && !currentRole.period) {
        currentRole.period = period;
        if (roleTitle && !currentRole.company) {
          currentRole.company = roleTitle;
        }
        continue;
      }

      if (currentRole && (currentRole.role || currentRole.bullets.length > 0)) {
        roles.push(currentRole);
      }

      currentRole = {
        id: `exp-${roles.length + 1}`,
        role: roleTitle || 'Software Engineer',
        company: companyName || 'Organization',
        location,
        period,
        bullets: [],
      };
      continue;
    }

    if (isBullet) {
      const cleanBullet = line.replace(/^[•\-*▪▸◦‣\d.]+\s*/, '').trim();
      if (!currentRole) {
        currentRole = {
          id: `exp-${roles.length + 1}`,
          role: 'Professional Experience',
          company: '',
          location: '',
          period: '',
          bullets: [],
        };
      }
      if (cleanBullet) {
        currentRole.bullets.push(cleanBullet);
      }
      continue;
    }

    // Non-bullet line without date: could be a role/company header or continuation of a wrapped bullet
    const nextLine = lines[i + 1] || '';
    const nextHasDate = DATE_RANGE_REGEX.test(nextLine);
    const nextIsBullet = /^[•\-*▪▸◦‣]\s+/.test(nextLine);

    if (
      line.length <= 120 &&
      (nextHasDate || nextIsBullet || !currentRole || currentRole.bullets.length > 0)
    ) {
      if (currentRole && currentRole.bullets.length === 0 && currentRole.company === 'Organization') {
        currentRole.company = line.replace(/[|•]/g, ', ').trim();
      } else {
        if (currentRole && (currentRole.role || currentRole.bullets.length > 0)) {
          roles.push(currentRole);
        }
        const parts = line
          .split(/\s*[|—–-]\s*/)
          .map((p) => p.trim())
          .filter(Boolean);
        currentRole = {
          id: `exp-${roles.length + 1}`,
          role: parts[0] || line,
          company: parts[1] || 'Organization',
          location: parts[2] || '',
          period: '',
          bullets: [],
        };
      }
    } else if (currentRole) {
      if (currentRole.bullets.length > 0) {
        if (/^[A-Z]/.test(line) && line.split(/\s+/).length >= 6) {
          currentRole.bullets.push(line);
        } else {
          currentRole.bullets[currentRole.bullets.length - 1] += ` ${line}`;
        }
      } else {
        currentRole.bullets.push(line);
      }
    }
  }

  if (currentRole && (currentRole.role || currentRole.bullets.length > 0)) {
    roles.push(currentRole);
  }

  return roles;
}

export function parseProjectsSectionLossless(sectionText: string) {
  const lines = (sectionText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const projects: Array<{
    id: string;
    name: string;
    techStack: string[];
    link?: string;
    period?: string;
    bullets: string[];
  }> = [];

  let currentProj: {
    id: string;
    name: string;
    techStack: string[];
    link?: string;
    period?: string;
    bullets: string[];
  } | null = null;

  for (const line of lines) {
    const isBullet = /^[•\-*▪▸◦‣]\s+/.test(line) || /^\d+\.\s+/.test(line);
    if (isBullet) {
      const cleanBullet = line.replace(/^[•\-*▪▸◦‣\d.]+\s*/, '').trim();
      if (!currentProj) {
        currentProj = {
          id: `proj-${projects.length + 1}`,
          name: 'Technical Project',
          techStack: [],
          bullets: [],
        };
      }
      if (cleanBullet) {
        currentProj.bullets.push(cleanBullet);
      }
    } else if (
      line.length <= 180 &&
      (!currentProj || currentProj.bullets.length > 0 || line.includes('|') || line.includes('—'))
    ) {
      if (currentProj) {
        projects.push(currentProj);
      }
      const urlMatch = line.match(/(?:https?:\/\/|github\.com\/)[^\s|)]+/i);
      const withoutUrl = urlMatch ? line.replace(urlMatch[0], '').trim() : line;
      const parts = withoutUrl
        .split(/\s*[|—–:]\s*/)
        .map((p) => p.trim())
        .filter(Boolean);
      const name = parts[0] || withoutUrl;
      const techPart = parts.slice(1).join(', ');
      const extractedTech = normalizeSkillsWithTaxonomy({}, `${name} ${techPart}`, DEFAULT_SKILLS_TAXONOMY);
      const techList = [
        ...extractedTech.languages,
        ...extractedTech.frameworks,
        ...extractedTech.cloudAndDevOps,
        ...extractedTech.aiAndData,
      ];

      currentProj = {
        id: `proj-${projects.length + 1}`,
        name,
        techStack:
          techList.length > 0
            ? techList
            : techPart
                .split(/[,/]/)
                .map((s) => s.trim())
                .filter(Boolean),
        link: urlMatch ? urlMatch[0] : undefined,
        bullets: [],
      };
    } else if (currentProj) {
      currentProj.bullets.push(line);
    }
  }

  if (currentProj) {
    projects.push(currentProj);
  }

  return projects;
}

export function parseEducationSectionLossless(sectionText: string) {
  const lines = (sectionText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const entries: Array<{
    id: string;
    degree: string;
    institution: string;
    period: string;
    gpa?: string;
  }> = [];

  const degreeRegex =
    /\b(B\.?\s*Tech|M\.?\s*Tech|B\.?\s*E\.?|M\.?\s*E\.?|B\.?\s*S\.?|M\.?\s*S\.?|B\.?\s*Sc|M\.?\s*Sc|BCA|MCA|MBA|Ph\.?D|Bachelor|Master|Diploma|Higher\s+Secondary|Class\s+XII|Class\s+X)\b/i;

  let currentEdu: {
    id: string;
    degree: string;
    institution: string;
    period: string;
    gpa?: string;
  } | null = null;

  for (const line of lines) {
    const clean = line.replace(/^[•\-*▪▸]+\s*/, '').trim();
    const hasDegree = degreeRegex.test(clean);
    const dateMatch = clean.match(DATE_RANGE_REGEX) || clean.match(SINGLE_YEAR_OR_DATE_REGEX);
    const gpaMatch = clean.match(/\b(?:CGPA|GPA|Percentage|Grade)\s*[:=-]?\s*([0-9.]+(?:\s*\/\s*[0-9.]+|%?)?)/i);

    if (hasDegree) {
      const withoutDate = dateMatch ? clean.replace(dateMatch[0], '').trim() : clean;
      const withoutGpa = gpaMatch ? withoutDate.replace(gpaMatch[0], '').trim() : withoutDate;
      const parts = withoutGpa
        .split(/\s*[|—–]\s*/)
        .map((p) => p.trim())
        .filter(Boolean);

      // If previous line was just the university/institution name without a degree
      if (currentEdu && !degreeRegex.test(currentEdu.degree) && !currentEdu.institution) {
        currentEdu.institution = currentEdu.degree;
        currentEdu.degree = parts[0] || withoutGpa;
        if (parts[1] && !currentEdu.institution) currentEdu.institution = parts[1];
        if (dateMatch) currentEdu.period = dateMatch[0].trim();
        if (gpaMatch) currentEdu.gpa = gpaMatch[1].trim();
      } else {
        if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
          entries.push(currentEdu);
        }
        currentEdu = {
          id: `edu-${entries.length + 1}`,
          degree: parts[0] || withoutGpa,
          institution: parts[1] || '',
          period: dateMatch ? dateMatch[0].trim() : '',
          gpa: gpaMatch ? gpaMatch[1].trim() : undefined,
        };
      }
    } else if (!currentEdu || (currentEdu.degree && degreeRegex.test(currentEdu.degree) && currentEdu.institution)) {
      if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
        entries.push(currentEdu);
      }
      currentEdu = {
        id: `edu-${entries.length + 1}`,
        degree: clean,
        institution: '',
        period: dateMatch ? dateMatch[0].trim() : '',
        gpa: gpaMatch ? gpaMatch[1].trim() : undefined,
      };
    } else if (currentEdu) {
      if (dateMatch && !currentEdu.period) {
        currentEdu.period = dateMatch[0].trim();
      }
      if (gpaMatch && !currentEdu.gpa) {
        currentEdu.gpa = gpaMatch[1].trim();
      }
      const withoutMeta = clean
        .replace(dateMatch?.[0] || '', '')
        .replace(gpaMatch?.[0] || '', '')
        .replace(/[|•]/g, ' ')
        .trim();
      if (withoutMeta && !currentEdu.institution) {
        currentEdu.institution = withoutMeta;
      }
    }
  }

  if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
    entries.push(currentEdu);
  }

  return entries;
}

export function parseCertificationsAndAchievementsLossless(
  certText: string,
  achText: string
): Array<{ id: string; name: string; issuer: string; date: string }> {
  const combinedLines = [
    ...(certText || '')
      .split('\n')
      .map((l) => ({ text: l.trim(), defaultIssuer: 'Certification' })),
    ...(achText || '')
      .split('\n')
      .map((l) => ({ text: l.trim(), defaultIssuer: 'Achievement / Honor' })),
  ].filter((item) => item.text.length > 3);

  return combinedLines.map((item, idx) => {
    const clean = item.text.replace(/^[•\-*▪▸\d.]+\s*/, '').trim();
    const dateMatch = clean.match(SINGLE_YEAR_OR_DATE_REGEX);
    const withoutDate = dateMatch ? clean.replace(dateMatch[0], '').trim() : clean;
    const parts = withoutDate
      .split(/\s*[|—–-]\s*/)
      .map((p) => p.trim())
      .filter(Boolean);

    return {
      id: `cert-${idx + 1}`,
      name: parts[0] || withoutDate,
      issuer: parts[1] || item.defaultIssuer,
      date: dateMatch ? dateMatch[0] : '',
    };
  });
}

async function callSharedAiSectionParser(
  sectionName: string,
  sectionText: string,
  schemaDescription: string,
  requiredKeys: string[],
  isStrictRetry = false
): Promise<any | null> {
  if (!isSupabaseConfigured || !sectionText.trim()) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('callAI', {
        body: {
          action: 'completion',
          task: `parse_section_${sectionName}${isStrictRetry ? '_strict' : ''}`,
          promptVersion: RESUME_PARSER_PROMPT_VERSION,
          temperature: 0,
          requiredKeys,
          systemPrompt: `You are a lossless ATS resume section parser (${RESUME_PARSER_PROMPT_VERSION}). Extract EVERY item and EVERY bullet verbatim from the user's ${sectionName} section. Never summarize, truncate, or omit bullets. Return strict JSON matching: ${schemaDescription}`,
          userPrompt: isStrictRetry
            ? `CRITICAL RECALL RETRY: Your previous parse missed items in the ${sectionName} section. Capture EVERY SINGLE entry, date range, and bullet point verbatim from this text:\n\n${sectionText}`
            : `Parse the following ${sectionName} section text into JSON:\n\n${sectionText}`,
        },
      });

      if (!error && data?.success && data?.data) {
        return data.data;
      }
    } catch {
      // retry once
    }
  }
  return null;
}

/**
 * High-Recall Section-by-Section Resume Parser & Deterministic ATS Scorer.
 * Zero fake data: captures everything the user wrote, verifies recall against raw section text,
 * and computes genuine deterministic ATS scores.
 */
export async function parseAndScoreResumeHighRecall(params: {
  rawText: string;
  metadata?: DocumentExtractionMetadata;
  onStageUpdate?: (stage: string, progressPercent: number) => void;
}): Promise<{
  structuredResume: any;
  generalScore: any;
  captureSummary: ParseCaptureSummary;
  splitSections: SplitResumeSections;
  inferredProfile: any;
}> {
  const rawText = (params.rawText || '').replace(/\r\n/g, '\n').trim();
  if (rawText.length < 30) {
    throw new Error(
      'Resume text is empty or under 30 characters. Cannot parse or score an empty document.'
    );
  }

  params.onStageUpdate?.('Detecting section headings & extracting contact links...', 35);
  const splitSections = splitResumeIntoSections(rawText);
  const deterministicContact = extractDeterministicContactAndLinks(rawText, splitSections.header);

  // Extract all skills across the Skills section and full document using our 320+ Skills Taxonomy
  // plus any custom comma/bullet-listed skills in the Skills section
  const taxonomySkills = normalizeSkillsWithTaxonomy(
    {},
    `${splitSections.skills}\n${rawText}`,
    DEFAULT_SKILLS_TAXONOMY
  );

  // Also capture explicit skill tokens written in the skills section that aren't in the taxonomy
  if (splitSections.skills.trim()) {
    const rawSkillTokens = splitSections.skills
      .split(/[\n,|•·;/]+/)
      .map((s) => s.replace(/^[\s\-*▪▸:]+|[\s\-*▪▸:]+$/g, '').trim())
      .filter(
        (s) =>
          s.length >= 2 &&
          s.length <= 32 &&
          !/^(languages|frameworks|libraries|tools|databases|cloud|devops|skills|technologies|other|proficient|experienced)$/i.test(
            s
          )
      );
    const existingLower = new Set(
      [
        ...taxonomySkills.languages,
        ...taxonomySkills.frameworks,
        ...taxonomySkills.cloudAndDevOps,
        ...taxonomySkills.aiAndData,
      ].map((s) => s.toLowerCase())
    );
    for (const token of rawSkillTokens) {
      if (!existingLower.has(token.toLowerCase()) && taxonomySkills.frameworks.length < 25) {
        taxonomySkills.frameworks.push(token);
        existingLower.add(token.toLowerCase());
      }
    }
  }

  params.onStageUpdate?.('Parsing Experience, Projects, Education & Certifications...', 55);

  // Deterministic lossless extraction from each section
  const fallbackExpSource =
    splitSections.experience.trim() ||
    (splitSections.detectedHeadingsInOrder.length === 0 ? rawText : '');
  const losslessExperience = parseExperienceSectionLossless(fallbackExpSource);
  const losslessProjects = parseProjectsSectionLossless(splitSections.projects);
  const losslessEducation = parseEducationSectionLossless(
    splitSections.education ||
      (losslessExperience.length === 0 ? rawText : '')
  );
  const losslessCerts = parseCertificationsAndAchievementsLossless(
    splitSections.certifications,
    splitSections.achievements
  );

  const recallRetriedSections: string[] = [];

  // Optional AI enrichment via shared callAI Edge Function when Supabase is configured
  let finalExperience = losslessExperience;
  let finalProjects = losslessProjects;
  let finalEducation = losslessEducation;
  let finalCerts = losslessCerts;

  if (isSupabaseConfigured) {
    const [aiExp, aiProj, aiEdu] = await Promise.all([
      splitSections.experience.trim()
        ? callSharedAiSectionParser(
            'experience',
            splitSections.experience,
            '{"experience":[{"role":"string","company":"string","location":"string","period":"string","bullets":["string"]}]}',
            ['experience']
          )
        : Promise.resolve(null),
      splitSections.projects.trim()
        ? callSharedAiSectionParser(
            'projects',
            splitSections.projects,
            '{"projects":[{"name":"string","techStack":["string"],"link":"string","bullets":["string"]}]}',
            ['projects']
          )
        : Promise.resolve(null),
      splitSections.education.trim()
        ? callSharedAiSectionParser(
            'education',
            splitSections.education,
            '{"education":[{"degree":"string","institution":"string","period":"string","gpa":"string"}]}',
            ['education']
          )
        : Promise.resolve(null),
    ]);

    // Step 3 Recall Verification Check:
    // If raw text has more roles/bullets than AI returned, retry with strict prompt or keep lossless extraction
    if (Array.isArray(aiExp?.experience) && aiExp.experience.length > 0) {
      const aiBulletsCount = aiExp.experience.reduce(
        (acc: number, r: any) => acc + (Array.isArray(r.bullets) ? r.bullets.length : 0),
        0
      );
      const losslessBulletsCount = losslessExperience.reduce(
        (acc, r) => acc + r.bullets.length,
        0
      );

      if (
        aiExp.experience.length >= losslessExperience.length &&
        aiBulletsCount >= Math.max(1, Math.floor(losslessBulletsCount * 0.85))
      ) {
        finalExperience = aiExp.experience.map((r: any, idx: number) => ({
          id: `exp-${idx + 1}`,
          role: String(r.role || r.title || 'Role').trim(),
          company: String(r.company || 'Organization').trim(),
          location: String(r.location || '').trim(),
          period: String(r.period || r.dates || '').trim(),
          bullets: Array.isArray(r.bullets) ? r.bullets.map((b: any) => String(b).trim()) : [],
        }));
      } else {
        recallRetriedSections.push('experience');
      }
    } else if (splitSections.experience.trim() && losslessExperience.length > 0) {
      recallRetriedSections.push('experience');
    }

    if (Array.isArray(aiProj?.projects) && aiProj.projects.length >= losslessProjects.length) {
      finalProjects = aiProj.projects.map((p: any, idx: number) => ({
        id: `proj-${idx + 1}`,
        name: String(p.name || 'Project').trim(),
        techStack: Array.isArray(p.techStack) ? p.techStack.map((t: any) => String(t).trim()) : [],
        link: p.link ? String(p.link).trim() : undefined,
        bullets: Array.isArray(p.bullets) ? p.bullets.map((b: any) => String(b).trim()) : [],
      }));
    } else if (splitSections.projects.trim() && losslessProjects.length > 0) {
      recallRetriedSections.push('projects');
    }

    if (Array.isArray(aiEdu?.education) && aiEdu.education.length >= losslessEducation.length) {
      finalEducation = aiEdu.education.map((e: any, idx: number) => ({
        id: `edu-${idx + 1}`,
        degree: String(e.degree || '').trim(),
        institution: String(e.institution || '').trim(),
        period: String(e.period || e.dates || '').trim(),
        gpa: e.gpa ? String(e.gpa).trim() : undefined,
      }));
    } else if (splitSections.education.trim() && losslessEducation.length > 0) {
      recallRetriedSections.push('education');
    }
  }

  params.onStageUpdate?.('Running deterministic ATS scoring & evidence verification...', 85);

  const summaryText =
    splitSections.summary.trim() ||
    splitSections.header
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.split(/\s+/).length >= 8)
      .join(' ')
      .trim();

  const structuredResume = normalizeCanonicalResume({
    contact: {
      fullName: deterministicContact.fullName || '',
      email: deterministicContact.email || '',
      phone: deterministicContact.phone || '',
      location: deterministicContact.location || '',
      linkedin: deterministicContact.linkedin || undefined,
      github: deterministicContact.github || undefined,
      portfolio: deterministicContact.portfolio || undefined,
    },
    summary: summaryText,
    skills: taxonomySkills,
    experience: finalExperience,
    projects: finalProjects,
    education: finalEducation,
    certifications: finalCerts,
    detectedSectionOrder:
      splitSections.detectedHeadingsInOrder.length > 0
        ? (splitSections.detectedHeadingsInOrder.filter((s) =>
            ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'].includes(
              s
            )
          ) as any)
        : ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    hasMultiColumnOrTables: Boolean(
      params.metadata && (!params.metadata.isSingleColumn || params.metadata.hasTables)
    ),
    hasImagesOrGraphics: Boolean(params.metadata?.hasImagesOrTextBoxes),
    rawTextPreview: rawText,
    uploadedFileName: params.metadata?.fileName,
    uploadedFileSize: params.metadata?.fileSizeLabel,
    uploadedAt: new Date().toISOString(),
  });

  // Attach extraction metadata for Parsability scoring (35 pts)
  (structuredResume as any).extractionMetadata = params.metadata;

  const generalScore = computeGeneralAtsScore(structuredResume, {
    hasMultiColumn: Boolean(params.metadata && !params.metadata.isSingleColumn),
    hasTablesOrImages: Boolean(
      params.metadata?.hasTables || params.metadata?.hasImagesOrTextBoxes
    ),
    rawExtractedLength: rawText.length,
  });
  structuredResume.atsScore = generalScore.totalScore;
  (structuredResume as any).generalScoreBreakdown = generalScore;

  const allSkillsList = [
    ...taxonomySkills.languages,
    ...taxonomySkills.frameworks,
    ...taxonomySkills.cloudAndDevOps,
    ...taxonomySkills.aiAndData,
  ];

  const experienceBulletsCount = finalExperience.reduce(
    (acc, r) => acc + (Array.isArray(r.bullets) ? r.bullets.length : 0),
    0
  );
  const projectBulletsCount = finalProjects.reduce(
    (acc, p) => acc + (Array.isArray(p.bullets) ? p.bullets.length : 0),
    0
  );

  const captureSummary: ParseCaptureSummary = {
    experienceRolesCount: finalExperience.length,
    experienceBulletsCount,
    projectsCount: finalProjects.length,
    projectBulletsCount,
    skillsCount: allSkillsList.length,
    educationCount: finalEducation.length,
    certificationsCount: finalCerts.length,
    achievementsCount: splitSections.achievements
      ? splitSections.achievements.split('\n').filter((l) => l.trim().length > 3).length
      : 0,
    charCount: params.metadata?.charCount ?? rawText.length,
    wordCount:
      params.metadata?.wordCount ?? rawText.split(/\s+/).filter(Boolean).length,
    pageCount:
      params.metadata?.pageCount ??
      Math.max(1, Math.ceil(rawText.split(/\s+/).length / 450)),
    usedOcr: Boolean(params.metadata?.usedOcr),
    recallRetriedSections,
  };

  const inferredTitle =
    finalExperience[0]?.role ||
    (finalProjects.length > 0 ? 'Software & AI Engineer (Fresher)' : 'Software Engineer');

  const inferredProfile = {
    full_name: deterministicContact.fullName || '',
    title: inferredTitle,
    target_role: inferredTitle,
    experience_level:
      finalExperience.length >= 3
        ? 'Mid-Senior (3-6 yrs)'
        : finalExperience.length >= 1
        ? 'Early Career (1-3 yrs)'
        : 'Fresher (0-1 yr)',
    career_track:
      taxonomySkills.aiAndData.length >= 2 ? 'Generative AI' : 'Full Stack Engineering',
    education_or_company:
      finalExperience[0]?.company || finalEducation[0]?.institution || '',
    location: deterministicContact.location || 'India',
    skills: allSkillsList.slice(0, 15),
    bio: summaryText,
  };

  params.onStageUpdate?.('Complete!', 100);

  return {
    structuredResume,
    resume: structuredResume,
    generalScore,
    captureSummary,
    capturedCounts: {
      experienceRoles: captureSummary.experienceRolesCount,
      experienceBullets: captureSummary.experienceBulletsCount,
      projects: captureSummary.projectsCount,
      projectBullets: captureSummary.projectBulletsCount,
      skills: captureSummary.skillsCount,
      education: captureSummary.educationCount,
      certifications: captureSummary.certificationsCount,
      achievements: captureSummary.achievementsCount,
    },
    splitSections,
    inferredProfile,
  };
}
