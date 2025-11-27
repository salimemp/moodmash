// MoodMash Monitoring Dashboard
// Real-time metrics visualization

let charts = {};
let refreshInterval = null;

async function init() {
    console.log('[Monitoring] Initializing dashboard...');
    
    await loadMetrics();
    renderDashboard();
    initializeCharts();
    
    // Auto-refresh every 5 seconds
    refreshInterval = setInterval(async () => {
        await loadMetrics();
        updateCharts();
    }, 5000);
}

let metricsData = null;
let healthData = null;

async function loadMetrics() {
    try {
        // Load metrics snapshot
        const metricsResponse = await fetch('/api/monitoring/metrics');
        metricsData = await metricsResponse.json();
        
        // Load health status
        const healthResponse = await fetch('/api/health/status');
        healthData = await healthResponse.json();
        
        console.log('[Monitoring] Metrics loaded:', metricsData);
    } catch (error) {
        console.error('[Monitoring] Failed to load metrics:', error);
    }
}

function renderDashboard() {
    const app = document.getElementById('app');
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
    
    app.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                            <i class="fas fa-chart-line text-purple-600 mr-2"></i>
                            System Monitoring
                        </h1>
                        <p class="text-gray-600 dark:text-gray-400 mt-1">
                            Real-time performance and health metrics
                        </p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-500 dark:text-gray-400">Auto-refresh</div>
                        <div class="text-lg font-semibold text-purple-600">
                            <i class="fas fa-sync-alt fa-spin"></i> Every 5s
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Health Status -->
            <div id="health-status" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                ${renderHealthCards()}
            </div>
            
            <!-- Key Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                ${renderMetricCards()}
            </div>
            
            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Response Time Chart -->
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Response Time
                    </h3>
                    <canvas id="response-time-chart"></canvas>
                </div>
                
                <!-- Request Rate Chart -->
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Request Rate
                    </h3>
                    <canvas id="request-rate-chart"></canvas>
                </div>
                
                <!-- Error Rate Chart -->
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Error Rate
                    </h3>
                    <canvas id="error-rate-chart"></canvas>
                </div>
                
                <!-- Active Users Chart -->
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Active Users
                    </h3>
                    <canvas id="active-users-chart"></canvas>
                </div>
            </div>
            
            <!-- Raw Metrics -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Prometheus Metrics
                </h3>
                <div class="flex space-x-2 mb-4">
                    <a href="/metrics" target="_blank" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                        <i class="fas fa-external-link-alt mr-2"></i>
                        View Prometheus Format
                    </a>
                    <button onclick="copyMetrics()" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                        <i class="fas fa-copy mr-2"></i>
                        Copy Metrics URL
                    </button>
                </div>
                <pre id="raw-metrics" class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 dark:text-gray-300"></pre>
            </div>
        </div>
    `;
    
    updateHealthCards();
    updateMetricCards();
}

function renderHealthCards() {
    if (!healthData) {
        return '<div class="col-span-4 text-center py-8 text-gray-500">Loading health status...</div>';
    }
    
    const services = [
        { name: 'API', status: healthData.api, icon: 'fa-server' },
        { name: 'Database', status: healthData.database, icon: 'fa-database' },
        { name: 'Auth', status: healthData.auth, icon: 'fa-shield-alt' },
        { name: 'Email', status: healthData.email, icon: 'fa-envelope' }
    ];
    
    return services.map(service => {
        const isHealthy = service.status === 'healthy';
        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 ${isHealthy ? 'border-green-500' : 'border-red-500'}">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">${service.name}</div>
                        <div class="text-2xl font-bold ${isHealthy ? 'text-green-600' : 'text-red-600'}">
                            ${service.status}
                        </div>
                    </div>
                    <div class="w-12 h-12 rounded-full ${isHealthy ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center">
                        <i class="fas ${service.icon} text-2xl ${isHealthy ? 'text-green-600' : 'text-red-600'}"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderMetricCards() {
    if (!metricsData) {
        return '<div class="col-span-4 text-center py-8 text-gray-500">Loading metrics...</div>';
    }
    
    const metrics = [
        { label: 'Total Requests', value: metricsData.requests_total, icon: 'fa-chart-bar', color: 'blue' },
        { label: 'Total Errors', value: metricsData.errors_total, icon: 'fa-exclamation-triangle', color: 'red' },
        { label: 'Avg Response', value: `${metricsData.response_time_avg}ms`, icon: 'fa-tachometer-alt', color: 'green' },
        { label: 'Active Users', value: metricsData.active_users, icon: 'fa-users', color: 'purple' }
    ];
    
    const colors = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        red: { bg: 'bg-red-100', text: 'text-red-600' },
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600' }
    };
    
    return metrics.map(metric => {
        const color = colors[metric.color];
        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">${metric.label}</div>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">
                            ${metric.value}
                        </div>
                    </div>
                    <div class="w-12 h-12 rounded-full ${color.bg} dark:${color.bg}/20 flex items-center justify-center">
                        <i class="fas ${metric.icon} text-2xl ${color.text}"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateHealthCards() {
    const container = document.getElementById('health-status');
    if (container) {
        container.innerHTML = renderHealthCards();
    }
}

function updateMetricCards() {
    // Update is handled by re-rendering, but could be optimized
}

function initializeCharts() {
    // Response Time Chart
    const responseTimeCtx = document.getElementById('response-time-chart');
    if (responseTimeCtx) {
        charts.responseTime = new Chart(responseTimeCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Avg Response Time (ms)',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }, {
                    label: 'P95 (ms)',
                    data: [],
                    borderColor: 'rgb(249, 115, 22)',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    
    // Request Rate Chart
    const requestRateCtx = document.getElementById('request-rate-chart');
    if (requestRateCtx) {
        charts.requestRate = new Chart(requestRateCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Requests',
                    data: [],
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function updateCharts() {
    if (!metricsData) return;
    
    const timestamp = new Date().toLocaleTimeString();
    
    // Update Response Time Chart
    if (charts.responseTime) {
        charts.responseTime.data.labels.push(timestamp);
        charts.responseTime.data.datasets[0].data.push(metricsData.response_time_avg);
        charts.responseTime.data.datasets[1].data.push(metricsData.response_time_p95);
        
        // Keep only last 20 data points
        if (charts.responseTime.data.labels.length > 20) {
            charts.responseTime.data.labels.shift();
            charts.responseTime.data.datasets[0].data.shift();
            charts.responseTime.data.datasets[1].data.shift();
        }
        
        charts.responseTime.update('none'); // Update without animation
    }
    
    // Update Request Rate Chart
    if (charts.requestRate) {
        charts.requestRate.data.labels.push(timestamp);
        charts.requestRate.data.datasets[0].data.push(metricsData.requests_total);
        
        if (charts.requestRate.data.labels.length > 20) {
            charts.requestRate.data.labels.shift();
            charts.requestRate.data.datasets[0].data.shift();
        }
        
        charts.requestRate.update('none');
    }
    
    // Update metric cards
    updateMetricCards();
}

function copyMetrics() {
    const url = window.location.origin + '/metrics';
    navigator.clipboard.writeText(url).then(() => {
        alert('Metrics URL copied to clipboard!\\n\\n' + url);
    });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
