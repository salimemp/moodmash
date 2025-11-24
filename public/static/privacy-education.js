/**
 * Privacy Education Center Frontend
 * Interactive privacy tutorials and visual diagrams
 * Version: 9.5.0 Phase 2
 */

// ============================================================================
// INITIALIZE
// ============================================================================

function initPrivacyEducation() {
  console.log('[Privacy Education] Initializing...');
  renderEducationCenter();
  console.log('[Privacy Education] Ready!');
}

// ============================================================================
// RENDER EDUCATION CENTER
// ============================================================================

function renderEducationCenter() {
  document.getElementById('app').innerHTML = `
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-cyan-800 text-white p-6 rounded-lg shadow-lg mb-6">
      <h1 class="text-3xl font-bold mb-2">
        <i class="fas fa-graduation-cap mr-3"></i>Privacy Education Center
      </h1>
      <p class="text-blue-100">Understanding your data privacy rights and our practices</p>
    </div>
    
    <!-- Quick Navigation -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <button onclick="scrollToSection('data-flow')" class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
        <i class="fas fa-project-diagram text-3xl text-blue-600 mb-2"></i>
        <p class="text-sm font-semibold text-gray-800">Data Flow</p>
      </button>
      <button onclick="scrollToSection('your-rights')" class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
        <i class="fas fa-balance-scale text-3xl text-green-600 mb-2"></i>
        <p class="text-sm font-semibold text-gray-800">Your Rights</p>
      </button>
      <button onclick="scrollToSection('security')" class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
        <i class="fas fa-shield-alt text-3xl text-purple-600 mb-2"></i>
        <p class="text-sm font-semibold text-gray-800">Security</p>
      </button>
      <button onclick="scrollToSection('compliance')" class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
        <i class="fas fa-certificate text-3xl text-orange-600 mb-2"></i>
        <p class="text-sm font-semibold text-gray-800">Compliance</p>
      </button>
    </div>
    
    <!-- Data Flow Diagram -->
    <div id="data-flow" class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">
        <i class="fas fa-project-diagram text-blue-600 mr-2"></i>
        How Your Data Flows
      </h2>
      
      <div class="relative">
        <!-- Visual Diagram -->
        <svg viewBox="0 0 800 400" class="w-full h-64">
          <!-- You (Input) -->
          <g>
            <rect x="20" y="150" width="120" height="80" rx="10" fill="#3b82f6" />
            <text x="80" y="190" text-anchor="middle" fill="white" font-size="16" font-weight="bold">YOU</text>
            <text x="80" y="210" text-anchor="middle" fill="white" font-size="12">Mood Entry</text>
          </g>
          
          <!-- Arrow 1 -->
          <path d="M 140 190 L 200 190" stroke="#94a3b8" stroke-width="3" marker-end="url(#arrowhead)" />
          
          <!-- Encryption Layer -->
          <g>
            <rect x="200" y="150" width="120" height="80" rx="10" fill="#10b981" />
            <text x="260" y="185" text-anchor="middle" fill="white" font-size="14" font-weight="bold">TLS 1.3</text>
            <text x="260" y="205" text-anchor="middle" fill="white" font-size="12">Encryption</text>
            <text x="260" y="220" text-anchor="middle" fill="white" font-size="10">🔒 Secure</text>
          </g>
          
          <!-- Arrow 2 -->
          <path d="M 320 190 L 380 190" stroke="#94a3b8" stroke-width="3" marker-end="url(#arrowhead)" />
          
          <!-- Server -->
          <g>
            <rect x="380" y="150" width="120" height="80" rx="10" fill="#8b5cf6" />
            <text x="440" y="185" text-anchor="middle" fill="white" font-size="14" font-weight="bold">Server</text>
            <text x="440" y="205" text-anchor="middle" fill="white" font-size="12">Processing</text>
          </g>
          
          <!-- Arrow 3 -->
          <path d="M 500 190 L 560 190" stroke="#94a3b8" stroke-width="3" marker-end="url(#arrowhead)" />
          
          <!-- Database -->
          <g>
            <rect x="560" y="150" width="120" height="80" rx="10" fill="#f59e0b" />
            <text x="620" y="185" text-anchor="middle" fill="white" font-size="14" font-weight="bold">Database</text>
            <text x="620" y="205" text-anchor="middle" fill="white" font-size="12">AES-256</text>
            <text x="620" y="220" text-anchor="middle" fill="white" font-size="10">🔐 Encrypted</text>
          </g>
          
          <!-- Research Branch (Optional) -->
          <path d="M 620 230 L 620 300 L 440 300" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrowhead)" />
          <g>
            <rect x="320" y="270" width="120" height="60" rx="10" fill="#ec4899" />
            <text x="380" y="295" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Research</text>
            <text x="380" y="315" text-anchor="middle" fill="white" font-size="10">(With Consent)</text>
          </g>
          
          <!-- Arrow marker definition -->
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>
        </svg>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div class="border-l-4 border-green-500 bg-green-50 p-4 rounded">
            <h3 class="font-semibold text-green-800 mb-2">
              <i class="fas fa-lock mr-2"></i>In Transit
            </h3>
            <p class="text-sm text-green-700">All data encrypted with TLS 1.3 during transmission</p>
          </div>
          
          <div class="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
            <h3 class="font-semibold text-orange-800 mb-2">
              <i class="fas fa-database mr-2"></i>At Rest
            </h3>
            <p class="text-sm text-orange-700">Data encrypted with AES-256 in database</p>
          </div>
          
          <div class="border-l-4 border-pink-500 bg-pink-50 p-4 rounded">
            <h3 class="font-semibold text-pink-800 mb-2">
              <i class="fas fa-user-secret mr-2"></i>Research
            </h3>
            <p class="text-sm text-pink-700">Only with explicit consent, fully anonymized</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Your Rights -->
    <div id="your-rights" class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">
        <i class="fas fa-balance-scale text-green-600 mr-2"></i>
        Your Data Privacy Rights
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="border border-green-200 rounded-lg p-5">
          <div class="flex items-center mb-3">
            <i class="fas fa-eye text-2xl text-green-600 mr-3"></i>
            <h3 class="text-lg font-semibold text-gray-800">Right to Access</h3>
          </div>
          <p class="text-gray-600 mb-3">You can view all data we have about you at any time.</p>
          <a href="/privacy-center" class="text-green-600 hover:text-green-700 font-medium text-sm">
            View Your Data →
          </a>
        </div>
        
        <div class="border border-blue-200 rounded-lg p-5">
          <div class="flex items-center mb-3">
            <i class="fas fa-download text-2xl text-blue-600 mr-3"></i>
            <h3 class="text-lg font-semibold text-gray-800">Right to Export</h3>
          </div>
          <p class="text-gray-600 mb-3">Download all your data in machine-readable format.</p>
          <a href="/privacy-center" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Export Data →
          </a>
        </div>
        
        <div class="border border-red-200 rounded-lg p-5">
          <div class="flex items-center mb-3">
            <i class="fas fa-trash text-2xl text-red-600 mr-3"></i>
            <h3 class="text-lg font-semibold text-gray-800">Right to Delete</h3>
          </div>
          <p class="text-gray-600 mb-3">Permanently delete your account and all associated data.</p>
          <a href="/privacy-center" class="text-red-600 hover:text-red-700 font-medium text-sm">
            Delete Account →
          </a>
        </div>
        
        <div class="border border-purple-200 rounded-lg p-5">
          <div class="flex items-center mb-3">
            <i class="fas fa-user-shield text-2xl text-purple-600 mr-3"></i>
            <h3 class="text-lg font-semibold text-gray-800">Right to Revoke</h3>
          </div>
          <p class="text-gray-600 mb-3">Withdraw consent for research or data processing anytime.</p>
          <a href="/research-center" class="text-purple-600 hover:text-purple-700 font-medium text-sm">
            Manage Consents →
          </a>
        </div>
      </div>
    </div>
    
    <!-- Security Measures -->
    <div id="security" class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">
        <i class="fas fa-shield-alt text-purple-600 mr-2"></i>
        How We Protect Your Data
      </h2>
      
      <div class="space-y-4">
        <div class="flex items-start">
          <div class="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-lock text-xl text-purple-600"></i>
          </div>
          <div>
            <h3 class="font-semibold text-gray-800 mb-1">End-to-End Encryption</h3>
            <p class="text-gray-600">All data encrypted with TLS 1.3 in transit and AES-256 at rest</p>
          </div>
        </div>
        
        <div class="flex items-start">
          <div class="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-clipboard-check text-xl text-blue-600"></i>
          </div>
          <div>
            <h3 class="font-semibold text-gray-800 mb-1">Audit Logging</h3>
            <p class="text-gray-600">Every access to sensitive data is logged and monitored</p>
          </div>
        </div>
        
        <div class="flex items-start">
          <div class="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-user-lock text-xl text-green-600"></i>
          </div>
          <div>
            <h3 class="font-semibold text-gray-800 mb-1">Access Control</h3>
            <p class="text-gray-600">Role-based access ensures only authorized personnel can access data</p>
          </div>
        </div>
        
        <div class="flex items-start">
          <div class="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-shield text-xl text-orange-600"></i>
          </div>
          <div>
            <h3 class="font-semibold text-gray-800 mb-1">Regular Security Audits</h3>
            <p class="text-gray-600">Continuous monitoring and vulnerability scanning</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Compliance Standards -->
    <div id="compliance" class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">
        <i class="fas fa-certificate text-orange-600 mr-2"></i>
        Compliance & Standards
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="border-2 border-orange-300 rounded-lg p-5 text-center">
          <i class="fas fa-hospital text-4xl text-orange-600 mb-3"></i>
          <h3 class="text-lg font-bold text-gray-800 mb-2">HIPAA Ready</h3>
          <p class="text-sm text-gray-600">
            Health Insurance Portability and Accountability Act compliance for healthcare data
          </p>
          <a href="/hipaa-compliance" class="inline-block mt-3 text-orange-600 hover:text-orange-700 font-medium text-sm">
            View HIPAA Dashboard →
          </a>
        </div>
        
        <div class="border-2 border-blue-300 rounded-lg p-5 text-center">
          <i class="fas fa-flag text-4xl text-blue-600 mb-3"></i>
          <h3 class="text-lg font-bold text-gray-800 mb-2">GDPR Compliant</h3>
          <p class="text-sm text-gray-600">
            General Data Protection Regulation compliance for European users
          </p>
          <div class="mt-3 text-sm text-gray-600">
            ✓ Right to Access<br>
            ✓ Right to Erasure<br>
            ✓ Data Portability
          </div>
        </div>
        
        <div class="border-2 border-purple-300 rounded-lg p-5 text-center">
          <i class="fas fa-code text-4xl text-purple-600 mb-3"></i>
          <h3 class="text-lg font-bold text-gray-800 mb-2">SOC 2 Type II</h3>
          <p class="text-sm text-gray-600">
            Service Organization Control standards for data security and availability
          </p>
          <a href="/security-monitoring" class="inline-block mt-3 text-purple-600 hover:text-purple-700 font-medium text-sm">
            Security Dashboard →
          </a>
        </div>
      </div>
    </div>
    
    <!-- Plain Language Privacy Policy -->
    <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 p-6 rounded-lg shadow mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">
        <i class="fas fa-book-open text-indigo-600 mr-2"></i>
        Privacy Policy in Plain English
      </h2>
      
      <div class="space-y-4 text-gray-700">
        <div>
          <h3 class="font-semibold text-gray-800 mb-2">What We Collect</h3>
          <p>We collect mood entries, health metrics, and activity logs that YOU choose to share. We never collect data without your knowledge.</p>
        </div>
        
        <div>
          <h3 class="font-semibold text-gray-800 mb-2">How We Use It</h3>
          <p>Your data powers your personal dashboard, AI insights, and wellness recommendations. It's for YOU, not us.</p>
        </div>
        
        <div>
          <h3 class="font-semibold text-gray-800 mb-2">Who We Share With</h3>
          <p>We DON'T sell your data. Research sharing is optional, requires consent, and is fully anonymized.</p>
        </div>
        
        <div>
          <h3 class="font-semibold text-gray-800 mb-2">How Long We Keep It</h3>
          <p>Forever, until you delete it. You're in control. Delete anytime from Privacy Center.</p>
        </div>
        
        <div>
          <h3 class="font-semibold text-gray-800 mb-2">Questions?</h3>
          <p>Contact our privacy team: <a href="mailto:privacy@moodmash.win" class="text-indigo-600 hover:underline">privacy@moodmash.win</a></p>
        </div>
      </div>
    </div>
    
    <!-- Resources -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">
        <i class="fas fa-link text-blue-600 mr-2"></i>
        Additional Resources
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/privacy-center" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          <i class="fas fa-user-shield text-2xl text-blue-600 mr-3"></i>
          <div>
            <h3 class="font-semibold text-gray-800">Privacy Center</h3>
            <p class="text-sm text-gray-600">Manage your data & privacy settings</p>
          </div>
        </a>
        
        <a href="/hipaa-compliance" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          <i class="fas fa-hospital text-2xl text-orange-600 mr-3"></i>
          <div>
            <h3 class="font-semibold text-gray-800">HIPAA Dashboard</h3>
            <p class="text-sm text-gray-600">View compliance status</p>
          </div>
        </a>
        
        <a href="/security-monitoring" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          <i class="fas fa-shield-alt text-2xl text-purple-600 mr-3"></i>
          <div>
            <h3 class="font-semibold text-gray-800">Security Monitoring</h3>
            <p class="text-sm text-gray-600">Real-time security dashboard</p>
          </div>
        </a>
        
        <a href="/research-center" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          <i class="fas fa-flask text-2xl text-green-600 mr-3"></i>
          <div>
            <h3 class="font-semibold text-gray-800">Research Center</h3>
            <p class="text-sm text-gray-600">Manage research consents</p>
          </div>
        </a>
      </div>
    </div>
  `;
}

// ============================================================================
// HELPERS
// ============================================================================

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ============================================================================
// INIT ON PAGE LOAD
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrivacyEducation);
} else {
  initPrivacyEducation();
}
