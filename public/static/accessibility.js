// MoodMash Accessibility Features

class AccessibilityManager {
    constructor() {
        this.readAloudEnabled = localStorage.getItem('read_aloud_enabled') === 'true';
        this.highContrastEnabled = localStorage.getItem('high_contrast_enabled') === 'true';
        this.fontSize = localStorage.getItem('font_size') || 'normal';
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        
        this.applySettings();
    }
    
    render() {
        if (document.getElementById('accessibility-container')) return;
        
        const container = document.createElement('div');
        container.id = 'accessibility-container';
        container.innerHTML = `
            <!-- Accessibility Toggle Button -->
            <button id="accessibility-toggle" 
                    class="fixed bottom-6 left-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all z-40 flex items-center justify-center"
                    onclick="accessibilityManager.togglePanel()"
                    aria-label="${i18n.t('accessibility_toggle')}"
                    role="button">
                <i class="fas fa-universal-access text-xl"></i>
            </button>
            
            <!-- Accessibility Panel -->
            <div id="accessibility-panel" 
                 class="fixed bottom-24 left-6 w-80 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 z-40 hidden"
                 role="dialog"
                 aria-labelledby="accessibility-title">
                
                <div class="flex items-center justify-between mb-4">
                    <h3 id="accessibility-title" class="text-lg font-semibold text-gray-800 dark:text-white">
                        <i class="fas fa-universal-access mr-2"></i>
                        ${i18n.t('accessibility_title')}
                    </h3>
                    <button onclick="accessibilityManager.togglePanel()" 
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            aria-label="${i18n.t('btn_close')}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Read Aloud -->
                <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <i class="fas fa-volume-up mr-2"></i>
                            ${i18n.t('accessibility_read_aloud')}
                        </label>
                        <button onclick="accessibilityManager.toggleReadAloud()" 
                                id="read-aloud-toggle"
                                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${this.readAloudEnabled ? 'bg-primary' : 'bg-gray-300'}"
                                role="switch"
                                aria-checked="${this.readAloudEnabled}"
                                aria-label="${i18n.t('accessibility_read_aloud')}">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${this.readAloudEnabled ? 'translate-x-6' : 'translate-x-1'}"></span>
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        ${i18n.t('accessibility_read_aloud_desc')}
                    </p>
                </div>
                
                <!-- Font Size -->
                <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        <i class="fas fa-text-height mr-2"></i>
                        ${i18n.t('accessibility_font_size')}
                    </label>
                    <div class="flex space-x-2">
                        <button onclick="accessibilityManager.setFontSize('small')" 
                                class="flex-1 px-3 py-2 rounded-lg border ${this.fontSize === 'small' ? 'border-primary bg-indigo-50 dark:bg-indigo-900/30 text-primary' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}"
                                aria-label="${i18n.t('accessibility_font_small')}">
                            <span class="text-xs">A</span>
                        </button>
                        <button onclick="accessibilityManager.setFontSize('normal')" 
                                class="flex-1 px-3 py-2 rounded-lg border ${this.fontSize === 'normal' ? 'border-primary bg-indigo-50 dark:bg-indigo-900/30 text-primary' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}"
                                aria-label="${i18n.t('accessibility_font_normal')}">
                            <span class="text-sm">A</span>
                        </button>
                        <button onclick="accessibilityManager.setFontSize('large')" 
                                class="flex-1 px-3 py-2 rounded-lg border ${this.fontSize === 'large' ? 'border-primary bg-indigo-50 dark:bg-indigo-900/30 text-primary' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}"
                                aria-label="${i18n.t('accessibility_font_large')}">
                            <span class="text-base">A</span>
                        </button>
                    </div>
                </div>
                
                <!-- High Contrast -->
                <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <i class="fas fa-adjust mr-2"></i>
                            ${i18n.t('accessibility_high_contrast')}
                        </label>
                        <button onclick="accessibilityManager.toggleHighContrast()" 
                                id="high-contrast-toggle"
                                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${this.highContrastEnabled ? 'bg-primary' : 'bg-gray-300'}"
                                role="switch"
                                aria-checked="${this.highContrastEnabled}"
                                aria-label="${i18n.t('accessibility_high_contrast')}">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${this.highContrastEnabled ? 'translate-x-6' : 'translate-x-1'}"></span>
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        ${i18n.t('accessibility_high_contrast_desc')}
                    </p>
                </div>
                
                <!-- Keyboard Shortcuts -->
                <div>
                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-keyboard mr-2"></i>
                        ${i18n.t('accessibility_keyboard_shortcuts')}
                    </h4>
                    <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div><kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Tab</kbd> ${i18n.t('accessibility_kb_navigate')}</div>
                        <div><kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> ${i18n.t('accessibility_kb_activate')}</div>
                        <div><kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> ${i18n.t('accessibility_kb_close')}</div>
                        <div><kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Alt + R</kbd> ${i18n.t('accessibility_kb_read')}</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Add keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + R: Toggle read aloud
            if (e.altKey && e.key === 'r') {
                e.preventDefault();
                this.toggleReadAloud();
            }
            
            // Alt + A: Toggle accessibility panel
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                this.togglePanel();
            }
        });
        
        // Add focus visible classes for keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    }
    
    togglePanel() {
        const panel = document.getElementById('accessibility-panel');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    }
    
    toggleReadAloud() {
        this.readAloudEnabled = !this.readAloudEnabled;
        localStorage.setItem('read_aloud_enabled', this.readAloudEnabled);
        
        const toggle = document.getElementById('read-aloud-toggle');
        if (toggle) {
            if (this.readAloudEnabled) {
                toggle.classList.add('bg-primary');
                toggle.classList.remove('bg-gray-300');
                toggle.querySelector('span').classList.add('translate-x-6');
                toggle.querySelector('span').classList.remove('translate-x-1');
            } else {
                toggle.classList.remove('bg-primary');
                toggle.classList.add('bg-gray-300');
                toggle.querySelector('span').classList.remove('translate-x-6');
                toggle.querySelector('span').classList.add('translate-x-1');
            }
            toggle.setAttribute('aria-checked', this.readAloudEnabled);
        }
        
        if (!this.readAloudEnabled && this.currentUtterance) {
            this.synth.cancel();
        }
    }
    
    setFontSize(size) {
        this.fontSize = size;
        localStorage.setItem('font_size', size);
        this.applySettings();
        
        // Re-render panel to update button states
        const panel = document.getElementById('accessibility-panel');
        if (panel && !panel.classList.contains('hidden')) {
            panel.remove();
            document.getElementById('accessibility-container')?.remove();
            this.render();
            this.togglePanel(); // Show it again
        }
    }
    
    toggleHighContrast() {
        this.highContrastEnabled = !this.highContrastEnabled;
        localStorage.setItem('high_contrast_enabled', this.highContrastEnabled);
        this.applySettings();
        
        const toggle = document.getElementById('high-contrast-toggle');
        if (toggle) {
            if (this.highContrastEnabled) {
                toggle.classList.add('bg-primary');
                toggle.classList.remove('bg-gray-300');
                toggle.querySelector('span').classList.add('translate-x-6');
                toggle.querySelector('span').classList.remove('translate-x-1');
            } else {
                toggle.classList.remove('bg-primary');
                toggle.classList.add('bg-gray-300');
                toggle.querySelector('span').classList.remove('translate-x-6');
                toggle.querySelector('span').classList.add('translate-x-1');
            }
            toggle.setAttribute('aria-checked', this.highContrastEnabled);
        }
    }
    
    applySettings() {
        const html = document.documentElement;
        
        // Apply font size
        html.classList.remove('font-small', 'font-normal', 'font-large');
        html.classList.add(`font-${this.fontSize}`);
        
        // Apply high contrast
        if (this.highContrastEnabled) {
            html.classList.add('high-contrast');
        } else {
            html.classList.remove('high-contrast');
        }
    }
    
    readText(text) {
        if (!this.readAloudEnabled || !this.synth) return;
        
        // Cancel any ongoing speech
        this.synth.cancel();
        
        // Create utterance
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.lang = i18n.currentLanguage === 'zh' ? 'zh-CN' : i18n.currentLanguage;
        this.currentUtterance.rate = 1.0;
        this.currentUtterance.pitch = 1.0;
        this.currentUtterance.volume = 1.0;
        
        // Speak
        this.synth.speak(this.currentUtterance);
    }
    
    setupReadAloudOnHover() {
        if (!this.readAloudEnabled) return;
        
        // Add read-aloud functionality to key elements
        const elements = document.querySelectorAll('h1, h2, h3, button, a, [data-read-aloud]');
        elements.forEach(el => {
            if (!el.hasAttribute('data-read-listener')) {
                el.setAttribute('data-read-listener', 'true');
                el.addEventListener('focus', () => {
                    const text = el.getAttribute('aria-label') || el.textContent;
                    this.readText(text);
                });
            }
        });
    }
}

// Global instance
const accessibilityManager = new AccessibilityManager();

// Wait for i18n before rendering
function waitForI18n(callback) {
    if (typeof i18n !== 'undefined' && i18n.translations) {
        callback();
    } else {
        setTimeout(() => waitForI18n(callback), 50);
    }
}

// Initialize accessibility features after DOM loads and i18n is ready
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        waitForI18n(() => {
            accessibilityManager.render();
            
            // Setup read-aloud on navigation
            setInterval(() => {
                accessibilityManager.setupReadAloudOnHover();
            }, 2000);
        });
    });
}
