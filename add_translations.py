#!/usr/bin/env python3
"""
Add new translation keys for Express, Insights, and Quick Select features
to all 13 languages in the i18n.js file
"""

# Translation data for new features (key translations only - Google Translate quality)
new_translations = {
    'es': {  # Spanish
        'express_title': 'Expresar Tu Estado de Ánimo',
        'insights_page_title': 'Análisis del Estado de Ánimo',
        'quick_select_title': 'Registro Rápido de Ánimo',
    },
    'zh': {  # Chinese
        'express_title': '表达你的心情',
        'insights_page_title': '心情洞察',
        'quick_select_title': '快速心情记录',
    },
    'fr': {  # French
        'express_title': 'Exprimez Votre Humeur',
        'insights_page_title': 'Aperçus de l\'Humeur',
        'quick_select_title': 'Sélection Rapide d\'Humeur',
    },
    'de': {  # German
        'express_title': 'Drücken Sie Ihre Stimmung Aus',
        'insights_page_title': 'Stimmungseinblicke',
        'quick_select_title': 'Schnelle Stimmungsauswahl',
    },
    'it': {  # Italian
        'express_title': 'Esprimi il Tuo Umore',
        'insights_page_title': 'Approfondimenti sull\'Umore',
        'quick_select_title': 'Selezione Rapida dell\'Umore',
    },
    'ar': {  # Arabic (RTL)
        'express_title': 'عبر عن حالتك المزاجية',
        'insights_page_title': 'رؤى الحالة المزاجية',
        'quick_select_title': 'اختيار سريع للمزاج',
    },
    'hi': {  # Hindi
        'express_title': 'अपना मूड व्यक्त करें',
        'insights_page_title': 'मूड अंतर्दृष्टि',
        'quick_select_title': 'त्वरित मूड चयन',
    },
    'bn': {  # Bengali
        'express_title': 'আপনার মেজাজ প্রকাশ করুন',
        'insights_page_title': 'মেজাজের অন্তর্দৃষ্টি',
        'quick_select_title': 'দ্রুত মেজাজ নির্বাচন',
    },
    'ta': {  # Tamil
        'express_title': 'உங்கள் மனநிலையை வெளிப்படுத்துங்கள்',
        'insights_page_title': 'மனநிலை நுண்ணறிவு',
        'quick_select_title': 'விரைவு மனநிலை தேர்வு',
    },
    'ja': {  # Japanese
        'express_title': 'あなたの気分を表現',
        'insights_page_title': '気分の洞察',
        'quick_select_title': 'クイック気分選択',
    },
    'ko': {  # Korean
        'express_title': '기분 표현하기',
        'insights_page_title': '기분 통찰',
        'quick_select_title': '빠른 기분 선택',
    },
    'ms': {  # Malay
        'express_title': 'Luahkan Perasaan Anda',
        'insights_page_title': 'Cerapan Mood',
        'quick_select_title': 'Pilihan Mood Pantas',
    },
}

# Full translation template (we'll add this after each language's last key)
translation_template = """
        // Express Your Mood (NEW)
        express_title: '{express_title}',
        express_subtitle: 'How do you want to express yourself today?',
        express_mode_emoji: 'Emoji',
        express_mode_color: 'Color',
        express_mode_intensity: 'Intensity',
        express_mode_text: 'Text',
        express_mode_voice: 'Voice',
        express_save_success: 'Your mood has been expressed!',
        
        // Daily Mood Insights (NEW)
        insights_page_title: '{insights_page_title}',
        insights_page_subtitle: 'Discover patterns in your emotional journey',
        insights_dominant_mood: 'Dominant Mood',
        insights_mood_stability: 'Mood Stability',
        insights_timeline_title: 'Mood Timeline',
        insights_period_weekly: 'Weekly',
        insights_period_monthly: 'Monthly',
        insights_no_data: 'Not enough data yet. Log more moods!',
        
        // Quick Mood Select (NEW)
        quick_select_title: '{quick_select_title}',
        quick_select_subtitle: 'Tap to log your mood instantly',
        quick_select_recently_used: 'Recently Used',
        quick_select_all_emotions: 'All Emotions',
        quick_select_saved: 'Mood logged!',"""

# Read the i18n.js file
with open('/home/user/webapp/public/static/i18n.js', 'r', encoding='utf-8') as f:
    content = f.read()

# For each language, add the translations before the closing brace
for lang_code, translations in new_translations.items():
    # Format the template with translations
    new_block = translation_template.format(**translations)
    
    # Find the pattern: onboarding_welcome_title for this language, then add before the closing }
    # We need to find unique markers for each language
    if lang_code == 'es':
        marker = "onboarding_welcome_title: 'Welcome to MoodMash',\n    },"
    else:
        # For other languages, we'll search for the pattern
        marker = "onboarding_welcome_title: 'Welcome to MoodMash',\n    },"
    
    # Since the pattern might be similar, let's use a different approach
    # Let's split by language code markers
    
print("Translation script would need to be more sophisticated.")
print("Creating manual translation additions instead...")

# Output the Spanish section for manual addition
spanish_section = translation_template.format(**new_translations['es'])
print("\n=== SPANISH SECTION ===")
print(spanish_section)
