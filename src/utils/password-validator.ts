/**
 * Strong Password Validator
 * Enforces password policy and checks against known breaches
 */

import * as crypto from 'crypto';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  score: number; // 0-100
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  checkBreaches: boolean;
}

// Default password policy
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  checkBreaches: true
};

/**
 * Validate password against policy
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  } else {
    score += 20;
    // Bonus for extra length
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  // Check uppercase letters
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }

  // Check lowercase letters
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }

  // Check numbers
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  } else if (/[0-9]/.test(password)) {
    score += 15;
  }

  // Check special characters
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  }

  // Check for common patterns (sequential, repeated)
  if (hasCommonPatterns(password)) {
    errors.push('Password contains common patterns (e.g., 123, abc, 111). Please choose a more unique password');
    score -= 20;
  }

  // Check character diversity
  const uniqueChars = new Set(password).size;
  const diversityRatio = uniqueChars / password.length;
  if (diversityRatio > 0.7) {
    score += 10; // Bonus for diverse characters
  }

  // Cap score at 100
  score = Math.max(0, Math.min(100, score));

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  if (score < 40) {
    strength = 'weak';
  } else if (score < 60) {
    strength = 'medium';
  } else if (score < 80) {
    strength = 'strong';
  } else {
    strength = 'very_strong';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score
  };
}

/**
 * Check if password contains common patterns
 * Only reject if patterns are significant (4+ chars) or dominate the password
 */
function hasCommonPatterns(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  
  // Only check for longer sequential patterns (4+ chars)
  // This allows "123" in "TestPass123!" but rejects "1234" or "password1234"
  if (/0123|1234|2345|3456|4567|5678|6789/.test(lowerPassword)) return true;
  
  // Sequential letters (4+ chars)
  if (/abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz/.test(lowerPassword)) return true;
  
  // Repeated characters (4 or more of the same character)
  if (/(.)\1\1\1/.test(password)) return true;
  
  // Common keyboard patterns (longer sequences)
  if (/qwerty|asdfgh|zxcvbn|qazwsx|qwertyuiop/.test(lowerPassword)) return true;
  
  return false;
}

/**
 * Check if password has been in a data breach using Have I Been Pwned API (k-anonymity model)
 * Uses k-anonymity: only sends first 5 chars of SHA-1 hash
 */
export async function checkPasswordBreach(password: string): Promise<{
  breached: boolean;
  breachCount: number;
  error?: string;
}> {
  try {
    // Create SHA-1 hash of password
    const hash = await sha1(password);
    const hashUpper = hash.toUpperCase();
    
    // Send only first 5 characters (k-anonymity)
    const prefix = hashUpper.substring(0, 5);
    const suffix = hashUpper.substring(5);
    
    // Query Have I Been Pwned API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'MoodMash-Password-Validator'
      }
    });
    
    if (!response.ok) {
      console.error('[Password] Breach check failed:', response.status);
      return { breached: false, breachCount: 0, error: 'Breach check service unavailable' };
    }
    
    const data = await response.text();
    const hashes = data.split('\n');
    
    // Look for our hash suffix in the results
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return {
          breached: true,
          breachCount: parseInt(count, 10)
        };
      }
    }
    
    return { breached: false, breachCount: 0 };
  } catch (error) {
    console.error('[Password] Breach check error:', error);
    return { breached: false, breachCount: 0, error: 'Failed to check password breach' };
  }
}

/**
 * SHA-1 hash for password breach checking
 */
async function sha1(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if password is in common password list
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', 'password1', 'password123', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
    'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
    'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
    'football', 'welcome', 'jesus', 'ninja', 'mustang', 'password1!',
    'admin', 'root', 'toor', 'pass', 'test', 'guest', 'info',
    'qwerty123', 'demo', 'default', 'changeme', 'temp', 'temporary'
  ];
  
  const lowerPassword = password.toLowerCase();
  return commonPasswords.some(common => lowerPassword.includes(common));
}

/**
 * Generate password strength description
 */
export function getPasswordStrengthDescription(result: PasswordValidationResult): string {
  switch (result.strength) {
    case 'weak':
      return '🔴 Weak - Your password is too simple and easy to guess';
    case 'medium':
      return '🟡 Medium - Your password is acceptable but could be stronger';
    case 'strong':
      return '🟢 Strong - Your password is secure';
    case 'very_strong':
      return '🟢 Very Strong - Excellent password!';
  }
}

/**
 * Generate password suggestions
 */
export function getPasswordSuggestions(errors: string[]): string[] {
  const suggestions: string[] = [];
  
  if (errors.some(e => e.includes('length'))) {
    suggestions.push('Use at least 12 characters for better security');
  }
  
  if (errors.some(e => e.includes('uppercase'))) {
    suggestions.push('Add uppercase letters (A-Z)');
  }
  
  if (errors.some(e => e.includes('lowercase'))) {
    suggestions.push('Add lowercase letters (a-z)');
  }
  
  if (errors.some(e => e.includes('number'))) {
    suggestions.push('Add numbers (0-9)');
  }
  
  if (errors.some(e => e.includes('special'))) {
    suggestions.push('Add special characters (!@#$%^&*)');
  }
  
  if (errors.some(e => e.includes('common patterns'))) {
    suggestions.push('Avoid sequential numbers or letters (123, abc)');
    suggestions.push('Avoid repeated characters (aaa, 111)');
  }
  
  suggestions.push('Consider using a passphrase (e.g., "Coffee@Sunrise2024!")');
  suggestions.push('Use a password manager to generate strong passwords');
  
  return suggestions;
}

/**
 * Check if password meets all requirements
 */
export async function validatePasswordWithBreachCheck(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): Promise<PasswordValidationResult & { breachCheck?: { breached: boolean; breachCount: number } }> {
  // First, validate password against policy
  const validation = validatePassword(password, policy);
  
  if (!validation.valid) {
    return validation;
  }
  
  // Check if password is in common list
  if (isCommonPassword(password)) {
    validation.valid = false;
    validation.errors.push('This password is too common. Please choose a more unique password');
    validation.strength = 'weak';
    validation.score = Math.min(validation.score, 20);
    return validation;
  }
  
  // Check against breach database if enabled
  if (policy.checkBreaches) {
    const breachCheck = await checkPasswordBreach(password);
    
    if (breachCheck.breached) {
      validation.valid = false;
      validation.errors.push(
        `This password has been found in ${breachCheck.breachCount.toLocaleString()} data breaches. ` +
        'Please choose a different password that has not been compromised'
      );
      validation.strength = 'weak';
      validation.score = 0;
      
      return {
        ...validation,
        breachCheck
      };
    }
    
    return {
      ...validation,
      breachCheck
    };
  }
  
  return validation;
}

/**
 * Generate a strong password (for testing/demo purposes)
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
