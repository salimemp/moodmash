/**
 * MoodMash Landing Page
 * Version: 10.2 (Mobile-Optimized)
 * 
 * Mobile-first landing page with call-to-action
 */

document.addEventListener('DOMContentLoaded', () => {
  renderLandingPage();
  initializeAnimations();
  handleInstallPrompt();
});

function renderLandingPage() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <!-- Hero Section -->
    <div class="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <!-- Navigation -->
      <nav class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fas fa-heart text-white text-3xl"></i>
            <span class="text-white text-2xl font-bold">MoodMash</span>
          </div>
          <div class="flex items-center space-x-4">
            <a href="/login" class="text-white hover:text-gray-200 font-medium">
              Log In
            </a>
            <a href="/register" class="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Sign Up Free
            </a>
          </div>
        </div>
      </nav>

      <!-- Hero Content -->
      <div class="container mx-auto px-4 py-16 md:py-24">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Track Your Mood.<br/>
            Transform Your Life.
          </h1>
          <p class="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands using AI-powered insights to understand, manage, and improve their mental wellness.
          </p>
          
          <div class="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a href="/register" class="w-full sm:w-auto bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg">
              <i class="fas fa-rocket mr-2"></i>
              Start Free Today
            </a>
            <a href="#features" class="w-full sm:w-auto bg-purple-700/30 backdrop-blur text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-purple-700/40 transition-all border-2 border-white/30">
              <i class="fas fa-play-circle mr-2"></i>
              Learn More
            </a>
          </div>

          <p class="text-white/80 mt-6 text-sm">
            ✨ No credit card required • 🔒 Your data is private • 💯 Free forever plan
          </p>
        </div>

        <!-- Hero Image/Animation -->
        <div class="mt-16 max-w-5xl mx-auto">
          <div class="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-white text-center">
              <div class="p-4">
                <i class="fas fa-smile text-5xl mb-2"></i>
                <p class="font-semibold">Track Moods</p>
              </div>
              <div class="p-4">
                <i class="fas fa-brain text-5xl mb-2"></i>
                <p class="font-semibold">AI Insights</p>
              </div>
              <div class="p-4">
                <i class="fas fa-users text-5xl mb-2"></i>
                <p class="font-semibold">Community</p>
              </div>
              <div class="p-4">
                <i class="fas fa-chart-line text-5xl mb-2"></i>
                <p class="font-semibold">Analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div id="features" class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Everything You Need to Thrive
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features to help you understand and improve your mental wellness
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <!-- Feature Cards -->
          ${renderFeatureCard('🎯', 'Smart Mood Tracking', 'Log your emotions in seconds with our intuitive interface. Track patterns over time.')}
          ${renderFeatureCard('🤖', 'AI-Powered Insights', 'Get personalized recommendations powered by Gemini AI based on your mood patterns.')}
          ${renderFeatureCard('📊', 'Advanced Analytics', 'Visualize your emotional journey with beautiful charts and detailed reports.')}
          ${renderFeatureCard('💊', 'Health Integration', 'Track sleep, exercise, and other health metrics to see the complete picture.')}
          ${renderFeatureCard('👥', 'Social Support', 'Connect with a supportive community. Share experiences and find encouragement.')}
          ${renderFeatureCard('🎓', 'Wellness Resources', 'Access expert tips, guided exercises, and mental health resources.')}
        </div>
      </div>
    </div>

    <!-- Social Proof -->
    <div class="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-800 mb-4">
            Trusted by Thousands
          </h2>
          <p class="text-xl text-gray-600">
            Join our growing community of mental wellness champions
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          ${renderTestimonial('Sarah M.', 'Life-changing app', 'MoodMash helped me identify triggers I never knew existed. My anxiety has decreased significantly.', '⭐⭐⭐⭐⭐')}
          ${renderTestimonial('David L.', 'Simple yet powerful', 'The AI insights are spot-on. It\'s like having a therapist in my pocket.', '⭐⭐⭐⭐⭐')}
          ${renderTestimonial('Emily R.', 'Love the community', 'The social features make me feel less alone in my mental health journey.', '⭐⭐⭐⭐⭐')}
        </div>
      </div>
    </div>

    <!-- Pricing Section -->
    <div class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Choose Your Plan
          </h2>
          <p class="text-xl text-gray-600">
            Start free, upgrade anytime. No commitments.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          ${renderPricingCard('Free', '$0', 'forever', ['50 mood entries/month', 'Basic insights', 'Wellness tips', 'Community access'], false)}
          ${renderPricingCard('Basic', '$4.99', '/month', ['200 mood entries/month', 'Advanced analytics', 'Health metrics', 'Social feed', 'Data export'], false)}
          ${renderPricingCard('Premium', '$9.99', '/month', ['Unlimited everything', 'AI insights (Gemini)', 'Mood groups', 'Priority support', 'Research participation'], true)}
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Start Your Journey?
        </h2>
        <p class="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join MoodMash today and take control of your mental wellness.
        </p>
        <a href="/register" class="inline-block bg-white text-purple-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg">
          Get Started Free
        </a>
        <p class="text-white/80 mt-4">
          No credit card required • Start in 30 seconds
        </p>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div class="flex items-center space-x-2 mb-4">
              <i class="fas fa-heart text-2xl"></i>
              <span class="text-xl font-bold">MoodMash</span>
            </div>
            <p class="text-gray-400">
              Your journey to better mental wellness starts here.
            </p>
          </div>
          
          <div>
            <h3 class="font-bold mb-4">Product</h3>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#features" class="hover:text-white">Features</a></li>
              <li><a href="/subscription" class="hover:text-white">Pricing</a></li>
              <li><a href="/about" class="hover:text-white">About</a></li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-bold mb-4">Resources</h3>
            <ul class="space-y-2 text-gray-400">
              <li><a href="/support" class="hover:text-white">Support</a></li>
              <li><a href="/privacy-policy" class="hover:text-white">Privacy</a></li>
              <li><a href="/terms-of-service" class="hover:text-white">Terms</a></li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-bold mb-4">Connect</h3>
            <div class="flex space-x-4">
              <a href="#" class="text-2xl hover:text-purple-400"><i class="fab fa-twitter"></i></a>
              <a href="#" class="text-2xl hover:text-purple-400"><i class="fab fa-facebook"></i></a>
              <a href="#" class="text-2xl hover:text-purple-400"><i class="fab fa-instagram"></i></a>
            </div>
          </div>
        </div>
        
        <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 MoodMash. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}

function renderFeatureCard(icon, title, description) {
  return `
    <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      <div class="text-5xl mb-4">${icon}</div>
      <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
      <p class="text-gray-600">${description}</p>
    </div>
  `;
}

function renderTestimonial(name, title, quote, rating) {
  return `
    <div class="bg-white p-8 rounded-2xl shadow-lg">
      <div class="text-2xl mb-4">${rating}</div>
      <p class="text-gray-700 mb-4 italic">"${quote}"</p>
      <div class="font-bold text-gray-800">${name}</div>
      <div class="text-sm text-gray-600">${title}</div>
    </div>
  `;
}

function renderPricingCard(plan, price, period, features, isPopular) {
  return `
    <div class="bg-white p-8 rounded-2xl shadow-lg ${isPopular ? 'ring-4 ring-purple-600 transform scale-105' : 'border border-gray-200'}">
      ${isPopular ? '<div class="bg-purple-600 text-white text-center py-2 -mt-8 -mx-8 mb-6 rounded-t-2xl font-bold">MOST POPULAR</div>' : ''}
      <div class="text-center mb-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-2">${plan}</h3>
        <div class="flex items-baseline justify-center">
          <span class="text-4xl font-bold text-gray-800">${price}</span>
          <span class="text-gray-600 ml-2">${period}</span>
        </div>
      </div>
      <ul class="space-y-3 mb-8">
        ${features.map(f => `
          <li class="flex items-start">
            <i class="fas fa-check text-green-600 mr-2 mt-1"></i>
            <span class="text-gray-700">${f}</span>
          </li>
        `).join('')}
      </ul>
      <a href="/register" class="block w-full text-center ${isPopular ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-6 py-3 rounded-full font-semibold transition-colors">
        Get Started
      </a>
    </div>
  `;
}

function initializeAnimations() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Fade in animation on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.container > div').forEach(el => {
    observer.observe(el);
  });
}

function handleInstallPrompt() {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install button
    const installBtn = document.createElement('button');
    installBtn.className = 'fixed bottom-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-purple-700 z-50';
    installBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Install App';
    installBtn.onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === 'accepted') {
          installBtn.remove();
        }
      }
    };
    document.body.appendChild(installBtn);
  });
}
