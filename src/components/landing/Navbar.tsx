import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  LogOut,
  LayoutDashboard,
  Shield,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardPageId } from '../dashboard/DashboardShell';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onNavigateToDashboard: (page?: DashboardPageId) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onNavigateToDashboard,
  searchQuery,
  onSearchChange,
}) => {
  const { user, profile, role, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Jobs', href: '#tracks', action: () => onNavigateToDashboard('jobs') },
    { label: 'Roadmaps', href: '#features', action: () => onNavigateToDashboard('roadmap') },
    { label: 'Templates', href: '#features', action: () => onNavigateToDashboard('resume') },
    { label: 'Pricing', href: '#pricing' },
  ];

  const handleSignOut = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#EDE5FF]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20 gap-4">
        {/* Brand Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
        >
          <img
            src="/assets/aistudio/CareerWaves_CWS_Growth_Logo_2a4e39b3.png"
            alt="CareerWave Logo"
            className="h-12 w-auto object-contain group-hover:scale-[1.02] transition-transform"
          />
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (item.action) {
                  e.preventDefault();
                  item.action();
                }
              }}
              className="text-sm font-medium text-slate-600 hover:text-[#6C3CE1] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Search Bar */}
        <div className="hidden md:flex relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tools, templates, tracks..."
            className="w-full rounded-full border border-[#E6DCFF] bg-[#FAF8FF] pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#6C3CE1] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Right Controls: User Avatar or Auth Buttons */}
        <div className="flex items-center gap-3">
          {user && profile ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-full border border-[#E5DAFF] bg-[#FAF7FF] pl-1.5 pr-3 py-1 hover:border-[#6C3CE1] transition-all cursor-pointer"
              >
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-[#6C3CE1]/20"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {profile.full_name}
                  </p>
                  <p className="text-[10px] font-medium text-[#6C3CE1]">
                    {role === 'admin' ? 'Administrator' : `${profile.plan || 'Free'} Member`}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white p-2 shadow-xl border border-[#EDE5FF] z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {profile.full_name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{profile.email}</p>
                  </div>

                  {role === 'admin' ? (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigateToDashboard('admin');
                      }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-[#F5F0FF] hover:text-[#6C3CE1] transition-colors cursor-pointer"
                    >
                      <Shield className="h-4 w-4 text-amber-500" />
                      Admin Panel
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigateToDashboard('overview');
                      }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-[#F5F0FF] hover:text-[#6C3CE1] transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="h-4 w-4 text-[#6C3CE1]" />
                      Open Dashboard
                    </button>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors mt-1 border-t border-slate-100 pt-2 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="rounded-xl border border-[#6C3CE1]/30 bg-white px-4 py-2 text-xs font-semibold text-[#6C3CE1] hover:bg-[#F5F0FF] transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="rounded-xl bg-[#6C3CE1] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#6C3CE1]/25 hover:bg-[#5829C7] transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-xl p-2 text-slate-600 hover:bg-[#F5F0FF] hover:text-[#6C3CE1]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#EDE5FF] bg-white px-4 py-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tools, templates, tracks..."
              className="w-full rounded-xl border border-[#E6DCFF] bg-[#FAF8FF] pl-10 pr-4 py-2.5 text-xs text-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (item.action) {
                    e.preventDefault();
                    item.action();
                  }
                }}
                className="rounded-xl bg-[#FAF8FF] px-3 py-2 text-xs font-medium text-slate-700 hover:bg-[#F5F0FF] hover:text-[#6C3CE1]"
              >
                {item.label}
              </a>
            ))}
          </div>
          {user ? (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToDashboard('overview');
                }}
                className="w-full rounded-xl bg-[#6C3CE1] py-2.5 text-xs font-semibold text-white shadow-md"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-semibold text-rose-700"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth('login');
              }}
              className="w-full rounded-xl bg-[#6C3CE1] py-2.5 text-xs font-semibold text-white shadow-md"
            >
              Sign In with Email OTP
            </button>
          )}
        </div>
      )}
    </header>
  );
};
