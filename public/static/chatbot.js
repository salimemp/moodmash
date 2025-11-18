// MoodMash Multilingual Chatbot

class ChatbotManager {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.qaDatabase = null; // Will be initialized lazily
    }
    
    getQADatabase() {
        // Lazy initialization to ensure i18n is available
        if (this.qaDatabase) return this.qaDatabase;
        
        if (typeof i18n === 'undefined') {
            console.warn('i18n not loaded yet for chatbot');
            return { greetings: ['Hello!'], faqs: [], defaultResponses: ['Please try again later.'] };
        }
        
        this.qaDatabase = {
            greetings: [
                i18n.t('chatbot_greeting1'),
                i18n.t('chatbot_greeting2'),
                i18n.t('chatbot_greeting3')
            ],
            faqs: [
                {
                    keywords: ['mood', 'log', 'track', 'record'],
                    answer: i18n.t('chatbot_faq_log')
                },
                {
                    keywords: ['premium', 'price', 'subscription', 'cost', 'upgrade'],
                    answer: i18n.t('chatbot_faq_premium')
                },
                {
                    keywords: ['language', 'translate', 'languages'],
                    answer: i18n.t('chatbot_faq_languages')
                },
                {
                    keywords: ['data', 'privacy', 'secure', 'safe'],
                    answer: i18n.t('chatbot_faq_privacy')
                },
                {
                    keywords: ['activity', 'activities', 'wellness', 'exercise'],
                    answer: i18n.t('chatbot_faq_activities')
                },
                {
                    keywords: ['export', 'download', 'backup', 'save'],
                    answer: i18n.t('chatbot_faq_export')
                },
                {
                    keywords: ['help', 'support', 'contact'],
                    answer: i18n.t('chatbot_faq_help')
                }
            ],
            defaultResponses: [
                i18n.t('chatbot_default1'),
                i18n.t('chatbot_default2'),
                i18n.t('chatbot_default3')
            ]
        };
        
        return this.qaDatabase;
    }
    
    render() {
        if (document.getElementById('chatbot-container')) return;
        
        const container = document.createElement('div');
        container.id = 'chatbot-container';
        container.innerHTML = `
            <!-- Chatbot Toggle Button -->
            <button id="chatbot-toggle" 
                    class="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all z-40 flex items-center justify-center"
                    onclick="chatbotManager.toggle()"
                    aria-label="${i18n.t('chatbot_toggle')}"
                    role="button">
                <i class="fas fa-comments text-xl"></i>
                <span id="chatbot-badge" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center hidden">
                    1
                </span>
            </button>
            
            <!-- Chatbot Window -->
            <div id="chatbot-window" 
                 class="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-40 hidden"
                 role="dialog"
                 aria-labelledby="chatbot-title">
                
                <!-- Header -->
                <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-robot text-xl"></i>
                        </div>
                        <div>
                            <h3 id="chatbot-title" class="font-semibold">${i18n.t('chatbot_title')}</h3>
                            <p class="text-xs text-white/80">${i18n.t('chatbot_subtitle')}</p>
                        </div>
                    </div>
                    <button onclick="chatbotManager.toggle()" 
                            class="text-white/80 hover:text-white"
                            aria-label="${i18n.t('btn_close')}">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Messages Area -->
                <div id="chatbot-messages" 
                     class="flex-1 overflow-y-auto p-4 space-y-3"
                     role="log"
                     aria-live="polite"
                     aria-atomic="false">
                    <!-- Messages will be added here -->
                </div>
                
                <!-- Quick Actions -->
                <div id="chatbot-quick-actions" class="px-4 pb-2 flex flex-wrap gap-2">
                    <button onclick="chatbotManager.sendQuickMessage('${i18n.t('chatbot_quick_help')}')" 
                            class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                        ${i18n.t('chatbot_quick_help')}
                    </button>
                    <button onclick="chatbotManager.sendQuickMessage('${i18n.t('chatbot_quick_premium')}')" 
                            class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                        ${i18n.t('chatbot_quick_premium')}
                    </button>
                    <button onclick="chatbotManager.sendQuickMessage('${i18n.t('chatbot_quick_languages')}')" 
                            class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                        ${i18n.t('chatbot_quick_languages')}
                    </button>
                </div>
                
                <!-- Input Area -->
                <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex space-x-2">
                        <input type="text" 
                               id="chatbot-input" 
                               class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                               placeholder="${i18n.t('chatbot_input_placeholder')}"
                               onkeypress="if(event.key==='Enter') chatbotManager.sendMessage()"
                               aria-label="${i18n.t('chatbot_input_placeholder')}">
                        <button onclick="chatbotManager.sendMessage()" 
                                class="px-4 py-2 bg-primary text-white rounded-full hover:bg-indigo-700 transition-colors"
                                aria-label="${i18n.t('chatbot_send')}">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Show welcome message after a delay
        setTimeout(() => {
            const qa = this.getQADatabase();
            this.addBotMessage(qa.greetings[0]);
        }, 1000);
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        const window = document.getElementById('chatbot-window');
        const badge = document.getElementById('chatbot-badge');
        
        if (this.isOpen) {
            window.classList.remove('hidden');
            badge.classList.add('hidden');
            document.getElementById('chatbot-input')?.focus();
        } else {
            window.classList.add('hidden');
        }
    }
    
    sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addUserMessage(message);
        input.value = '';
        
        // Simulate typing delay
        setTimeout(() => {
            const response = this.getResponse(message);
            this.addBotMessage(response);
        }, 500);
    }
    
    sendQuickMessage(message) {
        this.addUserMessage(message);
        
        setTimeout(() => {
            const response = this.getResponse(message);
            this.addBotMessage(response);
        }, 500);
    }
    
    addUserMessage(text) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageEl = document.createElement('div');
        messageEl.className = 'flex justify-end animate-fadeIn';
        messageEl.innerHTML = `
            <div class="max-w-[80%] px-4 py-2 bg-primary text-white rounded-2xl rounded-tr-sm">
                ${this.escapeHtml(text)}
            </div>
        `;
        messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
        
        this.messages.push({ type: 'user', text });
    }
    
    addBotMessage(text) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageEl = document.createElement('div');
        messageEl.className = 'flex justify-start animate-fadeIn';
        messageEl.innerHTML = `
            <div class="max-w-[80%] px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm">
                ${text}
            </div>
        `;
        messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
        
        this.messages.push({ type: 'bot', text });
    }
    
    getResponse(message) {
        const lowerMessage = message.toLowerCase();
        const qa = this.getQADatabase();
        
        // Check FAQs
        for (const faq of qa.faqs) {
            if (faq.keywords.some(keyword => lowerMessage.includes(keyword))) {
                return faq.answer;
            }
        }
        
        // Greeting check
        const greetingWords = ['hello', 'hi', 'hey', 'greetings', 'hola', '你好', 'bonjour', 'hallo', 'ciao', 'مرحبا', 'नमस्ते', 'হ্যালো', 'வணக்கம்', 'こんにちは', '안녕하세요', 'hai'];
        if (greetingWords.some(word => lowerMessage.includes(word))) {
            return qa.greetings[Math.floor(Math.random() * qa.greetings.length)];
        }
        
        // Default response
        return qa.defaultResponses[Math.floor(Math.random() * qa.defaultResponses.length)];
    }
    
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global instance
const chatbotManager = new ChatbotManager();

// Wait for i18n before rendering
function waitForI18n(callback) {
    if (typeof i18n !== 'undefined' && i18n.translations) {
        callback();
    } else {
        setTimeout(() => waitForI18n(callback), 50);
    }
}

// Initialize chatbot after DOM loads and i18n is ready
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        waitForI18n(() => chatbotManager.render());
    });
}
