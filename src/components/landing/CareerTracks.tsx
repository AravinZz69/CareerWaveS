import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Sparkles, Cpu, BarChart3, TrendingUp, Cloud, Code2, ArrowUpRight } from 'lucide-react';
import { careerTracks } from '../../data/mockData';

interface CareerTracksProps {
  onNavigateDashboard: (page: string) => void;
}

const iconComponentMap: Record<string, any> = {
  Sparkles,
  Cpu,
  BarChart3,
  TrendingUp,
  Cloud,
  Code2,
};

export const CareerTracks: React.FC<CareerTracksProps> = ({ onNavigateDashboard }) => {
  return (
    <section id="tracks" className="py-16 bg-[#FAF8FF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F4F0FF] text-[#6C3CE1] text-xs font-semibold mb-3 border border-purple-200">
            <span>Specialized Pathways</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif-heading font-extrabold text-slate-900">
            Browse High-Impact Career Tracks
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Target high-growth modern domains with role requirements, dynamic roadmaps, and verified salary benchmarks.
          </p>
        </div>

        {/* 6 Career Track Icon Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {careerTracks.map((track) => {
            const Icon = iconComponentMap[track.icon] || Sparkles;

            return (
              <div
                key={track.id}
                onClick={() => onNavigateDashboard('roadmap')}
                className="bg-white rounded-3xl p-6 border border-purple-100 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top row with icon & tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-13 h-13 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-inner"
                      style={{ backgroundColor: track.bgColor, color: track.color }}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <Badge variant="purple" size="sm" className="font-semibold">
                      {track.tag}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#6C3CE1] transition-colors mb-2">
                    {track.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
                    {track.description}
                  </p>
                </div>

                {/* Bottom stats row */}
                <div className="pt-4 border-t border-purple-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Demand</span>
                    <span className="font-bold text-slate-800">{track.openRoles}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Avg. Target Base</span>
                    <span className="font-bold text-[#10B981]">{track.avgSalary}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F4F0FF] group-hover:bg-[#6C3CE1] group-hover:text-white text-[#6C3CE1] flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
