import React from 'react';
import { FileCheck, SearchCheck, Mic, Milestone, ArrowRight } from 'lucide-react';

interface FourIconStripProps {
  onNavigateDashboard: (page: string) => void;
}

export const FourIconStrip: React.FC<FourIconStripProps> = ({ onNavigateDashboard }) => {
  const items = [
    {
      id: 'resume',
      title: 'ATS Resume',
      subtitle: '95%+ scan pass rate',
      badge: 'Smart Tailor',
      icon: FileCheck,
      color: '#6C3CE1',
      bgColor: '#F4F0FF',
    },
    {
      id: 'jobs',
      title: 'Job Finder',
      subtitle: 'AI role match & alerts',
      badge: '1.4k Daily',
      icon: SearchCheck,
      color: '#FF5B79',
      bgColor: '#FFF0F2',
    },
    {
      id: 'interview',
      title: 'Interview Prep',
      subtitle: 'Simulated STAR scoring',
      badge: 'Real-time AI',
      icon: Mic,
      color: '#FFB547',
      bgColor: '#FFF7EB',
    },
    {
      id: 'roadmap',
      title: 'Career Roadmap',
      subtitle: 'Curated skill milestones',
      badge: '18 Tracks',
      icon: Milestone,
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
  ];

  return (
    <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-16">
      <div className="bg-white rounded-3xl shadow-soft-lg border border-purple-100/80 p-4 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onNavigateDashboard(item.id)}
              className="group p-4 rounded-2xl bg-white hover:bg-[#FAF8FF] border border-transparent hover:border-purple-200 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 shadow-xs hover:shadow-md hover:-translate-y-0.5"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-inner"
                style={{ backgroundColor: item.bgColor, color: item.color }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-between gap-1 mb-1">
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#6C3CE1] transition-colors truncate">
                    {item.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                <div className="mt-2 flex items-center justify-center sm:justify-start gap-1 text-[11px] font-semibold text-[#6C3CE1]">
                  <span>Launch Tool</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
