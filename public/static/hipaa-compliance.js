/**
 * HIPAA Compliance Dashboard Frontend
 * Version: 9.5.0 Phase 2
 */

let complianceChart = null;
let auditLogsChart = null;

// ============================================================================
// INITIALIZE
// ============================================================================

async function initHIPAACompliance() {
  console.log('[HIPAA] Initializing dashboard...');
  
  // Load data
  await Promise.all([
    loadComplianceStatus(),
    loadAuditLogs(),
    loadSecurityIncidents(),
    initBAAGenerator()
  ]);
  
  // Setup event listeners
  setupEventListeners();
  
  console.log('[HIPAA] Dashboard ready!');
}

// ============================================================================
// COMPLIANCE STATUS
// ============================================================================

async function loadComplianceStatus() {
  try {
    const response = await fetch('/api/hipaa/status');
    const result = await response.json();
    
    if (result.success) {
      renderComplianceStatus(result.data);
      renderComplianceChart(result.data);
    } else {
      showError('compliance-status-error', result.error);
    }
  } catch (error) {
    console.error('[HIPAA] Error loading compliance status:', error);
    showError('compliance-status-error', error.message);
  }
}

function renderComplianceStatus(data) {
  const statusColor = data.overall_status === 'compliant' ? 'green' : 'yellow';
  const statusText = data.overall_status === 'compliant' ? 'Compliant' : 'Partial Compliance';
  
  document.getElementById('app').innerHTML = `
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">
            <i class="fas fa-shield-alt mr-3"></i>HIPAA Compliance Dashboard
          </h1>
          <p class="text-blue-100">Health Insurance Portability and Accountability Act</p>
        </div>
        <div class="text-right">
          <div class="text-sm text-blue-200 mb-1">Overall Status</div>
          <div class="flex items-center space-x-2">
            <span class="px-4 py-2 bg-${statusColor}-500 text-white rounded-full font-bold">
              ${statusText}
            </span>
            <span class="text-3xl font-bold">${data.compliance_score}%</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Audit Logs (30d)</p>
            <p class="text-2xl font-bold text-blue-600">${data.audit_logs_30d}</p>
          </div>
          <i class="fas fa-clipboard-list text-3xl text-blue-300"></i>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Active Policies</p>
            <p class="text-2xl font-bold text-green-600">${data.active_policies}</p>
          </div>
          <i class="fas fa-file-contract text-3xl text-green-300"></i>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Open Incidents</p>
            <p class="text-2xl font-bold ${data.open_incidents > 0 ? 'text-red-600' : 'text-green-600'}">
              ${data.open_incidents}
            </p>
          </div>
          <i class="fas fa-exclamation-triangle text-3xl ${data.open_incidents > 0 ? 'text-red-300' : 'text-green-300'}"></i>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Compliance Score</p>
            <p class="text-2xl font-bold text-purple-600">${data.compliance_score}%</p>
          </div>
          <i class="fas fa-chart-line text-3xl text-purple-300"></i>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Compliance Chart -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-chart-pie text-blue-600 mr-2"></i>
          Compliance Breakdown
        </h2>
        <canvas id="complianceChart" width="400" height="300"></canvas>
      </div>
      
      <!-- Encryption Status -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-lock text-green-600 mr-2"></i>
          Encryption Status
        </h2>
        <div id="encryption-status" class="space-y-3">
          ${renderEncryptionStatus(data.encryption_status)}
        </div>
      </div>
    </div>
    
    <!-- Audit Logs -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-clipboard-list text-blue-600 mr-2"></i>
          Recent Audit Logs
        </h2>
        <button onclick="exportAuditLogs()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <i class="fas fa-download mr-2"></i>Export
        </button>
      </div>
      <div id="audit-logs-container" class="space-y-2">
        <div class="text-center py-4 text-gray-500">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <p class="mt-2">Loading audit logs...</p>
        </div>
      </div>
      <canvas id="auditLogsChart" width="800" height="200" class="mt-4"></canvas>
    </div>
    
    <!-- Security Incidents -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
        Security Incidents
      </h2>
      <div id="incidents-container" class="space-y-3">
        <div class="text-center py-4 text-gray-500">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <p class="mt-2">Loading incidents...</p>
        </div>
      </div>
    </div>
    
    <!-- BAA Generator -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        <i class="fas fa-file-contract text-purple-600 mr-2"></i>
        Business Associate Agreement Generator
      </h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Organization Name <span class="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            id="baa-org-name" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Acme Healthcare Systems"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Effective Date
          </label>
          <input 
            type="date" 
            id="baa-effective-date" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value="${new Date().toISOString().split('T')[0]}"
          />
        </div>
        
        <button 
          onclick="generateBAA()" 
          class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
        >
          <i class="fas fa-file-pdf mr-2"></i>Generate BAA
        </button>
        
        <div id="baa-output" class="hidden">
          <div class="border-t pt-4 mt-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-800">Generated BAA</h3>
              <button onclick="downloadBAA()" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                <i class="fas fa-download mr-2"></i>Download
              </button>
            </div>
            <pre id="baa-content" class="bg-gray-50 p-4 rounded border text-sm max-h-96 overflow-y-auto"></pre>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Error Display -->
    <div id="compliance-status-error" class="hidden bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4">
      <i class="fas fa-exclamation-circle mr-2"></i>
      <span id="error-message"></span>
    </div>
  `;
}

function renderEncryptionStatus(encryptionData) {
  if (!encryptionData || encryptionData.length === 0) {
    return `
      <div class="text-center py-4 text-gray-500">
        <i class="fas fa-info-circle text-2xl"></i>
        <p class="mt-2">No encryption data available</p>
      </div>
    `;
  }
  
  return encryptionData.map(item => {
    const isEncrypted = item.is_encrypted === 1;
    const icon = isEncrypted ? 'fa-check-circle' : 'fa-times-circle';
    const color = isEncrypted ? 'green' : 'red';
    
    return `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded border">
        <div>
          <p class="font-semibold text-gray-800">${item.data_type || 'Unknown'}</p>
          <p class="text-sm text-gray-500">${item.encryption_method || 'N/A'}</p>
        </div>
        <div class="flex items-center space-x-2">
          <i class="fas ${icon} text-${color}-600 text-xl"></i>
          <span class="text-sm text-gray-600">
            ${new Date(item.last_verified).toLocaleDateString()}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderComplianceChart(data) {
  const ctx = document.getElementById('complianceChart');
  if (!ctx) return;
  
  const passedChecks = Math.round((data.compliance_score / 100) * 10);
  const failedChecks = 10 - passedChecks;
  
  if (complianceChart) {
    complianceChart.destroy();
  }
  
  complianceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Compliant', 'Non-Compliant'],
      datasets: [{
        data: [passedChecks, failedChecks],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + context.parsed + '/10 checks';
            }
          }
        }
      }
    }
  });
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

async function loadAuditLogs() {
  try {
    const response = await fetch('/api/hipaa/audit-logs?limit=50');
    const result = await response.json();
    
    if (result.success) {
      renderAuditLogs(result.data);
      renderAuditLogsChart(result.data);
    } else {
      document.getElementById('audit-logs-container').innerHTML = `
        <div class="text-center py-4 text-red-600">
          <i class="fas fa-exclamation-circle text-2xl"></i>
          <p class="mt-2">Error loading audit logs: ${result.error}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('[HIPAA] Error loading audit logs:', error);
    document.getElementById('audit-logs-container').innerHTML = `
      <div class="text-center py-4 text-red-600">
        <i class="fas fa-exclamation-circle text-2xl"></i>
        <p class="mt-2">Error: ${error.message}</p>
      </div>
    `;
  }
}

function renderAuditLogs(logs) {
  const container = document.getElementById('audit-logs-container');
  
  if (!logs || logs.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-gray-500">
        <i class="fas fa-inbox text-2xl"></i>
        <p class="mt-2">No audit logs available</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PHI</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${logs.slice(0, 20).map(log => `
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-900">
                ${new Date(log.timestamp).toLocaleString()}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">${log.action}</td>
              <td class="px-4 py-3 text-sm">
                ${log.contains_phi ? 
                  '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">PHI</span>' : 
                  '<span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">No PHI</span>'
                }
              </td>
              <td class="px-4 py-3 text-sm">
                ${log.success ? 
                  '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Success</span>' : 
                  '<span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Failed</span>'
                }
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">${log.user_id || 'System'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAuditLogsChart(logs) {
  const ctx = document.getElementById('auditLogsChart');
  if (!ctx) return;
  
  // Count actions by type
  const actionCounts = {};
  logs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });
  
  const labels = Object.keys(actionCounts).slice(0, 10);
  const data = labels.map(label => actionCounts[label]);
  
  if (auditLogsChart) {
    auditLogsChart.destroy();
  }
  
  auditLogsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Audit Log Actions',
        data: data,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// ============================================================================
// SECURITY INCIDENTS
// ============================================================================

async function loadSecurityIncidents() {
  try {
    const response = await fetch('/api/hipaa/incidents');
    const result = await response.json();
    
    if (result.success) {
      renderSecurityIncidents(result.data);
    } else {
      document.getElementById('incidents-container').innerHTML = `
        <div class="text-center py-4 text-red-600">
          <i class="fas fa-exclamation-circle text-2xl"></i>
          <p class="mt-2">Error loading incidents: ${result.error}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('[HIPAA] Error loading incidents:', error);
    document.getElementById('incidents-container').innerHTML = `
      <div class="text-center py-4 text-red-600">
        <i class="fas fa-exclamation-circle text-2xl"></i>
        <p class="mt-2">Error: ${error.message}</p>
      </div>
    `;
  }
}

function renderSecurityIncidents(incidents) {
  const container = document.getElementById('incidents-container');
  
  if (!incidents || incidents.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-green-600">
        <i class="fas fa-check-circle text-4xl"></i>
        <p class="mt-3 text-lg font-semibold">No Security Incidents</p>
        <p class="text-sm text-gray-500">All systems operating normally</p>
      </div>
    `;
    return;
  }
  
  const severityColors = {
    low: 'blue',
    medium: 'yellow',
    high: 'orange',
    critical: 'red'
  };
  
  container.innerHTML = incidents.map(incident => {
    const color = severityColors[incident.severity] || 'gray';
    return `
      <div class="border-l-4 border-${color}-500 bg-${color}-50 p-4 rounded">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <span class="px-2 py-1 bg-${color}-200 text-${color}-800 rounded text-xs font-semibold uppercase">
                ${incident.severity}
              </span>
              <span class="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                ${incident.incident_type}
              </span>
              ${incident.phi_involved ? 
                '<span class="px-2 py-1 bg-red-200 text-red-800 rounded text-xs">PHI Involved</span>' : 
                ''
              }
            </div>
            <h3 class="font-semibold text-gray-800 mb-1">${incident.title}</h3>
            <p class="text-sm text-gray-600 mb-2">${incident.description}</p>
            <div class="flex items-center space-x-4 text-xs text-gray-500">
              <span>
                <i class="fas fa-users mr-1"></i>
                ${incident.affected_users_count} users affected
              </span>
              <span>
                <i class="fas fa-clock mr-1"></i>
                ${new Date(incident.detected_at).toLocaleString()}
              </span>
              <span class="px-2 py-1 bg-white rounded border">
                ${incident.incident_status}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// BAA GENERATOR
// ============================================================================

let currentBAA = null;

function initBAAGenerator() {
  // Initialize with default values
  const dateInput = document.getElementById('baa-effective-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

async function generateBAA() {
  const orgName = document.getElementById('baa-org-name').value.trim();
  const effectiveDate = document.getElementById('baa-effective-date').value;
  
  if (!orgName) {
    alert('Please enter an organization name');
    return;
  }
  
  try {
    const response = await fetch('/api/hipaa/baa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_name: orgName,
        effective_date: effectiveDate
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      currentBAA = result.data;
      document.getElementById('baa-content').textContent = result.data.content;
      document.getElementById('baa-output').classList.remove('hidden');
    } else {
      alert('Error generating BAA: ' + result.error);
    }
  } catch (error) {
    console.error('[BAA] Error:', error);
    alert('Error generating BAA: ' + error.message);
  }
}

function downloadBAA() {
  if (!currentBAA) return;
  
  const blob = new Blob([currentBAA.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BAA_${currentBAA.organization_name.replace(/\s+/g, '_')}_${currentBAA.effective_date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

async function exportAuditLogs() {
  try {
    const response = await fetch('/api/hipaa/audit-logs?limit=1000');
    const result = await response.json();
    
    if (!result.success) {
      alert('Error exporting audit logs: ' + result.error);
      return;
    }
    
    // Convert to CSV
    const logs = result.data;
    const headers = ['Timestamp', 'User ID', 'Action', 'Resource Type', 'Contains PHI', 'Success', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.user_id || '',
      log.action,
      log.resource_type || '',
      log.contains_phi ? 'Yes' : 'No',
      log.success ? 'Success' : 'Failed',
      log.ip_address || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HIPAA_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[Export] Error:', error);
    alert('Error exporting audit logs: ' + error.message);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function setupEventListeners() {
  // Add any global event listeners here
}

function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.classList.remove('hidden');
    const messageEl = container.querySelector('#error-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
  }
}

// ============================================================================
// INIT ON PAGE LOAD
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHIPAACompliance);
} else {
  initHIPAACompliance();
}
