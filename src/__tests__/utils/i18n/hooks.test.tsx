import { useTranslation } from '@/utils/i18n/hooks';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock router value that we'll modify for tests
let mockRouterLocale = 'en';

// Mock the i18next library
vi.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
      exists: (key: string) => key !== 'missing.key',
    }
  })
}));

// Mock the next/router
vi.mock('next/router', () => ({
  useRouter: () => ({
    locale: mockRouterLocale,
    push: vi.fn(),
    asPath: '/',
    pathname: '/',
    query: {},
  })
}));

// Create a wrapper component to test the hook
const TestHookComponent: React.FC<{ rtlLocale?: boolean }> = ({ rtlLocale = false }) => {
  // Update the mock router locale before rendering
  mockRouterLocale = rtlLocale ? 'ar' : 'en';
  
  const { 
    t, 
    isRTL, 
    formatDate, 
    formatNumber, 
    formatCurrency, 
    formatPercent 
  } = useTranslation();
  
  return (
    <div>
      <div data-testid="translation">{t('test.key')}</div>
      <div data-testid="rtl">{isRTL.toString()}</div>
      <div data-testid="date">{formatDate(new Date('2023-01-01'))}</div>
      <div data-testid="number">{formatNumber(1234.56)}</div>
      <div data-testid="currency">{formatCurrency(1234.56, 'USD')}</div>
      <div data-testid="percent">{formatPercent(0.5)}</div>
    </div>
  );
};

describe('i18n Hooks', () => {
  const originalDocumentDir = document.dir;
  
  beforeEach(() => {
    document.dir = 'ltr';
    localStorage.clear();
    mockRouterLocale = 'en';
  });
  
  afterEach(() => {
    document.dir = originalDocumentDir;
    vi.clearAllMocks();
  });
  
  describe('useTranslation', () => {
    it('should provide translation function', () => {
      render(<TestHookComponent />);
      expect(screen.getByTestId('translation')).toHaveTextContent('test.key');
    });
    
    it('should detect if using RTL language correctly', () => {
      // Clear previous renders
      document.body.innerHTML = '';
      
      // Test LTR language
      const ltrResult = render(<TestHookComponent />);
      expect(ltrResult.getByTestId('rtl')).toHaveTextContent('false');
      
      // Clean up
      ltrResult.unmount();
      
      // Test RTL language
      const rtlResult = render(<TestHookComponent rtlLocale={true} />);
      expect(rtlResult.getByTestId('rtl')).toHaveTextContent('true');
    });
    
    it('should format dates correctly', () => {
      render(<TestHookComponent />);
      const dateElement = screen.getByTestId('date');
      expect(dateElement).toHaveTextContent(/[0-9]/); // Should contain numbers
    });
    
    it('should format numbers correctly', () => {
      render(<TestHookComponent />);
      const numberElement = screen.getByTestId('number');
      expect(numberElement.textContent).toContain('1');
      expect(numberElement.textContent).toContain('234');
    });
    
    it('should format currency correctly', () => {
      render(<TestHookComponent />);
      const currencyElement = screen.getByTestId('currency');
      expect(currencyElement.textContent).toContain('1');
      expect(
        currencyElement.textContent?.includes('$') || 
        currencyElement.textContent?.includes('USD')
      ).toBe(true);
    });
    
    it('should format percentages correctly', () => {
      render(<TestHookComponent />);
      const percentElement = screen.getByTestId('percent');
      expect(percentElement.textContent).toContain('%');
    });
  });
}); 