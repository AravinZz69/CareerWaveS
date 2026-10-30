import React, { useState } from 'react';
import { X, Zap, Crown, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth, PlanName } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerFeature?: string | null;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  triggerFeature,
}) => {
  const { plan: currentPlan, plans, checkoutPlan } = useAuth();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loadingPlan, setLoadingPlan] = useState<PlanName | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const featureName = triggerFeature
    ? triggerFeature.replace(/_/g, ' ')
    : 'monthly feature';

  const handleUpgrade = async (targetPlan: PlanName) => {
    setLoadingPlan(targetPlan);
    const ok = await checkoutPlan(targetPlan, interval);
    setLoadingPlan(null);
    if (ok) {
      setSuccessMsg(`Upgraded to ${targetPlan}! Your new monthly limits are now active.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    }
  };

  const paidPlans = (plans.length > 0 ? plans : []).filter(
    (p) => p.name === 'Pro' || p.name === 'Premium'
  );

  const displayPlans =
    paidPlans.length > 0
      ? paidPlans
      : [
          {
            id: 'plan_pro',
            name: 'Pro' as PlanName,
            price_monthly: 1499,
            price_yearly: 14990,
            description: 'Ideal for active applicants tailoring resumes and practicing interviews.',
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
            description: 'Maximum monthly quotas for intensive job searches and interview prep.',
            feature_limits: {
              resume_tailoring: 200,
              ai_job_match: 500,
              mock_interview: 100,
              linkedin_generation: 50,
              portfolio_generation: 25,
            },
          },
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181028]/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#EDE5FF] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-[#F5F0FF] hover:text-[#6C3CE1] cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {triggerFeature && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Monthly {featureName} limit reached on your {currentPlan} plan</span>
          </div>
        )}

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
          Upgrade your CareerWave Plan
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
          Unlock higher monthly quotas for ATS resume tailoring, job matching, and live spoken mock interviews.
        </p>

        {/* Interval Switch */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex rounded-xl bg-[#F5F0FF] p-1 border border-[#E5DAFF]">
            <button
              onClick={() => setInterval('month')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold cursor-pointer ${
                interval === 'month' ? 'bg-[#6C3CE1] text-white' : 'text-slate-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold cursor-pointer ${
                interval === 'year' ? 'bg-[#6C3CE1] text-white' : 'text-slate-600'
              }`}
            >
              Yearly (Save 16%)
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center text-xs font-bold text-emerald-800">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {displayPlans.map((p) => {
            const price = interval === 'year' ? p.price_yearly : p.price_monthly;
            const isPro = p.name === 'Pro';

            return (
              <div
                key={p.id}
                className={`rounded-2xl p-5 border flex flex-col justify-between ${
                  isPro ? 'border-2 border-[#6C3CE1] bg-[#FAF8FF]' : 'border-[#EDE5FF] bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif text-lg font-bold text-slate-900 flex items-center gap-1.5">
                      {isPro ? (
                        <Zap className="h-4 w-4 text-[#6C3CE1]" />
                      ) : (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                      {p.name}
                    </span>
                    {isPro && (
                      <span className="rounded-full bg-[#6C3CE1] px-2.5 py-0.5 text-[10px] font-bold text-white">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <span className="font-serif text-3xl font-bold text-slate-900">
                      {formatINR(price)}
                    </span>
                    <span className="text-xs text-slate-400">
                      /{interval === 'year' ? 'yr' : 'mo'}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#6C3CE1]" />
                      <span>{p.feature_limits.resume_tailoring} Resume Tailorings / mo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#6C3CE1]" />
                      <span>{p.feature_limits.ai_job_match} Job Matches & Kits / mo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#6C3CE1]" />
                      <span>{p.feature_limits.mock_interview} Voice Mock Interviews / mo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#6C3CE1]" />
                      <span>{p.feature_limits.linkedin_generation} LinkedIn Optimizations / mo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#6C3CE1]" />
                      <span>{p.feature_limits.portfolio_generation} Portfolio Generations / mo</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade(p.name)}
                  disabled={loadingPlan === p.name || currentPlan === p.name}
                  className="w-full rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] disabled:bg-slate-200 disabled:text-slate-500 text-white font-semibold py-2.5 text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {currentPlan === p.name
                      ? 'Current Plan'
                      : loadingPlan === p.name
                      ? 'Upgrading...'
                      : `Upgrade to ${p.name}`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
