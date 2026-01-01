/**
 * Emergency Fix for MoodMash UI Issues
 * This file fixes button positioning and visibility without requiring a rebuild
 * 
 * Issues Fixed:
 * 1. Hide duplicate template buttons (non-functional)
 * 2. Ensure chatbot.js and accessibility.js buttons are visible
 * 3. Fix z-index conflicts
 */

(function() {
    'use strict';
    
    console.log('[Emergency Fix] Loading UI fixes...');
    
    // Fix 1: Hide template buttons that don't work
    function hideTemplateButtons() {
        // The template creates buttons at bottom-20, but chatbot.js/accessibility.js create at bottom-6
        // Hide the template buttons
        const templateAIBtn = document.querySelector('#ai-chat-toggle.fixed.bottom-20');
        const templateA11yBtn = document.querySelector('#accessibility-toggle.fixed.bottom-20');
        
        if (templateAIBtn) {
            console.log('[Emergency Fix] Hiding template AI button');
            templateAIBtn.style.display = 'none';
        }
        
        if (templateA11yBtn) {
            console.log('[Emergency Fix] Hiding template accessibility button');
            templateA11yBtn.style.display = 'none';
        }
    }
    
    // Fix 2: Ensure JavaScript-rendered buttons are visible
    function ensureJSButtonsVisible() {
        // Wait for chatbot.js and accessibility.js to render their buttons
        setTimeout(() => {
            const chatbotToggle = document.querySelector('#chatbot-toggle');
            const a11yToggle = document.querySelector('#accessibility-toggle.fixed.bottom-6');
            
            if (chatbotToggle) {
                console.log('[Emergency Fix] Chatbot button found and visible');
                chatbotToggle.style.zIndex = '9999';
            } else {
                console.warn('[Emergency Fix] Chatbot button not found - chatbot.js may not be loaded');
            }
            
            if (a11yToggle) {
                console.log('[Emergency Fix] Accessibility button found and visible');
                a11yToggle.style.zIndex = '9999';
            } else {
                console.warn('[Emergency Fix] Accessibility button not found - accessibility.js may not be loaded');
            }
        }, 1000);
    }
    
    // Fix 3: Fix tracking prevention storage warnings
    function fixStorageWarnings() {
        // Wrap localStorage access in try-catch to prevent errors
        const originalSetItem = localStorage.setItem;
        const originalGetItem = localStorage.getItem;
        const originalRemoveItem = localStorage.removeItem;
        
        localStorage.setItem = function(key, value) {
            try {
                return originalSetItem.call(this, key, value);
            } catch (e) {
                console.warn('[Emergency Fix] Storage blocked for key:', key);
                return null;
            }
        };
        
        localStorage.getItem = function(key) {
            try {
                return originalGetItem.call(this, key);
            } catch (e) {
                console.warn('[Emergency Fix] Storage blocked for key:', key);
                return null;
            }
        };
        
        localStorage.removeItem = function(key) {
            try {
                return originalRemoveItem.call(this, key);
            } catch (e) {
                console.warn('[Emergency Fix] Storage blocked for key:', key);
                return null;
            }
        };
    }
    
    // Execute fixes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            hideTemplateButtons();
            ensureJSButtonsVisible();
            fixStorageWarnings();
        });
    } else {
        hideTemplateButtons();
        ensureJSButtonsVisible();
        fixStorageWarnings();
    }
    
    console.log('[Emergency Fix] UI fixes loaded successfully');
})();
