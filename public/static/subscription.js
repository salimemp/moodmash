/**
 * MoodMash Subscription Management Dashboard
 * Version: 10.1 (Premium Features)
 * Features: Plan comparison, upgrade/downgrade, usage tracking, billing
 */

// ===== GLOBAL STATE =====
let currentSubscription = null;
let availablePlans = [];
let usageStats = null;

// ===== API HELPERS =====
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// ===== LOAD DATA =====
async function loadSubscriptionData() {
  try {
    // Load current subscription and usage
    const subData = await apiCall('/api/subscription?user_id=1');
    if (subData.success) {
      currentSubscription = subData.data.subscription;
      usageStats = subData.data.usage;
    }

    // Load available plans
    const plansData = await apiCall('/api/subscription/plans');
    if (plansData.success) {
      availablePlans = plansData.plans;
    }

    renderDashboard();
  } catch (error) {
    console.error('Failed to load subscription data:', error);
    document.getElementById('app').innerHTML = `
      <div class="text-center py-12">
        <p class="text-red-600">Failed to load subscription data</p>
      </div>
    `;
  }
}

// ===== UPGRADE/DOWNGRADE =====
async function subscribeToPlan(planId, billingCycle) {
  if (!confirm(`Are you sure you want to subscribe to this plan (${billingCycle})?`)) {
    return;
  }

  try {
    const result = await apiCall('/api/subscription/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        plan_id: planId,
        billing_cycle: billingCycle,
        payment_method: 'demo',
      }),
    });

    if (result.success) {
      alert('Subscription updated successfully! 🎉');
      await loadSubscriptionData();
    }
  } catch (error) {
    alert('Failed to update subscription. Please try again.');
  }
}

async function cancelSubscription() {
  if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
    return;
  }

  try {
    const result = await apiCall('/api/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ user_id: 1 }),
    });

    if (result.success) {
      alert('Subscription cancelled. You can continue using premium features until the end of your billing period.');
      await loadSubscriptionData();
    }
  } catch (error) {
    alert('Failed to cancel subscription. Please try again.');
  }
}

// ===== RENDER FUNCTIONS =====
function renderCurrentPlan() {
  if (!currentSubscription) {
    return '<p class="text-gray-500">Loading...</p>';
  }

  const plan = currentSubscription;
  const status = plan.status === 'active' ? 'Active' : plan.status === 'trial' ? 'Trial' : 'Inactive';
  const statusColor = plan.status === 'active' ? 'green' : plan.status === 'trial' ? 'blue' : 'gray';

  return `
    <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">${plan.plan_display_name} Plan</h2>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${statusColor}-100 text-${statusColor}-800 mt-2">
            ${status}
          </span>
        </div>
        <div class="text-right">
          <p class="text-gray-600">Billing Cycle</p>
          <p class="text-xl font-bold text-gray-800 capitalize">${plan.billing_cycle}</p>
        </div>
      </div>

      ${plan.end_date ? `
        <div class="bg-white rounded-lg p-4 mb-4">
          <p class="text-sm text-gray-600">Next billing date</p>
          <p class="text-lg font-semibold text-gray-800">${new Date(plan.end_date).toLocaleDateString()}</p>
        </div>
      ` : ''}

      <div class="flex items-center space-x-4">
        ${plan.plan_name !== 'free' ? `
          <button
            onclick="cancelSubscription()"
            class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancel Subscription
          </button>
        ` : ''}
        ${plan.plan_name !== 'enterprise' ? `
          <button
            onclick="document.getElementById('plans-section').scrollIntoView({ behavior: 'smooth' })"
            class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            ${plan.plan_name === 'free' ? 'Upgrade to Premium' : 'View Plans'}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function renderUsageStats() {
  if (!usageStats) {
    return '<p class="text-gray-500">Loading...</p>';
  }

  return `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Mood Tracking Usage -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">Mood Entries</h3>
          <i class="fas fa-smile text-2xl text-yellow-600"></i>
        </div>
        <div class="mb-4">
          <div class="flex items-baseline">
            <span class="text-3xl font-bold text-gray-800">${usageStats.moods.current}</span>
            <span class="text-gray-600 ml-2">/ ${usageStats.moods.limit === -1 ? '∞' : usageStats.moods.limit}</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">This month</p>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-yellow-600 h-2 rounded-full" style="width: ${usageStats.moods.limit === -1 ? 50 : (usageStats.moods.current / usageStats.moods.limit) * 100}%"></div>
        </div>
      </div>

      <!-- Groups Usage -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">Group Memberships</h3>
          <i class="fas fa-user-friends text-2xl text-purple-600"></i>
        </div>
        <div class="mb-4">
          <div class="flex items-baseline">
            <span class="text-3xl font-bold text-gray-800">${usageStats.groups.current}</span>
            <span class="text-gray-600 ml-2">/ ${usageStats.groups.limit === -1 ? '∞' : usageStats.groups.limit}</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Active groups</p>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-purple-600 h-2 rounded-full" style="width: ${usageStats.groups.limit === -1 ? 50 : (usageStats.groups.current / usageStats.groups.limit) * 100}%"></div>
        </div>
      </div>

      <!-- Friends Usage -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">Friend Connections</h3>
          <i class="fas fa-users text-2xl text-green-600"></i>
        </div>
        <div class="mb-4">
          <div class="flex items-baseline">
            <span class="text-3xl font-bold text-gray-800">${usageStats.friends.current}</span>
            <span class="text-gray-600 ml-2">/ ${usageStats.friends.limit === -1 ? '∞' : usageStats.friends.limit}</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Total friends</p>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-green-600 h-2 rounded-full" style="width: ${usageStats.friends.limit === -1 ? 50 : (usageStats.friends.current / usageStats.friends.limit) * 100}%"></div>
        </div>
      </div>
    </div>
  `;
}

function renderPlanCards() {
  return availablePlans
    .map(
      (plan) => {
        const isCurrent = currentSubscription?.plan_id === plan.id;
        const features = plan.features || [];

        return `
      <div class="bg-white rounded-lg shadow-lg overflow-hidden ${isCurrent ? 'ring-4 ring-purple-600' : ''}">
        ${plan.name === 'premium' ? `
          <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 font-bold">
            MOST POPULAR
          </div>
        ` : ''}
        
        <div class="p-8">
          <h3 class="text-2xl font-bold text-gray-800 mb-2">${plan.display_name}</h3>
          <p class="text-gray-600 mb-6">${plan.description || ''}</p>

          <div class="mb-6">
            <div class="flex items-baseline">
              <span class="text-4xl font-bold text-gray-800">$${plan.price_monthly.toFixed(2)}</span>
              <span class="text-gray-600 ml-2">/month</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">or $${plan.price_yearly.toFixed(2)}/year (save ${((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100).toFixed(0)}%)</p>
          </div>

          <div class="space-y-3 mb-8">
            ${features.map((feature) => `
              <div class="flex items-start">
                <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                <span class="text-gray-700">${getFeatureDisplayName(feature)}</span>
              </div>
            `).join('')}
          </div>

          ${isCurrent ? `
            <button class="w-full px-6 py-3 bg-gray-200 text-gray-600 font-semibold rounded-lg cursor-not-allowed">
              Current Plan
            </button>
          ` : `
            <div class="space-y-2">
              <button
                onclick="subscribeToPlan(${plan.id}, 'monthly')"
                class="w-full px-6 py-3 ${plan.name === 'premium' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'bg-gray-800 hover:bg-gray-900'} text-white font-semibold rounded-lg transition-all"
              >
                Subscribe Monthly
              </button>
              <button
                onclick="subscribeToPlan(${plan.id}, 'yearly')"
                class="w-full px-6 py-3 border-2 ${plan.name === 'premium' ? 'border-purple-600 text-purple-600 hover:bg-purple-50' : 'border-gray-800 text-gray-800 hover:bg-gray-50'} font-semibold rounded-lg transition-all"
              >
                Subscribe Yearly
              </button>
            </div>
          `}
        </div>
      </div>
    `;
      }
    )
    .join('');
}

function getFeatureDisplayName(featureId) {
  const names = {
    mood_tracking: 'Unlimited mood tracking',
    basic_insights: 'Basic insights & trends',
    wellness_tips: 'Personalized wellness tips',
    advanced_insights: 'Advanced analytics & reports',
    health_metrics: 'Health metrics tracking',
    data_export: 'Export your data',
    social_feed: 'Social feed & community',
    ai_insights: 'AI-powered insights (Gemini)',
    mood_groups: 'Mood-synchronized groups',
    research_data: 'Research participation',
    priority_support: 'Priority support 24/7',
    team_dashboard: 'Team management dashboard',
    api_access: 'Full API access',
    white_label: 'White label branding',
  };
  return names[featureId] || featureId;
}

// ===== MAIN DASHBOARD =====
function renderDashboard() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">
          <i class="fas fa-crown text-yellow-500 mr-2"></i>
          Subscription Management
        </h1>
        <p class="text-gray-600">Manage your plan, track usage, and unlock premium features</p>
      </div>

      <!-- Current Plan Section -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Current Plan</h2>
        ${renderCurrentPlan()}
      </div>

      <!-- Usage Stats Section -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Usage Statistics</h2>
        ${renderUsageStats()}
      </div>

      <!-- Available Plans Section -->
      <div id="plans-section" class="mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">Choose Your Plan</h2>
        <p class="text-gray-600 text-center mb-8">Select the perfect plan for your mental wellness journey</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${renderPlanCards()}
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Frequently Asked Questions</h2>
        
        <div class="space-y-4">
          <div class="border-b pb-4">
            <h3 class="font-bold text-gray-800 mb-2">Can I change my plan anytime?</h3>
            <p class="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your billing cycle.</p>
          </div>

          <div class="border-b pb-4">
            <h3 class="font-bold text-gray-800 mb-2">What happens if I exceed my limits?</h3>
            <p class="text-gray-600">If you reach your monthly limits on the Free or Basic plan, you'll be prompted to upgrade. Premium users have unlimited access to all features.</p>
          </div>

          <div class="border-b pb-4">
            <h3 class="font-bold text-gray-800 mb-2">Is there a free trial?</h3>
            <p class="text-gray-600">New users get 14 days of Premium features for free! No credit card required. Cancel anytime during the trial period.</p>
          </div>

          <div class="pb-4">
            <h3 class="font-bold text-gray-800 mb-2">How do I cancel my subscription?</h3>
            <p class="text-gray-600">You can cancel anytime from this page. You'll continue to have access to premium features until the end of your billing period.</p>
          </div>
        </div>
      </div>

      <!-- Payment Security -->
      <div class="mt-8 text-center text-gray-600">
        <p class="flex items-center justify-center">
          <i class="fas fa-lock mr-2"></i>
          Secure payment processing powered by Stripe
        </p>
        <p class="text-sm mt-2">Your payment information is encrypted and secure</p>
      </div>
    </div>
  `;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  loadSubscriptionData();
});
