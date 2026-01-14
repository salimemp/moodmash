// Shared HTML template with PWA support and i18n

export function renderHTML(title: string, content: string, currentPage: string = '') {
    // SEO-optimized metadata
    const pageTitle = `${title} - MoodMash | AI-Powered Mental Wellness Platform`;
    const description = "Track your mood, discover patterns, and improve your mental wellness with AI-powered insights. Free mood tracking app with Gemini AI integration, personalized recommendations, and comprehensive analytics.";
    const keywords = "mood tracker, mental health, emotional wellness, AI mood analysis, mental wellness app, mood diary, anxiety tracker, depression tracking, emotional health, wellness journal, mental health support, mood patterns, AI therapy assistant, mindfulness app, emotional intelligence";
    const siteUrl = "https://moodmash.win";
    const imageUrl = `${siteUrl}/og-image.png`;
    const author = "MoodMash Team";
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title>${pageTitle}</title>
        
        <!-- Primary Meta Tags -->
        <meta name="title" content="${pageTitle}">
        <meta name="description" content="${description}">
        <meta name="keywords" content="${keywords}">
        <meta name="author" content="${author}">
        <meta name="robots" content="index, follow">
        <meta name="language" content="English">
        <meta name="revisit-after" content="7 days">
        <meta name="rating" content="General">
        <meta name="distribution" content="global">
        
        <!-- Canonical URL -->
        <link rel="canonical" href="${siteUrl}/${currentPage || ''}">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${siteUrl}/${currentPage || ''}">
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${imageUrl}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:site_name" content="MoodMash">
        <meta property="og:locale" content="en_US">
        
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="${siteUrl}/${currentPage || ''}">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${imageUrl}">
        <meta name="twitter:creator" content="@moodmash">
        <meta name="twitter:site" content="@moodmash">
        
        <!-- Additional SEO Meta Tags -->
        <meta name="application-name" content="MoodMash">
        <meta name="msapplication-TileColor" content="#6366f1">
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png">
        <meta name="msapplication-config" content="/browserconfig.xml">
        
        <!-- Geographic Meta Tags -->
        <meta name="geo.region" content="US">
        <meta name="geo.placename" content="United States">
        
        <!-- Schema.org JSON-LD -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "MoodMash",
          "url": "${siteUrl}",
          "description": "${description}",
          "applicationCategory": "HealthApplication",
          "operatingSystem": "Web, iOS, Android",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "author": {
            "@type": "Organization",
            "name": "${author}",
            "url": "${siteUrl}"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250",
            "bestRating": "5",
            "worstRating": "1"
          },
          "screenshot": "${imageUrl}",
          "featureList": [
            "AI-Powered Mood Analysis",
            "Pattern Recognition",
            "Personalized Recommendations",
            "Crisis Detection",
            "Wellness Activities",
            "Analytics Dashboard",
            "Privacy-First Design",
            "HIPAA Compliant"
          ]
        }
        </script>
        
        <!-- PWA Meta Tags -->
        <meta name="theme-color" content="#6366f1">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="MoodMash">
        <meta name="mobile-web-app-capable" content="yes">
        
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧠</text></svg>">
        
        <!-- Apple Touch Icons -->
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png">
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png">
        
        <!-- Splash screens for iOS -->
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png">
        
        <!-- Resource Hints for Performance -->
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
        <link rel="preconnect" href="https://challenges.cloudflare.com" crossorigin>
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net">
        <link rel="dns-prefetch" href="//challenges.cloudflare.com">
        
        <!-- Preload Critical Resources -->
        <link rel="preload" href="/static/script-loader.js" as="script">
        <link rel="preload" href="/static/tailwind-complete.css" as="style">
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" crossorigin>
        
        <!-- Prefetch likely-needed resources -->
        <link rel="prefetch" href="/static/i18n/en.json" as="fetch" crossorigin>
        
        <!-- Stylesheets with SRI -->
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" 
              rel="stylesheet" 
              integrity="sha384-iw3OoTErCYJJB9mCa8LNS2hbsQ7M3C0EpIsO/H5+EGAkPGc6rk+V8i04oW/K5xq0" 
              crossorigin="anonymous">
        <link href="/static/tailwind-complete.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <link href="/static/mobile-responsive.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen transition-colors duration-300">
        <!-- External Libraries with SRI (defer for non-blocking) -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js" 
                integrity="sha384-VekiXfVDZuqx75T/YaGfn7/p6+e+D0f/G8UoZ5GBOCMZ89kMW4wTo8PSn6GSzOEl" 
                crossorigin="anonymous" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" 
                integrity="sha384-e6nUZLBkQ86NJ6TVVKAeSaK8jWa3NhkYWZFomE39AvDbQWeie9PlQqM3pmYW5d1g" 
                crossorigin="anonymous" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js" 
                integrity="sha384-DpVxUeeBWjUvUV1czyIHJAjh+jYUZFu2lLakbdua5vbwOrBGi1UgaKCHjTC+x3Ky" 
                crossorigin="anonymous" defer></script>
        
        <!-- Dynamic Script Loader - Handles lazy loading of all other scripts -->
        <script src="/static/script-loader.js"></script>
        
        <!-- Cloudflare Turnstile (Bot Protection) -->
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        
        <!-- Microsoft Clarity - Session Recording & Heatmaps -->
        <!-- Disabled due to CSP restrictions on Cloudflare Pages -->
        <!-- 
        <script type="text/javascript">
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "ue56xoult3");
        </script>
        -->
        
        <!-- Static Navigation (No JavaScript Required) -->
        <nav class="bg-white dark:bg-gray-800 shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <!-- Logo -->
                    <div class="flex items-center">
                        <a href="/" class="flex items-center space-x-3">
                            <i class="fas fa-brain text-indigo-600 text-2xl"></i>
                            <span class="text-2xl font-bold text-gray-800 dark:text-white">MoodMash</span>
                        </a>
                    </div>
                    
                    <!-- Navigation Links -->
                    <div class="hidden md:flex items-center space-x-6">
                        <a href="/" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            <i class="fas fa-home mr-1"></i> Dashboard
                        </a>
                        <a href="/log" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            <i class="fas fa-smile mr-1"></i> Log Mood
                        </a>
                        <a href="/activities" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            <i class="fas fa-heart mr-1"></i> Activities
                        </a>
                        
                        <!-- Features Dropdown -->
                        <div class="relative group">
                            <button class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                                <i class="fas fa-star mr-1"></i> Features
                                <i class="fas fa-chevron-down ml-1 text-xs"></i>
                            </button>
                            <div class="hidden group-hover:block absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                                <div class="py-2">
                                    <div class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">AR & Voice</div>
                                    <a href="/ar-dashboard" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <i class="fas fa-cube mr-2 text-purple-600"></i>AR Dashboard
                                    </a>
                                    <a href="/voice-journal" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <i class="fas fa-microphone mr-2 text-blue-600"></i>Voice Journal
                                    </a>
                                    <a href="/3d-avatar" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <i class="fas fa-robot mr-2 text-indigo-600"></i>3D Avatar
                                    </a>
                                    <div class="my-1 border-t border-gray-200 dark:border-gray-700"></div>
                                    <div class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Social & Progress</div>
                                    <a href="/social-network" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <i class="fas fa-users mr-2 text-green-600"></i>Social Network
                                    </a>
                                    <a href="/gamification" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <i class="fas fa-trophy mr-2 text-yellow-600"></i>Achievements
                                    </a>
                                    <a href="/biometrics" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <i class="fas fa-heartbeat mr-2 text-red-600"></i>Biometrics
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Language Selector -->
                        <div class="relative group">
                            <button class="p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors flex items-center" title="Select Language">
                                <i class="fas fa-globe mr-1"></i>
                                <span class="text-sm font-medium" id="current-language">🇺🇸 EN</span>
                            </button>
                            <div class="hidden group-hover:block absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50" id="lang-dropdown">
                                <div class="py-2">
                                    <!-- Languages will be dynamically loaded -->
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('en')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇺🇸 English
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('es')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇪🇸 Español
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('zh')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇨🇳 中文
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('fr')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇫🇷 Français
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('de')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇩🇪 Deutsch
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('it')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇮🇹 Italiano
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('ar')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇸🇦 العربية
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('hi')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇮🇳 हिन्दी
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('bn')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇧🇩 বাংলা
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('ta')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇮🇳 தமிழ்
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('ja')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇯🇵 日本語
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('ko')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇰🇷 한국어
                                    </button>
                                    <button onclick="if(window.I18n) window.I18n.setLanguage('ms')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        🇲🇾 Bahasa Melayu
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Theme Toggle -->
                        <button onclick="themeManager?.toggle()" class="p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors" title="Toggle theme">
                            <i class="fas fa-moon dark:hidden"></i>
                            <i class="fas fa-sun hidden dark:inline"></i>
                        </button>
                        
                        <!-- Auth Buttons -->
                        <div class="flex items-center space-x-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                            <a href="/login" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                <i class="fas fa-sign-in-alt mr-1"></i> Login
                            </a>
                            <a href="/register" class="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md">
                                <i class="fas fa-user-plus mr-1"></i> Sign Up
                            </a>
                        </div>
                    </div>
                    
                    <!-- Mobile Menu Button -->
                    <button class="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>
                
                <!-- Mobile Menu -->
                <div id="mobile-menu" class="hidden md:hidden pb-4">
                    <div class="flex flex-col space-y-2">
                        <a href="/" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <i class="fas fa-home mr-2"></i> Dashboard
                        </a>
                        <a href="/log" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <i class="fas fa-smile mr-2"></i> Log Mood
                        </a>
                        <a href="/activities" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <i class="fas fa-heart mr-2"></i> Activities
                        </a>
                        <a href="/login" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <i class="fas fa-sign-in-alt mr-2"></i> Login
                        </a>
                        <a href="/register" class="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md">
                            <i class="fas fa-user-plus mr-2"></i> Sign Up
                        </a>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- AI Chatbot Button (Fixed Bottom Right) -->
        <button 
            id="ai-chat-toggle" 
            class="fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center group"
            style="z-index: 9999;"
            title="AI Chat Assistant"
        >
            <i class="fas fa-robot text-xl"></i>
            <span class="absolute right-16 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                AI Assistant
            </span>
        </button>
        
        <!-- Accessibility Button (Fixed Bottom Left) -->
        <button 
            id="accessibility-toggle" 
            class="fixed bottom-20 left-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center group"
            style="z-index: 9999;"
            title="Accessibility Options"
        >
            <i class="fas fa-universal-access text-xl"></i>
            <span class="absolute left-16 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Accessibility
            </span>
        </button>
        
        <script>
            // Initialize after scripts are loaded
            function initializeApp() {
                // Initialize language selector with all 13 languages
                if (window.I18n) {
                    const langs = I18n.getAvailableLanguages();
                    const currentLangBtn = document.getElementById('current-language');
                    
                    // Update current language display
                    const updateCurrentLanguage = () => {
                        const current = langs.find(l => l.code === I18n.currentLanguage);
                        if (current && currentLangBtn) {
                            currentLangBtn.textContent = current.flag + ' ' + current.code.toUpperCase();
                        }
                    };
                    
                    // Initial update
                    updateCurrentLanguage();
                    
                    // Listen for language changes
                    window.addEventListener('i18n:languageChanged', updateCurrentLanguage);
                }
                
                // Initialize AI Chatbot button
                const aiChatBtn = document.getElementById('ai-chat-toggle');
                if (aiChatBtn) {
                    aiChatBtn.addEventListener('click', () => {
                        window.location.href = '/ai-chat';
                    });
                }
                
                // Initialize Accessibility button
                const a11yBtn = document.getElementById('accessibility-toggle');
                if (a11yBtn) {
                    a11yBtn.addEventListener('click', () => {
                        const a11yPanel = document.getElementById('accessibility-panel');
                        if (a11yPanel) {
                            a11yPanel.classList.toggle('hidden');
                        }
                    });
                }
                
                // Check authentication after auth script loads
                if (typeof checkAuthStatus === 'function') {
                    checkAuthStatus().then(() => {
                        window.dispatchEvent(new CustomEvent('authReady', { detail: { user: window.currentUser } }));
                    });
                }
            }
            
            // Wait for scripts to be ready
            window.addEventListener('scriptsReady', initializeApp);
            window.addEventListener('i18n:ready', () => {
                const currentLangBtn = document.getElementById('current-language');
                if (currentLangBtn && window.I18n) {
                    const langs = I18n.getAvailableLanguages();
                    const current = langs.find(l => l.code === I18n.currentLanguage);
                    if (current) {
                        currentLangBtn.textContent = current.flag + ' ' + current.code.toUpperCase();
                    }
                }
            });
            
            // Fallback if scriptsReady doesn't fire
            setTimeout(() => {
                if (!window._appInitialized) {
                    window._appInitialized = true;
                    initializeApp();
                }
            }, 3000);
        </script>

        <!-- Main Content -->
        <div id="app" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            ${content}
        </div>
    </body>
    </html>
  `;
}

export function renderLoadingState() {
    return `
        <div id="loading" class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-primary"></i>
            <p class="mt-4 text-gray-600 dark:text-gray-300" id="loading-text">Loading...</p>
            <script>
                document.getElementById('loading-text').textContent = i18n.t('loading_data');
            </script>
        </div>
    `;
}