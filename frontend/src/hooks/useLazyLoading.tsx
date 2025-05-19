import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseLazyLoadingOptions {
  initialItems?: number;
  increment?: number;
  delay?: number;
}

export function useLazyLoading<T>(
  items: T[] | undefined,
  options: UseLazyLoadingOptions = {}
) {
  const {
    initialItems = 6,
    increment = 6,
    delay = 150
  } = options;

  // Ensure items is always an array to avoid conditional hook calls
  // Use useMemo to avoid unnecessary recalculations
  const safeItems = useMemo(() => items || [], [items]);
  
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [visibleCount, setVisibleCount] = useState(initialItems);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Update visible items when the count changes or items array changes
  useEffect(() => {
    // Reset visible count to initial value when items array changes completely
    if (safeItems.length === 0) {
      setVisibleItems([]);
      setHasMore(false);
      return;
    }

    const slicedItems = safeItems.slice(0, visibleCount);
    setVisibleItems(slicedItems);
    setHasMore(safeItems.length > slicedItems.length);
  }, [safeItems, visibleCount, initialItems]);

  // Load more items - memoized to avoid recreating on each render
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    setTimeout(() => {
      setVisibleCount(prev => Math.min(safeItems.length, prev + increment));
      setIsLoadingMore(false);
    }, delay);
  }, [isLoadingMore, hasMore, safeItems, increment, delay]);

  // Return stable object structure with memoized values
  const returnValue = useMemo(() => ({
    visibleItems,
    hasMore,
    isLoadingMore,
    loadMore,
    totalCount: safeItems.length,
    visibleCount: visibleItems.length
  }), [visibleItems, hasMore, isLoadingMore, loadMore, safeItems.length, visibleItems.length]);

  return returnValue;
}
