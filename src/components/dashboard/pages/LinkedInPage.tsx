import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useAuth } from '../../../context/AuthContext';
import {
  Linkedin,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ResumeParsingOverlay,
  extractSkillsFromTextOrResume,
} from '../../resume/ResumeParsingOverlay';

interface HeadlineOption {
  id: string;
  style: string;
  text: string;
  whyItWorks: string;
}

interface BulletOption {
  original: string;
  optimized: string;
  metricImpact: string;
}

interface LinkedInOptimizationResult {
  profileScoreBefore: number;
  profileScoreAfter: number;
  headlines: HeadlineOption[];
  aboutSection: string;
  experienceBullets: BulletOption[];
  recruiterSearchKeywords: string[];
  profileTips: string[];
}

export const LinkedInPage: React.FC = () => {
  const { profile, workspace, saveUserLinkedIn } = useAuth();
  const [profileInput, setProfileInput] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [data, setData] = useState<LinkedInOptimizationResult | null>(workspace.linkedin || null);

  // Overlay states for LinkedIn Optimizer
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayMilestone, setOverlayMilestone] = useState(0);
  const [overlayFinished, setOverlayFinished] = useState(false);
  const [overlayError, setOverlayError] = useState<string | null>(null);
  const [overlaySkills, setOverlaySkills] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setData(workspace.linkedin || null);
  }, [workspace.linkedin]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUseResume = () => {
    const r = workspace.resume;
    if (r) {
      const skillsList = [
        ...(r.skills?.languages || []),
        ...(r.skills?.frameworks || []),
        ...(r.skills?.cloudAndDevOps || []),
        ...(r.skills?.aiAndData || []),
      ].join(', ');
      setProfileInput(
        `Candidate: ${r.contact?.fullName || profile?.full_name || ''}\nSummary: ${
          r.summary || ''
        }\nSkills: ${skillsList}`
      );
      showToast('Loaded profile details from your active resume.');
    } else if (profile) {
      setProfileInput(
        `Candidate: ${profile.full_name}\nTitle: ${profile.title || ''}\nBio: ${
          profile.bio || ''
        }`
      );
      showToast('Loaded details from your profile.');
    } else {
      showToast('Please upload a resume first or paste your profile text.');
    }
  };

  const handleCancelOptimization = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setOverlayOpen(false);
    setOverlayError(null);
    setOverlayFinished(false);
    setIsOptimizing(false);
  };

  const handleOptimize = async () => {
    if (!profileInput.trim()) {
      showToast('Please paste your current profile text or load from your resume.');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsOptimizing(true);
    setOverlayError(null);
    setOverlayFinished(false);
    setOverlaySkills(extractSkillsFromTextOrResume(profileInput, workspace.resume?.skills));
    setOverlayMilestone(18);
    setOverlayOpen(true);

    try {
      const stepTimer = window.setTimeout(() => {
        setOverlayMilestone(58);
      }, 450);

      const res = await fetch('/api/linkedin/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ profileText: profileInput }),
      });

      window.clearTimeout(stepTimer);
      setOverlayMilestone(84);

      const json = await res.json();
      if (res.status === 402 || json.limitReached) {
        setOverlayOpen(false);
        window.dispatchEvent(new CustomEvent('careerwave:quota-exceeded', { detail: json }));
        return;
      }
      if (json.success && json.data) {
        window.dispatchEvent(new CustomEvent('careerwave:usage-updated'));
        setData(json.data);
        if (
          Array.isArray(json.data.recruiterSearchKeywords) &&
          json.data.recruiterSearchKeywords.length > 0
        ) {
          setOverlaySkills(json.data.recruiterSearchKeywords.slice(0, 10));
        }
        await saveUserLinkedIn(json.data);
        setOverlayMilestone(100);
        setOverlayFinished(true);
      } else {
        setOverlayError(json.error || 'Could not optimize LinkedIn profile. Please try again.');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
      setOverlayError('Optimization failed. Please check your connection and try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ResumeParsingOverlay
        isOpen={overlayOpen}
        mode="linkedin"
        targetMilestone={overlayMilestone}
        isFinished={overlayFinished}
        detectedSkills={overlaySkills}
        documentTitle={profile?.full_name || 'LinkedIn Profile'}
        errorMessage={overlayError}
        onCancel={handleCancelOptimization}
        onRetry={() => {
          setOverlayError(null);
          handleOptimize();
        }}
        onCompleteExit={() => {
          setOverlayOpen(false);
          setOverlayFinished(false);
          showToast('LinkedIn profile optimized and saved!');
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0077B5', '#6C3CE1', '#10B981'],
          });
        }}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-200 border border-purple-400/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-heading text-slate-900">
            LinkedIn Persona & SEO Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate recruiter-ready headlines, About summaries, quantified experience bullets, and search keywords.
          </p>
        </div>

        {data && (
          <div className="flex items-center gap-4 bg-[#FAF8FF] p-3.5 rounded-2xl border border-purple-100 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Recruiter Visibility Score
              </span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-sm font-semibold text-slate-400 line-through">
                  {data.profileScoreBefore}%
                </span>
                <span className="text-lg font-black text-emerald-600">
                  → {data.profileScoreAfter}%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-xs">
              +{Math.max(5, data.profileScoreAfter - data.profileScoreBefore)}%
            </div>
          </div>
        )}
      </div>

      {/* Input Box: Paste text or use active resume */}
      <Card className="p-6 bg-white border border-purple-100 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">
            Current Profile Summary, Headline, or Bio Notes:
          </label>
          <button
            type="button"
            onClick={handleUseResume}
            className="text-xs font-bold text-[#6C3CE1] hover:underline flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> Auto-Fill from Active Resume
          </button>
        </div>

        <textarea
          rows={3}
          value={profileInput}
          onChange={(e) => setProfileInput(e.target.value)}
          placeholder="Paste your existing LinkedIn headline, About section, or click 'Auto-Fill from Active Resume'..."
          className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:border-[#6C3CE1] leading-relaxed"
        />

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleOptimize}
            isLoading={isOptimizing}
            className="text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" /> Optimize Profile with AI
          </Button>
        </div>
      </Card>

      {!data ? (
        <Card className="p-10 bg-white border border-purple-100 shadow-soft text-center max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0077B5]/10 text-[#0077B5] flex items-center justify-center mx-auto">
            <Linkedin className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold font-serif-heading text-slate-900">
            Ready to Optimize Your LinkedIn Profile
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Paste your current LinkedIn text above or auto-fill from your active resume, then click Optimize Profile to receive tailored headlines, an About summary, and recruiter search keywords.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Headlines & About */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 bg-white border border-purple-100 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6C3CE1]" />
                Rewritten Headlines
              </h3>

              <div className="space-y-3">
                {data.headlines.map((hl) => (
                  <div
                    key={hl.id}
                    className="p-4 rounded-2xl bg-[#FAF8FF] border border-purple-100 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#6C3CE1]">{hl.style}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(hl.text, hl.id)}
                        className="text-[11px] h-7"
                      >
                        {copiedKey === hl.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {copiedKey === hl.id ? 'Copied' : 'Copy'}
                      </Button>
                    </div>

                    <p className="font-semibold text-slate-800 leading-snug">{hl.text}</p>
                    <p className="text-[11px] text-slate-500 italic">
                      Why it works: {hl.whyItWorks}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white border border-purple-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-50">
                <h3 className="font-bold text-slate-900 text-sm">High-Impact 'About' Summary</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(data.aboutSection, 'about')}
                  className="text-xs"
                >
                  {copiedKey === 'about' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedKey === 'about' ? 'Copied' : 'Copy About'}
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-purple-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-sans">
                {data.aboutSection}
              </div>
            </Card>
          </div>

          {/* Right Column (5 cols): Quantified Bullets, Recruiter Keywords, Tips */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 bg-white border border-purple-100 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-50">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Recruiter SEO Keywords
                </h4>
                <button
                  onClick={() => handleCopy(data.recruiterSearchKeywords.join(', '), 'all-kw')}
                  className="text-[11px] font-bold text-[#6C3CE1] hover:underline"
                >
                  Copy all
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Add these terms to your Skills section and experience descriptions:
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {data.recruiterSearchKeywords.map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => handleCopy(kw, `kw-${i}`)}
                    className="px-2.5 py-1 rounded-xl bg-[#F8F6FE] hover:bg-purple-100 border border-purple-100 text-[#6C3CE1] text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>{kw}</span>
                    {copiedKey === `kw-${i}` ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-purple-400" />
                    )}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white border border-purple-100 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Quantified Experience Bullets
              </h4>

              <div className="space-y-3">
                {data.experienceBullets.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#FAF8FF] rounded-xl border border-purple-100 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {b.metricImpact}
                      </span>
                      <button
                        onClick={() => handleCopy(b.optimized, `bullet-${idx}`)}
                        className="text-[11px] text-[#6C3CE1] hover:underline font-bold"
                      >
                        {copiedKey === `bullet-${idx}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-slate-800 leading-snug">{b.optimized}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white border border-purple-100 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Recruiter Visibility Tips
              </h4>
              <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1.5">
                {data.profileTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
