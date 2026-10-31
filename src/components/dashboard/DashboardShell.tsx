import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { OverviewPage } from './pages/OverviewPage';
import { useAuth } from '../../context/AuthContext';
import { useSidebarController } from '../../hooks/useSidebarController';
import { Megaphone, X } from 'lucide-react';

// Lazy-load heavy feature pages so users only download the active module chunk
const ResumePage = lazy(() =>
  import('./pages/ResumePage').then((m) => ({ default: m.ResumePage }))
);
const JobsPage = lazy(() =>
  import('./pages/JobsPage').then((m) => ({ default: m.JobsPage }))
);
const ApplicationsPage = lazy(() =>
  import('./pages/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage }))
);
const InterviewPrepPage = lazy(() =>
  import('./pages/InterviewPrepPage').then((m) => ({ default: m.InterviewPrepPage }))
);
const RoadmapPage = lazy(() =>
  import('./pages/RoadmapPage').then((m) => ({ default: m.RoadmapPage }))
);
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const CoursesPage = lazy(() =>
  import('./pages/CoursesPage').then((m) => ({ default: m.CoursesPage }))
);
const LinkedInPage = lazy(() =>
  import('./pages/LinkedInPage').then((m) => ({ default: m.LinkedInPage }))
);
const PortfolioPage = lazy(() =>
  import('./pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const GlobalSearchModal = lazy(() =>
  import('../search/GlobalSearchModal').then((m) => ({ default: m.GlobalSearchModal }))
);

export type DashboardPageId =
  | 'overview'
  | 'resume'
  | 'jobs'
  | 'applications'
  | 'interviews'
  | 'roadmap'
  | 'projects'
  | 'courses'
  | 'linkedin'
  | 'portfolio'
  | 'settings'
  | 'admin';

interface DashboardShellProps {
  activePage: DashboardPageId;
  onSelectPage: (page: DashboardPageId) => void;
  onExitToLanding: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy' | 'refund') => void;
}

const PageLoaderFallback: React.FC = () => (
  <div className="py-16 flex flex-col items-center justify-center gap-3">
    <div className="w-7 h-7 rounded-full border-2 border-[#6C3CE1] border-t-transparent animate-spin" />
    <span className="text-xs font-medium text-slate-500">Loading module...</span>
  </div>
);

export const DashboardShell: React.FC<DashboardShellProps> = ({
  activePage,
  onSelectPage,
  onExitToLanding,
  onOpenLegal,
}) => {
  const { user, profile, role, announcements } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [dismissedBannerId, setDismissedBannerId] = useState<string | null>(null);
  const [tailorJobContext, setTailorJobContext] = useState<{
    title: string;
    company: string;
    description: string;
  } | null>(null);

  // Guard /admin route: non-admins are redirected to overview
  const effectivePage: DashboardPageId =
    activePage === 'admin' ? 'overview' : activePage;

  const {
    sidebarRef,
    isPinned,
    isExpanded,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    prefersReducedMotion,
    handleSidebarActivity,
    handleSidebarBlur,
  } = useSidebarController({
    userId: user?.id || profile?.email || 'guest',
    activeRouteKey: effectivePage,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If the authenticated user is an admin, render ONLY the Admin Panel Dashboard
  if (role === 'admin') {
    return (
      <Suspense fallback={<PageLoaderFallback />}>
        <AdminPage
          onNavigateToOverview={onExitToLanding}
          onExitToLanding={onExitToLanding}
        />
      </Suspense>
    );
  }

  const activeBanner = announcements.find((a) => a.id !== dismissedBannerId);

  const handleTailorResumeForJob = (job: {
    title: string;
    company: string;
    description: string;
  }) => {
    setTailorJobContext(job);
    onSelectPage('resume');
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-slate-50/40 flex text-slate-900">
      <Sidebar
        activePage={effectivePage}
        onSelectPage={onSelectPage}
        onExitToLanding={onExitToLanding}
        sidebarRef={sidebarRef}
        isPinned={isPinned}
        isExpanded={isExpanded}
        prefersReducedMotion={prefersReducedMotion}
        mobileDrawerOpen={mobileDrawerOpen}
        onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
        onSidebarActivity={handleSidebarActivity}
        onSidebarBlur={handleSidebarBlur}
      />

      {/* Right Column: Fixed Header + Independently Scrollable Main Viewport */}
      <div
        className={`flex-1 flex flex-col h-[100dvh] max-h-[100dvh] min-w-0 bg-white overflow-hidden ${
          prefersReducedMotion
            ? 'transition-none duration-0'
            : 'transition-[padding-left] duration-250 ease-in-out'
        } ${isPinned ? 'lg:pl-[272px]' : 'lg:pl-[72px]'}`}
      >
        {activeBanner && (
          <div className="shrink-0 bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-2 truncate">
              <Megaphone className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span className="font-bold">{activeBanner.title}:</span>
              <span className="truncate opacity-90">{activeBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setDismissedBannerId(activeBanner.id)}
              className="rounded-lg p-1 hover:bg-white/20 cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <TopBar
          activePage={effectivePage}
          onSelectPage={onSelectPage}
          onExitToLanding={onExitToLanding}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-7xl w-full mx-auto">
            <Suspense fallback={<PageLoaderFallback />}>
              {effectivePage === 'overview' && (
                <OverviewPage onNavigate={onSelectPage} />
              )}
              {effectivePage === 'resume' && (
                <ResumePage
                  initialJobToTailor={tailorJobContext}
                  onClearInitialJob={() => setTailorJobContext(null)}
                />
              )}
              {effectivePage === 'jobs' && (
                <JobsPage
                  onTailorResume={handleTailorResumeForJob}
                  onNavigateToApplications={() => onSelectPage('applications')}
                  onNavigateToResume={() => onSelectPage('resume')}
                />
              )}
              {effectivePage === 'applications' && (
                <ApplicationsPage onNavigateToJobs={() => onSelectPage('jobs')} />
              )}
              {effectivePage === 'interviews' && <InterviewPrepPage />}
              {effectivePage === 'roadmap' && <RoadmapPage />}
              {effectivePage === 'projects' && <ProjectsPage />}
              {effectivePage === 'courses' && <CoursesPage />}
              {effectivePage === 'linkedin' && <LinkedInPage />}
              {effectivePage === 'portfolio' && <PortfolioPage />}
              {effectivePage === 'settings' && (
                <SettingsPage onOpenLegal={onOpenLegal} />
              )}
            </Suspense>
          </div>
        </main>
      </div>

      {searchOpen && (
        <Suspense fallback={null}>
          <GlobalSearchModal
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            onNavigate={(page) => {
              setSearchOpen(false);
              onSelectPage(page as DashboardPageId);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};
