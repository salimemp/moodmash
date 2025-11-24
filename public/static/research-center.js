/**
 * Research Center Dashboard Frontend
 * Consent management, data anonymization, research exports
 * Version: 9.5.0 Phase 2
 */

let consentChart = null;
let statsChart = null;

// ============================================================================
// INITIALIZE
// ============================================================================

async function initResearchCenter() {
  console.log('[Research] Initializing dashboard...');
  
  await Promise.all([
    loadDashboardStats(),
    loadAggregatedStats(),
    loadUserConsents()
  ]);
  
  console.log('[Research] Dashboard ready!');
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

async function loadDashboardStats() {
  try {
    const response = await fetch('/api/research/dashboard');
    const result = await response.json();
    
    if (result.success) {
      renderDashboard(result.data);
    } else {
      showError('Error loading dashboard: ' + result.error);
    }
  } catch (error) {
    console.error('[Research] Error:', error);
    showError(error.message);
  }
}

function renderDashboard(data) {
  document.getElementById('app').innerHTML = `
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-indigo-800 text-white p-6 rounded-lg shadow-lg mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">
            <i class="fas fa-flask mr-3"></i>Research Center
          </h1>
          <p class="text-purple-100">Anonymized research data & ethical consent management</p>
        </div>
        <div class="text-right">
          <div class="text-sm text-purple-200 mb-1">Last Updated</div>
          <div class="text-lg font-semibold">
            ${new Date(data.last_updated).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Total Consents</p>
            <p class="text-2xl font-bold text-green-600">${data.total_consents}</p>
          </div>
          <i class="fas fa-check-circle text-3xl text-green-300"></i>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Active Participants</p>
            <p class="text-2xl font-bold text-blue-600">${data.active_participants}</p>
          </div>
          <i class="fas fa-users text-3xl text-blue-300"></i>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Anonymized Datasets</p>
            <p class="text-2xl font-bold text-purple-600">${data.anonymized_datasets}</p>
          </div>
          <i class="fas fa-database text-3xl text-purple-300"></i>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Export Requests</p>
            <p class="text-2xl font-bold text-orange-600">${data.export_requests.total}</p>
            <p class="text-xs text-gray-500">${data.export_requests.pending} pending</p>
          </div>
          <i class="fas fa-file-export text-3xl text-orange-300"></i>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Consent Breakdown -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-chart-pie text-purple-600 mr-2"></i>
          Consent Type Breakdown
        </h2>
        <div id="consent-breakdown">
          ${renderConsentBreakdown(data.consent_breakdown)}
        </div>
      </div>
      
      <!-- Aggregated Stats -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
          Research Statistics
        </h2>
        <div id="aggregated-stats" class="space-y-3">
          <div class="text-center py-4 text-gray-500">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
            <p class="mt-2">Loading stats...</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Consent Management -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        <i class="fas fa-user-shield text-green-600 mr-2"></i>
        Consent Management (User ID: 1)
      </h2>
      <div id="consent-management" class="space-y-3">
        <div class="text-center py-4 text-gray-500">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <p class="mt-2">Loading consents...</p>
        </div>
      </div>
    </div>
    
    <!-- Data Anonymization -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        <i class="fas fa-user-secret text-purple-600 mr-2"></i>
        Data Anonymization
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border border-purple-200 rounded-lg p-4">
          <h3 class="font-semibold text-gray-800 mb-3">Anonymize Mood Data</h3>
          <p class="text-sm text-gray-600 mb-4">
            Convert mood entries into anonymized research data with all personally identifiable information removed.
          </p>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">User ID</label>
            <input 
              type="number" 
              id="mood-user-id" 
              value="1" 
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            />
            <button 
              onclick="anonymizeMoodData()" 
              class="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <i class="fas fa-user-secret mr-2"></i>Anonymize Mood Data
            </button>
          </div>
        </div>
        
        <div class="border border-blue-200 rounded-lg p-4">
          <h3 class="font-semibold text-gray-800 mb-3">Anonymize Health Metrics</h3>
          <p class="text-sm text-gray-600 mb-4">
            Convert health metrics into anonymized research data for mental health studies.
          </p>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">User ID</label>
            <input 
              type="number" 
              id="health-user-id" 
              value="1" 
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onclick="anonymizeHealthData()" 
              class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <i class="fas fa-user-secret mr-2"></i>Anonymize Health Data
            </button>
          </div>
        </div>
      </div>
      
      <div id="anonymization-result" class="hidden mt-4 p-4 bg-green-50 border border-green-200 rounded">
        <h3 class="font-semibold text-green-800 mb-2">
          <i class="fas fa-check-circle mr-2"></i>Anonymization Complete
        </h3>
        <pre id="anonymization-output" class="text-sm text-gray-700 overflow-x-auto"></pre>
      </div>
    </div>
    
    <!-- Export Request Form -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        <i class="fas fa-file-export text-orange-600 mr-2"></i>
        Request Research Data Export
      </h2>
      <form onsubmit="submitExportRequest(event)" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Export Type <span class="text-red-500">*</span>
            </label>
            <select 
              id="export-type" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select type...</option>
              <option value="mood_data">Mood Data</option>
              <option value="health_metrics">Health Metrics</option>
              <option value="full_dataset">Full Dataset</option>
              <option value="aggregated_stats">Aggregated Statistics</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Requester Name <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="requester-name" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
              placeholder="Dr. Jane Smith"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span class="text-red-500">*</span>
            </label>
            <input 
              type="email" 
              id="requester-email" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
              placeholder="researcher@university.edu"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              IRB Approval Number
            </label>
            <input 
              type="text" 
              id="irb-approval" 
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
              placeholder="IRB-2025-001"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Research Purpose <span class="text-red-500">*</span>
          </label>
          <textarea 
            id="research-purpose" 
            required
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
            placeholder="Describe your research study and how this data will be used..."
          ></textarea>
        </div>
        
        <button 
          type="submit" 
          class="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
        >
          <i class="fas fa-paper-plane mr-2"></i>Submit Export Request
        </button>
      </form>
    </div>
    
    <!-- Ethics & Privacy Notice -->
    <div class="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 p-6 rounded-lg shadow">
      <div class="flex items-start">
        <i class="fas fa-shield-alt text-3xl text-green-600 mr-4 mt-1"></i>
        <div>
          <h2 class="text-xl font-bold text-gray-800 mb-3">
            Research Ethics & Privacy Commitment
          </h2>
          <div class="text-sm text-gray-700 space-y-2">
            <p><strong>✅ Full Anonymization:</strong> All personal identifiers removed from research data</p>
            <p><strong>✅ Informed Consent:</strong> Users explicitly consent to each data type</p>
            <p><strong>✅ Right to Revoke:</strong> Participants can withdraw consent at any time</p>
            <p><strong>✅ Ethical Review:</strong> All exports require IRB approval or equivalent</p>
            <p><strong>✅ Data Minimization:</strong> Only aggregate statistics shared publicly</p>
            <p><strong>✅ Secure Storage:</strong> Encrypted at rest and in transit</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Error Display -->
    <div id="error-display" class="hidden bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mt-4">
      <i class="fas fa-exclamation-circle mr-2"></i>
      <span id="error-message"></span>
    </div>
  `;
}

function renderConsentBreakdown(consents) {
  if (!consents || consents.length === 0) {
    return '<p class="text-center text-gray-500 py-4">No consent data available</p>';
  }
  
  return `
    <div class="space-y-2">
      ${consents.map(consent => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span class="font-medium text-gray-700">${consent.consent_type}</span>
          <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            ${consent.count}
          </span>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================================================
// AGGREGATED STATS
// ============================================================================

async function loadAggregatedStats() {
  try {
    const response = await fetch('/api/research/stats');
    const result = await response.json();
    
    if (result.success) {
      renderAggregatedStats(result.data);
    }
  } catch (error) {
    console.error('[Research] Error loading stats:', error);
  }
}

function renderAggregatedStats(stats) {
  const container = document.getElementById('aggregated-stats');
  
  if (stats.total_participants === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-gray-500">
        <i class="fas fa-info-circle text-2xl"></i>
        <p class="mt-2">No research participants yet</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="space-y-3">
      <div class="flex items-center justify-between p-3 bg-blue-50 rounded">
        <span class="text-sm font-medium text-gray-700">Total Participants</span>
        <span class="text-lg font-bold text-blue-600">${stats.total_participants}</span>
      </div>
      
      <div class="flex items-center justify-between p-3 bg-purple-50 rounded">
        <span class="text-sm font-medium text-gray-700">Avg Mental Health Score</span>
        <span class="text-lg font-bold text-purple-600">${stats.average_mental_health_score.toFixed(1)}</span>
      </div>
      
      <div class="flex items-center justify-between p-3 bg-green-50 rounded">
        <span class="text-sm font-medium text-gray-700">Avg Sleep Hours</span>
        <span class="text-lg font-bold text-green-600">${stats.average_sleep_hours.toFixed(1)}h</span>
      </div>
      
      <div class="flex items-center justify-between p-3 bg-orange-50 rounded">
        <span class="text-sm font-medium text-gray-700">Avg Stress Level</span>
        <span class="text-lg font-bold text-orange-600">${stats.average_stress_level.toFixed(1)}/5</span>
      </div>
    </div>
    
    <div class="mt-4">
      <h3 class="text-sm font-semibold text-gray-700 mb-2">Mood Distribution</h3>
      <div class="space-y-1">
        ${Object.entries(stats.mood_distribution).map(([emotion, count]) => `
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">${emotion}</span>
            <span class="text-gray-800 font-medium">${count}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// USER CONSENTS
// ============================================================================

async function loadUserConsents() {
  try {
    const userId = 1; // TODO: Get from session
    const response = await fetch(`/api/research/consents/${userId}`);
    const result = await response.json();
    
    if (result.success) {
      renderUserConsents(result.data, userId);
    }
  } catch (error) {
    console.error('[Research] Error loading consents:', error);
  }
}

function renderUserConsents(consents, userId) {
  const container = document.getElementById('consent-management');
  
  const consentTypes = [
    { type: 'mood_data', label: 'Mood Data', icon: 'smile', description: 'Share anonymized mood entries' },
    { type: 'health_metrics', label: 'Health Metrics', icon: 'heartbeat', description: 'Share mental health scores' },
    { type: 'activity_data', label: 'Activity Data', icon: 'running', description: 'Share wellness activity logs' },
    { type: 'full_profile', label: 'Full Profile', icon: 'user-circle', description: 'Share complete profile data' }
  ];
  
  const existingConsents = {};
  consents.forEach(c => {
    existingConsents[c.consent_type] = c.consent_given;
  });
  
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${consentTypes.map(ct => {
        const isConsented = existingConsents[ct.type] === 1;
        return `
          <div class="border ${isConsented ? 'border-green-300 bg-green-50' : 'border-gray-300'} rounded-lg p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center">
                <i class="fas fa-${ct.icon} text-2xl ${isConsented ? 'text-green-600' : 'text-gray-400'} mr-3"></i>
                <div>
                  <h3 class="font-semibold text-gray-800">${ct.label}</h3>
                  <p class="text-sm text-gray-600">${ct.description}</p>
                </div>
              </div>
            </div>
            <label class="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                ${isConsented ? 'checked' : ''}
                onchange="updateConsent('${ct.type}', this.checked, ${userId})"
                class="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span class="ml-3 text-sm font-medium text-gray-700">
                ${isConsented ? 'Consent Given' : 'Give Consent'}
              </span>
            </label>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function updateConsent(consentType, isGiven, userId) {
  try {
    const response = await fetch('/api/research/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        consent_type: consentType,
        consent_given: isGiven,
        can_revoke: true
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showSuccess(`Consent ${isGiven ? 'given' : 'revoked'} for ${consentType}`);
      await loadUserConsents();
      await loadDashboardStats();
    } else {
      alert('Error updating consent: ' + result.error);
    }
  } catch (error) {
    console.error('[Research] Error updating consent:', error);
    alert('Error: ' + error.message);
  }
}

// ============================================================================
// DATA ANONYMIZATION
// ============================================================================

async function anonymizeMoodData() {
  const userId = parseInt(document.getElementById('mood-user-id').value);
  
  try {
    const response = await fetch('/api/research/anonymize/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAnonymizationResult(result.data);
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    console.error('[Research] Error:', error);
    alert('Error: ' + error.message);
  }
}

async function anonymizeHealthData() {
  const userId = parseInt(document.getElementById('health-user-id').value);
  
  try {
    const response = await fetch('/api/research/anonymize/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAnonymizationResult(result.data);
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    console.error('[Research] Error:', error);
    alert('Error: ' + error.message);
  }
}

function showAnonymizationResult(data) {
  const container = document.getElementById('anonymization-result');
  const output = document.getElementById('anonymization-output');
  
  output.textContent = JSON.stringify({
    anonymous_id: data.anonymous_id,
    data_type: data.data_type,
    record_count: data.record_count,
    sample_data: data.data.slice(0, 3)
  }, null, 2);
  
  container.classList.remove('hidden');
  
  setTimeout(() => {
    container.classList.add('hidden');
  }, 10000);
}

// ============================================================================
// EXPORT REQUEST
// ============================================================================

async function submitExportRequest(event) {
  event.preventDefault();
  
  const exportType = document.getElementById('export-type').value;
  const requesterName = document.getElementById('requester-name').value;
  const requesterEmail = document.getElementById('requester-email').value;
  const irbApproval = document.getElementById('irb-approval').value;
  const purpose = document.getElementById('research-purpose').value;
  
  try {
    const response = await fetch('/api/research/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        export_type: exportType,
        requester_name: requesterName,
        requester_email: requesterEmail,
        irb_approval: irbApproval,
        purpose: purpose
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showSuccess(`Export request submitted! Request ID: ${result.data.export_id}`);
      event.target.reset();
      await loadDashboardStats();
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    console.error('[Research] Error:', error);
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

function showSuccess(message) {
  // Create temporary success message
  const div = document.createElement('div');
  div.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
  div.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
  document.body.appendChild(div);
  
  setTimeout(() => {
    div.remove();
  }, 3000);
}

// ============================================================================
// INIT ON PAGE LOAD
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResearchCenter);
} else {
  initResearchCenter();
}
