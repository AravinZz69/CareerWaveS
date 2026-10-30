import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, PlanName } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';

interface PricingSectionProps {
  onNavigateToDashboard?: (page: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onNavigateToDashboard,
}) => {
  const { user, plan: currentPlan, plans, checkoutPlan } = useAuth();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loadingPlan, setLoadingPlan] = useState<PlanName | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fallbackPlans = [
    {
      id: 'plan_free',
      name: 'Free' as PlanName,
      price_monthly: 0,
      price_yearly: 0,
      description: 'Essential career tools for students and professionals exploring internships and full-time roles.',
      feature_limits: {
        resume_tailoring: 2,
        ai_job_match: 5,
        mock_interview: 2,
        linkedin_generation: 1,
        portfolio_generation: 1,
      },
    },
    {
      id: 'plan_pro',
      name: 'Pro' as PlanName,
      price_monthly: 1499,
      price_yearly: 14990,
      badge: 'Most Popular',
      description: 'High-volume ATS tailoring, application kits, and live spoken mock interviews for active job seekers.',
      feature_limits: {
        resume_tailoring: 25,
        ai_job_match: 60,
        mock_interview: 15,
        linkedin_generation: 10,
        portfolio_generation: 5,
      },
    },
    {
      id: 'plan_premium',
      name: 'Premium' as PlanName,
      price_monthly: 3999,
      price_yearly: 39990,
      badge: 'Bestseller',
      description: 'Maximum monthly velocity, deep architectural mock interviews, and custom portfolio publishing.',
      feature_limits: {
        resume_tailoring: 200,
        ai_job_match: 500,
        mock_interview: 100,
        linkedin_generation: 50,
        portfolio_generation: 25,
      },
    },
  ];

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  const handleSelectPlan = async (planName: PlanName) => {
    if (!user) {
      onNavigateToDashboard?.('overview');
      return;
    }
    if (planName === currentPlan) {
      onNavigateToDashboard?.('settings');
      return;
    }
    setLoadingPlan(planName);
    const ok = await checkoutPlan(planName, interval);
    setLoadingPlan(null);
    if (ok) {
      setToastMsg(`Successfully upgraded to ${planName} (${interval === 'year' ? 'Annual' : 'Monthly'})!`);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-white via-[#FAF8FF] to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F3ECFF] px-4 py-1.5 text-xs font-semibold text-[#6C3CE1] mb-3 border border-[#E2D4FF]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Transparent Indian Rupee Pricing</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight">
            Invest in your career trajectory
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Start free and upgrade anytime as you scale your applications, resume tailorings, and spoken voice interviews.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-7 inline-flex items-center rounded-2xl bg-[#F5F0FF] p-1.5 border border-[#E5DAFF]">
            <button
              onClick={() => setInterval('month')}
              className={`rounded-xl px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                interval === 'month'
                  ? 'bg-[#6C3CE1] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#6C3CE1]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`rounded-xl px-5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                interval === 'year'
                  ? 'bg-[#6C3CE1] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#6C3CE1]'
              }`}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                2 Months Free
              </span>
            </button>
          </div>
        </div>

        {toastMsg && (
          <div className="max-w-md mx-auto mb-8 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center text-xs font-semibold text-emerald-800 shadow-sm">
            {toastMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {displayPlans.map((p) => {
            const isPro = p.name === 'Pro';
            const isPremium = p.name === 'Premium';
            const isCurrent = Boolean(user && currentPlan === p.name);
            const price = interval === 'year' ? p.price_yearly : p.price_monthly;

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl bg-white p-7 flex flex-col justify-between transition-all ${
                  isPro
                    ? 'border-2 border-[#6C3CE1] shadow-[0_24px_50px_-12px_rgba(108,60,225,0.22)] md:-translate-y-2'
                    : 'border border-[#EDE5FF] shadow-[0_10px_30px_-12px_rgba(108,60,225,0.08)]'
                }`}
              >
                {p.badge && (
                  <span
                    className={`absolute -top-3.5 right-6 rounded-full px-3.5 py-1 text-[11px] font-bold shadow-sm ${
                      isPro
                        ? 'bg-[#6C3CE1] text-white'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {p.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isPremium
                          ? 'bg-amber-50 text-amber-600'
                          : isPro
                          ? 'bg-[#F5F0FF] text-[#6C3CE1]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isPremium ? (
                        <Crown className="h-5 w-5" />
                      ) : isPro ? (
                        <Zap className="h-5 w-5" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-slate-900">{p.name}</h3>
                      <span className="text-[11px] text-slate-400">
                        {p.name === 'Free' ? 'Starter Tier' : `${interval === 'year' ? 'Billed Yearly' : 'Billed Monthly'}`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 min-h-[36px] mb-5">{p.description}</p>

                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="font-serif text-4xl font-bold text-slate-900">
                        {formatINR(price)}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        /{interval === 'year' ? 'year' : 'month'}
                      </span>
                    </div>
                    {interval === 'year' && price > 0 && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                        Equivalent to {formatINR(Math.round(price / 12))}/month
                      </p>
                    )}
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Monthly Included Quotas
                  </p>
                  <ul className="space-y-3 text-xs text-slate-700 mb-8">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#6C3CE1] shrink-0" />
                      <span>
                        <strong>{p.feature_limits.resume_tailoring}</strong> ATS Resume Tailorings / mo
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#6C3CE1] shrink-0" />
                      <span>
                        <strong>{p.feature_limits.ai_job_match}</strong> Job Match & Application Kits / mo
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#6C3CE1] shrink-0" />
                      <span>
                        <strong>{p.feature_limits.mock_interview}</strong> Spoken Voice Mock Interviews / mo
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#6C3CE1] shrink-0" />
                      <span>
                        <strong>{p.feature_limits.linkedin_generation}</strong> LinkedIn Profile Optimizations / mo
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#6C3CE1] shrink-0" />
                      <span>
                        <strong>{p.feature_limits.portfolio_generation}</strong> Public Portfolio Deployments / mo
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(p.name)}
                  disabled={loadingPlan === p.name}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-5 text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isPro
                      ? 'bg-[#6C3CE1] text-white hover:bg-[#5829C7] shadow-lg shadow-[#6C3CE1]/25'
                      : 'border border-[#6C3CE1]/30 bg-white text-[#6C3CE1] hover:bg-[#F5F0FF]'
                  }`}
                >
                  <span>
                    {loadingPlan === p.name
                      ? 'Processing...'
                      : isCurrent
                      ? 'Current Active Plan'
                      : p.name === 'Free'
                      ? 'Get Started Free'
                      : `Choose ${p.name}`}
                  </span>
                  {!isCurrent && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-[#6C3CE1]" />
          <span>Instant plan activation • Cancel or switch billing intervals anytime in Settings</span>
        </div>
      </div>
    </section>
  );
};
