/**
 * Full-Text Search Utility
 * Uses SQLite FTS5 for efficient search across mood entries
 */

export interface SearchQuery {
  query: string;
  filters?: {
    emotion?: string[];
    dateFrom?: string;
    dateTo?: string;
    intensityMin?: number;
    intensityMax?: number;
    tags?: string[];
  };
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: number;
  emotion: string;
  intensity: number;
  notes: string;
  logged_at: string;
  tags: string[];
  highlight?: string;
  relevance: number;
}

export interface SearchStats {
  totalResults: number;
  searchTime: number;
  query: string;
}

/**
 * Build FTS5 search query with proper syntax
 */
export function buildSearchQuery(searchText: string): string {
  // Sanitize input
  const sanitized = searchText.trim().replace(/[^\w\s-]/g, '');
  
  if (!sanitized) {
    return '';
  }
  
  // Split into terms
  const terms = sanitized.split(/\s+/).filter(t => t.length > 0);
  
  if (terms.length === 0) {
    return '';
  }
  
  // Build FTS5 query
  // Support for phrase search, prefix matching, and boolean operators
  if (terms.length === 1) {
    return `${terms[0]}*`; // Prefix match
  }
  
  // Multiple terms - search for all terms
  return terms.map(t => `${t}*`).join(' ');
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(
  text: string,
  searchQuery: string,
  maxLength: number = 200
): string {
  if (!text || !searchQuery) {
    return text?.substring(0, maxLength) || '';
  }
  
  const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  let highlighted = text;
  
  // Find first occurrence
  let firstIndex = -1;
  for (const term of terms) {
    const index = text.toLowerCase().indexOf(term.replace('*', ''));
    if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
      firstIndex = index;
    }
  }
  
  // Extract context around first match
  if (firstIndex !== -1) {
    const start = Math.max(0, firstIndex - 50);
    const end = Math.min(text.length, firstIndex + maxLength - 50);
    highlighted = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
  } else {
    highlighted = text.substring(0, maxLength);
  }
  
  // Highlight terms
  for (const term of terms) {
    const cleanTerm = term.replace('*', '');
    const regex = new RegExp(`(${cleanTerm})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  }
  
  return highlighted;
}

/** Input type for search filters (from request body) */
interface SearchFiltersInput {
  emotion?: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
  intensityMin?: unknown;
  intensityMax?: unknown;
  tags?: unknown;
}

/** Type for SQL parameter values */
type SqlParamValue = string | number | boolean | null;

/**
 * Parse and validate search filters
 */
export function parseSearchFilters(filters: SearchFiltersInput | null | undefined): SearchQuery['filters'] {
  if (!filters) {
    return undefined;
  }
  
  return {
    emotion: Array.isArray(filters.emotion) ? filters.emotion : undefined,
    dateFrom: typeof filters.dateFrom === 'string' ? filters.dateFrom : undefined,
    dateTo: typeof filters.dateTo === 'string' ? filters.dateTo : undefined,
    intensityMin: typeof filters.intensityMin === 'number' ? filters.intensityMin : undefined,
    intensityMax: typeof filters.intensityMax === 'number' ? filters.intensityMax : undefined,
    tags: Array.isArray(filters.tags) ? filters.tags : undefined
  };
}

/**
 * Build SQL WHERE clause from filters
 */
export function buildFilterClause(filters?: SearchQuery['filters']): { clause: string; params: SqlParamValue[] } {
  if (!filters) {
    return { clause: '', params: [] };
  }
  
  const conditions: string[] = [];
  const params: SqlParamValue[] = [];
  
  if (filters.emotion && filters.emotion.length > 0) {
    const placeholders = filters.emotion.map(() => '?').join(',');
    conditions.push(`me.emotion IN (${placeholders})`);
    params.push(...filters.emotion);
  }
  
  if (filters.dateFrom) {
    conditions.push('me.logged_at >= ?');
    params.push(filters.dateFrom);
  }
  
  if (filters.dateTo) {
    conditions.push('me.logged_at <= ?');
    params.push(filters.dateTo);
  }
  
  if (filters.intensityMin !== undefined) {
    conditions.push('me.intensity >= ?');
    params.push(filters.intensityMin);
  }
  
  if (filters.intensityMax !== undefined) {
    conditions.push('me.intensity <= ?');
    params.push(filters.intensityMax);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    // JSON search for tags (SQLite JSON1 extension)
    const tagConditions = filters.tags.map(() => 
      "EXISTS (SELECT 1 FROM json_each(me.tags) WHERE json_each.value = ?)"
    );
    conditions.push(`(${tagConditions.join(' OR ')})`);
    params.push(...filters.tags);
  }
  
  if (conditions.length === 0) {
    return { clause: '', params: [] };
  }
  
  return {
    clause: 'WHERE ' + conditions.join(' AND '),
    params
  };
}

/**
 * Calculate search relevance score
 */
export function calculateRelevance(
  searchTerms: string[],
  text: string,
  emotion: string,
  tags: string[]
): number {
  let score = 0;
  const lowerText = text.toLowerCase();
  const lowerEmotion = emotion.toLowerCase();
  
  for (const term of searchTerms) {
    const cleanTerm = term.replace('*', '').toLowerCase();
    
    // Exact match in notes (high score)
    const occurrences = (lowerText.match(new RegExp(cleanTerm, 'g')) || []).length;
    score += occurrences * 10;
    
    // Match in emotion (medium score)
    if (lowerEmotion.includes(cleanTerm)) {
      score += 5;
    }
    
    // Match in tags (medium score)
    for (const tag of tags) {
      if (tag.toLowerCase().includes(cleanTerm)) {
        score += 5;
      }
    }
  }
  
  return score;
}

/**
 * Format search suggestions based on recent searches
 */
export function generateSearchSuggestions(
  recentSearches: string[],
  currentQuery: string
): string[] {
  if (!currentQuery || currentQuery.length < 2) {
    return recentSearches.slice(0, 5);
  }
  
  const lowerQuery = currentQuery.toLowerCase();
  const suggestions = recentSearches.filter(s => 
    s.toLowerCase().includes(lowerQuery)
  );
  
  return suggestions.slice(0, 5);
}

/**
 * Common search keywords and their meanings
 */
export const SearchKeywords = {
  emotions: [
    'happy', 'sad', 'anxious', 'calm', 'excited', 'stressed',
    'angry', 'peaceful', 'worried', 'content', 'frustrated', 'joy'
  ],
  activities: [
    'work', 'exercise', 'sleep', 'meditation', 'socializing',
    'hobby', 'family', 'friends', 'study', 'rest'
  ],
  intensities: [
    'mild', 'moderate', 'intense', 'severe', 'slight', 'strong'
  ]
};
