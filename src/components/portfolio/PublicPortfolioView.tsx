import React from 'react';
import {
  Globe,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Code2,
  Briefcase,
  GraduationCap,
  Award,
  ArrowLeft,
  Sparkles,
  Download,
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface PortfolioData {
  slug: string;
  theme: 'purple-wave' | 'terminal-dark' | 'minimal-editorial';
  profile: {
    name: string;
    headline: string;
    title: string;
    bio: string;
    location: string;
    email: string;
    avatarUrl: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  skills: {
    category: string;
    items: string[];
  }[];
  projects: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    githubUrl?: string;
    liveUrl?: string;
    metric?: string;
  }[];
  experience: {
    id: string;
    role: string;
    company: string;
    period: string;
    description: string;
  }[];
  certifications: {
    id: string;
    title: string;
    issuer: string;
    date: string;
  }[];
}

export const defaultPortfolioData: PortfolioData = {
  slug: 'alexvance',
  theme: 'purple-wave',
  profile: {
    name: 'Alex Vance',
    headline: 'Building production AI agents, distributed systems & high-throughput web apps.',
    title: 'Senior AI Engineer & Full Stack Architect',
    bio: 'Passionate software engineer specializing in Large Language Model (LLM) orchestration, real-time multi-agent swarms, and scalable TypeScript/Python microservices. Proven track record deploying fault-tolerant systems handling millions of daily inference requests.',
    location: 'San Francisco, CA (Open to Remote)',
    email: 'alex.vance@careerwave.ai',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    github: 'https://github.com/alexvance',
    linkedin: 'https://linkedin.com/in/alexvance',
    website: 'https://careerwave.ai/p/alexvance',
  },
  skills: [
    {
      category: 'Core AI & ML',
      items: ['Gemini 2.5 Flash', 'LangChain', 'LangGraph', 'RAG Pipelines', 'Vector DBs (pgvector)', 'PyTorch'],
    },
    {
      category: 'Frontend & UI',
      items: ['React 19', 'Next.js 15', 'TypeScript', 'Tailwind CSS v4', 'Web Speech API', 'Canvas API'],
    },
    {
      category: 'Backend & Cloud',
      items: ['Node.js', 'Express', 'Python FastAPI', 'PostgreSQL', 'Supabase RLS', 'Docker & Kubernetes'],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Enterprise Multi-Agent Swarm',
      description: 'Autonomous multi-agent system executing real-time financial document analysis and report synthesis with automated fallback circuits.',
      tags: ['React 19', 'LangGraph', 'TypeScript', 'FastAPI', 'pgvector'],
      githubUrl: 'https://github.com/alexvance/multi-agent-swarm',
      liveUrl: 'https://swarm-demo.careerwave.ai',
      metric: '94% ATS Proven • 4.2k GitHub Stars',
    },
    {
      id: 'proj-2',
      title: 'Real-Time Voice AI Interviewer',
      description: 'Low-latency browser speech-to-text and synthetic vocal evaluation engine with automated STAR rubric scoring.',
      tags: ['Web Speech API', 'Node.js', 'Gemini Flash', 'WebSockets'],
      githubUrl: 'https://github.com/alexvance/voice-ai-interviewer',
      liveUrl: 'https://interview.careerwave.ai',
      metric: 'Sub-300ms latency',
    },
    {
      id: 'proj-3',
      title: 'Algorithmic Risk & Fraud Sentinel',
      description: 'Distributed fraud detection pipeline analyzing 50,000 credit transactions per second with real-time anomaly isolation.',
      tags: ['Python', 'PostgreSQL', 'Redis Streams', 'Docker'],
      githubUrl: 'https://github.com/alexvance/risk-sentinel',
      liveUrl: 'https://sentinel.careerwave.ai',
      metric: '0.002% False Positive Rate',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      role: 'Lead AI Systems Engineer',
      company: 'Apex Intelligence Labs',
      period: '2023 - Present',
      description: 'Architected distributed RAG pipelines serving 1.2M daily queries with 99.98% uptime. Mentored 8 engineers across frontend and ML infrastructure.',
    },
    {
      id: 'exp-2',
      role: 'Full Stack Engineer',
      company: 'Novus Technologies',
      period: '2021 - 2023',
      description: 'Built customer-facing React & TypeScript web portals with end-to-end Supabase authentication and real-time collaborative state.',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      title: 'Generative AI & LLM Systems Architect',
      issuer: 'CareerWave Verified Academy',
      date: 'October 2026',
    },
    {
      id: 'cert-2',
      title: 'Enterprise PostgreSQL & Security Definer RBAC',
      issuer: 'Supabase Certified Partner',
      date: 'August 2026',
    },
  ],
};

interface PublicPortfolioViewProps {
  data?: PortfolioData;
  onBack?: () => void;
  isStandalone?: boolean;
}

export const PublicPortfolioView: React.FC<PublicPortfolioViewProps> = ({
  data = defaultPortfolioData,
  onBack,
  isStandalone = false,
}) => {
  const theme = data.theme;

  // Render according to selected theme
  if (theme === 'terminal-dark') {
    return (
      <div className="min-h-screen bg-[#0D1117] text-slate-200 font-mono selection:bg-emerald-500 selection:text-black">
        {/* Top utility bar */}
        {!isStandalone && onBack && (
          <div className="sticky top-0 z-40 bg-[#161B22]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Exit to Portfolio Editor
            </button>
            <div className="text-[11px] text-slate-400">
              theme: <span className="text-emerald-400 font-bold">terminal-dark</span> • hosted at <code className="text-purple-400">/p/{data.slug}</code>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
          {/* Terminal Window Header */}
          <div className="rounded-2xl border border-slate-800 bg-[#161B22] shadow-2xl overflow-hidden">
            <div className="h-9 bg-[#21262D] px-4 flex items-center gap-2 border-b border-slate-800">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-xs text-slate-400 ml-2 font-mono">
                bash - {data.profile.name.toLowerCase().replace(/\s+/g, '')}@careerwave:~
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-xs text-emerald-400">$ whoami</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                  <img
                    src={data.profile.avatarUrl}
                    alt={data.profile.name}
                    className="w-20 h-20 rounded-xl object-cover ring-2 ring-emerald-500/40"
                  />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">
                      {data.profile.name}
                    </h1>
                    <p className="text-sm text-emerald-400 mt-0.5">{data.profile.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{data.profile.location}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-4">
                <p className="text-xs text-emerald-400">$ cat about.txt</p>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {data.profile.bio}
                </p>
              </div>

              {/* Social links */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {data.profile.github && (
                  <a
                    href={data.profile.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262D] text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" /> github
                  </a>
                )}
                {data.profile.linkedin && (
                  <a
                    href={data.profile.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262D] text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" /> linkedin
                  </a>
                )}
                <a
                  href={`mailto:${data.profile.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs hover:bg-emerald-500/30 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> contact me
                </a>
              </div>
            </div>
          </div>

          {/* Skills / Tech Stack */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Code2 className="w-4 h-4" /> $ ls -la ./skills
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.skills.map((grp, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#161B22] border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{grp.category}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {grp.items.map((item, j) => (
                      <span key={j} className="text-[11px] px-2 py-0.5 rounded bg-[#21262D] text-emerald-400">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Projects */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> $ ./run_projects.sh
            </h2>
            <div className="space-y-4">
              {data.projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-xl bg-[#161B22] border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="text-emerald-400">&gt;</span> {proj.title}
                    </h3>
                    {proj.metric && (
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {proj.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                    {proj.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-2 text-xs">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <Github className="w-3.5 h-3.5" /> Source
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> $ history --grep "experience"
            </h2>
            <div className="space-y-3">
              {data.experience.map((exp) => (
                <div key={exp.id} className="p-4 rounded-xl bg-[#161B22] border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{exp.role} @ {exp.company}</span>
                    <span className="text-slate-400">{exp.period}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans pt-1 leading-relaxed">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (theme === 'minimal-editorial') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-serif-heading selection:bg-slate-800 selection:text-white">
        {!isStandalone && onBack && (
          <div className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs text-stone-700 hover:text-black font-sans font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Exit to Portfolio Editor
            </button>
            <div className="text-[11px] font-sans text-stone-500">
              theme: <span className="font-bold text-black">minimal-editorial</span> • <code className="text-stone-800">/p/{data.slug}</code>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">
          {/* Header */}
          <header className="space-y-6 border-b border-stone-300 pb-12">
            <span className="text-xs uppercase tracking-widest text-stone-500 font-sans font-semibold">
              Curriculum Vitae & Selected Works
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
                  {data.profile.name}
                </h1>
                <p className="text-lg text-stone-600 italic mt-1">{data.profile.title}</p>
                <p className="text-xs text-stone-500 font-sans mt-2">{data.profile.location}</p>
              </div>
              <img
                src={data.profile.avatarUrl}
                alt={data.profile.name}
                className="w-24 h-24 rounded-full object-cover filter grayscale contrast-125 border-2 border-stone-300"
              />
            </div>
            <p className="text-base text-stone-700 leading-relaxed font-sans pt-2">
              {data.profile.bio}
            </p>
            <div className="flex items-center gap-4 font-sans text-xs pt-2">
              <a href={`mailto:${data.profile.email}`} className="font-bold underline text-stone-900 hover:text-stone-600">
                {data.profile.email}
              </a>
              {data.profile.github && (
                <a href={data.profile.github} target="_blank" rel="noreferrer" className="text-stone-600 hover:text-black underline">
                  GitHub
                </a>
              )}
              {data.profile.linkedin && (
                <a href={data.profile.linkedin} target="_blank" rel="noreferrer" className="text-stone-600 hover:text-black underline">
                  LinkedIn
                </a>
              )}
            </div>
          </header>

          {/* Selected Projects */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-stone-900">Selected Engineering Works</h2>
            <div className="divide-y divide-stone-200">
              {data.projects.map((proj) => (
                <div key={proj.id} className="py-6 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-lg font-bold text-stone-900">{proj.title}</h3>
                    {proj.metric && (
                      <span className="text-xs font-sans text-stone-500 italic">{proj.metric}</span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-stone-600 leading-relaxed">
                    {proj.description}
                  </p>
                  <div className="flex items-center gap-2 font-sans text-xs text-stone-400 pt-1">
                    <span>{proj.tags.join(' • ')}</span>
                  </div>
                  <div className="flex items-center gap-4 font-sans text-xs pt-2">
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="underline font-semibold text-stone-800">
                        View Code
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="underline font-semibold text-stone-800">
                        Interactive Demo →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Experience */}
          <section className="space-y-6 border-t border-stone-200 pt-10">
            <h2 className="text-2xl font-bold text-stone-900">Professional Experience</h2>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-base font-bold text-stone-900">{exp.role}</h3>
                    <span className="text-xs font-sans text-stone-500">{exp.period}</span>
                  </div>
                  <p className="text-xs font-sans font-bold text-stone-700">{exp.company}</p>
                  <p className="text-xs font-sans text-stone-600 leading-relaxed pt-1">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Verified Credentials */}
          <section className="space-y-4 border-t border-stone-200 pt-10">
            <h2 className="text-2xl font-bold text-stone-900">Certifications</h2>
            <div className="space-y-2 font-sans text-xs">
              {data.certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between items-center py-2 border-b border-stone-100">
                  <span className="font-bold text-stone-800">{cert.title}</span>
                  <span className="text-stone-500">{cert.issuer} ({cert.date})</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Default: Purple Wave (Official CareerWave Signature)
  return (
    <div className="min-h-screen bg-[#FAF8FF] font-poppins text-slate-800 selection:bg-[#6C3CE1] selection:text-white">
      {/* Top utility bar */}
      {!isStandalone && onBack && (
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100 px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs text-[#6C3CE1] hover:underline font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio Builder
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Public link: <strong className="text-[#6C3CE1]">careerwave.ai/p/{data.slug}</strong>
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(`https://careerwave.ai/p/${data.slug}`);
                alert('Copied public portfolio link to clipboard!');
              }}
              className="text-xs font-bold"
            >
              Share Portfolio Link
            </Button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Hero Banner Card */}
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-purple-100 shadow-soft relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-200/40 via-purple-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F0FF] text-[#6C3CE1] text-xs font-bold border border-purple-100">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified CareerWave AI Engineer</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black font-serif-heading text-slate-900 leading-tight">
                {data.profile.name}
              </h1>
              <p className="text-base sm:text-lg font-semibold text-[#6C3CE1]">
                {data.profile.title}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {data.profile.bio}
              </p>

              {/* Social and Contact buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`mailto:${data.profile.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C3CE1] text-white text-xs font-bold shadow-md shadow-[#6C3CE1]/30 hover:bg-[#5A2EC7] transition-all"
                >
                  <Mail className="w-3.5 h-3.5" /> Contact Alex
                </a>
                {data.profile.github && (
                  <a
                    href={data.profile.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-slate-700 hover:bg-[#FAF8FF] hover:border-purple-300 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5 text-[#6C3CE1]" /> GitHub
                  </a>
                )}
                {data.profile.linkedin && (
                  <a
                    href={data.profile.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-slate-700 hover:bg-[#FAF8FF] hover:border-purple-300 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-[#6C3CE1]" /> LinkedIn
                  </a>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <div className="relative">
                <img
                  src={data.profile.avatarUrl}
                  alt={data.profile.name}
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl object-cover ring-4 ring-white shadow-xl"
                />
                <span className="absolute -bottom-2 -right-2 px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                  Open to Work
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold font-serif-heading text-slate-900">
            Technical Proficiency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.skills.map((grp, i) => (
              <div
                key={i}
                className="p-6 bg-white rounded-2xl border border-purple-100 shadow-soft space-y-3"
              >
                <h3 className="text-xs font-bold text-[#6C3CE1] uppercase tracking-wider">
                  {grp.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {grp.items.map((skill, j) => (
                    <span
                      key={j}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#F8F6FE] text-slate-700 border border-purple-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold font-serif-heading text-slate-900">
              Featured Engineering Projects
            </h2>
            <span className="text-xs font-bold text-[#6C3CE1]">
              Verified on GitHub
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.projects.map((proj) => (
              <div
                key={proj.id}
                className="p-6 bg-white rounded-3xl border border-purple-100 shadow-soft hover:shadow-xl hover:border-purple-200 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-2xl bg-[#F4F0FF] text-[#6C3CE1] flex items-center justify-center font-bold">
                      <Code2 className="w-5 h-5" />
                    </div>
                    {proj.metric && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {proj.metric}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{proj.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {proj.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-[#6C3CE1] font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-5 border-t border-purple-50 mt-5 text-xs font-bold">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-600 hover:text-[#6C3CE1] flex items-center gap-1"
                    >
                      <Github className="w-3.5 h-3.5" /> Source
                    </a>
                  )}
                  {proj.liveUrl && (
                    <a
                      href={proj.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#6C3CE1] hover:underline flex items-center gap-1 ml-auto"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experience & Certifications split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Experience */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-serif-heading text-slate-900">
              Work Experience
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div
                  key={exp.id}
                  className="p-5 bg-white rounded-2xl border border-purple-100 shadow-soft space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{exp.role}</h4>
                      <p className="text-xs text-[#6C3CE1] font-semibold">{exp.company}</p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">{exp.period}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-serif-heading text-slate-900">
              Verified Certifications
            </h2>
            <div className="space-y-4">
              {data.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 bg-white rounded-2xl border border-purple-100 shadow-soft flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {cert.title}
                    </h4>
                    <p className="text-[11px] text-[#6C3CE1] font-semibold">{cert.issuer}</p>
                    <p className="text-[10px] text-slate-400">{cert.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-purple-100 text-xs text-slate-400">
          Powered by <strong className="text-[#6C3CE1]">CareerWave AI</strong> • Hosted on Supabase Storage Bucket `portfolios`
        </footer>
      </div>
    </div>
  );
};
