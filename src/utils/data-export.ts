/**
 * Data Export Utility
 * Supports JSON, CSV, and PDF formats for mood data export
 */

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  dateFrom?: string;
  dateTo?: string;
  includeNotes?: boolean;
  includeActivities?: boolean;
  includeInsights?: boolean;
}

export interface ExportData {
  user: {
    username?: string;
    email?: string;
  };
  exportDate: string;
  dateRange: {
    from: string;
    to: string;
  };
  moodEntries: any[];
  activities?: any[];
  insights?: any;
}

/**
 * Export mood data to JSON
 */
export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Export mood data to CSV
 */
export function exportToCSV(data: ExportData): string {
  const lines: string[] = [];
  
  // CSV Header
  const headers = [
    'Date',
    'Time',
    'Emotion',
    'Intensity',
    'Notes',
    'Tags',
    'Activities',
    'Privacy',
    'Entry Mode'
  ];
  lines.push(headers.map(h => `"${h}"`).join(','));
  
  // Mood entries
  for (const entry of data.moodEntries) {
    const date = new Date(entry.logged_at);
    const dateStr = date.toLocaleDateString('en-US');
    const timeStr = date.toLocaleTimeString('en-US');
    
    const tags = Array.isArray(entry.tags) 
      ? entry.tags.join('; ') 
      : (typeof entry.tags === 'string' ? JSON.parse(entry.tags || '[]').join('; ') : '');
    
    const row = [
      dateStr,
      timeStr,
      entry.emotion || '',
      entry.intensity || '',
      entry.notes || '',
      tags,
      entry.activities || '',
      entry.privacy || '',
      entry.entry_mode || ''
    ];
    
    lines.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  }
  
  return lines.join('\n');
}

/**
 * Export mood data to PDF (HTML-based)
 * Generates HTML that can be printed to PDF using browser's print function
 */
export function exportToPDFHTML(data: ExportData): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MoodMash Data Export</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 32px;
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      font-size: 16px;
      color: #6b7280;
    }
    
    .metadata {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .metadata-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    
    .metadata-label {
      font-weight: 600;
      color: #4b5563;
    }
    
    .section-title {
      font-size: 24px;
      color: #1f2937;
      margin-top: 40px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    
    .entry {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .entry-emotion {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .entry-date {
      font-size: 14px;
      color: #6b7280;
    }
    
    .entry-intensity {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      margin-left: 10px;
    }
    
    .entry-notes {
      color: #4b5563;
      margin-top: 10px;
      line-height: 1.8;
    }
    
    .entry-tags {
      margin-top: 15px;
    }
    
    .tag {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 8px;
      margin-top: 5px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #6b7280;
    }
    
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .entry {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌈 MoodMash Data Export</h1>
    <div class="subtitle">Your Complete Mood History</div>
  </div>
  
  <div class="metadata">
    <div class="metadata-row">
      <span class="metadata-label">Export Date:</span>
      <span>${new Date(data.exportDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Date Range:</span>
      <span>${new Date(data.dateRange.from).toLocaleDateString('en-US')} - ${new Date(data.dateRange.to).toLocaleDateString('en-US')}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Total Entries:</span>
      <span>${data.moodEntries.length}</span>
    </div>
  </div>
  
  ${data.insights ? `
  <h2 class="section-title">📊 Overview Statistics</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${data.moodEntries.length}</div>
      <div class="stat-label">Total Entries</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${calculateAverageIntensity(data.moodEntries).toFixed(1)}</div>
      <div class="stat-label">Avg. Intensity</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${getMostFrequentEmotion(data.moodEntries)}</div>
      <div class="stat-label">Top Emotion</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${calculateDaysTracked(data.moodEntries)}</div>
      <div class="stat-label">Days Tracked</div>
    </div>
  </div>
  ` : ''}
  
  <h2 class="section-title">📝 Mood Entries</h2>
  ${data.moodEntries.map(entry => {
    const date = new Date(entry.logged_at);
    const tags = Array.isArray(entry.tags) 
      ? entry.tags 
      : (typeof entry.tags === 'string' ? JSON.parse(entry.tags || '[]') : []);
    
    return `
    <div class="entry">
      <div class="entry-header">
        <div>
          <span class="entry-emotion">${entry.emotion || 'Unknown'}</span>
          <span class="entry-intensity">${entry.intensity || 0}/5</span>
        </div>
        <div class="entry-date">${date.toLocaleDateString('en-US', { 
          weekday: 'short',
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
      </div>
      ${entry.notes ? `<div class="entry-notes">${escapeHTML(entry.notes)}</div>` : ''}
      ${tags.length > 0 ? `
      <div class="entry-tags">
        ${tags.map((tag: string) => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}
      </div>
      ` : ''}
    </div>
    `;
  }).join('')}
  
  <div class="footer">
    <p>Generated by MoodMash • Intelligent Mood Tracking & Wellness Platform</p>
    <p>© ${new Date().getFullYear()} MoodMash. All rights reserved.</p>
    <p style="margin-top: 10px;">This document contains private health information. Keep it secure.</p>
  </div>
</body>
</html>
  `;
  
  return html.trim();
}

/**
 * Helper: Calculate average intensity
 */
function calculateAverageIntensity(entries: any[]): number {
  if (entries.length === 0) return 0;
  const sum = entries.reduce((acc, e) => acc + (e.intensity || 0), 0);
  return sum / entries.length;
}

/**
 * Helper: Get most frequent emotion
 */
function getMostFrequentEmotion(entries: any[]): string {
  if (entries.length === 0) return 'N/A';
  
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const emotion = entry.emotion || 'Unknown';
    counts.set(emotion, (counts.get(emotion) || 0) + 1);
  }
  
  let maxEmotion = '';
  let maxCount = 0;
  for (const [emotion, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      maxEmotion = emotion;
    }
  }
  
  return maxEmotion;
}

/**
 * Helper: Calculate days tracked
 */
function calculateDaysTracked(entries: any[]): number {
  if (entries.length === 0) return 0;
  
  const dates = new Set<string>();
  for (const entry of entries) {
    const date = entry.logged_at.split('T')[0];
    dates.add(date);
  }
  
  return dates.size;
}

/**
 * Helper: Escape HTML
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateExportFilename(format: string, username?: string): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const user = username ? `${username}_` : '';
  return `moodmash_${user}export_${timestamp}.${format}`;
}
