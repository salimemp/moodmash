import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple class names together and optimizes Tailwind CSS classes
 * @param inputs Class values to merge
 * @returns Merged and optimized class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parses JSON without throwing errors
 * @param jsonString String to parse as JSON
 * @param fallback Fallback value if parsing fails
 * @returns Parsed JSON object or fallback
 */
export function safeParseJSON<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    // Ignore parsing errors and return fallback
    return fallback;
  }
}

/**
 * Debounces a function to limit how often it can be called
 * @param fn Function to debounce
 * @param ms Milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: Array<unknown>) => unknown>(
  fn: T,
  ms = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Creates a delay using Promises
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the specified time
 */
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Formats a date to a human-readable string
 * @param date Date to format
 * @param localeOptions Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  localeOptions: Intl.DateTimeFormatOptions = { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }
): string {
  return new Intl.DateTimeFormat('en-US', localeOptions).format(date);
}
