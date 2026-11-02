import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSidebarControllerOptions {
  userId?: string | null;
  activeRouteKey: string;
}

const INACTIVITY_DELAY_MS = 10000; // 10 seconds auto-collapse timer
const PINNED_STORAGE_KEY = 'careerwave_sidebar_pinned';

export function useSidebarController({ activeRouteKey }: UseSidebarControllerOptions) {
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(PINNED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const sidebarRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const isPinnedRef = useRef<boolean>(isPinned);
  const isExpandedRef = useRef<boolean>(isExpanded);

  useEffect(() => {
    isPinnedRef.current = isPinned;
  }, [isPinned]);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

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

    if (isPinnedRef.current) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      if (isPinnedRef.current) return;
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

  // Start or clear the 10-second timer when expand or pin state changes
  useEffect(() => {
    if (isPinned) {
      clearInactivityTimer();
      setIsExpanded(true);
    } else if (isExpanded) {
      startInactivityTimer();
    } else {
      clearInactivityTimer();
    }
    return () => clearInactivityTimer();
  }, [isExpanded, isPinned, startInactivityTimer, clearInactivityTimer]);

  // Passive pointermove / keydown listener on sidebar element to reset timer without React state re-renders
  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;

    const handlePassiveReset = () => {
      if (!isPinnedRef.current && isExpandedRef.current) {
        startInactivityTimer();
      }
    };

    el.addEventListener('pointermove', handlePassiveReset, { passive: true });
    el.addEventListener('keydown', handlePassiveReset, { passive: true });
    return () => {
      el.removeEventListener('pointermove', handlePassiveReset);
      el.removeEventListener('keydown', handlePassiveReset);
    };
  }, [startInactivityTimer]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [activeRouteKey]);

  const togglePin = useCallback(() => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(PINNED_STORAGE_KEY, String(next));
      } catch {
        // ignore storage quota errors
      }
      if (next) {
        clearInactivityTimer();
        setIsExpanded(true);
      } else {
        startInactivityTimer();
      }
      return next;
    });
  }, [clearInactivityTimer, startInactivityTimer]);

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
          togglePin();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen, togglePin]);

  const handleSidebarActivity = useCallback(() => {
    if (!isExpandedRef.current) {
      setIsExpanded(true);
    }
    if (!isPinnedRef.current) {
      startInactivityTimer();
    }
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
      if (!isPinnedRef.current) {
        startInactivityTimer();
      }
    },
    [startInactivityTimer]
  );

  return {
    sidebarRef,
    isPinned,
    isExpanded: isPinned || isExpanded,
    togglePin,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    prefersReducedMotion,
    handleSidebarActivity,
    handleSidebarBlur,
  };
}
