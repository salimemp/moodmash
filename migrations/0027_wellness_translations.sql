-- Phase 8: Wellness Feature Translations
-- Translations for meditation, yoga, and music features in all supported languages

-- ============================================================================
-- ENGLISH (en) TRANSLATIONS
-- ============================================================================

-- Wellness Dashboard
INSERT OR REPLACE INTO translations (language, key, value) VALUES 
('en', 'wellness.title', 'Wellness Hub'),
('en', 'wellness.subtitle', 'Your journey to mental and physical wellbeing'),
('en', 'wellness.meditation', 'Meditation'),
('en', 'wellness.yoga', 'Yoga'),
('en', 'wellness.music', 'Music Therapy'),
('en', 'wellness.progress', 'Your Progress'),
('en', 'wellness.streak', 'Current Streak'),
('en', 'wellness.total_sessions', 'Total Sessions'),
('en', 'wellness.total_minutes', 'Total Minutes'),

-- Meditation
('en', 'meditation.title', 'Meditation'),
('en', 'meditation.browse', 'Browse Sessions'),
('en', 'meditation.favorites', 'Favorites'),
('en', 'meditation.history', 'History'),
('en', 'meditation.categories', 'Categories'),
('en', 'meditation.start_session', 'Start Session'),
('en', 'meditation.custom_timer', 'Custom Timer'),
('en', 'meditation.mood_before', 'How are you feeling before?'),
('en', 'meditation.mood_after', 'How do you feel now?'),
('en', 'meditation.session_complete', 'Session Complete!'),
('en', 'meditation.great_job', 'Great job on completing your meditation.'),
('en', 'meditation.continue', 'Continue'),
('en', 'meditation.pause', 'Pause'),
('en', 'meditation.resume', 'Resume'),
('en', 'meditation.stop', 'Stop'),
('en', 'meditation.restart', 'Restart'),

-- Meditation Categories
('en', 'meditation.category.stress_relief', 'Stress Relief'),
('en', 'meditation.category.sleep', 'Sleep'),
('en', 'meditation.category.anxiety', 'Anxiety'),
('en', 'meditation.category.focus', 'Focus'),
('en', 'meditation.category.mindfulness', 'Mindfulness'),
('en', 'meditation.category.breathing', 'Breathing'),
('en', 'meditation.category.body_scan', 'Body Scan'),
('en', 'meditation.category.loving_kindness', 'Loving Kindness'),
('en', 'meditation.category.morning', 'Morning'),
('en', 'meditation.category.evening', 'Evening'),

-- Yoga
('en', 'yoga.title', 'Yoga'),
('en', 'yoga.routines', 'Routines'),
('en', 'yoga.poses', 'Poses'),
('en', 'yoga.favorites', 'Favorites'),
('en', 'yoga.history', 'History'),
('en', 'yoga.start_routine', 'Start Routine'),
('en', 'yoga.preview', 'Preview'),
('en', 'yoga.next_pose', 'Next Pose'),
('en', 'yoga.previous_pose', 'Previous Pose'),
('en', 'yoga.routine_complete', 'Routine Complete!'),
('en', 'yoga.great_practice', 'Great job on completing your yoga practice!'),

-- Yoga Categories
('en', 'yoga.category.morning', 'Morning'),
('en', 'yoga.category.evening', 'Evening'),
('en', 'yoga.category.stress_relief', 'Stress Relief'),
('en', 'yoga.category.flexibility', 'Flexibility'),
('en', 'yoga.category.strength', 'Strength'),
('en', 'yoga.category.back_pain', 'Back Pain Relief'),
('en', 'yoga.category.sleep', 'Sleep'),
('en', 'yoga.category.beginner', 'Beginner'),
('en', 'yoga.category.intermediate', 'Intermediate'),
('en', 'yoga.category.advanced', 'Advanced'),

-- Music
('en', 'music.title', 'Music Therapy'),
('en', 'music.playlists', 'Playlists'),
('en', 'music.favorites', 'Favorites'),
('en', 'music.history', 'Listening History'),
('en', 'music.recommendations', 'Recommended for You'),
('en', 'music.play', 'Play'),
('en', 'music.pause', 'Pause'),
('en', 'music.next', 'Next'),
('en', 'music.previous', 'Previous'),
('en', 'music.shuffle', 'Shuffle'),
('en', 'music.repeat', 'Repeat'),

-- Music Categories
('en', 'music.category.calming', 'Calming'),
('en', 'music.category.energizing', 'Energizing'),
('en', 'music.category.focus', 'Focus'),
('en', 'music.category.sleep', 'Sleep'),
('en', 'music.category.anxiety', 'Anxiety Relief'),
('en', 'music.category.meditation', 'Meditation'),
('en', 'music.category.nature', 'Nature Sounds'),
('en', 'music.category.binaural', 'Binaural Beats'),
('en', 'music.category.classical', 'Classical'),
('en', 'music.category.ambient', 'Ambient');

-- ============================================================================
-- ARABIC (ar) TRANSLATIONS
-- ============================================================================

INSERT OR REPLACE INTO translations (language, key, value) VALUES 
('ar', 'wellness.title', 'مركز العافية'),
('ar', 'wellness.subtitle', 'رحلتك نحو الصحة النفسية والجسدية'),
('ar', 'wellness.meditation', 'التأمل'),
('ar', 'wellness.yoga', 'اليوغا'),
('ar', 'wellness.music', 'العلاج بالموسيقى'),
('ar', 'wellness.progress', 'تقدمك'),
('ar', 'wellness.streak', 'السلسلة الحالية'),
('ar', 'wellness.total_sessions', 'إجمالي الجلسات'),
('ar', 'wellness.total_minutes', 'إجمالي الدقائق'),

('ar', 'meditation.title', 'التأمل'),
('ar', 'meditation.browse', 'تصفح الجلسات'),
('ar', 'meditation.favorites', 'المفضلة'),
('ar', 'meditation.history', 'السجل'),
('ar', 'meditation.categories', 'الفئات'),
('ar', 'meditation.start_session', 'بدء الجلسة'),
('ar', 'meditation.custom_timer', 'مؤقت مخصص'),
('ar', 'meditation.mood_before', 'كيف تشعر قبل؟'),
('ar', 'meditation.mood_after', 'كيف تشعر الآن؟'),
('ar', 'meditation.session_complete', 'اكتملت الجلسة!'),
('ar', 'meditation.great_job', 'أحسنت على إكمال تأملك.'),

('ar', 'meditation.category.stress_relief', 'تخفيف التوتر'),
('ar', 'meditation.category.sleep', 'النوم'),
('ar', 'meditation.category.anxiety', 'القلق'),
('ar', 'meditation.category.focus', 'التركيز'),
('ar', 'meditation.category.mindfulness', 'الوعي التام'),
('ar', 'meditation.category.breathing', 'التنفس'),

('ar', 'yoga.title', 'اليوغا'),
('ar', 'yoga.routines', 'البرامج'),
('ar', 'yoga.poses', 'الوضعيات'),
('ar', 'yoga.start_routine', 'بدء البرنامج'),
('ar', 'yoga.routine_complete', 'اكتمل البرنامج!'),

('ar', 'music.title', 'العلاج بالموسيقى'),
('ar', 'music.playlists', 'قوائم التشغيل'),
('ar', 'music.recommendations', 'موصى به لك'),
('ar', 'music.category.calming', 'مهدئ'),
('ar', 'music.category.sleep', 'النوم'),
('ar', 'music.category.nature', 'أصوات الطبيعة');

-- ============================================================================
-- SPANISH (es) TRANSLATIONS
-- ============================================================================

INSERT OR REPLACE INTO translations (language, key, value) VALUES 
('es', 'wellness.title', 'Centro de Bienestar'),
('es', 'wellness.subtitle', 'Tu camino hacia el bienestar mental y físico'),
('es', 'wellness.meditation', 'Meditación'),
('es', 'wellness.yoga', 'Yoga'),
('es', 'wellness.music', 'Musicoterapia'),
('es', 'wellness.progress', 'Tu Progreso'),
('es', 'wellness.streak', 'Racha Actual'),
('es', 'wellness.total_sessions', 'Sesiones Totales'),
('es', 'wellness.total_minutes', 'Minutos Totales'),

('es', 'meditation.title', 'Meditación'),
('es', 'meditation.browse', 'Explorar Sesiones'),
('es', 'meditation.favorites', 'Favoritos'),
('es', 'meditation.history', 'Historial'),
('es', 'meditation.categories', 'Categorías'),
('es', 'meditation.start_session', 'Iniciar Sesión'),
('es', 'meditation.custom_timer', 'Temporizador Personalizado'),
('es', 'meditation.mood_before', '¿Cómo te sientes antes?'),
('es', 'meditation.mood_after', '¿Cómo te sientes ahora?'),
('es', 'meditation.session_complete', '¡Sesión Completada!'),
('es', 'meditation.great_job', 'Excelente trabajo completando tu meditación.'),

('es', 'meditation.category.stress_relief', 'Alivio del Estrés'),
('es', 'meditation.category.sleep', 'Sueño'),
('es', 'meditation.category.anxiety', 'Ansiedad'),
('es', 'meditation.category.focus', 'Concentración'),
('es', 'meditation.category.mindfulness', 'Atención Plena'),
('es', 'meditation.category.breathing', 'Respiración'),

('es', 'yoga.title', 'Yoga'),
('es', 'yoga.routines', 'Rutinas'),
('es', 'yoga.poses', 'Posturas'),
('es', 'yoga.start_routine', 'Iniciar Rutina'),
('es', 'yoga.routine_complete', '¡Rutina Completada!'),

('es', 'music.title', 'Musicoterapia'),
('es', 'music.playlists', 'Listas de Reproducción'),
('es', 'music.recommendations', 'Recomendado para Ti'),
('es', 'music.category.calming', 'Relajante'),
('es', 'music.category.sleep', 'Sueño'),
('es', 'music.category.nature', 'Sonidos de la Naturaleza');

-- ============================================================================
-- FRENCH (fr) TRANSLATIONS
-- ============================================================================

INSERT OR REPLACE INTO translations (language, key, value) VALUES 
('fr', 'wellness.title', 'Centre de Bien-être'),
('fr', 'wellness.subtitle', 'Votre parcours vers le bien-être mental et physique'),
('fr', 'wellness.meditation', 'Méditation'),
('fr', 'wellness.yoga', 'Yoga'),
('fr', 'wellness.music', 'Musicothérapie'),
('fr', 'wellness.progress', 'Votre Progression'),
('fr', 'wellness.streak', 'Série Actuelle'),
('fr', 'wellness.total_sessions', 'Sessions Totales'),
('fr', 'wellness.total_minutes', 'Minutes Totales'),

('fr', 'meditation.title', 'Méditation'),
('fr', 'meditation.browse', 'Parcourir les Sessions'),
('fr', 'meditation.favorites', 'Favoris'),
('fr', 'meditation.history', 'Historique'),
('fr', 'meditation.categories', 'Catégories'),
('fr', 'meditation.start_session', 'Démarrer la Session'),
('fr', 'meditation.custom_timer', 'Minuteur Personnalisé'),
('fr', 'meditation.mood_before', 'Comment vous sentez-vous avant ?'),
('fr', 'meditation.mood_after', 'Comment vous sentez-vous maintenant ?'),
('fr', 'meditation.session_complete', 'Session Terminée !'),
('fr', 'meditation.great_job', 'Bravo pour avoir terminé votre méditation.'),

('fr', 'meditation.category.stress_relief', 'Réduction du Stress'),
('fr', 'meditation.category.sleep', 'Sommeil'),
('fr', 'meditation.category.anxiety', 'Anxiété'),
('fr', 'meditation.category.focus', 'Concentration'),
('fr', 'meditation.category.mindfulness', 'Pleine Conscience'),
('fr', 'meditation.category.breathing', 'Respiration'),

('fr', 'yoga.title', 'Yoga'),
('fr', 'yoga.routines', 'Routines'),
('fr', 'yoga.poses', 'Postures'),
('fr', 'yoga.start_routine', 'Démarrer la Routine'),
('fr', 'yoga.routine_complete', 'Routine Terminée !'),

('fr', 'music.title', 'Musicothérapie'),
('fr', 'music.playlists', 'Listes de Lecture'),
('fr', 'music.recommendations', 'Recommandé pour Vous'),
('fr', 'music.category.calming', 'Apaisant'),
('fr', 'music.category.sleep', 'Sommeil'),
('fr', 'music.category.nature', 'Sons de la Nature');

-- ============================================================================
-- GERMAN (de) TRANSLATIONS
-- ============================================================================

INSERT OR REPLACE INTO translations (language, key, value) VALUES 
('de', 'wellness.title', 'Wellness-Zentrum'),
('de', 'wellness.subtitle', 'Ihr Weg zu mentalem und körperlichem Wohlbefinden'),
('de', 'wellness.meditation', 'Meditation'),
('de', 'wellness.yoga', 'Yoga'),
('de', 'wellness.music', 'Musiktherapie'),
('de', 'wellness.progress', 'Ihr Fortschritt'),
('de', 'wellness.streak', 'Aktuelle Serie'),
('de', 'wellness.total_sessions', 'Gesamtsitzungen'),
('de', 'wellness.total_minutes', 'Gesamtminuten'),

('de', 'meditation.title', 'Meditation'),
('de', 'meditation.browse', 'Sitzungen Durchsuchen'),
('de', 'meditation.favorites', 'Favoriten'),
('de', 'meditation.history', 'Verlauf'),
('de', 'meditation.categories', 'Kategorien'),
('de', 'meditation.start_session', 'Sitzung Starten'),
('de', 'meditation.custom_timer', 'Benutzerdefinierter Timer'),
('de', 'meditation.mood_before', 'Wie fühlen Sie sich vorher?'),
('de', 'meditation.mood_after', 'Wie fühlen Sie sich jetzt?'),
('de', 'meditation.session_complete', 'Sitzung Abgeschlossen!'),
('de', 'meditation.great_job', 'Gut gemacht bei der Meditation.'),

('de', 'meditation.category.stress_relief', 'Stressabbau'),
('de', 'meditation.category.sleep', 'Schlaf'),
('de', 'meditation.category.anxiety', 'Angst'),
('de', 'meditation.category.focus', 'Fokus'),
('de', 'meditation.category.mindfulness', 'Achtsamkeit'),
('de', 'meditation.category.breathing', 'Atmung'),

('de', 'yoga.title', 'Yoga'),
('de', 'yoga.routines', 'Routinen'),
('de', 'yoga.poses', 'Posen'),
('de', 'yoga.start_routine', 'Routine Starten'),
('de', 'yoga.routine_complete', 'Routine Abgeschlossen!'),

('de', 'music.title', 'Musiktherapie'),
('de', 'music.playlists', 'Wiedergabelisten'),
('de', 'music.recommendations', 'Empfohlen für Sie'),
('de', 'music.category.calming', 'Beruhigend'),
('de', 'music.category.sleep', 'Schlaf'),
('de', 'music.category.nature', 'Naturgeräusche');
