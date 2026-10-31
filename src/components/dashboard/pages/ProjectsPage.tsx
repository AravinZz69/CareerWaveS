import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import {
  FolderGit2,
  Github,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../../context/AuthContext';

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  closesSkillGap: string;
  techStack: string[];
  description: string;
  steps: string[];
  github: string;
  demo: string;
  status: 'not_started' | 'in_progress' | 'done';
}

const recommendedProjectTemplates: PortfolioProject[] = [
  {
    id: 'prj-1',
    title: 'Enterprise Multi-Agent Customer Support Swarm',
    category: 'Generative AI',
    difficulty: 'Advanced',
    estimatedHours: 28,
    closesSkillGap: 'Autonomous State Machines & Tool-Calling Guards',
    techStack: ['TypeScript', 'LangGraph', 'PostgreSQL', 'Vector Search'],
    description:
      'An autonomous multi-agent triage system that routes complex billing queries, technical issues, and escalations with verifiable citations and human-in-the-loop review.',
    steps: [
      '1. Define cyclic graph state channels with strict schema validation.',
      '2. Implement tool-calling with exponential backoff retry policies.',
      '3. Integrate database row-level isolation for multi-tenant security.',
      '4. Deploy streaming agent reasoning visualizer.',
    ],
    github: 'https://github.com/careerwave/agent-swarm-starter',
    demo: 'https://careerwave.ai/projects/agent-swarm',
    status: 'not_started',
  },
  {
    id: 'prj-2',
    title: 'Low-Latency Vector Search & Semantic Caching Proxy',
    category: 'AI Systems Architecture',
    difficulty: 'Intermediate',
    estimatedHours: 20,
    closesSkillGap: 'Redis Vector Semantic Caching & HNSW Tuning',
    techStack: ['Python', 'FastAPI', 'Redis Vector', 'PostgreSQL pgvector', 'Docker'],
    description:
      'A reverse proxy microservice that caches embedding queries using exact hash matching and cosine similarity thresholds, dropping average search latency by 45%.',
    steps: [
      '1. Benchmark pgvector HNSW index parameters (m=16, ef_construction=64).',
      '2. Implement tiered cache invalidation based on document checksums.',
      '3. Write end-to-end integration tests measuring p99 latency under concurrent load.',
    ],
    github: 'https://github.com/careerwave/vector-cache-proxy',
    demo: 'https://careerwave.ai/projects/cache-proxy',
    status: 'not_started',
  },
  {
    id: 'prj-3',
    title: 'Real-Time Financial Signal & Earnings Call Parser',
    category: 'FinTech',
    difficulty: 'Intermediate',
    estimatedHours: 22,
    closesSkillGap: 'Streaming WebSockets & Financial Time-Series Processing',
    techStack: ['Python', 'FastAPI', 'PostgreSQL', 'Speech-to-Text'],
    description:
      'Transcribes quarterly earnings calls, generates executive sentiment trends over time, and highlights guidance revisions with citation bookmarks.',
    steps: [
      '1. Construct audio processing chunking pipeline.',
      '2. Ingest sentiment vectors into time-series database tables.',
      '3. Render live sentiment charts with citation drill-down.',
    ],
    github: 'https://github.com/careerwave/fin-earnings-pulse',
    demo: 'https://careerwave.ai/projects/fin-pulse',
    status: 'not_started',
  },
  {
    id: 'prj-4',
    title: 'Full-Stack Model Evaluation & Guardrail Dashboard',
    category: 'Generative AI',
    difficulty: 'Advanced',
    estimatedHours: 24,
    closesSkillGap: 'Continuous Model Evals (DeepEval / Ragas) & CI/CD',
    techStack: ['TypeScript', 'DeepEval', 'PostgreSQL', 'GitHub Actions'],
    description:
      'An automated testing harness that grades LLM answers on faithfulness, hallucinations, and safety before production deployment.',
    steps: [
      '1. Configure automated CI pipeline running synthetic test suites.',
      '2. Log evaluation metrics into structured analytics tables.',
      '3. Build a real-time drift alerting dashboard.',
    ],
    github: 'https://github.com/careerwave/eval-guardrails-starter',
    demo: 'https://careerwave.ai/projects/eval-guardrails',
    status: 'not_started',
  },
];

export const ProjectsPage: React.FC = () => {
  const { workspace, saveUserProjects } = useAuth();
  const [projects, setProjects] = useState<PortfolioProject[]>(workspace.projects || []);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setProjects(workspace.projects || []);
  }, [workspace.projects]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGenerateRecommendations = async () => {
    setProjects(recommendedProjectTemplates);
    await saveUserProjects(recommendedProjectTemplates);
    showToast('Generated personalized portfolio projects based on your career track!');
  };

  const handleUpdateStatus = async (id: string, newStatus: PortfolioProject['status']) => {
    const updated = projects.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
    setProjects(updated);
    await saveUserProjects(updated);

    if (newStatus === 'done') {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#6C3CE1', '#FFB547'],
      });
      showToast('Project marked as Done and synced to your portfolio!');
    } else {
      showToast('Project status updated to In Progress.');
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
            Portfolio Project Starters
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Curated engineering blueprints designed to close high-priority skill gaps and strengthen your portfolio.
          </p>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#FAF8FF] p-1.5 rounded-2xl border border-purple-100 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'done', label: 'Completed' },
              { id: 'not_started', label: 'Recommended' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterStatus === st.id
                    ? 'bg-[#6C3CE1] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#6C3CE1]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <Card className="p-10 bg-white border border-purple-100 shadow-soft text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F4F0FF] text-[#6C3CE1] flex items-center justify-center mx-auto">
            <FolderGit2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold font-serif-heading text-slate-900">
            No Portfolio Projects in Your Workspace Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Generate AI-curated project blueprints matched to your target career track and skill gaps, complete with step-by-step architecture milestones.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerateRecommendations}
              className="text-xs font-bold"
            >
              <Sparkles className="w-4 h-4" /> Generate Recommended Projects
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const difficultyBadge: Record<string, 'green' | 'amber' | 'coral'> = {
              Beginner: 'green',
              Intermediate: 'amber',
              Advanced: 'coral',
            };

            return (
              <Card
                key={project.id}
                hover={true}
                className="p-6 bg-white border border-purple-100 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={difficultyBadge[project.difficulty]} size="sm">
                        {project.difficulty}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#6C3CE1]" /> {project.estimatedHours} hrs
                        est.
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        project.status === 'done'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : project.status === 'in_progress'
                          ? 'bg-purple-50 text-[#6C3CE1] border-purple-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {project.status === 'done'
                        ? '✓ Completed'
                        : project.status === 'in_progress'
                        ? '● In Progress'
                        : 'Not Started'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {project.title}
                  </h3>

                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs">
                    <span className="font-bold text-[#6C3CE1] block mb-0.5">
                      Closes Recruiter Skill Gap:
                    </span>
                    <span className="text-slate-700 font-medium">{project.closesSkillGap}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{project.description}</p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Key Architecture Steps
                    </span>
                    {project.steps.map((st, i) => (
                      <p
                        key={i}
                        className="text-[11px] text-slate-600 pl-2 border-l-2 border-purple-200"
                      >
                        {st}
                      </p>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {project.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-[#FAF8FF] border border-purple-100 text-[#6C3CE1] text-[10px] font-semibold"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-purple-50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <a href={project.github} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="text-xs font-semibold">
                        <Github className="w-3.5 h-3.5" /> Starter Repo
                      </Button>
                    </a>
                    <a href={project.demo} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm" className="text-xs text-slate-600">
                        <ExternalLink className="w-3.5 h-3.5" /> Spec
                      </Button>
                    </a>
                  </div>

                  <div>
                    {project.status === 'not_started' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(project.id, 'in_progress')}
                        className="text-xs font-bold"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Start Project
                      </Button>
                    )}
                    {project.status === 'in_progress' && (
                      <Button
                        variant="coral"
                        size="sm"
                        onClick={() => handleUpdateStatus(project.id, 'done')}
                        className="text-xs font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Done
                      </Button>
                    )}
                    {project.status === 'done' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(project.id, 'in_progress')}
                        className="text-xs"
                      >
                        Reopen Project
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
