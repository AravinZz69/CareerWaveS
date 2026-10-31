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
  Upload,
  Download,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  Info,
  X,
  Database,
  Server,
} from 'lucide-react';
import { PlanName } from '../../../lib/supabase';
import { preloadJobs } from '../../../context/AuthContext';
import { UNIFIED_SCHEMA_TABLES } from '../../../schema/unifiedDataSchema';
import {
  EXCEL_JOB_COLUMNS,
  SAMPLE_EXCEL_ROWS,
  ParsedSheetJobRow,
  downloadSampleJobsExcel,
  downloadSampleJobsCsv,
  parseUploadedJobSheetBuffer,
  parsePastedSpreadsheetText,
  normalizeRawRowToJob,
} from '../../../utils/jobExcelTemplate';

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
  getAuthHeaders?: () => Record<string, string>;
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
  getAuthHeaders,
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

  // Jobs & Daily Excel/Sheets Upload state
  const [refreshingJobs, setRefreshingJobs] = useState(false);
  const [uploadTab, setUploadTab] = useState<'excel' | 'paste' | 'single'>('excel');
  const [showColumnGuide, setShowColumnGuide] = useState(false);
  const [parsedSheetRows, setParsedSheetRows] = useState<ParsedSheetJobRow[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');
  const [publishingJobs, setPublishingJobs] = useState(false);
  const [pasteSheetText, setPasteSheetText] = useState('');
  const [singleJobDraft, setSingleJobDraft] = useState({
    company: '',
    role: '',
    employmentType: 'Full-time',
    applyUrl: '',
    location: 'Bengaluru, Karnataka, India',
    workMode: 'Hybrid',
    salary: '₹18L – ₹28L/yr',
    sector: 'Software',
    skills: 'React, TypeScript, Node.js, SQL',
    description: '',
    sourcePlatform: 'Company Site',
  });
  const excelInputRef = React.useRef<HTMLInputElement | null>(null);

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
  // 6. JOBS MANAGEMENT & DAILY EXCEL / GOOGLE SHEETS BULK POSTING
  // ============================================================================
  if (activeSection === 'jobs') {
    const authHeaders = getAuthHeaders
      ? getAuthHeaders()
      : { 'Content-Type': 'application/json' };

    const handleManualRefresh = async () => {
      setRefreshingJobs(true);
      try {
        const res = await fetch('/api/admin/jobs/refresh', {
          method: 'POST',
          headers: authHeaders,
        });
        const data = await res.json();
        if (data.success) {
          preloadJobs();
          showToast('External job-search API synced! Added fresh role and wrote to audit_logs.');
          await onRefreshAll();
        }
      } finally {
        setRefreshingJobs(false);
      }
    };

    const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';
      try {
        const arrayBuf = await file.arrayBuffer();
        const rows = parseUploadedJobSheetBuffer(arrayBuf);
        setUploadedFileName(file.name);
        setParsedSheetRows(rows);
        if (rows.length === 0) {
          showToast('No rows found in the uploaded sheet. Check the sample template format.');
        } else {
          const validCount = rows.filter((r) => r.valid).length;
          showToast(
            `Parsed ${rows.length} row(s) from "${file.name}" (${validCount} valid ready to publish).`
          );
        }
      } catch (err: any) {
        showToast(err?.message || 'Could not parse file. Please upload a valid .xlsx, .xls, or .csv file.');
      }
    };

    const handleLoadSampleIntoPreview = () => {
      const rows = SAMPLE_EXCEL_ROWS.map((r, i) => normalizeRawRowToJob(r, i));
      setUploadedFileName('CareerWave-Daily-Jobs-Internships-Sample.xlsx');
      setParsedSheetRows(rows);
      showToast(`Loaded ${rows.length} sample job & internship rows into preview.`);
    };

    const handleParsePastedText = () => {
      if (!pasteSheetText.trim()) {
        showToast('Paste rows from Google Sheets or Excel first.');
        return;
      }
      try {
        const rows = parsePastedSpreadsheetText(pasteSheetText);
        setUploadedFileName('Google Sheets / Clipboard Paste');
        setParsedSheetRows(rows);
        showToast(`Parsed ${rows.length} row(s) from pasted spreadsheet data.`);
      } catch {
        showToast('Unable to parse pasted spreadsheet text. Make sure header row is included.');
      }
    };

    const handleAddSingleRowToBatch = (e: React.FormEvent) => {
      e.preventDefault();
      const rawObj = {
        'Company Name': singleJobDraft.company,
        Role: singleJobDraft.role,
        'Employment Type': singleJobDraft.employmentType,
        'Applying Link': singleJobDraft.applyUrl,
        Location: singleJobDraft.location,
        'Work Mode': singleJobDraft.workMode,
        'Salary / Stipend': singleJobDraft.salary,
        Sector: singleJobDraft.sector,
        'Required Skills': singleJobDraft.skills,
        'Job Description': singleJobDraft.description,
        'Source Platform': singleJobDraft.sourcePlatform,
      };
      const parsed = normalizeRawRowToJob(rawObj, parsedSheetRows.length);
      setParsedSheetRows((prev) => [parsed, ...prev]);
      if (!uploadedFileName) setUploadedFileName('Admin Manual Entry Batch');
      setSingleJobDraft({
        ...singleJobDraft,
        company: '',
        role: '',
        applyUrl: '',
        description: '',
      });
      showToast(`Added "${parsed.job.title}" at ${parsed.job.company} to staging preview.`);
    };

    const handlePublishStagedJobs = async () => {
      const validJobs = parsedSheetRows.filter((r) => r.valid).map((r) => r.job);
      if (validJobs.length === 0) {
        showToast('No valid rows to publish. Ensure Company Name, Role, and Applying Link are valid.');
        return;
      }
      setPublishingJobs(true);
      try {
        const res = await fetch('/api/admin/jobs/bulk-upload', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            jobs: validJobs,
            mode: uploadMode,
            sheetSourceName: uploadedFileName || 'Admin Daily Excel Upload',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          showToast(data.error || 'Failed to publish jobs from sheet.');
          return;
        }
        preloadJobs();
        setParsedSheetRows([]);
        setUploadedFileName('');
        showToast(
          data.message ||
            `Published ${validJobs.length} job/internship postings to the user Job Hunter feed!`
        );
        await onRefreshAll();
      } catch (err: any) {
        showToast(err?.message || 'Network error while publishing jobs.');
      } finally {
        setPublishingJobs(false);
      }
    };

    const validStagedCount = parsedSheetRows.filter((r) => r.valid).length;

    return (
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif-heading font-bold text-xl text-slate-900">
              Daily Job & Internship Posting (Excel / Google Sheets) & Feed Moderation
            </h3>
            <p className="text-xs text-slate-500">
              Upload daily job or internship openings via Excel (`.xlsx`, `.xls`) or Google Sheets (`.csv`). Uploaded rows automatically update the user Job Hunter page in expandable rows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadSampleJobsExcel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={downloadSampleJobsCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white hover:bg-[#FAF8FF] px-3 py-2 text-xs font-bold text-[#6C3CE1] transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sample CSV (Sheets)</span>
            </button>
            <Button
              variant="secondary"
              size="sm"
              disabled={refreshingJobs}
              onClick={handleManualRefresh}
              className="text-xs font-bold shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingJobs ? 'animate-spin' : ''}`} />
              <span>{refreshingJobs ? 'Syncing API...' : 'Sync External Job API'}</span>
            </Button>
          </div>
        </div>

        {/* Excel / Google Sheets Upload & Staging Console */}
        <Card className="p-6 bg-white border-2 border-purple-100 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F4F0FF] text-[#6C3CE1] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Bulk Post Daily Jobs & Internships via Excel or Sheets
                </h4>
                <p className="text-xs text-slate-500">
                  Required columns: <strong>Company Name</strong>, <strong>Role</strong>,{' '}
                  <strong>Employment Type</strong> (Full-time / Internship), and{' '}
                  <strong>Applying Link</strong> (`https://...`).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowColumnGuide((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF8FF] border border-purple-200 px-3 py-1.5 text-xs font-bold text-[#6C3CE1] hover:bg-purple-100 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showColumnGuide ? 'Hide Excel Column Guide' : 'View Excel Column Guide'}</span>
            </button>
          </div>

          {/* Collapsible Excel Column Format Reference Table */}
          {showColumnGuide && (
            <div className="rounded-2xl bg-[#FAF8FF] border border-purple-200 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    Required & Optional Columns for Excel / Google Sheets Upload
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    The parser automatically matches flexible column names (e.g., "Role" or "Job Title", "Applying Link" or "Apply URL").
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleJobsExcel}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#6C3CE1] px-3 py-1 text-[11px] font-bold text-white cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Download Pre-Filled .xlsx Sample
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-purple-100 bg-white">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-purple-100 bg-slate-50 text-slate-500 font-bold">
                      <th className="py-2 px-3">Column Header</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Full-Time Job Example</th>
                      <th className="py-2 px-3">Internship Example</th>
                      <th className="py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {EXCEL_JOB_COLUMNS.map((col) => (
                      <tr key={col.header}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          {col.header}
                        </td>
                        <td className="py-2 px-3">
                          {col.required ? (
                            <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold">
                              REQUIRED
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700">{col.exampleJob}</td>
                        <td className="py-2 px-3 text-[#6C3CE1] font-medium">
                          {col.exampleInternship}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{col.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mode Tabs: 1. Upload Excel/CSV | 2. Paste from Google Sheets | 3. Quick Single Entry */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'excel', label: '1. Upload Excel / CSV File (.xlsx, .xls, .csv)' },
              { id: 'paste', label: '2. Copy & Paste from Google Sheets' },
              { id: 'single', label: '3. Quick Single Job / Internship Form' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setUploadTab(t.id as any)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  uploadTab === t.id
                    ? 'bg-[#6C3CE1] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Upload Excel / CSV */}
          {uploadTab === 'excel' && (
            <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-[#FAF8FF]/70 p-6 text-center space-y-3">
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.tsv"
                onChange={handleExcelFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-white border border-purple-200 text-[#6C3CE1] flex items-center justify-center mx-auto shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  Upload Daily Jobs & Internships Excel or CSV Sheet
                </p>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  Supports Microsoft Excel (`.xlsx`, `.xls`) and Google Sheets exported as `.xlsx` or `.csv`. All rows will be validated and displayed in the preview table below before publishing.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Select Excel / CSV File</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleIntoPreview}
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 px-4 py-2.5 text-xs font-bold text-[#6C3CE1] transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Load 6 Sample Jobs & Internships into Preview</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Paste from Google Sheets */}
          {uploadTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Copy cells directly from Google Sheets or Excel (including the header row) and paste below:
              </label>
              <textarea
                rows={5}
                value={pasteSheetText}
                onChange={(e) => setPasteSheetText(e.target.value)}
                placeholder={`Company Name\tRole\tEmployment Type\tApplying Link\tLocation\tWork Mode\tSalary / Stipend\tSector\tRequired Skills\nRazorpay\tFrontend Engineer\tFull-time\thttps://razorpay.com/jobs/\tBengaluru\tHybrid\t₹22L - ₹32L/yr\tFinTech\tReact, TypeScript`}
                className="w-full rounded-xl border border-purple-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 focus:bg-white focus:border-[#6C3CE1] focus:outline-none"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleParsePastedText}
                  className="text-xs font-bold"
                >
                  Parse Pasted Sheet Rows
                </Button>
              </div>
            </div>
          )}

          {/* Tab 3: Single Quick Job / Internship Form */}
          {uploadTab === 'single' && (
            <form
              onSubmit={handleAddSingleRowToBatch}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF8FF] p-4 rounded-2xl border border-purple-100"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={singleJobDraft.company}
                  onChange={(e) =>
                    setSingleJobDraft({ ...singleJobDraft, company: e.target.value })
                  }
                  placeholder="e.g. Swiggy / CRED"
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Role / Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={singleJobDraft.role}
                  onChange={(e) => setSingleJobDraft({ ...singleJobDraft, role: e.target.value })}
                  placeholder="e.g. AI Engineering Intern"
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Employment Type *
                </label>
                <select
                  value={singleJobDraft.employmentType}
                  onChange={(e) =>
                    setSingleJobDraft({ ...singleJobDraft, employmentType: e.target.value })
                  }
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-semibold"
                >
                  <option value="Full-time">Full-time Job</option>
                  <option value="Internship">Internship</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Applying Link (Direct URL) *
                </label>
                <input
                  type="url"
                  required
                  value={singleJobDraft.applyUrl}
                  onChange={(e) =>
                    setSingleJobDraft({ ...singleJobDraft, applyUrl: e.target.value })
                  }
                  placeholder="https://careers.company.com/apply"
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Salary / Stipend
                </label>
                <input
                  type="text"
                  value={singleJobDraft.salary}
                  onChange={(e) =>
                    setSingleJobDraft({ ...singleJobDraft, salary: e.target.value })
                  }
                  placeholder="e.g. ₹18L – ₹26L/yr or ₹50k/mo"
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={singleJobDraft.location}
                  onChange={(e) =>
                    setSingleJobDraft({ ...singleJobDraft, location: e.target.value })
                  }
                  placeholder="Bengaluru, Hyderabad, Remote"
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sector / Track
                </label>
                <select
                  value={singleJobDraft.sector}
                  onChange={(e) =>
                    setSingleJobDraft({ ...singleJobDraft, sector: e.target.value })
                  }
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs"
                >
                  <option value="Software">Software</option>
                  <option value="GenAI">GenAI</option>
                  <option value="Enterprise AI">Enterprise AI</option>
                  <option value="FinTech">FinTech</option>
                  <option value="Analytics">Analytics</option>
                  <option value="IT Services">IT Services</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={singleJobDraft.skills}
                  onChange={(e) =>
                    setSingleJobDraft({ ...singleJobDraft, skills: e.target.value })
                  }
                  placeholder="Python, React, TypeScript, SQL"
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Job / Internship Description & Details
                </label>
                <textarea
                  rows={2}
                  value={singleJobDraft.description}
                  onChange={(e) =>
                    setSingleJobDraft({ ...singleJobDraft, description: e.target.value })
                  }
                  placeholder="Enter key responsibilities, eligibility, and role details..."
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <Button type="submit" variant="primary" size="sm" className="text-xs font-bold">
                  <Plus className="w-3.5 h-3.5" /> Add Row to Staging Preview
                </Button>
              </div>
            </form>
          )}

          {/* Staged Rows Preview & Publish Controls */}
          {parsedSheetRows.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-purple-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Staged Sheet Preview ({parsedSheetRows.length} rows —{' '}
                    <span className="text-emerald-700">{validStagedCount} valid</span>)
                  </span>
                  {uploadedFileName && (
                    <span className="rounded-lg bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[11px] font-semibold text-[#6C3CE1]">
                      Source: {uploadedFileName}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={uploadMode}
                    onChange={(e) => setUploadMode(e.target.value as 'append' | 'replace')}
                    className="rounded-xl border border-purple-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <option value="append">Mode: Prepend to Live Job Hunter Feed</option>
                    <option value="replace">Mode: Replace Entire Job Hunter Feed</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setParsedSheetRows([]);
                      setUploadedFileName('');
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Clear Preview
                  </button>

                  <button
                    type="button"
                    disabled={publishingJobs || validStagedCount === 0}
                    onClick={handlePublishStagedJobs}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {publishingJobs
                        ? 'Publishing to Job Hunter...'
                        : `Publish ${validStagedCount} Posting(s) to Job Hunter`}
                    </span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-purple-100 max-h-80">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-purple-100 bg-slate-50 text-slate-500 font-semibold sticky top-0">
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Validation</th>
                      <th className="py-2.5 px-3">Company Name</th>
                      <th className="py-2.5 px-3">Role / Title</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Salary / Stipend</th>
                      <th className="py-2.5 px-3">Applying Link</th>
                      <th className="py-2.5 px-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50">
                    {parsedSheetRows.map((row, idx) => (
                      <tr
                        key={`${row.job.id}_${idx}`}
                        className={row.valid ? 'hover:bg-[#FAF8FF]' : 'bg-rose-50/50'}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-400">#{row.rowNumber}</td>
                        <td className="py-2.5 px-3">
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Check className="w-3 h-3" /> READY
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              {row.errors.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{row.job.company}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {row.job.title}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              row.job.employment_type === 'internship' ? 'amber' : 'purple'
                            }
                            size="sm"
                          >
                            {row.job.employment_type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{row.job.location}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700">
                          {row.job.salary_range}
                        </td>
                        <td className="py-2.5 px-3 max-w-[180px] truncate">
                          <a
                            href={row.job.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#6C3CE1] hover:underline font-mono text-[11px]"
                          >
                            <span className="truncate max-w-[140px]">{row.job.apply_url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setParsedSheetRows((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        {/* Live Cached Jobs & Daily Postings Table */}
        <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                Live Job Hunter Feed ({jobsList.length} Active Listings)
              </h4>
              <p className="text-xs text-slate-500">
                All rows below are currently live on the users' Job Hunter page.
              </p>
            </div>
          </div>

          {jobsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No cached jobs found. Upload an Excel sheet or click "Sync External Job API" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-purple-100 text-slate-400 font-semibold">
                    <th className="py-3 pr-3">Role Title</th>
                    <th className="py-3 px-3">Company</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Sector</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Applying Link</th>
                    <th className="py-3 px-3">Posted At</th>
                    <th className="py-3 pl-3 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {jobsList.map((job) => (
                    <tr key={job.id} className="hover:bg-[#FAF8FF]">
                      <td className="py-3.5 pr-3">
                        <div className="font-bold text-slate-900">{job.title}</div>
                        {job.tags?.includes('Admin Daily Posting') && (
                          <span className="inline-block mt-0.5 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">
                            Excel / Sheet Upload
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">{job.company}</td>
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={job.employment_type === 'internship' ? 'amber' : 'green'}
                          size="sm"
                        >
                          {(job.employment_type || job.job_type || 'Full-time').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge variant="purple" size="sm">
                          {job.sector}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">{job.location}</td>
                      <td className="py-3.5 px-3">
                        {job.apply_url ? (
                          <a
                            href={job.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#6C3CE1] hover:underline font-mono text-[11px]"
                          >
                            <span className="truncate max-w-[140px]">{job.apply_url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(job.posted_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 pl-3 text-right">
                        <button
                          onClick={() =>
                            onConfirmAction({
                              title: 'Remove Spam / Delist Job',
                              message: `Remove "${job.title}" at ${job.company} from the cached jobs table?`,
                              confirmLabel: 'Remove Job',
                              onConfirm: async () => {
                                await fetch(`/api/admin/jobs/${job.id}`, {
                                  method: 'DELETE',
                                  headers: authHeaders,
                                });
                                preloadJobs();
                                showToast(`Removed job "${job.title}" and logged to audit_logs.`);
                                await onRefreshAll();
                              },
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
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

      {/* Hostinger & AWS Cloud Migration & Unified Schema Hub */}
      <Card className="p-6 bg-white border border-purple-100 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#6C3CE1]" />
              <h4 className="font-bold text-sm text-slate-900">
                Unified Single-File Schema & Cloud Portability Hub (Hostinger / AWS)
              </h4>
              <Badge variant="purple" size="sm">
                {UNIFIED_SCHEMA_TABLES.length} Tables Consolidated
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              All database tables, TypeScript models, and SQL DDL are consolidated into{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#F4F0FF] text-[#6C3CE1] font-mono text-[11px]">
                src/schema/unifiedDataSchema.ts
              </code>{' '}
              and{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#F4F0FF] text-[#6C3CE1] font-mono text-[11px]">
                supabase/schema.sql
              </code>
              . Export ready-to-run SQL + live data for instant migration to Hostinger or AWS.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              id: 'mysql',
              title: 'Hostinger MySQL 8.0',
              subtitle: 'InnoDB utf8mb4 DDL + Live Data INSERTs for phpMyAdmin / Hostinger VPS',
              badge: 'Hostinger Ready',
            },
            {
              id: 'postgres',
              title: 'AWS RDS PostgreSQL',
              subtitle: 'PostgreSQL 15+ / Aurora / Supabase DDL + Live Data Upserts',
              badge: 'AWS Ready',
            },
            {
              id: 'sqlite',
              title: 'Portable SQLite 3',
              subtitle: 'Zero-config SQLite file schema for AWS Lightsail, EC2, or Docker',
              badge: 'Lightweight',
            },
            {
              id: 'json',
              title: 'Full JSON Snapshot',
              subtitle: 'Complete state backup (Users, Jobs, Gateways, Invoices, Settings)',
              badge: '1-Click Restore',
            },
          ].map((target) => (
            <div
              key={target.id}
              className="p-4 rounded-2xl bg-[#FAF8FF] border border-purple-100 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-[#6C3CE1]" />
                    {target.title}
                  </span>
                  <Badge variant="purple" size="sm">
                    {target.badge}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{target.subtitle}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const headers = getAuthHeaders ? getAuthHeaders() : {};
                    const res = await fetch(
                      `/api/admin/schema/export?dialect=${target.id}&includeData=true`,
                      { headers }
                    );
                    if (!res.ok) {
                      showToast('Failed to export schema.');
                      return;
                    }
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download =
                      target.id === 'mysql'
                        ? 'CareerWave-Hostinger-MySQL-Migration.sql'
                        : target.id === 'postgres'
                        ? 'CareerWave-AWS-PostgreSQL-Migration.sql'
                        : target.id === 'sqlite'
                        ? 'CareerWave-Portable-SQLite-Migration.sql'
                        : 'CareerWave-Portable-Full-Snapshot.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 2000);
                    showToast(`Downloaded ${target.title} migration bundle.`);
                  } catch {
                    showToast('Error downloading migration bundle.');
                  }
                }}
                className="w-full text-xs font-bold bg-white"
              >
                <Download className="w-3.5 h-3.5" /> Download {target.id === 'json' ? '.JSON' : '.SQL'}
              </Button>
            </div>
          ))}
        </div>

        {/* Canonical Table Registry Preview */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              Canonical Unified Schema Registry ({UNIFIED_SCHEMA_TABLES.length} Tables)
            </span>
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6C3CE1] hover:underline cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Restore JSON Snapshot
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const parsed = JSON.parse(text);
                    const headers = {
                      'Content-Type': 'application/json',
                      ...(getAuthHeaders ? getAuthHeaders() : {}),
                    };
                    const res = await fetch('/api/admin/schema/import-json', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify(parsed),
                    });
                    const json = await res.json();
                    if (res.ok && json.success) {
                      showToast(json.message || 'Snapshot restored!');
                      await onRefreshAll();
                    } else {
                      showToast(json.error || 'Failed to restore snapshot.');
                    }
                  } catch {
                    showToast('Invalid JSON snapshot file.');
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-purple-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#FAF8FF] sticky top-0 border-b border-purple-100 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2 px-3">Table Name</th>
                  <th className="py-2 px-3">Domain</th>
                  <th className="py-2 px-3">Columns</th>
                  <th className="py-2 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 bg-white">
                {UNIFIED_SCHEMA_TABLES.map((t) => (
                  <tr key={t.tableName} className="hover:bg-[#FAF8FF]">
                    <td className="py-2 px-3 font-mono font-bold text-[#6C3CE1]">{t.tableName}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium whitespace-nowrap">{t.domain}</td>
                    <td className="py-2 px-3 text-slate-600">{t.columns.length} cols</td>
                    <td className="py-2 px-3 text-slate-500">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};
