// Shared HTML template with PWA support and i18n

export function renderHTML(title: string, content: string, currentPage: string = '') {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title>${title} - MoodMash</title>
        
        <!-- PWA Meta Tags -->
        <meta name="description" content="Intelligent mood tracking and emotional wellness platform">
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
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        
        <!-- Tailwind Config -->
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
    </head>
    <body class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen transition-colors duration-300">
        <!-- Load i18n and utils first -->
        <script src="/static/i18n.js"></script>
        <script src="/static/utils.js"></script>
        <script src="/static/onboarding.js"></script>
        <script src="/static/chatbot.js"></script>
        <script src="/static/accessibility.js"></script>
        
        <!-- Navigation (rendered by utils.js) -->
        <div id="nav-container"></div>
        <script>
            document.getElementById('nav-container').innerHTML = renderNavigation('${currentPage}');
        </script>

        <!-- Main Content -->
        <div id="app" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            ${content}
        </div>
        
        <!-- Scripts -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
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
