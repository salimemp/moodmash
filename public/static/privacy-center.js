// Configure axios to send cookies with all requests
if (typeof axios !== 'undefined') { axios.defaults.withCredentials = true; }

/**
 * Privacy Center - Frontend
 * GDPR-compliant data management and privacy controls
 * Version: 9.0.0
 */

console.log('[Privacy Center] Initializing...');

let dataSummary = null;

// Initialize privacy center
async function init() {
  console.log('[Privacy Center] Starting initialization...');
  
  await loadDataSummary();
  renderPrivacyCenter();
  setupEventListeners();
  
  console.log('[Privacy Center] Ready!');
}

// Load data summary
async function loadDataSummary() {
  try {
    const response = await axios.get('/api/user/data-summary');
    if (response.data.success) {
      dataSummary = response.data.data;
      console.log('[Privacy Center] Data summary loaded:', dataSummary);
    }
  } catch (error) {
    console.error('[Privacy Center] Error loading summary:', error);
    showError('Failed to load data summary');
  }
}

// Render privacy center
function renderPrivacyCenter() {
  const container = document.getElementById('app');
  if (!container) return;
  
  container.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">
          <i class="fas fa-shield-alt mr-2 text-green-500"></i>
          Privacy Center
        </h1>
        <p class="text-gray-600">Manage your data, privacy settings, and account</p>
      </div>
      
      <!-- Data Overview -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-database mr-2 text-blue-500"></i>
          Your Data Overview
        </h2>
        
        ${renderDataOverview()}
      </div>
      
      <!-- Consent Management -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-check-circle mr-2 text-purple-500"></i>
          Privacy Consent & Preferences
        </h2>
        
        ${renderConsentToggles()}
      </div>
      
      <!-- Data Export -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-download mr-2 text-green-500"></i>
          Export Your Data (GDPR Article 20)
        </h2>
        
        <p class="text-gray-600 mb-4">
          Download all your personal data in a portable format. This includes mood entries, activities, health metrics, and more.
        </p>
        
        <div class="flex flex-wrap gap-3">
          <button onclick="exportAllData('json')" class="btn-primary">
            <i class="fas fa-file-code mr-2"></i>Export as JSON
          </button>
          <button onclick="exportAllData('csv')" class="btn-secondary">
            <i class="fas fa-file-csv mr-2"></i>Export as CSV
          </button>
        </div>
        
        <div class="mt-4 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-gray-700">
            <i class="fas fa-info-circle mr-2 text-blue-500"></i>
            Your data export will include all information associated with your account. 
            The file will be downloaded to your device immediately.
          </p>
        </div>
      </div>
      
      <!-- Data Deletion -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-trash-alt mr-2 text-red-500"></i>
          Delete Your Data
        </h2>
        
        <div class="space-y-4">
          <!-- Delete Individual Entries -->
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-bold text-gray-800 mb-2">Delete Individual Entries</h3>
            <p class="text-gray-600 text-sm mb-3">
              You can delete individual mood entries from the dashboard or log page.
            </p>
            <a href="/log" class="btn-secondary">
              <i class="fas fa-edit mr-2"></i>Manage Mood Entries
            </a>
          </div>
          
          <!-- Delete Account -->
          <div class="p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 class="font-bold text-red-800 mb-2">
              <i class="fas fa-exclamation-triangle mr-2"></i>Delete Account (GDPR Article 17)
            </h3>
            <p class="text-red-700 text-sm mb-3">
              <strong>Warning:</strong> This will permanently delete your account and all associated data. 
              This action cannot be undone!
            </p>
            <button onclick="showDeleteConfirmation()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
              <i class="fas fa-trash mr-2"></i>Delete My Account
            </button>
          </div>
        </div>
      </div>
      
      <!-- Privacy Policy & Terms -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-file-contract mr-2 text-indigo-500"></i>
          Legal Documents
        </h2>
        
        <div class="space-y-3">
          <a href="/privacy-policy" class="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
            <i class="fas fa-shield-alt mr-2 text-green-500"></i>
            Privacy Policy (Plain Language)
          </a>
          <a href="/terms-of-service" class="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
            <i class="fas fa-gavel mr-2 text-blue-500"></i>
            Terms of Service
          </a>
          <a href="/data-usage" class="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
            <i class="fas fa-chart-line mr-2 text-purple-500"></i>
            How We Use Your Data
          </a>
        </div>
      </div>
      
      <!-- GDPR Rights -->
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-balance-scale mr-2 text-indigo-500"></i>
          Your GDPR Rights
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${renderGDPRRight('Right to Access', 'View and download your personal data', 'eye', 'blue')}
          ${renderGDPRRight('Right to Rectification', 'Correct inaccurate personal data', 'edit', 'green')}
          ${renderGDPRRight('Right to Erasure', 'Delete your personal data', 'trash', 'red')}
          ${renderGDPRRight('Right to Data Portability', 'Export data in portable format', 'download', 'purple')}
          ${renderGDPRRight('Right to Object', 'Object to data processing', 'hand-paper', 'orange')}
          ${renderGDPRRight('Right to Restriction', 'Restrict data processing', 'lock', 'yellow')}
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h3 class="text-2xl font-bold text-red-600 mb-4">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Confirm Account Deletion
        </h3>
        <p class="text-gray-700 mb-4">
          This will permanently delete:
        </p>
        <ul class="list-disc list-inside text-gray-700 mb-4 space-y-1">
          <li>All ${dataSummary?.data_counts?.mood_entries || 0} mood entries</li>
          <li>All ${dataSummary?.data_counts?.activities || 0} activities</li>
          <li>All ${dataSummary?.data_counts?.health_metrics || 0} health metrics</li>
          <li>Your account and profile</li>
          <li>All other associated data</li>
        </ul>
        <p class="text-red-600 font-bold mb-4">This action cannot be undone!</p>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">
            Type <strong>DELETE</strong> to confirm:
          </label>
          <input type="text" id="deleteConfirmInput" 
                 class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                 placeholder="Type DELETE">
        </div>
        
        <div class="flex gap-3">
          <button onclick="hideDeleteConfirmation()" class="flex-1 btn-secondary">
            Cancel
          </button>
          <button onclick="deleteAccount()" class="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render data overview
function renderDataOverview() {
  if (!dataSummary) {
    return '<div class="text-gray-600">Loading data summary...</div>';
  }
  
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div class="p-4 bg-blue-50 rounded-lg">
        <div class="text-3xl font-bold text-blue-600">${dataSummary.data_counts.mood_entries}</div>
        <div class="text-sm text-gray-600">Mood Entries</div>
      </div>
      <div class="p-4 bg-green-50 rounded-lg">
        <div class="text-3xl font-bold text-green-600">${dataSummary.data_counts.activities}</div>
        <div class="text-sm text-gray-600">Activities</div>
      </div>
      <div class="p-4 bg-purple-50 rounded-lg">
        <div class="text-3xl font-bold text-purple-600">${dataSummary.data_counts.health_metrics}</div>
        <div class="text-sm text-gray-600">Health Metrics</div>
      </div>
      <div class="p-4 bg-gray-50 rounded-lg">
        <div class="text-3xl font-bold text-gray-600">${dataSummary.total_storage_estimate}</div>
        <div class="text-sm text-gray-600">Storage Used</div>
      </div>
    </div>
    
    <div class="p-4 bg-gray-50 rounded-lg">
      <h3 class="font-bold text-gray-800 mb-2">Account Information</h3>
      <div class="space-y-1 text-sm">
        <div><strong>Email:</strong> ${dataSummary.account.email || 'N/A'}</div>
        <div><strong>Name:</strong> ${dataSummary.account.name || 'N/A'}</div>
        <div><strong>Account Created:</strong> ${new Date(dataSummary.account.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  `;
}

// Render consent toggles
function renderConsentToggles() {
  const consentTypes = [
    { type: 'data_collection', label: 'Data Collection', description: 'Allow MoodMash to collect mood and activity data', required: true },
    { type: 'ai_analysis', label: 'AI Analysis', description: 'Enable AI-powered mood insights and predictions', required: false },
    { type: 'research_participation', label: 'Research Participation', description: 'Anonymously contribute data to mental health research', required: false },
    { type: 'marketing_emails', label: 'Marketing Emails', description: 'Receive updates about new features and improvements', required: false }
  ];
  
  return `
    <div class="space-y-4">
      ${consentTypes.map(consent => renderConsentToggle(consent)).join('')}
    </div>
    
    <div class="mt-4 p-4 bg-yellow-50 rounded-lg">
      <p class="text-sm text-gray-700">
        <i class="fas fa-info-circle mr-2 text-yellow-600"></i>
        Some features require specific permissions. Disabling data collection may limit app functionality.
      </p>
    </div>
  `;
}

// Render individual consent toggle
function renderConsentToggle(consent) {
  const currentConsent = dataSummary?.consents?.find(c => c.consent_type === consent.type);
  const isEnabled = currentConsent?.consent_given === 1;
  
  return `
    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div class="flex-1">
        <div class="font-bold text-gray-800">
          ${consent.label}
          ${consent.required ? '<span class="text-xs text-red-600 ml-2">(Required)</span>' : ''}
        </div>
        <div class="text-sm text-gray-600">${consent.description}</div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" 
               ${isEnabled ? 'checked' : ''} 
               ${consent.required ? 'disabled' : ''}
               onchange="toggleConsent('${consent.type}', this.checked)"
               class="sr-only peer">
        <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${consent.required ? 'opacity-50 cursor-not-allowed' : ''}"></div>
      </label>
    </div>
  `;
}

// Render GDPR right card
function renderGDPRRight(title, description, icon, color) {
  return `
    <div class="p-4 bg-white rounded-lg shadow">
      <div class="flex items-start">
        <i class="fas fa-${icon} text-${color}-500 text-2xl mr-3 mt-1"></i>
        <div>
          <div class="font-bold text-gray-800">${title}</div>
          <div class="text-sm text-gray-600">${description}</div>
        </div>
      </div>
    </div>
  `;
}

// Export all data
async function exportAllData(format) {
  try {
    console.log(`[Privacy Center] Exporting data as ${format}...`);
    
    const response = await axios.get(`/api/user/export-data?format=${format}`, {
      responseType: format === 'json' ? 'json' : 'blob'
    });
    
    if (format === 'json') {
      const dataStr = JSON.stringify(response.data.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      downloadBlob(blob, `moodmash-data-${Date.now()}.json`);
    } else {
      downloadBlob(response.data, `moodmash-data-${Date.now()}.csv`);
    }
    
    showSuccess('Data exported successfully!');
  } catch (error) {
    console.error('[Privacy Center] Export error:', error);
    showError('Failed to export data');
  }
}

// Toggle consent
async function toggleConsent(consentType, enabled) {
  try {
    console.log(`[Privacy Center] Updating consent: ${consentType} = ${enabled}`);
    
    const response = await axios.post('/api/consent/update', {
      consent_type: consentType,
      consent_given: enabled
    });
    
    if (response.data.success) {
      showSuccess('Consent preference updated');
      await loadDataSummary();
    }
  } catch (error) {
    console.error('[Privacy Center] Consent update error:', error);
    showError('Failed to update consent');
  }
}

// Show delete confirmation modal
function showDeleteConfirmation() {
  document.getElementById('deleteModal').classList.remove('hidden');
  document.getElementById('deleteConfirmInput').value = '';
}

// Hide delete confirmation modal
function hideDeleteConfirmation() {
  document.getElementById('deleteModal').classList.add('hidden');
}

// Delete account
async function deleteAccount() {
  const input = document.getElementById('deleteConfirmInput').value;
  
  if (input !== 'DELETE') {
    showError('Please type DELETE to confirm');
    return;
  }
  
  try {
    console.log('[Privacy Center] Deleting account...');
    
    const response = await axios.delete('/api/user/delete-account?confirm=DELETE_MY_ACCOUNT');
    
    if (response.data.success) {
      alert('Your account has been permanently deleted. You will be redirected to the homepage.');
      window.location.href = '/';
    }
  } catch (error) {
    console.error('[Privacy Center] Delete account error:', error);
    showError('Failed to delete account');
    hideDeleteConfirmation();
  }
}

// Download blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Setup event listeners
function setupEventListeners() {
  // Add any additional event listeners here
}

// Show success message
function showSuccess(message) {
  const container = document.getElementById('app');
  if (!container) return;
  
  const successDiv = document.createElement('div');
  successDiv.className = 'fixed top-4 right-4 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-lg z-50';
  successDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-check-circle text-green-500 mr-3"></i>
      <p class="text-green-700">${message}</p>
    </div>
  `;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 3000);
}

// Show error message
function showError(message) {
  const container = document.getElementById('app');
  if (!container) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'fixed top-4 right-4 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg z-50';
  errorDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-exclamation-circle text-red-500 mr-3"></i>
      <p class="text-red-700">${message}</p>
    </div>
  `;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('[Privacy Center] Script loaded');
