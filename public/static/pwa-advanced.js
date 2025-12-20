/**
 * Advanced PWA Features
 * Version: 10.3 - Push Notifications & Background Sync
 * 
 * Provides push notifications, background sync, and advanced PWA features
 */

class AdvancedPWA {
    constructor() {
        this.registration = null;
        this.subscription = null;
        this.isSupported = this.checkSupport();
        
        this.init();
    }
    
    checkSupport() {
        return {
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in window,
            notifications: 'Notification' in window,
            backgroundSync: 'sync' in (navigator.serviceWorker?.register ? ServiceWorkerRegistration.prototype : {}),
            periodicSync: 'periodicSync' in (navigator.serviceWorker?.register ? ServiceWorkerRegistration.prototype : {})
        };
    }
    
    async init() {
        if (!this.isSupported.serviceWorker) {
            console.warn('[PWA] Service Worker not supported');
            return;
        }
        
        // Wait for service worker to be ready
        this.registration = await navigator.serviceWorker.ready;
        
        // Check existing subscription
        await this.checkSubscription();
        
        // Setup listeners
        this.setupListeners();
        
        console.log('[PWA] Advanced features initialized', this.isSupported);
    }
    
    setupListeners() {
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event);
        });
        
        // Listen for visibility change (for background sync)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isSupported.backgroundSync) {
                this.triggerSync('sync-data');
            }
        });
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('[PWA] Back online, syncing...');
            this.triggerSync('sync-data');
        });
        
        window.addEventListener('offline', () => {
            console.log('[PWA] Gone offline');
            this.showOfflineNotice();
        });
    }
    
    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'NOTIFICATION_CLICK':
                console.log('[PWA] Notification clicked:', data);
                // Handle notification click
                if (data.url) {
                    window.location.href = data.url;
                }
                break;
                
            case 'BACKGROUND_SYNC_SUCCESS':
                console.log('[PWA] Background sync completed:', data);
                this.showSyncSuccess();
                break;
                
            case 'BACKGROUND_SYNC_FAILED':
                console.error('[PWA] Background sync failed:', data);
                break;
                
            default:
                console.log('[PWA] Unknown message type:', type);
        }
    }
    
    // Push Notifications
    async requestNotificationPermission() {
        if (!this.isSupported.notifications) {
            console.warn('[PWA] Notifications not supported');
            return false;
        }
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('[PWA] Notification permission granted');
            await this.subscribeToPushNotifications();
            return true;
        } else {
            console.log('[PWA] Notification permission denied');
            return false;
        }
    }
    
    async subscribeToPushNotifications() {
        if (!this.isSupported.pushManager) {
            console.warn('[PWA] Push Manager not supported');
            return null;
        }
        
        try {
            // Generate VAPID key (in production, get from server)
            const publicVapidKey = await this.getVapidPublicKey();
            
            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(publicVapidKey)
            });
            
            this.subscription = subscription;
            
            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
            
            console.log('[PWA] Push subscription successful');
            return subscription;
        } catch (error) {
            console.error('[PWA] Push subscription failed:', error);
            return null;
        }
    }
    
    async getVapidPublicKey() {
        // In production, fetch from server
        // For now, return a placeholder
        try {
            const response = await fetch('/api/push/vapid-public-key');
            const data = await response.json();
            return data.publicKey;
        } catch (error) {
            console.warn('[PWA] Could not fetch VAPID key, using default');
            // This is a placeholder - replace with your actual VAPID public key
            return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37gp2ENi1G77O8FPiRpfE1QSJ2u0xhDKF1D3l7O7FNGVS0PCQ5cZqJfK4';
        }
    }
    
    async sendSubscriptionToServer(subscription) {
        try {
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
        } catch (error) {
            console.error('[PWA] Failed to send subscription to server:', error);
        }
    }
    
    async checkSubscription() {
        if (!this.registration || !this.isSupported.pushManager) {
            return;
        }
        
        try {
            this.subscription = await this.registration.pushManager.getSubscription();
            
            if (this.subscription) {
                console.log('[PWA] Existing push subscription found');
            }
        } catch (error) {
            console.error('[PWA] Failed to check subscription:', error);
        }
    }
    
    async unsubscribeFromPushNotifications() {
        if (!this.subscription) {
            return;
        }
        
        try {
            await this.subscription.unsubscribe();
            this.subscription = null;
            console.log('[PWA] Push subscription removed');
        } catch (error) {
            console.error('[PWA] Failed to unsubscribe:', error);
        }
    }
    
    // Background Sync
    async triggerSync(tag) {
        if (!this.registration || !this.isSupported.backgroundSync) {
            console.warn('[PWA] Background sync not supported');
            return false;
        }
        
        try {
            await this.registration.sync.register(tag);
            console.log('[PWA] Background sync registered:', tag);
            return true;
        } catch (error) {
            console.error('[PWA] Background sync registration failed:', error);
            return false;
        }
    }
    
    // Periodic Background Sync
    async registerPeriodicSync(tag, minInterval) {
        if (!this.registration || !this.isSupported.periodicSync) {
            console.warn('[PWA] Periodic sync not supported');
            return false;
        }
        
        try {
            const status = await navigator.permissions.query({
                name: 'periodic-background-sync'
            });
            
            if (status.state === 'granted') {
                await this.registration.periodicSync.register(tag, {
                    minInterval: minInterval || 24 * 60 * 60 * 1000 // 24 hours default
                });
                console.log('[PWA] Periodic sync registered:', tag);
                return true;
            }
        } catch (error) {
            console.error('[PWA] Periodic sync registration failed:', error);
        }
        
        return false;
    }
    
    async unregisterPeriodicSync(tag) {
        if (!this.registration || !this.isSupported.periodicSync) {
            return;
        }
        
        try {
            await this.registration.periodicSync.unregister(tag);
            console.log('[PWA] Periodic sync unregistered:', tag);
        } catch (error) {
            console.error('[PWA] Periodic sync unregistration failed:', error);
        }
    }
    
    // Notifications
    showLocalNotification(title, options = {}) {
        if (!this.isSupported.notifications) {
            return;
        }
        
        if (Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                vibrate: [200, 100, 200],
                ...options
            });
        }
    }
    
    async scheduleNotification(title, options, delay) {
        // Schedule a notification using service worker
        if (!this.registration) {
            return;
        }
        
        setTimeout(() => {
            this.showLocalNotification(title, options);
        }, delay);
    }
    
    // App Install
    async promptInstall() {
        if (!window.deferredPrompt) {
            console.log('[PWA] Install prompt not available');
            return false;
        }
        
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        
        console.log('[PWA] Install prompt outcome:', outcome);
        window.deferredPrompt = null;
        
        return outcome === 'accepted';
    }
    
    // Utilities
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }
    
    showOfflineNotice() {
        const notice = document.createElement('div');
        notice.id = 'offline-notice';
        notice.className = 'pwa-notice offline';
        notice.innerHTML = `
            <i class="fas fa-wifi-slash"></i>
            <span>You're offline. Changes will sync when you're back online.</span>
        `;
        
        document.body.appendChild(notice);
        
        setTimeout(() => notice.classList.add('show'), 10);
    }
    
    hideOfflineNotice() {
        const notice = document.getElementById('offline-notice');
        if (notice) {
            notice.classList.remove('show');
            setTimeout(() => notice.remove(), 300);
        }
    }
    
    showSyncSuccess() {
        const notice = document.createElement('div');
        notice.className = 'pwa-notice success';
        notice.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Data synced successfully!</span>
        `;
        
        document.body.appendChild(notice);
        
        setTimeout(() => notice.classList.add('show'), 10);
        setTimeout(() => {
            notice.classList.remove('show');
            setTimeout(() => notice.remove(), 300);
        }, 3000);
    }
}

// Install prompt handler
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    
    console.log('[PWA] Install prompt available');
    
    // Show install button
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
        installButton.style.display = 'block';
    }
});

// App installed handler
window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    window.deferredPrompt = null;
    
    // Hide install button
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
        installButton.style.display = 'none';
    }
});

// Add PWA notice styles
const pwaStyle = document.createElement('style');
pwaStyle.textContent = `
    .pwa-notice {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 90%;
    }
    
    .pwa-notice.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
    
    .pwa-notice.offline {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .pwa-notice.success {
        background: #d1fae5;
        color: #065f46;
    }
    
    .pwa-notice i {
        font-size: 20px;
    }
    
    .pwa-notice span {
        font-weight: 600;
        font-size: 14px;
    }
`;
document.head.appendChild(pwaStyle);

// Initialize
const pwa = new AdvancedPWA();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.AdvancedPWA = pwa;
}

console.log('[PWA] Advanced features module loaded');
