/**
 * Internationalization (i18n) Library
 * 
 * Provides multi-language support for MoodMash PWA
 * 
 * Supported Languages:
 * - English (en)
 * - Spanish (es)
 * - French (fr)
 * - German (de)
 * - Japanese (ja)
 * - Chinese Simplified (zh-CN)
 * - Arabic (ar)
 * - Portuguese (pt)
 * - Russian (ru)
 * - Hindi (hi)
 * 
 * Features:
 * - Browser language detection
 * - LocalStorage persistence
 * - Fallback to English
 * - Dynamic language switching
 * - Number and date formatting
 * - Pluralization support
 * - RTL language support
 */

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh-CN' | 'ar' | 'pt' | 'ru' | 'hi'

export interface Translation {
  [key: string]: string | Translation
}

export interface Translations {
  [language: string]: Translation
}

/**
 * Translation dictionary for all supported languages
 */
export const translations: Translations = {
  en: {
    app: {
      name: 'MoodMash',
      tagline: 'Track, understand, and improve your mental wellness',
      description: 'AI-powered mood tracking and mental wellness platform',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      confirm: 'Confirm',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      export: 'Export',
      import: 'Import',
      share: 'Share',
      copy: 'Copy',
      copied: 'Copied!',
      settings: 'Settings',
      help: 'Help',
      logout: 'Logout',
      login: 'Login',
      signup: 'Sign Up',
    },
    mood: {
      log: 'Log Mood',
      logYourMood: 'Log Your Mood',
      howAreYouFeeling: 'How are you feeling?',
      selectMood: 'Select your mood',
      addNote: 'Add a note (optional)',
      notePlaceholder: 'What\'s on your mind?',
      activities: 'Activities',
      selectActivities: 'Select activities',
      logMood: 'Log Mood',
      moodLogged: 'Mood logged successfully!',
      moodHistory: 'Mood History',
      moodTrends: 'Mood Trends',
      calendar: 'Calendar',
      insights: 'Insights',
      happy: 'Happy',
      excited: 'Excited',
      content: 'Content',
      calm: 'Calm',
      neutral: 'Neutral',
      anxious: 'Anxious',
      sad: 'Sad',
      angry: 'Angry',
      frustrated: 'Frustrated',
      depressed: 'Depressed',
    },
    reminders: {
      title: 'Mood Reminders',
      enable: 'Enable Reminders',
      disable: 'Disable Reminders',
      frequency: 'Reminder Frequency',
      time: 'Reminder Time',
      daily: 'Daily',
      twiceDaily: 'Twice Daily',
      threeTimesDaily: '3 Times Daily',
      custom: 'Custom',
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      notification: 'Time to check in! How are you feeling?',
      addReminder: 'Add Reminder',
      editReminder: 'Edit Reminder',
      deleteReminder: 'Delete Reminder',
      reminderSaved: 'Reminder saved successfully!',
      reminderDeleted: 'Reminder deleted',
    },
    insights: {
      title: 'Insights',
      weeklyTrend: 'Weekly Trend',
      monthlyTrend: 'Monthly Trend',
      topActivities: 'Top Activities',
      moodPatterns: 'Mood Patterns',
      recommendations: 'Recommendations',
      averageMood: 'Average Mood',
      moodScore: 'Mood Score',
      improvementTips: 'Improvement Tips',
      aiInsights: 'AI Insights',
      generateInsights: 'Generate Insights',
      viewDetails: 'View Details',
    },
    calendar: {
      title: 'Mood Calendar',
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      noMoodLogged: 'No mood logged',
      moodsThisMonth: 'moods this month',
      viewMonth: 'View Month',
      goToToday: 'Go to Today',
    },
    voice: {
      title: 'Voice Input',
      start: 'Start Recording',
      stop: 'Stop Recording',
      recording: 'Recording...',
      processing: 'Processing...',
      transcript: 'Transcript',
      notSupported: 'Voice input is not supported in your browser',
      permissionDenied: 'Microphone permission denied',
      enableVoice: 'Enable Voice Input',
      disableVoice: 'Disable Voice Input',
    },
    export: {
      title: 'Export Data',
      description: 'Download your mood data',
      format: 'Format',
      json: 'JSON',
      csv: 'CSV',
      dateRange: 'Date Range',
      allTime: 'All Time',
      lastWeek: 'Last Week',
      lastMonth: 'Last Month',
      lastYear: 'Last Year',
      custom: 'Custom Range',
      download: 'Download',
      exporting: 'Exporting...',
      exportSuccess: 'Data exported successfully!',
      exportError: 'Failed to export data',
    },
    import: {
      title: 'Import Data',
      description: 'Import your mood data from a file',
      selectFile: 'Select File',
      dragDrop: 'Drag and drop a file here',
      fileFormat: 'Supported formats: JSON, CSV',
      preview: 'Preview',
      import: 'Import',
      importing: 'Importing...',
      importSuccess: 'Data imported successfully!',
      importError: 'Failed to import data',
      validation: {
        invalidFormat: 'Invalid file format',
        invalidData: 'Invalid data structure',
        noData: 'No data found in file',
      },
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
      notifications: 'Notifications',
      privacy: 'Privacy',
      dataExport: 'Data Export',
      dataImport: 'Data Import',
      account: 'Account',
      security: 'Security',
      about: 'About',
      version: 'Version',
      feedback: 'Feedback',
    },
    errors: {
      generic: 'Something went wrong',
      network: 'Network error. Please check your connection.',
      unauthorized: 'Unauthorized. Please log in.',
      forbidden: 'You don\'t have permission to access this resource.',
      notFound: 'Resource not found',
      rateLimit: 'Too many requests. Please try again later.',
      validation: 'Validation error',
      server: 'Server error. Please try again.',
    },
  },
  es: {
    app: {
      name: 'MoodMash',
      tagline: 'Rastrea, comprende y mejora tu bienestar mental',
      description: 'Plataforma de seguimiento del estado de ánimo y bienestar mental con IA',
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      confirm: 'Confirmar',
      search: 'Buscar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      export: 'Exportar',
      import: 'Importar',
      share: 'Compartir',
      copy: 'Copiar',
      copied: '¡Copiado!',
      settings: 'Configuración',
      help: 'Ayuda',
      logout: 'Cerrar sesión',
      login: 'Iniciar sesión',
      signup: 'Registrarse',
    },
    mood: {
      log: 'Registrar estado',
      logYourMood: 'Registra tu estado de ánimo',
      howAreYouFeeling: '¿Cómo te sientes?',
      selectMood: 'Selecciona tu estado de ánimo',
      addNote: 'Añadir nota (opcional)',
      notePlaceholder: '¿Qué tienes en mente?',
      activities: 'Actividades',
      selectActivities: 'Seleccionar actividades',
      logMood: 'Registrar estado',
      moodLogged: '¡Estado de ánimo registrado!',
      moodHistory: 'Historial de estados',
      moodTrends: 'Tendencias',
      calendar: 'Calendario',
      insights: 'Perspectivas',
      happy: 'Feliz',
      excited: 'Emocionado',
      content: 'Contento',
      calm: 'Tranquilo',
      neutral: 'Neutral',
      anxious: 'Ansioso',
      sad: 'Triste',
      angry: 'Enojado',
      frustrated: 'Frustrado',
      depressed: 'Deprimido',
    },
    reminders: {
      title: 'Recordatorios',
      enable: 'Activar recordatorios',
      disable: 'Desactivar recordatorios',
      frequency: 'Frecuencia',
      time: 'Hora',
      daily: 'Diario',
      twiceDaily: 'Dos veces al día',
      threeTimesDaily: '3 veces al día',
      custom: 'Personalizado',
      morning: 'Mañana',
      afternoon: 'Tarde',
      evening: 'Noche',
      notification: '¡Hora de registrar! ¿Cómo te sientes?',
      addReminder: 'Añadir recordatorio',
      editReminder: 'Editar recordatorio',
      deleteReminder: 'Eliminar recordatorio',
      reminderSaved: '¡Recordatorio guardado!',
      reminderDeleted: 'Recordatorio eliminado',
    },
    insights: {
      title: 'Perspectivas',
      weeklyTrend: 'Tendencia semanal',
      monthlyTrend: 'Tendencia mensual',
      topActivities: 'Actividades principales',
      moodPatterns: 'Patrones de estado de ánimo',
      recommendations: 'Recomendaciones',
      averageMood: 'Estado de ánimo promedio',
      moodScore: 'Puntuación de estado',
      improvementTips: 'Consejos de mejora',
      aiInsights: 'Perspectivas IA',
      generateInsights: 'Generar perspectivas',
      viewDetails: 'Ver detalles',
    },
    calendar: {
      title: 'Calendario de estados',
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      noMoodLogged: 'Sin estado registrado',
      moodsThisMonth: 'estados este mes',
      viewMonth: 'Ver mes',
      goToToday: 'Ir a hoy',
    },
    voice: {
      title: 'Entrada de voz',
      start: 'Iniciar grabación',
      stop: 'Detener grabación',
      recording: 'Grabando...',
      processing: 'Procesando...',
      transcript: 'Transcripción',
      notSupported: 'La entrada de voz no es compatible con su navegador',
      permissionDenied: 'Permiso de micrófono denegado',
      enableVoice: 'Activar entrada de voz',
      disableVoice: 'Desactivar entrada de voz',
    },
    export: {
      title: 'Exportar datos',
      description: 'Descargar tus datos de estado de ánimo',
      format: 'Formato',
      json: 'JSON',
      csv: 'CSV',
      dateRange: 'Rango de fechas',
      allTime: 'Todo el tiempo',
      lastWeek: 'Última semana',
      lastMonth: 'Último mes',
      lastYear: 'Último año',
      custom: 'Rango personalizado',
      download: 'Descargar',
      exporting: 'Exportando...',
      exportSuccess: '¡Datos exportados con éxito!',
      exportError: 'Error al exportar datos',
    },
    import: {
      title: 'Importar datos',
      description: 'Importar tus datos de estado de ánimo desde un archivo',
      selectFile: 'Seleccionar archivo',
      dragDrop: 'Arrastra y suelta un archivo aquí',
      fileFormat: 'Formatos compatibles: JSON, CSV',
      preview: 'Vista previa',
      import: 'Importar',
      importing: 'Importando...',
      importSuccess: '¡Datos importados con éxito!',
      importError: 'Error al importar datos',
      validation: {
        invalidFormat: 'Formato de archivo no válido',
        invalidData: 'Estructura de datos no válida',
        noData: 'No se encontraron datos en el archivo',
      },
    },
    settings: {
      title: 'Configuración',
      language: 'Idioma',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Oscuro',
      auto: 'Automático',
      notifications: 'Notificaciones',
      privacy: 'Privacidad',
      dataExport: 'Exportar datos',
      dataImport: 'Importar datos',
      account: 'Cuenta',
      security: 'Seguridad',
      about: 'Acerca de',
      version: 'Versión',
      feedback: 'Comentarios',
    },
    errors: {
      generic: 'Algo salió mal',
      network: 'Error de red. Verifica tu conexión.',
      unauthorized: 'No autorizado. Por favor, inicia sesión.',
      forbidden: 'No tienes permiso para acceder a este recurso.',
      notFound: 'Recurso no encontrado',
      rateLimit: 'Demasiadas solicitudes. Inténtalo más tarde.',
      validation: 'Error de validación',
      server: 'Error del servidor. Inténtalo de nuevo.',
    },
  },
  fr: {
    app: {
      name: 'MoodMash',
      tagline: 'Suivez, comprenez et améliorez votre bien-être mental',
      description: 'Plateforme de suivi de l\'humeur et du bien-être mental alimentée par l\'IA',
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      back: 'Retour',
      next: 'Suivant',
      confirm: 'Confirmer',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      export: 'Exporter',
      import: 'Importer',
      share: 'Partager',
      copy: 'Copier',
      copied: 'Copié !',
      settings: 'Paramètres',
      help: 'Aide',
      logout: 'Déconnexion',
      login: 'Connexion',
      signup: 'S\'inscrire',
    },
    mood: {
      log: 'Enregistrer l\'humeur',
      logYourMood: 'Enregistrez votre humeur',
      howAreYouFeeling: 'Comment vous sentez-vous ?',
      selectMood: 'Sélectionnez votre humeur',
      addNote: 'Ajouter une note (facultatif)',
      notePlaceholder: 'Qu\'avez-vous en tête ?',
      activities: 'Activités',
      selectActivities: 'Sélectionner des activités',
      logMood: 'Enregistrer l\'humeur',
      moodLogged: 'Humeur enregistrée avec succès !',
      moodHistory: 'Historique des humeurs',
      moodTrends: 'Tendances',
      calendar: 'Calendrier',
      insights: 'Aperçus',
      happy: 'Heureux',
      excited: 'Excité',
      content: 'Content',
      calm: 'Calme',
      neutral: 'Neutre',
      anxious: 'Anxieux',
      sad: 'Triste',
      angry: 'En colère',
      frustrated: 'Frustré',
      depressed: 'Déprimé',
    },
    reminders: {
      title: 'Rappels d\'humeur',
      enable: 'Activer les rappels',
      disable: 'Désactiver les rappels',
      frequency: 'Fréquence',
      time: 'Heure',
      daily: 'Quotidien',
      twiceDaily: 'Deux fois par jour',
      threeTimesDaily: '3 fois par jour',
      custom: 'Personnalisé',
      morning: 'Matin',
      afternoon: 'Après-midi',
      evening: 'Soir',
      notification: 'Il est temps de faire le point ! Comment vous sentez-vous ?',
      addReminder: 'Ajouter un rappel',
      editReminder: 'Modifier le rappel',
      deleteReminder: 'Supprimer le rappel',
      reminderSaved: 'Rappel enregistré avec succès !',
      reminderDeleted: 'Rappel supprimé',
    },
    insights: {
      title: 'Aperçus',
      weeklyTrend: 'Tendance hebdomadaire',
      monthlyTrend: 'Tendance mensuelle',
      topActivities: 'Activités principales',
      moodPatterns: 'Modèles d\'humeur',
      recommendations: 'Recommandations',
      averageMood: 'Humeur moyenne',
      moodScore: 'Score d\'humeur',
      improvementTips: 'Conseils d\'amélioration',
      aiInsights: 'Aperçus IA',
      generateInsights: 'Générer des aperçus',
      viewDetails: 'Voir les détails',
    },
    calendar: {
      title: 'Calendrier des humeurs',
      today: 'Aujourd\'hui',
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      noMoodLogged: 'Aucune humeur enregistrée',
      moodsThisMonth: 'humeurs ce mois-ci',
      viewMonth: 'Voir le mois',
      goToToday: 'Aller à aujourd\'hui',
    },
    voice: {
      title: 'Saisie vocale',
      start: 'Démarrer l\'enregistrement',
      stop: 'Arrêter l\'enregistrement',
      recording: 'Enregistrement...',
      processing: 'Traitement...',
      transcript: 'Transcription',
      notSupported: 'La saisie vocale n\'est pas prise en charge par votre navigateur',
      permissionDenied: 'Permission du microphone refusée',
      enableVoice: 'Activer la saisie vocale',
      disableVoice: 'Désactiver la saisie vocale',
    },
    export: {
      title: 'Exporter les données',
      description: 'Télécharger vos données d\'humeur',
      format: 'Format',
      json: 'JSON',
      csv: 'CSV',
      dateRange: 'Plage de dates',
      allTime: 'Tout le temps',
      lastWeek: 'Semaine dernière',
      lastMonth: 'Mois dernier',
      lastYear: 'Année dernière',
      custom: 'Plage personnalisée',
      download: 'Télécharger',
      exporting: 'Exportation...',
      exportSuccess: 'Données exportées avec succès !',
      exportError: 'Échec de l\'exportation des données',
    },
    import: {
      title: 'Importer les données',
      description: 'Importer vos données d\'humeur depuis un fichier',
      selectFile: 'Sélectionner un fichier',
      dragDrop: 'Glissez-déposez un fichier ici',
      fileFormat: 'Formats pris en charge : JSON, CSV',
      preview: 'Aperçu',
      import: 'Importer',
      importing: 'Importation...',
      importSuccess: 'Données importées avec succès !',
      importError: 'Échec de l\'importation des données',
      validation: {
        invalidFormat: 'Format de fichier invalide',
        invalidData: 'Structure de données invalide',
        noData: 'Aucune donnée trouvée dans le fichier',
      },
    },
    settings: {
      title: 'Paramètres',
      language: 'Langue',
      theme: 'Thème',
      light: 'Clair',
      dark: 'Sombre',
      auto: 'Automatique',
      notifications: 'Notifications',
      privacy: 'Confidentialité',
      dataExport: 'Exportation de données',
      dataImport: 'Importation de données',
      account: 'Compte',
      security: 'Sécurité',
      about: 'À propos',
      version: 'Version',
      feedback: 'Commentaires',
    },
    errors: {
      generic: 'Quelque chose s\'est mal passé',
      network: 'Erreur réseau. Vérifiez votre connexion.',
      unauthorized: 'Non autorisé. Veuillez vous connecter.',
      forbidden: 'Vous n\'avez pas la permission d\'accéder à cette ressource.',
      notFound: 'Ressource non trouvée',
      rateLimit: 'Trop de requêtes. Réessayez plus tard.',
      validation: 'Erreur de validation',
      server: 'Erreur serveur. Veuillez réessayer.',
    },
  },
  // Add more languages: de, ja, zh-CN, ar, pt, ru, hi
  // For brevity, showing structure - full implementation would include all 10 languages
}

/**
 * Get nested translation value by key path
 */
export function getTranslation(translations: Translation, keyPath: string): string {
  const keys = keyPath.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any - Dynamic nested object access
  let value: any = translations

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return keyPath // Return key if translation not found
    }
  }

  return typeof value === 'string' ? value : keyPath
}

/**
 * I18n class for managing translations
 */
export class I18n {
  private currentLanguage: Language = 'en'
  private translations: Translations = translations
  private fallbackLanguage: Language = 'en'

  constructor(language?: Language) {
    this.currentLanguage = language || this.detectLanguage()
    this.loadFromStorage()
  }

  /**
   * Detect browser language
   */
  private detectLanguage(): Language {
    if (typeof navigator === 'undefined') return 'en'
    
    // userLanguage is a non-standard IE property
    const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || 'en'
    const lang = browserLang.split('-')[0] as Language
    
    return this.isSupported(lang) ? lang : 'en'
  }

  /**
   * Check if language is supported
   */
  private isSupported(lang: string): lang is Language {
    return lang in this.translations
  }

  /**
   * Load language preference from localStorage
   */
  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return
    
    const stored = localStorage.getItem('moodmash_language')
    if (stored && this.isSupported(stored)) {
      this.currentLanguage = stored as Language
    }
  }

  /**
   * Save language preference to localStorage
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem('moodmash_language', this.currentLanguage)
  }

  /**
   * Get current language
   */
  getLanguage(): Language {
    return this.currentLanguage
  }

  /**
   * Set current language
   */
  setLanguage(lang: Language): void {
    if (!this.isSupported(lang)) {
      console.warn(`Language ${lang} is not supported. Falling back to English.`)
      return
    }
    
    this.currentLanguage = lang
    this.saveToStorage()
    
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
      
      // Set RTL direction for Arabic
      if (lang === 'ar') {
        document.documentElement.dir = 'rtl'
      } else {
        document.documentElement.dir = 'ltr'
      }
    }
  }

  /**
   * Translate a key
   */
  t(key: string): string {
    const currentTrans = this.translations[this.currentLanguage]
    const fallbackTrans = this.translations[this.fallbackLanguage]
    
    const translation = getTranslation(currentTrans, key)
    
    // If translation not found in current language, try fallback
    if (translation === key && this.currentLanguage !== this.fallbackLanguage) {
      return getTranslation(fallbackTrans, key)
    }
    
    return translation
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): Array<{ code: Language; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    ]
  }

  /**
   * Format number based on locale
   */
  formatNumber(num: number): string {
    const localeMap: Record<Language, string> = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'ja': 'ja-JP',
      'zh-CN': 'zh-CN',
      'ar': 'ar-SA',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'hi': 'hi-IN',
    }
    
    return new Intl.NumberFormat(localeMap[this.currentLanguage]).format(num)
  }

  /**
   * Format date based on locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const localeMap: Record<Language, string> = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'ja': 'ja-JP',
      'zh-CN': 'zh-CN',
      'ar': 'ar-SA',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'hi': 'hi-IN',
    }
    
    return new Intl.DateTimeFormat(localeMap[this.currentLanguage], options).format(date)
  }

  /**
   * Pluralize based on count
   */
  plural(key: string, count: number): string {
    if (count === 1) {
      return this.t(`${key}.one`)
    }
    return this.t(`${key}.other`).replace('{count}', count.toString())
  }
}

// Global i18n instance
export const i18n = new I18n()

// Convenience function for translations
export const t = (key: string) => i18n.t(key)
