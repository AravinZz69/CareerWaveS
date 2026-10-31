import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import {
  ExternalLink,
  Sparkles,
  Palette,
  Download,
  Copy,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  PortfolioData,
  defaultPortfolioData,
  PublicPortfolioView,
} from '../../portfolio/PublicPortfolioView';
import { generateStandalonePortfolioHtml } from '../../../lib/portfolioExport';

export const PortfolioPage: React.FC = () => {
  const { user, profile, workspace, saveUserPortfolio } = useAuth();

  const buildInitialPortfolio = (): PortfolioData => {
    if (workspace.portfolio) return workspace.portfolio;
    const r = workspace.resume;
    const cleanSlug = (profile?.full_name || user?.email?.split('@')[0] || 'portfolio')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    return {
      ...defaultPortfolioData,
      slug: cleanSlug || 'portfolio',
      profile: {
        ...defaultPortfolioData.profile,
        name: r?.contact?.fullName || profile?.full_name || user?.email?.split('@')[0] || 'Your Name',
        title: profile?.title || 'Software & AI Engineer',
        bio: r?.summary || profile?.bio || 'Passionate about building scalable software systems.',
        location: r?.contact?.location || profile?.location || 'Bengaluru, India',
        email: user?.email || profile?.email || '',
        github: r?.contact?.github || '',
        linkedin: r?.contact?.linkedin || '',
      },
      projects:
        workspace.projects && workspace.projects.length > 0
          ? workspace.projects.map((p: any) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              tags: p.techStack || [],
              githubUrl: p.github || '',
              liveUrl: p.demo || '',
              metric: p.closesSkillGap || 'Verified Project',
            }))
          : [],
      experience:
        r?.experience && r.experience.length > 0
          ? r.experience.map((e: any) => ({
              id: e.id,
              role: e.role,
              company: e.company,
              period: e.duration,
              description: (e.bullets || []).join(' '),
            }))
          : [],
    };
  };

  const [portfolioData, setPortfolioData] = useState<PortfolioData>(buildInitialPortfolio);
  const [activeTab, setActiveTab] = useState<'profile' | 'skills' | 'projects' | 'experience'>(
    'profile'
  );
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPublished, setIsPublished] = useState(true);
  const [copied, setCopied] = useState(false);
  const [viewLiveFullscreen, setViewLiveFullscreen] = useState(false);

  useEffect(() => {
    if (workspace.portfolio) {
      setPortfolioData(workspace.portfolio);
    }
  }, [workspace.portfolio]);

  const updateAndPersistPortfolio = (updater: (prev: PortfolioData) => PortfolioData) => {
    setPortfolioData((prev) => {
      const next = updater(prev);
      saveUserPortfolio(next);
      return next;
    });
  };

  // New project modal / form state
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tags: '',
    githubUrl: '',
    liveUrl: '',
    metric: '',
  });
  const [showAddProject, setShowAddProject] = useState(false);

  const publicUrl = `https://careerwave.in/p/${portfolioData.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportHtml = () => {
    const html = generateStandalonePortfolioHtml(portfolioData);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${portfolioData.slug}-portfolio.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    const proj = {
      id: `proj-${Date.now()}`,
      title: newProject.title,
      description: newProject.description,
      tags: newProject.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      githubUrl: newProject.githubUrl,
      liveUrl: newProject.liveUrl,
      metric: newProject.metric,
    };

    updateAndPersistPortfolio((prev) => ({
      ...prev,
      projects: [proj, ...prev.projects],
    }));

    setNewProject({
      title: '',
      description: '',
      tags: '',
      githubUrl: '',
      liveUrl: '',
      metric: '',
    });
    setShowAddProject(false);
  };

  const handleDeleteProject = (id: string) => {
    updateAndPersistPortfolio((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  if (viewLiveFullscreen) {
    return (
      <PublicPortfolioView
        data={portfolioData}
        onBack={() => setViewLiveFullscreen(false)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-purple-100 shadow-soft">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif-heading text-slate-900">
            Developer Portfolio Generator & Host
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build and publish an interactive personal site from your resume and projects with 3 themes and standalone HTML export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportHtml}
            className="text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Export Standalone HTML
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              const res = await fetch('/api/portfolio/generate', { method: 'POST' });
              const json = await res.json().catch(() => ({}));
              if (res.status === 402 || json.limitReached) {
                window.dispatchEvent(new CustomEvent('careerwave:quota-exceeded', { detail: json }));
                return;
              }
              await saveUserPortfolio(portfolioData);
              window.dispatchEvent(new CustomEvent('careerwave:usage-updated'));
              setViewLiveFullscreen(true);
            }}
            className="text-xs font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Publish & View Live Page
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Theme selector & Interactive Editor */}
        <div className="lg:col-span-5 space-y-6">
          {/* Theme Selector */}
          <Card className="p-6 bg-white border border-purple-100 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#6C3CE1]" />
                Select Theme
              </h3>
              <Badge variant="purple" size="sm">
                3 Themes
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: 'purple-wave',
                  label: 'Purple Wave',
                  sub: 'CareerWave signature',
                  bg: 'bg-[#FAF8FF] border-purple-200 text-[#6C3CE1]',
                },
                {
                  id: 'terminal-dark',
                  label: 'Terminal Dark',
                  sub: 'Developer monospace',
                  bg: 'bg-[#0D1117] border-slate-700 text-emerald-400',
                },
                {
                  id: 'minimal-editorial',
                  label: 'Minimal Editorial',
                  sub: 'Classic serif',
                  bg: 'bg-[#FDFBF7] border-stone-300 text-stone-900',
                },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() =>
                    updateAndPersistPortfolio((prev) => ({
                      ...prev,
                      theme: th.id as any,
                    }))
                  }
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    portfolioData.theme === th.id
                      ? 'ring-2 ring-[#6C3CE1] shadow-md border-transparent'
                      : 'border-slate-200 hover:border-purple-200'
                  }`}
                >
                  <div
                    className={`w-full h-8 rounded-lg mb-2 flex items-center justify-center text-xs font-bold ${th.bg}`}
                  >
                    Aa
                  </div>
                  <p className="font-bold text-xs text-slate-900 leading-tight">{th.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{th.sub}</p>
                </button>
              ))}
            </div>

            {/* Custom URL & Publish toggle */}
            <div className="pt-3 border-t border-purple-50 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public URL Slug (/p/slug)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-purple-900">
                    <span className="text-slate-400 select-none mr-1">careerwave.in/p/</span>
                    <input
                      type="text"
                      value={portfolioData.slug}
                      onChange={(e) =>
                        updateAndPersistPortfolio((prev) => ({
                          ...prev,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                        }))
                      }
                      className="bg-transparent focus:outline-none font-bold text-[#6C3CE1] w-full"
                    />
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-xl border border-purple-200 bg-[#FAF8FF] text-[#6C3CE1] hover:bg-[#F4F0FF] transition-colors"
                    title="Copy URL"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600 font-medium">Visibility Status</span>
                <button
                  onClick={() => setIsPublished(!isPublished)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                    isPublished
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isPublished ? '● Published Live' : '○ Draft Mode'}
                </button>
              </div>
            </div>
          </Card>

          {/* Section Editors Card */}
          <Card className="p-6 bg-white border border-purple-100 space-y-4 shadow-soft">
            <div className="flex items-center justify-between border-b border-purple-50 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Editable Sections</h3>
              <div className="flex gap-1">
                {(['profile', 'skills', 'projects', 'experience'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-[#6C3CE1] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Tab Editor */}
            {activeTab === 'profile' && (
              <div className="space-y-3 animate-in fade-in duration-150 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={portfolioData.profile.name}
                    onChange={(e) =>
                      updateAndPersistPortfolio((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, name: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6C3CE1]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Headline Title</label>
                  <input
                    type="text"
                    value={portfolioData.profile.title}
                    onChange={(e) =>
                      updateAndPersistPortfolio((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, title: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6C3CE1]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Location & Availability
                  </label>
                  <input
                    type="text"
                    value={portfolioData.profile.location}
                    onChange={(e) =>
                      updateAndPersistPortfolio((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, location: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6C3CE1]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">About / Bio</label>
                  <textarea
                    rows={3}
                    value={portfolioData.profile.bio}
                    onChange={(e) =>
                      updateAndPersistPortfolio((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, bio: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6C3CE1]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">GitHub URL</label>
                    <input
                      type="text"
                      value={portfolioData.profile.github || ''}
                      onChange={(e) =>
                        updateAndPersistPortfolio((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, github: e.target.value },
                        }))
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={portfolioData.profile.linkedin || ''}
                      onChange={(e) =>
                        updateAndPersistPortfolio((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, linkedin: e.target.value },
                        }))
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Skills Tab Editor */}
            {activeTab === 'skills' && (
              <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                <p className="text-slate-500">
                  Update technical skills categorized by domain. Changes reflect in real-time in the preview.
                </p>
                {portfolioData.skills.map((grp, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                  >
                    <span className="font-bold text-slate-800">{grp.category}</span>
                    <input
                      type="text"
                      value={grp.items.join(', ')}
                      onChange={(e) => {
                        const newItems = e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        updateAndPersistPortfolio((prev) => {
                          const updated = [...prev.skills];
                          updated[i] = { ...updated[i], items: newItems };
                          return { ...prev, skills: updated };
                        });
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Projects Tab Editor */}
            {activeTab === 'projects' && (
              <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">
                    {portfolioData.projects.length} Featured Projects
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddProject(!showAddProject)}
                    className="text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </Button>
                </div>

                {showAddProject && (
                  <form
                    onSubmit={handleAddProject}
                    className="p-4 bg-[#F8F6FE] rounded-2xl border border-purple-200 space-y-3"
                  >
                    <h4 className="font-bold text-slate-900">Add New Project</h4>
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      required
                    />
                    <textarea
                      rows={2}
                      placeholder="Description"
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({ ...newProject, description: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Tech Tags (comma-separated, e.g. Python, PyTorch, PostgreSQL)"
                      value={newProject.tags}
                      onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="GitHub URL"
                        value={newProject.githubUrl}
                        onChange={(e) =>
                          setNewProject({ ...newProject, githubUrl: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Live Demo URL"
                        value={newProject.liveUrl}
                        onChange={(e) => setNewProject({ ...newProject, liveUrl: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="ghost" size="sm" onClick={() => setShowAddProject(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" size="sm">
                        Save Project
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {portfolioData.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{proj.title}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">
                          {proj.tags.join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Tab Editor */}
            {activeTab === 'experience' && (
              <div className="space-y-3 animate-in fade-in duration-150 text-xs">
                {portfolioData.experience.map((exp, i) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => {
                          updateAndPersistPortfolio((prev) => {
                            const updated = [...prev.experience];
                            updated[i] = { ...updated[i], role: e.target.value };
                            return { ...prev, experience: updated };
                          });
                        }}
                        className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={exp.period}
                        onChange={(e) => {
                          updateAndPersistPortfolio((prev) => {
                            const updated = [...prev.experience];
                            updated[i] = { ...updated[i], period: e.target.value };
                            return { ...prev, experience: updated };
                          });
                        }}
                        className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded w-24 text-right"
                      />
                    </div>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        updateAndPersistPortfolio((prev) => {
                          const updated = [...prev.experience];
                          updated[i] = { ...updated[i], company: e.target.value };
                          return { ...prev, experience: updated };
                        });
                      }}
                      className="text-xs text-[#6C3CE1] font-semibold bg-white border border-slate-200 px-2 py-1 rounded w-full"
                    />
                    <textarea
                      rows={2}
                      value={exp.description}
                      onChange={(e) => {
                        updateAndPersistPortfolio((prev) => {
                          const updated = [...prev.experience];
                          updated[i] = { ...updated[i], description: e.target.value };
                          return { ...prev, experience: updated };
                        });
                      }}
                      className="text-xs text-slate-600 bg-white border border-slate-200 p-2 rounded w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (7 cols): Live Responsive Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#6C3CE1]" />
              Live Interactive Preview
            </span>

            {/* Viewport switcher */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-purple-100 shadow-xs">
              <button
                onClick={() => setDevicePreview('desktop')}
                className={`p-1.5 rounded-lg transition-colors ${
                  devicePreview === 'desktop'
                    ? 'bg-[#F4F0FF] text-[#6C3CE1]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDevicePreview('tablet')}
                className={`p-1.5 rounded-lg transition-colors ${
                  devicePreview === 'tablet'
                    ? 'bg-[#F4F0FF] text-[#6C3CE1]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Tablet View (768px)"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDevicePreview('mobile')}
                className={`p-1.5 rounded-lg transition-colors ${
                  devicePreview === 'mobile'
                    ? 'bg-[#F4F0FF] text-[#6C3CE1]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Device Mockup Shell */}
          <div className="flex justify-center bg-slate-100/70 p-4 rounded-3xl border border-purple-100 shadow-inner min-h-[700px]">
            <div
              className={`bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col transition-all duration-300 ${
                devicePreview === 'desktop'
                  ? 'w-full max-w-full'
                  : devicePreview === 'tablet'
                  ? 'w-[680px]'
                  : 'w-[375px]'
              }`}
            >
              {/* Browser chrome simulation */}
              <div className="h-8 bg-slate-100 border-b border-slate-200 px-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                </div>
                <div className="text-[10px] font-mono text-slate-500 bg-white px-3 py-0.5 rounded-md border border-slate-200 truncate max-w-[200px]">
                  careerwave.in/p/{portfolioData.slug}
                </div>
                <div className="w-10" />
              </div>

              {/* Scrollable Preview Content */}
              <div className="flex-1 overflow-y-auto max-h-[640px]">
                <PublicPortfolioView data={portfolioData} isStandalone />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
