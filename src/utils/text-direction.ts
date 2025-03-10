/**
 * Check if a text string starts with an RTL character
 * @param text String to check
 * @returns True if text starts with RTL character
 */
export function isRTLText(text: string): boolean {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return false;
  }
  
  // First strong character determines direction
  // RTL Unicode ranges
  // Hebrew: \u0590-\u05FF
  // Arabic: \u0600-\u06FF
  // Syriac: \u0700-\u074F
  // Arabic Supplement: \u0750-\u077F
  // Arabic Extended: \u08A0-\u08FF
  // Arabic Presentation Forms: \uFB50-\uFDFF, \uFE70-\uFEFF
  
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  
  // Find first "strong" character (skip spaces, numbers, etc.)
  const trimmedText = text.trim();
  for (let i = 0; i < trimmedText.length; i++) {
    const char = trimmedText[i];
    if (rtlRegex.test(char)) {
      return true;
    }
    
    // If we found a strong LTR character first, then it's not RTL
    if (/[A-Za-z\u00C0-\u00FF\u0100-\u017F\u0180-\u024F]/.test(char)) {
      return false;
    }
  }
  
  // If no strong character found, default to LTR
  return false;
}

/**
 * Get the correct CSS direction based on locale
 * @param locale The locale to check
 * @returns 'rtl' or 'ltr'
 */
export function getDirectionFromLocale(locale?: string): 'rtl' | 'ltr' {
  if (!locale) return 'ltr';
  
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
}

/**
 * Adds CSS direction attributes for elements with mixed LTR and RTL content
 * @param text The text to check
 * @param defaultDirection The default direction to use if text is neutral
 * @returns CSS direction style object
 */
export function getBidiTextDirection(text: string, defaultDirection: 'rtl' | 'ltr' = 'ltr') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { direction: defaultDirection };
  }
  
  const isRtl = isRTLText(text);
  
  return {
    direction: isRtl ? 'rtl' : 'ltr',
    textAlign: isRtl !== (defaultDirection === 'rtl') ? 'start' : undefined,
  };
}

/**
 * Wraps text with Unicode bidirectional isolation characters
 * to prevent it from affecting surrounding text direction
 * 
 * @param text The text to isolate
 * @returns Text with bidirectional isolation
 */
export function isolateBidi(text: string): string {
  if (!text) return '';
  // FSI: First Strong Isolate
  // PDI: Pop Directional Isolate
  return `\u2068${text}\u2069`;
} 