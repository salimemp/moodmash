/**
 * Security Monitoring Dashboard Frontend
 * Version: 9.5.0 Phase 2
 */

let eventsChart = null;
let alertsChart = null;
let refreshInterval = null;

// ============================================================================
// INITIALIZE
// ============================================================================

async function initSecurityMonitoring() {
  console.log('[Security] Initializing dashboard...');
  
  // Load data
  await Promise.all([
    loadDashboardStats(),
    loadSecurityEvents(),
    loadFailedLogins(),
    loadSecurityAlerts(),
    loadComplianceChecklist()
  ]);
  
  // Start auto-refresh (every 30 seconds)
  refreshInterval = setInterval(refreshDashboard, 30000);
  
  console.log('[Security] Dashboard ready!');
}

async function refreshDashboard() {
  console.log('[Security] Refreshing dashboard...');
  await loadDashboardStats();
  await loadSecurityAlerts();
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

async function loadDashboardStats() {
  try {
    const response = await fetch('/api/security/dashboard');
    const result = await response.json();
    
    if (result.success) {
      renderDashboard(result.data);
    } else {
      showError('Error loading dashboard: ' + result.error);
    }
  } catch (error) {
    console.error('[Security] Error loading dashboard:', error);
    showError(error.message);
  }
}

function renderDashboard(data) {
  document.getElementById('app').innerHTML = `
    <!-- Header -->
    <div class="bg-gradient-to-r from-red-600 to-red-800 text-white p-6 rounded-lg shadow-lg mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">
            <i class="fas fa-shield-alt mr-3"></i>Security Monitoring Dashboard
          </h1>
          <p class="text-red-100">Real-time security event tracking and threat detection</p>
        </div>
        <div class="text-right">
          <div class="text-sm text-red-200 mb-1">Last Updated</div>
          <div class="text-lg font-semibold" id="last-updated">
            ${new Date(data.last_updated).toLocaleTimeString()}
          </div>
          <button onclick="refreshDashboard()" class="mt-2 px-4 py-1 bg-white text-red-600 rounded hover:bg-red-50 text-sm">
            <i class="fas fa-sync-alt mr-1"></i>Refresh
          </button>
        </div>
      </div>
    </div>
    
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Events (24h)</p>
            <p class="text-2xl font-bold text-blue-600">${data.events_24h.total}</p>
            <div class="flex items-center space-x-1 text-xs mt-1">
              <span class="text-red-600">C:${data.events_24h.critical}</span>
              <span class="text-orange-600">H:${data.events_24h.high}</span>
              <span class="text-yellow-600">M:${data.events_24h.medium}</span>
              <span class="text-green-600">L:${data.events_24h.low}</span>
            </div>
          </div>
          <i class="fas fa-exclamation-triangle text-3xl text-blue-300"></i>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Failed Logins</p>
            <p class="text-2xl font-bold ${data.failed_logins_24h > 5 ? 'text-red-600' : 'text-green-600'}">
              ${data.failed_logins_24h}
            </p>
            <p class="text-xs text-gray-500 mt-1">Last 24h</p>
          </div>
          <i class="fas fa-user-lock text-3xl ${data.failed_logins_24h > 5 ? 'text-red-300' : 'text-green-300'}"></i>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Rate Limit Hits</p>
            <p class="text-2xl font-bold text-yellow-600">${data.rate_limit_hits_1h.unique_ips}</p>
            <p class="text-xs text-gray-500 mt-1">${data.rate_limit_hits_1h.total_hits} total</p>
          </div>
          <i class="fas fa-tachometer-alt text-3xl text-yellow-300"></i>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Active Alerts</p>
            <p class="text-2xl font-bold ${data.active_alerts.total > 0 ? 'text-red-600' : 'text-green-600'}">
              ${data.active_alerts.total}
            </p>
            <div class="flex items-center space-x-2 text-xs mt-1">
              ${data.active_alerts.critical > 0 ? `<span class="text-red-600">🔴 ${data.active_alerts.critical}</span>` : ''}
              ${data.active_alerts.high > 0 ? `<span class="text-orange-600">🟠 ${data.active_alerts.high}</span>` : ''}
            </div>
          </div>
          <i class="fas fa-bell text-3xl ${data.active_alerts.total > 0 ? 'text-red-300' : 'text-green-300'}"></i>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Open Incidents</p>
            <p class="text-2xl font-bold ${data.open_incidents > 0 ? 'text-red-600' : 'text-green-600'}">
              ${data.open_incidents}
            </p>
            <p class="text-xs text-gray-500 mt-1">Unresolved</p>
          </div>
          <i class="fas fa-fire text-3xl ${data.open_incidents > 0 ? 'text-red-300' : 'text-green-300'}"></i>
        </div>
      </div>
    </div>
    
    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Event Types Chart -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
          Top Event Types (7d)
        </h2>
        ${renderTopEvents(data.top_event_types)}
      </div>
      
      <!-- Failed Login IPs Chart -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-globe text-red-600 mr-2"></i>
          Failed Login Attempts by IP (24h)
        </h2>
        ${renderFailedIPs(data.top_failed_ips)}
      </div>
    </div>
    
    <!-- Security Events -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-list text-blue-600 mr-2"></i>
          Recent Security Events
        </h2>
        <div class="flex space-x-2">
          <select id="severity-filter" onchange="loadSecurityEvents()" class="px-3 py-1 border rounded">
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div id="security-events-container" class="space-y-2">
        <div class="text-center py-4 text-gray-500">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <p class="mt-2">Loading events...</p>
        </div>
      </div>
    </div>
    
    <!-- Failed Logins -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        <i class="fas fa-user-times text-red-600 mr-2"></i>
        Recent Failed Login Attempts
      </h2>
      <div id="failed-logins-container" class="space-y-2">
        <div class="text-center py-4 text-gray-500">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <p class="mt-2">Loading failed logins...</p>
        </div>
      </div>
    </div>
    
    <!-- Security Alerts -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        <i class="fas fa-bell text-yellow-600 mr-2"></i>
        Security Alerts
      </h2>
      <div id="security-alerts-container" class="space-y-3">
        <div class="text-center py-4 text-gray-500">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <p class="mt-2">Loading alerts...</p>
        </div>
      </div>
    </div>
    
    <!-- Compliance Checklist -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        <i class="fas fa-check-circle text-green-600 mr-2"></i>
        Compliance Checklist
      </h2>
      <div id="compliance-checklist-container" class="space-y-2">
        <div class="text-center py-4 text-gray-500">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <p class="mt-2">Loading checklist...</p>
        </div>
      </div>
    </div>
    
    <!-- External Tools Integration -->
    <div class="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 p-6 rounded-lg shadow mb-6">
      <div class="flex items-start">
        <i class="fas fa-tools text-3xl text-purple-600 mr-4 mt-1"></i>
        <div class="flex-1">
          <h2 class="text-xl font-bold text-gray-800 mb-3">
            External Security Tools Integration
          </h2>
          <p class="text-gray-600 mb-4">
            For comprehensive security monitoring, integrate with these external tools:
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-4 rounded border border-purple-200">
              <h3 class="font-semibold text-gray-800 mb-2">
                <i class="fas fa-github text-gray-800 mr-2"></i>GitHub Security
              </h3>
              <p class="text-sm text-gray-600 mb-3">Dependency vulnerability scanning</p>
              <a href="https://github.com/security" target="_blank" 
                 class="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Configure →
              </a>
            </div>
            
            <div class="bg-white p-4 rounded border border-purple-200">
              <h3 class="font-semibold text-gray-800 mb-2">
                <i class="fas fa-shield-alt text-blue-600 mr-2"></i>Snyk
              </h3>
              <p class="text-sm text-gray-600 mb-3">Automated security testing</p>
              <a href="https://snyk.io" target="_blank" 
                 class="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Set up →
              </a>
            </div>
            
            <div class="bg-white p-4 rounded border border-purple-200">
              <h3 class="font-semibold text-gray-800 mb-2">
                <i class="fas fa-bug text-red-600 mr-2"></i>OWASP ZAP
              </h3>
              <p class="text-sm text-gray-600 mb-3">Penetration testing tool</p>
              <a href="https://www.zaproxy.org" target="_blank" 
                 class="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Learn more →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Error Display -->
    <div id="error-display" class="hidden bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
      <i class="fas fa-exclamation-circle mr-2"></i>
      <span id="error-message"></span>
    </div>
  `;
}

function renderTopEvents(events) {
  if (!events || events.length === 0) {
    return '<p class="text-center text-gray-500 py-4">No event data available</p>';
  }
  
  const maxCount = Math.max(...events.map(e => e.count));
  
  return `
    <div class="space-y-3">
      ${events.map(event => {
        const percentage = (event.count / maxCount) * 100;
        return `
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-700">${event.event_type}</span>
              <span class="text-sm text-gray-600">${event.count}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderFailedIPs(ips) {
  if (!ips || ips.length === 0) {
    return '<p class="text-center text-green-600 py-4"><i class="fas fa-check-circle mr-2"></i>No failed login attempts</p>';
  }
  
  const maxAttempts = Math.max(...ips.map(ip => ip.attempts));
  
  return `
    <div class="space-y-3">
      ${ips.map(ip => {
        const percentage = (ip.attempts / maxAttempts) * 100;
        const isHighRisk = ip.attempts >= 5;
        return `
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium ${isHighRisk ? 'text-red-600' : 'text-gray-700'}">
                ${ip.ip_address}
                ${isHighRisk ? '<i class="fas fa-exclamation-triangle ml-1"></i>' : ''}
              </span>
              <span class="text-sm ${isHighRisk ? 'text-red-600 font-bold' : 'text-gray-600'}">
                ${ip.attempts} attempts
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="${isHighRisk ? 'bg-red-600' : 'bg-orange-500'} h-2 rounded-full" 
                   style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ============================================================================
// SECURITY EVENTS
// ============================================================================

async function loadSecurityEvents() {
  try {
    const severity = document.getElementById('severity-filter')?.value || '';
    const url = severity ? `/api/security/events?severity=${severity}&limit=50` : '/api/security/events?limit=50';
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      renderSecurityEvents(result.data);
    } else {
      document.getElementById('security-events-container').innerHTML = `
        <div class="text-center py-4 text-red-600">
          <i class="fas fa-exclamation-circle text-2xl"></i>
          <p class="mt-2">Error: ${result.error}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('[Security] Error loading events:', error);
    document.getElementById('security-events-container').innerHTML = `
      <div class="text-center py-4 text-red-600">
        <i class="fas fa-exclamation-circle text-2xl"></i>
        <p class="mt-2">Error: ${error.message}</p>
      </div>
    `;
  }
}

function renderSecurityEvents(events) {
  const container = document.getElementById('security-events-container');
  
  if (!events || events.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-gray-500">
        <i class="fas fa-inbox text-2xl"></i>
        <p class="mt-2">No security events</p>
      </div>
    `;
    return;
  }
  
  const severityColors = {
    critical: { bg: 'red-50', border: 'red-500', text: 'red-800', badge: 'red-200' },
    high: { bg: 'orange-50', border: 'orange-500', text: 'orange-800', badge: 'orange-200' },
    medium: { bg: 'yellow-50', border: 'yellow-500', text: 'yellow-800', badge: 'yellow-200' },
    low: { bg: 'blue-50', border: 'blue-500', text: 'blue-800', badge: 'blue-200' }
  };
  
  container.innerHTML = `
    <div class="space-y-2">
      ${events.slice(0, 20).map(event => {
        const colors = severityColors[event.severity] || severityColors.low;
        return `
          <div class="border-l-4 border-${colors.border} bg-${colors.bg} p-3 rounded">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="px-2 py-1 bg-${colors.badge} text-${colors.text} rounded text-xs font-semibold uppercase">
                    ${event.severity}
                  </span>
                  <span class="text-sm font-medium text-gray-700">${event.event_type}</span>
                </div>
                <p class="text-sm text-gray-600">${event.description}</p>
                <div class="flex items-center space-x-3 text-xs text-gray-500 mt-2">
                  <span><i class="fas fa-clock mr-1"></i>${new Date(event.timestamp).toLocaleString()}</span>
                  ${event.ip_address ? `<span><i class="fas fa-globe mr-1"></i>${event.ip_address}</span>` : ''}
                  ${event.user_id ? `<span><i class="fas fa-user mr-1"></i>User ${event.user_id}</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ============================================================================
// FAILED LOGINS
// ============================================================================

async function loadFailedLogins() {
  try {
    const response = await fetch('/api/security/failed-logins?limit=50');
    const result = await response.json();
    
    if (result.success) {
      renderFailedLogins(result.data);
    } else {
      document.getElementById('failed-logins-container').innerHTML = `
        <div class="text-center py-4 text-red-600">
          <i class="fas fa-exclamation-circle text-2xl"></i>
          <p class="mt-2">Error: ${result.error}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('[Security] Error loading failed logins:', error);
    document.getElementById('failed-logins-container').innerHTML = `
      <div class="text-center py-4 text-red-600">
        <i class="fas fa-exclamation-circle text-2xl"></i>
        <p class="mt-2">Error: ${error.message}</p>
      </div>
    `;
  }
}

function renderFailedLogins(logins) {
  const container = document.getElementById('failed-logins-container');
  
  if (!logins || logins.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-green-600">
        <i class="fas fa-check-circle text-2xl"></i>
        <p class="mt-2">No failed login attempts</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${logins.slice(0, 20).map(login => `
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-900">${new Date(login.timestamp).toLocaleString()}</td>
              <td class="px-4 py-3 text-sm text-gray-700">${login.email}</td>
              <td class="px-4 py-3 text-sm text-gray-600">${login.ip_address}</td>
              <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                  ${login.failure_reason}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================================
// SECURITY ALERTS
// ============================================================================

async function loadSecurityAlerts() {
  try {
    const response = await fetch('/api/security/alerts?status=active');
    const result = await response.json();
    
    if (result.success) {
      renderSecurityAlerts(result.data);
    } else {
      document.getElementById('security-alerts-container').innerHTML = `
        <div class="text-center py-4 text-red-600">
          <i class="fas fa-exclamation-circle text-2xl"></i>
          <p class="mt-2">Error: ${result.error}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('[Security] Error loading alerts:', error);
    document.getElementById('security-alerts-container').innerHTML = `
      <div class="text-center py-4 text-red-600">
        <i class="fas fa-exclamation-circle text-2xl"></i>
        <p class="mt-2">Error: ${error.message}</p>
      </div>
    `;
  }
}

function renderSecurityAlerts(alerts) {
  const container = document.getElementById('security-alerts-container');
  
  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-green-600">
        <i class="fas fa-check-circle text-4xl"></i>
        <p class="mt-3 text-lg font-semibold">No Active Alerts</p>
        <p class="text-sm text-gray-500">All systems secure</p>
      </div>
    `;
    return;
  }
  
  const severityColors = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'blue'
  };
  
  container.innerHTML = alerts.map(alert => {
    const color = severityColors[alert.severity] || 'gray';
    return `
      <div class="border-l-4 border-${color}-500 bg-${color}-50 p-4 rounded">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <span class="px-2 py-1 bg-${color}-200 text-${color}-800 rounded text-xs font-semibold uppercase">
                ${alert.severity}
              </span>
              <span class="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                ${alert.alert_type}
              </span>
              ${alert.auto_resolved ? 
                '<span class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">Auto-Resolve</span>' : 
                ''
              }
            </div>
            <h3 class="font-semibold text-gray-800 mb-1">${alert.title}</h3>
            <p class="text-sm text-gray-600 mb-2">${alert.description}</p>
            <div class="flex items-center space-x-4 text-xs text-gray-500">
              <span>
                <i class="fas fa-users mr-1"></i>
                ${alert.affected_users} users affected
              </span>
              <span>
                <i class="fas fa-clock mr-1"></i>
                ${new Date(alert.created_at).toLocaleString()}
              </span>
              <span class="px-2 py-1 bg-white rounded border">
                ${alert.alert_status}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// COMPLIANCE CHECKLIST
// ============================================================================

async function loadComplianceChecklist() {
  try {
    const response = await fetch('/api/security/compliance-checklist');
    const result = await response.json();
    
    if (result.success) {
      renderComplianceChecklist(result.data);
    } else {
      document.getElementById('compliance-checklist-container').innerHTML = `
        <div class="text-center py-4 text-red-600">
          <i class="fas fa-exclamation-circle text-2xl"></i>
          <p class="mt-2">Error: ${result.error}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('[Security] Error loading checklist:', error);
    document.getElementById('compliance-checklist-container').innerHTML = `
      <div class="text-center py-4 text-red-600">
        <i class="fas fa-exclamation-circle text-2xl"></i>
        <p class="mt-2">Error: ${error.message}</p>
      </div>
    `;
  }
}

function renderComplianceChecklist(checklist) {
  const container = document.getElementById('compliance-checklist-container');
  
  if (!checklist || checklist.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-gray-500">
        <i class="fas fa-inbox text-2xl"></i>
        <p class="mt-2">No checklist items</p>
      </div>
    `;
    return;
  }
  
  // Group by category
  const grouped = {};
  checklist.forEach(item => {
    if (!grouped[item.check_category]) {
      grouped[item.check_category] = [];
    }
    grouped[item.check_category].push(item);
  });
  
  const categoryNames = {
    'HIPAA_TECHNICAL': 'HIPAA Technical Safeguards',
    'HIPAA_ADMIN': 'HIPAA Administrative Safeguards',
    'HIPAA_PHYSICAL': 'HIPAA Physical Safeguards',
    'GDPR': 'GDPR Requirements',
    'SECURITY': 'Security Best Practices'
  };
  
  container.innerHTML = Object.keys(grouped).map(category => {
    const items = grouped[category];
    const compliantCount = items.filter(i => i.is_compliant).length;
    const totalCount = items.length;
    const percentage = Math.round((compliantCount / totalCount) * 100);
    
    return `
      <div class="border rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-800">
            ${categoryNames[category] || category}
          </h3>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">${compliantCount}/${totalCount}</span>
            <span class="px-2 py-1 ${percentage === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} rounded text-xs font-semibold">
              ${percentage}%
            </span>
          </div>
        </div>
        
        <div class="space-y-2">
          ${items.map(item => `
            <div class="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
              <input 
                type="checkbox" 
                ${item.is_compliant ? 'checked' : ''} 
                onchange="updateComplianceCheck(${item.id}, this.checked)"
                class="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-800">${item.check_name}</span>
                  ${item.is_required ? '<span class="text-red-500 text-xs">*</span>' : ''}
                </div>
                <p class="text-sm text-gray-600">${item.description}</p>
                ${item.last_checked ? 
                  `<p class="text-xs text-gray-500 mt-1">Last checked: ${new Date(item.last_checked).toLocaleDateString()}</p>` : 
                  ''
                }
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function updateComplianceCheck(checkId, isCompliant) {
  try {
    const response = await fetch(`/api/security/compliance-checklist/${checkId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_compliant: isCompliant })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Reload checklist to show updated status
      await loadComplianceChecklist();
    } else {
      alert('Error updating compliance check: ' + result.error);
    }
  } catch (error) {
    console.error('[Security] Error updating check:', error);
    alert('Error: ' + error.message);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function showError(message) {
  const container = document.getElementById('error-display');
  if (container) {
    container.classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
    
    setTimeout(() => {
      container.classList.add('hidden');
    }, 5000);
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

window.addEventListener('beforeunload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// ============================================================================
// INIT ON PAGE LOAD
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSecurityMonitoring);
} else {
  initSecurityMonitoring();
}
