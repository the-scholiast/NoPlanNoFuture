import { useEffect, useRef, useState } from 'react';

export const useTimetableScrolling = () => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null);
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
    setSavedScrollPosition(position);
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

  const scrollToDefaultTime = () => {
    // Try to find a suitable time to scroll to (7 AM, 8 AM, or first visible time)
    const sevenAmRow = document.getElementById('seven-am-row');
    const eightAmRow = document.getElementById('eight-am-row');
    const firstRow = document.querySelector('tbody tr') as HTMLElement;
    
    const targetRow = sevenAmRow || eightAmRow || firstRow;
    const scrollContainer = getScrollContainer();

    if (!targetRow || !scrollContainer) return;

    const tableHeader = tableRef.current?.querySelector('thead');
    const headerHeight = tableHeader?.offsetHeight || 0;
    const rowTop = targetRow.offsetTop;
    const scrollPosition = rowTop - headerHeight;

    scrollContainer.scrollTop = scrollPosition;
    scrollContainer.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });

    setStoredScrollPosition(scrollPosition);
  };

  const restoreScrollPosition = (position: number) => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    scrollContainer.scrollTop = position;
    scrollContainer.scrollTo({
      top: position,
      behavior: 'auto'
    });

    setSavedScrollPosition(position);
  };

  const saveCurrentScrollPosition = () => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const currentPosition = scrollContainer.scrollTop;
    setStoredScrollPosition(currentPosition);
  };

  useEffect(() => {
    const initializePosition = () => {
      if (hasInitialized) return;

      const storedPosition = getStoredScrollPosition();

      if (storedPosition !== null && storedPosition > 0) {
        restoreScrollPosition(storedPosition);
      } else {
        scrollToDefaultTime();
      }
      setHasInitialized(true);
    };

    const timer = setTimeout(initializePosition, 500);
    return () => clearTimeout(timer);
  }, [hasInitialized]);

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
  }, [hasInitialized]);

  return {
    tableRef,
    hasInitialized
  };

}