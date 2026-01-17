// Subscription Page
(function() {
  'use strict';
  
  async function init() {
    await loadUsage();
    await loadCurrentSubscription();
  }
  
  async function loadUsage() {
    try {
      const res = await fetch('/api/subscription/usage');
      const data = await res.json();
      
      if (data.success) {
        const u = data.usage;
        document.getElementById('moods-used').textContent = `${u.moods.used}/${u.moods.limit === -1 ? '∞' : u.moods.limit}`;
        document.getElementById('friends-used').textContent = `${u.friends.used}/${u.friends.limit === -1 ? '∞' : u.friends.limit}`;
        document.getElementById('groups-used').textContent = `${u.groups.used}/${u.groups.limit === -1 ? '∞' : u.groups.limit}`;
        document.getElementById('voice-used').textContent = `${u.voice_journals.used}/${u.voice_journals.limit === -1 ? '∞' : u.voice_journals.limit}`;
        document.getElementById('ai-used').textContent = `${u.ai_messages.used}/${u.ai_messages.limit === -1 ? '∞' : u.ai_messages.limit}`;
      }
    } catch (error) {
      console.error('Failed to load usage:', error);
    }
  }
  
  async function loadCurrentSubscription() {
    try {
      const res = await fetch('/api/subscription/current');
      const data = await res.json();
      
      if (data.success) {
        const tier = data.subscription.tier_id;
        // Update UI to show current plan
        const cards = document.querySelectorAll('#pricing-cards > div');
        cards.forEach((card, index) => {
          const btn = card.querySelector('button');
          if ((index === 0 && tier === 'free') ||
              (index === 1 && tier === 'pro') ||
              (index === 2 && tier === 'premium')) {
            btn.textContent = 'Current Plan';
            btn.disabled = true;
            btn.className = 'w-full py-3 bg-gray-700 rounded-lg cursor-not-allowed';
          }
        });
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  }
  
  window.selectPlan = function(plan) {
    // In a real app, this would redirect to a payment page
    alert(`Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)} coming soon! 🚀\n\nPayment processing is not yet implemented. Stay tuned!`);
  };
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
