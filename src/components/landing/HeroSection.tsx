import React, { useState, useRef } from 'react';
import {
  Upload,
  Search,
  CheckCircle2,
  Star,
  Award,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { DashboardPageId } from '../dashboard/DashboardShell';

interface HeroSectionProps {
  onNavigateToDashboard: (page?: DashboardPageId) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigateToDashboard,
}) => {
  const [roleInput, setRoleInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateToDashboard('jobs');
  };

  const learnerAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F8F5FF] via-[#FDFBFF] to-white pt-10 pb-20 lg:pt-16 lg:pb-24">
      {/* Decorative Soft Lavender Orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#6C3CE1]/8 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-0 h-96 w-96 rounded-full bg-[#FF6B8B]/8 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Subtitle, Resume Upload + Search Box, 50K+ Learners */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Playfair Heading */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[64px] font-bold tracking-tight text-slate-900 leading-[1.08]">
              Tailor. Apply. <br />
              <span className="text-[#6C3CE1] relative inline-block">
                Succeed.
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-[#FF6B8B]/40"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <path
                    d="M2 9.5C52 2.5 148 2.5 198 9.5"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal">
              Upload your resume once and let CareerWave tailor it for every job description,
              match you with verified internships & full-time roles, and prepare you with
              live spoken mock interviews.
            </p>

            {/* Combined Resume Upload + Job Search Box */}
            <form
              onSubmit={handleHeroSearch}
              className="rounded-2xl bg-white p-2.5 shadow-[0_14px_40px_-10px_rgba(108,60,225,0.14)] border border-[#E6DCFF] max-w-2xl"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Resume Upload Trigger */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                    uploadedFileName
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-[#E6DCFF] bg-[#F5F0FF] text-[#6C3CE1] hover:bg-[#EDE3FF]'
                  }`}
                >
                  {uploadedFileName ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[140px]">{uploadedFileName}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 shrink-0" />
                      <span>Upload Resume (PDF)</span>
                    </>
                  )}
                </button>

                {/* Divider on desktop */}
                <div className="hidden sm:block h-7 w-px bg-slate-200" />

                {/* Target Role Search Input */}
                <div className="relative flex-1 flex items-center">
                  <Search className="left-3 absolute h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    placeholder="Target role (e.g. GenAI Engineer, Data Analyst)..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>

                {/* Solid Purple Search Button */}
                <button
                  type="submit"
                  className="rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] text-white font-semibold px-6 py-3 text-sm shadow-md shadow-[#6C3CE1]/25 transition-all cursor-pointer shrink-0"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick Action Pills + 50K+ Learner Avatar Stack */}
            <div className="flex flex-wrap items-center justify-between gap-6 pt-2 max-w-2xl">
              {/* Learner Avatar Stack */}
              <div className="flex items-center gap-3.5">
                <div className="flex -space-x-2.5">
                  {learnerAvatars.map((src, index) => (
                    <img
                      key={index}
                      src={src}
                      alt={`Learner ${index + 1}`}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-slate-900">50K+ learners</span>
                    <div className="flex items-center text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Landed interviews at top technology enterprises
                  </p>
                </div>
              </div>

              {/* Secondary Outline Button */}
              <button
                onClick={() => onNavigateToDashboard('resume')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#6C3CE1]/30 bg-white px-4 py-2.5 text-xs font-semibold text-[#6C3CE1] hover:bg-[#F5F0FF] transition-all cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                Build ATS Resume
              </button>
            </div>
          </div>

          {/* Right Column: Hero Student Image with Two Floating Glass Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Soft Purple Backdrop Card */}
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-tr from-[#6C3CE1]/20 via-[#EDE5FF] to-[#FF6B8B]/20 -z-10" />

              <div className="relative overflow-hidden rounded-3xl border-2 border-white shadow-[0_24px_60px_-15px_rgba(108,60,225,0.22)] bg-[#F5F0FF]">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&auto=format&fit=crop&q=85"
                  alt="Smiling student succeeding with CareerWave"
                  className="w-full h-[430px] sm:h-[470px] object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E103C]/45 via-transparent to-transparent" />
              </div>

              {/* Floating Glass Card 1: Top Mentor (Top-Left) */}
              <div className="animate-float-slow absolute -top-5 -left-4 sm:-left-8 z-20 rounded-2xl bg-white/85 backdrop-blur-md p-3.5 shadow-[0_12px_32px_-8px_rgba(108,60,225,0.22)] border border-white/90 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-200/60">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Top Mentor</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      4.9 ★
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">1-on-1 Career & Voice Coaching</p>
                </div>
              </div>

              {/* Floating Glass Card 2: Job Match 92% (Bottom-Right) */}
              <div className="animate-float-delayed absolute -bottom-5 -right-3 sm:-right-6 z-20 rounded-2xl bg-white/90 backdrop-blur-md p-4 shadow-[0_12px_32px_-8px_rgba(108,60,225,0.25)] border border-white/90 w-60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Job Match 92%</p>
                      <p className="text-[10px] text-slate-500">AI Engineer • ₹28,00,000/yr</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Ready
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6C3CE1] to-emerald-500"
                    style={{ width: '92%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
