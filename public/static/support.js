// Configure axios to send cookies with all requests
if (typeof axios !== 'undefined') { axios.defaults.withCredentials = true; }

/**
 * Support Resources - Frontend
 * Crisis hotlines, therapy finders, self-help guides
 * Version: 9.0.0
 */

console.log('[Support Resources] Initializing...');

let resources = [];

async function init() {
  console.log('[Support Resources] Starting...');
  await loadResources();
  renderSupportPage();
  console.log('[Support Resources] Ready!');
}

async function loadResources() {
  try {
    const response = await axios.get('/api/support/resources');
    if (response.data.success) {
      resources = response.data.data;
      console.log('[Support Resources] Loaded:', resources.length);
    }
  } catch (error) {
    console.error('[Support Resources] Error:', error);
  }
}

function renderSupportPage() {
  const container = document.getElementById('app');
  if (!container) return;
  
  const hotlines = resources.filter(r => r.type === 'crisis_hotline');
  const therapyFinders = resources.filter(r => r.type === 'therapy_finder');
  const selfHelp = resources.filter(r => r.type === 'self_help_guide');
  const breathing = resources.filter(r => r.type === 'breathing_exercise');
  
  container.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">
          <i class="fas fa-hands-helping mr-2 text-red-500"></i>
          Support Resources
        </h1>
        <p class="text-gray-600">Find help, support, and guidance for your mental wellness</p>
      </div>
      
      <!-- Emergency Banner -->
      <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8">
        <h2 class="text-xl font-bold text-red-800 mb-2">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          In Crisis? Get Immediate Help
        </h2>
        <p class="text-red-700 mb-4">
          If you're in immediate danger or having thoughts of suicide, please contact emergency services or a crisis hotline right now.
        </p>
        <div class="flex flex-wrap gap-3">
          <a href="tel:988" class="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700">
            <i class="fas fa-phone mr-2"></i>Call 988 (USA)
          </a>
          <a href="tel:911" class="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700">
            <i class="fas fa-ambulance mr-2"></i>Call 911 (Emergency)
          </a>
        </div>
      </div>
      
      <!-- Crisis Hotlines -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-phone-volume mr-2 text-green-500"></i>
          Crisis Hotlines (24/7)
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${hotlines.map(h => `
            <div class="p-4 border rounded-lg hover:shadow-md transition">
              <h3 class="font-bold text-lg text-gray-800 mb-1">${h.title}</h3>
              <p class="text-sm text-gray-600 mb-2">${h.description}</p>
              <div class="text-lg font-bold text-green-600 mb-1">
                <i class="fas fa-phone mr-2"></i>${h.phone}
              </div>
              ${h.url ? `<a href="${h.url}" target="_blank" class="text-blue-600 text-sm hover:underline">Visit Website →</a>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Therapy Finders -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-user-md mr-2 text-blue-500"></i>
          Find a Therapist
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${therapyFinders.map(t => `
            <a href="${t.url}" target="_blank" class="p-4 border rounded-lg hover:shadow-md transition block">
              <h3 class="font-bold text-lg text-gray-800 mb-1">${t.title}</h3>
              <p class="text-sm text-gray-600 mb-2">${t.description}</p>
              <span class="text-blue-600 text-sm">Visit →</span>
            </a>
          `).join('')}
        </div>
      </div>
      
      <!-- Self-Help -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-book-open mr-2 text-purple-500"></i>
          Self-Help Guides
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${selfHelp.map(s => `
            <a href="${s.url}" target="_blank" class="p-4 border rounded-lg hover:shadow-md transition block">
              <h3 class="font-bold text-lg text-gray-800 mb-1">${s.title}</h3>
              <p class="text-sm text-gray-600">${s.description}</p>
            </a>
          `).join('')}
        </div>
      </div>
      
      <!-- Breathing Exercises -->
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-wind mr-2 text-cyan-500"></i>
          Quick Breathing Exercises
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${breathing.map(b => `
            <div class="bg-white p-4 rounded-lg">
              <h3 class="font-bold text-lg text-gray-800 mb-2">${b.title}</h3>
              <p class="text-sm text-gray-600">${b.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
