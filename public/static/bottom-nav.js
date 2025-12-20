/**
 * Mobile Bottom Navigation Component
 * Version: 10.2 - Mobile Optimization
 * 
 * Provides iOS/Android-style bottom navigation for mobile devices
 */

// Bottom navigation configuration
const BOTTOM_NAV_ITEMS = [
    {
        id: 'home',
        icon: 'fa-home',
        label: 'Home',
        url: '/dashboard',
        active: true
    },
    {
        id: 'mood',
        icon: 'fa-smile',
        label: 'Mood',
        url: '/mood-tracker',
        badge: null
    },
    {
        id: 'social',
        icon: 'fa-users',
        label: 'Social',
        url: '/social-feed',
        badge: null
    },
    {
        id: 'insights',
        icon: 'fa-chart-line',
        label: 'Insights',
        url: '/ai-insights',
        badge: null
    },
    {
        id: 'profile',
        icon: 'fa-user',
        label: 'Profile',
        url: '/privacy-center',
        badge: null
    }
];

/**
 * Initialize bottom navigation
 */
function initBottomNav() {
    // Only show on mobile devices
    if (!isMobileDevice()) {
        return;
    }

    // Create bottom nav if it doesn't exist
    if (!document.getElementById('mobile-bottom-nav')) {
        createBottomNav();
    }

    // Set active item based on current path
    setActiveNavItem(window.location.pathname);

    // Update active state on navigation
    window.addEventListener('popstate', () => {
        setActiveNavItem(window.location.pathname);
    });
}

/**
 * Check if device is mobile
 */
function isMobileDevice() {
    return window.innerWidth < 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Create bottom navigation HTML
 */
function createBottomNav() {
    const nav = document.createElement('nav');
    nav.id = 'mobile-bottom-nav';
    nav.className = 'mobile-bottom-nav';
    nav.innerHTML = `
        <div class="bottom-nav-container">
            ${BOTTOM_NAV_ITEMS.map(item => `
                <a href="${item.url}" 
                   class="bottom-nav-item ${item.active ? 'active' : ''}" 
                   data-nav-id="${item.id}"
                   aria-label="${item.label}">
                    <div class="bottom-nav-icon">
                        <i class="fas ${item.icon}"></i>
                        ${item.badge ? `<span class="bottom-nav-badge">${item.badge}</span>` : ''}
                    </div>
                    <span class="bottom-nav-label">${item.label}</span>
                </a>
            `).join('')}
        </div>
    `;

    // Add to body
    document.body.appendChild(nav);

    // Add padding to body to prevent content being hidden behind nav
    document.body.style.paddingBottom = '80px';

    // Add click handlers
    nav.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.addEventListener('click', handleNavClick);
    });

    // Add styles
    addBottomNavStyles();
}

/**
 * Handle navigation click
 */
function handleNavClick(e) {
    e.preventDefault();
    const item = e.currentTarget;
    const url = item.getAttribute('href');
    
    // Update active state
    setActiveNavItem(url);
    
    // Navigate
    window.location.href = url;
}

/**
 * Set active navigation item
 */
function setActiveNavItem(path) {
    const nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;

    // Remove active from all items
    nav.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Find matching item
    const matchingItem = Array.from(nav.querySelectorAll('.bottom-nav-item')).find(item => {
        const url = item.getAttribute('href');
        return path === url || path.startsWith(url);
    });

    // Set active
    if (matchingItem) {
        matchingItem.classList.add('active');
    }
}

/**
 * Update badge count for a nav item
 */
function updateNavBadge(itemId, count) {
    const nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;

    const item = nav.querySelector(`[data-nav-id="${itemId}"]`);
    if (!item) return;

    let badge = item.querySelector('.bottom-nav-badge');
    
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'bottom-nav-badge';
            item.querySelector('.bottom-nav-icon').appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : count;
    } else if (badge) {
        badge.remove();
    }
}

/**
 * Add bottom navigation styles
 */
function addBottomNavStyles() {
    if (document.getElementById('bottom-nav-styles')) {
        return;
    }

    const bottomNavStyle = document.createElement('style');
    bottomNavStyle.id = 'bottom-nav-styles';
    bottomNavStyle.textContent = `
        /* Mobile Bottom Navigation */
        .mobile-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e5e7eb;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            padding-bottom: env(safe-area-inset-bottom);
        }

        .bottom-nav-container {
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 8px 0;
            max-width: 100%;
        }

        .bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8px 12px;
            text-decoration: none;
            color: #6b7280;
            transition: all 0.2s ease;
            min-width: 60px;
            position: relative;
        }

        .bottom-nav-item:active {
            transform: scale(0.95);
        }

        .bottom-nav-item.active {
            color: #8b5cf6;
        }

        .bottom-nav-icon {
            position: relative;
            font-size: 20px;
            margin-bottom: 4px;
        }

        .bottom-nav-badge {
            position: absolute;
            top: -6px;
            right: -6px;
            background: #ef4444;
            color: white;
            border-radius: 10px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            min-width: 18px;
            text-align: center;
        }

        .bottom-nav-label {
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
        }

        /* Active state animation */
        .bottom-nav-item.active .bottom-nav-icon {
            animation: bounce 0.3s ease;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }

        /* Hide on desktop */
        @media (min-width: 768px) {
            .mobile-bottom-nav {
                display: none;
            }
            body {
                padding-bottom: 0 !important;
            }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .mobile-bottom-nav {
                background: #1f2937;
                border-top-color: #374151;
            }
            .bottom-nav-item {
                color: #9ca3af;
            }
            .bottom-nav-item.active {
                color: #a78bfa;
            }
        }

        /* iOS safe area */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
            .mobile-bottom-nav {
                padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
            }
        }

        /* Accessibility */
        .bottom-nav-item:focus {
            outline: 2px solid #8b5cf6;
            outline-offset: 2px;
        }

        /* Touch feedback */
        .bottom-nav-item:active {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 12px;
        }

        /* Prevent text selection */
        .mobile-bottom-nav {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }

        /* Smooth transitions */
        .bottom-nav-item, .bottom-nav-icon, .bottom-nav-label {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Landscape mode adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
            .mobile-bottom-nav {
                padding: 4px 0;
            }
            .bottom-nav-item {
                padding: 4px 8px;
            }
            .bottom-nav-icon {
                font-size: 18px;
                margin-bottom: 2px;
            }
            .bottom-nav-label {
                font-size: 10px;
            }
        }
    `;

    document.head.appendChild(bottomNavStyle);
}

/**
 * Show bottom navigation
 */
function showBottomNav() {
    const nav = document.getElementById('mobile-bottom-nav');
    if (nav) {
        nav.style.transform = 'translateY(0)';
    }
}

/**
 * Hide bottom navigation
 */
function hideBottomNav() {
    const nav = document.getElementById('mobile-bottom-nav');
    if (nav) {
        nav.style.transform = 'translateY(100%)';
    }
}

/**
 * Toggle bottom navigation visibility based on scroll
 */
let lastScrollTop = 0;
function handleScrollNavigation() {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
        // Scrolling down, hide nav
        hideBottomNav();
    } else {
        // Scrolling up, show nav
        showBottomNav();
    }
    
    lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBottomNav);
} else {
    initBottomNav();
}

// Optional: Hide nav on scroll down (can be disabled)
// window.addEventListener('scroll', handleScrollNavigation, { passive: true });

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.BottomNav = {
        init: initBottomNav,
        updateBadge: updateNavBadge,
        show: showBottomNav,
        hide: hideBottomNav,
        setActive: setActiveNavItem
    };
}
