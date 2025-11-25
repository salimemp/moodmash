/**
 * Performance Optimization Utilities
 * Version: 10.3 - Performance & Bundle Optimization
 * 
 * Provides lazy loading, code splitting, and performance monitoring
 */

/**
 * Lazy load a module dynamically
 */
export async function lazyLoad<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    console.error('[Performance] Lazy load failed:', error);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request Idle Callback polyfill
 */
export function requestIdleCallbackPolyfill(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Fallback for browsers without requestIdleCallback
  const start = Date.now();
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
    } as IdleDeadline);
  }, 1) as unknown as number;
}

/**
 * Cancel Idle Callback polyfill
 */
export function cancelIdleCallbackPolyfill(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Defer execution until browser is idle
 */
export function defer(callback: () => void): void {
  requestIdleCallbackPolyfill(() => {
    callback();
  });
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  
  switch (type) {
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'image':
      link.as = 'image';
      break;
    case 'font':
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      break;
  }
  
  document.head.appendChild(link);
}

/**
 * Measure performance of a function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    
    // Record to Performance API if available
    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, undefined, `${name}-end`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Cache with expiration
 */
export class CacheWithExpiration<T> {
  private cache: Map<string, { value: T; expires: number }> = new Map();
  
  constructor(private defaultTTL: number = 5 * 60 * 1000) {} // 5 minutes default
  
  set(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expires });
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    // Clean expired entries
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

/**
 * Intersection Observer for lazy loading
 */
export function observeIntersection(
  element: Element,
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    }
  );
  
  observer.observe(element);
  return observer;
}

/**
 * Batch DOM updates
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Get connection quality
 */
export function getConnectionQuality(): 'slow' | 'medium' | 'fast' {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return 'slow';
    }
    
    if (connection.effectiveType === '3g') {
      return 'medium';
    }
  }
  
  return 'fast';
}

/**
 * Check if device has limited resources
 */
export function hasLimitedResources(): boolean {
  if ('deviceMemory' in navigator) {
    const memory = (navigator as any).deviceMemory;
    return memory <= 4; // 4GB or less
  }
  
  if ('hardwareConcurrency' in navigator) {
    return navigator.hardwareConcurrency <= 4; // 4 cores or less
  }
  
  return false;
}

/**
 * Adaptive loading based on connection and device
 */
export function shouldLoadHeavyFeature(): boolean {
  const quality = getConnectionQuality();
  const limited = hasLimitedResources();
  
  if (quality === 'slow' || limited) {
    return false;
  }
  
  return true;
}

/**
 * Prefetch resources when idle
 */
export function prefetchWhenIdle(urls: string[]): void {
  if (!shouldLoadHeavyFeature()) {
    return;
  }
  
  requestIdleCallbackPolyfill(() => {
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  });
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
