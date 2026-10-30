import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Star, ArrowRight, FileCheck, SearchCheck, Mic, Milestone, LayoutTemplate, Share2 } from 'lucide-react';
import { featuredTools } from '../../data/mockData';

interface FeaturedToolsProps {
  onNavigateDashboard: (page: string) => void;
}

const iconMap: Record<string, any> = {
  FileCheck,
  SearchCheck,
  Mic,
  Milestone,
  LayoutTemplate,
  Share2,
};

export const FeaturedTools: React.FC<FeaturedToolsProps> = ({ onNavigateDashboard }) => {
  return (
    <section id="features" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F0FF] text-[#6C3CE1] text-xs font-semibold mb-3">
              <span>Intelligent Career Arsenal</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif-heading font-extrabold text-slate-900">
              Featured Career Acceleration Tools
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl">
              Each module is engineered to give candidates an asymmetric advantage during resume screening, technical assessments, and salary negotiations.
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigateDashboard('overview')}
            className="self-start md:self-auto shrink-0 text-xs font-semibold"
          >
            Explore All 12 Tools <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Course-Style Tool Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredTools.map((tool) => {
            const IconComponent = iconMap[tool.icon] || FileCheck;
            
            // Map badge to badge variant
            let badgeVariant: 'bestseller' | 'popular' | 'trending' | 'green' = 'popular';
            if (tool.badge === 'Bestseller') badgeVariant = 'bestseller';
            else if (tool.badge === 'Popular') badgeVariant = 'popular';
            else if (tool.badge === 'Trending') badgeVariant = 'trending';
            else if (tool.badge === 'Highest Rated') badgeVariant = 'green';

            return (
              <Card
                key={tool.id}
                hover={true}
                className="flex flex-col h-full bg-white border border-purple-100 rounded-3xl overflow-hidden p-6 relative group"
              >
                {/* Top Row: Icon & Pill Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F4F0FF] group-hover:bg-[#6C3CE1] group-hover:text-white text-[#6C3CE1] flex items-center justify-center transition-all duration-300 shadow-inner">
                    <IconComponent className="w-6 h-6 transition-transform group-hover:scale-110" />
                  </div>
                  <Badge variant={badgeVariant} size="sm">
                    {tool.badge}
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#6C3CE1] transition-colors line-clamp-1 mb-2">
                  {tool.title}
                </h3>

                {/* Rating & Review Counts */}
                <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                    <span>{tool.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{tool.reviews} active users</span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed flex-1 mb-5">
                  {tool.description}
                </p>

                {/* Footer Metric and Action Button */}
                <div className="pt-4 border-t border-purple-50 flex items-center justify-between mt-auto">
                  <span className="text-xs font-bold text-[#6C3CE1] bg-[#F8F6FE] px-2.5 py-1 rounded-lg">
                    {tool.stats}
                  </span>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigateDashboard(tool.route)}
                    className="text-xs font-semibold rounded-xl"
                  >
                    Launch Now <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
};
