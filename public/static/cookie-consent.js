/**
 * Cookie Consent Banner - GDPR Compliant
 * MoodMash v8.0
 */

(function() {
    'use strict';

    // Cookie consent configuration
    const CONSENT_COOKIE_NAME = 'moodmash_cookie_consent';
    const CONSENT_VERSION = '1.0';
    const CONSENT_EXPIRY_DAYS = 365;

    // Cookie categories
    const COOKIE_CATEGORIES = {
        necessary: {
            name: 'Necessary',
            description: 'Essential cookies for authentication and security',
            required: true,
            enabled: true
        },
        analytics: {
            name: 'Analytics',
            description: 'Help us understand how you use our app',
            required: false,
            enabled: false
        },
        functional: {
            name: 'Functional',
            description: 'Enable enhanced features and personalization',
            required: false,
            enabled: false
        }
    };

    // Get consent from cookie
    function getConsent() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith(CONSENT_COOKIE_NAME + '='));
        if (!cookie) return null;
        
        try {
            return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        } catch (e) {
            return null;
        }
    }

    // Save consent to cookie
    function saveConsent(preferences) {
        const consent = {
            version: CONSENT_VERSION,
            timestamp: new Date().toISOString(),
            preferences: preferences
        };

        const expires = new Date();
        expires.setDate(expires.getDate() + CONSENT_EXPIRY_DAYS);

        document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
        
        return consent;
    }

    // Check if consent is given for a category
    function hasConsent(category) {
        const consent = getConsent();
        if (!consent) return false;
        
        // Necessary cookies are always allowed
        if (category === 'necessary') return true;
        
        return consent.preferences && consent.preferences[category] === true;
    }

    // Apply consent preferences
    function applyConsent(preferences) {
        // Analytics
        if (preferences.analytics) {
            enableAnalytics();
        } else {
            disableAnalytics();
        }

        // Functional
        if (preferences.functional) {
            enableFunctional();
        }
    }

    // Enable analytics tracking
    function enableAnalytics() {
        console.log('Analytics tracking enabled');
        window.analyticsEnabled = true;
        
        // Track page view
        if (typeof trackPageView === 'function') {
            trackPageView(window.location.pathname);
        }
    }

    // Disable analytics tracking
    function disableAnalytics() {
        console.log('Analytics tracking disabled');
        window.analyticsEnabled = false;
    }

    // Enable functional cookies
    function enableFunctional() {
        console.log('Functional cookies enabled');
        window.functionalEnabled = true;
    }

    // Create consent banner HTML
    function createBannerHTML() {
        return `
            <div id="cookie-consent-banner" class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-2xl border-t-2 border-indigo-500 z-50 transform transition-transform duration-300">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <!-- Banner Content -->
                        <div class="flex-1">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-cookie-bite text-3xl text-indigo-600 dark:text-indigo-400 mt-1"></i>
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        We value your privacy
                                    </h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-300">
                                        We use cookies to enhance your experience, analyze site usage, and provide personalized features. 
                                        You can customize your preferences or accept all cookies.
                                        <a href="/privacy-policy" class="text-indigo-600 hover:text-indigo-700 underline ml-1">Learn more</a>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <button 
                                onclick="CookieConsent.showSettings()"
                                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors whitespace-nowrap"
                            >
                                <i class="fas fa-cog mr-2"></i>Customize
                            </button>
                            <button 
                                onclick="CookieConsent.acceptAll()"
                                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap"
                            >
                                <i class="fas fa-check mr-2"></i>Accept All
                            </button>
                            <button 
                                onclick="CookieConsent.rejectAll()"
                                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap"
                            >
                                <i class="fas fa-times mr-2"></i>Reject All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Create settings modal HTML
    function createSettingsHTML() {
        return `
            <div id="cookie-consent-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <!-- Header -->
                    <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                        <div class="flex items-center justify-between">
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                                <i class="fas fa-cookie-bite text-indigo-600 mr-2"></i>
                                Cookie Preferences
                            </h2>
                            <button onclick="CookieConsent.hideSettings()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="px-6 py-4">
                        <p class="text-gray-600 dark:text-gray-300 mb-6">
                            Manage your cookie preferences below. You can enable or disable different types of cookies.
                            Necessary cookies cannot be disabled as they are essential for the website to function.
                        </p>

                        <!-- Cookie Categories -->
                        <div class="space-y-4">
                            <!-- Necessary Cookies -->
                            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-2">
                                            <i class="fas fa-shield-alt text-green-600"></i>
                                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                                Necessary Cookies
                                            </h3>
                                            <span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                                Always Active
                                            </span>
                                        </div>
                                        <p class="text-sm text-gray-600 dark:text-gray-300">
                                            Essential for authentication, security, and basic website functionality. 
                                            These cookies cannot be disabled.
                                        </p>
                                    </div>
                                    <div class="ml-4">
                                        <input type="checkbox" checked disabled class="w-5 h-5 text-indigo-600 rounded" />
                                    </div>
                                </div>
                            </div>

                            <!-- Analytics Cookies -->
                            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-2">
                                            <i class="fas fa-chart-line text-blue-600"></i>
                                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                                Analytics Cookies
                                            </h3>
                                        </div>
                                        <p class="text-sm text-gray-600 dark:text-gray-300">
                                            Help us understand how visitors interact with our website. 
                                            All information is anonymous and helps us improve our service.
                                        </p>
                                    </div>
                                    <div class="ml-4">
                                        <input 
                                            type="checkbox" 
                                            id="cookie-analytics" 
                                            class="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Functional Cookies -->
                            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-2">
                                            <i class="fas fa-magic text-purple-600"></i>
                                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                                Functional Cookies
                                            </h3>
                                        </div>
                                        <p class="text-sm text-gray-600 dark:text-gray-300">
                                            Enable enhanced features and personalization, such as language preferences 
                                            and customized content.
                                        </p>
                                    </div>
                                    <div class="ml-4">
                                        <input 
                                            type="checkbox" 
                                            id="cookie-functional" 
                                            class="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Additional Info -->
                        <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                                <i class="fas fa-info-circle text-indigo-600 mr-2"></i>
                                More Information
                            </h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                For more details about how we use cookies and protect your data, please read our 
                                <a href="/privacy-policy" class="text-indigo-600 hover:text-indigo-700 underline">Privacy Policy</a>.
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                        <div class="flex flex-col sm:flex-row gap-3 justify-end">
                            <button 
                                onclick="CookieConsent.savePreferences()"
                                class="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                            >
                                <i class="fas fa-save mr-2"></i>Save Preferences
                            </button>
                            <button 
                                onclick="CookieConsent.acceptAll()"
                                class="px-6 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-lg font-medium transition-colors"
                            >
                                Accept All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Public API
    window.CookieConsent = {
        init: function() {
            const consent = getConsent();
            
            if (!consent) {
                // Show banner if no consent
                this.showBanner();
            } else {
                // Apply saved preferences
                applyConsent(consent.preferences);
            }
        },

        showBanner: function() {
            // Remove existing banner
            const existing = document.getElementById('cookie-consent-banner');
            if (existing) existing.remove();

            // Add banner to body
            const banner = document.createElement('div');
            banner.innerHTML = createBannerHTML();
            document.body.appendChild(banner.firstElementChild);
        },

        hideBanner: function() {
            const banner = document.getElementById('cookie-consent-banner');
            if (banner) {
                banner.style.transform = 'translateY(100%)';
                setTimeout(() => banner.remove(), 300);
            }
        },

        showSettings: function() {
            this.hideBanner();

            // Remove existing modal
            const existing = document.getElementById('cookie-consent-modal');
            if (existing) existing.remove();

            // Add modal to body
            const modal = document.createElement('div');
            modal.innerHTML = createSettingsHTML();
            document.body.appendChild(modal.firstElementChild);

            // Set current preferences
            const consent = getConsent();
            if (consent) {
                document.getElementById('cookie-analytics').checked = consent.preferences.analytics || false;
                document.getElementById('cookie-functional').checked = consent.preferences.functional || false;
            }
        },

        hideSettings: function() {
            const modal = document.getElementById('cookie-consent-modal');
            if (modal) modal.remove();
        },

        acceptAll: function() {
            const preferences = {
                necessary: true,
                analytics: true,
                functional: true
            };

            saveConsent(preferences);
            applyConsent(preferences);
            
            this.hideBanner();
            this.hideSettings();

            // Show confirmation
            this.showToast('All cookies accepted', 'success');
        },

        rejectAll: function() {
            const preferences = {
                necessary: true,
                analytics: false,
                functional: false
            };

            saveConsent(preferences);
            applyConsent(preferences);
            
            this.hideBanner();
            this.hideSettings();

            // Show confirmation
            this.showToast('Only necessary cookies enabled', 'info');
        },

        savePreferences: function() {
            const preferences = {
                necessary: true,
                analytics: document.getElementById('cookie-analytics').checked,
                functional: document.getElementById('cookie-functional').checked
            };

            saveConsent(preferences);
            applyConsent(preferences);
            
            this.hideSettings();

            // Show confirmation
            this.showToast('Cookie preferences saved', 'success');
        },

        hasConsent: hasConsent,

        resetConsent: function() {
            // Delete consent cookie
            document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            
            // Show banner again
            this.showBanner();
        },

        showToast: function(message, type = 'info') {
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                info: 'bg-blue-500',
                warning: 'bg-yellow-500'
            };

            const toast = document.createElement('div');
            toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300`;
            toast.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fas fa-check-circle"></i>
                    <span>${message}</span>
                </div>
            `;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.transform = 'translateX(400px)';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    };

    // Auto-initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CookieConsent.init());
    } else {
        CookieConsent.init();
    }

})();
