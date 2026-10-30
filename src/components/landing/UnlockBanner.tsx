import React from 'react';
import { ArrowRight } from 'lucide-react';

interface UnlockBannerProps {
  onGetStarted: () => void;
}

export const UnlockBanner: React.FC<UnlockBannerProps> = ({
  onGetStarted,
}) => {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5829C7] via-[#6C3CE1] to-[#8B5CF6] px-6 py-12 sm:px-12 sm:py-16 shadow-[0_24px_60px_-15px_rgba(108,60,225,0.4)]">
          {/* Decorative background circles */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#FF6B8B]/20 blur-2xl" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center lg:text-left max-w-2xl">
              <span className="inline-block rounded-full bg-white/15 backdrop-blur-sm px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white border border-white/20">
                Accelerate Your Career Trajectory
              </span>

              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
                Unlock your potential
              </h2>

              <p className="text-sm sm:text-base text-[#EDE5FF] max-w-xl leading-relaxed mx-auto lg:mx-0">
                Join students and professionals using CareerWave to tailor ATS-ready resumes,
                track applications, and practice live spoken interviews for top roles.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3.5 shrink-0">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-bold text-[#6C3CE1] shadow-lg hover:bg-[#FAF7FF] transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
