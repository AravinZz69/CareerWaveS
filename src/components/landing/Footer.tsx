import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FooterProps {
  onNavigateToDashboard: (page: string) => void;
  onOpenLegal?: (tab: 'terms' | 'privacy' | 'refund') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateToDashboard,
  onOpenLegal,
}) => {
  const { role } = useAuth();

  return (
    <footer className="bg-[#FAF8FF] border-t border-[#EDE5FF] pt-14 pb-24 lg:pb-12 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#EDE5FF]">
          {/* Col 1-2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center">
              <img
                src="/assets/aistudio/CareerWaves_CWS_Growth_Logo_2a4e39b3.png"
                alt="CareerWave Logo"
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
              The complete career acceleration platform for students and professionals.
              Tailor ATS resumes, discover verified roles, and practice live spoken interviews.
            </p>
          </div>

          {/* Col 3: Platform */}
          <div>
            <h4 className="font-serif text-sm font-bold text-slate-900 mb-3.5">
              Platform Tools
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigateToDashboard('resume')}
                  className="hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  ATS Resume Builder
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToDashboard('jobs')}
                  className="hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  Job Match Engine
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToDashboard('interviews')}
                  className="hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  Voice Mock Interviewer
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToDashboard('roadmap')}
                  className="hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  Career Roadmaps
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToDashboard('portfolio')}
                  className="hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  Portfolio Generator
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Career Tracks */}
          <div>
            <h4 className="font-serif text-sm font-bold text-slate-900 mb-3.5">
              Career Tracks
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#tracks" className="hover:text-[#6C3CE1] transition-colors">
                  Enterprise AI
                </a>
              </li>
              <li>
                <a href="#tracks" className="hover:text-[#6C3CE1] transition-colors">
                  Generative AI
                </a>
              </li>
              <li>
                <a href="#tracks" className="hover:text-[#6C3CE1] transition-colors">
                  Data Analytics
                </a>
              </li>
              <li>
                <a href="#tracks" className="hover:text-[#6C3CE1] transition-colors">
                  FinTech Systems
                </a>
              </li>
              <li>
                <a href="#tracks" className="hover:text-[#6C3CE1] transition-colors">
                  Software Engineering
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Account & Legal */}
          <div>
            <h4 className="font-serif text-sm font-bold text-slate-900 mb-3.5">
              Account & Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigateToDashboard('overview')}
                  className="hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  Member Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToDashboard('settings')}
                  className="hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  Billing & Plans
                </button>
              </li>
              {role === 'admin' && (
                <li>
                  <button
                    onClick={() => onNavigateToDashboard('admin')}
                    className="hover:text-[#6C3CE1] transition-colors cursor-pointer font-semibold text-[#6C3CE1]"
                  >
                    Admin Panel
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => onOpenLegal?.('terms')}
                  className="hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal?.('privacy')}
                  className="hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal?.('refund')}
                  className="hover:text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  Refund Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CareerWave. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onOpenLegal?.('privacy')}
              className="hover:text-[#6C3CE1] cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenLegal?.('terms')}
              className="hover:text-[#6C3CE1] cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onOpenLegal?.('refund')}
              className="hover:text-[#6C3CE1] cursor-pointer"
            >
              Refund Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
