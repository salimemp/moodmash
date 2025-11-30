/**
 * CCPA (California Consumer Privacy Act) - User Rights Interface
 * Allows users to exercise their CCPA rights:
 * - Right to Know
 * - Right to Delete
 * - Right to Opt-Out of Sale/Sharing
 * - Right to Data Portability
 * - Right to Correct
 */

(function() {
    'use strict';

    // Check if user is authenticated
    function checkAuth() {
        return fetch('/api/auth/me')
            .then(r => r.json())
            .then(data => data.user !== null)
            .catch(() => false);
    }

    // Check if CCPA applies to user
    async function checkCCPAApplicability() {
        try {
            const response = await fetch('/api/ccpa/applies');
            const data = await response.json();
            return data.ccpa_applies;
        } catch {
            return true; // Default to showing CCPA options
        }
    }

    // Load CCPA preferences
    async function loadPreferences() {
        try {
            const response = await fetch('/api/ccpa/preferences');
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('opt-out-sale').checked = data.preferences.do_not_sell;
                document.getElementById('opt-out-share').checked = data.preferences.do_not_share;
                document.getElementById('limit-use').checked = data.preferences.limit_use;
                
                const lastUpdated = document.getElementById('preferences-updated');
                if (lastUpdated && data.preferences.updated_at) {
                    lastUpdated.textContent = `Last updated: ${new Date(data.preferences.updated_at).toLocaleDateString()}`;
                }
            }
        } catch (error) {
            console.error('Failed to load CCPA preferences:', error);
        }
    }

    // Update CCPA preferences
    async function updatePreferences(preferences) {
        try {
            const response = await fetch('/api/ccpa/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });

            const data = await response.json();
            
            if (data.success) {
                showNotification('Success', 'Your CCPA preferences have been updated.', 'success');
                await loadPreferences();
            } else {
                showNotification('Error', data.error || 'Failed to update preferences', 'error');
            }
        } catch (error) {
            showNotification('Error', 'Failed to update preferences', 'error');
        }
    }

    // Submit CCPA request
    async function submitRequest(requestType, description = '') {
        try {
            const response = await fetch('/api/ccpa/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_type: requestType, description })
            });

            const data = await response.json();
            
            if (data.success) {
                showNotification(
                    'Request Submitted',
                    `Your ${requestType} request has been submitted. You will receive a response within 45 days.`,
                    'success'
                );
                await loadRequests();
            } else {
                showNotification('Error', data.error || 'Failed to submit request', 'error');
            }
        } catch (error) {
            showNotification('Error', 'Failed to submit request', 'error');
        }
    }

    // Load user requests
    async function loadRequests() {
        try {
            const response = await fetch('/api/ccpa/requests');
            const data = await response.json();
            
            if (data.success) {
                renderRequests(data.requests);
            }
        } catch (error) {
            console.error('Failed to load requests:', error);
        }
    }

    // Render requests table
    function renderRequests(requests) {
        const container = document.getElementById('requests-list');
        if (!container) return;

        if (requests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-inbox text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-600 dark:text-gray-400">No requests submitted yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Type
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Requested
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Due Date
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        ${requests.map(req => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(req.request_type)}">
                                        ${formatRequestType(req.request_type)}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(req.status)}">
                                        ${req.status}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    ${new Date(req.requested_at).toLocaleDateString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    ${req.due_date ? new Date(req.due_date).toLocaleDateString() : 'N/A'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Helper functions
    function getTypeBadgeClass(type) {
        const classes = {
            'access': 'bg-blue-100 text-blue-800',
            'delete': 'bg-red-100 text-red-800',
            'portability': 'bg-green-100 text-green-800',
            'correction': 'bg-yellow-100 text-yellow-800',
            'opt_out': 'bg-purple-100 text-purple-800'
        };
        return classes[type] || 'bg-gray-100 text-gray-800';
    }

    function getStatusBadgeClass(status) {
        const classes = {
            'submitted': 'bg-blue-100 text-blue-800',
            'in_progress': 'bg-yellow-100 text-yellow-800',
            'completed': 'bg-green-100 text-green-800',
            'denied': 'bg-red-100 text-red-800',
            'expired': 'bg-gray-100 text-gray-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    function formatRequestType(type) {
        const names = {
            'access': 'Right to Know',
            'delete': 'Right to Delete',
            'portability': 'Data Portability',
            'correction': 'Correct Data',
            'opt_out': 'Opt-Out'
        };
        return names[type] || type;
    }

    function showNotification(title, message, type = 'info') {
        const icon = {
            'success': '<i class="fas fa-check-circle text-green-500"></i>',
            'error': '<i class="fas fa-times-circle text-red-500"></i>',
            'info': '<i class="fas fa-info-circle text-blue-500"></i>'
        }[type];

        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-sm z-50 transform transition-all duration-300';
        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-2xl">${icon}</div>
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900 dark:text-white">${title}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Event handlers
    window.CCPARights = {
        savePreferences: async function() {
            const preferences = {
                do_not_sell: document.getElementById('opt-out-sale').checked,
                do_not_share: document.getElementById('opt-out-share').checked,
                limit_use: document.getElementById('limit-use').checked
            };
            await updatePreferences(preferences);
        },

        requestAccess: async function() {
            if (confirm('Submit a request to know what personal information we collect, use, and share about you?')) {
                await submitRequest('access', 'Request to know what data is collected');
            }
        },

        requestDeletion: async function() {
            if (confirm('Submit a request to delete your personal information? This request will be reviewed and processed within 45 days.')) {
                await submitRequest('delete', 'Request to delete personal information');
            }
        },

        exportData: async function() {
            try {
                const response = await fetch('/api/ccpa/export-data');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `moodmash-data-export-${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    showNotification('Success', 'Your data has been exported', 'success');
                } else {
                    showNotification('Error', 'Failed to export data', 'error');
                }
            } catch (error) {
                showNotification('Error', 'Failed to export data', 'error');
            }
        },

        requestCorrection: async function() {
            const description = prompt('Please describe what information you would like to correct:');
            if (description) {
                await submitRequest('correction', description);
            }
        },

        init: async function() {
            const isAuth = await checkAuth();
            if (!isAuth) {
                window.location.href = '/login?redirect=/ccpa-rights';
                return;
            }

            await loadPreferences();
            await loadRequests();
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CCPARights.init());
    } else {
        CCPARights.init();
    }
})();
