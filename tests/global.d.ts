// Global type declarations for test environment

declare global {
  interface Window {
    i18n: {
      t: (key: string, params?: any) => string;
      changeLanguage: (lang: string) => Promise<void>;
      language: string;
      languages: string[];
      currentLanguage: string;
      translations: Record<string, any>;
    };
  }
}

export {};
