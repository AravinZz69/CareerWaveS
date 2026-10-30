import React from 'react';
import { Home, BookOpen, Briefcase, User } from 'lucide-react';

interface MobileTabBarProps {
  currentTab: 'home' | 'learning' | 'jobs' | 'profile';
  onSelectTab: (tab: 'home' | 'learning' | 'jobs' | 'profile') => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learning', label: 'My Learning', icon: BookOpen },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-[0_-4px_20px_rgba(108,60,225,0.08)] py-1.5 px-3">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-[#6C3CE1] font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-[#F4F0FF]' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
