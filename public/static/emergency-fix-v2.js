/**
 * MoodMash Emergency UI Fixes
 * Version 2.0 - Comprehensive Fix
 * 
 * Fixes:
 * 1. Hide duplicate template buttons (non-functional)
 * 2. Ensure JavaScript-rendered buttons are visible
 * 3. Fix localStorage tracking prevention errors
 * 4. Fix button positioning and z-index
 * 5. Initialize chatbot and accessibility modules correctly
 */

(function() {
    'use strict';
    
    console.log('[MoodMash Emergency Fix v2.0] Loading...');
    
    // ========================================================================
    // Fix 1: Hide Template Buttons (Non-Functional)
    // ========================================================================
    function hideTemplatButtons() {
        console.log('[Fix] Hiding template buttons...');
        
        // Wait for DOM to be ready
        const hideButtons = () => {
            // Template buttons are at bottom-20 (80px from bottom)
            const templateButtons = document.querySelectorAll('.fixed.bottom-20');
            
            templateButtons.forEach((btn, index) => {
                const id = btn.getAttribute('id');
                if (id === 'ai-chat-toggle' || id === 'accessibility-toggle') {
                    console.log(`[Fix] Hiding template button: ${id}`);
                    btn.style.display = 'none';
                }
            });
        };
        
        // Run immediately and after DOM loads
        hideButtons();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideButtons);
        }
    }
    
    // ========================================================================
    // Fix 2: Ensure JavaScript Buttons Are Visible
    // ========================================================================
    function ensureJSButtonsVisible() {
        console.log('[Fix] Ensuring JS buttons are visible...');
        
        // JavaScript modules create buttons at bottom-6 (24px from bottom)
        const checkInterval = setInterval(() => {
            const chatbotBtn = document.querySelector('#chatbot-toggle');
            const accessibilityBtn = document.querySelector('#accessibility-toggle.fixed.bottom-6');
            
            if (chatbotBtn) {
                console.log('[Fix] ✓ Chatbot button found');
                chatbotBtn.style.display = 'flex';
                chatbotBtn.style.zIndex = '9999';
                chatbotBtn.style.position = 'fixed';
                chatbotBtn.style.bottom = '1.5rem'; // 24px
                chatbotBtn.style.right = '1.5rem';  // 24px
            }
            
            if (accessibilityBtn) {
                console.log('[Fix] ✓ Accessibility button found');
                accessibilityBtn.style.display = 'flex';
                accessibilityBtn.style.zIndex = '9999';
                accessibilityBtn.style.position = 'fixed';
                accessibilityBtn.style.bottom = '1.5rem'; // 24px
                accessibilityBtn.style.left = '1.5rem';   // 24px
            }
            
            // Stop checking after buttons are found or 10 seconds
            if ((chatbotBtn && accessibilityBtn) || Date.now() - startTime > 10000) {
                clearInterval(checkInterval);
                console.log('[Fix] ✓ Button visibility check complete');
            }
        }, 100);
        
        const startTime = Date.now();
    }
    
    // ========================================================================
    // Fix 3: Wrap localStorage to Prevent Tracking Errors
    // ========================================================================
    function fixStorageErrors() {
        console.log('[Fix] Wrapping localStorage...');
        
        // Create safe storage wrapper
        const safeStorage = {
            _data: {},
            
            setItem(key, value) {
                try {
                    localStorage.setItem(key, value);
                    this._data[key] = value;
                } catch (e) {
                    // Silent fallback to memory
                    this._data[key] = value;
                }
            },
            
            getItem(key) {
                try {
                    return localStorage.getItem(key) || this._data[key] || null;
                } catch (e) {
                    return this._data[key] || null;
                }
            },
            
            removeItem(key) {
                try {
                    localStorage.removeItem(key);
                    delete this._data[key];
                } catch (e) {
                    delete this._data[key];
                }
            },
            
            clear() {
                try {
                    localStorage.clear();
                    this._data = {};
                } catch (e) {
                    this._data = {};
                }
            }
        };
        
        // Expose safe storage globally
        window.safeStorage = safeStorage;
        console.log('[Fix] ✓ Safe storage wrapper available at window.safeStorage');
    }
    
    // ========================================================================
    // Fix 4: Force Initialize Chatbot and Accessibility
    // ========================================================================
    function forceInitializeModules() {
        console.log('[Fix] Force initializing modules...');
        
        // Wait for modules to load
        const initModules = () => {
            // Check if chatbot manager exists
            if (typeof window.chatbotManager !== 'undefined' && window.chatbotManager.render) {
                console.log('[Fix] ✓ Chatbot manager found, forcing render...');
                try {
                    window.chatbotManager.render();
                } catch (e) {
                    console.warn('[Fix] Chatbot render error:', e);
                }
            }
            
            // Check if accessibility manager exists
            if (typeof window.accessibilityManager !== 'undefined' && window.accessibilityManager.render) {
                console.log('[Fix] ✓ Accessibility manager found, forcing render...');
                try {
                    window.accessibilityManager.render();
                } catch (e) {
                    console.warn('[Fix] Accessibility render error:', e);
                }
            }
        };
        
        // Try multiple times
        setTimeout(initModules, 500);
        setTimeout(initModules, 1000);
        setTimeout(initModules, 2000);
    }
    
    // ========================================================================
    // Fix 5: Add CSS Fixes
    // ========================================================================
    function addCSSFixes() {
        console.log('[Fix] Adding CSS fixes...');
        
        const style = document.createElement('style');
        style.textContent = `
            /* Hide template buttons */
            .fixed.bottom-20#ai-chat-toggle,
            .fixed.bottom-20#accessibility-toggle {
                display: none !important;
            }
            
            /* Ensure JS buttons are visible */
            #chatbot-toggle,
            #accessibility-toggle.fixed.bottom-6 {
                display: flex !important;
                z-index: 9999 !important;
            }
            
            /* Fix button sizing on mobile */
            @media (max-width: 640px) {
                #chatbot-toggle,
                #accessibility-toggle.fixed.bottom-6 {
                    width: 3.5rem !important;
                    height: 3.5rem !important;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('[Fix] ✓ CSS fixes applied');
    }
    
    // ========================================================================
    // Execute All Fixes
    // ========================================================================
    function executeAllFixes() {
        console.log('[MoodMash Emergency Fix v2.0] Executing all fixes...');
        
        // Fix 1: Hide template buttons
        hideTemplatButtons();
        
        // Fix 2: Ensure JS buttons visible
        ensureJSButtonsVisible();
        
        // Fix 3: Fix storage errors
        fixStorageErrors();
        
        // Fix 4: Force initialize modules
        forceInitializeModules();
        
        // Fix 5: Add CSS fixes
        addCSSFixes();
        
        console.log('[MoodMash Emergency Fix v2.0] ✓ All fixes applied!');
        
        // Log status after 3 seconds
        setTimeout(() => {
            const chatbotBtn = document.querySelector('#chatbot-toggle');
            const accessibilityBtn = document.querySelector('#accessibility-toggle.fixed.bottom-6');
            
            console.log('[Fix Status]', {
                chatbotVisible: chatbotBtn ? 'YES' : 'NO',
                accessibilityVisible: accessibilityBtn ? 'YES' : 'NO',
                templateButtonsHidden: document.querySelectorAll('.fixed.bottom-20#ai-chat-toggle, .fixed.bottom-20#accessibility-toggle').length === 0 ? 'YES' : 'NO'
            });
        }, 3000);
    }
    
    // Execute when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', executeAllFixes);
    } else {
        executeAllFixes();
    }
    
    // Also execute on window load as backup
    window.addEventListener('load', executeAllFixes);
    
})();
