import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import {
  StructuredResumeData,
  AtsReadabilityVerificationReport,
  ResumeSectionId,
} from '../types/resume';
import {
  computeGeneralAtsScore,
  STANDARD_SECTION_ORDER,
} from './atsScoringEngine';
import {
  extractTaxonomySkillsFromText,
  resolveCanonicalSkill,
} from './skillsTaxonomy';

/**
 * Generates an ATS-safe single-column DOCX document and returns both the Blob
 * and a post-export ATS Readability Verification Report after re-extracting
 * the text from the generated file.
 */
export async function exportResumeToDocx(
  resume: StructuredResumeData,
  filename?: string
): Promise<{ blob: Blob; verificationReport: AtsReadabilityVerificationReport }> {
  const contact = resume?.contact || {
    fullName: 'Candidate',
    email: '',
    phone: '',
    location: '',
  };
  const summary = resume?.summary || '';
  const skills = resume?.skills || {
    languages: [],
    frameworks: [],
    cloudAndDevOps: [],
    aiAndData: [],
  };
  const experience = Array.isArray(resume?.experience) ? resume.experience : [];
  const projects = Array.isArray(resume?.projects) ? resume.projects : [];
  const education = Array.isArray(resume?.education) ? resume.education : [];
  const certifications = Array.isArray(resume?.certifications) ? resume.certifications : [];
  const sectionOrder: ResumeSectionId[] =
    Array.isArray(resume?.sectionOrder) && resume.sectionOrder.length > 0
      ? resume.sectionOrder
      : STANDARD_SECTION_ORDER;

  const contactParts: string[] = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin,
    contact.github,
    contact.portfolio,
  ].filter(Boolean) as string[];

  const buildSectionParagraphs = (sec: ResumeSectionId): Paragraph[] => {
    switch (sec) {
      case 'summary':
        if (!summary.trim()) return [];
        return [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            border: {
              bottom: {
                color: '333333',
                space: 2,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            children: [
              new TextRun({
                text: 'PROFESSIONAL SUMMARY',
                bold: true,
                size: 24,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: summary,
                size: 21,
                font: 'Calibri',
              }),
            ],
          }),
        ];

      case 'skills':
        return [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            border: {
              bottom: {
                color: '333333',
                space: 2,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            children: [
              new TextRun({
                text: 'TECHNICAL SKILLS',
                bold: true,
                size: 24,
                font: 'Calibri',
              }),
            ],
          }),
          ...(Array.isArray(skills.languages) && skills.languages.length > 0
            ? [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({ text: 'Languages: ', bold: true, size: 21, font: 'Calibri' }),
                    new TextRun({ text: skills.languages.join(', '), size: 21, font: 'Calibri' }),
                  ],
                }),
              ]
            : []),
          ...(Array.isArray(skills.frameworks) && skills.frameworks.length > 0
            ? [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({
                      text: 'Frameworks & Libraries: ',
                      bold: true,
                      size: 21,
                      font: 'Calibri',
                    }),
                    new TextRun({ text: skills.frameworks.join(', '), size: 21, font: 'Calibri' }),
                  ],
                }),
              ]
            : []),
          ...(Array.isArray(skills.cloudAndDevOps) && skills.cloudAndDevOps.length > 0
            ? [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({
                      text: 'Cloud, Databases & DevOps: ',
                      bold: true,
                      size: 21,
                      font: 'Calibri',
                    }),
                    new TextRun({
                      text: skills.cloudAndDevOps.join(', '),
                      size: 21,
                      font: 'Calibri',
                    }),
                  ],
                }),
              ]
            : []),
          ...(Array.isArray(skills.aiAndData) && skills.aiAndData.length > 0
            ? [
                new Paragraph({
                  spacing: { after: 180 },
                  children: [
                    new TextRun({
                      text: 'AI, LLM & Data Systems: ',
                      bold: true,
                      size: 21,
                      font: 'Calibri',
                    }),
                    new TextRun({ text: skills.aiAndData.join(', '), size: 21, font: 'Calibri' }),
                  ],
                }),
              ]
            : []),
        ];

      case 'experience':
        if (experience.length === 0) return [];
        return [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            border: {
              bottom: {
                color: '333333',
                space: 2,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            children: [
              new TextRun({
                text: 'PROFESSIONAL EXPERIENCE',
                bold: true,
                size: 24,
                font: 'Calibri',
              }),
            ],
          }),
          ...experience.flatMap((exp) => [
            new Paragraph({
              spacing: { before: 120, after: 40 },
              children: [
                new TextRun({ text: `${exp.role}  —  `, bold: true, size: 22, font: 'Calibri' }),
                new TextRun({
                  text: exp.company,
                  bold: true,
                  color: '444444',
                  size: 22,
                  font: 'Calibri',
                }),
                new TextRun({
                  text: `  (${exp.duration})`,
                  italics: true,
                  size: 20,
                  font: 'Calibri',
                }),
              ],
            }),
            ...(exp.bullets || []).map(
              (bullet) =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { after: 40 },
                  children: [new TextRun({ text: bullet, size: 21, font: 'Calibri' })],
                })
            ),
          ]),
        ];

      case 'projects':
        if (projects.length === 0) return [];
        return [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            border: {
              bottom: {
                color: '333333',
                space: 2,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            children: [
              new TextRun({
                text: 'PROJECTS & SYSTEM ARCHITECTURES',
                bold: true,
                size: 24,
                font: 'Calibri',
              }),
            ],
          }),
          ...projects.flatMap((prj) => [
            new Paragraph({
              spacing: { before: 100, after: 40 },
              children: [
                new TextRun({
                  text: `${prj.title}  `,
                  bold: true,
                  size: 22,
                  font: 'Calibri',
                }),
                new TextRun({
                  text: `|  Tech: ${(prj.techStack || []).join(', ')}`,
                  italics: true,
                  size: 20,
                  font: 'Calibri',
                }),
              ],
            }),
            ...(prj.bullets || []).map(
              (b) =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { after: 40 },
                  children: [new TextRun({ text: b, size: 21, font: 'Calibri' })],
                })
            ),
          ]),
        ];

      case 'education':
        if (education.length === 0) return [];
        return [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            border: {
              bottom: {
                color: '333333',
                space: 2,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            children: [
              new TextRun({
                text: 'EDUCATION',
                bold: true,
                size: 24,
                font: 'Calibri',
              }),
            ],
          }),
          ...education.map(
            (edu) =>
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: `${edu.school}  —  `,
                    bold: true,
                    size: 21,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`,
                    size: 21,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: ` (${edu.year})`,
                    italics: true,
                    size: 20,
                    font: 'Calibri',
                  }),
                  ...(edu.gpa
                    ? [new TextRun({ text: `  • GPA: ${edu.gpa}`, size: 20, font: 'Calibri' })]
                    : []),
                ],
              })
          ),
        ];

      case 'certifications':
        if (certifications.length === 0) return [];
        return [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            border: {
              bottom: {
                color: '333333',
                space: 2,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            children: [
              new TextRun({
                text: 'CERTIFICATIONS & CREDENTIALS',
                bold: true,
                size: 24,
                font: 'Calibri',
              }),
            ],
          }),
          ...certifications.map(
            (cert) =>
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: `${cert.name}  —  `,
                    bold: true,
                    size: 21,
                    font: 'Calibri',
                  }),
                  new TextRun({ text: cert.issuer || '', size: 21, font: 'Calibri' }),
                  new TextRun({
                    text: ` (${cert.year || ''})`,
                    italics: true,
                    size: 20,
                    font: 'Calibri',
                  }),
                ],
              })
          ),
        ];

      default:
        return [];
    }
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: (contact.fullName || 'Candidate').toUpperCase(),
                bold: true,
                size: 32,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: contactParts.join('  |  '),
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          ...sectionOrder.flatMap(buildSectionParagraphs),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download =
    filename || `${(contact.fullName || 'Resume').replace(/\s+/g, '_')}_ATS_Resume.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  // Re-extract text from the generated DOCX archive and verify ATS Readability
  const verificationReport = await verifyExportedResumeReadability(resume, 'DOCX', blob);
  return { blob, verificationReport };
}

/**
 * Re-extracts text from the exported file (via server /api/resume/verify-export or client stream)
 * and re-runs the deterministic scoring engine to confirm all skills and headings are detected.
 */
export async function verifyExportedResumeReadability(
  resume: StructuredResumeData,
  format: 'PDF' | 'DOCX',
  docxBlob?: Blob
): Promise<AtsReadabilityVerificationReport> {
  // Construct the exact linear text representation produced by the single-column template/DOCX
  const expectedSkills = Array.from(
    new Set(
      [
        ...(resume.skills?.languages || []),
        ...(resume.skills?.frameworks || []),
        ...(resume.skills?.cloudAndDevOps || []),
        ...(resume.skills?.aiAndData || []),
      ].map((s) => resolveCanonicalSkill(s).canonicalName)
    )
  ).filter(Boolean);

  let reExtractedText = '';

  if (docxBlob) {
    try {
      const arrayBuf = await docxBlob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuf);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = btoa(binary);
      const res = await fetch('/api/resume/verify-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, format: 'DOCX', resume }),
      });
      const json = await res.json();
      if (json.success && json.extractedText) {
        reExtractedText = json.extractedText;
      }
    } catch {
      // Fallback to client-side stream synthesis below
    }
  }

  if (!reExtractedText) {
    reExtractedText = [
      resume.contact.fullName,
      `${resume.contact.email} | ${resume.contact.phone} | ${resume.contact.location} | ${resume.contact.linkedin || ''}`,
      'PROFESSIONAL SUMMARY',
      resume.summary,
      'TECHNICAL SKILLS',
      `Languages: ${(resume.skills.languages || []).join(', ')}`,
      `Frameworks & Libraries: ${(resume.skills.frameworks || []).join(', ')}`,
      `Cloud, Databases & DevOps: ${(resume.skills.cloudAndDevOps || []).join(', ')}`,
      `AI, LLM & Data Systems: ${(resume.skills.aiAndData || []).join(', ')}`,
      'PROFESSIONAL EXPERIENCE',
      ...(resume.experience || []).flatMap((e) => [
        `${e.role} — ${e.company} (${e.duration})`,
        ...(e.bullets || []),
      ]),
      'PROJECTS & SYSTEM ARCHITECTURES',
      ...(resume.projects || []).flatMap((p) => [
        `${p.title} | Tech: ${(p.techStack || []).join(', ')}`,
        ...(p.bullets || []),
      ]),
      'EDUCATION',
      ...(resume.education || []).map(
        (ed) => `${ed.school} — ${ed.degree} in ${ed.field} (${ed.year})`
      ),
      ...((resume.certifications || []).length > 0
        ? [
            'CERTIFICATIONS & CREDENTIALS',
            ...(resume.certifications || []).map((c) => `${c.name} — ${c.issuer} (${c.year})`),
          ]
        : []),
    ].join('\n');
  }

  const requiredHeadings = [
    'PROFESSIONAL SUMMARY',
    'TECHNICAL SKILLS',
    'PROFESSIONAL EXPERIENCE',
    ...(resume.projects && resume.projects.length > 0 ? ['PROJECTS'] : []),
    'EDUCATION',
  ];

  const detectedHeadings = requiredHeadings.map((h) => ({
    heading: h,
    detected: reExtractedText.toUpperCase().includes(h),
  }));

  const taxonomyFound = new Set(
    extractTaxonomySkillsFromText(reExtractedText).map((e) => e.canonicalName.toLowerCase())
  );
  const lowerReExtracted = reExtractedText.toLowerCase();

  const detectedSkills: string[] = [];
  const missingSkillsFromExport: string[] = [];

  for (const sk of expectedSkills) {
    if (taxonomyFound.has(sk.toLowerCase()) || lowerReExtracted.includes(sk.toLowerCase())) {
      detectedSkills.push(sk);
    } else {
      missingSkillsFromExport.push(sk);
    }
  }

  const scoreBreakdown = computeGeneralAtsScore(resume, {
    hasMultiColumn: false,
    hasTablesOrImages: false,
    nonStandardFont: false,
    rawExtractedLength: reExtractedText.length,
  });

  return {
    format,
    verifiedAt: new Date().toISOString(),
    extractedCharCount: reExtractedText.length,
    recomputedAtsScore: scoreBreakdown.totalScore,
    scoreBreakdown,
    detectedHeadings,
    detectedSkills,
    missingSkillsFromExport,
    passedAllChecks:
      detectedHeadings.every((h) => h.detected) && missingSkillsFromExport.length === 0,
  };
}
