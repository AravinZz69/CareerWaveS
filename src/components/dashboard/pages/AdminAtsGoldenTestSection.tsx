import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Database,
  Plus,
  Search,
  Trash2,
  Cpu,
  ShieldCheck,
  FileCode,
  Clock,
} from 'lucide-react';
import {
  DEFAULT_SKILLS_TAXONOMY,
  SkillTaxonomyEntry,
  SkillCategoryKey,
} from '../../../lib/skillsTaxonomy';
import { runScoringEngineUnitTests } from '../../../lib/atsScoringEngine';

interface AdminAtsGoldenTestSectionProps {
  getAuthHeaders: () => Record<string, string>;
  onToast?: (msg: string) => void;
}

export const AdminAtsGoldenTestSection: React.FC<AdminAtsGoldenTestSectionProps> = ({
  getAuthHeaders,
  onToast,
}) => {
  const [runningGolden, setRunningGolden] = useState(false);
  const [goldenReport, setGoldenReport] = useState<any | null>(null);
  const [unitTestReport, setUnitTestReport] = useState(() => runScoringEngineUnitTests());

  // Skills Taxonomy State
  const [taxonomy, setTaxonomy] = useState<SkillTaxonomyEntry[]>(DEFAULT_SKILLS_TAXONOMY);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategoryKey>('languages');
  const [newSkillAliases, setNewSkillAliases] = useState('');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingAliasesText, setEditingAliasesText] = useState('');

  // Telemetry & Prompt Versions
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [promptVersions, setPromptVersions] = useState<any[]>([]);

  const fetchTaxonomyAndLogs = async () => {
    try {
      const [taxRes, logsRes] = await Promise.all([
        fetch('/api/taxonomy/skills', { headers: getAuthHeaders() }),
        fetch('/api/admin/ats-telemetry', { headers: getAuthHeaders() }),
      ]);
      const taxJson = await taxRes.json();
      if (taxJson.success && Array.isArray(taxJson.taxonomy)) {
        setTaxonomy(taxJson.taxonomy);
      }
      const logsJson = await logsRes.json();
      if (logsJson.success) {
        setAiLogs(logsJson.logs || []);
        setPromptVersions(logsJson.promptVersions || []);
      }
    } catch {
      // Fallback to default taxonomy
    }
  };

  useEffect(() => {
    fetchTaxonomyAndLogs();
  }, []);

  const handleRunGoldenTestSuite = async () => {
    setRunningGolden(true);
    setUnitTestReport(runScoringEngineUnitTests());
    try {
      const res = await fetch('/api/admin/ats-golden-test', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setGoldenReport(json.report);
        fetchTaxonomyAndLogs();
        if (onToast) {
          onToast(
            `Golden Set Complete: ${json.report.resumesTested} resumes × ${json.report.jobsTested} JDs verified with ${json.report.discrepanciesCount} discrepancies!`
          );
        }
      }
    } catch {
      if (onToast) onToast('Failed to run Golden Set test suite.');
    } finally {
      setRunningGolden(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    const aliases = newSkillAliases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await fetch('/api/admin/taxonomy/skills', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          canonicalName: newSkillName.trim(),
          category: newSkillCategory,
          aliases,
        }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.taxonomy)) {
        setTaxonomy(json.taxonomy);
        setNewSkillName('');
        setNewSkillAliases('');
        if (onToast) onToast(`Added "${newSkillName.trim()}" to skills_taxonomy!`);
      }
    } catch {
      // Ignore
    }
  };

  const handleUpdateSkillAliases = async (id: string) => {
    const aliases = editingAliasesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await fetch(`/api/admin/taxonomy/skills/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ aliases }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.taxonomy)) {
        setTaxonomy(json.taxonomy);
        setEditingSkillId(null);
        if (onToast) onToast('Updated skill aliases in skills_taxonomy.');
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/taxonomy/skills/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.taxonomy)) {
        setTaxonomy(json.taxonomy);
        if (onToast) onToast('Removed skill from skills_taxonomy.');
      }
    } catch {
      // Ignore
    }
  };

  const filteredTaxonomy = taxonomy.filter(
    (t) =>
      !searchQuery.trim() ||
      t.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* ====================================================================
          1. GOLDEN SET BENCHMARK RUNNER (10 RESUMES × 5 JOB DESCRIPTIONS)
      ==================================================================== */}
      <Card className="p-6 bg-white border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#6C3CE1]">
              <ShieldCheck className="h-4 w-4" />
              <span>ADMIN GOLDEN SET BENCHMARK & PARITY HARNESS</span>
            </div>
            <h3 className="font-serif text-lg font-bold text-slate-900">
              10 Golden Resumes × 5 Job Descriptions Cross-Provider Parity Test
            </h3>
            <p className="text-xs text-slate-500">
              Runs the golden corpus through every configured AI provider (Google Gemini, OpenRouter fallback, and Canonical Deterministic Pipeline) with temperature 0 and compares parsed JSON fields, General ATS scores, and Job Match scores.
            </p>
          </div>

          <button
            type="button"
            disabled={runningGolden}
            onClick={handleRunGoldenTestSuite}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5b2ec9] text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {runningGolden ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running 10 Resumes × 5 JDs...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run Golden Set Parity Suite</span>
              </>
            )}
          </button>
        </div>

        {/* Pure TypeScript Scoring Engine Unit Tests */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Pure TypeScript Scoring & Truthfulness Unit Tests ({unitTestReport.passed}/
              {unitTestReport.results.length} Passed)
            </span>
            <span className="text-emerald-700 font-bold">Zero AI Calls · 100% Deterministic</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {unitTestReport.results.map((t) => (
              <div
                key={t.name}
                className="rounded-lg bg-white border border-slate-200 p-2.5 flex items-start gap-2 text-xs"
              >
                {t.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-[11px] text-slate-500">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Golden Set Results Table */}
        {goldenReport && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Golden Resumes Tested
                </span>
                <span className="text-xl font-black text-slate-900">
                  {goldenReport.resumesTested}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Golden Job Descriptions
                </span>
                <span className="text-xl font-black text-slate-900">
                  {goldenReport.jobsTested}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                  Cross-Provider Parity
                </span>
                <span className="text-xl font-black text-emerald-800">
                  {goldenReport.parityPercent}% Identical
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Flagged Discrepancies
                </span>
                <span className="text-xl font-black text-slate-900">
                  {goldenReport.discrepanciesCount}
                </span>
              </div>
            </div>

            {/* 10 Golden Resumes Comparison Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-3">Golden Resume</th>
                    <th className="py-2.5 px-3">Extracted Contact</th>
                    <th className="py-2.5 px-3">Canonical Skills</th>
                    <th className="py-2.5 px-3">Gemini Score</th>
                    <th className="py-2.5 px-3">OpenRouter Score</th>
                    <th className="py-2.5 px-3">Field & Score Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(goldenReport.resumeComparisons || []).map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{row.title}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.email}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {row.skillsCount} skills ({row.sampleSkills.join(', ')})
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {row.geminiScore}/100
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {row.openRouterScore}/100
                      </td>
                      <td className="py-2.5 px-3">
                        {row.identical ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 0 Diffs (Identical)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                            <AlertTriangle className="h-3.5 w-3.5" /> {row.diffReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5 Golden Job Descriptions Match Matrix */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-3">Golden Job Description</th>
                    <th className="py-2.5 px-3">Required Skills Extracted</th>
                    <th className="py-2.5 px-3">Avg Job Match (Gemini)</th>
                    <th className="py-2.5 px-3">Avg Job Match (OpenRouter)</th>
                    <th className="py-2.5 px-3">Parity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(goldenReport.jobComparisons || []).map((jd: any) => (
                    <tr key={jd.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {jd.title} ({jd.company})
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {jd.requiredSkills.join(', ')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-violet-700">
                        {jd.geminiAvgMatch}/100
                      </td>
                      <td className="py-2.5 px-3 font-bold text-violet-700">
                        {jd.openRouterAvgMatch}/100
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Identical
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* ====================================================================
          2. SKILLS TAXONOMY MANAGER (320+ CANONICAL SKILLS & ALIASES)
      ==================================================================== */}
      <Card className="p-6 bg-white border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <Database className="h-4 w-4" />
              <span>SKILLS_TAXONOMY TABLE ({taxonomy.length} CANONICAL SKILLS)</span>
            </div>
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Canonical Skill & Alias Dictionary
            </h3>
            <p className="text-xs text-slate-500">
              Maps model-specific variations (e.g., &ldquo;k8s&rdquo; → &ldquo;Kubernetes&rdquo;, &ldquo;golang&rdquo; → &ldquo;Go&rdquo;) to a single canonical name before scoring.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 320+ skills or aliases..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Add New Canonical Skill Form */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Canonical Name (e.g. Temporal)"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
          />
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value as SkillCategoryKey)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
          >
            <option value="languages">Languages</option>
            <option value="frameworks">Frameworks & Architecture</option>
            <option value="cloudAndDevOps">Cloud, DB & DevOps</option>
            <option value="aiAndData">AI, LLM & Data</option>
          </select>
          <input
            type="text"
            value={newSkillAliases}
            onChange={(e) => setNewSkillAliases(e.target.value)}
            placeholder="Aliases (comma-separated: temporal.io, workflow engine)"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add to Taxonomy
          </button>
        </div>

        {/* Scrollable Taxonomy Table */}
        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="py-2 px-3">Canonical Skill</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Mapped Aliases</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTaxonomy.slice(0, 60).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-bold text-slate-900">{item.canonicalName}</td>
                  <td className="py-2 px-3 text-slate-500">{item.category}</td>
                  <td className="py-2 px-3 text-slate-600">
                    {editingSkillId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingAliasesText}
                          onChange={(e) => setEditingAliasesText(e.target.value)}
                          className="flex-1 rounded border border-emerald-400 px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSkillAliases(item.id)}
                          className="rounded bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span>{item.aliases.join(', ') || '—'}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSkillId(item.id);
                        setEditingAliasesText(item.aliases.join(', '));
                      }}
                      className="text-violet-600 hover:underline font-semibold cursor-pointer"
                    >
                      Edit Aliases
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(item.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ====================================================================
          3. VERSIONED PROMPTS & AI CALL TELEMETRY LOGS
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-white border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <FileCode className="h-4 w-4 text-violet-600" />
            <span>Database Versioned Prompts (temperature = 0)</span>
          </div>
          <div className="space-y-2 text-xs">
            {(promptVersions.length > 0
              ? promptVersions
              : [
                  {
                    id: 'resume_parse_v2.4',
                    task: 'Canonical Resume Extraction',
                    temperature: 0,
                    maxRetries: 2,
                  },
                  {
                    id: 'jd_extract_v2.4',
                    task: 'Job Description Requirements Schema',
                    temperature: 0,
                    maxRetries: 2,
                  },
                  {
                    id: 'resume_tailor_v2.4',
                    task: 'Truthful Bullet Rewriting',
                    temperature: 0,
                    maxRetries: 2,
                  },
                  {
                    id: 'bullet_improve_v2.4',
                    task: 'Single Bullet XYZ Upgrade',
                    temperature: 0,
                    maxRetries: 2,
                  },
                ]
            ).map((pv: any) => (
              <div
                key={pv.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-violet-700">{pv.id}</span>
                  <p className="text-[11px] text-slate-500">{pv.task}</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-600">
                  temp={pv.temperature} · retries={pv.maxRetries}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span>AI Call Telemetry & SHA-256 Cache Log</span>
            </div>
            <button
              type="button"
              onClick={fetchTaxonomyAndLogs}
              className="text-[11px] font-semibold text-violet-600 hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-2 text-xs">
            {aiLogs.length === 0 ? (
              <p className="text-slate-400 py-6 text-center">
                Run a resume parse, job tailor, or the Golden Set above to view live call logs.
              </p>
            ) : (
              aiLogs.slice(0, 20).map((log: any) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="font-bold text-slate-900">{log.provider}</span>
                    <span className="mx-1.5 text-slate-400">·</span>
                    <span className="font-mono text-[11px] text-slate-600">{log.model}</span>
                    <span className="mx-1.5 text-slate-400">·</span>
                    <span className="font-mono text-[11px] text-violet-700">
                      {log.promptVersion}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-[11px]">
                    {log.cacheHit && (
                      <span className="font-bold text-emerald-700">CACHE HIT</span>
                    )}
                    <span className="font-mono text-slate-500">{log.latencyMs} ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
