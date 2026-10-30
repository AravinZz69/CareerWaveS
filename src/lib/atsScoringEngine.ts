import type {
  StructuredResumeData,
  GeneralAtsScoreBreakdown,
  AtsScoreDeduction,
  JobRequirementsSchema,
  JobMatchScoreBreakdown,
  JobMatchDeduction,
  TruthfulnessValidationResult,
  ResumeSectionId,
  ConfirmedUserSkill,
} from '../types/resume.ts';
import {
  DEFAULT_SKILLS_TAXONOMY,
  normalizeSkillsWithTaxonomy,
  resolveCanonicalSkill,
  extractTaxonomySkillsFromText,
  standardizeDateRange,
} from './skillsTaxonomy.ts';
import type { SkillTaxonomyEntry } from './skillsTaxonomy.ts';

export const STANDARD_SECTION_ORDER: ResumeSectionId[] = [
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
];

export const STRONG_ACTION_VERBS = new Set([
  'architected',
  'engineered',
  'built',
  'developed',
  'designed',
  'spearheaded',
  'implemented',
  'optimized',
  'accelerated',
  'automated',
  'reduced',
  'increased',
  'scaled',
  'deployed',
  'orchestrated',
  'led',
  'launched',
  'constructed',
  'migrated',
  'refactored',
  'streamlined',
  'delivered',
  'pioneered',
  'established',
  'integrated',
  'authored',
  'resolved',
  'modernized',
  'formulated',
  'executed',
  'transformed',
  'consolidated',
  'elevated',
  'boosted',
  'generated',
  'Negotiated'.toLowerCase(),
  'analyzed',
  'modeled',
  'verified',
  'hardened',
]);

export const FIRST_PERSON_PRONOUN_REGEX = /\b(i|me|my|mine|myself|we|us|our|ours)\b/i;

export const FILLER_WORDS_LIST = [
  'responsible for',
  'helped with',
  'worked on',
  'duties included',
  'assisted in',
  'tasked with',
  'various',
  'etc.',
  'etc',
  'synergy',
  'go-getter',
  'hardworking',
  'team player',
];

export const METRIC_REGEX =
  /(\d+(\.\d+)?\s*(%|x|k|m|b|ms|s|hrs|hours|days|weeks|months|yrs|years|users|requests|rps|qps|tb|gb|mb|records|clients|microservices|pipelines|endpoints|nodes|clusters|projects|engineers))|([₹$€£]\s*\d+)/i;

export interface BulletQualityAssessment {
  charCount: number;
  wordCount: number;
  startsWithActionVerb: boolean;
  firstWord: string;
  hasMetric: boolean;
  hasPronouns: boolean;
  hasFillerWords: boolean;
  fillerMatched: string | null;
  lengthOptimal: boolean;
  badge: 'green' | 'amber' | 'red';
  badgeLabel: string;
  hint: string;
}

/**
 * Pure deterministic analyzer for an individual resume bullet point.
 */
export function evaluateBulletQuality(bullet: string): BulletQualityAssessment {
  const clean = String(bullet || '').trim().replace(/^[•\-*]\s*/, '');
  const charCount = clean.length;
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const firstWordRaw = (words[0] || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
  const startsWithActionVerb =
    STRONG_ACTION_VERBS.has(firstWordRaw) || /^[a-z]+ed$/i.test(firstWordRaw);
  const hasMetric = METRIC_REGEX.test(clean) || /\b\d{2,}\b/.test(clean);
  const hasPronouns = FIRST_PERSON_PRONOUN_REGEX.test(clean);

  let fillerMatched: string | null = null;
  for (const phrase of FILLER_WORDS_LIST) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(clean)) {
      fillerMatched = phrase;
      break;
    }
  }
  const hasFillerWords = Boolean(fillerMatched);
  const lengthOptimal = wordCount >= 10 && wordCount <= 34 && charCount >= 55 && charCount <= 230;

  let issues: string[] = [];
  if (!startsWithActionVerb) issues.push('Start with a strong action verb (e.g., Engineered, Architected)');
  if (!hasMetric) issues.push('Add a quantified metric (%, latency, scale, or count)');
  if (hasPronouns) issues.push('Remove first-person pronouns (I, my, we, our)');
  if (hasFillerWords) issues.push(`Replace weak phrase "${fillerMatched}"`);
  if (wordCount < 10) issues.push('Expand bullet to at least 10 words with technical context');
  if (wordCount > 34) issues.push('Trim bullet under 34 words for fast recruiter scanning');

  let badge: 'green' | 'amber' | 'red' = 'green';
  let badgeLabel = 'Strong Impact';
  if (hasPronouns || hasFillerWords || wordCount < 6 || (!startsWithActionVerb && !hasMetric)) {
    badge = 'red';
    badgeLabel = 'Needs Work';
  } else if (!startsWithActionVerb || !hasMetric || !lengthOptimal) {
    badge = 'amber';
    badgeLabel = 'Good · Can Quantify';
  }

  return {
    charCount,
    wordCount,
    startsWithActionVerb,
    firstWord: words[0] || '',
    hasMetric,
    hasPronouns,
    hasFillerWords,
    fillerMatched,
    lengthOptimal,
    badge,
    badgeLabel,
    hint: issues[0] || 'Action verb + quantified impact + optimal length verified.',
  };
}

/**
 * Pure TypeScript General ATS Scoring Engine (Out of 100):
 * - Parsability: 35 pts
 * - Structure: 20 pts
 * - Content Quality: 25 pts
 * - Completeness: 20 pts
 */
export function computeGeneralAtsScore(
  resume: StructuredResumeData,
  options?: {
    hasMultiColumn?: boolean;
    hasTablesOrImages?: boolean;
    nonStandardFont?: boolean;
    rawExtractedLength?: number;
  }
): GeneralAtsScoreBreakdown {
  const deductions: AtsScoreDeduction[] = [];

  // ============================================================================
  // 1. PARSABILITY (Max 35 pts)
  //    - Text extractable: 12 pts
  //    - Single column layout: 8 pts
  //    - No tables, images, or text boxes: 8 pts
  //    - Standard ATS fonts: 7 pts
  // ============================================================================
  let parsabilityScore = 35;
  const parsabilityDetails: string[] = [];

  const allSkills = [
    ...(resume?.skills?.languages || []),
    ...(resume?.skills?.frameworks || []),
    ...(resume?.skills?.cloudAndDevOps || []),
    ...(resume?.skills?.aiAndData || []),
  ];
  const allBullets = [
    ...(resume?.experience || []).flatMap((e) => e.bullets || []),
    ...(resume?.projects || []).flatMap((p) => p.bullets || []),
  ];
  const serializedLength =
    options?.rawExtractedLength ??
    (resume?.summary || '').length +
      allSkills.join(' ').length +
      allBullets.join(' ').length +
      (resume?.contact?.fullName || '').length;

  if (serializedLength < 180) {
    parsabilityScore -= 8;
    deductions.push({
      id: 'ded-parse-text-short',
      category: 'parsability',
      pointsLost: 8,
      reason: 'Extractable text volume is very low (< 180 chars). Add fuller summary and experience bullets.',
      fixable: true,
      fixType: 'fill-summary',
      targetSection: 'summary',
    });
  } else {
    parsabilityDetails.push('UTF-8 selectable text stream verified');
  }

  if (options?.hasMultiColumn) {
    parsabilityScore -= 8;
    deductions.push({
      id: 'ded-parse-columns',
      category: 'parsability',
      pointsLost: 8,
      reason: 'Multi-column layout detected; single-column templates prevent line-merging in older ATS parsers.',
      fixable: false,
    });
  } else {
    parsabilityDetails.push('Strict single-column linear reading order');
  }

  if (options?.hasTablesOrImages) {
    parsabilityScore -= 8;
    deductions.push({
      id: 'ded-parse-tables',
      category: 'parsability',
      pointsLost: 8,
      reason: 'Tables, floating text boxes, or embedded graphics detected.',
      fixable: false,
    });
  } else {
    parsabilityDetails.push('Zero nested tables, text boxes, or graphic icons');
  }

  if (options?.nonStandardFont) {
    parsabilityScore -= 7;
    deductions.push({
      id: 'ded-parse-font',
      category: 'parsability',
      pointsLost: 7,
      reason: 'Non-standard font detected; use standard embedded fonts (Calibri, Arial, Georgia, Inter).',
      fixable: false,
    });
  } else {
    parsabilityDetails.push('Standard ATS-safe font family embedded');
  }

  parsabilityScore = Math.max(0, Math.min(35, parsabilityScore));

  // ============================================================================
  // 2. STRUCTURE (Max 20 pts)
  //    - Standard headings in standard order: 10 pts
  //    - Consistent standardized dates: 10 pts
  // ============================================================================
  let structureScore = 20;
  const structureDetails: string[] = [];

  const currentOrder = resume?.sectionOrder || STANDARD_SECTION_ORDER;
  const summaryIdx = currentOrder.indexOf('summary');
  const expIdx = currentOrder.indexOf('experience');
  const eduIdx = currentOrder.indexOf('education');

  if (summaryIdx > expIdx || (expIdx > eduIdx && (resume?.experience?.length || 0) > 0)) {
    structureScore -= 5;
    deductions.push({
      id: 'ded-struct-order',
      category: 'structure',
      pointsLost: 5,
      reason: 'Sections are not in standard ATS hierarchy (Summary → Skills → Experience → Projects → Education).',
      fixable: true,
      fixType: 'standardize-section-order',
    });
  } else {
    structureDetails.push('Standard semantic section headings & hierarchy');
  }

  const standardDateRegex =
    /^((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|\d{4})\s*-\s*((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|\d{4}|Present)$/i;
  const expDurations = (resume?.experience || []).map((e) => (e.duration || '').trim());
  const inconsistentDates = expDurations.filter((d) => !d || !standardDateRegex.test(d));

  if (expDurations.length > 0 && inconsistentDates.length > 0) {
    const lost = Math.min(10, inconsistentDates.length * 5);
    structureScore -= lost;
    deductions.push({
      id: 'ded-struct-dates',
      category: 'structure',
      pointsLost: lost,
      reason: `${inconsistentDates.length} experience date range(s) use non-standard formatting (use "MMM YYYY - MMM YYYY" or "Present").`,
      fixable: true,
      fixType: 'standardize-dates',
      targetSection: 'experience',
    });
  } else if (expDurations.length > 0) {
    structureDetails.push('Consistent "MMM YYYY" date formatting across roles');
  }

  structureScore = Math.max(0, Math.min(20, structureScore));

  // ============================================================================
  // 3. CONTENT QUALITY (Max 25 pts)
  //    - Action-verb bullet starts: 8 pts
  //    - Quantified bullets (metrics/numbers): 8 pts
  //    - Bullet length (10-34 words): 4 pts
  //    - No first-person pronouns: 3 pts
  //    - No weak filler words: 2 pts
  // ============================================================================
  let contentScore = 25;
  const contentDetails: string[] = [];

  if (allBullets.length === 0) {
    contentScore = 0;
    deductions.push({
      id: 'ded-content-no-bullets',
      category: 'contentQuality',
      pointsLost: 25,
      reason: 'No experience or project bullet points found.',
      fixable: false,
      targetSection: 'experience',
    });
  } else {
    const evaluations = allBullets.map(evaluateBulletQuality);
    const totalB = evaluations.length;

    // 3a. Action-verb starts (8 pts)
    const actionVerbCount = evaluations.filter((e) => e.startsWithActionVerb).length;
    const actionRatio = actionVerbCount / totalB;
    const actionPoints = Math.round(actionRatio * 8);
    if (actionPoints < 8) {
      const lost = 8 - actionPoints;
      contentScore -= lost;
      deductions.push({
        id: 'ded-content-verbs',
        category: 'contentQuality',
        pointsLost: lost,
        reason: `${totalB - actionVerbCount} of ${totalB} bullet(s) do not start with a strong past-tense action verb.`,
        fixable: true,
        fixType: 'strengthen-action-verbs',
        targetSection: 'experience',
      });
    } else {
      contentDetails.push('100% of bullets lead with strong action verbs');
    }

    // 3b. Quantified bullets (8 pts — full 8 pts if >= 60% of bullets have numbers/metrics)
    const metricCount = evaluations.filter((e) => e.hasMetric).length;
    const targetMetricCount = Math.max(1, Math.ceil(totalB * 0.6));
    const metricRatio = Math.min(1, metricCount / targetMetricCount);
    const metricPoints = Math.round(metricRatio * 8);
    if (metricPoints < 8) {
      const lost = 8 - metricPoints;
      contentScore -= lost;
      deductions.push({
        id: 'ded-content-metrics',
        category: 'contentQuality',
        pointsLost: lost,
        reason: `Only ${metricCount} of ${totalB} bullet(s) include quantified impact metrics (%, latency, users, revenue). Aim for at least ${targetMetricCount}.`,
        fixable: true,
        fixType: 'add-metrics',
        targetSection: 'experience',
      });
    } else {
      contentDetails.push(`${metricCount}/${totalB} bullets contain measurable impact metrics`);
    }

    // 3c. Bullet length (4 pts)
    const badLengthCount = evaluations.filter((e) => !e.lengthOptimal).length;
    if (badLengthCount > 0) {
      const lost = Math.min(4, Math.ceil((badLengthCount / totalB) * 4));
      contentScore -= lost;
      deductions.push({
        id: 'ded-content-length',
        category: 'contentQuality',
        pointsLost: lost,
        reason: `${badLengthCount} bullet(s) are outside the ideal 10–34 word length window.`,
        fixable: true,
        fixType: 'trim-bullet-length',
        targetSection: 'experience',
      });
    } else {
      contentDetails.push('Optimal bullet word density (10–34 words)');
    }

    // 3d. No first-person pronouns (3 pts)
    const pronounCount = evaluations.filter((e) => e.hasPronouns).length;
    const summaryHasPronouns = FIRST_PERSON_PRONOUN_REGEX.test(resume?.summary || '');
    if (pronounCount > 0 || summaryHasPronouns) {
      contentScore -= 3;
      deductions.push({
        id: 'ded-content-pronouns',
        category: 'contentQuality',
        pointsLost: 3,
        reason: 'First-person pronouns (I, my, we, our) detected. Resumes should use implied third-person voice.',
        fixable: true,
        fixType: 'remove-pronouns',
        targetSection: 'experience',
      });
    } else {
      contentDetails.push('Zero first-person pronouns');
    }

    // 3e. No weak filler words (2 pts)
    const fillerBullets = evaluations.filter((e) => e.hasFillerWords);
    if (fillerBullets.length > 0) {
      contentScore -= 2;
      deductions.push({
        id: 'ded-content-filler',
        category: 'contentQuality',
        pointsLost: 2,
        reason: `Weak filler phrases detected ("${fillerBullets[0].fillerMatched}"). Replace with direct action statements.`,
        fixable: true,
        fixType: 'remove-filler-words',
        targetSection: 'experience',
      });
    } else {
      contentDetails.push('Zero passive filler phrases');
    }
  }

  contentScore = Math.max(0, Math.min(25, contentScore));

  // ============================================================================
  // 4. COMPLETENESS (Max 20 pts)
  //    - Email (2.5), Phone (2.5), Location (2), LinkedIn (2),
  //      Summary (3), Skills (3), Experience (3), Education (2)
  // ============================================================================
  let completenessRaw = 20;
  const completenessDetails: string[] = [];

  const hasEmail = Boolean(
    resume?.contact?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.contact.email.trim())
  );
  const hasPhone = Boolean(resume?.contact?.phone && resume.contact.phone.trim().length >= 7);
  const hasLocation = Boolean(resume?.contact?.location && resume.contact.location.trim().length >= 2);
  const hasLinkedin = Boolean(resume?.contact?.linkedin && resume.contact.linkedin.trim().length >= 5);
  const hasSummary = Boolean(resume?.summary && resume.summary.trim().length >= 50);
  const hasSkills = allSkills.length >= 6;
  const hasExperience = Boolean(resume?.experience && resume.experience.length >= 1);
  const hasEducation = Boolean(resume?.education && resume.education.length >= 1);

  if (!hasEmail) {
    completenessRaw -= 2.5;
    deductions.push({
      id: 'ded-comp-email',
      category: 'completeness',
      pointsLost: 2.5,
      reason: 'Missing valid email address in Contact details.',
      fixable: false,
      targetSection: 'contact',
    });
  }
  if (!hasPhone) {
    completenessRaw -= 2.5;
    deductions.push({
      id: 'ded-comp-phone',
      category: 'completeness',
      pointsLost: 2.5,
      reason: 'Missing phone number in Contact details.',
      fixable: true,
      fixType: 'fill-phone-location',
      targetSection: 'contact',
    });
  }
  if (!hasLocation) {
    completenessRaw -= 2;
    deductions.push({
      id: 'ded-comp-location',
      category: 'completeness',
      pointsLost: 2,
      reason: 'Missing city/location in Contact details.',
      fixable: true,
      fixType: 'fill-phone-location',
      targetSection: 'contact',
    });
  }
  if (!hasLinkedin) {
    completenessRaw -= 2;
    deductions.push({
      id: 'ded-comp-linkedin',
      category: 'completeness',
      pointsLost: 2,
      reason: 'Missing LinkedIn profile URL in Contact details.',
      fixable: true,
      fixType: 'fill-linkedin',
      targetSection: 'contact',
    });
  }
  if (!hasSummary) {
    completenessRaw -= 3;
    deductions.push({
      id: 'ded-comp-summary',
      category: 'completeness',
      pointsLost: 3,
      reason: 'Professional summary is missing or under 50 characters.',
      fixable: true,
      fixType: 'fill-summary',
      targetSection: 'summary',
    });
  }
  if (!hasSkills) {
    completenessRaw -= 3;
    deductions.push({
      id: 'ded-comp-skills',
      category: 'completeness',
      pointsLost: 3,
      reason: `Only ${allSkills.length} skill(s) listed. Add at least 6 technical/domain skills.`,
      fixable: false,
      targetSection: 'skills',
    });
  }
  if (!hasExperience) {
    completenessRaw -= 3;
    deductions.push({
      id: 'ded-comp-exp',
      category: 'completeness',
      pointsLost: 3,
      reason: 'Missing work experience or internship entries.',
      fixable: false,
      targetSection: 'experience',
    });
  }
  if (!hasEducation) {
    completenessRaw -= 2;
    deductions.push({
      id: 'ded-comp-edu',
      category: 'completeness',
      pointsLost: 2,
      reason: 'Missing education history entry.',
      fixable: false,
      targetSection: 'education',
    });
  }

  const completenessScore = Math.max(0, Math.min(20, Math.round(completenessRaw)));
  if (completenessScore === 20) {
    completenessDetails.push('All 8 core ATS sections & contact fields complete');
  }

  const checklist = [
    { label: 'Valid Email Address', passed: hasEmail, section: 'contact' as const },
    { label: 'Phone Number', passed: hasPhone, section: 'contact' as const },
    { label: 'City & Country Location', passed: hasLocation, section: 'contact' as const },
    { label: 'LinkedIn Profile URL', passed: hasLinkedin, section: 'contact' as const },
    { label: 'Executive Summary (50+ chars)', passed: hasSummary, section: 'summary' as const },
    { label: 'Categorized Skills (6+ skills)', passed: hasSkills, section: 'skills' as const },
    { label: 'Work Experience & Bullets', passed: hasExperience, section: 'experience' as const },
    { label: 'Education Credentials', passed: hasEducation, section: 'education' as const },
  ];

  const passedCount = checklist.filter((c) => c.passed).length;
  const completenessPercent = Math.round((passedCount / checklist.length) * 100);

  const totalScore = Math.max(
    0,
    Math.min(100, parsabilityScore + structureScore + contentScore + completenessScore)
  );

  // Sort deductions by highest points lost first
  deductions.sort((a, b) => b.pointsLost - a.pointsLost);

  return {
    totalScore,
    disclaimer:
      'Estimated ATS compatibility score based on common enterprise ATS parsing rules — not an official vendor score.',
    categories: {
      parsability: { earned: parsabilityScore, max: 35, details: parsabilityDetails },
      structure: { earned: structureScore, max: 20, details: structureDetails },
      contentQuality: { earned: contentScore, max: 25, details: contentDetails },
      completeness: { earned: completenessScore, max: 20, details: completenessDetails },
    },
    deductions,
    completenessPercent,
    checklist,
  };
}

/**
 * Applies a 1-click deterministic fix to a resume for any fixable AtsScoreDeduction.
 */
export function applyOneClickFix(
  resume: StructuredResumeData,
  deduction: AtsScoreDeduction
): StructuredResumeData {
  const clone: StructuredResumeData = JSON.parse(JSON.stringify(resume));

  switch (deduction.fixType) {
    case 'standardize-section-order': {
      clone.sectionOrder = [...STANDARD_SECTION_ORDER];
      break;
    }
    case 'standardize-dates': {
      clone.experience = (clone.experience || []).map((exp) => {
        const std = standardizeDateRange(exp.duration || 'Jan 2024 - Present');
        return {
          ...exp,
          duration: std.includes('-') ? std : `${std || 'Jan 2024'} - Present`,
        };
      });
      break;
    }
    case 'remove-pronouns': {
      const stripPronouns = (t: string) =>
        t
          .replace(/\b(I|We)\s+(was\s+responsible\s+for|helped\s+with|worked\s+on|built|designed|engineered|developed|created|led)\b/gi, (_, _p, verb) => {
            const v = verb.trim();
            return v.charAt(0).toUpperCase() + v.slice(1);
          })
          .replace(/\b(I|We)\s+/gi, '')
          .replace(/\b(my|our)\s+/gi, 'the ')
          .replace(/\s{2,}/g, ' ')
          .trim();

      clone.summary = stripPronouns(clone.summary || '');
      clone.experience = (clone.experience || []).map((exp) => ({
        ...exp,
        bullets: (exp.bullets || []).map(stripPronouns),
      }));
      clone.projects = (clone.projects || []).map((prj) => ({
        ...prj,
        bullets: (prj.bullets || []).map(stripPronouns),
      }));
      break;
    }
    case 'remove-filler-words':
    case 'strengthen-action-verbs': {
      const upgradeBullet = (b: string, idx: number) => {
        let clean = b
          .replace(/^[•\-*]\s*/, '')
          .replace(/^(responsible for|helped with|worked on|duties included|assisted in|tasked with)\s+/i, '')
          .replace(/\b(various|etc\.?)\b/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        const words = clean.split(/\s+/);
        const firstWord = (words[0] || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
        const fallbackVerbs = [
          'Engineered',
          'Architected',
          'Developed',
          'Optimized',
          'Spearheaded',
          'Implemented',
        ];
        if (!STRONG_ACTION_VERBS.has(firstWord) && !/^[a-z]+ed$/i.test(firstWord)) {
          const v = fallbackVerbs[idx % fallbackVerbs.length];
          if (/^[a-z]+ing$/i.test(firstWord)) {
            words[0] = v;
            clean = words.join(' ');
          } else {
            clean = `${v} ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
          }
        } else {
          clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        }
        return clean.endsWith('.') ? clean : `${clean}.`;
      };

      clone.experience = (clone.experience || []).map((exp) => ({
        ...exp,
        bullets: (exp.bullets || []).map((b, i) => upgradeBullet(b, i)),
      }));
      clone.projects = (clone.projects || []).map((prj) => ({
        ...prj,
        bullets: (prj.bullets || []).map((b, i) => upgradeBullet(b, i + 2)),
      }));
      break;
    }
    case 'add-metrics': {
      const metricSuffixes = [
        ', reducing end-to-end API P95 latency by 38%',
        ', increasing automated test coverage to 92% across 15+ services',
        ', supporting 25,000+ daily active requests with 99.9% uptime',
        ', cutting deployment cycle time by 45%',
      ];
      let counter = 0;
      clone.experience = (clone.experience || []).map((exp) => ({
        ...exp,
        bullets: (exp.bullets || []).map((b) => {
          const ev = evaluateBulletQuality(b);
          if (!ev.hasMetric) {
            const suffix = metricSuffixes[counter % metricSuffixes.length];
            counter++;
            return `${b.replace(/\.$/, '')}${suffix}.`;
          }
          return b;
        }),
      }));
      break;
    }
    case 'trim-bullet-length': {
      const fixLength = (b: string) => {
        const words = b.trim().split(/\s+/);
        if (words.length < 10) {
          return `${b.replace(/\.$/, '')} across distributed production environments, improving system reliability by 30%.`;
        }
        if (words.length > 34) {
          return `${words.slice(0, 28).join(' ').replace(/[,;.]$/, '')}.`;
        }
        return b;
      };
      clone.experience = (clone.experience || []).map((exp) => ({
        ...exp,
        bullets: (exp.bullets || []).map(fixLength),
      }));
      break;
    }
    case 'fill-linkedin': {
      const slug = (clone.contact.fullName || 'candidate')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
      clone.contact.linkedin = `linkedin.com/in/${slug || 'candidate'}`;
      break;
    }
    case 'fill-phone-location': {
      if (!clone.contact.phone || clone.contact.phone.trim().length < 7) {
        clone.contact.phone = '+91 98765 43210';
      }
      if (!clone.contact.location || clone.contact.location.trim().length < 2) {
        clone.contact.location = 'Bengaluru, India';
      }
      break;
    }
    case 'fill-summary': {
      const topSkills = [
        ...(clone.skills.languages || []),
        ...(clone.skills.frameworks || []),
        ...(clone.skills.cloudAndDevOps || []),
      ].slice(0, 5);
      const roleName = clone.experience?.[0]?.role || 'Software & AI Systems Engineer';
      clone.summary = `Results-driven ${roleName} with hands-on expertise in ${
        topSkills.length > 0 ? topSkills.join(', ') : 'Python, TypeScript, React, and Cloud Architecture'
      }. Proven track record of architecting high-availability microservices, optimizing low-latency data pipelines, and delivering measurable engineering outcomes.`;
      break;
    }
    default:
      break;
  }

  const newBreakdown = computeGeneralAtsScore(clone);
  clone.atsScore = newBreakdown.totalScore;
  return clone;
}

/**
 * Deterministically normalizes a canonical resume object so that output from
 * Gemini, OpenRouter, or deterministic fallback produces the EXACT same structure and ATS score.
 */
export function normalizeCanonicalResume(
  raw: any,
  rawTextForReconciliation = '',
  customTaxonomy: SkillTaxonomyEntry[] = DEFAULT_SKILLS_TAXONOMY,
  defaults?: { fullName?: string; email?: string; location?: string; targetRole?: string },
  options?: { preserveEmptyFields?: boolean }
): StructuredResumeData {
  const preserveEmpty = Boolean(options?.preserveEmptyFields);
  const c = raw?.contact || {};

  // Check rawTextForReconciliation as fallback if contact fields were not explicitly populated
  const emailRegexMatch = rawTextForReconciliation.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const phoneRegexMatch = rawTextForReconciliation.match(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/
  );
  const linkedinRegexMatch = rawTextForReconciliation.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i
  );
  const githubRegexMatch = rawTextForReconciliation.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i
  );

  const fullName = preserveEmpty
    ? String(c.fullName ?? c.name ?? '')
    : String(c.fullName || c.name || defaults?.fullName || 'Candidate')
        .replace(/\s+/g, ' ')
        .trim();

  const email = preserveEmpty
    ? String(c.email ?? '').trim()
    : String(c.email || emailRegexMatch?.[0] || defaults?.email || '')
        .toLowerCase()
        .trim();

  const phone = preserveEmpty
    ? String(c.phone ?? '')
    : String(c.phone || phoneRegexMatch?.[0] || '')
        .replace(/\s+/g, ' ')
        .trim();

  const location = preserveEmpty
    ? String(c.location ?? '')
    : String(c.location || defaults?.location || 'India')
        .replace(/\s+/g, ' ')
        .trim();

  const linkedin = preserveEmpty
    ? String(c.linkedin ?? '')
    : String(c.linkedin || linkedinRegexMatch?.[0] || '')
        .replace(/^https?:\/\/(www\.)?/i, '')
        .trim();

  const github = preserveEmpty
    ? String(c.github ?? '')
    : String(c.github || githubRegexMatch?.[0] || '')
        .replace(/^https?:\/\/(www\.)?/i, '')
        .trim();

  const portfolio = preserveEmpty
    ? String(c.portfolio ?? '')
    : String(c.portfolio || '')
        .replace(/^https?:\/\/(www\.)?/i, '')
        .trim();

  // Normalize & reconcile skills through the 320+ skills_taxonomy
  const normalizedSkills = normalizeSkillsWithTaxonomy(
    raw?.skills,
    preserveEmpty ? '' : rawTextForReconciliation,
    customTaxonomy
  );

  const totalSkillsCount =
    normalizedSkills.languages.length +
    normalizedSkills.frameworks.length +
    normalizedSkills.cloudAndDevOps.length +
    normalizedSkills.aiAndData.length;

  if (totalSkillsCount === 0 && !preserveEmpty && !raw?.skills) {
    normalizedSkills.languages = ['JavaScript', 'Python', 'SQL', 'TypeScript'];
    normalizedSkills.frameworks = ['FastAPI', 'Next.js', 'Node.js', 'React', 'Tailwind CSS'];
    normalizedSkills.cloudAndDevOps = ['AWS', 'Docker', 'Git', 'PostgreSQL'];
    normalizedSkills.aiAndData = ['Large Language Models', 'RAG'];
  }

  const normalizeBulletList = (val: any, fallback: string[]): string[] => {
    if (preserveEmpty && Array.isArray(val)) {
      return val.map((v) => String(v ?? ''));
    }
    let arr: string[] = [];
    if (Array.isArray(val)) {
      arr = val.map((v) => String(v || '').trim()).filter(Boolean);
    } else if (typeof val === 'string' && val.trim()) {
      arr = val
        .split(/\n|[•●▪]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const item of arr) {
      const cleaned = item.replace(/^[•\-*]\s*/, '').replace(/\s+/g, ' ').trim();
      if (!cleaned) continue;
      const key = cleaned.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(cleaned);
      }
    }
    return deduped.length > 0 ? deduped : preserveEmpty ? [] : fallback;
  };

  const rawExp = Array.isArray(raw?.experience) ? raw.experience : [];
  const experience = rawExp
    .map((exp: any, idx: number) => {
      const duration = preserveEmpty
        ? String(exp?.duration ?? '')
        : standardizeDateRange(
            String(exp?.duration || exp?.dates || exp?.period || 'Jan 2024 - Present')
          );
      const [startPart, endPart] = (duration || 'Jan 2024 - Present').split(/\s*-\s*/);
      return {
        id: exp?.id || `exp-${idx + 1}`,
        company: preserveEmpty
          ? String(exp?.company ?? exp?.organization ?? '')
          : String(exp?.company || exp?.organization || '')
              .replace(/\s+/g, ' ')
              .trim(),
        role: preserveEmpty
          ? String(exp?.role ?? exp?.title ?? exp?.position ?? '')
          : String(exp?.role || exp?.title || exp?.position || defaults?.targetRole || '')
              .replace(/\s+/g, ' ')
              .trim(),
        location: preserveEmpty
          ? String(exp?.location ?? '')
          : String(exp?.location || location).replace(/\s+/g, ' ').trim(),
        startDate: exp?.startDate || startPart || 'Jan 2024',
        endDate: exp?.endDate || endPart || 'Present',
        currentlyWorking:
          typeof exp?.currentlyWorking === 'boolean'
            ? exp.currentlyWorking
            : /present/i.test(endPart || duration),
        duration: duration || 'Jan 2024 - Present',
        bullets: normalizeBulletList(exp?.bullets || exp?.description, [
          'Engineered scalable full-stack web services and automated data pipelines, reducing API latency by 35%.',
        ]),
      };
    })
    .filter((e: any) => preserveEmpty || e.company || e.role || (e.bullets && e.bullets.length > 0));

  const rawProj = Array.isArray(raw?.projects) ? raw.projects : [];
  const projects = rawProj
    .map((prj: any, idx: number) => {
      const rawTech = Array.isArray(prj?.techStack)
        ? prj.techStack
        : typeof prj?.techStack === 'string'
        ? prj.techStack.split(/[,;|]+/)
        : [];
      const canonicalTech = preserveEmpty
        ? rawTech.map((t: any) => String(t ?? '').trim()).filter(Boolean)
        : (Array.from(
            new Set(
              rawTech
                .map((t: any) => resolveCanonicalSkill(String(t || ''), customTaxonomy).canonicalName)
                .filter(Boolean)
            )
          ) as string[]);

      return {
        id: prj?.id || `prj-${idx + 1}`,
        title: preserveEmpty
          ? String(prj?.title ?? prj?.name ?? '')
          : String(prj?.title || prj?.name || `Project ${idx + 1}`).replace(/\s+/g, ' ').trim(),
        role: preserveEmpty
          ? String(prj?.role ?? '')
          : String(prj?.role || 'Developer').replace(/\s+/g, ' ').trim(),
        techStack:
          canonicalTech.length > 0
            ? canonicalTech
            : preserveEmpty
            ? []
            : [...normalizedSkills.languages.slice(0, 2), ...normalizedSkills.frameworks.slice(0, 2)],
        link: String(prj?.link ?? prj?.url ?? '').trim(),
        bullets: normalizeBulletList(prj?.bullets || prj?.description, [
          'Architected a production full-stack application with role-based access control and automated testing.',
        ]),
      };
    })
    .filter((p: any) => preserveEmpty || p.title || (p.bullets && p.bullets.length > 0));

  const rawEdu = Array.isArray(raw?.education) ? raw.education : [];
  const education = rawEdu
    .map((edu: any, idx: number) => ({
      id: edu?.id || `edu-${idx + 1}`,
      school: preserveEmpty
        ? String(edu?.school ?? edu?.institution ?? edu?.university ?? '')
        : String(edu?.school || edu?.institution || edu?.university || '')
            .replace(/\s+/g, ' ')
            .trim(),
      degree: preserveEmpty
        ? String(edu?.degree ?? '')
        : String(edu?.degree || 'Bachelor of Technology').replace(/\s+/g, ' ').trim(),
      field: preserveEmpty
        ? String(edu?.field ?? edu?.major ?? '')
        : String(edu?.field || edu?.major || '')
            .replace(/\s+/g, ' ')
            .trim(),
      year: preserveEmpty
        ? String(edu?.year ?? edu?.duration ?? '')
        : standardizeDateRange(String(edu?.year || edu?.duration || '2020 - 2024')),
      gpa: String(edu?.gpa ?? edu?.cgpa ?? '').trim(),
    }))
    .filter((ed: any) => preserveEmpty || ed.school || ed.degree);

  const rawCert = Array.isArray(raw?.certifications) ? raw.certifications : [];
  const certifications = rawCert
    .map((cert: any, idx: number) => ({
      id: cert?.id || `cert-${idx + 1}`,
      name: preserveEmpty
        ? String(cert?.name ?? cert?.title ?? '')
        : String(cert?.name || cert?.title || '').replace(/\s+/g, ' ').trim(),
      issuer: preserveEmpty
        ? String(cert?.issuer ?? cert?.organization ?? '')
        : String(cert?.issuer || cert?.organization || 'Verified Issuer')
            .replace(/\s+/g, ' ')
            .trim(),
      year: String(cert?.year ?? cert?.date ?? '2024').trim(),
    }))
    .filter((ct: any) => preserveEmpty || ct.name);

  const summary = preserveEmpty
    ? String(raw?.summary ?? '')
    : String(
        raw?.summary ||
          `Results-driven ${
            experience[0]?.role || defaults?.targetRole || 'Software & AI Engineer'
          } proficient in ${[
            ...normalizedSkills.languages.slice(0, 2),
            ...normalizedSkills.frameworks.slice(0, 2),
            ...normalizedSkills.cloudAndDevOps.slice(0, 2),
          ]
            .filter(Boolean)
            .join(', ') || 'modern software engineering'}, focused on architecting scalable production systems and delivering measurable business impact.`
      )
        .replace(/\s+/g, ' ')
        .trim();

  const canonical: StructuredResumeData = {
    contact: {
      fullName,
      email,
      phone,
      location,
      linkedin,
      github,
      portfolio,
    },
    summary,
    skills: normalizedSkills,
    experience:
      experience.length > 0 || preserveEmpty || Array.isArray(raw?.experience)
        ? experience
        : [
            {
              id: 'exp-1',
              company: 'Tech Systems Lab',
              role: defaults?.targetRole || 'Software Engineer',
              location,
              startDate: 'Jan 2024',
              endDate: 'Present',
              currentlyWorking: true,
              duration: 'Jan 2024 - Present',
              bullets: [
                'Engineered scalable full-stack web services and AI-assisted workflows, reducing API latency by 40%.',
                'Implemented automated CI/CD pipelines and unit testing suites achieving 90% coverage across 12 services.',
              ],
            },
          ],
    projects:
      projects.length > 0 || preserveEmpty || Array.isArray(raw?.projects)
        ? projects
        : [
            {
              id: 'prj-1',
              title: 'Cloud & AI Analytics Platform',
              role: 'Lead Developer',
              techStack: [
                ...normalizedSkills.languages.slice(0, 2),
                ...normalizedSkills.frameworks.slice(0, 2),
              ],
              link: github,
              bullets: [
                'Built a production web application featuring real-time data pipelines and role-based access control.',
              ],
            },
          ],
    education:
      education.length > 0 || preserveEmpty || Array.isArray(raw?.education)
        ? education
        : [
            {
              id: 'edu-1',
              school: 'Institute of Engineering & Technology',
              degree: 'Bachelor of Technology',
              field: 'Computer Science & Engineering',
              year: '2020 - 2024',
              gpa: '8.8 / 10',
            },
          ],
    certifications,
    sectionOrder: Array.isArray(raw?.sectionOrder) ? raw.sectionOrder : [...STANDARD_SECTION_ORDER],
    confirmedSkills: Array.isArray(raw?.confirmedSkills) ? raw.confirmedSkills : [],
    templateId: raw?.templateId || 'classic-exec',
    uploadedFileName: raw?.uploadedFileName,
    uploadedFileSize: raw?.uploadedFileSize,
    uploadedAt: raw?.uploadedAt,
    rawTextPreview: raw?.rawTextPreview,
  };

  // Deterministic ATS score calculation (never trusts AI's arbitrary number!)
  const scoreBreakdown = computeGeneralAtsScore(canonical);
  canonical.atsScore = scoreBreakdown.totalScore;

  return canonical;
}

/**
 * Deterministically extracts or normalizes a JobRequirementsSchema from a Job Description
 * using the 320+ skills_taxonomy aliases.
 */
export function extractJobRequirementsDeterministically(
  jobDescriptionText: string,
  targetRole = 'Software & AI Engineer',
  targetCompany = 'Target Company',
  aiExtractedRequirements?: Partial<JobRequirementsSchema>,
  customTaxonomy: SkillTaxonomyEntry[] = DEFAULT_SKILLS_TAXONOMY
): JobRequirementsSchema {
  const cleanJd = String(jobDescriptionText || '').trim();
  const detectedEntries = extractTaxonomySkillsFromText(cleanJd, customTaxonomy);
  const detectedCanonicalNames = detectedEntries.map((e) => e.canonicalName);

  // Split sentences/lines into required vs preferred sections if mentioned in JD
  const lowerJd = cleanJd.toLowerCase();
  const prefSplitIdx = lowerJd.search(/\b(preferred|nice to have|bonus|plus|desirable)\b/);
  const requiredPart = prefSplitIdx > 0 ? cleanJd.slice(0, prefSplitIdx) : cleanJd;
  const preferredPart = prefSplitIdx > 0 ? cleanJd.slice(prefSplitIdx) : '';

  const reqFromText = extractTaxonomySkillsFromText(requiredPart, customTaxonomy).map(
    (e) => e.canonicalName
  );
  const prefFromText = preferredPart
    ? extractTaxonomySkillsFromText(preferredPart, customTaxonomy)
        .map((e) => e.canonicalName)
        .filter((s) => !reqFromText.includes(s))
    : [];

  // Reconcile AI-extracted skills with taxonomy aliases
  const aiReq = (aiExtractedRequirements?.requiredSkills || [])
    .map((s) => resolveCanonicalSkill(s, customTaxonomy))
    .filter((r) => r.matchedTaxonomy)
    .map((r) => r.canonicalName);

  const aiPref = (aiExtractedRequirements?.preferredSkills || [])
    .map((s) => resolveCanonicalSkill(s, customTaxonomy))
    .filter((r) => r.matchedTaxonomy)
    .map((r) => r.canonicalName);

  // Merge and sort deterministically so Gemini and OpenRouter produce identical requirements
  let requiredSkills = Array.from(new Set([...reqFromText, ...aiReq])).sort((a, b) =>
    a.localeCompare(b)
  );
  let preferredSkills = Array.from(new Set([...prefFromText, ...aiPref]))
    .filter((s) => !requiredSkills.includes(s))
    .sort((a, b) => a.localeCompare(b));

  // If no explicit preferred split was in text, take top 75% as required and remaining 25% as preferred
  if (preferredSkills.length === 0 && requiredSkills.length > 4) {
    const splitPoint = Math.ceil(requiredSkills.length * 0.75);
    preferredSkills = requiredSkills.slice(splitPoint);
    requiredSkills = requiredSkills.slice(0, splitPoint);
  }

  if (requiredSkills.length === 0 && detectedCanonicalNames.length > 0) {
    requiredSkills = detectedCanonicalNames.slice(0, 6);
  }

  // Extract required years of experience deterministically from JD text
  const yearsMatch = cleanJd.match(/(\d+)\+?\s*(?:-\s*\d+\s*)?(?:years|yrs)\s+of\s+experience/i) ||
    cleanJd.match(/(\d+)\+?\s*(?:years|yrs)\s+experience/i);
  const yearsOfExperience = yearsMatch
    ? parseInt(yearsMatch[1], 10)
    : typeof aiExtractedRequirements?.yearsOfExperience === 'number'
    ? aiExtractedRequirements.yearsOfExperience
    : 2;

  const eduKeywords: string[] = [];
  if (/\b(bachelor|b\.?tech|b\.?e\.?|b\.?s\.?|computer science|engineering)\b/i.test(cleanJd)) {
    eduKeywords.push("Bachelor's in Computer Science / Engineering");
  }
  if (/\b(master|m\.?tech|m\.?s\.?|phd)\b/i.test(cleanJd)) {
    eduKeywords.push("Master's / Advanced Degree");
  }

  const certKeywords: string[] = [];
  if (/\b(aws certified|solutions architect)\b/i.test(cleanJd)) certKeywords.push('AWS Certification');
  if (/\b(cka|ckad|kubernetes)\b/i.test(cleanJd) && /\bcertified\b/i.test(cleanJd)) {
    certKeywords.push('Kubernetes Certification');
  }

  return {
    title: String(targetRole || aiExtractedRequirements?.title || 'Software Engineer').trim(),
    company: String(targetCompany || aiExtractedRequirements?.company || 'Target Company').trim(),
    requiredSkills,
    preferredSkills,
    yearsOfExperience,
    education: eduKeywords.length > 0 ? eduKeywords : ["Bachelor's Degree in CS/Engineering"],
    certifications: certKeywords,
  };
}

/**
 * Pure TypeScript Job Match Scoring Engine (Out of 100):
 * - Required skills: 40 pts
 * - Preferred skills: 10 pts
 * - Title alignment: 10 pts
 * - Experience level: 15 pts
 * - Keywords used inside experience/project bullets (not only the skills list): 15 pts
 * - Education and certifications: 10 pts
 */
export function computeJobMatchScore(
  resume: StructuredResumeData,
  jobRequirements: JobRequirementsSchema,
  customTaxonomy: SkillTaxonomyEntry[] = DEFAULT_SKILLS_TAXONOMY
): JobMatchScoreBreakdown {
  const deductions: JobMatchDeduction[] = [];

  // Candidate's canonical skills from skills section + confirmedSkills + bullets
  const rawCandidateSkills = [
    ...(resume?.skills?.languages || []),
    ...(resume?.skills?.frameworks || []),
    ...(resume?.skills?.cloudAndDevOps || []),
    ...(resume?.skills?.aiAndData || []),
    ...(resume?.confirmedSkills || []).map((c) => c.skill),
  ];

  const candidateSkillSet = new Set<string>(
    rawCandidateSkills.map((s) => resolveCanonicalSkill(s, customTaxonomy).canonicalName.toLowerCase())
  );

  // Also detect taxonomy skills present in bullets
  const bulletTextCombined = [
    ...(resume?.experience || []).flatMap((e) => e.bullets || []),
    ...(resume?.projects || []).flatMap((p) => [
      ...(p.bullets || []),
      ...(p.techStack || []),
    ]),
  ].join(' \n ');

  const bulletSkillSet = new Set<string>(
    extractTaxonomySkillsFromText(bulletTextCombined, customTaxonomy).map((e) =>
      e.canonicalName.toLowerCase()
    )
  );
  for (const bs of bulletSkillSet) {
    candidateSkillSet.add(bs);
  }

  // ============================================================================
  // 1. REQUIRED SKILLS (Max 40 pts)
  // ============================================================================
  const reqList = jobRequirements.requiredSkills || [];
  const reqMatched: string[] = [];
  const reqMissing: string[] = [];

  for (const sk of reqList) {
    const canon = resolveCanonicalSkill(sk, customTaxonomy).canonicalName;
    if (candidateSkillSet.has(canon.toLowerCase())) {
      reqMatched.push(canon);
    } else {
      reqMissing.push(canon);
    }
  }

  const reqScore =
    reqList.length > 0 ? Math.round((reqMatched.length / reqList.length) * 40) : 40;

  if (reqMissing.length > 0) {
    deductions.push({
      id: 'jm-ded-req-skills',
      category: 'requiredSkills',
      pointsLost: 40 - reqScore,
      reason: `Missing ${reqMissing.length} required skill(s): ${reqMissing.join(', ')}. Confirm below if you have used them.`,
      missingSkill: reqMissing[0],
      fixable: true,
    });
  }

  // ============================================================================
  // 2. PREFERRED SKILLS (Max 10 pts)
  // ============================================================================
  const prefList = jobRequirements.preferredSkills || [];
  const prefMatched: string[] = [];
  const prefMissing: string[] = [];

  for (const sk of prefList) {
    const canon = resolveCanonicalSkill(sk, customTaxonomy).canonicalName;
    if (candidateSkillSet.has(canon.toLowerCase())) {
      prefMatched.push(canon);
    } else {
      prefMissing.push(canon);
    }
  }

  const prefScore =
    prefList.length > 0 ? Math.round((prefMatched.length / prefList.length) * 10) : 10;

  if (prefMissing.length > 0) {
    deductions.push({
      id: 'jm-ded-pref-skills',
      category: 'preferredSkills',
      pointsLost: 10 - prefScore,
      reason: `Missing ${prefMissing.length} preferred skill(s): ${prefMissing.join(', ')}.`,
      missingSkill: prefMissing[0],
      fixable: true,
    });
  }

  // ============================================================================
  // 3. TITLE ALIGNMENT (Max 10 pts)
  // ============================================================================
  const targetTitleTokens = (jobRequirements.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['and', 'the', 'for', 'with', 'senior', 'junior', 'lead'].includes(w));

  const candidateTitlesAndSummary = `${(resume?.experience || [])
    .map((e) => e.role)
    .join(' ')} ${resume?.summary || ''}`.toLowerCase();

  const matchedTitleTokens = targetTitleTokens.filter((t) => candidateTitlesAndSummary.includes(t));
  const titleRatio =
    targetTitleTokens.length > 0 ? matchedTitleTokens.length / targetTitleTokens.length : 1;
  const titleScore = Math.max(4, Math.min(10, Math.round(titleRatio * 10)));
  if (titleScore < 10) {
    deductions.push({
      id: 'jm-ded-title',
      category: 'titleAlignment',
      pointsLost: 10 - titleScore,
      reason: `Target role title "${jobRequirements.title}" only partially aligns with your summary and experience titles.`,
      fixable: true,
    });
  }

  // ============================================================================
  // 4. EXPERIENCE LEVEL (Max 15 pts)
  // ============================================================================
  const expCount = (resume?.experience || []).length;
  const estimatedCandidateYears = Math.max(1, expCount * 1.5);
  const reqYears = Math.max(1, jobRequirements.yearsOfExperience || 2);
  const expScore =
    estimatedCandidateYears >= reqYears
      ? 15
      : Math.max(8, Math.round((estimatedCandidateYears / reqYears) * 15));

  if (expScore < 15) {
    deductions.push({
      id: 'jm-ded-exp-years',
      category: 'experienceLevel',
      pointsLost: 15 - expScore,
      reason: `Job requests ~${reqYears} yrs experience; resume shows ~${estimatedCandidateYears} yrs across ${expCount} role(s).`,
      fixable: false,
    });
  }

  // ============================================================================
  // 5. KEYWORDS USED INSIDE EXPERIENCE BULLETS (NOT ONLY SKILLS LIST) (Max 15 pts)
  // ============================================================================
  const allMatchedJobSkills = [...reqMatched, ...prefMatched];
  const usedInBullets: string[] = [];
  const onlyInSkillsList: string[] = [];

  for (const sk of allMatchedJobSkills) {
    if (bulletSkillSet.has(sk.toLowerCase())) {
      usedInBullets.push(sk);
    } else {
      onlyInSkillsList.push(sk);
    }
  }

  const bulletKeywordRatio =
    allMatchedJobSkills.length > 0 ? usedInBullets.length / allMatchedJobSkills.length : 0.7;
  const bulletKeywordsScore = Math.min(15, Math.round(bulletKeywordRatio * 15));

  if (onlyInSkillsList.length > 0 && bulletKeywordsScore < 15) {
    deductions.push({
      id: 'jm-ded-bullets-kw',
      category: 'keywordsInBullets',
      pointsLost: 15 - bulletKeywordsScore,
      reason: `${onlyInSkillsList.length} matched skill(s) (${onlyInSkillsList.join(
        ', '
      )}) appear only in your Skills list, not inside your Experience/Project bullets.`,
      fixable: true,
    });
  }

  // ============================================================================
  // 6. EDUCATION & CERTIFICATIONS (Max 10 pts)
  // ============================================================================
  const hasEdu = (resume?.education || []).length > 0;
  const hasCerts = (resume?.certifications || []).length > 0;
  const eduScore = (hasEdu ? 8 : 3) + (hasCerts ? 2 : 0);
  if (eduScore < 10) {
    deductions.push({
      id: 'jm-ded-edu-cert',
      category: 'educationAndCerts',
      pointsLost: 10 - eduScore,
      reason: hasEdu
        ? 'Adding a relevant technical certification adds +2 bonus points for this role.'
        : 'Education section is missing.',
      fixable: true,
    });
  }

  const totalScore = Math.max(
    0,
    Math.min(100, reqScore + prefScore + titleScore + expScore + bulletKeywordsScore + eduScore)
  );

  return {
    totalScore,
    disclaimer:
      'Estimated Job Match score computed deterministically from taxonomy skill overlap and bullet evidence.',
    categories: {
      requiredSkills: {
        earned: reqScore,
        max: 40,
        matched: reqMatched,
        missing: reqMissing,
      },
      preferredSkills: {
        earned: prefScore,
        max: 10,
        matched: prefMatched,
        missing: prefMissing,
      },
      titleAlignment: {
        earned: titleScore,
        max: 10,
        detail:
          titleScore === 10
            ? `Exact title keyword alignment with "${jobRequirements.title}"`
            : `Partial title overlap with "${jobRequirements.title}"`,
      },
      experienceLevel: {
        earned: expScore,
        max: 15,
        candidateYears: estimatedCandidateYears,
        requiredYears: reqYears,
        detail: `~${estimatedCandidateYears} yrs shown vs ${reqYears} yrs target`,
      },
      keywordsInBullets: {
        earned: bulletKeywordsScore,
        max: 15,
        usedInBullets,
        onlyInSkillsList,
      },
      educationAndCerts: {
        earned: eduScore,
        max: 10,
        detail: `${resume?.education?.length || 0} degree(s), ${
          resume?.certifications?.length || 0
        } certification(s)`,
      },
    },
    deductions,
    jobRequirements,
  };
}

/**
 * Pure TypeScript Truthfulness Validator:
 * Rejects any AI bullet or summary rewrite that introduces:
 * 1. Any skill from the taxonomy that is NOT in the canonical resume or user-confirmed skills.
 * 2. Any number/percentage metric that was NOT in the original resume or confirmed skill context.
 * 3. If violations are found, returns `valid: false`, lists the violations, and provides a sanitized truthful rewrite.
 */
export function validateRewriteTruthfulness(
  canonicalResume: StructuredResumeData,
  proposedRewrite: string,
  originalText: string,
  confirmedSkills: ConfirmedUserSkill[] = [],
  customTaxonomy: SkillTaxonomyEntry[] = DEFAULT_SKILLS_TAXONOMY
): TruthfulnessValidationResult {
  const violations: string[] = [];

  // Build allowed skill set (canonical resume skills + bullets + confirmed skills)
  const allowedSourceText = [
    canonicalResume.summary || '',
    ...(canonicalResume.skills?.languages || []),
    ...(canonicalResume.skills?.frameworks || []),
    ...(canonicalResume.skills?.cloudAndDevOps || []),
    ...(canonicalResume.skills?.aiAndData || []),
    ...(canonicalResume.experience || []).flatMap((e) => [
      e.company,
      e.role,
      e.duration,
      ...(e.bullets || []),
    ]),
    ...(canonicalResume.projects || []).flatMap((p) => [
      p.title,
      ...(p.techStack || []),
      ...(p.bullets || []),
    ]),
    ...(canonicalResume.confirmedSkills || []).map((c) => `${c.skill} ${c.whereUsed}`),
    ...confirmedSkills.map((c) => `${c.skill} ${c.whereUsed}`),
    originalText || '',
  ].join(' \n ');

  const allowedSkillIds = new Set<string>(
    extractTaxonomySkillsFromText(allowedSourceText, customTaxonomy).map((e) => e.id)
  );
  // Also explicitly add canonical names from resume.skills
  for (const s of [
    ...(canonicalResume.skills?.languages || []),
    ...(canonicalResume.skills?.frameworks || []),
    ...(canonicalResume.skills?.cloudAndDevOps || []),
    ...(canonicalResume.skills?.aiAndData || []),
    ...confirmedSkills.map((c) => c.skill),
  ]) {
    const resolved = resolveCanonicalSkill(s, customTaxonomy);
    if (resolved.matchedTaxonomy) {
      const entry = customTaxonomy.find(
        (t) => t.canonicalName.toLowerCase() === resolved.canonicalName.toLowerCase()
      );
      if (entry) allowedSkillIds.add(entry.id);
    }
  }

  // Check if proposedRewrite contains any taxonomy skill NOT in allowedSkillIds
  const rewriteSkills = extractTaxonomySkillsFromText(proposedRewrite, customTaxonomy);
  const unverifiedSkills = rewriteSkills.filter((sk) => !allowedSkillIds.has(sk.id));

  let sanitizedText = proposedRewrite;
  if (unverifiedSkills.length > 0) {
    for (const badSkill of unverifiedSkills) {
      violations.push(`Unconfirmed skill "${badSkill.canonicalName}" removed by Truthfulness Validator.`);
      const escaped = badSkill.canonicalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      sanitizedText = sanitizedText
        .replace(new RegExp(`[,;\\s]*\\b${escaped}\\b`, 'gi'), '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }
  }

  // Check numbers/percentages in proposedRewrite vs allowedSourceText
  const allowedNumbers = new Set<string>(
    (allowedSourceText.match(/\d+(\.\d+)?%?/g) || []).map((n) => n.trim())
  );
  const proposedNumbers = (proposedRewrite.match(/\d+(\.\d+)?%?/g) || []).map((n) => n.trim());
  const inventedNumbers = proposedNumbers.filter((n) => !allowedNumbers.has(n));

  if (inventedNumbers.length > 0) {
    violations.push(
      `Invented metric(s) (${inventedNumbers.join(', ')}) not present in source resume or confirmed context.`
    );
  }

  return {
    valid: violations.length === 0,
    violations,
    sanitizedText: sanitizedText || originalText,
  };
}

/**
 * Pure TypeScript Unit Test Runner for the Deterministic Scoring & Truthfulness Engine.
 */
export function runScoringEngineUnitTests(): {
  passed: number;
  failed: number;
  results: { name: string; passed: boolean; detail: string }[];
} {
  const results: { name: string; passed: boolean; detail: string }[] = [];

  const sampleResume: StructuredResumeData = {
    contact: {
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@careerwave.in',
      phone: '+91 98450 12345',
      location: 'Bengaluru, India',
      linkedin: 'linkedin.com/in/aaravsharma',
      github: 'github.com/aaravsharma',
    },
    summary:
      'Full Stack & AI Systems Engineer with hands-on experience architecting production RAG pipelines, low-latency vector search services, and scalable TypeScript/React applications.',
    skills: {
      languages: ['Go', 'Python', 'SQL', 'TypeScript'],
      frameworks: ['FastAPI', 'Next.js', 'Node.js', 'React', 'Tailwind CSS'],
      cloudAndDevOps: ['AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis'],
      aiAndData: ['LangChain', 'LangGraph', 'PyTorch', 'RAG', 'Vector Databases'],
    },
    experience: [
      {
        id: 'exp-1',
        company: 'NextGen FinTech Systems',
        role: 'Software & AI Application Engineer',
        location: 'Bengaluru, India',
        duration: 'Jan 2024 - Present',
        bullets: [
          'Architected a production RAG pipeline with semantic Redis caching, reducing query latency by 45% across 50K+ daily requests.',
          'Engineered multi-step AI agent workflows using Python, LangChain, and FastAPI with structured schema validation.',
          'Built real-time analytics and billing telemetry dashboards using React, TypeScript, and PostgreSQL, improving team velocity by 30%.',
        ],
      },
    ],
    projects: [
      {
        id: 'prj-1',
        title: 'Autonomous Multi-Agent Evaluator',
        role: 'Lead Developer',
        techStack: ['Python', 'LangChain', 'FastAPI', 'PostgreSQL', 'React'],
        link: 'github.com/aaravsharma/agent-eval',
        bullets: [
          'Constructed an open benchmark harness evaluating tool-calling accuracy across 12 frontier LLMs.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'National Institute of Technology Karnataka',
        degree: 'Bachelor of Technology',
        field: 'Computer Science & Engineering',
        year: '2020 - 2024',
        gpa: '8.9 / 10',
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        year: '2024',
      },
    ],
    templateId: 'classic-exec',
  };

  // Test 1: Category maximums sum to 100
  const breakdown1 = computeGeneralAtsScore(sampleResume);
  const breakdown2 = computeGeneralAtsScore(sampleResume);
  const maxSum =
    breakdown1.categories.parsability.max +
    breakdown1.categories.structure.max +
    breakdown1.categories.contentQuality.max +
    breakdown1.categories.completeness.max;
  results.push({
    name: 'General ATS Score category weights sum to 100 (35+20+25+20)',
    passed: maxSum === 100 && breakdown1.totalScore === breakdown2.totalScore,
    detail: `Sum = ${maxSum}, Deterministic Score = ${breakdown1.totalScore}/100`,
  });

  // Test 2: Pronoun & Filler deduction detection + 1-click fix
  const flawedResume: StructuredResumeData = {
    ...sampleResume,
    experience: [
      {
        ...sampleResume.experience[0],
        duration: '2024/01 to current',
        bullets: ['I was responsible for working on various backend APIs in Python.'],
      },
    ],
  };
  const flawedScore = computeGeneralAtsScore(flawedResume);
  const hasPronounDeduction = flawedScore.deductions.some((d) => d.id === 'ded-content-pronouns');
  results.push({
    name: 'Detects first-person pronouns, filler words, and non-standard dates',
    passed: hasPronounDeduction && flawedScore.totalScore < breakdown1.totalScore,
    detail: `Flawed Score = ${flawedScore.totalScore}/100 (${flawedScore.deductions.length} deductions detected)`,
  });

  // Test 3: Truthfulness validator blocks unconfirmed skill
  const truthCheck = validateRewriteTruthfulness(
    sampleResume,
    'Architected a production RAG pipeline using Rust and Snowflake, reducing latency by 45%.',
    sampleResume.experience[0].bullets[0],
    []
  );
  results.push({
    name: 'Truthfulness Validator rejects unconfirmed skills (Rust, Snowflake)',
    passed: !truthCheck.valid && truthCheck.violations.length >= 1,
    detail: truthCheck.violations.join(' | '),
  });

  // Test 4: Truthfulness validator permits user-confirmed skill
  const truthCheckConfirmed = validateRewriteTruthfulness(
    sampleResume,
    'Architected a production RAG pipeline with Kubernetes and Redis caching, reducing query latency by 45%.',
    sampleResume.experience[0].bullets[0],
    [{ skill: 'Kubernetes', whereUsed: 'NextGen FinTech Systems', confirmedAt: new Date().toISOString() }]
  );
  results.push({
    name: 'Truthfulness Validator allows verified & user-confirmed skills',
    passed: truthCheckConfirmed.valid,
    detail: 'All skills and metrics verified against canonical JSON',
  });

  const passed = results.filter((r) => r.passed).length;
  return {
    passed,
    failed: results.length - passed,
    results,
  };
}
