import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSidebarControllerOptions {
  userId?: string | null;
  activeRouteKey: string;
}

const INACTIVITY_DELAY_MS = 3000; // 3 seconds

export function useSidebarController({ activeRouteKey }: UseSidebarControllerOptions) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const sidebarRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Listen to prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const clearInactivityTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer();

    timerRef.current = window.setTimeout(() => {
      // Do not collapse while keyboard focus is actively inside the sidebar
      if (
        sidebarRef.current &&
        document.activeElement &&
        sidebarRef.current.contains(document.activeElement)
      ) {
        startInactivityTimer();
        return;
      }
      setIsExpanded(false);
    }, INACTIVITY_DELAY_MS);
  }, [clearInactivityTimer]);

  // Start or clear the 3-second timer when expand state changes
  useEffect(() => {
    if (isExpanded) {
      startInactivityTimer();
    } else {
      clearInactivityTimer();
    }
    return () => clearInactivityTimer();
  }, [isExpanded, startInactivityTimer, clearInactivityTimer]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [activeRouteKey]);

  // Close mobile drawer on Escape key & handle Ctrl/Cmd + B shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        e.preventDefault();
        setMobileDrawerOpen(false);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          setMobileDrawerOpen((prev) => !prev);
        } else {
          if (isExpanded) {
            clearInactivityTimer();
            setIsExpanded(false);
          } else {
            setIsExpanded(true);
            startInactivityTimer();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen, isExpanded, clearInactivityTimer, startInactivityTimer]);

  const handleSidebarActivity = useCallback(() => {
    setIsExpanded((prev) => (prev ? prev : true));
    startInactivityTimer();
  }, [startInactivityTimer]);

  const handleSidebarBlur = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      if (
        sidebarRef.current &&
        e.relatedTarget instanceof Node &&
        sidebarRef.current.contains(e.relatedTarget)
      ) {
        return;
      }
      startInactivityTimer();
    },
    [startInactivityTimer]
  );

  return {
    sidebarRef,
    // Pinned by default whenever expanded so main content shifts cleanly
    isPinned: isExpanded,
    isExpanded,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    prefersReducedMotion,
    handleSidebarActivity,
    handleSidebarBlur,
  };
}
