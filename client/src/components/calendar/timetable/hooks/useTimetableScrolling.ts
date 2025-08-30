import { useCallback, useEffect, useRef, useState } from 'react';

export const useTimetableScrolling = () => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const getStoredScrollPosition = (): number | null => {
    try {
      const stored = localStorage.getItem('timetable-scroll-position');
      return stored ? parseInt(stored, 10) : null;
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  };

  const setStoredScrollPosition = (position: number) => {
    try {
      localStorage.setItem('timetable-scroll-position', position.toString());
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  };

  const getScrollContainer = () => {
    const table = tableRef.current;
    if (!table) return null;

    let parent = table.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflow === 'auto' || style.overflowY === 'auto' ||
        style.overflow === 'scroll' || style.overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
      if (parent && parent.tagName === 'BODY') break;
    }

    return table.parentElement;
  };

  const restoreScrollPosition = useCallback((position: number) => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    scrollContainer.scrollTop = position;
    scrollContainer.scrollTo({
      top: position,
      behavior: 'auto'
    });
  }, []);

  const saveCurrentScrollPosition = useCallback(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const currentPosition = scrollContainer.scrollTop;
    setStoredScrollPosition(currentPosition);
  }, []);

  useEffect(() => {
    const initializePosition = () => {
      if (hasInitialized) return;

      const storedPosition = getStoredScrollPosition();

      if (storedPosition !== null && storedPosition > 0) {
        restoreScrollPosition(storedPosition);
      }
      setHasInitialized(true);
    };

    const timer = setTimeout(initializePosition, 500);
    return () => clearTimeout(timer);
  }, [hasInitialized, restoreScrollPosition]);

  useEffect(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const handleScroll = () => {
      saveCurrentScrollPosition();
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [hasInitialized, saveCurrentScrollPosition]);

  return {
    tableRef,
    hasInitialized
  };

}