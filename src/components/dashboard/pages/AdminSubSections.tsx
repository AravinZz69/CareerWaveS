import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import {
  BookOpen,
  Briefcase,
  Flag,
  MessageSquare,
  Megaphone,
  History,
  Settings,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Check,
  Send,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  Sliders,
} from 'lucide-react';
import { PlanName } from '../../../lib/supabase';

interface AdminSubSectionsProps {
  activeSection:
    | 'content'
    | 'jobs'
    | 'flags'
    | 'support'
    | 'announcements'
    | 'audit'
    | 'settings';
  contentItems: any[];
  jobsList: any[];
  featureFlags: any[];
  supportTickets: any[];
  announcements: any[];
  auditLogs: any[];
  platformSettings: any;
  onRefreshAll: () => Promise<void>;
  onConfirmAction: (config: {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  }) => void;
  showToast: (msg: string) => void;
}

export const AdminSubSections: React.FC<AdminSubSectionsProps> = ({
  activeSection,
  contentItems,
  jobsList,
  featureFlags,
  supportTickets,
  announcements,
  auditLogs,
  platformSettings,
  onRefreshAll,
  onConfirmAction,
  showToast,
}) => {
  // Content state
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [newContentOpen, setNewContentOpen] = useState(false);
  const [contentForm, setContentForm] = useState({
    type: 'course',
    title: '',
    category: '',
    meta: '',
    status: 'published',
  });

  // Jobs state
  const [refreshingJobs, setRefreshingJobs] = useState(false);

  // Support state
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Announcements state
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'promo' | 'maintenance'>('promo');
  const [annTargetPlan, setAnnTargetPlan] = useState<'all' | PlanName>('all');

  // Audit search
  const [auditQuery, setAuditQuery] = useState('');

  // Settings form state
  const [settingsState, setSettingsState] = useState(
    platformSettings || {
      aiProvider: 'google_gemini',
      aiModel: 'gemini-3.8-flash',
      fallbackModel: 'gemini-2.5-pro',
      temperature: 0.2,
      maintenanceMode: false,
      maintenanceMessage:
        'CareerWave is undergoing scheduled database upgrades. Please check back in 15 minutes.',
      defaultLimits: {
        resume_tailoring: 2,
        ai_job_match: 5,
        mock_interview: 2,
        linkedin_generation: 1,
        portfolio_generation: 1,
      },
    }
  );

  // ============================================================================
  // 5. CONTENT MANAGEMENT
  // ============================================================================
  if (activeSection === 'content') {
    const contentTypes = [
      { id: 'all', label: 'All Content' },
      { id: 'course', label: 'Courses' },
      { id: 'lesson', label: 'Lessons' },
      { id: 'quiz', label: 'Quizzes' },
      { id: 'career_track', label: 'Career Tracks' },
      { id: 'roadmap_template', label: 'Roadmap Templates' },
      { id: 'resume_template', label: 'Resume Templates' },
      { id: 'portfolio_theme', label: 'Portfolio Themes' },
    ];

    const filteredContent =
      contentTypeFilter === 'all'
        ? contentItems
        : contentItems.filter((c) => c.type === contentTypeFilter);

    const handleSaveContent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingContent) {
        await fetch(`/api/admin/content/${editingContent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contentForm),
        });
        showToast(`Updated "${contentForm.title}" and logged to audit_logs.`);
        setEditingContent(null);
      } else {
        await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contentForm),
        });
        showToast(`Created "${contentForm.title}" and logged to audit_logs.`);
        setNewContentOpen(false);
      }
      setContentForm({ type: 'course', title: '', category: '', meta: '', status: 'published' });
      await onRefreshAll();
    };

    const handleTogglePublish = async (item: any) => {
      const nextStatus = item.status === 'published' ? 'draft' : 'published';
      await fetch(`/api/admin/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      showToast(`${item.title} set to ${nextStatus}.`);
      await onRefreshAll();
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif-heading font-bold text-xl text-slate-900">
              CMS & Curriculum Content Manager
            </h3>
            <p className="text-xs text-slate-500">
              Create, edit, publish, and unpublish courses, lessons, quizzes, tracks, roadmap templates, resume templates, and portfolio themes.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingContent(null);
              setContentForm({
                type: contentTypeFilter === 'all' ? 'course' : contentTypeFilter,
                title: '',
                category: '',
                meta: '',
                status: 'published',
              });
              setNewContentOpen(true);
            }}
            className="text-xs font-bold shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Content Item
          </Button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setContentTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                contentTypeFilter === t.id
                  ? 'bg-[#6C3CE1] text-white shadow-xs'
                  : 'bg-white border border-purple-100 text-slate-600 hover:bg-[#FAF8FF]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Create / Edit Modal Form */}
        {(newContentOpen || editingContent) && (
          <Card className="p-6 bg-[#FAF8FF] border-2 border-[#6C3CE1] space-y-4">
            <h4 className="font-bold text-sm text-slate-900">
              {editingContent ? `Edit Content: ${editingContent.title}` : 'Create New Platform Content'}
            </h4>
            <form onSubmit={handleSaveContent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content Type</label>
                <select
                  value={contentForm.type}
                  onChange={(e) => setContentForm({ ...contentForm, type: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-xl"
                >
                  <option value="course">Course</option>
                  <option value="lesson">Lesson</option>
                  <option value="quiz">Quiz</option>
                  <option value="career_track">Career Track</option>
                  <option value="roadmap_template">Roadmap Template</option>
                  <option value="resume_template">ATS Resume Template</option>
                  <option value="portfolio_theme">Portfolio Theme</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={contentForm.title}
                  onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                  placeholder="e.g., Distributed LLM Inference Lab"
                  className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Track / Category
                </label>
                <input
                  type="text"
                  required
                  value={contentForm.category}
                  onChange={(e) => setContentForm({ ...contentForm, category: e.target.value })}
                  placeholder="e.g., Enterprise AI"
                  className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metadata / Instructor / Specs
                </label>
                <input
                  type="text"
                  required
                  value={contentForm.meta}
                  onChange={(e) => setContentForm({ ...contentForm, meta: e.target.value })}
                  placeholder="e.g., 16 Hours • Bestseller Badge"
                  className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-xl"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewContentOpen(false);
                    setEditingContent(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="text-xs font-bold">
                  Save Content Item
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Content List */}
        <Card className="p-6 bg-white border border-purple-100 shadow-soft">
          {filteredContent.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No content items match this filter. Click "Create Content Item" above to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-purple-100 text-slate-400 font-semibold">
                    <th className="py-3 pr-3">Title</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Metadata</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {filteredContent.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8FF]">
                      <td className="py-3.5 pr-3 font-bold text-slate-900">{item.title}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F4F0FF] text-[#6C3CE1] uppercase">
                          {item.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">{item.category}</td>
                      <td className="py-3.5 px-3 text-slate-500">{item.meta}</td>
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={item.status === 'published' ? 'green' : 'amber'}
                          size="sm"
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 pl-3 text-right space-x-2">
                        <button
                          onClick={() => handleTogglePublish(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-[#6C3CE1] font-semibold hover:bg-purple-100"
                          title={item.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {item.status === 'published' ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" /> Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" /> Publish
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingContent(item);
                            setContentForm({
                              type: item.type,
                              title: item.title,
                              category: item.category,
                              meta: item.meta,
                              status: item.status,
                            });
                          }}
                          className="p-1.5 text-slate-500 hover:text-[#6C3CE1] rounded-lg hover:bg-purple-50"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            onConfirmAction({
                              title: 'Delete Content Item',
                              message: `Are you sure you want to delete "${item.title}"? This action will be recorded in the admin audit log.`,
                              confirmLabel: 'Delete Item',
                              onConfirm: async () => {
                                await fetch(`/api/admin/content/${item.id}`, { method: 'DELETE' });
                                showToast(`Deleted "${item.title}".`);
                                await onRefreshAll();
                              },
                            })
                          }
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ============================================================================
  // 6. JOBS MANAGEMENT
  // ============================================================================
  if (activeSection === 'jobs') {
    const handleManualRefresh = async () => {
      setRefreshingJobs(true);
      try {
        const res = await fetch('/api/admin/jobs/refresh', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showToast('External job-search API synced! Added fresh role and wrote to audit_logs.');
          await onRefreshAll();
        }
      } finally {
        setRefreshingJobs(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif-heading font-bold text-xl text-slate-900">
              Cached Jobs Feed & Spam Moderation
            </h3>
            <p className="text-xs text-slate-500">
              Inspect cached roles in the `jobs` table, remove spam listings, or trigger an immediate external job-search API sync.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={refreshingJobs}
            onClick={handleManualRefresh}
            className="text-xs font-bold shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingJobs ? 'animate-spin' : ''}`} />
            {refreshingJobs ? 'Syncing External Job API...' : 'Trigger Manual Job Fetch'}
          </Button>
        </div>

        <Card className="p-6 bg-white border border-purple-100 shadow-soft">
          {jobsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No cached jobs found. Click "Trigger Manual Job Fetch" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-purple-100 text-slate-400 font-semibold">
                    <th className="py-3 pr-3">Role Title</th>
                    <th className="py-3 px-3">Company</th>
                    <th className="py-3 px-3">Sector</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Posted At</th>
                    <th className="py-3 pl-3 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {jobsList.map((job) => (
                    <tr key={job.id} className="hover:bg-[#FAF8FF]">
                      <td className="py-3.5 pr-3 font-bold text-slate-900">{job.title}</td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">{job.company}</td>
                      <td className="py-3.5 px-3">
                        <Badge variant="purple" size="sm">
                          {job.sector}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">{job.location}</td>
                      <td className="py-3.5 px-3 text-slate-500">
                        {new Date(job.posted_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 pl-3 text-right">
                        <button
                          onClick={() =>
                            onConfirmAction({
                              title: 'Remove Spam / Delist Job',
                              message: `Remove "${job.title}" at ${job.company} from the cached jobs table?`,
                              confirmLabel: 'Remove Spam Job',
                              onConfirm: async () => {
                                await fetch(`/api/admin/jobs/${job.id}`, { method: 'DELETE' });
                                showToast(`Removed job "${job.title}" and logged to audit_logs.`);
                                await onRefreshAll();
                              },
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Spam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ============================================================================
  // 7. FEATURE FLAGS
  // ============================================================================
  if (activeSection === 'flags') {
    const handleToggleFlag = async (flag: any) => {
      await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      showToast(`Feature flag "${flag.key}" ${!flag.enabled ? 'enabled' : 'disabled'}.`);
      await onRefreshAll();
    };

    const handleTogglePlanForFlag = async (flag: any, planName: PlanName) => {
      const currentPlans: PlanName[] = flag.allowed_plans || [];
      const nextPlans = currentPlans.includes(planName)
        ? currentPlans.filter((p) => p !== planName)
        : [...currentPlans, planName];

      await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowed_plans: nextPlans }),
      });
      showToast(`Updated per-plan access for "${flag.key}".`);
      await onRefreshAll();
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-serif-heading font-bold text-xl text-slate-900">
            Feature Flags & Per-Plan Entitlements
          </h3>
          <p className="text-xs text-slate-500">
            Toggle capabilities globally and control which subscription tiers (`Free`, `Pro`, `Premium`) can access each feature.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {featureFlags.map((flag) => (
            <Card
              key={flag.id}
              className="p-5 bg-white border border-purple-100 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-slate-900">{flag.name}</span>
                  <code className="px-2 py-0.5 rounded bg-purple-50 text-[#6C3CE1] text-[11px] font-mono">
                    {flag.key}
                  </code>
                  <Badge variant={flag.enabled ? 'green' : 'coral'} size="sm">
                    {flag.enabled ? 'ACTIVE' : 'DISABLED'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{flag.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 bg-[#FAF8FF] p-1.5 rounded-xl border border-purple-100">
                  {(['Free', 'Pro', 'Premium'] as PlanName[]).map((p) => {
                    const allowed = (flag.allowed_plans || []).includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleTogglePlanForFlag(flag, p)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          allowed
                            ? 'bg-[#6C3CE1] text-white shadow-xs'
                            : 'bg-white text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant={flag.enabled ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleFlag(flag)}
                  className="text-xs font-bold"
                >
                  {flag.enabled ? 'Disable Flag' : 'Enable Flag'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 8. SUPPORT TICKETS
  // ============================================================================
  if (activeSection === 'support') {
    const filteredTickets =
      ticketStatusFilter === 'all'
        ? supportTickets
        : supportTickets.filter((t) => t.status === ticketStatusFilter);

    const activeTicket =
      supportTickets.find((t) => t.id === selectedTicket?.id) || filteredTickets[0] || null;

    const handleSendAdminReply = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeTicket || !adminReplyText.trim()) return;
      await fetch(`/api/admin/support/${activeTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: adminReplyText }),
      });
      setAdminReplyText('');
      showToast(`Reply sent to ${activeTicket.user_email} and logged to audit_logs.`);
      await onRefreshAll();
    };

    const handleStatusChange = async (ticketId: string, status: string) => {
      await fetch(`/api/admin/support/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      showToast(`Ticket #${ticketId} status changed to ${status}.`);
      await onRefreshAll();
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif-heading font-bold text-xl text-slate-900">
              Customer Support & Help Desk
            </h3>
            <p className="text-xs text-slate-500">
              View user tickets, reply directly to threads, and update resolution status.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setTicketStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize ${
                  ticketStatusFilter === st
                    ? 'bg-[#6C3CE1] text-white'
                    : 'bg-white border border-purple-100 text-slate-600'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 cols: Tickets list */}
          <div className="lg:col-span-5 space-y-3">
            {filteredTickets.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-400">
                No support tickets in this view.
              </Card>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    activeTicket?.id === t.id
                      ? 'border-2 border-[#6C3CE1] bg-[#FAF8FF] shadow-sm'
                      : 'border-purple-100 bg-white hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">
                      {t.subject}
                    </span>
                    <Badge
                      variant={
                        t.status === 'resolved'
                          ? 'green'
                          : t.status === 'open'
                          ? 'coral'
                          : 'purple'
                      }
                      size="sm"
                    >
                      {t.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {t.user_name} ({t.user_plan}) • Priority:{' '}
                    <strong className="uppercase">{t.priority}</strong>
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Right 7 cols: Active Ticket Thread */}
          <div className="lg:col-span-7">
            {activeTicket ? (
              <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-50">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{activeTicket.subject}</h4>
                    <p className="text-xs text-slate-500">
                      From {activeTicket.user_name} ({activeTicket.user_email}) • Plan:{' '}
                      <strong>{activeTicket.user_plan}</strong>
                    </p>
                  </div>
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleStatusChange(activeTicket.id, e.target.value)}
                    className="p-2 text-xs font-bold bg-[#F4F0FF] text-[#6C3CE1] border border-purple-200 rounded-xl"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {(activeTicket.messages || []).map((m: any) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl text-xs ${
                        m.sender_role === 'admin'
                          ? 'bg-[#F4F0FF] border border-purple-200 text-slate-900 ml-6'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 mr-6'
                      }`}
                    >
                      <div className="flex justify-between text-[10px] font-bold text-[#6C3CE1] mb-1">
                        <span>{m.sender_name}</span>
                        <span className="text-slate-400">
                          {new Date(m.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="leading-relaxed">{m.message}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendAdminReply} className="pt-2 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type an official admin response..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6C3CE1]"
                  />
                  <Button type="submit" variant="primary" size="sm" className="text-xs font-bold">
                    <Send className="w-3.5 h-3.5" /> Send Reply
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="p-12 text-center text-xs text-slate-400">
                Select a ticket on the left to inspect and reply.
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 9. ANNOUNCEMENTS
  // ============================================================================
  if (activeSection === 'announcements') {
    const handlePublishAnnouncement = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!annTitle.trim() || !annMessage.trim()) return;
      await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: annTitle,
          message: annMessage,
          type: annType,
          target_plan: annTargetPlan,
        }),
      });
      setAnnTitle('');
      setAnnMessage('');
      showToast('Published announcement banner and recorded in audit_logs.');
      await onRefreshAll();
    };

    const handleToggleAnnouncement = async (ann: any) => {
      await fetch(`/api/admin/announcements/${ann.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !ann.is_active }),
      });
      showToast(`Announcement "${ann.title}" ${!ann.is_active ? 'activated' : 'paused'}.`);
      await onRefreshAll();
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-serif-heading font-bold text-xl text-slate-900">
            Global & Plan-Targeted Announcements
          </h3>
          <p className="text-xs text-slate-500">
            Broadcast live dashboard banners to all users or target a specific subscription plan (`Free`, `Pro`, `Premium`).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#6C3CE1]" /> Publish New Banner
              </h4>
              <form onSubmit={handlePublishAnnouncement} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Banner Title
                  </label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g., New Gemini 3.8 Flash Resume Engine Live"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Plan
                    </label>
                    <select
                      value={annTargetPlan}
                      onChange={(e) => setAnnTargetPlan(e.target.value as any)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="all">All Users</option>
                      <option value="Free">Free Plan Only</option>
                      <option value="Pro">Pro Plan Only</option>
                      <option value="Premium">Premium Plan Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                    <select
                      value={annType}
                      onChange={(e) => setAnnType(e.target.value as any)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="promo">Promo</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Banner Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={annMessage}
                    onChange={(e) => setAnnMessage(e.target.value)}
                    placeholder="Write announcement details..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" className="w-full text-xs font-bold">
                  Publish Announcement
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-3">
            {announcements.map((a) => (
              <Card
                key={a.id}
                className="p-5 bg-white border border-purple-100 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{a.title}</span>
                    <Badge variant="purple" size="sm">
                      Target: {a.target_plan}
                    </Badge>
                    <Badge variant={a.is_active ? 'green' : 'amber'} size="sm">
                      {a.is_active ? 'LIVE' : 'PAUSED'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{a.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAnnouncement(a)}
                    className="text-xs"
                  >
                    {a.is_active ? 'Pause' : 'Activate'}
                  </Button>
                  <button
                    onClick={() =>
                      onConfirmAction({
                        title: 'Delete Announcement',
                        message: `Delete announcement "${a.title}"?`,
                        confirmLabel: 'Delete',
                        onConfirm: async () => {
                          await fetch(`/api/admin/announcements/${a.id}`, { method: 'DELETE' });
                          showToast('Announcement deleted.');
                          await onRefreshAll();
                        },
                      })
                    }
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 10. AUDIT LOG (READ-ONLY TABLE)
  // ============================================================================
  if (activeSection === 'audit') {
    const filteredLogs = auditLogs.filter(
      (l) =>
        !auditQuery.trim() ||
        l.action.toLowerCase().includes(auditQuery.toLowerCase()) ||
        l.target.toLowerCase().includes(auditQuery.toLowerCase()) ||
        l.admin_email.toLowerCase().includes(auditQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif-heading font-bold text-xl text-slate-900">
              Immutable Admin Audit Log (`audit_logs`)
            </h3>
            <p className="text-xs text-slate-500">
              Read-only cryptographic ledger of every administrative action across users, plans, content, jobs, flags, and settings.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by action, admin, or target..."
              value={auditQuery}
              onChange={(e) => setAuditQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-purple-100 rounded-xl"
            />
          </div>
        </div>

        <Card className="p-6 bg-white border border-purple-100 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-purple-100 text-slate-400 font-semibold">
                  <th className="py-3 pr-3">Timestamp</th>
                  <th className="py-3 px-3">Admin</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Target</th>
                  <th className="py-3 pl-3">Details (JSON)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF8FF]">
                    <td className="py-3 pr-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{log.admin_email}</td>
                    <td className="py-3 px-3">
                      <code className="px-2 py-0.5 rounded bg-[#F4F0FF] text-[#6C3CE1] font-bold">
                        {log.action}
                      </code>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">{log.target}</td>
                    <td className="py-3 pl-3 font-mono text-[11px] text-slate-600">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // 11. ADMIN SYSTEM SETTINGS (AI Provider, Model Choice, Default Limits, Maintenance)
  // ============================================================================
  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsState),
    });
    showToast('Saved platform AI settings & maintenance config (logged to audit_logs).');
    await onRefreshAll();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif-heading font-bold text-xl text-slate-900">
          Platform AI Engine & Maintenance Settings
        </h3>
        <p className="text-xs text-slate-500">
          Configure AI model routing, default new-signup quota limits, and global maintenance mode.
        </p>
      </div>

      <form onSubmit={handleSavePlatformSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#6C3CE1]" /> AI Provider & Model Routing
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary AI Provider
                </label>
                <select
                  value={settingsState.aiProvider}
                  onChange={(e) =>
                    setSettingsState({ ...settingsState, aiProvider: e.target.value })
                  }
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="google_gemini">Google Gemini (@google/genai)</option>
                  <option value="vertex_ai_enterprise">Google Cloud Vertex AI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Active Primary Model
                </label>
                <select
                  value={settingsState.aiModel}
                  onChange={(e) => setSettingsState({ ...settingsState, aiModel: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Default)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                  <option value="gemini-flash-latest">gemini-flash-latest</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Monthly Quotas for New Free Signups
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {Object.entries(settingsState.defaultLimits || {}).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-xl bg-[#FAF8FF] border border-purple-100">
                    <span className="block text-[10px] font-bold text-slate-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={Number(val)}
                      onChange={(e) =>
                        setSettingsState({
                          ...settingsState,
                          defaultLimits: {
                            ...settingsState.defaultLimits,
                            [key]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full mt-1 p-1.5 text-xs font-bold bg-white border border-purple-200 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" className="text-xs font-bold">
              <Check className="w-4 h-4" /> Save AI & Quota Defaults
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Maintenance Mode Switch
              </h4>
              <Badge variant={settingsState.maintenanceMode ? 'coral' : 'green'} size="sm">
                {settingsState.maintenanceMode ? 'MAINTENANCE ON' : 'SYSTEMS NORMAL'}
              </Badge>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enabling Maintenance Mode pauses non-admin AI Edge Function invocations and displays a maintenance banner across the dashboard.
            </p>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8FF] border border-purple-100 cursor-pointer">
              <span className="text-xs font-bold text-slate-900">Enable Maintenance Mode</span>
              <input
                type="checkbox"
                checked={Boolean(settingsState.maintenanceMode)}
                onChange={(e) =>
                  setSettingsState({ ...settingsState, maintenanceMode: e.target.checked })
                }
                className="w-4 h-4 accent-[#6C3CE1]"
              />
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maintenance Banner Message
              </label>
              <textarea
                rows={3}
                value={settingsState.maintenanceMessage}
                onChange={(e) =>
                  setSettingsState({ ...settingsState, maintenanceMessage: e.target.value })
                }
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <Button type="submit" variant="secondary" size="sm" className="w-full text-xs font-bold">
              Apply Maintenance Configuration
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
};
