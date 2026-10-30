import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  FileText,
  Briefcase,
  CheckSquare,
  Mic,
  Milestone,
  FolderGit2,
  GraduationCap,
  Linkedin,
  Globe,
  Settings,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { sample12Courses, DetailedCourse } from '../../data/coursesData';

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  category: 'tool' | 'course' | 'job' | 'roadmap';
  badge?: string;
  icon?: any;
  targetPage?: string;
  targetDetailId?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, detailId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'tool' | 'course' | 'job' | 'roadmap'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toolsData: SearchResultItem[] = [
    {
      id: 'tool-resume',
      title: 'ATS Resume Studio',
      description: 'Upload PDF/DOCX, parse structured fields, tailor to job descriptions with 5 ATS templates',
      category: 'tool',
      badge: '94% ATS Pass',
      icon: FileText,
      targetPage: 'resume',
    },
    {
      id: 'tool-jobs',
      title: 'Job Hunter & Match Engine',
      description: 'Search live roles across India & Remote with A–F match grades and Application Kits',
      category: 'tool',
      badge: 'Live Feed',
      icon: Briefcase,
      targetPage: 'jobs',
    },
    {
      id: 'tool-apps',
      title: 'Kanban Application Tracker',
      description: 'Manage 5 pipeline stages: Saved, Applied, Interview, Offer, and Rejected',
      category: 'tool',
      badge: '5 Stages',
      icon: CheckSquare,
      targetPage: 'applications',
    },
    {
      id: 'tool-interview',
      title: 'Live Spoken Voice Interviewer',
      description: 'Spoken voice mock interviews tailored to role & level with live waveform and scored report',
      category: 'tool',
      badge: 'Voice Agent',
      icon: Mic,
      targetPage: 'interviews',
    },
    {
      id: 'tool-roadmap',
      title: 'Career Track Roadmaps & Skill Gap',
      description: 'Find missing skills against target roles and follow visual phase timelines',
      category: 'tool',
      badge: 'Interactive',
      icon: Milestone,
      targetPage: 'roadmap',
    },
    {
      id: 'tool-projects',
      title: 'Portfolio Project Starters',
      description: 'Industry-grade engineering projects to close specific resume skill gaps',
      category: 'tool',
      badge: 'Guided Steps',
      icon: FolderGit2,
      targetPage: 'projects',
    },
    {
      id: 'tool-courses',
      title: 'Courses & Certifications',
      description: '12 curated certifications with lesson players, auto-graded quizzes and PDF certificates',
      category: 'tool',
      badge: '12 Courses',
      icon: GraduationCap,
      targetPage: 'courses',
    },
    {
      id: 'tool-linkedin',
      title: 'LinkedIn Persona Optimizer',
      description: 'High-converting headlines, About bios, experience bullets and recruiter search keywords',
      category: 'tool',
      badge: 'Recruiter SEO',
      icon: Linkedin,
      targetPage: 'linkedin',
    },
    {
      id: 'tool-portfolio',
      title: 'Portfolio Website Builder',
      description: 'Build and deploy a public portfolio with 3 themes, live preview, and HTML export',
      category: 'tool',
      badge: '3 Themes',
      icon: Globe,
      targetPage: 'portfolio',
    },
    {
      id: 'tool-settings',
      title: 'Account & Billing Settings',
      description: 'Manage profile details, subscription plan in ₹, and support tickets',
      category: 'tool',
      badge: 'Settings',
      icon: Settings,
      targetPage: 'settings',
    },
  ];

  const coursesData: SearchResultItem[] = sample12Courses.map((c: DetailedCourse) => ({
    id: `course-${c.id}`,
    title: c.title,
    description: `${c.category} • ${c.instructor} • ${c.duration_hours}h • Rating ${c.rating}★`,
    category: 'course',
    badge: c.badge,
    icon: GraduationCap,
    targetPage: 'courses',
    targetDetailId: c.id,
  }));

  const jobsData: SearchResultItem[] = [
    {
      id: 'job-1',
      title: 'Senior AI Application Engineer',
      description: 'Razorpay • Bengaluru (Hybrid) • ₹28,00,000 - ₹42,00,000 • LLM Orchestration, Python',
      category: 'job',
      badge: '94% Match (A)',
      icon: Briefcase,
      targetPage: 'jobs',
      targetDetailId: 'job-1',
    },
    {
      id: 'job-2',
      title: 'Autonomous Agents Research Intern',
      description: 'Sarvam AI Labs • Bengaluru / Remote • ₹9,00,000 - ₹14,00,000 • PyTorch, Multi-Agent',
      category: 'job',
      badge: '91% Match (A)',
      icon: Briefcase,
      targetPage: 'jobs',
      targetDetailId: 'job-2',
    },
    {
      id: 'job-3',
      title: 'Enterprise AI Solutions Architect',
      description: 'Databricks India • Bengaluru • ₹35,00,000 - ₹52,00,000 • RAG, Vector DB, Kubernetes',
      category: 'job',
      badge: '82% Match (B)',
      icon: Briefcase,
      targetPage: 'jobs',
      targetDetailId: 'job-3',
    },
    {
      id: 'job-4',
      title: 'Full Stack Product Engineer',
      description: 'Postman • Bengaluru / Remote • ₹24,00,000 - ₹36,00,000 • TypeScript, Node.js, APIs',
      category: 'job',
      badge: '96% Match (A)',
      icon: Briefcase,
      targetPage: 'jobs',
      targetDetailId: 'job-4',
    },
    {
      id: 'job-5',
      title: 'Quantitative Data Analytics Engineer',
      description: 'Zerodha Tech • Bengaluru • ₹26,00,000 - ₹40,00,000 • Python, SQL, ClickHouse',
      category: 'job',
      badge: '78% Match (C)',
      icon: Briefcase,
      targetPage: 'jobs',
      targetDetailId: 'job-5',
    },
  ];

  const roadmapsData: SearchResultItem[] = [
    {
      id: 'roadmap-genai',
      title: 'Generative AI & Agent Architect Roadmap',
      description: 'Transformers, LangChain, Multi-Agent Swarms, Fine-Tuning & Evaluation',
      category: 'roadmap',
      badge: 'Trending',
      icon: Milestone,
      targetPage: 'roadmap',
    },
    {
      id: 'roadmap-enterprise',
      title: 'Enterprise AI Systems Architect Roadmap',
      description: 'Vector databases, RAG at scale, ML governance, cloud infrastructure',
      category: 'roadmap',
      badge: 'High Demand',
      icon: Milestone,
      targetPage: 'roadmap',
    },
    {
      id: 'roadmap-fullstack',
      title: 'Full Stack Product Engineer Roadmap',
      description: 'TypeScript, Node.js, Distributed Databases, Low-latency APIs',
      category: 'roadmap',
      badge: 'Core Track',
      icon: Milestone,
      targetPage: 'roadmap',
    },
    {
      id: 'roadmap-fintech',
      title: 'FinTech & Quantitative Engineer Roadmap',
      description: 'Algorithmic trading pipelines, risk modeling, low latency systems',
      category: 'roadmap',
      badge: 'Top Package',
      icon: Milestone,
      targetPage: 'roadmap',
    },
  ];

  const allItems = [...toolsData, ...coursesData, ...jobsData, ...roadmapsData];

  const filteredItems = allItems.filter((item) => {
    if (selectedFilter !== 'all' && item.category !== selectedFilter) return false;
    if (!query.trim()) return true;

    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q))
    );
  });

  const handleSelect = (item: SearchResultItem) => {
    if (item.targetPage) {
      onNavigate(item.targetPage, item.targetDetailId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-purple-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#6C3CE1] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across courses, jobs, roadmaps, tools, and skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        <div className="px-4 py-2.5 bg-[#FAF8FF] border-b border-purple-50 flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'tool', label: 'Platform Tools' },
            { id: 'course', label: 'Courses' },
            { id: 'job', label: 'Jobs & Internships' },
            { id: 'roadmap', label: 'Career Roadmaps' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
                selectedFilter === tab.id
                  ? 'bg-[#6C3CE1] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-purple-100 hover:bg-purple-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-purple-50/50">
          {filteredItems.slice(0, 15).map((item) => {
            const IconComponent = item.icon || Sparkles;
            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="group flex items-center justify-between p-3 rounded-2xl hover:bg-[#F8F6FE] cursor-pointer transition-all border border-transparent hover:border-purple-100"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F0FF] text-[#6C3CE1] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#6C3CE1] truncate transition-colors">
                        {item.title}
                      </h4>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#6C3CE1] shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-[#6C3CE1] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <span className="text-xs font-semibold mr-1 hidden sm:inline">Go</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center py-12 px-4 space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                No matching results found for "{query}"
              </p>
              <p className="text-xs text-slate-400">
                Try searching for keywords like "Generative AI", "ATS Resume", "Full Stack", or "Python".
              </p>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-purple-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↵</span>
            to select
          </span>
          <span className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">esc</span>
            to close
          </span>
          <span className="hidden sm:inline text-purple-700 font-semibold">CareerWave Command</span>
        </div>
      </div>
    </div>
  );
};
