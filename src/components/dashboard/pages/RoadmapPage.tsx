import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FolderGit2,
  BookOpen,
  RefreshCw,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CardSkeleton } from '../../ui/SkeletonLoader';
import { useAuth } from '../../../context/AuthContext';

interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  skills: string[];
  recommendedProject: string;
  resourcesCount: number;
}

interface RoadmapPhase {
  id: string;
  phaseTitle: string;
  timeline: string;
  skillsCovered: string[];
  milestones: MilestoneItem[];
}

interface RoadmapData {
  readinessScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  phases: RoadmapPhase[];
}

export const RoadmapPage: React.FC = () => {
  const { workspace, saveUserRoadmap } = useAuth();
  const [targetRole, setTargetRole] = useState('Generative AI Engineer');
  const [interestInput, setInterestInput] = useState(
    'Agentic AI, Low-Latency RAG, Production Systems'
  );
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(workspace.roadmap || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setRoadmap(workspace.roadmap || null);
  }, [workspace.roadmap]);

  const availableRoles = [
    'Generative AI Engineer',
    'AI Solutions Architect',
    'Full Stack Developer',
    'FinTech Systems Engineer',
    'Data Analytics Lead',
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const extractResumeSkills = (): string[] => {
    const r = workspace.resume;
    if (!r || !r.skills) return ['Python', 'TypeScript', 'SQL'];
    return [
      ...(r.skills.languages || []),
      ...(r.skills.frameworks || []),
      ...(r.skills.cloudAndDevOps || []),
      ...(r.skills.aiAndData || []),
    ];
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          interests: interestInput.split(',').map((s) => s.trim()),
          resumeSkills: extractResumeSkills(),
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setRoadmap(json.data);
        await saveUserRoadmap(json.data);
        showToast(`Skill Gap & Roadmap generated for ${targetRole}!`);
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6C3CE1', '#10B981'],
        });
      }
    } catch {
      showToast('Failed to generate roadmap.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleMilestone = async (phaseId: string, milestoneId: string) => {
    if (!roadmap) return;
    const nextRoadmap: RoadmapData = {
      ...roadmap,
      phases: roadmap.phases.map((ph) => {
        if (ph.id !== phaseId) return ph;
        return {
          ...ph,
          milestones: ph.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            const nextCompleted = !m.completed;
            if (nextCompleted) {
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#6C3CE1', '#10B981'],
              });
            }
            return { ...m, completed: nextCompleted };
          }),
        };
      }),
    };
    setRoadmap(nextRoadmap);
    await saveUserRoadmap(nextRoadmap);
  };

  const allMilestones = roadmap ? roadmap.phases.flatMap((ph) => ph.milestones) : [];
  const completedCount = allMilestones.filter((m) => m.completed).length;
  const progressPercent =
    allMilestones.length > 0 ? Math.round((completedCount / allMilestones.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-200 border border-purple-400/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Target Role & Interests Selector Header */}
      <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-soft space-y-5">
        <div>
          <h2 className="text-2xl font-bold font-serif-heading text-slate-900">
            Career Roadmap & Skill Gap Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Compare your active resume competencies against your target role to generate a personalized milestone timeline.
          </p>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-purple-50">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Career Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6C3CE1] font-semibold"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Specific Interests & Focus Areas
            </label>
            <input
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              placeholder="e.g. Agentic AI, Vector DBs, Low-Latency Systems..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6C3CE1]"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              isLoading={isGenerating}
              className="w-full text-xs font-bold h-10"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Generate
            </Button>
          </div>
        </div>
      </div>

      {isGenerating ? (
        <div className="space-y-4">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      ) : !roadmap ? (
        <Card className="p-10 bg-white border border-purple-100 shadow-soft text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F4F0FF] text-[#6C3CE1] flex items-center justify-center mx-auto">
            <Compass className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold font-serif-heading text-slate-900">
            Generate Your Personalized Career Roadmap
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Select your target role and focus areas above, then click Generate to compare your resume skills against industry benchmarks and build your step-by-step learning plan.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              className="text-xs font-bold"
            >
              <Sparkles className="w-4 h-4" /> Generate Career Roadmap Now
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Skill Gap Diagnostic Summary Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-4 p-6 bg-white border border-purple-100 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Role Readiness Score
                </span>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-[#FAF8FF] border-2 border-[#6C3CE1] flex flex-col items-center justify-center shrink-0">
                  <span className="text-2xl font-black text-[#6C3CE1]">
                    {roadmap.readinessScore}%
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Match</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {roadmap.readinessScore >= 80
                      ? 'Near Senior Benchmark'
                      : 'High Potential Candidate'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{roadmap.summary}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-purple-50">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Roadmap Progress</span>
                  <span className="text-[#6C3CE1]">{progressPercent}% Completed</span>
                </div>
                <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#6C3CE1] to-[#10B981] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Skill Gap Analysis Tags */}
            <Card className="lg:col-span-8 p-6 bg-white border border-purple-100 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Competency Gap Report</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Current Strengths (
                    {roadmap.matchedSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.matchedSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white text-emerald-700 text-[10px] font-semibold border border-emerald-200 shadow-xs"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 space-y-2">
                  <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Skill Gaps to Close (
                    {roadmap.missingSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.missingSkills.map((gap, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white text-red-700 text-[10px] font-semibold border border-red-200 shadow-xs"
                      >
                        + {gap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Visual Timeline of Phases & Milestones */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-serif-heading text-slate-900">
                Step-by-Step Career Roadmap
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {completedCount} of {allMilestones.length} Milestones Checked
              </span>
            </div>

            {roadmap.phases.map((phase, pIdx) => (
              <Card key={phase.id} className="p-6 bg-white border border-purple-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-50">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#6C3CE1] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {pIdx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{phase.phaseTitle}</h4>
                      <p className="text-[11px] text-slate-400">Timeline: {phase.timeline}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {phase.skillsCovered.map((sk, skIdx) => (
                      <span
                        key={skIdx}
                        className="px-2.5 py-0.5 rounded-md bg-[#F4F0FF] text-[#6C3CE1] text-[10px] font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {phase.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                        milestone.completed
                          ? 'bg-white border-purple-100 shadow-xs'
                          : 'bg-[#FAF8FF] border-dashed border-purple-200'
                      }`}
                    >
                      <button
                        onClick={() => toggleMilestone(phase.id, milestone.id)}
                        className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          milestone.completed
                            ? 'bg-[#10B981] text-white shadow-xs'
                            : 'border-2 border-slate-300 text-transparent hover:border-[#6C3CE1]'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5
                            className={`text-xs sm:text-sm font-bold ${
                              milestone.completed ? 'text-slate-800' : 'text-slate-900'
                            }`}
                          >
                            {milestone.title}
                          </h5>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#6C3CE1]" /> {milestone.duration}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {milestone.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1">
                            <FolderGit2 className="w-3.5 h-3.5 text-[#6C3CE1]" />
                            <strong>Build:</strong> {milestone.recommendedProject}
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> {milestone.resourcesCount} lessons & labs
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
