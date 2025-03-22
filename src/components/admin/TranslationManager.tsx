import { useTranslation } from '@/utils/i18n/hooks';
import { Check, Download, Globe, RefreshCw, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface Translation {
  key: string;
  translation: string;
  isNew?: boolean;
  isMissing?: boolean;
}

interface TranslationManagerProps {
  className?: string;
}

interface LanguageData {
  code: string;
  name: string;
  completionPercentage: number;
}

const TRANSLATION_SERVICES = [
  { id: 'google', name: 'Google Translate' },
  { id: 'deepl', name: 'DeepL' },
  { id: 'openai', name: 'OpenAI' },
];

const TranslationManager: React.FC<TranslationManagerProps> = ({ className = '' }) => {
  const { t, locale } = useTranslation('admin');
  
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<LanguageData[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(locale);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('common');
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedService, setSelectedService] = useState('google');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch languages data
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('/api/translations/languages');
        const data = await response.json();
        setLanguages(data.languages || []);
      } catch (error) {
        console.error('Failed to fetch languages', error);
        setErrorMessage(t('translation_manager.error_fetching_languages'));
      }
    };

    fetchLanguages();
  }, []);

  // Fetch namespaces
  useEffect(() => {
    const fetchNamespaces = async () => {
      try {
        const response = await fetch('/api/translations/namespaces');
        const data = await response.json();
        setNamespaces(data.namespaces || []);
      } catch (error) {
        console.error('Failed to fetch namespaces', error);
        setErrorMessage(t('translation_manager.error_fetching_namespaces'));
      }
    };

    fetchNamespaces();
  }, []);

  // Fetch translations when language or namespace changes
  useEffect(() => {
    const fetchTranslations = async () => {
      if (!selectedLanguage || !selectedNamespace) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/translations/get?locale=${selectedLanguage}&namespace=${selectedNamespace}`);
        const data = await response.json();
        
        // Transform data from { key: translation } to array of { key, translation }
        const translationsArray = Object.entries(data.translations || {}).map(([key, translation]) => ({
          key,
          translation: translation as string,
          isMissing: translation === ''
        }));
        
        setTranslations(translationsArray);
      } catch (error) {
        console.error('Failed to fetch translations', error);
        setErrorMessage(t('translation_manager.error_fetching_translations'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [selectedLanguage, selectedNamespace]);

  // Set initial selected language from locale
  useEffect(() => {
    if (locale) {
      setSelectedLanguage(locale);
    }
  }, [locale]);

  // Generate missing translations - memoize this callback
  const generateMissingTranslations = useCallback(async () => {
    if (!selectedLanguage || !selectedNamespace) return;
    
    setIsGenerating(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/translations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locale: selectedLanguage,
          namespace: selectedNamespace,
          service: selectedService,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(t('translation_manager.translations_generated_successfully'));
        // Refresh translations
        const refreshResponse = await fetch(`/api/translations/get?locale=${selectedLanguage}&namespace=${selectedNamespace}`);
        const refreshData = await refreshResponse.json();
        
        // Transform data from { key: translation } to array of { key, translation }
        const translationsArray = Object.entries(refreshData.translations || {}).map(([key, translation]) => ({
          key,
          translation: translation as string,
          isMissing: translation === '',
          isNew: !translations.some(t => t.key === key) || translations.find(t => t.key === key)?.isMissing
        }));
        
        setTranslations(translationsArray);
      } else {
        setErrorMessage(data.error || t('translation_manager.error_generating_translations'));
      }
    } catch (error) {
      console.error('Failed to generate translations', error);
      setErrorMessage(t('translation_manager.error_generating_translations'));
    } finally {
      setIsGenerating(false);
    }
  }, [selectedLanguage, selectedNamespace, selectedService, translations, t]);

  // Save a single translation - memoize this callback
  const saveTranslation = useCallback(async (key: string, value: string) => {
    if (!selectedLanguage || !selectedNamespace) return;
    
    try {
      const response = await fetch('/api/translations/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locale: selectedLanguage,
          namespace: selectedNamespace,
          key,
          value,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTranslations(prev => prev.map(t => 
          t.key === key ? { ...t, translation: value, isMissing: false } : t
        ));
        setSuccessMessage(t('translation_manager.translation_saved'));
        
        // Clear the success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setErrorMessage(data.error || t('translation_manager.error_saving_translation'));
      }
    } catch (error) {
      console.error('Failed to save translation', error);
      setErrorMessage(t('translation_manager.error_saving_translation'));
    }
  }, [selectedLanguage, selectedNamespace, t]);

  // Start editing a translation
  const startEditing = useCallback((key: string, translation: string) => {
    setEditingKey(key);
    setEditValue(translation);
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingKey(null);
    setEditValue('');
  }, []);

  // Save the currently edited translation
  const saveEdit = useCallback(async () => {
    if (editingKey === null) return;
    
    await saveTranslation(editingKey, editValue);
    setEditingKey(null);
    setEditValue('');
  }, [editingKey, editValue, saveTranslation]);

  // Export translations as JSON
  const exportTranslations = () => {
    if (!translations.length) return;
    
    const translationsObj = translations.reduce((acc, { key, translation }) => {
      acc[key] = translation;
      return acc;
    }, {} as Record<string, string>);
    
    const jsonString = JSON.stringify(translationsObj, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNamespace}_${selectedLanguage}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter translations based on search query
  const filteredTranslations = searchQuery 
    ? translations.filter(t => 
        t.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.translation.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : translations;

  // Calculate statistics
  const totalKeys = translations.length;
  const missingKeys = translations.filter(t => t.isMissing).length;
  const completionPercentage = totalKeys ? Math.round(((totalKeys - missingKeys) / totalKeys) * 100) : 100;

  return (
    <div className={`translation-manager p-4 ${className}`}>
      <h1 className="text-2xl font-bold mb-6">{t('translation_manager.title')}</h1>
      
      {/* Success and error messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <Check size={16} className="mr-2" />
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <X size={16} className="mr-2" />
          {errorMessage}
          <button 
            className="ml-auto text-red-700 hover:text-red-900"
            onClick={() => setErrorMessage('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Language selector */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('translation_manager.language')}
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.completionPercentage}%)
              </option>
            ))}
          </select>
        </div>
        
        {/* Namespace selector */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('translation_manager.namespace')}
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
          >
            {namespaces.map((namespace) => (
              <option key={namespace} value={namespace}>
                {namespace}
              </option>
            ))}
          </select>
        </div>
        
        {/* Translation service selector */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('translation_manager.translation_service')}
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
          >
            {TRANSLATION_SERVICES.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Search input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('translation_manager.search')}
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full p-2 pl-10 border border-gray-300 rounded"
              placeholder={t('translation_manager.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-2.5 left-3 text-gray-400" size={16} />
          </div>
        </div>
      </div>
      
      {/* Actions toolbar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={generateMissingTranslations}
          disabled={isGenerating || !selectedLanguage || !selectedNamespace}
        >
          {isGenerating ? (
            <RefreshCw size={16} className="mr-2 animate-spin" />
          ) : (
            <Globe size={16} className="mr-2" />
          )}
          {t('translation_manager.generate_missing')}
        </button>
        
        <button
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={exportTranslations}
          disabled={!translations.length}
        >
          <Download size={16} className="mr-2" />
          {t('translation_manager.export')}
        </button>
      </div>
      
      {/* Completion status */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span>{t('translation_manager.completion')}: {completionPercentage}%</span>
          <span>
            {totalKeys - missingKeys}/{totalKeys} {t('translation_manager.keys_translated')}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Translations table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <RefreshCw size={24} className="animate-spin mr-2" />
          <p>{t('translation_manager.loading')}</p>
        </div>
      ) : (
        <>
          {filteredTranslations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="p-3 text-left">{t('translation_manager.key')}</th>
                    <th className="p-3 text-left">{t('translation_manager.translation')}</th>
                    <th className="p-3 text-center w-24">{t('translation_manager.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTranslations.map((item) => (
                    <tr 
                      key={item.key} 
                      className={`border-t border-gray-200 ${
                        item.isMissing ? 'bg-red-50 dark:bg-red-900/20' : 
                        item.isNew ? 'bg-green-50 dark:bg-green-900/20' : ''
                      }`}
                    >
                      <td className="p-3 align-top">
                        <div className="font-mono text-sm break-all">{item.key}</div>
                      </td>
                      <td className="p-3">
                        {editingKey === item.key ? (
                          <textarea
                            className="w-full p-2 border border-gray-300 rounded"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            rows={3}
                          />
                        ) : (
                          <div className="break-words min-h-[24px]">
                            {item.translation || (
                              <span className="text-red-500 italic">
                                {t('translation_manager.missing')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {editingKey === item.key ? (
                          <div className="flex space-x-1 justify-center">
                            <button
                              className="p-1 text-green-600 hover:text-green-800"
                              onClick={saveEdit}
                              title={t('translation_manager.save')}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="p-1 text-red-600 hover:text-red-800"
                              onClick={cancelEditing}
                              title={t('translation_manager.cancel')}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="p-1 text-blue-600 hover:text-blue-800"
                            onClick={() => startEditing(item.key, item.translation)}
                            title={t('translation_manager.edit')}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? (
                <p>{t('translation_manager.no_search_results')}</p>
              ) : (
                <p>{t('translation_manager.no_translations')}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TranslationManager;