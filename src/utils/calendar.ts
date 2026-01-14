/**
 * Calendar Integration Utility
 * Provides mood calendar views and iCal export
 */

import type { CalendarMoodEntry } from '../types';

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  moodEntries: {
    id: number;
    emotion: string;
    intensity: number;
    notes?: string;
    logged_at: string;
  }[];
  averageIntensity?: number;
  dominantEmotion?: string;
  entryCount: number;
}

export interface CalendarMonth {
  year: number;
  month: number; // 1-12
  days: CalendarDay[];
  startDay: number; // Day of week for 1st of month
  totalDays: number;
}

/**
 * Generate calendar data for a specific month
 */
export function generateCalendarMonth(year: number, month: number): CalendarMonth {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  const startDay = firstDay.getDay();
  
  const days: CalendarDay[] = [];
  
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = formatDateISO(date);
    
    days.push({
      date: dateStr,
      dayOfWeek: date.getDay(),
      moodEntries: [],
      entryCount: 0
    });
  }
  
  return {
    year,
    month,
    days,
    startDay,
    totalDays
  };
}

/**
 * Populate calendar with mood entries
 */
export function populateCalendarWithMoods(
  calendar: CalendarMonth,
  moodEntries: CalendarMoodEntry[]
): CalendarMonth {
  const dayMap = new Map<string, CalendarDay>();
  
  // Index days by date
  for (const day of calendar.days) {
    dayMap.set(day.date, day);
  }
  
  // Add mood entries to respective days
  for (const entry of moodEntries) {
    const date = entry.logged_at.split('T')[0]; // Extract YYYY-MM-DD
    const day = dayMap.get(date);
    
    if (day) {
      day.moodEntries.push({
        id: entry.id,
        emotion: entry.emotion,
        intensity: entry.intensity,
        notes: entry.notes ?? undefined,
        logged_at: entry.logged_at
      });
      day.entryCount++;
    }
  }
  
  // Calculate statistics for each day
  for (const day of calendar.days) {
    if (day.moodEntries.length > 0) {
      // Average intensity
      const totalIntensity = day.moodEntries.reduce((sum, e) => sum + e.intensity, 0);
      day.averageIntensity = Math.round((totalIntensity / day.moodEntries.length) * 10) / 10;
      
      // Dominant emotion (most frequent)
      const emotionCounts = new Map<string, number>();
      for (const entry of day.moodEntries) {
        emotionCounts.set(entry.emotion, (emotionCounts.get(entry.emotion) || 0) + 1);
      }
      
      let maxCount = 0;
      let dominant = '';
      for (const [emotion, count] of emotionCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          dominant = emotion;
        }
      }
      day.dominantEmotion = dominant;
    }
  }
  
  return calendar;
}

/**
 * Get color for mood intensity
 */
export function getMoodColor(intensity?: number): string {
  if (!intensity) return '#E5E7EB'; // Gray for no data
  
  if (intensity <= 2) return '#FCA5A5'; // Red (low mood)
  if (intensity <= 3) return '#FCD34D'; // Yellow (moderate)
  if (intensity <= 4) return '#A7F3D0'; // Green (good)
  return '#86EFAC'; // Bright green (excellent)
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display
 */
export function formatDateDisplay(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return names[month - 1];
}

/**
 * Navigate to previous/next month
 */
export function navigateMonth(year: number, month: number, direction: 'prev' | 'next'): { year: number; month: number } {
  if (direction === 'prev') {
    if (month === 1) {
      return { year: year - 1, month: 12 };
    }
    return { year, month: month - 1 };
  } else {
    if (month === 12) {
      return { year: year + 1, month: 1 };
    }
    return { year, month: month + 1 };
  }
}

/**
 * Generate iCal format for mood entries
 * Allows users to import mood history into calendar apps
 */
export function generateICalExport(moodEntries: CalendarMoodEntry[], userEmail: string = 'user@moodmash.win'): string {
  const lines: string[] = [];
  
  // Calendar header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//MoodMash//Mood Calendar//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:MoodMash Mood History');
  lines.push('X-WR-TIMEZONE:UTC');
  
  // Add each mood entry as an event
  for (const entry of moodEntries) {
    const date = new Date(entry.logged_at);
    const dateStr = formatICalDate(date);
    const uid = `mood-${entry.id}@moodmash.win`;
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dateStr}`);
    lines.push(`DTSTART:${dateStr}`);
    lines.push(`DTEND:${dateStr}`);
    lines.push(`SUMMARY:${entry.emotion} (Intensity: ${entry.intensity}/5)`);
    
    if (entry.notes) {
      lines.push(`DESCRIPTION:${escapeICalText(entry.notes)}`);
    }
    
    lines.push(`CATEGORIES:Mood,${entry.emotion}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  }
  
  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n');
}

/**
 * Format date for iCal (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters for iCal text fields
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Get calendar statistics
 */
export interface CalendarStats {
  totalDays: number;
  daysWithEntries: number;
  averageEntriesPerDay: number;
  mostProductiveDay: string;
  longestStreak: number;
}

export function calculateCalendarStats(calendar: CalendarMonth): CalendarStats {
  const daysWithEntries = calendar.days.filter(d => d.entryCount > 0).length;
  const totalEntries = calendar.days.reduce((sum, d) => sum + d.entryCount, 0);
  
  let mostProductiveDay = '';
  let maxEntries = 0;
  for (const day of calendar.days) {
    if (day.entryCount > maxEntries) {
      maxEntries = day.entryCount;
      mostProductiveDay = day.date;
    }
  }
  
  // Calculate longest streak
  let currentStreak = 0;
  let longestStreak = 0;
  for (const day of calendar.days) {
    if (day.entryCount > 0) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return {
    totalDays: calendar.totalDays,
    daysWithEntries,
    averageEntriesPerDay: daysWithEntries > 0 ? totalEntries / daysWithEntries : 0,
    mostProductiveDay,
    longestStreak
  };
}
