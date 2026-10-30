import React, { useState } from 'react';
import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  Trash2,
  ArrowRight,
  Briefcase,
  StickyNote,
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { formatINR } from '../../../utils/currency';

type StageId = 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';

interface ApplicationsPageProps {
  onNavigateToJobs?: () => void;
}

export const ApplicationsPage: React.FC<ApplicationsPageProps> = ({
  onNavigateToJobs,
}) => {
  const {
    workspace,
    saveUserApplication,
    updateUserApplication,
    deleteUserApplication,
  } = useAuth();

  const applications = workspace.applications || [];

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('Bengaluru / Remote');
  const [salary, setSalary] = useState('2400000');
  const [stage, setStage] = useState<StageId>('Saved');
  const [notes, setNotes] = useState('');

  const stages: { id: StageId; label: string; badgeClass: string }[] = [
    { id: 'Saved', label: 'Saved', badgeClass: 'bg-slate-100 text-slate-700' },
    { id: 'Applied', label: 'Applied', badgeClass: 'bg-[#F3ECFF] text-[#6C3CE1]' },
    { id: 'Interview', label: 'Interview', badgeClass: 'bg-amber-100 text-amber-800' },
    { id: 'Offer', label: 'Offer', badgeClass: 'bg-emerald-100 text-emerald-800' },
    { id: 'Rejected', label: 'Rejected', badgeClass: 'bg-rose-100 text-rose-700' },
  ];

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    await saveUserApplication({
      id: `app_${Date.now()}`,
      company: company.trim(),
      role: role.trim(),
      location: location.trim() || 'India',
      salary: Number(salary) || 0,
      stage,
      notes: notes.trim(),
      appliedDate: new Date().toISOString().slice(0, 10),
    });

    setCompany('');
    setRole('');
    setNotes('');
    setAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Application Kanban Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track every internship and full-time application from Saved through Offer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToJobs && (
            <button
              onClick={onNavigateToJobs}
              className="rounded-xl border border-[#6C3CE1]/30 bg-white px-4 py-2.5 text-xs font-semibold text-[#6C3CE1] hover:bg-[#F5F0FF] cursor-pointer"
            >
              Browse Live Jobs
            </button>
          )}
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-4 py-2.5 text-xs font-semibold text-white shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-3xl bg-white border-2 border-dashed border-[#E2D4FF] p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F0FF] text-[#6C3CE1]">
            <Briefcase className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif text-xl font-bold text-slate-900">
              No job applications tracked yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Save or apply to roles directly from the Job Hunter or add an external application
              manually to organize your interview pipeline.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onNavigateToJobs && (
              <button
                onClick={onNavigateToJobs}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] px-5 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer"
              >
                <span>Find Matching Jobs</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#6C3CE1]/30 bg-white px-5 py-2.5 text-xs font-bold text-[#6C3CE1] hover:bg-[#F5F0FF] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Manually</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stages.map((col) => {
            const colApps = applications.filter(
              (a: any) => (a.stage || a.status || 'Saved').toLowerCase() === col.id.toLowerCase()
            );

            return (
              <div
                key={col.id}
                className="rounded-2xl bg-[#F6F3FF]/70 border border-[#EDE5FF] p-3.5 flex flex-col min-h-[420px]"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="font-serif text-sm font-bold text-slate-900">
                    {col.label}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${col.badgeClass}`}>
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colApps.map((app: any) => (
                    <div
                      key={app.id}
                      className="rounded-2xl bg-white p-3.5 border border-[#EDE5FF] shadow-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {app.role || app.position}
                          </h4>
                          <p className="text-[11px] font-medium text-[#6C3CE1] flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3" />
                            {app.company}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteUserApplication(app.id)}
                          className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {app.location && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {app.location}
                        </p>
                      )}

                      {Number(app.salary) > 0 && (
                        <p className="text-[11px] font-semibold text-emerald-700">
                          {formatINR(Number(app.salary))}/yr
                        </p>
                      )}

                      {app.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2 flex items-start gap-1.5">
                          <StickyNote className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{app.notes}</span>
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {app.appliedDate || 'Recent'}
                        </span>

                        <select
                          value={col.id}
                          onChange={(e) =>
                            updateUserApplication(app.id, { stage: e.target.value as StageId })
                          }
                          className="rounded-lg border border-slate-200 bg-[#FAF8FF] px-2 py-1 text-[10px] font-semibold text-slate-700 focus:outline-none"
                        >
                          {stages.map((s) => (
                            <option key={s.id} value={s.id}>
                              Move: {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Application Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#EDE5FF]">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-serif text-xl font-bold text-slate-900 mb-4">
              Add Job Application
            </h3>
            <form onSubmit={handleAddApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Company</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Razorpay, Postman, TCS"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior AI Engineer"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Annual CTC (₹)
                  </label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as StageId)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Recruiter contact, interview date, preparation notes..."
                  className="w-full rounded-xl border border-slate-200 p-3"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#6C3CE1] hover:bg-[#5829C7] py-3 font-semibold text-white cursor-pointer"
              >
                Save Application
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
