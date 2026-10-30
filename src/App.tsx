import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardShell, DashboardPageId } from './components/dashboard/DashboardShell';
import { AuthModal } from './components/auth/AuthModal';
import { MobileTabBar } from './components/navigation/MobileTabBar';
import { UpgradeModal } from './components/saas/UpgradeModal';
import { TermsPrivacyModal } from './components/saas/TermsPrivacyModal';

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
      )}

      {/* Mobile Bottom Tab Bar (for non-admin users only) */}
      {role !== 'admin' && (
        <MobileTabBar
          currentTab={getCurrentMobileTab()}
          onSelectTab={handleSelectMobileTab}
        />
      )}

      {/* Authentication Modal */}
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

      {/* SaaS Plan Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={closeUpgradeModal}
        triggerFeature={upgradeTriggerFeature}
      />

      {/* Legal Modal (Terms, Privacy, Refund Policy) */}
      <TermsPrivacyModal
        isOpen={legalModalTab !== null}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'terms'}
      />
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
