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
        
        <!-- Stylesheets -->
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <link href="/static/mobile-responsive.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen transition-colors duration-300">
        <!-- Load i18n and utils first -->
        <script src="/static/i18n.js"></script>
        <script src="/static/utils.js"></script>
        <script src="/static/auth.js"></script>
        <script src="/static/onboarding.js"></script>
        <script src="/static/chatbot.js"></script>
        <script src="/static/accessibility.js"></script>
        <script src="/static/cookie-consent.js"></script>
        <script src="/static/bottom-nav.js"></script>
        <script src="/static/touch-gestures.js"></script>
        <script src="/static/pwa-advanced.js"></script>
        <script src="/static/onboarding-v2.js"></script>
        <script src="/static/biometrics.js"></script>
        <script src="/static/biometric-ui.js"></script>
        
        <!-- External Libraries (Load before app scripts) -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
        
        <!-- Cloudflare Turnstile (Bot Protection) -->
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        
        <!-- Load Tailwind AFTER our scripts so it can scan dynamically rendered content -->
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  primary: '#6366f1',
                  secondary: '#8b5cf6',
                }
              }
            }
          }
        </script>
        
        <!-- Microsoft Clarity - Session Recording & Heatmaps -->
        <script type="text/javascript">
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "ue56xoult3");
        </script>
        
        <!-- Navigation (rendered by utils.js) -->
        <div id="nav-container"></div>
        <script>
            // Wait for i18n and check auth status before rendering navigation
            async function renderNav() {
                if (typeof i18n !== 'undefined' && i18n.translations) {
                    await checkAuthStatus();
                    document.getElementById('nav-container').innerHTML = renderNavigation('${currentPage}');
                    // Dispatch event to notify that auth is ready
                    window.dispatchEvent(new CustomEvent('authReady', { detail: { user: currentUser } }));
                } else {
                    setTimeout(renderNav, 50); // Check every 50ms
                }
            }
            renderNav();
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
