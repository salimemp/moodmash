// MoodMash Internationalization (i18n) System

const translations = {
    en: {
        // Navigation
        nav_dashboard: 'Dashboard',
        nav_log_mood: 'Log Mood',
        nav_activities: 'Activities',
        nav_about: 'About',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'Intelligent Mood Tracking',
        loading_data: 'Loading your mood data...',
        
        // Stats cards
        stats_total_entries: 'Total Entries',
        stats_most_common: 'Most Common',
        stats_avg_intensity: 'Avg Intensity',
        stats_trend: 'Trend',
        stats_last_30_days: 'Last 30 days',
        stats_primary_emotion: 'Primary emotion',
        stats_out_of_5: 'Out of 5.0',
        stats_30_day_trend: '30-day trend',
        
        // Trends
        trend_improving: 'Improving',
        trend_declining: 'Declining',
        trend_stable: 'Stable',
        
        // Charts
        chart_mood_distribution: 'Mood Distribution',
        chart_intensity_trend: 'Recent Intensity Trend',
        
        // Insights
        insights_title: 'Insights & Recommendations',
        
        // Recent moods
        recent_moods_title: 'Recent Moods',
        recent_moods_empty: 'No mood entries yet.',
        recent_moods_log_first: 'Log your first mood!',
        intensity_label: 'Intensity:',
        
        // Log mood page
        log_mood_title: 'Log Your Mood',
        log_mood_subtitle: 'Track how you\'re feeling right now',
        
        // Form labels
        form_emotion_label: 'How are you feeling?',
        form_intensity_label: 'Intensity',
        form_intensity_current: 'Current:',
        form_intensity_low: 'Low',
        form_intensity_high: 'High',
        form_notes_label: 'Notes (Optional)',
        form_notes_placeholder: 'What\'s on your mind? Any triggers or events?',
        form_weather_label: 'Weather (Optional)',
        form_sleep_label: 'Sleep Hours (Optional)',
        form_sleep_placeholder: 'e.g., 7.5',
        form_activities_label: 'Activities (Optional)',
        form_social_label: 'Social Interaction (Optional)',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'Cancel',
        btn_save: 'Save Mood',
        btn_log_new: 'Log New',
        btn_start: 'Start',
        btn_close: 'Close',
        btn_retry: 'Retry',
        btn_view_dashboard: 'View Dashboard',
        btn_log_another: 'Log Another',
        btn_mark_done: 'Mark as Done',
        
        // Emotions
        emotion_happy: 'Happy',
        emotion_sad: 'Sad',
        emotion_anxious: 'Anxious',
        emotion_calm: 'Calm',
        emotion_energetic: 'Energetic',
        emotion_tired: 'Tired',
        emotion_angry: 'Angry',
        emotion_peaceful: 'Peaceful',
        emotion_stressed: 'Stressed',
        emotion_neutral: 'Neutral',
        
        // Weather
        weather_sunny: 'Sunny',
        weather_cloudy: 'Cloudy',
        weather_rainy: 'Rainy',
        weather_snowy: 'Snowy',
        weather_clear: 'Clear',
        
        // Social
        social_alone: 'Alone',
        social_friends: 'Friends',
        social_family: 'Family',
        social_colleagues: 'Colleagues',
        
        // Activities
        activity_work: 'Work',
        activity_exercise: 'Exercise',
        activity_social: 'Social',
        activity_rest: 'Rest',
        activity_hobby: 'Hobby',
        activity_meditation: 'Meditation',
        activity_reading: 'Reading',
        activity_outdoor: 'Outdoor',
        
        // Wellness activities page
        activities_title: 'Wellness Activities',
        activities_subtitle: 'Personalized activities to improve your mood and wellbeing',
        activities_filter: 'Filter by Emotion',
        activities_all: 'All Activities',
        activities_empty: 'No activities found for this filter.',
        activities_view_all: 'View All Activities',
        activities_helps_with: 'HELPS WITH:',
        activities_description: 'DESCRIPTION',
        activities_target_emotions: 'HELPS WITH THESE EMOTIONS',
        
        // Activity categories
        category_meditation: 'Meditation',
        category_exercise: 'Exercise',
        category_journaling: 'Journaling',
        category_social: 'Social',
        category_creative: 'Creative',
        
        // Difficulty
        difficulty_easy: 'Easy',
        difficulty_medium: 'Medium',
        difficulty_hard: 'Hard',
        
        // Success messages
        success_mood_saved: 'Mood Saved!',
        success_mood_saved_desc: 'Your mood entry has been recorded successfully.',
        success_activity_logged: 'Activity logged! Great job taking care of yourself.',
        
        // Error messages
        error_loading_failed: 'Failed to load dashboard data',
        error_mood_save_failed: 'Failed to save mood. Please try again.',
        error_select_emotion: 'Please select an emotion',
        error_activities_load_failed: 'Failed to load wellness activities',
        
        // About page
        about_title: 'About MoodMash',
        about_mission_title: 'Our Mission',
        about_features_title: 'Current Features (MVP v1.0)',
        about_future_title: 'Future Vision',
        about_privacy_title: 'Privacy & Security',
        
        // Modals
        modal_start_activity: 'Start Activity',
        modal_start_activity_desc: 'Ready to start',
        modal_start_activity_instructions: 'Find a comfortable space, eliminate distractions, and give yourself this time for wellbeing.',
        
        // Theme
        theme_light: 'Light Mode',
        theme_dark: 'Dark Mode',
        
        // PWA
        pwa_install_title: 'Install MoodMash',
        pwa_install_desc: 'Install our app for quick access and offline support',
        pwa_install_btn: 'Install',
        pwa_install_later: 'Maybe Later',
        
        // Time formats
        time_minutes: 'min',
        time_hours: 'h',
        time_sleep: 'sleep',
    },
    
    es: {
        // Navigation
        nav_dashboard: 'Panel',
        nav_log_mood: 'Registrar Ánimo',
        nav_activities: 'Actividades',
        nav_about: 'Acerca de',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'Seguimiento Inteligente del Estado de Ánimo',
        loading_data: 'Cargando tus datos de ánimo...',
        
        // Stats cards
        stats_total_entries: 'Total de Entradas',
        stats_most_common: 'Más Común',
        stats_avg_intensity: 'Intensidad Promedio',
        stats_trend: 'Tendencia',
        stats_last_30_days: 'Últimos 30 días',
        stats_primary_emotion: 'Emoción principal',
        stats_out_of_5: 'De 5.0',
        stats_30_day_trend: 'Tendencia de 30 días',
        
        // Trends
        trend_improving: 'Mejorando',
        trend_declining: 'Declinando',
        trend_stable: 'Estable',
        
        // Charts
        chart_mood_distribution: 'Distribución del Estado de Ánimo',
        chart_intensity_trend: 'Tendencia de Intensidad Reciente',
        
        // Insights
        insights_title: 'Perspectivas y Recomendaciones',
        
        // Recent moods
        recent_moods_title: 'Estados de Ánimo Recientes',
        recent_moods_empty: 'Aún no hay entradas de estado de ánimo.',
        recent_moods_log_first: '¡Registra tu primer estado de ánimo!',
        intensity_label: 'Intensidad:',
        
        // Log mood page
        log_mood_title: 'Registrar tu Estado de Ánimo',
        log_mood_subtitle: 'Registra cómo te sientes ahora mismo',
        
        // Form labels
        form_emotion_label: '¿Cómo te sientes?',
        form_intensity_label: 'Intensidad',
        form_intensity_current: 'Actual:',
        form_intensity_low: 'Baja',
        form_intensity_high: 'Alta',
        form_notes_label: 'Notas (Opcional)',
        form_notes_placeholder: '¿Qué piensas? ¿Hay algún desencadenante o evento?',
        form_weather_label: 'Clima (Opcional)',
        form_sleep_label: 'Horas de Sueño (Opcional)',
        form_sleep_placeholder: 'ej., 7.5',
        form_activities_label: 'Actividades (Opcional)',
        form_social_label: 'Interacción Social (Opcional)',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'Cancelar',
        btn_save: 'Guardar Estado de Ánimo',
        btn_log_new: 'Registrar Nuevo',
        btn_start: 'Comenzar',
        btn_close: 'Cerrar',
        btn_retry: 'Reintentar',
        btn_view_dashboard: 'Ver Panel',
        btn_log_another: 'Registrar Otro',
        btn_mark_done: 'Marcar como Hecho',
        
        // Emotions
        emotion_happy: 'Feliz',
        emotion_sad: 'Triste',
        emotion_anxious: 'Ansioso',
        emotion_calm: 'Tranquilo',
        emotion_energetic: 'Enérgico',
        emotion_tired: 'Cansado',
        emotion_angry: 'Enojado',
        emotion_peaceful: 'Pacífico',
        emotion_stressed: 'Estresado',
        emotion_neutral: 'Neutral',
        
        // Weather
        weather_sunny: 'Soleado',
        weather_cloudy: 'Nublado',
        weather_rainy: 'Lluvioso',
        weather_snowy: 'Nevado',
        weather_clear: 'Despejado',
        
        // Social
        social_alone: 'Solo',
        social_friends: 'Amigos',
        social_family: 'Familia',
        social_colleagues: 'Colegas',
        
        // Activities
        activity_work: 'Trabajo',
        activity_exercise: 'Ejercicio',
        activity_social: 'Social',
        activity_rest: 'Descanso',
        activity_hobby: 'Pasatiempo',
        activity_meditation: 'Meditación',
        activity_reading: 'Lectura',
        activity_outdoor: 'Aire Libre',
        
        // Wellness activities page
        activities_title: 'Actividades de Bienestar',
        activities_subtitle: 'Actividades personalizadas para mejorar tu estado de ánimo y bienestar',
        activities_filter: 'Filtrar por Emoción',
        activities_all: 'Todas las Actividades',
        activities_empty: 'No se encontraron actividades para este filtro.',
        activities_view_all: 'Ver Todas las Actividades',
        activities_helps_with: 'AYUDA CON:',
        activities_description: 'DESCRIPCIÓN',
        activities_target_emotions: 'AYUDA CON ESTAS EMOCIONES',
        
        // Activity categories
        category_meditation: 'Meditación',
        category_exercise: 'Ejercicio',
        category_journaling: 'Diario',
        category_social: 'Social',
        category_creative: 'Creativo',
        
        // Difficulty
        difficulty_easy: 'Fácil',
        difficulty_medium: 'Medio',
        difficulty_hard: 'Difícil',
        
        // Success messages
        success_mood_saved: '¡Estado de Ánimo Guardado!',
        success_mood_saved_desc: 'Tu entrada de estado de ánimo se ha registrado correctamente.',
        success_activity_logged: '¡Actividad registrada! Buen trabajo cuidando de ti mismo.',
        
        // Error messages
        error_loading_failed: 'Error al cargar los datos del panel',
        error_mood_save_failed: 'Error al guardar el estado de ánimo. Por favor, inténtalo de nuevo.',
        error_select_emotion: 'Por favor selecciona una emoción',
        error_activities_load_failed: 'Error al cargar las actividades de bienestar',
        
        // Theme
        theme_light: 'Modo Claro',
        theme_dark: 'Modo Oscuro',
        
        // PWA
        pwa_install_title: 'Instalar MoodMash',
        pwa_install_desc: 'Instala nuestra aplicación para acceso rápido y soporte sin conexión',
        pwa_install_btn: 'Instalar',
        pwa_install_later: 'Tal vez Más Tarde',
        
        // Time formats
        time_minutes: 'min',
        time_hours: 'h',
        time_sleep: 'sueño',
    },
    
    zh: {
        // Navigation
        nav_dashboard: '仪表板',
        nav_log_mood: '记录心情',
        nav_activities: '活动',
        nav_about: '关于',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: '智能心情追踪',
        loading_data: '正在加载您的心情数据...',
        
        // Stats cards
        stats_total_entries: '总条目',
        stats_most_common: '最常见',
        stats_avg_intensity: '平均强度',
        stats_trend: '趋势',
        stats_last_30_days: '最近30天',
        stats_primary_emotion: '主要情绪',
        stats_out_of_5: '满分5.0',
        stats_30_day_trend: '30天趋势',
        
        // Trends
        trend_improving: '改善中',
        trend_declining: '下降中',
        trend_stable: '稳定',
        
        // Charts
        chart_mood_distribution: '心情分布',
        chart_intensity_trend: '近期强度趋势',
        
        // Insights
        insights_title: '见解与建议',
        
        // Recent moods
        recent_moods_title: '最近的心情',
        recent_moods_empty: '还没有心情记录。',
        recent_moods_log_first: '记录您的第一个心情！',
        intensity_label: '强度：',
        
        // Log mood page
        log_mood_title: '记录您的心情',
        log_mood_subtitle: '记录您现在的感受',
        
        // Form labels
        form_emotion_label: '您感觉如何？',
        form_intensity_label: '强度',
        form_intensity_current: '当前：',
        form_intensity_low: '低',
        form_intensity_high: '高',
        form_notes_label: '备注（可选）',
        form_notes_placeholder: '您在想什么？有什么触发因素或事件吗？',
        form_weather_label: '天气（可选）',
        form_sleep_label: '睡眠时间（可选）',
        form_sleep_placeholder: '例如，7.5',
        form_activities_label: '活动（可选）',
        form_social_label: '社交互动（可选）',
        form_required: '*',
        
        // Buttons
        btn_cancel: '取消',
        btn_save: '保存心情',
        btn_log_new: '记录新的',
        btn_start: '开始',
        btn_close: '关闭',
        btn_retry: '重试',
        btn_view_dashboard: '查看仪表板',
        btn_log_another: '记录另一个',
        btn_mark_done: '标记为完成',
        
        // Emotions
        emotion_happy: '快乐',
        emotion_sad: '悲伤',
        emotion_anxious: '焦虑',
        emotion_calm: '平静',
        emotion_energetic: '精力充沛',
        emotion_tired: '疲倦',
        emotion_angry: '生气',
        emotion_peaceful: '平和',
        emotion_stressed: '压力大',
        emotion_neutral: '中性',
        
        // Weather
        weather_sunny: '晴天',
        weather_cloudy: '多云',
        weather_rainy: '下雨',
        weather_snowy: '下雪',
        weather_clear: '晴朗',
        
        // Social
        social_alone: '独自',
        social_friends: '朋友',
        social_family: '家人',
        social_colleagues: '同事',
        
        // Activities
        activity_work: '工作',
        activity_exercise: '运动',
        activity_social: '社交',
        activity_rest: '休息',
        activity_hobby: '爱好',
        activity_meditation: '冥想',
        activity_reading: '阅读',
        activity_outdoor: '户外',
        
        // Wellness activities page
        activities_title: '健康活动',
        activities_subtitle: '个性化活动，改善您的心情和健康',
        activities_filter: '按情绪筛选',
        activities_all: '所有活动',
        activities_empty: '未找到此筛选的活动。',
        activities_view_all: '查看所有活动',
        activities_helps_with: '有助于：',
        activities_description: '描述',
        activities_target_emotions: '有助于这些情绪',
        
        // Activity categories
        category_meditation: '冥想',
        category_exercise: '运动',
        category_journaling: '日记',
        category_social: '社交',
        category_creative: '创意',
        
        // Difficulty
        difficulty_easy: '简单',
        difficulty_medium: '中等',
        difficulty_hard: '困难',
        
        // Success messages
        success_mood_saved: '心情已保存！',
        success_mood_saved_desc: '您的心情记录已成功保存。',
        success_activity_logged: '活动已记录！做得好，照顾好自己。',
        
        // Error messages
        error_loading_failed: '加载仪表板数据失败',
        error_mood_save_failed: '保存心情失败。请重试。',
        error_select_emotion: '请选择一个情绪',
        error_activities_load_failed: '加载健康活动失败',
        
        // Theme
        theme_light: '浅色模式',
        theme_dark: '深色模式',
        
        // PWA
        pwa_install_title: '安装 MoodMash',
        pwa_install_desc: '安装我们的应用程序以快速访问和离线支持',
        pwa_install_btn: '安装',
        pwa_install_later: '稍后再说',
        
        // Time formats
        time_minutes: '分钟',
        time_hours: '小时',
        time_sleep: '睡眠',
    },
    
    fr: {
        // Navigation
        nav_dashboard: 'Tableau de bord',
        nav_log_mood: 'Enregistrer l\'humeur',
        nav_activities: 'Activités',
        nav_about: 'À propos',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'Suivi Intelligent de l\'Humeur',
        loading_data: 'Chargement de vos données d\'humeur...',
        
        // Stats cards
        stats_total_entries: 'Total des Entrées',
        stats_most_common: 'Plus Commun',
        stats_avg_intensity: 'Intensité Moyenne',
        stats_trend: 'Tendance',
        stats_last_30_days: '30 derniers jours',
        stats_primary_emotion: 'Émotion principale',
        stats_out_of_5: 'Sur 5.0',
        stats_30_day_trend: 'Tendance sur 30 jours',
        
        // Trends
        trend_improving: 'Amélioration',
        trend_declining: 'Déclin',
        trend_stable: 'Stable',
        
        // Charts
        chart_mood_distribution: 'Distribution de l\'Humeur',
        chart_intensity_trend: 'Tendance d\'Intensité Récente',
        
        // Insights
        insights_title: 'Perspectives et Recommandations',
        
        // Recent moods
        recent_moods_title: 'Humeurs Récentes',
        recent_moods_empty: 'Aucune entrée d\'humeur pour le moment.',
        recent_moods_log_first: 'Enregistrez votre première humeur !',
        intensity_label: 'Intensité :',
        
        // Log mood page
        log_mood_title: 'Enregistrer votre Humeur',
        log_mood_subtitle: 'Suivez comment vous vous sentez en ce moment',
        
        // Form labels
        form_emotion_label: 'Comment vous sentez-vous ?',
        form_intensity_label: 'Intensité',
        form_intensity_current: 'Actuel :',
        form_intensity_low: 'Faible',
        form_intensity_high: 'Élevé',
        form_notes_label: 'Notes (Optionnel)',
        form_notes_placeholder: 'Qu\'avez-vous en tête ? Des déclencheurs ou événements ?',
        form_weather_label: 'Météo (Optionnel)',
        form_sleep_label: 'Heures de Sommeil (Optionnel)',
        form_sleep_placeholder: 'ex., 7.5',
        form_activities_label: 'Activités (Optionnel)',
        form_social_label: 'Interaction Sociale (Optionnel)',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'Annuler',
        btn_save: 'Enregistrer l\'Humeur',
        btn_log_new: 'Enregistrer Nouveau',
        btn_start: 'Commencer',
        btn_close: 'Fermer',
        btn_retry: 'Réessayer',
        btn_view_dashboard: 'Voir le Tableau de Bord',
        btn_log_another: 'Enregistrer un Autre',
        btn_mark_done: 'Marquer comme Terminé',
        
        // Emotions
        emotion_happy: 'Heureux',
        emotion_sad: 'Triste',
        emotion_anxious: 'Anxieux',
        emotion_calm: 'Calme',
        emotion_energetic: 'Énergique',
        emotion_tired: 'Fatigué',
        emotion_angry: 'En Colère',
        emotion_peaceful: 'Paisible',
        emotion_stressed: 'Stressé',
        emotion_neutral: 'Neutre',
        
        // Weather
        weather_sunny: 'Ensoleillé',
        weather_cloudy: 'Nuageux',
        weather_rainy: 'Pluvieux',
        weather_snowy: 'Neigeux',
        weather_clear: 'Clair',
        
        // Social
        social_alone: 'Seul',
        social_friends: 'Amis',
        social_family: 'Famille',
        social_colleagues: 'Collègues',
        
        // Activities
        activity_work: 'Travail',
        activity_exercise: 'Exercice',
        activity_social: 'Social',
        activity_rest: 'Repos',
        activity_hobby: 'Loisir',
        activity_meditation: 'Méditation',
        activity_reading: 'Lecture',
        activity_outdoor: 'Extérieur',
        
        // Wellness activities page
        activities_title: 'Activités de Bien-être',
        activities_subtitle: 'Activités personnalisées pour améliorer votre humeur et bien-être',
        activities_filter: 'Filtrer par Émotion',
        activities_all: 'Toutes les Activités',
        activities_empty: 'Aucune activité trouvée pour ce filtre.',
        activities_view_all: 'Voir Toutes les Activités',
        activities_helps_with: 'AIDE AVEC :',
        activities_description: 'DESCRIPTION',
        activities_target_emotions: 'AIDE AVEC CES ÉMOTIONS',
        
        // Activity categories
        category_meditation: 'Méditation',
        category_exercise: 'Exercice',
        category_journaling: 'Journal',
        category_social: 'Social',
        category_creative: 'Créatif',
        
        // Difficulty
        difficulty_easy: 'Facile',
        difficulty_medium: 'Moyen',
        difficulty_hard: 'Difficile',
        
        // Success messages
        success_mood_saved: 'Humeur Enregistrée !',
        success_mood_saved_desc: 'Votre entrée d\'humeur a été enregistrée avec succès.',
        success_activity_logged: 'Activité enregistrée ! Bon travail en prenant soin de vous.',
        
        // Error messages
        error_loading_failed: 'Échec du chargement des données du tableau de bord',
        error_mood_save_failed: 'Échec de l\'enregistrement de l\'humeur. Veuillez réessayer.',
        error_select_emotion: 'Veuillez sélectionner une émotion',
        error_activities_load_failed: 'Échec du chargement des activités de bien-être',
        
        // Theme
        theme_light: 'Mode Clair',
        theme_dark: 'Mode Sombre',
        
        // PWA
        pwa_install_title: 'Installer MoodMash',
        pwa_install_desc: 'Installez notre application pour un accès rapide et un support hors ligne',
        pwa_install_btn: 'Installer',
        pwa_install_later: 'Peut-être Plus Tard',
        
        // Time formats
        time_minutes: 'min',
        time_hours: 'h',
        time_sleep: 'sommeil',
    }
};

// i18n Manager
class I18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || this.detectLanguage();
        this.translations = translations;
    }
    
    detectLanguage() {
        const browserLang = navigator.language.split('-')[0];
        return translations[browserLang] ? browserLang : 'en';
    }
    
    setLanguage(lang) {
        if (translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('language', lang);
            window.location.reload(); // Reload to apply translations
        }
    }
    
    t(key) {
        return this.translations[this.currentLanguage][key] || key;
    }
    
    getAvailableLanguages() {
        return [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'zh', name: '中文', flag: '🇨🇳' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' }
        ];
    }
}

// Export for use in other scripts
const i18n = new I18n();
