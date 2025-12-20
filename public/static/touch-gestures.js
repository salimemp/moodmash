/**
 * Touch Gesture Support for Mobile Devices
 * Version: 10.2 - Mobile Optimization
 * 
 * Provides swipe, pinch, long-press, and other touch interactions
 */

class TouchGestureHandler {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.touchStartTime = 0;
        this.longPressTimer = null;
        this.tapCount = 0;
        this.tapTimer = null;
        this.pinchDistance = 0;
        
        this.SWIPE_THRESHOLD = 50;
        this.LONG_PRESS_DURATION = 500;
        this.DOUBLE_TAP_DELAY = 300;
        this.PINCH_THRESHOLD = 50;
        
        this.init();
    }
    
    init() {
        // Don't initialize on desktop
        if (!this.isMobileDevice()) {
            return;
        }
        
        // Add touch event listeners
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Add pull-to-refresh
        this.initPullToRefresh();
        
        // Add haptic feedback support
        this.initHapticFeedback();
        
        console.log('[TouchGestures] Initialized');
    }
    
    isMobileDevice() {
        return window.innerWidth < 768 || 
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
        
        // Handle pinch gesture
        if (e.touches.length === 2) {
            this.handlePinchStart(e);
        }
        
        // Start long press timer
        this.longPressTimer = setTimeout(() => {
            this.handleLongPress(e);
        }, this.LONG_PRESS_DURATION);
    }
    
    handleTouchMove(e) {
        // Cancel long press if moved
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Handle pinch gesture
        if (e.touches.length === 2) {
            this.handlePinchMove(e);
        }
    }
    
    handleTouchEnd(e) {
        // Cancel long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        const touch = e.changedTouches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
        
        // Calculate swipe
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const duration = Date.now() - this.touchStartTime;
        
        // Handle swipe gestures
        if (Math.abs(deltaX) > this.SWIPE_THRESHOLD || Math.abs(deltaY) > this.SWIPE_THRESHOLD) {
            this.handleSwipe(deltaX, deltaY, e);
        }
        
        // Handle tap gestures
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && duration < 200) {
            this.handleTap(e);
        }
    }
    
    handleSwipe(deltaX, deltaY, event) {
        const target = event.target;
        
        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
                this.dispatchGestureEvent('swiperight', target, { deltaX, deltaY });
            } else {
                this.dispatchGestureEvent('swipeleft', target, { deltaX, deltaY });
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                this.dispatchGestureEvent('swipedown', target, { deltaX, deltaY });
            } else {
                this.dispatchGestureEvent('swipeup', target, { deltaX, deltaY });
            }
        }
        
        // Haptic feedback
        this.vibrate(10);
    }
    
    handleTap(event) {
        const target = event.target;
        this.tapCount++;
        
        // Clear existing tap timer
        if (this.tapTimer) {
            clearTimeout(this.tapTimer);
        }
        
        // Set new tap timer
        this.tapTimer = setTimeout(() => {
            if (this.tapCount === 1) {
                this.dispatchGestureEvent('tap', target);
            } else if (this.tapCount === 2) {
                this.dispatchGestureEvent('doubletap', target);
            }
            this.tapCount = 0;
        }, this.DOUBLE_TAP_DELAY);
        
        // Haptic feedback for tap
        this.vibrate(5);
    }
    
    handleLongPress(event) {
        const target = event.touches[0].target;
        this.dispatchGestureEvent('longpress', target);
        
        // Haptic feedback for long press
        this.vibrate(50);
    }
    
    handlePinchStart(event) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        this.pinchDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
    }
    
    handlePinchMove(event) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        const delta = currentDistance - this.pinchDistance;
        
        if (Math.abs(delta) > this.PINCH_THRESHOLD) {
            if (delta > 0) {
                this.dispatchGestureEvent('pinchout', event.target, { scale: currentDistance / this.pinchDistance });
            } else {
                this.dispatchGestureEvent('pinchin', event.target, { scale: currentDistance / this.pinchDistance });
            }
            
            this.pinchDistance = currentDistance;
        }
    }
    
    dispatchGestureEvent(type, target, detail = {}) {
        const event = new CustomEvent(type, {
            bubbles: true,
            cancelable: true,
            detail: detail
        });
        
        target.dispatchEvent(event);
        
        console.log(`[TouchGestures] ${type}`, detail);
    }
    
    // Pull to refresh functionality
    initPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pulling = false;
        let refreshThreshold = 80;
        
        const pullIndicator = document.createElement('div');
        pullIndicator.id = 'pull-to-refresh-indicator';
        pullIndicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 50%;
            transform: translateX(-50%) translateY(-100%);
            background: #6366f1;
            color: white;
            padding: 12px 24px;
            border-radius: 0 0 12px 12px;
            font-size: 14px;
            font-weight: 600;
            z-index: 9999;
            transition: transform 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i> Pull to refresh';
        document.body.appendChild(pullIndicator);
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                pulling = false;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && startY > 0) {
                currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY;
                
                if (pullDistance > 0 && pullDistance < 200) {
                    pulling = true;
                    const progress = Math.min(pullDistance / refreshThreshold, 1);
                    pullIndicator.style.transform = `translateX(-50%) translateY(${progress * 100 - 100}%)`;
                    
                    if (pullDistance > refreshThreshold) {
                        pullIndicator.innerHTML = '<i class="fas fa-check"></i> Release to refresh';
                    } else {
                        pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i> Pull to refresh';
                    }
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (pulling && currentY - startY > refreshThreshold) {
                pullIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
                pullIndicator.style.transform = 'translateX(-50%) translateY(0)';
                
                // Trigger refresh
                this.performRefresh().then(() => {
                    setTimeout(() => {
                        pullIndicator.style.transform = 'translateX(-50%) translateY(-100%)';
                    }, 500);
                });
            } else {
                pullIndicator.style.transform = 'translateX(-50%) translateY(-100%)';
            }
            
            startY = 0;
            currentY = 0;
            pulling = false;
        });
    }
    
    async performRefresh() {
        // Reload the current page content
        try {
            if (typeof init === 'function') {
                await init();
            } else {
                window.location.reload();
            }
            this.vibrate(20);
        } catch (error) {
            console.error('[TouchGestures] Refresh failed:', error);
        }
    }
    
    // Haptic feedback
    initHapticFeedback() {
        // Check if vibration API is supported
        this.hasVibration = 'vibrate' in navigator;
        console.log('[TouchGestures] Haptic feedback:', this.hasVibration ? 'Enabled' : 'Not supported');
    }
    
    vibrate(duration = 10) {
        if (this.hasVibration) {
            navigator.vibrate(duration);
        }
    }
}

// Initialize touch gestures
const touchGestures = new TouchGestureHandler();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.TouchGestures = touchGestures;
}

// Add helper functions for common gestures
window.addEventListener('load', () => {
    // Swipe to dismiss elements
    document.querySelectorAll('[data-swipe-dismiss]').forEach(element => {
        element.addEventListener('swipeleft', (e) => {
            e.target.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            e.target.style.transform = 'translateX(-100%)';
            e.target.style.opacity = '0';
            setTimeout(() => e.target.remove(), 300);
        });
        
        element.addEventListener('swiperight', (e) => {
            e.target.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            e.target.style.transform = 'translateX(100%)';
            e.target.style.opacity = '0';
            setTimeout(() => e.target.remove(), 300);
        });
    });
    
    // Double tap to like
    document.querySelectorAll('[data-double-tap-like]').forEach(element => {
        element.addEventListener('doubletap', (e) => {
            // Add heart animation
            const heart = document.createElement('div');
            heart.innerHTML = '<i class="fas fa-heart"></i>';
            heart.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                font-size: 4rem;
                color: #ef4444;
                pointer-events: none;
                z-index: 9999;
                animation: heartPop 0.6s ease;
            `;
            
            e.target.style.position = 'relative';
            e.target.appendChild(heart);
            
            setTimeout(() => heart.remove(), 600);
            
            // Trigger like action
            const likeEvent = new CustomEvent('like', { bubbles: true });
            e.target.dispatchEvent(likeEvent);
        });
    });
    
    // Long press for context menu
    document.querySelectorAll('[data-long-press-menu]').forEach(element => {
        element.addEventListener('longpress', (e) => {
            // Show context menu
            const contextMenuEvent = new CustomEvent('contextmenu', { 
                bubbles: true,
                cancelable: true 
            });
            e.target.dispatchEvent(contextMenuEvent);
        });
    });
});

// Add heart pop animation
const touchGesturesStyle = document.createElement('style');
style.textContent = `
    @keyframes heartPop {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2);
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }
`;
document.head.appendChild(touchGesturesStyle);

console.log('[TouchGestures] Module loaded');
