/**
 * MoodMash Emergency UI Fixes
 * Version 3.0 - OAuth + UI Comprehensive Fix
 * 
 * Fixes:
 * 1. Hide duplicate template buttons (non-functional)
 * 2. Ensure JavaScript-rendered buttons are visible
 * 3. Fix localStorage tracking prevention errors
 * 4. Fix button positioning and z-index
 * 5. Initialize chatbot and accessibility modules correctly
 * 6. Hide Google OAuth button if credentials not configured
 */

(function() {
    'use strict';
    
    console.log('[MoodMash Emergency Fix v3.0] Loading...');
    
    // ========================================================================
    // Fix 1: Hide Template Buttons (Non-Functional)
    // ========================================================================
    function hideTemplateButtons() {
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
        
        // Wait a bit for modules to render
        setTimeout(() => {
            // Chatbot button
            const chatbotBtn = document.querySelector('#chatbot-toggle');
            if (chatbotBtn) {
                chatbotBtn.style.display = 'flex';
                chatbotBtn.style.zIndex = '9999';
                chatbotBtn.style.position = 'fixed';
                chatbotBtn.style.bottom = '1.5rem'; // bottom-6
                chatbotBtn.style.right = '1.5rem';
                console.log('[Fix] ✓ Chatbot button visible');
            } else {
                console.warn('[Fix] ⚠ Chatbot button not found');
            }
            
            // Accessibility button (at bottom-6)
            const accessibilityBtn = document.querySelector('#accessibility-toggle.fixed.bottom-6');
            if (accessibilityBtn) {
                accessibilityBtn.style.display = 'flex';
                accessibilityBtn.style.zIndex = '9999';
                accessibilityBtn.style.position = 'fixed';
                accessibilityBtn.style.bottom = '1.5rem'; // bottom-6
                accessibilityBtn.style.left = '1.5rem';
                console.log('[Fix] ✓ Accessibility button visible');
            } else {
                console.warn('[Fix] ⚠ Accessibility button not found');
            }
        }, 1000);
    }
    
    // ========================================================================
    // Fix 3: Fix Storage Errors (localStorage tracking prevention)
    // ========================================================================
    function fixStorageErrors() {
        console.log('[Fix] Fixing storage errors...');
        
        // Override localStorage to handle tracking prevention
        const originalSetItem = localStorage.setItem;
        const originalGetItem = localStorage.getItem;
        
        Storage.prototype.setItem = function(key, value) {
            try {
                return originalSetItem.call(this, key, value);
            } catch (e) {
                console.warn('[Fix] localStorage blocked:', key);
                return null;
            }
        };
        
        Storage.prototype.getItem = function(key) {
            try {
                return originalGetItem.call(this, key);
            } catch (e) {
                console.warn('[Fix] localStorage blocked:', key);
                return null;
            }
        };
        
        console.log('[Fix] ✓ Storage error handling applied');
    }
    
    // ========================================================================
    // Fix 4: Force Initialize Modules
    // ========================================================================
    function forceInitializeModules() {
        console.log('[Fix] Force initializing modules...');
        
        // Wait for i18n, then initialize
        const checkAndInitialize = () => {
            if (window.i18n && window.i18n.translations) {
                console.log('[Fix] i18n ready, initializing modules...');
                
                // Initialize chatbot
                if (window.chatbotManager && typeof window.chatbotManager.render === 'function') {
                    try {
                        window.chatbotManager.render();
                        console.log('[Fix] ✓ Chatbot initialized');
                    } catch (e) {
                        console.error('[Fix] Chatbot init error:', e);
                    }
                }
                
                // Initialize accessibility
                if (window.accessibilityManager && typeof window.accessibilityManager.render === 'function') {
                    try {
                        window.accessibilityManager.render();
                        console.log('[Fix] ✓ Accessibility initialized');
                    } catch (e) {
                        console.error('[Fix] Accessibility init error:', e);
                    }
                }
            } else {
                console.log('[Fix] Waiting for i18n...');
                setTimeout(checkAndInitialize, 100);
            }
        };
        
        setTimeout(checkAndInitialize, 500);
    }
    
    // ========================================================================
    // Fix 5: Add CSS Fixes
    // ========================================================================
    function addCSSFixes() {
        console.log('[Fix] Adding CSS fixes...');
        
        const style = document.createElement('style');
        style.textContent = `
            /* Force template buttons to be hidden */
            .fixed.bottom-20#ai-chat-toggle,
            .fixed.bottom-20#accessibility-toggle {
                display: none !important;
            }
            
            /* Ensure JS buttons are visible with high z-index */
            #chatbot-toggle,
            #chatbot-toggle.fixed,
            #accessibility-toggle.fixed.bottom-6 {
                display: flex !important;
                z-index: 9999 !important;
            }
            
            /* Fix chatbot window z-index */
            #chatbot-window {
                z-index: 9998 !important;
            }
            
            /* Fix accessibility panel z-index */
            #accessibility-panel {
                z-index: 9998 !important;
            }
            
            /* Light mode text visibility */
            body:not(.dark) {
                color: #1f2937 !important;
            }
            
            body:not(.dark) h1,
            body:not(.dark) h2,
            body:not(.dark) h3 {
                color: #111827 !important;
            }
        `;
        document.head.appendChild(style);
        console.log('[Fix] ✓ CSS fixes applied');
    }
    
    // ========================================================================
    // Fix 6: Hide Google OAuth Button (Credentials Deleted)
    // ========================================================================
    async function fixOAuthButtons() {
        console.log('[Fix] Checking OAuth configuration...');
        
        try {
            // Check which OAuth providers are configured
            const response = await fetch('/api/oauth/config');
            const data = await response.json();
            
            console.log('[Fix] OAuth providers:', data);
            
            // Hide Google button if not configured
            if (!data.providers.google) {
                console.log('[Fix] Google OAuth not configured, hiding button...');
                
                // Wait for auth manager to render
                setTimeout(() => {
                    // Find and hide Google OAuth button
                    const buttons = document.querySelectorAll('button[onclick*="google"]');
                    buttons.forEach(btn => {
                        const text = btn.textContent || '';
                        if (text.includes('Google')) {
                            btn.style.display = 'none';
                            console.log('[Fix] ✓ Google OAuth button hidden');
                        }
                    });
                }, 1500);
            }
            
            // Hide GitHub button if not configured
            if (!data.providers.github) {
                console.log('[Fix] GitHub OAuth not configured, hiding button...');
                
                setTimeout(() => {
                    const buttons = document.querySelectorAll('button[onclick*="github"]');
                    buttons.forEach(btn => {
                        const text = btn.textContent || '';
                        if (text.includes('GitHub') || text.includes('Github')) {
                            btn.style.display = 'none';
                            console.log('[Fix] ✓ GitHub OAuth button hidden');
                        }
                    });
                }, 1500);
            }
            
        } catch (error) {
            console.error('[Fix] OAuth config check failed:', error);
            // If API not available, just hide Google by default since you deleted creds
            console.log('[Fix] Falling back to hiding Google OAuth button...');
            setTimeout(() => {
                const buttons = document.querySelectorAll('button[onclick*="google"]');
                buttons.forEach(btn => {
                    const text = btn.textContent || '';
                    if (text.includes('Google')) {
                        btn.style.display = 'none';
                        console.log('[Fix] ✓ Google OAuth button hidden (fallback)');
                    }
                });
            }, 1500);
        }
    }
    
    // ========================================================================
    // Execute All Fixes
    // ========================================================================
    function executeAllFixes() {
        console.log('[MoodMash Emergency Fix v3.0] Executing all fixes...');
        
        // Fix 1: Hide template buttons
        hideTemplateButtons();
        
        // Fix 2: Ensure JS buttons visible
        ensureJSButtonsVisible();
        
        // Fix 3: Fix storage errors
        fixStorageErrors();
        
        // Fix 4: Force initialize modules
        forceInitializeModules();
        
        // Fix 5: Add CSS fixes
        addCSSFixes();
        
        // Fix 6: Fix OAuth buttons
        fixOAuthButtons();
        
        console.log('[MoodMash Emergency Fix v3.0] ✓ All fixes applied!');
        
        // Log status after 3 seconds
        setTimeout(() => {
            const chatbotBtn = document.querySelector('#chatbot-toggle');
            const accessibilityBtn = document.querySelector('#accessibility-toggle.fixed.bottom-6');
            const googleBtn = Array.from(document.querySelectorAll('button[onclick*="google"]'))
                .find(btn => (btn.textContent || '').includes('Google'));
            const githubBtn = Array.from(document.querySelectorAll('button[onclick*="github"]'))
                .find(btn => (btn.textContent || '').includes('GitHub'));
            
            console.log('[Fix Status]', {
                chatbotVisible: chatbotBtn ? 'YES' : 'NO',
                accessibilityVisible: accessibilityBtn ? 'YES' : 'NO',
                templateButtonsHidden: document.querySelectorAll('.fixed.bottom-20#ai-chat-toggle, .fixed.bottom-20#accessibility-toggle').length === 0 ? 'YES' : 'NO',
                googleOAuthHidden: !googleBtn || googleBtn.style.display === 'none' ? 'YES' : 'NO',
                githubOAuthVisible: githubBtn && githubBtn.style.display !== 'none' ? 'YES' : 'NO'
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
