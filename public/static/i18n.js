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
        
        // Onboarding
        onboarding_welcome_title: 'Welcome to MoodMash',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        
        onboarding_free_title: 'Free Tier',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        
        onboarding_premium_title: 'Premium Tier',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        
        onboarding_start_title: 'Ready to Begin?',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        
        onboarding_next: 'Next',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_get_started: 'Get Started',
        onboarding_slide: 'Slide',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        
        // Chatbot
        chatbot_title: 'Mood',
        chatbot_subtitle: 'How can I help you?',
        chatbot_toggle: 'Toggle chatbot',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_send: 'Send message',
        
        chatbot_greeting1: 'Hello! 👋 I\'m Mood, your personal assistant. How can I help you today?',
        chatbot_greeting2: 'Hi there! I\'m Mood. I\'m here to help you with any questions about MoodMash.',
        chatbot_greeting3: 'Welcome! I\'m Mood. Ask me anything about mood tracking, features, or premium benefits.',
        
        chatbot_quick_help: 'How to use?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_quick_languages: 'Change language?',
        
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        
        chatbot_default1: 'I\'m not sure about that. Try asking about mood logging, premium features, or languages.',
        chatbot_default2: 'Hmm, I don\'t have information on that. Feel free to ask about how MoodMash works!',
        chatbot_default3: 'I\'d love to help! Try asking about features, premium benefits, or getting started.',
        
        // Accessibility
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_large: 'Large font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_read: 'Toggle read aloud',
        
        // Authentication
        auth_login: 'Login',
        auth_logout: 'Logout',
        auth_signup: 'Sign Up',
        auth_profile: 'Profile',
        auth_settings: 'Settings',
        auth_user_menu: 'User menu',
        auth_login_success: 'Welcome back!',
        auth_logout_success: 'Logged out successfully',
        auth_error: 'Authentication failed',
        auth_required: 'Please login to continue',
        auth_premium_required: 'This feature requires Premium',
        auth_upgrade_premium: 'Upgrade to Premium',
        pwa_install_later: 'Maybe Later',
        
        // Time formats
        time_minutes: 'min',
        time_hours: 'h',
        time_sleep: 'sleep',
        
        // Express Your Mood (NEW)
        express_title: 'Express Your Mood',
        express_subtitle: 'How do you want to express yourself today?',
        express_mode_emoji: 'Emoji',
        express_mode_color: 'Color',
        express_mode_intensity: 'Intensity',
        express_mode_text: 'Text',
        express_mode_voice: 'Voice',
        express_emoji_label: 'Select an emoji that represents your mood',
        express_color_label: 'Choose a color that matches your feeling',
        express_intensity_label: 'Adjust intensity with the slider',
        express_text_label: 'Write about your feelings',
        express_text_placeholder: 'How are you feeling today? Describe your emotions...',
        express_voice_label: 'Record a voice note about your mood',
        express_voice_start: 'Start Recording',
        express_voice_stop: 'Stop Recording',
        express_voice_recording: 'Recording...',
        express_privacy_label: 'Privacy',
        express_privacy_private: 'Private',
        express_privacy_friends: 'Friends Only',
        express_privacy_public: 'Public',
        express_tags_label: 'Tags (Optional)',
        express_tags_placeholder: 'Add tags...',
        express_share_label: 'Share',
        express_share_copy: 'Copy Link',
        express_share_copied: 'Link copied!',
        express_save_success: 'Your mood has been expressed!',
        express_save_error: 'Failed to save mood',
        
        // Daily Mood Insights (NEW)
        insights_page_title: 'Mood Insights',
        insights_page_subtitle: 'Discover patterns in your emotional journey',
        insights_dominant_mood: 'Dominant Mood',
        insights_mood_stability: 'Mood Stability',
        insights_avg_intensity: 'Average Intensity',
        insights_total_entries: 'Total Entries',
        insights_timeline_title: 'Mood Timeline',
        insights_timeline_subtitle: 'Your emotional journey over time',
        insights_period_daily: 'Daily',
        insights_period_weekly: 'Weekly',
        insights_period_monthly: 'Monthly',
        insights_no_data: 'Not enough data yet. Log more moods!',
        insights_stability_high: 'High Stability',
        insights_stability_medium: 'Medium Stability',
        insights_stability_low: 'Low Stability',
        insights_recommendation: 'Recommendation',
        insights_export: 'Export Data',
        insights_share: 'Share Insights',
        
        // Quick Mood Select (NEW)
        quick_select_title: 'Quick Mood Log',
        quick_select_subtitle: 'Tap to log your mood instantly',
        quick_select_recently_used: 'Recently Used',
        quick_select_all_emotions: 'All Emotions',
        quick_select_saved: 'Mood logged!',
        quick_select_error: 'Failed to log mood',
        
        // AI Wellness Tips (NEW)
        wellness_tips_title: 'Personalized Wellness Tips',
        wellness_tips_subtitle: 'Get AI-powered recommendations based on your mood',
        wellness_tips_mood_label: 'Select Your Current Mood',
        wellness_tips_category_label: 'Choose Wellness Categories',
        wellness_tips_generate: 'Generate Tips',
        wellness_tips_generating: 'Generating personalized tips...',
        wellness_tips_helpful: 'Helpful',
        wellness_tips_not_helpful: 'Not Helpful',
        wellness_tips_save: 'Save',
        wellness_tips_saved: 'Tip saved!',
        wellness_tips_thanks: 'Thanks for your feedback!',
        wellness_tips_select_required: 'Please select a mood and at least one category',
        wellness_tips_error: 'Failed to generate tips. Please try again.',
        category_mindfulness: 'Mindfulness',
        category_exercise: 'Exercise',
        category_sleep: 'Sleep',
        category_nutrition: 'Nutrition',
        category_social: 'Social',
        
        // Challenges & Achievements (NEW)
        challenges_title: 'Challenges & Achievements',
        challenges_subtitle: 'Complete challenges and unlock achievements',
        challenges_tab: 'Challenges',
        achievements_tab: 'Achievements',
        challenges_level: 'Level',
        challenges_points: 'Points',
        challenges_streak: 'Day Streak',
        challenges_achievements: 'Achievements',
        challenges_progress: 'Progress to Next Level',
        challenges_weekly: 'Weekly Challenges',
        challenges_monthly: 'Monthly Challenges',
        challenges_progress_label: 'Progress',
        challenges_continue: 'Continue',
        challenges_no_data: 'No challenges available yet',
        achievements_no_data: 'Complete challenges to unlock achievements!',
        
        // Color Psychology (NEW)
        color_psych_title: 'Color Psychology Analysis',
        color_psych_subtitle: 'Discover the psychological effects of colors',
        color_psych_attributes: 'Attributes',
        color_psych_effects: 'Psychological Effects',
        color_psych_moods: 'Associated Moods',
        color_psych_cultural: 'Cultural Perspectives',
        color_psych_use_when: 'Use When',
        color_psych_avoid_when: 'Avoid When',
        color_psych_track: 'Track This Color',
        color_psych_tracked: 'Color preference saved!',
        
        // Social Feed (NEW)
        social_feed_title: 'Social Feed',
        social_feed_subtitle: 'Share your mood journey with the community',
        social_feed_post_placeholder: 'How are you feeling? Share your mood...',
        social_feed_select_emotion: 'Select your emotion',
        social_feed_post: 'Post',
        social_feed_all: 'All Posts',
        social_feed_friends: 'Friends',
        social_feed_empty_title: 'No posts yet',
        social_feed_empty_text: 'Be the first to share your mood with the community!',
        social_feed_post_success: 'Post shared successfully!',
        social_feed_post_error: 'Failed to post. Please try again.',
        social_feed_comments_coming_soon: 'Comments feature coming soon!',
        social_feed_share_coming_soon: 'Share feature coming soon!',
        privacy_public: '🌍 Public',
        privacy_friends: '👥 Friends',
        privacy_private: '🔒 Private',
        loading_feed: 'Loading feed...',
        
        // Authentication
        auth_create_account: 'Create Account',
        auth_welcome_back: 'Welcome Back',
        auth_start_tracking: 'Start tracking your moods today',
        auth_sign_in_continue: 'Sign in to continue to your account',
        auth_login: 'Login',
        auth_register: 'Register',
        auth_username: 'Username',
        auth_email: 'Email',
        auth_password: 'Password',
        auth_confirm_password: 'Confirm Password',
        auth_username_placeholder: 'Choose a username',
        auth_email_placeholder: 'Enter your email',
        auth_password_placeholder: 'Create password',
        auth_confirm_password_placeholder: 'Confirm your password',
        auth_username_login_placeholder: 'Enter your username',
        auth_password_login_placeholder: 'Enter your password',
        auth_trust_device: 'Trust this device',
        auth_trust_device_desc: 'Stay logged in for 30 days on this device',
        auth_forgot_password: 'Forgot password?',
        auth_sign_in: 'Sign in',
        auth_or_continue_with: 'OR CONTINUE WITH',
        auth_sign_in_key: 'Sign in with key',
        auth_use_biometrics: 'Use Biometrics',
        auth_continue_with: 'Continue with',
        auth_protected_encryption: 'Protected with end-to-end encryption',
        auth_passwords_not_match: 'Passwords do not match',
        auth_account_created: 'Account created successfully! Redirecting...',
        auth_login_success: 'Login successful! Redirecting...',
        auth_error_occurred: 'An error occurred. Please try again.',
        auth_redirecting_provider: 'Redirecting to {provider}...',
        auth_webauthn_not_supported: 'WebAuthn is not supported in this browser',
        auth_preparing_webauthn: 'Preparing authentication...',
        auth_webauthn_success: 'Authentication successful!',
        auth_webauthn_failed: 'Authentication failed',
        auth_webauthn_error: 'Authentication error occurred',
        auth_biometrics_not_supported: 'Biometric authentication is not supported',
        auth_forgot_password_prompt: 'Enter your email address:',
        auth_password_reset_sent: 'Password reset link sent to your email',
        auth_password_reset_failed: 'Failed to send password reset link',
        
        // Magic Link Authentication
        auth_magic_link: 'Magic Link',
        auth_magic_link_prompt: 'Enter your email for a magic link:',
        auth_magic_link_sending: 'Sending magic link...',
        auth_magic_link_sent: 'Magic link sent! Check your email.',
        auth_magic_link_failed: 'Failed to send magic link',
        magic_link_verifying: 'Verifying Magic Link',
        magic_link_please_wait: 'Please wait while we verify your magic link...',
        magic_link_success: 'Login Successful!',
        magic_link_redirecting: 'Redirecting to your dashboard...',
        magic_link_error: 'Verification Failed',
        magic_link_invalid: 'Invalid or expired magic link',
        magic_link_no_token: 'No token provided',
        magic_link_network_error: 'Network error. Please try again.',
        magic_link_back_to_login: 'Back to Login',
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
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: 'Iniciar sesión',
        auth_login_success: 'Welcome back!',
        auth_logout: 'Cerrar sesión',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: 'Perfil',
        auth_required: 'Please login to continue',
        auth_settings: 'Configuración',
        auth_signup: 'Registrarse',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
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
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: '登录',
        auth_login_success: 'Welcome back!',
        auth_logout: '登出',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: '个人资料',
        auth_required: 'Please login to continue',
        auth_settings: '设置',
        auth_signup: '注册',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
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
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: 'Connexion',
        auth_login_success: 'Welcome back!',
        auth_logout: 'Déconnexion',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: 'Profil',
        auth_required: 'Please login to continue',
        auth_settings: 'Paramètres',
        auth_signup: 'S\'inscrire',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
    },
    
    de: {
        // Navigation
        nav_dashboard: 'Dashboard',
        nav_log_mood: 'Stimmung aufzeichnen',
        nav_activities: 'Aktivitäten',
        nav_about: 'Über uns',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'Intelligentes Stimmungs-Tracking',
        loading_data: 'Lade deine Stimmungsdaten...',
        
        // Stats cards
        stats_total_entries: 'Gesamteinträge',
        stats_most_common: 'Am häufigsten',
        stats_avg_intensity: 'Durchschn. Intensität',
        stats_trend: 'Trend',
        stats_last_30_days: 'Letzte 30 Tage',
        stats_primary_emotion: 'Primäre Emotion',
        stats_out_of_5: 'Von 5.0',
        stats_30_day_trend: '30-Tage-Trend',
        
        // Trends
        trend_improving: 'Verbesserung',
        trend_declining: 'Rückgang',
        trend_stable: 'Stabil',
        
        // Charts
        chart_mood_distribution: 'Stimmungsverteilung',
        chart_intensity_trend: 'Aktueller Intensitätstrend',
        
        // Insights
        insights_title: 'Einblicke & Empfehlungen',
        
        // Recent moods
        recent_moods_title: 'Aktuelle Stimmungen',
        recent_moods_empty: 'Noch keine Stimmungseinträge.',
        recent_moods_log_first: 'Zeichne deine erste Stimmung auf!',
        intensity_label: 'Intensität:',
        
        // Log mood page
        log_mood_title: 'Deine Stimmung aufzeichnen',
        log_mood_subtitle: 'Erfasse, wie du dich gerade fühlst',
        
        // Form labels
        form_emotion_label: 'Wie fühlst du dich?',
        form_intensity_label: 'Intensität',
        form_intensity_current: 'Aktuell:',
        form_intensity_low: 'Niedrig',
        form_intensity_high: 'Hoch',
        form_notes_label: 'Notizen (Optional)',
        form_notes_placeholder: 'Was beschäftigt dich? Auslöser oder Ereignisse?',
        form_weather_label: 'Wetter (Optional)',
        form_sleep_label: 'Schlafstunden (Optional)',
        form_sleep_placeholder: 'z.B. 7.5',
        form_activities_label: 'Aktivitäten (Optional)',
        form_social_label: 'Soziale Interaktion (Optional)',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'Abbrechen',
        btn_save: 'Stimmung speichern',
        btn_log_new: 'Neue aufzeichnen',
        btn_start: 'Start',
        btn_close: 'Schließen',
        btn_retry: 'Wiederholen',
        btn_view_dashboard: 'Dashboard ansehen',
        btn_log_another: 'Weitere aufzeichnen',
        btn_mark_done: 'Als erledigt markieren',
        
        // Emotions
        emotion_happy: 'Glücklich',
        emotion_sad: 'Traurig',
        emotion_anxious: 'Ängstlich',
        emotion_calm: 'Ruhig',
        emotion_energetic: 'Energiegeladen',
        emotion_tired: 'Müde',
        emotion_angry: 'Wütend',
        emotion_peaceful: 'Friedlich',
        emotion_stressed: 'Gestresst',
        emotion_neutral: 'Neutral',
        
        // Weather
        weather_sunny: 'Sonnig',
        weather_cloudy: 'Bewölkt',
        weather_rainy: 'Regnerisch',
        weather_snowy: 'Schnee',
        weather_clear: 'Klar',
        
        // Social
        social_alone: 'Allein',
        social_friends: 'Freunde',
        social_family: 'Familie',
        social_colleagues: 'Kollegen',
        
        // Activities
        activity_work: 'Arbeit',
        activity_exercise: 'Sport',
        activity_social: 'Sozial',
        activity_rest: 'Ruhe',
        activity_hobby: 'Hobby',
        activity_meditation: 'Meditation',
        activity_reading: 'Lesen',
        activity_outdoor: 'Draußen',
        
        // Wellness activities page
        activities_title: 'Wellness-Aktivitäten',
        activities_subtitle: 'Personalisierte Aktivitäten zur Verbesserung deiner Stimmung',
        activities_filter: 'Nach Emotion filtern',
        activities_all: 'Alle Aktivitäten',
        activities_empty: 'Keine Aktivitäten für diesen Filter gefunden.',
        activities_view_all: 'Alle Aktivitäten ansehen',
        activities_helps_with: 'HILFT BEI:',
        activities_description: 'BESCHREIBUNG',
        activities_target_emotions: 'HILFT BEI DIESEN EMOTIONEN',
        
        // Activity categories
        category_meditation: 'Meditation',
        category_exercise: 'Sport',
        category_journaling: 'Tagebuch',
        category_social: 'Sozial',
        category_creative: 'Kreativ',
        
        // Difficulty
        difficulty_easy: 'Einfach',
        difficulty_medium: 'Mittel',
        difficulty_hard: 'Schwer',
        
        // Success messages
        success_mood_saved: 'Stimmung gespeichert!',
        success_mood_saved_desc: 'Dein Stimmungseintrag wurde erfolgreich aufgezeichnet.',
        success_activity_logged: 'Aktivität aufgezeichnet! Gut gemacht!',
        
        // Error messages
        error_loading_failed: 'Fehler beim Laden der Dashboard-Daten',
        error_mood_save_failed: 'Fehler beim Speichern der Stimmung. Bitte versuche es erneut.',
        error_select_emotion: 'Bitte wähle eine Emotion',
        error_activities_load_failed: 'Fehler beim Laden der Wellness-Aktivitäten',
        
        // Theme
        theme_light: 'Heller Modus',
        theme_dark: 'Dunkler Modus',
        
        // PWA
        pwa_install_title: 'MoodMash installieren',
        pwa_install_desc: 'Installiere unsere App für schnellen Zugriff und Offline-Unterstützung',
        pwa_install_btn: 'Installieren',
        pwa_install_later: 'Vielleicht später',
        
        // Time formats
        time_minutes: 'Min',
        time_hours: 'Std',
        time_sleep: 'Schlaf',
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: 'Anmelden',
        auth_login_success: 'Welcome back!',
        auth_logout: 'Abmelden',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: 'Profil',
        auth_required: 'Please login to continue',
        auth_settings: 'Einstellungen',
        auth_signup: 'Registrieren',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
    },
    
    it: {
        // Navigation
        nav_dashboard: 'Dashboard',
        nav_log_mood: 'Registra umore',
        nav_activities: 'Attività',
        nav_about: 'Chi siamo',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'Tracciamento intelligente dell\'umore',
        loading_data: 'Caricamento dei tuoi dati sull\'umore...',
        
        // Stats cards
        stats_total_entries: 'Voci totali',
        stats_most_common: 'Più comune',
        stats_avg_intensity: 'Intensità media',
        stats_trend: 'Tendenza',
        stats_last_30_days: 'Ultimi 30 giorni',
        stats_primary_emotion: 'Emozione primaria',
        stats_out_of_5: 'Su 5.0',
        stats_30_day_trend: 'Tendenza a 30 giorni',
        
        // Trends
        trend_improving: 'Miglioramento',
        trend_declining: 'Declino',
        trend_stable: 'Stabile',
        
        // Charts
        chart_mood_distribution: 'Distribuzione dell\'umore',
        chart_intensity_trend: 'Tendenza recente dell\'intensità',
        
        // Insights
        insights_title: 'Approfondimenti e raccomandazioni',
        
        // Recent moods
        recent_moods_title: 'Umori recenti',
        recent_moods_empty: 'Nessuna voce sull\'umore ancora.',
        recent_moods_log_first: 'Registra il tuo primo umore!',
        intensity_label: 'Intensità:',
        
        // Log mood page
        log_mood_title: 'Registra il tuo umore',
        log_mood_subtitle: 'Traccia come ti senti in questo momento',
        
        // Form labels
        form_emotion_label: 'Come ti senti?',
        form_intensity_label: 'Intensità',
        form_intensity_current: 'Attuale:',
        form_intensity_low: 'Bassa',
        form_intensity_high: 'Alta',
        form_notes_label: 'Note (Opzionale)',
        form_notes_placeholder: 'Cosa ti passa per la mente? Trigger o eventi?',
        form_weather_label: 'Meteo (Opzionale)',
        form_sleep_label: 'Ore di sonno (Opzionale)',
        form_sleep_placeholder: 'es. 7.5',
        form_activities_label: 'Attività (Opzionale)',
        form_social_label: 'Interazione sociale (Opzionale)',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'Annulla',
        btn_save: 'Salva umore',
        btn_log_new: 'Registra nuovo',
        btn_start: 'Inizia',
        btn_close: 'Chiudi',
        btn_retry: 'Riprova',
        btn_view_dashboard: 'Visualizza dashboard',
        btn_log_another: 'Registra un altro',
        btn_mark_done: 'Segna come fatto',
        
        // Emotions
        emotion_happy: 'Felice',
        emotion_sad: 'Triste',
        emotion_anxious: 'Ansioso',
        emotion_calm: 'Calmo',
        emotion_energetic: 'Energetico',
        emotion_tired: 'Stanco',
        emotion_angry: 'Arrabbiato',
        emotion_peaceful: 'Pacifico',
        emotion_stressed: 'Stressato',
        emotion_neutral: 'Neutrale',
        
        // Weather
        weather_sunny: 'Soleggiato',
        weather_cloudy: 'Nuvoloso',
        weather_rainy: 'Piovoso',
        weather_snowy: 'Nevoso',
        weather_clear: 'Sereno',
        
        // Social
        social_alone: 'Solo',
        social_friends: 'Amici',
        social_family: 'Famiglia',
        social_colleagues: 'Colleghi',
        
        // Activities
        activity_work: 'Lavoro',
        activity_exercise: 'Esercizio',
        activity_social: 'Sociale',
        activity_rest: 'Riposo',
        activity_hobby: 'Hobby',
        activity_meditation: 'Meditazione',
        activity_reading: 'Lettura',
        activity_outdoor: 'All\'aperto',
        
        // Wellness activities page
        activities_title: 'Attività di benessere',
        activities_subtitle: 'Attività personalizzate per migliorare il tuo umore e benessere',
        activities_filter: 'Filtra per emozione',
        activities_all: 'Tutte le attività',
        activities_empty: 'Nessuna attività trovata per questo filtro.',
        activities_view_all: 'Visualizza tutte le attività',
        activities_helps_with: 'AIUTA CON:',
        activities_description: 'DESCRIZIONE',
        activities_target_emotions: 'AIUTA CON QUESTE EMOZIONI',
        
        // Activity categories
        category_meditation: 'Meditazione',
        category_exercise: 'Esercizio',
        category_journaling: 'Diario',
        category_social: 'Sociale',
        category_creative: 'Creativo',
        
        // Difficulty
        difficulty_easy: 'Facile',
        difficulty_medium: 'Medio',
        difficulty_hard: 'Difficile',
        
        // Success messages
        success_mood_saved: 'Umore salvato!',
        success_mood_saved_desc: 'La tua voce sull\'umore è stata registrata con successo.',
        success_activity_logged: 'Attività registrata! Ottimo lavoro!',
        
        // Error messages
        error_loading_failed: 'Caricamento dati dashboard fallito',
        error_mood_save_failed: 'Salvataggio umore fallito. Riprova.',
        error_select_emotion: 'Seleziona un\'emozione',
        error_activities_load_failed: 'Caricamento attività di benessere fallito',
        
        // Theme
        theme_light: 'Modalità chiara',
        theme_dark: 'Modalità scura',
        
        // PWA
        pwa_install_title: 'Installa MoodMash',
        pwa_install_desc: 'Installa la nostra app per accesso rapido e supporto offline',
        pwa_install_btn: 'Installa',
        pwa_install_later: 'Forse più tardi',
        
        // Time formats
        time_minutes: 'min',
        time_hours: 'h',
        time_sleep: 'sonno',
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: 'Accedi',
        auth_login_success: 'Welcome back!',
        auth_logout: 'Esci',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: 'Profilo',
        auth_required: 'Please login to continue',
        auth_settings: 'Impostazioni',
        auth_signup: 'Iscriviti',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
    },
    
    ar: {
        // Navigation (RTL language)
        nav_dashboard: 'لوحة القيادة',
        nav_log_mood: 'تسجيل المزاج',
        nav_activities: 'الأنشطة',
        nav_about: 'عن التطبيق',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'تتبع ذكي للمزاج',
        loading_data: 'جاري تحميل بيانات مزاجك...',
        
        // Stats cards
        stats_total_entries: 'إجمالي الإدخالات',
        stats_most_common: 'الأكثر شيوعًا',
        stats_avg_intensity: 'متوسط ​​الكثافة',
        stats_trend: 'الاتجاه',
        stats_last_30_days: 'آخر 30 يومًا',
        stats_primary_emotion: 'العاطفة الأساسية',
        stats_out_of_5: 'من 5.0',
        stats_30_day_trend: 'اتجاه 30 يومًا',
        
        // Trends
        trend_improving: 'تحسن',
        trend_declining: 'تراجع',
        trend_stable: 'مستقر',
        
        // Charts
        chart_mood_distribution: 'توزيع المزاج',
        chart_intensity_trend: 'اتجاه الكثافة الأخير',
        
        // Insights
        insights_title: 'رؤى وتوصيات',
        
        // Recent moods
        recent_moods_title: 'الحالات المزاجية الأخيرة',
        recent_moods_empty: 'لا توجد إدخالات مزاج حتى الآن.',
        recent_moods_log_first: 'سجل أول مزاج لك!',
        intensity_label: 'الكثافة:',
        
        // Log mood page
        log_mood_title: 'سجل مزاجك',
        log_mood_subtitle: 'تتبع شعورك الآن',
        
        // Form labels
        form_emotion_label: 'كيف تشعر؟',
        form_intensity_label: 'الكثافة',
        form_intensity_current: 'الحالي:',
        form_intensity_low: 'منخفض',
        form_intensity_high: 'عالي',
        form_notes_label: 'ملاحظات (اختياري)',
        form_notes_placeholder: 'ما الذي يدور في ذهنك؟ أي محفزات أو أحداث؟',
        form_weather_label: 'الطقس (اختياري)',
        form_sleep_label: 'ساعات النوم (اختياري)',
        form_sleep_placeholder: 'مثال: 7.5',
        form_activities_label: 'الأنشطة (اختياري)',
        form_social_label: 'التفاعل الاجتماعي (اختياري)',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'إلغاء',
        btn_save: 'حفظ المزاج',
        btn_log_new: 'تسجيل جديد',
        btn_start: 'ابدأ',
        btn_close: 'إغلاق',
        btn_retry: 'إعادة المحاولة',
        btn_view_dashboard: 'عرض لوحة القيادة',
        btn_log_another: 'تسجيل آخر',
        btn_mark_done: 'وضع علامة كمنتهي',
        
        // Emotions
        emotion_happy: 'سعيد',
        emotion_sad: 'حزين',
        emotion_anxious: 'قلق',
        emotion_calm: 'هادئ',
        emotion_energetic: 'نشيط',
        emotion_tired: 'متعب',
        emotion_angry: 'غاضب',
        emotion_peaceful: 'مسالم',
        emotion_stressed: 'متوتر',
        emotion_neutral: 'محايد',
        
        // Weather
        weather_sunny: 'مشمس',
        weather_cloudy: 'غائم',
        weather_rainy: 'ممطر',
        weather_snowy: 'مثلج',
        weather_clear: 'صافي',
        
        // Social
        social_alone: 'وحيد',
        social_friends: 'أصدقاء',
        social_family: 'عائلة',
        social_colleagues: 'زملاء',
        
        // Activities
        activity_work: 'عمل',
        activity_exercise: 'تمرين',
        activity_social: 'اجتماعي',
        activity_rest: 'راحة',
        activity_hobby: 'هواية',
        activity_meditation: 'تأمل',
        activity_reading: 'قراءة',
        activity_outdoor: 'في الهواء الطلق',
        
        // Wellness activities page
        activities_title: 'أنشطة العافية',
        activities_subtitle: 'أنشطة مخصصة لتحسين مزاجك وعافيتك',
        activities_filter: 'تصفية حسب العاطفة',
        activities_all: 'جميع الأنشطة',
        activities_empty: 'لم يتم العثور على أنشطة لهذا الفلتر.',
        activities_view_all: 'عرض جميع الأنشطة',
        activities_helps_with: 'يساعد مع:',
        activities_description: 'الوصف',
        activities_target_emotions: 'يساعد مع هذه العواطف',
        
        // Activity categories
        category_meditation: 'تأمل',
        category_exercise: 'تمرين',
        category_journaling: 'يوميات',
        category_social: 'اجتماعي',
        category_creative: 'إبداعي',
        
        // Difficulty
        difficulty_easy: 'سهل',
        difficulty_medium: 'متوسط',
        difficulty_hard: 'صعب',
        
        // Success messages
        success_mood_saved: 'تم حفظ المزاج!',
        success_mood_saved_desc: 'تم تسجيل إدخال مزاجك بنجاح.',
        success_activity_logged: 'تم تسجيل النشاط! عمل رائع!',
        
        // Error messages
        error_loading_failed: 'فشل تحميل بيانات لوحة القيادة',
        error_mood_save_failed: 'فشل حفظ المزاج. يرجى المحاولة مرة أخرى.',
        error_select_emotion: 'يرجى اختيار عاطفة',
        error_activities_load_failed: 'فشل تحميل أنشطة العافية',
        
        // Theme
        theme_light: 'الوضع الفاتح',
        theme_dark: 'الوضع الداكن',
        
        // PWA
        pwa_install_title: 'تثبيت MoodMash',
        pwa_install_desc: 'قم بتثبيت تطبيقنا للوصول السريع والدعم دون اتصال',
        pwa_install_btn: 'تثبيت',
        pwa_install_later: 'ربما لاحقًا',
        
        // Time formats
        time_minutes: 'دقيقة',
        time_hours: 'ساعة',
        time_sleep: 'نوم',
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: 'تسجيل الدخول',
        auth_login_success: 'Welcome back!',
        auth_logout: 'تسجيل الخروج',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: 'الملف الشخصي',
        auth_required: 'Please login to continue',
        auth_settings: 'الإعدادات',
        auth_signup: 'التسجيل',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
    },
    
    hi: {
        // Navigation (Hindi)
        nav_dashboard: 'डैशबोर्ड',
        nav_log_mood: 'मूड रिकॉर्ड करें',
        nav_activities: 'गतिविधियाँ',
        nav_about: 'हमारे बारे में',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'बुद्धिमान मूड ट्रैकिंग',
        loading_data: 'आपके मूड डेटा को लोड कर रहे हैं...',
        
        // Stats cards
        stats_total_entries: 'कुल प्रविष्टियाँ',
        stats_most_common: 'सबसे आम',
        stats_avg_intensity: 'औसत तीव्रता',
        stats_trend: 'प्रवृत्ति',
        stats_last_30_days: 'पिछले 30 दिन',
        stats_primary_emotion: 'प्राथमिक भावना',
        stats_out_of_5: '5.0 में से',
        stats_30_day_trend: '30-दिन की प्रवृत्ति',
        
        // Trends
        trend_improving: 'सुधार',
        trend_declining: 'गिरावट',
        trend_stable: 'स्थिर',
        
        // Charts
        chart_mood_distribution: 'मूड वितरण',
        chart_intensity_trend: 'हालिया तीव्रता प्रवृत्ति',
        
        // Insights
        insights_title: 'अंतर्दृष्टि और सिफारिशें',
        
        // Recent moods
        recent_moods_title: 'हालिया मूड',
        recent_moods_empty: 'अभी तक कोई मूड प्रविष्टि नहीं।',
        recent_moods_log_first: 'अपना पहला मूड रिकॉर्ड करें!',
        intensity_label: 'तीव्रता:',
        
        // Log mood page
        log_mood_title: 'अपना मूड रिकॉर्ड करें',
        log_mood_subtitle: 'ट्रैक करें कि आप अभी कैसा महसूस कर रहे हैं',
        
        // Form labels
        form_emotion_label: 'आप कैसा महसूस कर रहे हैं?',
        form_intensity_label: 'तीव्रता',
        form_intensity_current: 'वर्तमान:',
        form_intensity_low: 'कम',
        form_intensity_high: 'उच्च',
        form_notes_label: 'नोट्स (वैकल्पिक)',
        form_notes_placeholder: 'आपके दिमाग में क्या है? कोई ट्रिगर या घटनाएं?',
        form_weather_label: 'मौसम (वैकल्पिक)',
        form_sleep_label: 'नींद के घंटे (वैकल्पिक)',
        form_sleep_placeholder: 'उदाहरण: 7.5',
        form_activities_label: 'गतिविधियाँ (वैकल्पिक)',
        form_social_label: 'सामाजिक संपर्क (वैकल्पिक)',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'रद्द करें',
        btn_save: 'मूड सहेजें',
        btn_log_new: 'नया रिकॉर्ड करें',
        btn_start: 'शुरू करें',
        btn_close: 'बंद करें',
        btn_retry: 'पुनः प्रयास करें',
        btn_view_dashboard: 'डैशबोर्ड देखें',
        btn_log_another: 'एक और रिकॉर्ड करें',
        btn_mark_done: 'पूर्ण के रूप में चिह्नित करें',
        
        // Emotions
        emotion_happy: 'खुश',
        emotion_sad: 'उदास',
        emotion_anxious: 'चिंतित',
        emotion_calm: 'शांत',
        emotion_energetic: 'ऊर्जावान',
        emotion_tired: 'थका हुआ',
        emotion_angry: 'गुस्सा',
        emotion_peaceful: 'शांतिपूर्ण',
        emotion_stressed: 'तनावग्रस्त',
        emotion_neutral: 'तटस्थ',
        
        // Weather
        weather_sunny: 'धूप',
        weather_cloudy: 'बादल',
        weather_rainy: 'बारिश',
        weather_snowy: 'बर्फ',
        weather_clear: 'साफ',
        
        // Social
        social_alone: 'अकेले',
        social_friends: 'दोस्तों',
        social_family: 'परिवार',
        social_colleagues: 'सहकर्मी',
        
        // Activities
        activity_work: 'काम',
        activity_exercise: 'व्यायाम',
        activity_social: 'सामाजिक',
        activity_rest: 'आराम',
        activity_hobby: 'शौक',
        activity_meditation: 'ध्यान',
        activity_reading: 'पढ़ना',
        activity_outdoor: 'बाहर',
        
        // Wellness activities page
        activities_title: 'कल्याण गतिविधियाँ',
        activities_subtitle: 'आपके मूड और कल्याण को बेहतर बनाने के लिए व्यक्तिगत गतिविधियाँ',
        activities_filter: 'भावना के आधार पर फ़िल्टर करें',
        activities_all: 'सभी गतिविधियाँ',
        activities_empty: 'इस फ़िल्टर के लिए कोई गतिविधि नहीं मिली।',
        activities_view_all: 'सभी गतिविधियाँ देखें',
        activities_helps_with: 'मदद करता है:',
        activities_description: 'विवरण',
        activities_target_emotions: 'इन भावनाओं में मदद करता है',
        
        // Activity categories
        category_meditation: 'ध्यान',
        category_exercise: 'व्यायाम',
        category_journaling: 'डायरी',
        category_social: 'सामाजिक',
        category_creative: 'रचनात्मक',
        
        // Difficulty
        difficulty_easy: 'आसान',
        difficulty_medium: 'मध्यम',
        difficulty_hard: 'कठिन',
        
        // Success messages
        success_mood_saved: 'मूड सहेजा गया!',
        success_mood_saved_desc: 'आपकी मूड प्रविष्टि सफलतापूर्वक रिकॉर्ड की गई।',
        success_activity_logged: 'गतिविधि रिकॉर्ड की गई! बढ़िया काम!',
        
        // Error messages
        error_loading_failed: 'डैशबोर्ड डेटा लोड करने में विफल',
        error_mood_save_failed: 'मूड सहेजने में विफल। कृपया पुनः प्रयास करें।',
        error_select_emotion: 'कृपया एक भावना चुनें',
        error_activities_load_failed: 'कल्याण गतिविधियों को लोड करने में विफल',
        
        // Theme
        theme_light: 'लाइट मोड',
        theme_dark: 'डार्क मोड',
        
        // PWA
        pwa_install_title: 'MoodMash इंस्टॉल करें',
        pwa_install_desc: 'त्वरित पहुंच और ऑफ़लाइन समर्थन के लिए हमारा ऐप इंस्टॉल करें',
        pwa_install_btn: 'इंस्टॉल करें',
        pwa_install_later: 'शायद बाद में',
        
        // Time formats
        time_minutes: 'मिनट',
        time_hours: 'घंटे',
        time_sleep: 'नींद',
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: 'लॉगिन',
        auth_login_success: 'Welcome back!',
        auth_logout: 'लॉगआउट',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: 'प्रोफ़ाइल',
        auth_required: 'Please login to continue',
        auth_settings: 'सेटिंग्स',
        auth_signup: 'साइन अप',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
    },
    
    bn: {
        // Navigation (Bengali)
        nav_dashboard: 'ড্যাশবোর্ড',
        nav_log_mood: 'মুড রেকর্ড করুন',
        nav_activities: 'কার্যক্রম',
        nav_about: 'আমাদের সম্পর্কে',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'বুদ্ধিমান মুড ট্র্যাকিং',
        loading_data: 'আপনার মুড ডেটা লোড হচ্ছে...',
        
        // Stats cards
        stats_total_entries: 'মোট এন্ট্রি',
        stats_most_common: 'সবচেয়ে সাধারণ',
        stats_avg_intensity: 'গড় তীব্রতা',
        stats_trend: 'প্রবণতা',
        stats_last_30_days: 'শেষ 30 দিন',
        stats_primary_emotion: 'প্রাথমিক আবেগ',
        stats_out_of_5: '5.0 এর মধ্যে',
        stats_30_day_trend: '30-দিনের প্রবণতা',
        
        // Trends
        trend_improving: 'উন্নতি',
        trend_declining: 'পতন',
        trend_stable: 'স্থিতিশীল',
        
        // Charts
        chart_mood_distribution: 'মুড বিতরণ',
        chart_intensity_trend: 'সাম্প্রতিক তীব্রতা প্রবণতা',
        
        // Insights
        insights_title: 'অন্তর্দৃষ্টি এবং সুপারিশ',
        
        // Recent moods
        recent_moods_title: 'সাম্প্রতিক মুড',
        recent_moods_empty: 'এখনও কোনো মুড এন্ট্রি নেই।',
        recent_moods_log_first: 'আপনার প্রথম মুড রেকর্ড করুন!',
        intensity_label: 'তীব্রতা:',
        
        // Log mood page
        log_mood_title: 'আপনার মুড রেকর্ড করুন',
        log_mood_subtitle: 'এখন আপনি কেমন অনুভব করছেন তা ট্র্যাক করুন',
        
        // Form labels
        form_emotion_label: 'আপনি কেমন অনুভব করছেন?',
        form_intensity_label: 'তীব্রতা',
        form_intensity_current: 'বর্তমান:',
        form_intensity_low: 'কম',
        form_intensity_high: 'উচ্চ',
        form_notes_label: 'নোট (ঐচ্ছিক)',
        form_notes_placeholder: 'আপনার মনে কি আছে? কোনো ট্রিগার বা ঘটনা?',
        form_weather_label: 'আবহাওয়া (ঐচ্ছিক)',
        form_sleep_label: 'ঘুমের ঘন্টা (ঐচ্ছিক)',
        form_sleep_placeholder: 'উদাহরণ: 7.5',
        form_activities_label: 'কার্যক্রম (ঐচ্ছিক)',
        form_social_label: 'সামাজিক মিথস্ক্রিয়া (ঐচ্ছিক)',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'বাতিল করুন',
        btn_save: 'মুড সংরক্ষণ করুন',
        btn_log_new: 'নতুন রেকর্ড করুন',
        btn_start: 'শুরু করুন',
        btn_close: 'বন্ধ করুন',
        btn_retry: 'পুনরায় চেষ্টা করুন',
        btn_view_dashboard: 'ড্যাশবোর্ড দেখুন',
        btn_log_another: 'আরেকটি রেকর্ড করুন',
        btn_mark_done: 'সম্পন্ন হিসাবে চিহ্নিত করুন',
        
        // Emotions
        emotion_happy: 'খুশি',
        emotion_sad: 'দুঃখিত',
        emotion_anxious: 'উদ্বিগ্ন',
        emotion_calm: 'শান্ত',
        emotion_energetic: 'উদ্যমী',
        emotion_tired: 'ক্লান্ত',
        emotion_angry: 'রাগান্বিত',
        emotion_peaceful: 'শান্তিপূর্ণ',
        emotion_stressed: 'চাপযুক্ত',
        emotion_neutral: 'নিরপেক্ষ',
        
        // Weather
        weather_sunny: 'রৌদ্রোজ্জ্বল',
        weather_cloudy: 'মেঘলা',
        weather_rainy: 'বৃষ্টি',
        weather_snowy: 'তুষারপাত',
        weather_clear: 'পরিষ্কার',
        
        // Social
        social_alone: 'একা',
        social_friends: 'বন্ধুরা',
        social_family: 'পরিবার',
        social_colleagues: 'সহকর্মীরা',
        
        // Activities
        activity_work: 'কাজ',
        activity_exercise: 'ব্যায়াম',
        activity_social: 'সামাজিক',
        activity_rest: 'বিশ্রাম',
        activity_hobby: 'শখ',
        activity_meditation: 'ধ্যান',
        activity_reading: 'পড়া',
        activity_outdoor: 'বাইরে',
        
        // Wellness activities page
        activities_title: 'সুস্থতা কার্যক্রম',
        activities_subtitle: 'আপনার মুড এবং সুস্থতা উন্নত করতে ব্যক্তিগত কার্যক্রম',
        activities_filter: 'আবেগ অনুসারে ফিল্টার করুন',
        activities_all: 'সমস্ত কার্যক্রম',
        activities_empty: 'এই ফিল্টারের জন্য কোনো কার্যক্রম পাওয়া যায়নি।',
        activities_view_all: 'সমস্ত কার্যক্রম দেখুন',
        activities_helps_with: 'সাহায্য করে:',
        activities_description: 'বিবরণ',
        activities_target_emotions: 'এই আবেগগুলিতে সাহায্য করে',
        
        // Activity categories
        category_meditation: 'ধ্যান',
        category_exercise: 'ব্যায়াম',
        category_journaling: 'ডায়েরি',
        category_social: 'সামাজিক',
        category_creative: 'সৃজনশীল',
        
        // Difficulty
        difficulty_easy: 'সহজ',
        difficulty_medium: 'মধ্যম',
        difficulty_hard: 'কঠিন',
        
        // Success messages
        success_mood_saved: 'মুড সংরক্ষিত!',
        success_mood_saved_desc: 'আপনার মুড এন্ট্রি সফলভাবে রেকর্ড করা হয়েছে।',
        success_activity_logged: 'কার্যক্রম রেকর্ড করা হয়েছে! দুর্দান্ত কাজ!',
        
        // Error messages
        error_loading_failed: 'ড্যাশবোর্ড ডেটা লোড করতে ব্যর্থ',
        error_mood_save_failed: 'মুড সংরক্ষণ করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।',
        error_select_emotion: 'অনুগ্রহ করে একটি আবেগ নির্বাচন করুন',
        error_activities_load_failed: 'সুস্থতা কার্যক্রম লোড করতে ব্যর্থ',
        
        // Theme
        theme_light: 'হালকা মোড',
        theme_dark: 'অন্ধকার মোড',
        
        // PWA
        pwa_install_title: 'MoodMash ইনস্টল করুন',
        pwa_install_desc: 'দ্রুত অ্যাক্সেস এবং অফলাইন সমর্থনের জন্য আমাদের অ্যাপ ইনস্টল করুন',
        pwa_install_btn: 'ইনস্টল করুন',
        pwa_install_later: 'হয়তো পরে',
        
        // Time formats
        time_minutes: 'মিনিট',
        time_hours: 'ঘন্টা',
        time_sleep: 'ঘুম',
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: 'লগইন',
        auth_login_success: 'Welcome back!',
        auth_logout: 'লগআউট',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: 'প্রোফাইল',
        auth_required: 'Please login to continue',
        auth_settings: 'সেটিংস',
        auth_signup: 'সাইন আপ',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
    },
    
    ta: {
        // Navigation (Tamil)
        nav_dashboard: 'டாஷ்போர்டு',
        nav_log_mood: 'மனநிலையைப் பதிவு செய்யவும்',
        nav_activities: 'செயல்பாடுகள்',
        nav_about: 'எங்களைப் பற்றி',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'புத்திசாலித்தனமான மனநிலை கண்காணிப்பு',
        loading_data: 'உங்கள் மனநிலை தரவு ஏற்றப்படுகிறது...',
        
        // Stats cards
        stats_total_entries: 'மொத்த உள்ளீடுகள்',
        stats_most_common: 'மிகவும் பொதுவானது',
        stats_avg_intensity: 'சராசரி தீவிரம்',
        stats_trend: 'போக்கு',
        stats_last_30_days: 'கடைசி 30 நாட்கள்',
        stats_primary_emotion: 'முதன்மை உணர்ச்சி',
        stats_out_of_5: '5.0ல்',
        stats_30_day_trend: '30-நாள் போக்கு',
        
        // Trends
        trend_improving: 'முன்னேற்றம்',
        trend_declining: 'வீழ்ச்சி',
        trend_stable: 'நிலையானது',
        
        // Charts
        chart_mood_distribution: 'மனநிலை விநியோகம்',
        chart_intensity_trend: 'சமீபத்திய தீவிர போக்கு',
        
        // Insights
        insights_title: 'நுண்ணறிவுகள் மற்றும் பரிந்துரைகள்',
        
        // Recent moods
        recent_moods_title: 'சமீபத்திய மனநிலைகள்',
        recent_moods_empty: 'இன்னும் மனநிலை உள்ளீடுகள் இல்லை.',
        recent_moods_log_first: 'உங்கள் முதல் மனநிலையைப் பதிவு செய்யவும்!',
        intensity_label: 'தீவிரம்:',
        
        // Log mood page
        log_mood_title: 'உங்கள் மனநிலையைப் பதிவு செய்யவும்',
        log_mood_subtitle: 'நீங்கள் இப்போது எப்படி உணர்கிறீர்கள் என்பதைக் கண்காணிக்கவும்',
        
        // Form labels
        form_emotion_label: 'நீங்கள் எப்படி உணர்கிறீர்கள்?',
        form_intensity_label: 'தீவிரம்',
        form_intensity_current: 'தற்போதைய:',
        form_intensity_low: 'குறைவு',
        form_intensity_high: 'உயர்',
        form_notes_label: 'குறிப்புகள் (விரும்பினால்)',
        form_notes_placeholder: 'உங்கள் மனதில் என்ன இருக்கிறது? ஏதேனும் தூண்டுதல் அல்லது நிகழ்வுகள்?',
        form_weather_label: 'வானிலை (விரும்பினால்)',
        form_sleep_label: 'தூக்க நேரங்கள் (விரும்பினால்)',
        form_sleep_placeholder: 'எடுத்துக்காட்டு: 7.5',
        form_activities_label: 'செயல்பாடுகள் (விரும்பினால்)',
        form_social_label: 'சமூக தொடர்பு (விரும்பினால்)',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'ரத்து செய்',
        btn_save: 'மனநிலையைச் சேமி',
        btn_log_new: 'புதியதைப் பதிவு செய்',
        btn_start: 'தொடங்கு',
        btn_close: 'மூடு',
        btn_retry: 'மீண்டும் முயற்சி செய்',
        btn_view_dashboard: 'டாஷ்போர்டைப் பார்',
        btn_log_another: 'மற்றொன்றைப் பதிவு செய்',
        btn_mark_done: 'முடிந்ததாகக் குறி',
        
        // Emotions
        emotion_happy: 'மகிழ்ச்சி',
        emotion_sad: 'சோகம்',
        emotion_anxious: 'கவலை',
        emotion_calm: 'அமைதி',
        emotion_energetic: 'ஆற்றல் மிக்க',
        emotion_tired: 'சோர்வு',
        emotion_angry: 'கோபம்',
        emotion_peaceful: 'அமைதியான',
        emotion_stressed: 'மன அழுத்தம்',
        emotion_neutral: 'நடுநிலை',
        
        // Weather
        weather_sunny: 'வெயில்',
        weather_cloudy: 'மேகமூட்டம்',
        weather_rainy: 'மழை',
        weather_snowy: 'பனிப்பொழிவு',
        weather_clear: 'தெளிவு',
        
        // Social
        social_alone: 'தனியாக',
        social_friends: 'நண்பர்கள்',
        social_family: 'குடும்பம்',
        social_colleagues: 'சகாக்கள்',
        
        // Activities
        activity_work: 'வேலை',
        activity_exercise: 'உடற்பயிற்சி',
        activity_social: 'சமூகம்',
        activity_rest: 'ஓய்வு',
        activity_hobby: 'பொழுதுபோக்கு',
        activity_meditation: 'தியானம்',
        activity_reading: 'வாசிப்பு',
        activity_outdoor: 'வெளியே',
        
        // Wellness activities page
        activities_title: 'நல்வாழ்வு செயல்பாடுகள்',
        activities_subtitle: 'உங்கள் மனநிலை மற்றும் நல்வாழ்வை மேம்படுத்த தனிப்பயனாக்கப்பட்ட செயல்பாடுகள்',
        activities_filter: 'உணர்ச்சியின் அடிப்படையில் வடிகட்டு',
        activities_all: 'அனைத்து செயல்பாடுகளும்',
        activities_empty: 'இந்த வடிப்பானுக்கு எந்த செயல்பாடும் இல்லை.',
        activities_view_all: 'அனைத்து செயல்பாடுகளையும் பார்',
        activities_helps_with: 'உதவுகிறது:',
        activities_description: 'விளக்கம்',
        activities_target_emotions: 'இந்த உணர்ச்சிகளுக்கு உதவுகிறது',
        
        // Activity categories
        category_meditation: 'தியானம்',
        category_exercise: 'உடற்பயிற்சி',
        category_journaling: 'நாட்குறிப்பு',
        category_social: 'சமூகம்',
        category_creative: 'படைப்பாற்றல்',
        
        // Difficulty
        difficulty_easy: 'எளிதானது',
        difficulty_medium: 'நடுத்தரம்',
        difficulty_hard: 'கடினம்',
        
        // Success messages
        success_mood_saved: 'மனநிலை சேமிக்கப்பட்டது!',
        success_mood_saved_desc: 'உங்கள் மனநிலை உள்ளீடு வெற்றிகரமாக பதிவு செய்யப்பட்டது.',
        success_activity_logged: 'செயல்பாடு பதிவு செய்யப்பட்டது! சிறந்த வேலை!',
        
        // Error messages
        error_loading_failed: 'டாஷ்போர்டு தரவை ஏற்ற முடியவில்லை',
        error_mood_save_failed: 'மனநிலையைச் சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
        error_select_emotion: 'தயவுசெய்து ஒரு உணர்ச்சியைத் தேர்ந்தெடுக்கவும்',
        error_activities_load_failed: 'நல்வாழ்வு செயல்பாடுகளை ஏற்ற முடியவில்லை',
        
        // Theme
        theme_light: 'ஒளி பயன்முறை',
        theme_dark: 'இருள் பயன்முறை',
        
        // PWA
        pwa_install_title: 'MoodMash நிறுவவும்',
        pwa_install_desc: 'விரைவான அணுகல் மற்றும் ஆஃப்லைன் ஆதரவிற்காக எங்கள் பயன்பாட்டை நிறுவவும்',
        pwa_install_btn: 'நிறுவவும்',
        pwa_install_later: 'ஒருவேளை பிறகு',
        
        // Time formats
        time_minutes: 'நிமிடங்கள்',
        time_hours: 'மணி',
        time_sleep: 'தூக்கம்',
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: 'உள்நுழைய',
        auth_login_success: 'Welcome back!',
        auth_logout: 'வெளியேறு',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: 'சுயவிவரம்',
        auth_required: 'Please login to continue',
        auth_settings: 'அமைப்புகள்',
        auth_signup: 'பதிவு செய்க',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
    },
    
    ja: {
        // Navigation (Japanese)
        nav_dashboard: 'ダッシュボード',
        nav_log_mood: '気分を記録',
        nav_activities: 'アクティビティ',
        nav_about: '概要',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'インテリジェントな気分追跡',
        loading_data: '気分データを読み込んでいます...',
        
        // Stats cards
        stats_total_entries: '総エントリー数',
        stats_most_common: '最も一般的',
        stats_avg_intensity: '平均強度',
        stats_trend: 'トレンド',
        stats_last_30_days: '過去30日間',
        stats_primary_emotion: '主要感情',
        stats_out_of_5: '5.0点満点',
        stats_30_day_trend: '30日間のトレンド',
        
        // Trends
        trend_improving: '改善中',
        trend_declining: '低下中',
        trend_stable: '安定',
        
        // Charts
        chart_mood_distribution: '気分の分布',
        chart_intensity_trend: '最近の強度トレンド',
        
        // Insights
        insights_title: '洞察と推奨事項',
        
        // Recent moods
        recent_moods_title: '最近の気分',
        recent_moods_empty: 'まだ気分の記録がありません。',
        recent_moods_log_first: '最初の気分を記録しましょう！',
        intensity_label: '強度：',
        
        // Log mood page
        log_mood_title: '気分を記録',
        log_mood_subtitle: '今の気持ちを記録しましょう',
        
        // Form labels
        form_emotion_label: 'どんな気分ですか？',
        form_intensity_label: '強度',
        form_intensity_current: '現在：',
        form_intensity_low: '低い',
        form_intensity_high: '高い',
        form_notes_label: 'メモ（任意）',
        form_notes_placeholder: '何を考えていますか？きっかけや出来事は？',
        form_weather_label: '天気（任意）',
        form_sleep_label: '睡眠時間（任意）',
        form_sleep_placeholder: '例：7.5',
        form_activities_label: 'アクティビティ（任意）',
        form_social_label: '社会的交流（任意）',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'キャンセル',
        btn_save: '気分を保存',
        btn_log_new: '新規記録',
        btn_start: '開始',
        btn_close: '閉じる',
        btn_retry: '再試行',
        btn_view_dashboard: 'ダッシュボードを表示',
        btn_log_another: '別の記録',
        btn_mark_done: '完了にする',
        
        // Emotions
        emotion_happy: '幸せ',
        emotion_sad: '悲しい',
        emotion_anxious: '不安',
        emotion_calm: '落ち着いた',
        emotion_energetic: '元気',
        emotion_tired: '疲れた',
        emotion_angry: '怒り',
        emotion_peaceful: '穏やか',
        emotion_stressed: 'ストレス',
        emotion_neutral: '中立',
        
        // Weather
        weather_sunny: '晴れ',
        weather_cloudy: '曇り',
        weather_rainy: '雨',
        weather_snowy: '雪',
        weather_clear: '快晴',
        
        // Social
        social_alone: '一人',
        social_friends: '友達',
        social_family: '家族',
        social_colleagues: '同僚',
        
        // Activities
        activity_work: '仕事',
        activity_exercise: '運動',
        activity_social: '社交',
        activity_rest: '休憩',
        activity_hobby: '趣味',
        activity_meditation: '瞑想',
        activity_reading: '読書',
        activity_outdoor: '屋外',
        
        // Wellness activities page
        activities_title: 'ウェルネスアクティビティ',
        activities_subtitle: '気分と健康を改善するためのパーソナライズされたアクティビティ',
        activities_filter: '感情でフィルター',
        activities_all: 'すべてのアクティビティ',
        activities_empty: 'このフィルターのアクティビティが見つかりません。',
        activities_view_all: 'すべてのアクティビティを表示',
        activities_helps_with: '役立つ：',
        activities_description: '説明',
        activities_target_emotions: 'これらの感情に役立つ',
        
        // Activity categories
        category_meditation: '瞑想',
        category_exercise: '運動',
        category_journaling: '日記',
        category_social: '社交',
        category_creative: '創造的',
        
        // Difficulty
        difficulty_easy: '簡単',
        difficulty_medium: '中程度',
        difficulty_hard: '難しい',
        
        // Success messages
        success_mood_saved: '気分を保存しました！',
        success_mood_saved_desc: '気分の記録が正常に保存されました。',
        success_activity_logged: 'アクティビティを記録しました！素晴らしい！',
        
        // Error messages
        error_loading_failed: 'ダッシュボードデータの読み込みに失敗しました',
        error_mood_save_failed: '気分の保存に失敗しました。もう一度お試しください。',
        error_select_emotion: '感情を選択してください',
        error_activities_load_failed: 'ウェルネスアクティビティの読み込みに失敗しました',
        
        // Theme
        theme_light: 'ライトモード',
        theme_dark: 'ダークモード',
        
        // PWA
        pwa_install_title: 'MoodMashをインストール',
        pwa_install_desc: 'アプリをインストールして、素早くアクセスできるようにしましょう',
        pwa_install_btn: 'インストール',
        pwa_install_later: '後で',
        
        // Time formats
        time_minutes: '分',
        time_hours: '時間',
        time_sleep: '睡眠',
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: 'ログイン',
        auth_login_success: 'Welcome back!',
        auth_logout: 'ログアウト',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: 'プロフィール',
        auth_required: 'Please login to continue',
        auth_settings: '設定',
        auth_signup: '新規登録',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
    },
    
    ko: {
        // Navigation (Korean)
        nav_dashboard: '대시보드',
        nav_log_mood: '기분 기록',
        nav_activities: '활동',
        nav_about: '소개',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: '지능형 기분 추적',
        loading_data: '기분 데이터를 불러오는 중...',
        
        // Stats cards
        stats_total_entries: '총 항목',
        stats_most_common: '가장 흔한',
        stats_avg_intensity: '평균 강도',
        stats_trend: '추세',
        stats_last_30_days: '지난 30일',
        stats_primary_emotion: '주요 감정',
        stats_out_of_5: '5.0점 만점',
        stats_30_day_trend: '30일 추세',
        
        // Trends
        trend_improving: '개선됨',
        trend_declining: '감소함',
        trend_stable: '안정적',
        
        // Charts
        chart_mood_distribution: '기분 분포',
        chart_intensity_trend: '최근 강도 추세',
        
        // Insights
        insights_title: '통찰력 및 권장사항',
        
        // Recent moods
        recent_moods_title: '최근 기분',
        recent_moods_empty: '아직 기분 기록이 없습니다.',
        recent_moods_log_first: '첫 번째 기분을 기록하세요!',
        intensity_label: '강도:',
        
        // Log mood page
        log_mood_title: '기분 기록',
        log_mood_subtitle: '지금 느끼는 감정을 추적하세요',
        
        // Form labels
        form_emotion_label: '어떤 기분이신가요?',
        form_intensity_label: '강도',
        form_intensity_current: '현재:',
        form_intensity_low: '낮음',
        form_intensity_high: '높음',
        form_notes_label: '메모 (선택사항)',
        form_notes_placeholder: '무슨 생각을 하고 있나요? 트리거나 사건이 있나요?',
        form_weather_label: '날씨 (선택사항)',
        form_sleep_label: '수면 시간 (선택사항)',
        form_sleep_placeholder: '예: 7.5',
        form_activities_label: '활동 (선택사항)',
        form_social_label: '사회적 교류 (선택사항)',
        form_required: '*',
        
        // Buttons
        btn_cancel: '취소',
        btn_save: '기분 저장',
        btn_log_new: '새로 기록',
        btn_start: '시작',
        btn_close: '닫기',
        btn_retry: '다시 시도',
        btn_view_dashboard: '대시보드 보기',
        btn_log_another: '다른 것 기록',
        btn_mark_done: '완료로 표시',
        
        // Emotions
        emotion_happy: '행복',
        emotion_sad: '슬픔',
        emotion_anxious: '불안',
        emotion_calm: '평온',
        emotion_energetic: '활기',
        emotion_tired: '피곤',
        emotion_angry: '화남',
        emotion_peaceful: '평화',
        emotion_stressed: '스트레스',
        emotion_neutral: '중립',
        
        // Weather
        weather_sunny: '맑음',
        weather_cloudy: '흐림',
        weather_rainy: '비',
        weather_snowy: '눈',
        weather_clear: '맑고 화창',
        
        // Social
        social_alone: '혼자',
        social_friends: '친구',
        social_family: '가족',
        social_colleagues: '동료',
        
        // Activities
        activity_work: '업무',
        activity_exercise: '운동',
        activity_social: '사교',
        activity_rest: '휴식',
        activity_hobby: '취미',
        activity_meditation: '명상',
        activity_reading: '독서',
        activity_outdoor: '야외',
        
        // Wellness activities page
        activities_title: '웰니스 활동',
        activities_subtitle: '기분과 웰빙을 개선하기 위한 맞춤형 활동',
        activities_filter: '감정별 필터',
        activities_all: '모든 활동',
        activities_empty: '이 필터에 대한 활동을 찾을 수 없습니다.',
        activities_view_all: '모든 활동 보기',
        activities_helps_with: '도움이 되는 감정:',
        activities_description: '설명',
        activities_target_emotions: '이러한 감정에 도움이 됩니다',
        
        // Activity categories
        category_meditation: '명상',
        category_exercise: '운동',
        category_journaling: '일기',
        category_social: '사교',
        category_creative: '창의적',
        
        // Difficulty
        difficulty_easy: '쉬움',
        difficulty_medium: '보통',
        difficulty_hard: '어려움',
        
        // Success messages
        success_mood_saved: '기분 저장됨!',
        success_mood_saved_desc: '기분 기록이 성공적으로 저장되었습니다.',
        success_activity_logged: '활동이 기록되었습니다! 잘하셨어요!',
        
        // Error messages
        error_loading_failed: '대시보드 데이터 로드 실패',
        error_mood_save_failed: '기분 저장 실패. 다시 시도해주세요.',
        error_select_emotion: '감정을 선택해주세요',
        error_activities_load_failed: '웰니스 활동 로드 실패',
        
        // Theme
        theme_light: '라이트 모드',
        theme_dark: '다크 모드',
        
        // PWA
        pwa_install_title: 'MoodMash 설치',
        pwa_install_desc: '빠른 접근과 오프라인 지원을 위해 앱을 설치하세요',
        pwa_install_btn: '설치',
        pwa_install_later: '나중에',
        
        // Time formats
        time_minutes: '분',
        time_hours: '시간',
        time_sleep: '수면',
        accessibility_font_large: 'Large font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_read: 'Toggle read aloud',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        auth_error: 'Authentication failed',
        auth_login: '로그인',
        auth_login_success: 'Welcome back!',
        auth_logout: '로그아웃',
        auth_logout_success: 'Logged out successfully',
        auth_premium_required: 'This feature requires Premium',
        auth_profile: '프로필',
        auth_required: 'Please login to continue',
        auth_settings: '설정',
        auth_signup: '가입',
        auth_upgrade_premium: 'Upgrade to Premium',
        auth_user_menu: 'User menu',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_languages: 'Change language?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_send: 'Send message',
        chatbot_subtitle: 'How can I help you?',
        chatbot_title: 'Mood',
        chatbot_toggle: 'Toggle chatbot',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_free_title: 'Free Tier',
        onboarding_get_started: 'Get Started',
        onboarding_next: 'Next',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_premium_title: 'Premium Tier',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_slide: 'Slide',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_welcome_title: 'Welcome to MoodMash',
    },
    
    ms: {
        // Navigation (Malay)
        nav_dashboard: 'Papan Pemuka',
        nav_log_mood: 'Rekod Mood',
        nav_activities: 'Aktiviti',
        nav_about: 'Perihal',
        
        // Dashboard
        dashboard_title: 'MoodMash',
        dashboard_subtitle: 'Penjejakan Mood Pintar',
        loading_data: 'Memuatkan data mood anda...',
        
        // Stats cards
        stats_total_entries: 'Jumlah Entri',
        stats_most_common: 'Paling Biasa',
        stats_avg_intensity: 'Intensiti Purata',
        stats_trend: 'Trend',
        stats_last_30_days: '30 hari terakhir',
        stats_primary_emotion: 'Emosi utama',
        stats_out_of_5: 'Daripada 5.0',
        stats_30_day_trend: 'Trend 30 hari',
        
        // Trends
        trend_improving: 'Bertambah baik',
        trend_declining: 'Merosot',
        trend_stable: 'Stabil',
        
        // Charts
        chart_mood_distribution: 'Agihan Mood',
        chart_intensity_trend: 'Trend Intensiti Terkini',
        
        // Insights
        insights_title: 'Pandangan & Cadangan',
        
        // Recent moods
        recent_moods_title: 'Mood Terkini',
        recent_moods_empty: 'Tiada entri mood lagi.',
        recent_moods_log_first: 'Rekod mood pertama anda!',
        intensity_label: 'Intensiti:',
        
        // Log mood page
        log_mood_title: 'Rekod Mood Anda',
        log_mood_subtitle: 'Jejaki perasaan anda sekarang',
        
        // Form labels
        form_emotion_label: 'Bagaimana perasaan anda?',
        form_intensity_label: 'Intensiti',
        form_intensity_current: 'Semasa:',
        form_intensity_low: 'Rendah',
        form_intensity_high: 'Tinggi',
        form_notes_label: 'Nota (Pilihan)',
        form_notes_placeholder: 'Apa yang anda fikirkan? Sebarang pencetus atau peristiwa?',
        form_weather_label: 'Cuaca (Pilihan)',
        form_sleep_label: 'Jam Tidur (Pilihan)',
        form_sleep_placeholder: 'contoh: 7.5',
        form_activities_label: 'Aktiviti (Pilihan)',
        form_social_label: 'Interaksi Sosial (Pilihan)',
        form_required: '*',
        
        // Buttons
        btn_cancel: 'Batal',
        btn_save: 'Simpan Mood',
        btn_log_new: 'Rekod Baru',
        btn_start: 'Mula',
        btn_close: 'Tutup',
        btn_retry: 'Cuba Lagi',
        btn_view_dashboard: 'Lihat Papan Pemuka',
        btn_log_another: 'Rekod Lagi',
        btn_mark_done: 'Tandakan Selesai',
        
        // Emotions
        emotion_happy: 'Gembira',
        emotion_sad: 'Sedih',
        emotion_anxious: 'Cemas',
        emotion_calm: 'Tenang',
        emotion_energetic: 'Bertenaga',
        emotion_tired: 'Letih',
        emotion_angry: 'Marah',
        emotion_peaceful: 'Aman',
        emotion_stressed: 'Tertekan',
        emotion_neutral: 'Neutral',
        
        // Weather
        weather_sunny: 'Cerah',
        weather_cloudy: 'Mendung',
        weather_rainy: 'Hujan',
        weather_snowy: 'Salji',
        weather_clear: 'Terang',
        
        // Social
        social_alone: 'Bersendirian',
        social_friends: 'Kawan',
        social_family: 'Keluarga',
        social_colleagues: 'Rakan Sekerja',
        
        // Activities
        activity_work: 'Kerja',
        activity_exercise: 'Senaman',
        activity_social: 'Sosial',
        activity_rest: 'Rehat',
        activity_hobby: 'Hobi',
        activity_meditation: 'Meditasi',
        activity_reading: 'Membaca',
        activity_outdoor: 'Luar',
        
        // Wellness activities page
        activities_title: 'Aktiviti Kesihatan',
        activities_subtitle: 'Aktiviti yang diperibadikan untuk meningkatkan mood dan kesejahteraan anda',
        activities_filter: 'Tapis mengikut Emosi',
        activities_all: 'Semua Aktiviti',
        activities_empty: 'Tiada aktiviti ditemui untuk penapis ini.',
        activities_view_all: 'Lihat Semua Aktiviti',
        activities_helps_with: 'MEMBANTU DENGAN:',
        activities_description: 'PENERANGAN',
        activities_target_emotions: 'MEMBANTU DENGAN EMOSI INI',
        
        // Activity categories
        category_meditation: 'Meditasi',
        category_exercise: 'Senaman',
        category_journaling: 'Jurnal',
        category_social: 'Sosial',
        category_creative: 'Kreatif',
        
        // Difficulty
        difficulty_easy: 'Mudah',
        difficulty_medium: 'Sederhana',
        difficulty_hard: 'Sukar',
        
        // Success messages
        success_mood_saved: 'Mood Disimpan!',
        success_mood_saved_desc: 'Entri mood anda berjaya direkod.',
        success_activity_logged: 'Aktiviti direkod! Kerja yang bagus!',
        
        // Error messages
        error_loading_failed: 'Gagal memuatkan data papan pemuka',
        error_mood_save_failed: 'Gagal menyimpan mood. Sila cuba lagi.',
        error_select_emotion: 'Sila pilih emosi',
        error_activities_load_failed: 'Gagal memuatkan aktiviti kesihatan',
        
        // Theme
        theme_light: 'Mod Terang',
        theme_dark: 'Mod Gelap',
        
        // PWA
        pwa_install_title: 'Pasang MoodMash',
        pwa_install_desc: 'Pasang aplikasi kami untuk akses pantas dan sokongan luar talian',
        pwa_install_btn: 'Pasang',
        pwa_install_later: 'Mungkin Nanti',
        
        // Onboarding (Malay)
        onboarding_welcome_title: 'Welcome to MoodMash',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_free_title: 'Free Tier',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_premium_title: 'Premium Tier',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_next: 'Next',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_get_started: 'Get Started',
        onboarding_slide: 'Slide',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        
        // Chatbot (Malay)
        chatbot_title: 'Mood',
        chatbot_subtitle: 'How can I help you?',
        chatbot_toggle: 'Toggle chatbot',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_send: 'Send message',
        chatbot_greeting1: 'Hello! 👋 I\'m Mood, your personal assistant. How can I help you today?',
        chatbot_greeting2: 'Hi there! I\'m Mood. I\'m here to help you with any questions about MoodMash.',
        chatbot_greeting3: 'Welcome! I\'m Mood. Ask me anything about mood tracking, features, or premium benefits.',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_quick_languages: 'Change language?',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_default1: 'I\'m not sure about that. Try asking about mood logging, premium features, or languages.',
        chatbot_default2: 'Hmm, I don\'t have information on that. Feel free to ask about how MoodMash works!',
        chatbot_default3: 'I\'d love to help! Try asking about features, premium benefits, or getting started.',
        
        // Accessibility (Malay)
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_large: 'Large font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_read: 'Toggle read aloud',
        
        // Auth (Malay)
        auth_login: 'Log masuk',
        auth_logout: 'Log keluar',
        auth_signup: 'Daftar',
        auth_profile: 'Profil',
        auth_settings: 'Tetapan',
        auth_user_menu: 'User menu',
        auth_login_success: 'Welcome back!',
        auth_logout_success: 'Logged out successfully',
        auth_error: 'Authentication failed',
        auth_required: 'Please login to continue',
        auth_premium_required: 'This feature requires Premium',
        auth_upgrade_premium: 'Upgrade to Premium',
        
        // Time formats
        time_minutes: 'minit',
        time_hours: 'jam',
        time_sleep: 'tidur',
    }
};

// i18n Manager
class I18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || this.detectLanguage();
        this.translations = translations;
        this.rtlLanguages = ['ar']; // Add more RTL languages if needed
        this.applyLanguageSettings();
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
    
    isRTL() {
        return this.rtlLanguages.includes(this.currentLanguage);
    }
    
    applyLanguageSettings() {
        // Set document direction and language
        const html = document.documentElement;
        html.setAttribute('lang', this.currentLanguage);
        html.setAttribute('dir', this.isRTL() ? 'rtl' : 'ltr');
        
        // Apply RTL class for styling
        if (this.isRTL()) {
            html.classList.add('rtl');
        } else {
            html.classList.remove('rtl');
        }
    }
    
    t(key) {
        // Try current language first
        if (this.translations[this.currentLanguage] && this.translations[this.currentLanguage][key]) {
            return this.translations[this.currentLanguage][key];
        }
        
        // Fallback to English
        if (this.translations['en'] && this.translations['en'][key]) {
            return this.translations['en'][key];
        }
        
        // Return key if not found
        return key;
    }
    
    getAvailableLanguages() {
        return [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'zh', name: '中文', flag: '🇨🇳' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'it', name: 'Italiano', flag: '🇮🇹' },
            { code: 'ar', name: 'العربية', flag: '🇸🇦' },
            { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
            { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
            { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' },
            { code: 'ko', name: '한국어',
        onboarding_welcome_title: 'Welcome to MoodMash',
        onboarding_welcome_desc: 'Your intelligent companion for emotional wellbeing',
        onboarding_welcome_feature1: '📊 Track your moods with smart analytics',
        onboarding_welcome_feature2: '🎯 Discover personalized wellness activities',
        onboarding_welcome_feature3: '🌍 Available in 13 languages',
        onboarding_free_title: 'Free Tier',
        onboarding_free_desc: 'Everything you need to start tracking your emotional wellbeing',
        onboarding_free_feature1: '✓ Log unlimited mood entries',
        onboarding_free_feature2: '✓ 30-day analytics and insights',
        onboarding_free_feature3: '✓ 10+ wellness activities',
        onboarding_free_feature4: '✓ Mood charts and visualizations',
        onboarding_free_feature5: '✓ 13 language support',
        onboarding_free_price: 'FREE Forever',
        onboarding_premium_title: 'Premium Tier',
        onboarding_premium_desc: 'Unlock advanced features for deeper insights and personalization',
        onboarding_premium_feature1: '⭐ Unlimited analytics history',
        onboarding_premium_feature2: '🤖 AI-powered insights and predictions',
        onboarding_premium_feature3: '📈 Advanced pattern recognition',
        onboarding_premium_feature4: '📊 Export data to CSV/PDF',
        onboarding_premium_feature5: '🎨 Custom themes and widgets',
        onboarding_premium_feature6: '☁️ Cloud sync across devices',
        onboarding_premium_feature7: '🎯 Priority support',
        onboarding_premium_price: '$4.99/month',
        onboarding_start_title: 'Ready to Begin?',
        onboarding_start_desc: 'Start your journey to better emotional wellbeing today',
        onboarding_start_feature1: '🚀 Quick setup - no credit card required',
        onboarding_start_feature2: '🔒 Your data is private and secure',
        onboarding_start_feature3: '💝 Start with free tier, upgrade anytime',
        onboarding_next: 'Next',
        onboarding_prev: 'Previous',
        onboarding_skip: 'Skip tour',
        onboarding_get_started: 'Get Started',
        onboarding_slide: 'Slide',
        onboarding_upgrade_btn: 'Upgrade to Premium',
        onboarding_premium_coming_soon: 'Premium features coming soon! Stay tuned.',
        chatbot_title: 'Mood',
        chatbot_subtitle: 'How can I help you?',
        chatbot_toggle: 'Toggle chatbot',
        chatbot_input_placeholder: 'Type your message...',
        chatbot_send: 'Send message',
        chatbot_greeting1: 'Hello! 👋 I\'m Mood, your personal assistant. How can I help you today?',
        chatbot_greeting2: 'Hi there! I\'m Mood. I\'m here to help you with any questions about MoodMash.',
        chatbot_greeting3: 'Welcome! I\'m Mood. Ask me anything about mood tracking, features, or premium benefits.',
        chatbot_quick_help: 'How to use?',
        chatbot_quick_premium: 'Premium benefits?',
        chatbot_quick_languages: 'Change language?',
        chatbot_faq_log: 'To log a mood: Click "Log Mood" in the navigation, select your emotion, adjust the intensity, add optional context, and click "Save Mood".',
        chatbot_faq_premium: 'Premium costs $4.99/month and includes unlimited history, AI insights, pattern recognition, data export, cloud sync, and priority support.',
        chatbot_faq_languages: 'We support 13 languages! Click the 🌐 icon in the navigation to change your language.',
        chatbot_faq_privacy: 'Your data is encrypted and stored securely. We never share your personal information with third parties.',
        chatbot_faq_activities: 'Browse wellness activities by clicking "Activities" in the navigation. Filter by emotion and start activities to improve your mood.',
        chatbot_faq_export: 'Data export is available in Premium tier. Export your mood history to CSV or PDF format.',
        chatbot_faq_help: 'Need help? Check our documentation or contact support at support@moodmash.com',
        chatbot_default1: 'I\'m not sure about that. Try asking about mood logging, premium features, or languages.',
        chatbot_default2: 'Hmm, I don\'t have information on that. Feel free to ask about how MoodMash works!',
        chatbot_default3: 'I\'d love to help! Try asking about features, premium benefits, or getting started.',
        accessibility_title: 'Accessibility',
        accessibility_toggle: 'Toggle accessibility panel',
        accessibility_read_aloud: 'Read Aloud',
        accessibility_read_aloud_desc: 'Automatically read text on focus',
        accessibility_font_size: 'Font Size',
        accessibility_font_small: 'Small font',
        accessibility_font_normal: 'Normal font',
        accessibility_font_large: 'Large font',
        accessibility_high_contrast: 'High Contrast',
        accessibility_high_contrast_desc: 'Enhanced contrast for better visibility',
        accessibility_keyboard_shortcuts: 'Keyboard Shortcuts',
        accessibility_kb_navigate: 'Navigate elements',
        accessibility_kb_activate: 'Activate element',
        accessibility_kb_close: 'Close dialogs',
        accessibility_kb_read: 'Toggle read aloud',
        auth_login: 'Iniciar sesión',
        auth_logout: 'Cerrar sesión',
        auth_signup: 'Registrarse',
        auth_profile: 'Perfil',
        auth_settings: 'Configuración',
        auth_user_menu: 'User menu',
        auth_login_success: 'Welcome back!',
        auth_logout_success: 'Logged out successfully',
        auth_error: 'Authentication failed',
        auth_required: 'Please login to continue',
        auth_premium_required: 'This feature requires Premium',
        auth_upgrade_premium: 'Upgrade to Premium',
 flag: '🇰🇷' },
            { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' }
        ];
    }
}

// Export for use in other scripts
const i18n = new I18n();

// Make i18n globally available
if (typeof window !== 'undefined') {
    window.i18n = i18n;
}
