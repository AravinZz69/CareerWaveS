import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, RotateCcw } from 'lucide-react';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy' | 'refund';
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [tab, setTab] = useState<'terms' | 'privacy' | 'refund'>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181028]/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#EDE5FF] max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-[#F5F0FF] hover:text-[#6C3CE1] cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4">
          CareerWave Legal & Compliance
        </h2>

        <div className="flex gap-2 border-b border-slate-100 pb-3 mb-4">
          <button
            onClick={() => setTab('terms')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
              tab === 'terms'
                ? 'bg-[#6C3CE1] text-white'
                : 'bg-[#FAF8FF] text-slate-600 hover:text-[#6C3CE1]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Terms of Service
          </button>
          <button
            onClick={() => setTab('privacy')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
              tab === 'privacy'
                ? 'bg-[#6C3CE1] text-white'
                : 'bg-[#FAF8FF] text-slate-600 hover:text-[#6C3CE1]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Privacy Policy
          </button>
          <button
            onClick={() => setTab('refund')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
              tab === 'refund'
                ? 'bg-[#6C3CE1] text-white'
                : 'bg-[#FAF8FF] text-slate-600 hover:text-[#6C3CE1]'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refund Policy
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed pr-2">
          {tab === 'terms' && (
            <>
              <h3 className="font-serif text-base font-bold text-slate-900">
                1. Subscription Plans & Monthly Quotas
              </h3>
              <p>
                CareerWave offers three subscription tiers billed in Indian Rupees (INR): Free (₹0/month),
                Pro (₹1,499/month or ₹14,990/year), and Premium (₹3,999/month or ₹39,990/year). Each plan
                provides a monthly allocation of resume tailorings, job matches, spoken mock interviews,
                LinkedIn optimizations, and portfolio generations.
              </p>
              <h3 className="font-serif text-base font-bold text-slate-900">
                2. Account Access & Security
              </h3>
              <p>
                Accounts are authenticated exclusively via secure one-time email verification codes (OTP).
                You are responsible for maintaining the security of your email account. Each user can only
                access and modify their own personal career workspace.
              </p>
              <h3 className="font-serif text-base font-bold text-slate-900">
                3. Accuracy of Career Materials
              </h3>
              <p>
                Our resume tailoring tool rewrites existing bullets to align with target job descriptions
                without inventing credentials. Users are responsible for reviewing exported PDF and DOCX
                files prior to submission.
              </p>
            </>
          )}

          {tab === 'privacy' && (
            <>
              <h3 className="font-serif text-base font-bold text-slate-900">
                1. Data Isolation & Ownership
              </h3>
              <p>
                Your uploaded resumes, job applications, roadmaps, and spoken interview recordings are
                strictly isolated to your account. No other regular user can view or access your private
                career records.
              </p>
              <h3 className="font-serif text-base font-bold text-slate-900">
                2. Microphone & Voice Interview Privacy
              </h3>
              <p>
                During spoken mock interviews, microphone audio is used solely to transcribe your answers
                and provide communication and technical feedback. Audio streams are never sold or shared
                with third-party marketers.
              </p>
              <h3 className="font-serif text-base font-bold text-slate-900">
                3. Data Portability
              </h3>
              <p>
                You can export your complete profile, resumes, and billing history in JSON or PDF format
                at any time from your account Settings.
              </p>
            </>
          )}

          {tab === 'refund' && (
            <>
              <h3 className="font-serif text-base font-bold text-slate-900">
                1. 7-Day Satisfaction Guarantee
              </h3>
              <p>
                If you upgrade to CareerWave Pro (₹1,499/mo) or Premium (₹3,999/mo) and are unsatisfied
                within the first 7 days of your billing cycle, contact Support from your Settings page
                for a full refund in Indian Rupees (₹) to your original payment method.
              </p>
              <h3 className="font-serif text-base font-bold text-slate-900">
                2. Cancellation Policy
              </h3>
              <p>
                You may switch plans or cancel renewal at any time without penalty. Your paid quotas
                remain active until the end of the current billing period.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
