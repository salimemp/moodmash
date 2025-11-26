// Configure axios to send cookies with all requests
if (typeof axios !== 'undefined') { axios.defaults.withCredentials = true; }

/**
 * Enhanced Interactive Onboarding Flow
 * Version: 10.3 - Mobile Optimized with Gestures
 * 
 * Provides step-by-step onboarding for new users
 */

class OnboardingFlow {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 5;
        this.completed = false;
        this.userData = {};
        
        this.steps = [
            {
                id: 'welcome',
                title: '👋 Welcome to MoodMash!',
                description: 'Your intelligent companion for emotional wellness',
                content: this.renderWelcomeStep.bind(this),
                canSkip: false
            },
            {
                id: 'permissions',
                title: '🔔 Stay Connected',
                description: 'Enable notifications for mood reminders',
                content: this.renderPermissionsStep.bind(this),
                canSkip: true
            },
            {
                id: 'profile',
                title: '👤 Set Up Your Profile',
                description: 'Tell us a bit about yourself',
                content: this.renderProfileStep.bind(this),
                canSkip: false
            },
            {
                id: 'goals',
                title: '🎯 Set Your Goals',
                description: 'What would you like to achieve?',
                content: this.renderGoalsStep.bind(this),
                canSkip: false
            },
            {
                id: 'tour',
                title: '🚀 Quick Tour',
                description: 'Learn the key features',
                content: this.renderTourStep.bind(this),
                canSkip: false
            }
        ];
        
        this.init();
    }
    
    init() {
        // Check if onboarding was completed
        if (this.isOnboardingCompleted()) {
            return;
        }
        
        // Check if user dismissed onboarding
        if (localStorage.getItem('onboarding_dismissed') === 'true') {
            return;
        }
        
        // Show onboarding
        this.show();
    }
    
    isOnboardingCompleted() {
        return localStorage.getItem('onboarding_completed') === 'true';
    }
    
    show() {
        this.createOnboardingContainer();
        this.renderStep(this.currentStep);
        this.addSwipeGestures();
    }
    
    createOnboardingContainer() {
        // Remove existing container
        const existing = document.getElementById('onboarding-container');
        if (existing) {
            existing.remove();
        }
        
        const container = document.createElement('div');
        container.id = 'onboarding-container';
        container.className = 'onboarding-overlay';
        container.innerHTML = `
            <div class="onboarding-modal">
                <div class="onboarding-progress">
                    ${this.renderProgressBar()}
                </div>
                <div class="onboarding-content" id="onboarding-content"></div>
                <div class="onboarding-footer">
                    <button id="onboarding-skip" class="btn-skip"></button>
                    <button id="onboarding-back" class="btn-back">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <button id="onboarding-next" class="btn-next">
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        this.addEventListeners();
        this.addStyles();
        
        // Animate in
        setTimeout(() => container.classList.add('active'), 10);
    }
    
    renderProgressBar() {
        const progress = ((this.currentStep + 1) / this.totalSteps) * 100;
        return `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">Step ${this.currentStep + 1} of ${this.totalSteps}</div>
        `;
    }
    
    renderStep(stepIndex) {
        const step = this.steps[stepIndex];
        const content = document.getElementById('onboarding-content');
        const skipBtn = document.getElementById('onboarding-skip');
        const backBtn = document.getElementById('onboarding-back');
        const nextBtn = document.getElementById('onboarding-next');
        
        if (!content || !step) return;
        
        // Update progress
        const progressContainer = document.querySelector('.onboarding-progress');
        if (progressContainer) {
            progressContainer.innerHTML = this.renderProgressBar();
        }
        
        // Update content with fade animation
        content.style.opacity = '0';
        setTimeout(() => {
            content.innerHTML = `
                <div class="onboarding-step" data-step="${step.id}">
                    <div class="step-icon">
                        <div class="icon-circle">
                            ${step.title.split(' ')[0]}
                        </div>
                    </div>
                    <h2 class="step-title">${step.title.substring(3)}</h2>
                    <p class="step-description">${step.description}</p>
                    <div class="step-content">
                        ${step.content()}
                    </div>
                </div>
            `;
            content.style.opacity = '1';
        }, 200);
        
        // Update buttons
        if (skipBtn) {
            skipBtn.textContent = step.canSkip ? 'Skip' : '';
            skipBtn.style.visibility = step.canSkip ? 'visible' : 'hidden';
        }
        
        if (backBtn) {
            backBtn.style.display = stepIndex > 0 ? 'flex' : 'none';
        }
        
        if (nextBtn) {
            nextBtn.textContent = stepIndex === this.totalSteps - 1 ? 'Get Started! 🎉' : 'Next';
        }
        
        // Vibrate on step change
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }
    
    renderWelcomeStep() {
        return `
            <div class="welcome-animation">
                <div class="mood-icons">
                    <span class="mood-icon">😊</span>
                    <span class="mood-icon">😌</span>
                    <span class="mood-icon">🤗</span>
                    <span class="mood-icon">😴</span>
                </div>
            </div>
            <div class="feature-list">
                <div class="feature-item">
                    <i class="fas fa-chart-line"></i>
                    <span>Track your mood patterns</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-brain"></i>
                    <span>Get AI-powered insights</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-users"></i>
                    <span>Connect with community</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-shield-alt"></i>
                    <span>HIPAA-compliant & secure</span>
                </div>
            </div>
        `;
    }
    
    renderPermissionsStep() {
        return `
            <div class="permission-card">
                <div class="permission-icon">
                    <i class="fas fa-bell fa-3x"></i>
                </div>
                <p class="permission-text">
                    Get gentle reminders to check in with your mood throughout the day.
                </p>
                <button id="enable-notifications" class="btn-primary btn-large">
                    <i class="fas fa-bell"></i> Enable Notifications
                </button>
                <button id="enable-later" class="btn-link">
                    Maybe later
                </button>
            </div>
        `;
    }
    
    renderProfileStep() {
        const savedName = this.userData.name || '';
        const savedTimezone = this.userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        return `
            <form id="profile-form" class="onboarding-form">
                <div class="form-group">
                    <label for="user-name">What should we call you?</label>
                    <input type="text" 
                           id="user-name" 
                           name="name" 
                           placeholder="Your name"
                           value="${savedName}"
                           required
                           autocomplete="given-name">
                </div>
                <div class="form-group">
                    <label for="user-timezone">Your timezone</label>
                    <select id="user-timezone" name="timezone" required>
                        <option value="${savedTimezone}" selected>${savedTimezone}</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                </div>
            </form>
        `;
    }
    
    renderGoalsStep() {
        return `
            <div class="goals-container">
                <p class="goals-intro">Select what matters most to you:</p>
                <div class="goals-grid">
                    <label class="goal-card">
                        <input type="checkbox" name="goal" value="reduce-anxiety">
                        <div class="goal-content">
                            <i class="fas fa-spa"></i>
                            <span>Reduce Anxiety</span>
                        </div>
                    </label>
                    <label class="goal-card">
                        <input type="checkbox" name="goal" value="improve-sleep">
                        <div class="goal-content">
                            <i class="fas fa-bed"></i>
                            <span>Better Sleep</span>
                        </div>
                    </label>
                    <label class="goal-card">
                        <input type="checkbox" name="goal" value="boost-mood">
                        <div class="goal-content">
                            <i class="fas fa-smile-beam"></i>
                            <span>Boost Mood</span>
                        </div>
                    </label>
                    <label class="goal-card">
                        <input type="checkbox" name="goal" value="manage-stress">
                        <div class="goal-content">
                            <i class="fas fa-heartbeat"></i>
                            <span>Manage Stress</span>
                        </div>
                    </label>
                    <label class="goal-card">
                        <input type="checkbox" name="goal" value="build-habits">
                        <div class="goal-content">
                            <i class="fas fa-tasks"></i>
                            <span>Build Habits</span>
                        </div>
                    </label>
                    <label class="goal-card">
                        <input type="checkbox" name="goal" value="track-patterns">
                        <div class="goal-content">
                            <i class="fas fa-chart-line"></i>
                            <span>Track Patterns</span>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }
    
    renderTourStep() {
        return `
            <div class="tour-container">
                <div class="tour-features">
                    <div class="tour-feature">
                        <div class="tour-icon">📊</div>
                        <h4>Dashboard</h4>
                        <p>View your mood history and trends at a glance</p>
                    </div>
                    <div class="tour-feature">
                        <div class="tour-icon">🤖</div>
                        <h4>AI Insights</h4>
                        <p>Get personalized recommendations powered by AI</p>
                    </div>
                    <div class="tour-feature">
                        <div class="tour-icon">👥</div>
                        <h4>Social</h4>
                        <p>Connect with others on similar wellness journeys</p>
                    </div>
                </div>
                <div class="tour-tips">
                    <h4>💡 Pro Tips:</h4>
                    <ul>
                        <li>Swipe left/right to navigate quickly</li>
                        <li>Double-tap to like posts</li>
                        <li>Pull down to refresh</li>
                        <li>Use bottom nav for quick access</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    addEventListeners() {
        const nextBtn = document.getElementById('onboarding-next');
        const backBtn = document.getElementById('onboarding-back');
        const skipBtn = document.getElementById('onboarding-skip');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => this.back());
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skip());
        }
        
        // Add dynamic event listeners for step-specific actions
        setTimeout(() => {
            this.addStepEventListeners();
        }, 300);
    }
    
    addStepEventListeners() {
        const step = this.steps[this.currentStep];
        
        if (step.id === 'permissions') {
            const enableBtn = document.getElementById('enable-notifications');
            const laterBtn = document.getElementById('enable-later');
            
            if (enableBtn) {
                enableBtn.addEventListener('click', () => this.requestNotifications());
            }
            
            if (laterBtn) {
                laterBtn.addEventListener('click', () => this.next());
            }
        }
    }
    
    async requestNotifications() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.showSuccess('Notifications enabled! 🎉');
                this.userData.notifications = true;
            }
        }
        
        setTimeout(() => this.next(), 1000);
    }
    
    next() {
        // Validate current step
        if (!this.validateStep()) {
            return;
        }
        
        // Save step data
        this.saveStepData();
        
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.renderStep(this.currentStep);
            this.addStepEventListeners();
        } else {
            this.complete();
        }
    }
    
    back() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep(this.currentStep);
            this.addStepEventListeners();
        }
    }
    
    skip() {
        localStorage.setItem('onboarding_dismissed', 'true');
        this.hide();
    }
    
    validateStep() {
        const step = this.steps[this.currentStep];
        
        if (step.id === 'profile') {
            const form = document.getElementById('profile-form');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return false;
            }
        }
        
        if (step.id === 'goals') {
            const checked = document.querySelectorAll('input[name="goal"]:checked');
            if (checked.length === 0) {
                this.showError('Please select at least one goal');
                return false;
            }
        }
        
        return true;
    }
    
    saveStepData() {
        const step = this.steps[this.currentStep];
        
        if (step.id === 'profile') {
            const form = document.getElementById('profile-form');
            if (form) {
                const formData = new FormData(form);
                this.userData.name = formData.get('name');
                this.userData.timezone = formData.get('timezone');
            }
        }
        
        if (step.id === 'goals') {
            const goals = Array.from(document.querySelectorAll('input[name="goal"]:checked'))
                .map(input => input.value);
            this.userData.goals = goals;
        }
    }
    
    async complete() {
        // Save user data
        await this.saveUserData();
        
        // Mark as completed
        localStorage.setItem('onboarding_completed', 'true');
        this.completed = true;
        
        // Show completion animation
        this.showCompletion();
        
        // Hide after animation
        setTimeout(() => {
            this.hide();
            window.location.reload();
        }, 2500);
    }
    
    async saveUserData() {
        try {
            // Save to API if available
            if (typeof axios !== 'undefined') {
                await axios.post('/api/user/onboarding', this.userData);
            }
            
            // Save to localStorage as backup
            localStorage.setItem('user_onboarding_data', JSON.stringify(this.userData));
        } catch (error) {
            console.error('[Onboarding] Failed to save user data:', error);
        }
    }
    
    showCompletion() {
        const modal = document.querySelector('.onboarding-modal');
        if (modal) {
            modal.innerHTML = `
                <div class="completion-animation">
                    <div class="completion-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2>You're all set!</h2>
                    <p>Welcome to your wellness journey, ${this.userData.name || 'friend'}! 🎉</p>
                </div>
            `;
        }
        
        // Confetti effect
        this.showConfetti();
    }
    
    showConfetti() {
        // Simple confetti effect
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}%;
                    top: -20px;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
                    z-index: 99999;
                `;
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 4000);
            }, i * 30);
        }
    }
    
    hide() {
        const container = document.getElementById('onboarding-container');
        if (container) {
            container.classList.remove('active');
            setTimeout(() => container.remove(), 300);
        }
    }
    
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'onboarding-toast success';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'onboarding-toast error';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
    }
    
    addSwipeGestures() {
        const content = document.getElementById('onboarding-content');
        if (!content) return;
        
        content.addEventListener('swipeleft', () => this.next());
        content.addEventListener('swiperight', () => this.back());
    }
    
    addStyles() {
        if (document.getElementById('onboarding-v2-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'onboarding-v2-styles';
        style.textContent = `
            /* Onboarding Styles */
            .onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                padding: 20px;
            }
            
            .onboarding-overlay.active {
                opacity: 1;
            }
            
            .onboarding-modal {
                background: white;
                border-radius: 24px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .onboarding-overlay.active .onboarding-modal {
                transform: scale(1);
            }
            
            .onboarding-progress {
                padding: 20px;
                background: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .progress-bar {
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #6366f1, #8b5cf6);
                transition: width 0.3s ease;
            }
            
            .progress-text {
                text-align: center;
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
            }
            
            .onboarding-content {
                flex: 1;
                overflow-y: auto;
                padding: 40px 30px;
                transition: opacity 0.2s ease;
            }
            
            .onboarding-step {
                text-align: center;
            }
            
            .step-icon {
                margin-bottom: 20px;
            }
            
            .icon-circle {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                animation: pulse 2s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .step-title {
                font-size: 28px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 12px;
            }
            
            .step-description {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 30px;
            }
            
            .step-content {
                text-align: left;
            }
            
            .feature-list {
                display: flex;
                flex-direction: column;
                gap: 16px;
                margin-top: 30px;
            }
            
            .feature-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px;
                background: #f9fafb;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 500;
                color: #374151;
            }
            
            .feature-item i {
                font-size: 24px;
                color: #6366f1;
                width: 32px;
                text-align: center;
            }
            
            .onboarding-footer {
                padding: 20px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }
            
            .btn-skip {
                font-size: 14px;
                color: #6b7280;
                background: none;
                border: none;
                cursor: pointer;
                padding: 8px;
                min-width: 60px;
            }
            
            .btn-back,
            .btn-next {
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s ease;
            }
            
            .btn-back {
                background: #e5e7eb;
                color: #374151;
            }
            
            .btn-next {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                flex: 1;
                justify-content: center;
            }
            
            .btn-next:active,
            .btn-back:active {
                transform: scale(0.95);
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                padding: 16px 32px;
                border-radius: 12px;
                border: none;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-top: 20px;
            }
            
            .btn-link {
                background: none;
                border: none;
                color: #6b7280;
                font-size: 14px;
                cursor: pointer;
                margin-top: 12px;
                text-decoration: underline;
            }
            
            .onboarding-form {
                margin-top: 20px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }
            
            .form-group input,
            .form-group select {
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.2s;
            }
            
            .form-group input:focus,
            .form-group select:focus {
                outline: none;
                border-color: #6366f1;
            }
            
            .goals-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 12px;
                margin-top: 20px;
            }
            
            .goal-card {
                position: relative;
                cursor: pointer;
            }
            
            .goal-card input {
                position: absolute;
                opacity: 0;
            }
            
            .goal-content {
                padding: 20px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                text-align: center;
                transition: all 0.2s;
                background: white;
            }
            
            .goal-card:hover .goal-content {
                border-color: #6366f1;
            }
            
            .goal-card input:checked + .goal-content {
                border-color: #6366f1;
                background: #eef2ff;
            }
            
            .goal-content i {
                font-size: 32px;
                color: #6366f1;
                margin-bottom: 8px;
                display: block;
            }
            
            .goal-content span {
                font-size: 14px;
                font-weight: 600;
                color: #374151;
            }
            
            .completion-animation {
                padding: 60px 40px;
                text-align: center;
            }
            
            .completion-icon {
                font-size: 80px;
                color: #10b981;
                animation: checkmark 0.5s ease;
                margin-bottom: 20px;
            }
            
            @keyframes checkmark {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            @keyframes confetti-fall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
            
            .onboarding-toast {
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                font-weight: 600;
                z-index: 10001;
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .onboarding-toast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            
            .onboarding-toast.success {
                color: #10b981;
            }
            
            .onboarding-toast.error {
                color: #ef4444;
            }
            
            /* Mobile specific */
            @media (max-width: 768px) {
                .onboarding-modal {
                    max-height: 100vh;
                    height: 100vh;
                    border-radius: 0;
                    max-width: 100%;
                }
                
                .onboarding-content {
                    padding: 30px 20px;
                }
                
                .step-title {
                    font-size: 24px;
                }
                
                .goals-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Initialize onboarding when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new OnboardingFlow();
    });
} else {
    new OnboardingFlow();
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.OnboardingFlow = OnboardingFlow;
}
