// MoodMash Onboarding System

class OnboardingManager {
    constructor() {
        this.currentSlide = 0;
        this.slides = null; // Will be initialized lazily
        this.hasSeenOnboarding = localStorage.getItem('onboarding_completed') === 'true';
    }
    
    getSlides() {
        // Lazy initialization to ensure i18n is available
        if (this.slides) return this.slides;
        
        if (typeof i18n === 'undefined' || !i18n.translations) {
            console.warn('i18n not loaded yet, using fallback');
            return [];
        }
        
        // Verify English translations exist
        if (!i18n.translations.en) {
            console.error('English translations missing!');
            return [];
        }
        
        this.slides = [
            {
                icon: '🧠',
                title: i18n.t('onboarding_welcome_title'),
                description: i18n.t('onboarding_welcome_desc'),
                features: [
                    i18n.t('onboarding_welcome_feature1'),
                    i18n.t('onboarding_welcome_feature2'),
                    i18n.t('onboarding_welcome_feature3')
                ],
                type: 'welcome'
            },
            {
                icon: '📊',
                title: i18n.t('onboarding_free_title'),
                description: i18n.t('onboarding_free_desc'),
                features: [
                    i18n.t('onboarding_free_feature1'),
                    i18n.t('onboarding_free_feature2'),
                    i18n.t('onboarding_free_feature3'),
                    i18n.t('onboarding_free_feature4'),
                    i18n.t('onboarding_free_feature5')
                ],
                price: i18n.t('onboarding_free_price'),
                type: 'free'
            },
            {
                icon: '⭐',
                title: i18n.t('onboarding_premium_title'),
                description: i18n.t('onboarding_premium_desc'),
                features: [
                    i18n.t('onboarding_premium_feature1'),
                    i18n.t('onboarding_premium_feature2'),
                    i18n.t('onboarding_premium_feature3'),
                    i18n.t('onboarding_premium_feature4'),
                    i18n.t('onboarding_premium_feature5'),
                    i18n.t('onboarding_premium_feature6'),
                    i18n.t('onboarding_premium_feature7')
                ],
                price: i18n.t('onboarding_premium_price'),
                type: 'premium'
            },
            {
                icon: '🚀',
                title: i18n.t('onboarding_start_title'),
                description: i18n.t('onboarding_start_desc'),
                features: [
                    i18n.t('onboarding_start_feature1'),
                    i18n.t('onboarding_start_feature2'),
                    i18n.t('onboarding_start_feature3')
                ],
                type: 'start'
            }
        ];
        
        return this.slides;
    }
    
    shouldShow() {
        return !this.hasSeenOnboarding;
    }
    
    show() {
        if (!this.shouldShow()) return;
        
        this.currentSlide = 0;
        this.renderModal();
    }
    
    renderModal() {
        const modal = document.createElement('div');
        modal.id = 'onboarding-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'onboarding-title');
        
        modal.innerHTML = this.renderSlide();
        document.body.appendChild(modal);
        
        // Add keyboard navigation
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.previousSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });
    }
    
    renderSlide() {
        const slides = this.getSlides();
        if (!slides || slides.length === 0) {
            return '<div>Loading...</div>';
        }
        
        const slide = slides[this.currentSlide];
        const isLast = this.currentSlide === slides.length - 1;
        const isFirst = this.currentSlide === 0;
        
        let featuresHTML = slide.features.map(f => `
            <div class="flex items-start mb-3">
                <i class="fas fa-check-circle text-green-500 mt-1 mr-3 flex-shrink-0"></i>
                <span class="text-gray-700 dark:text-gray-300">${f}</span>
            </div>
        `).join('');
        
        let priceHTML = '';
        if (slide.price) {
            priceHTML = `
                <div class="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-center">
                    <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${slide.price}</span>
                </div>
            `;
        }
        
        let actionButton = '';
        if (slide.type === 'premium') {
            actionButton = `
                <button class="w-full mb-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold transition-all transform hover:scale-105" 
                        onclick="onboardingManager.upgradeToPremium()"
                        aria-label="${i18n.t('onboarding_upgrade_btn')}">
                    <i class="fas fa-crown mr-2"></i>${i18n.t('onboarding_upgrade_btn')}
                </button>
            `;
        }
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
                <!-- Header -->
                <div class="relative p-8 pb-6">
                    <button onclick="onboardingManager.close()" 
                            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                            aria-label="${i18n.t('btn_close')}">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="text-center mb-6">
                        <div class="text-6xl mb-4">${slide.icon}</div>
                        <h2 id="onboarding-title" class="text-3xl font-bold text-gray-800 dark:text-white mb-3">
                            ${slide.title}
                        </h2>
                        <p class="text-gray-600 dark:text-gray-400 text-lg">
                            ${slide.description}
                        </p>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="px-8 pb-6">
                    ${featuresHTML}
                    ${priceHTML}
                </div>
                
                <!-- Actions -->
                <div class="px-8 pb-8">
                    ${actionButton}
                    
                    <!-- Navigation -->
                    <div class="flex items-center justify-between">
                        <button onclick="onboardingManager.previousSlide()" 
                                class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ${isFirst ? 'invisible' : ''}"
                                aria-label="${i18n.t('onboarding_prev')}">
                            <i class="fas fa-arrow-left mr-2"></i>${i18n.t('onboarding_prev')}
                        </button>
                        
                        <!-- Progress dots -->
                        <div class="flex space-x-2">
                            ${slides.map((_, i) => `
                                <button onclick="onboardingManager.goToSlide(${i})"
                                        class="w-2 h-2 rounded-full transition-all ${i === this.currentSlide ? 'bg-primary w-8' : 'bg-gray-300 dark:bg-gray-600'}"
                                        aria-label="${i18n.t('onboarding_slide')} ${i + 1}"></button>
                            `).join('')}
                        </div>
                        
                        <button onclick="onboardingManager.${isLast ? 'complete' : 'nextSlide'}()" 
                                class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-semibold"
                                aria-label="${isLast ? i18n.t('onboarding_get_started') : i18n.t('onboarding_next')}">
                            ${isLast ? i18n.t('onboarding_get_started') : i18n.t('onboarding_next')}
                            <i class="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                    
                    ${isLast ? `
                        <button onclick="onboardingManager.complete()" 
                                class="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                aria-label="${i18n.t('onboarding_skip')}">
                            ${i18n.t('onboarding_skip')}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    nextSlide() {
        const slides = this.getSlides();
        if (slides && this.currentSlide < slides.length - 1) {
            this.currentSlide++;
            this.updateSlide();
        }
    }
    
    previousSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.updateSlide();
        }
    }
    
    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlide();
    }
    
    updateSlide() {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            modal.innerHTML = this.renderSlide();
        }
    }
    
    complete() {
        localStorage.setItem('onboarding_completed', 'true');
        this.hasSeenOnboarding = true;
        this.close();
    }
    
    close() {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    upgradeToPremium() {
        // For MVP, just show a message
        alert(i18n.t('onboarding_premium_coming_soon'));
    }
    
    reset() {
        localStorage.removeItem('onboarding_completed');
        this.hasSeenOnboarding = false;
    }
}

// Global instance
const onboardingManager = new OnboardingManager();

// Auto-show on first visit
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            onboardingManager.show();
        }, 500);
    });
}
