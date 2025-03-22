import TranslationManager from '@/components/admin/TranslationManager';
import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the fetch API
global.fetch = vi.fn();

// Mock translation hook
vi.mock('@/utils/i18n/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Add explicit translation for "missing"
      if (key === 'translation_manager.missing') return 'missing';
      return key.includes('.') ? key.split('.')[1] : key;
    },
    locale: 'en',
  }),
}));

// Mock the router
vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    asPath: '/',
    locale: 'en',
  }),
}));

// Remove the mock of TranslationManager since we want to test the actual component
// vi.mock('@/components/admin/TranslationManager', () => { ... });

describe('TranslationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    const mockLanguagesResponse = {
      json: vi.fn().mockResolvedValue({
        languages: [
          { code: 'en', name: 'English', completionPercentage: 100 },
          { code: 'fr', name: 'French', completionPercentage: 75 },
        ]
      }),
    };
    
    const mockNamespacesResponse = {
      json: vi.fn().mockResolvedValue({
        namespaces: ['common', 'profile']
      }),
    };
    
    const mockTranslationsResponse = {
      json: vi.fn().mockResolvedValue({
        translations: {
          'welcome': 'Welcome',
          'greeting': 'Hello, world!',
          'missing': '',
        }
      }),
    };
    
    // Set up the fetch mock to return different responses for different endpoints
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/translations/languages')) {
        return Promise.resolve(mockLanguagesResponse);
      }
      
      if (url.includes('/api/translations/namespaces')) {
        return Promise.resolve(mockNamespacesResponse);
      }
      
      if (url.includes('/api/translations/get')) {
        return Promise.resolve(mockTranslationsResponse);
      }
      
      return Promise.reject(new Error('Unknown API call'));
    });
  });
  
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });
  
  it('renders the component with initial state', async () => {
    render(<TranslationManager />);
    
    // Component should render
    expect(screen.getByText('title')).toBeInTheDocument();
    
    // Buttons should be present
    expect(screen.getByText('generate_missing')).toBeInTheDocument();
    expect(screen.getByText('export')).toBeInTheDocument();
  });
  
  it('displays translations after loading', async () => {
    render(<TranslationManager />);
    
    // Wait for API data to load
    await waitFor(() => {
      expect(screen.getByText('welcome')).toBeInTheDocument();
    });
    
    // Welcome key should be displayed
    expect(screen.getByText('welcome')).toBeInTheDocument();
    
    // Greeting key should be displayed
    expect(screen.getByText('greeting')).toBeInTheDocument();
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    
    // Wait for the missing key to appear
    await waitFor(() => {
      // Find the missing key in the table cell
      const missingRow = screen.getAllByText('missing').find(el => 
        el.closest('div')?.classList.contains('font-mono')
      );
      expect(missingRow).toBeInTheDocument();
    });
  });
  
  it('filters translations based on search query', async () => {
    render(<TranslationManager />);
    
    // Wait for API data to load
    await waitFor(() => {
      expect(screen.getByText('welcome')).toBeInTheDocument();
    });
    
    // Search for 'welcome'
    const searchInput = screen.getByPlaceholderText('search_placeholder');
    fireEvent.change(searchInput, { target: { value: 'welcome' } });
    
    // Should show welcome, but not greeting
    expect(screen.getByText('welcome')).toBeInTheDocument();
    expect(screen.queryByText('greeting')).not.toBeInTheDocument();
    
    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Should show all translations again
    await waitFor(() => {
      expect(screen.getByText('welcome')).toBeInTheDocument();
      expect(screen.getByText('greeting')).toBeInTheDocument();
    });
  });
  
  it('allows editing a translation', async () => {
    // Mock the update API
    const originalFetch = global.fetch;
    const fetchSpy = vi.fn().mockImplementation(async (url: string, options?: any) => {
      if (url === '/api/translations/update') {
        return {
          ok: true,
          json: async () => ({ success: true }),
        };
      }
      
      // Mock the refresh translations response after update
      if (url.includes('/api/translations/get')) {
        return {
          ok: true,
          json: async () => ({
            translations: {
              welcome: 'Welcome',
              greeting: options ? 'Updated greeting' : 'Hello, world!',
              missing: '',
            },
          }),
        };
      }
      
      // Default response for other calls
      return originalFetch(url, options);
    });
    
    (global.fetch as any).mockImplementation(fetchSpy);
    
    render(<TranslationManager />);
    
    // Wait for the initial translations to load
    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });
    
    // Wait for translations data to load
    await waitFor(() => {
      expect(screen.getByText('greeting')).toBeInTheDocument();
    });
    
    // Verify that greeting row exists
    const greetingRow = screen.getByText('greeting').closest('tr');
    expect(greetingRow).toBeInTheDocument();
    
    // Verify the edit button exists in the greeting row
    if (!greetingRow) throw new Error('Could not find greeting row');
    const editButton = within(greetingRow).getByTitle('edit');
    expect(editButton).toBeInTheDocument();
    
    // Click the edit button
    userEvent.click(editButton);
    
    // Find the save button in the greeting row
    await waitFor(() => {
      const saveButton = within(greetingRow).queryByTitle('save');
      expect(saveButton).toBeInTheDocument();
    });
    
    // Click save button to update the translation
    const saveButton = within(greetingRow).getByTitle('save');
    userEvent.click(saveButton);
    
    // Wait for the API call and response
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/translations/update',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
  
  it('generates missing translations when button is clicked', async () => {
    // Mock the generate API
    const mockGenerateResponse = {
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    
    const mockRefreshResponse = {
      json: vi.fn().mockResolvedValue({
        translations: {
          'welcome': 'Welcome',
          'greeting': 'Hello, world!',
          'missing': 'Generated Translation',
        }
      }),
    };
    
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/api/translations/generate') && options.method === 'POST') {
        return Promise.resolve(mockGenerateResponse);
      }
      
      if (url.includes('/api/translations/get') && options?.method !== 'POST') {
        // The first call is the initial load, second is after generate
        if ((global.fetch as any).mock.calls.filter((call: any[]) => call[0].includes('/api/translations/get')).length > 1) {
          return Promise.resolve(mockRefreshResponse);
        }
        
        return Promise.resolve({
          json: vi.fn().mockResolvedValue({
            translations: {
              'welcome': 'Welcome',
              'greeting': 'Hello, world!',
              'missing': '',
            }
          }),
        });
      }
      
      if (url.includes('/api/translations/languages')) {
        return Promise.resolve({
          json: vi.fn().mockResolvedValue({
            languages: [
              { code: 'en', name: 'English', completionPercentage: 100 },
              { code: 'fr', name: 'French', completionPercentage: 75 },
            ]
          }),
        });
      }
      
      if (url.includes('/api/translations/namespaces')) {
        return Promise.resolve({
          json: vi.fn().mockResolvedValue({
            namespaces: ['common', 'profile']
          }),
        });
      }
      
      return Promise.reject(new Error('Unknown API call'));
    });
    
    render(<TranslationManager />);
    
    // Wait for the missing key to appear
    await waitFor(() => {
      // Find the missing key in the table cell
      const missingRows = screen.getAllByText('missing');
      const missingKeyRow = missingRows.find(el => 
        el.closest('div')?.classList.contains('font-mono')
      );
      expect(missingKeyRow).toBeInTheDocument();
    });
    
    // Find the generate button and click it
    const generateButton = screen.getByText('generate_missing');
    fireEvent.click(generateButton);
    
    // Check that the API was called with the correct parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/translations/generate',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"locale":"en"'),
        })
      );
    });
    
    // Should show a success message
    expect(screen.getByText('translations_generated_successfully')).toBeInTheDocument();
    
    // The missing translation should now be generated
    await waitFor(() => {
      expect(screen.getByText('Generated Translation')).toBeInTheDocument();
    });
  });
}); 