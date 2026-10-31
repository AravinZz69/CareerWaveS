import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import type { DashboardPageId } from './components/dashboard/DashboardShell';
import { MobileTabBar } from './components/navigation/MobileTabBar';

const DashboardShell = lazy(() =>
  import('./components/dashboard/DashboardShell').then((m) => ({ default: m.DashboardShell }))
);
const AuthModal = lazy(() =>
  import('./components/auth/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const UpgradeModal = lazy(() =>
  import('./components/saas/UpgradeModal').then((m) => ({ default: m.UpgradeModal }))
);
const TermsPrivacyModal = lazy(() =>
  import('./components/saas/TermsPrivacyModal').then((m) => ({ default: m.TermsPrivacyModal }))
);

const CareerWaveContent: React.FC = () => {
  const {
    user,
    role,
    upgradeModalOpen,
    upgradeTriggerFeature,
    closeUpgradeModal,
  } = useAuth();

  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing');
  const [activeDashboardPage, setActiveDashboardPage] = useState<DashboardPageId>('overview');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [pendingDashboardPage, setPendingDashboardPage] = useState<DashboardPageId | null>(null);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'refund' | null>(null);

  // Enforce protected routes: if user logs out or is null, immediately return to landing page
  useEffect(() => {
    const path = window.location.pathname;
    if (!user) {
      if (viewMode === 'dashboard' || path.startsWith('/admin') || path.startsWith('/dashboard')) {
        setViewMode('landing');
        setActiveDashboardPage('overview');
        if (path !== '/') {
          window.history.replaceState({}, '', '/');
        }
      }
      return;
    }

    // If authenticated user is an admin, always show ONLY the Admin Panel dashboard
    if (role === 'admin') {
      setViewMode('dashboard');
      setActiveDashboardPage('admin');
      if (!path.startsWith('/admin')) {
        window.history.replaceState({}, '', '/admin');
      }
      return;
    }

    // Non-admin visiting /admin directly via URL is redirected to user dashboard
    if (path.startsWith('/admin')) {
      setViewMode('dashboard');
      setActiveDashboardPage('overview');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [user, role, viewMode]);

  useEffect(() => {
    const handleSignedOut = () => {
      setViewMode('landing');
      setActiveDashboardPage('overview');
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
    };
    window.addEventListener('careerwave:signed-out', handleSignedOut);
    return () => window.removeEventListener('careerwave:signed-out', handleSignedOut);
  }, []);

  // Enforce strict separation: admins only see 'admin', non-admins never see 'admin'
  useEffect(() => {
    if (!user) return;
    if (role === 'admin' && activeDashboardPage !== 'admin') {
      setActiveDashboardPage('admin');
      if (!window.location.pathname.startsWith('/admin')) {
        window.history.replaceState({}, '', '/admin');
      }
    } else if (role !== 'admin' && activeDashboardPage === 'admin') {
      setActiveDashboardPage('overview');
      if (window.location.pathname.startsWith('/admin')) {
        window.history.replaceState({}, '', '/dashboard');
      }
    }
  }, [user, activeDashboardPage, role]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleNavigateToDashboard = (page: DashboardPageId = 'overview') => {
    if (!user) {
      setPendingDashboardPage(page);
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }

    if (role === 'admin') {
      setActiveDashboardPage('admin');
      setViewMode('dashboard');
      window.history.replaceState({}, '', '/admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'admin') {
      setActiveDashboardPage('overview');
      setViewMode('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveDashboardPage(page);
    setViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCurrentMobileTab = (): 'home' | 'learning' | 'jobs' | 'profile' => {
    if (viewMode === 'landing' || !user) return 'home';
    if (activeDashboardPage === 'courses' || activeDashboardPage === 'roadmap') return 'learning';
    if (activeDashboardPage === 'jobs' || activeDashboardPage === 'applications') return 'jobs';
    if (activeDashboardPage === 'settings') return 'profile';
    return 'home';
  };

  const handleSelectMobileTab = (tab: 'home' | 'learning' | 'jobs' | 'profile') => {
    if (role === 'admin') {
      setActiveDashboardPage('admin');
      setViewMode('dashboard');
      return;
    }
    if (tab === 'home') {
      setViewMode('landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'learning') {
      handleNavigateToDashboard('courses');
    } else if (tab === 'jobs') {
      handleNavigateToDashboard('jobs');
    } else if (tab === 'profile') {
      handleNavigateToDashboard('settings');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {viewMode === 'landing' || !user ? (
        <LandingPage
          onOpenAuth={handleOpenAuth}
          onNavigateToDashboard={handleNavigateToDashboard}
          onOpenLegal={(tab) => setLegalModalTab(tab)}
        />
      ) : (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#FAF8FF]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#6C3CE1] border-t-transparent animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Loading workspace...</span>
              </div>
            </div>
          }
        >
          <DashboardShell
            activePage={role === 'admin' ? 'admin' : activeDashboardPage === 'admin' ? 'overview' : activeDashboardPage}
            onSelectPage={(page) => {
              if (role === 'admin') {
                setActiveDashboardPage('admin');
                return;
              }
              if (page === 'admin') {
                setActiveDashboardPage('overview');
                return;
              }
              setActiveDashboardPage(page);
            }}
            onExitToLanding={() => setViewMode('landing')}
            onOpenLegal={(tab) => setLegalModalTab(tab)}
          />
        </Suspense>
      )}

      {/* Mobile Bottom Tab Bar (for non-admin users only) */}
      {role !== 'admin' && (
        <MobileTabBar
          currentTab={getCurrentMobileTab()}
          onSelectTab={handleSelectMobileTab}
        />
      )}

      <Suspense fallback={null}>
        {/* Authentication Modal */}
        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => {
              setAuthModalOpen(false);
              setPendingDashboardPage(null);
            }}
            initialMode={authMode}
            onSuccess={() => {
              const target = pendingDashboardPage || 'overview';
              setPendingDashboardPage(null);
              setActiveDashboardPage(role === 'admin' ? 'admin' : target === 'admin' ? 'overview' : target);
              setViewMode('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* SaaS Plan Upgrade Modal */}
        {upgradeModalOpen && (
          <UpgradeModal
            isOpen={upgradeModalOpen}
            onClose={closeUpgradeModal}
            triggerFeature={upgradeTriggerFeature}
          />
        )}

        {/* Legal Modal (Terms, Privacy, Refund Policy) */}
        {legalModalTab !== null && (
          <TermsPrivacyModal
            isOpen={legalModalTab !== null}
            onClose={() => setLegalModalTab(null)}
            initialTab={legalModalTab || 'terms'}
          />
        )}
      </Suspense>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <CareerWaveContent />
    </AuthProvider>
  );
}

export default App;
