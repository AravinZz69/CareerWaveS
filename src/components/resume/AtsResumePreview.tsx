import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { StructuredResumeData, AtsTemplateId, ResumeSectionId } from '../../types/resume';
import { ShieldCheck } from 'lucide-react';
import { STANDARD_SECTION_ORDER, computeGeneralAtsScore } from '../../lib/atsScoringEngine';

interface AtsResumePreviewProps {
  data: StructuredResumeData;
  templateId: AtsTemplateId;
  /**
   * Optional key or counter that triggers a gentle staggered reveal of each section
   * (contact, summary, skills, experience, projects, education, ATS score) after parsing finishes.
   */
  revealKey?: number;
}

export const AtsResumePreview: React.FC<AtsResumePreviewProps> = ({
  data,
  templateId,
  revealKey = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const contact = data?.contact || {
    fullName: 'Candidate Name',
    email: '',
    phone: '',
    location: '',
  };
  const summary = data?.summary || '';
  const skills = data?.skills || {
    languages: [],
    frameworks: [],
    cloudAndDevOps: [],
    aiAndData: [],
  };
  const experience = Array.isArray(data?.experience) ? data.experience : [];
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const education = Array.isArray(data?.education) ? data.education : [];
  const certifications = Array.isArray(data?.certifications) ? data.certifications : [];
  const sectionOrder: ResumeSectionId[] =
    Array.isArray(data?.sectionOrder) && data.sectionOrder.length > 0
      ? data.sectionOrder
      : STANDARD_SECTION_ORDER;

  const contactItems = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin,
    contact.github,
    contact.portfolio,
  ].filter(Boolean);

  // Template styling classes (Pure White / Slate Professional Palette, Embedded Standard Fonts)
  const templateMap: Record<
    AtsTemplateId,
    {
      fontFamily: string;
      headingClass: string;
      nameClass: string;
      contactClass: string;
      bodyText: string;
    }
  > = {
    'classic-exec': {
      fontFamily: 'font-serif',
      headingClass:
        'text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mt-4 mb-2',
      nameClass: 'text-2xl font-bold uppercase tracking-tight text-slate-900 text-center',
      contactClass:
        'text-xs text-slate-700 text-center mt-1 mb-4 flex flex-wrap justify-center gap-2',
      bodyText: 'text-xs text-slate-800 leading-relaxed',
    },
    'modern-minimal': {
      fontFamily: 'font-sans',
      headingClass:
        'text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mt-4 mb-2',
      nameClass: 'text-2xl font-extrabold tracking-tight text-slate-900',
      contactClass: 'text-xs text-slate-600 mt-1 mb-4 flex flex-wrap gap-2.5',
      bodyText: 'text-xs text-slate-700 leading-relaxed',
    },
    'tech-standard': {
      fontFamily: 'font-sans',
      headingClass:
        'text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-800 pb-0.5 mt-4 mb-2',
      nameClass: 'text-2xl font-black text-slate-900',
      contactClass: 'text-xs text-slate-600 mt-1 mb-4 flex flex-wrap gap-2',
      bodyText: 'text-xs text-slate-800 leading-relaxed',
    },
    'harvard-clean': {
      fontFamily: 'font-serif',
      headingClass:
        'text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mt-4 mb-2 text-center',
      nameClass: 'text-2xl font-bold uppercase tracking-wider text-slate-900 text-center',
      contactClass:
        'text-xs text-slate-700 text-center mt-1 mb-4 flex flex-wrap justify-center gap-2',
      bodyText: 'text-xs text-slate-800 leading-relaxed',
    },
    'compact-tech': {
      fontFamily: 'font-sans',
      headingClass:
        'text-[11px] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-0.5 mt-3 mb-1.5',
      nameClass: 'text-xl font-bold text-slate-900 text-center',
      contactClass:
        'text-[11px] text-slate-600 text-center mt-0.5 mb-3 flex flex-wrap justify-center gap-2',
      bodyText: 'text-[11px] text-slate-800 leading-normal',
    },
    'silicon-valley': {
      fontFamily: 'font-sans',
      headingClass:
        'text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mt-4 mb-2.5 flex items-center justify-between',
      nameClass: 'text-2xl font-extrabold tracking-tight text-slate-900',
      contactClass: 'text-xs text-slate-500 mt-1.5 mb-4 flex flex-wrap gap-3 font-mono',
      bodyText: 'text-xs text-slate-700 leading-relaxed',
    },
    'wall-street': {
      fontFamily: 'font-serif',
      headingClass:
        'text-xs font-bold uppercase tracking-widest text-slate-950 border-b-2 border-slate-950 pb-0.5 mt-4 mb-2 text-center',
      nameClass: 'text-2xl font-bold uppercase tracking-widest text-slate-950 text-center',
      contactClass:
        'text-[11px] text-slate-700 text-center mt-1 mb-4 flex flex-wrap justify-center gap-2.5 italic',
      bodyText: 'text-xs text-slate-900 leading-relaxed',
    },
    'stanford-eng': {
      fontFamily: 'font-sans',
      headingClass:
        'text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 mt-4 mb-2',
      nameClass: 'text-2xl font-black tracking-tight text-slate-900 text-center',
      contactClass:
        'text-xs text-slate-600 text-center mt-1 mb-4 flex flex-wrap justify-center gap-2.5',
      bodyText: 'text-xs text-slate-800 leading-relaxed',
    },
    'modern-monochrome': {
      fontFamily: 'font-sans',
      headingClass:
        'text-xs font-extrabold uppercase tracking-widest text-zinc-900 border-l-2 border-zinc-900 pl-2 mt-4 mb-2',
      nameClass: 'text-2xl font-black uppercase tracking-tight text-zinc-900',
      contactClass: 'text-xs text-zinc-600 mt-1 mb-4 flex flex-wrap gap-3',
      bodyText: 'text-xs text-zinc-800 leading-relaxed',
    },
  };

  const templateConfig = templateMap[templateId] || templateMap['classic-exec'];

  const hasSkills =
    (skills.languages?.length || 0) > 0 ||
    (skills.frameworks?.length || 0) > 0 ||
    (skills.cloudAndDevOps?.length || 0) > 0 ||
    (skills.aiAndData?.length || 0) > 0;

  const sectionMotion = (index: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.36,
            delay: index * 0.075,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          },
        };

  const renderSectionById = (secId: ResumeSectionId, index: number) => {
    switch (secId) {
      case 'summary':
        if (!summary) return null;
        return (
          <motion.section key="summary" {...sectionMotion(index)} className="mb-4">
            <h2 className={templateConfig.headingClass}>Professional Summary</h2>
            <p className={templateConfig.bodyText}>{summary}</p>
          </motion.section>
        );

      case 'skills':
        if (!hasSkills) return null;
        return (
          <motion.section key="skills" {...sectionMotion(index)} className="mb-4">
            <h2 className={templateConfig.headingClass}>Technical Skills</h2>
            <div className={`space-y-1 ${templateConfig.bodyText}`}>
              {Array.isArray(skills.languages) && skills.languages.length > 0 && (
                <p>
                  <strong className="font-semibold text-slate-900">Languages:</strong>{' '}
                  {skills.languages.join(', ')}
                </p>
              )}
              {Array.isArray(skills.frameworks) && skills.frameworks.length > 0 && (
                <p>
                  <strong className="font-semibold text-slate-900">Frameworks & Libraries:</strong>{' '}
                  {skills.frameworks.join(', ')}
                </p>
              )}
              {Array.isArray(skills.cloudAndDevOps) && skills.cloudAndDevOps.length > 0 && (
                <p>
                  <strong className="font-semibold text-slate-900">
                    Cloud, Databases & DevOps:
                  </strong>{' '}
                  {skills.cloudAndDevOps.join(', ')}
                </p>
              )}
              {Array.isArray(skills.aiAndData) && skills.aiAndData.length > 0 && (
                <p>
                  <strong className="font-semibold text-slate-900">AI, LLM & Data Systems:</strong>{' '}
                  {skills.aiAndData.join(', ')}
                </p>
              )}
            </div>
          </motion.section>
        );

      case 'experience':
        if (experience.length === 0) return null;
        return (
          <motion.section key="experience" {...sectionMotion(index)} className="mb-4">
            <h2 className={templateConfig.headingClass}>Professional Experience</h2>
            <div className="space-y-3">
              {experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      {exp.role} <span className="font-normal text-slate-600">|</span> {exp.company}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {exp.duration} {exp.location && `• ${exp.location}`}
                    </div>
                  </div>
                  {Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className={templateConfig.bodyText}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        );

      case 'projects':
        if (projects.length === 0) return null;
        return (
          <motion.section key="projects" {...sectionMotion(index)} className="mb-4">
            <h2 className={templateConfig.headingClass}>Projects & Systems</h2>
            <div className="space-y-3">
              {projects.map((prj, idx) => (
                <div key={prj.id || idx} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      {prj.title}
                      {prj.link && (
                        <span className="text-[11px] font-normal text-slate-500 ml-2">
                          ({prj.link})
                        </span>
                      )}
                    </div>
                    {Array.isArray(prj.techStack) && prj.techStack.length > 0 && (
                      <div className="text-[11px] text-slate-600 font-medium">
                        Tech: {prj.techStack.join(', ')}
                      </div>
                    )}
                  </div>
                  {Array.isArray(prj.bullets) && prj.bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1">
                      {prj.bullets.map((b, bIdx) => (
                        <li key={bIdx} className={templateConfig.bodyText}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        );

      case 'education':
        if (education.length === 0) return null;
        return (
          <motion.section key="education" {...sectionMotion(index)} className="mb-4">
            <h2 className={templateConfig.headingClass}>Education</h2>
            <div className="space-y-2">
              {education.map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="flex flex-wrap items-baseline justify-between text-xs"
                >
                  <div>
                    <strong className="font-bold text-slate-900">{edu.school}</strong> — {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ''}
                    {edu.gpa && <span className="text-slate-500 ml-2">• GPA: {edu.gpa}</span>}
                  </div>
                  <div className="text-slate-500 font-medium">{edu.year}</div>
                </div>
              ))}
            </div>
          </motion.section>
        );

      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <motion.section key="certifications" {...sectionMotion(index)} className="mb-3">
            <h2 className={templateConfig.headingClass}>Certifications</h2>
            <div className="space-y-1 text-xs">
              {certifications.map((cert, idx) => (
                <div key={cert.id || idx} className="flex justify-between">
                  <span>
                    <strong className="font-semibold text-slate-900">{cert.name}</strong>
                    {cert.issuer ? ` — ${cert.issuer}` : ''}
                  </span>
                  <span className="text-slate-500">{cert.year}</span>
                </div>
              ))}
            </div>
          </motion.section>
        );

      default:
        return null;
    }
  };

  const liveBreakdown = computeGeneralAtsScore(data);

  return (
    <div
      key={revealKey}
      id="ats-printable-resume"
      className={`bg-white text-slate-900 p-8 sm:p-10 shadow-lg rounded-2xl border border-slate-200 max-w-[800px] mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none select-text ${templateConfig.fontFamily}`}
    >
      {/* 1. Header (Name & Contact) */}
      <motion.header {...sectionMotion(0)} className="mb-4">
        <h1 className={templateConfig.nameClass}>{contact.fullName || 'Candidate Name'}</h1>
        {contactItems.length > 0 && (
          <div className={templateConfig.contactClass}>
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                <span>{item}</span>
                {idx < contactItems.length - 1 && <span className="text-slate-400">•</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </motion.header>

      {/* Dynamic Sections Ordered by sectionOrder */}
      {sectionOrder.map((secId, idx) => renderSectionById(secId, idx + 1))}

      {/* Staggered ATS Verification Footer Strip (Hidden in print) */}
      <motion.div
        {...sectionMotion(sectionOrder.length + 1)}
        className="mt-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-sans print:hidden"
      >
        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Estimated ATS Compatibility Score: {liveBreakdown.totalScore}/100
        </span>
        <span className="text-slate-400">
          Single-Column Selectable Text · Standard Semantic Headings
        </span>
      </motion.div>
    </div>
  );
};
