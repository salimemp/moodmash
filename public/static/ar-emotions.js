/**
 * AR Emotion Visualization
 * 
 * Uses WebXR Device API + Three.js to display emotions as 3D objects in AR
 * 
 * Features:
 * - WebXR AR session management
 * - 3D emotion orbs with colors representing different emotions
 * - Interactive tap-to-view details
 * - Real-time mood data integration
 */

class AREmotionVisualizer {
  constructor() {
    this.xrSession = null;
    this.xrRefSpace = null;
    this.gl = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.emotionOrbs = [];
    this.isARSupported = false;
    
    this.emotionColors = {
      'happy': 0xFFD700,      // Yellow
      'sad': 0x4169E1,        // Blue
      'anxious': 0xFF4500,    // Red-Orange
      'calm': 0x32CD32,       // Green
      'energetic': 0xFF69B4,  // Hot Pink
      'tired': 0x708090,      // Slate Gray
      'angry': 0xFF0000,      // Red
      'excited': 0xFF8C00,    // Dark Orange
      'content': 0x87CEEB,    // Sky Blue
      'stressed': 0x8B0000    // Dark Red
    };
  }

  /**
   * Check if WebXR AR is supported
   */
  async checkARSupport() {
    if (!navigator.xr) {
      console.log('WebXR not supported');
      return false;
    }

    try {
      this.isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
      return this.isARSupported;
    } catch (error) {
      console.error('Error checking AR support:', error);
      return false;
    }
  }

  /**
   * Initialize Three.js scene
   */
  initThreeJS(canvas) {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      preserveDrawingBuffer: true,
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    this.scene.add(directionalLight);
  }

  /**
   * Start AR session
   */
  async startARSession(canvas) {
    if (!this.isARSupported) {
      throw new Error('AR not supported on this device');
    }

    try {
      // Request XR session
      this.xrSession = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['dom-overlay', 'hit-test'],
        domOverlay: { root: document.getElementById('ar-overlay') }
      });

      // Initialize Three.js if not already done
      if (!this.scene) {
        this.initThreeJS(canvas);
      }

      // Set up WebGL context
      await this.gl.makeXRCompatible();
      this.renderer.xr.setSession(this.xrSession);

      // Get reference space
      this.xrRefSpace = await this.xrSession.requestReferenceSpace('local');

      // Handle session end
      this.xrSession.addEventListener('end', () => {
        this.onARSessionEnd();
      });

      // Load mood data and create orbs
      await this.loadMoodData();

      // Start render loop
      this.renderer.setAnimationLoop(this.render.bind(this));

      return true;
    } catch (error) {
      console.error('Error starting AR session:', error);
      throw error;
    }
  }

  /**
   * Load mood data from API
   */
  async loadMoodData() {
    try {
      const response = await fetch('/api/mood?limit=20');
      if (!response.ok) throw new Error('Failed to fetch mood data');

      const moods = await response.json();
      
      // Create orbs for each mood
      moods.forEach((mood, index) => {
        this.createMoodOrb(mood, index);
      });
    } catch (error) {
      console.error('Error loading mood data:', error);
    }
  }

  /**
   * Create 3D mood orb
   */
  createMoodOrb(mood, index) {
    const color = this.emotionColors[mood.emotion] || 0xFFFFFF;
    const size = 0.05 + (mood.intensity / 10) * 0.15; // Size based on intensity (0.05-0.2m)

    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    
    // Create material with glow effect
    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    });

    const orb = new THREE.Mesh(geometry, material);

    // Position orbs in a circle around the user
    const angle = (index / 20) * Math.PI * 2;
    const radius = 1.5; // 1.5 meters from user
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 1.5 - (index * 0.05); // Stagger vertically

    orb.position.set(x, y, z);

    // Store mood data in orb
    orb.userData = {
      moodId: mood.id,
      emotion: mood.emotion,
      intensity: mood.intensity,
      timestamp: mood.timestamp,
      note: mood.note
    };

    // Add animation
    orb.userData.baseY = y;
    orb.userData.animationOffset = index * 0.5;

    this.scene.add(orb);
    this.emotionOrbs.push(orb);
  }

  /**
   * Render loop
   */
  render(time, frame) {
    if (!frame) return;

    // Animate orbs (floating motion)
    this.emotionOrbs.forEach((orb) => {
      const offset = orb.userData.animationOffset;
      orb.position.y = orb.userData.baseY + Math.sin(time * 0.001 + offset) * 0.05;
      orb.rotation.y += 0.01;
    });

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle AR session end
   */
  onARSessionEnd() {
    this.xrSession = null;
    this.renderer.setAnimationLoop(null);
    
    // Clean up orbs
    this.emotionOrbs.forEach(orb => {
      this.scene.remove(orb);
      orb.geometry.dispose();
      orb.material.dispose();
    });
    this.emotionOrbs = [];
  }

  /**
   * Stop AR session
   */
  async stopARSession() {
    if (this.xrSession) {
      await this.xrSession.end();
    }
  }

  /**
   * Handle orb tap/click
   */
  onOrbTap(orb) {
    const moodData = orb.userData;
    
    // Show mood details in overlay
    const overlay = document.getElementById('ar-mood-details');
    if (overlay) {
      overlay.innerHTML = `
        <div class="bg-white rounded-lg p-4 shadow-lg">
          <h3 class="text-lg font-bold text-gray-800 mb-2">
            ${this.capitalizeFirst(moodData.emotion)}
          </h3>
          <p class="text-sm text-gray-600">
            Intensity: ${moodData.intensity}/10
          </p>
          <p class="text-sm text-gray-600">
            ${new Date(moodData.timestamp).toLocaleString()}
          </p>
          ${moodData.note ? `
            <p class="text-sm text-gray-700 mt-2 italic">
              "${moodData.note}"
            </p>
          ` : ''}
          <button onclick="closeARMoodDetails()" 
                  class="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
            Close
          </button>
        </div>
      `;
      overlay.style.display = 'block';
    }
  }

  /**
   * Utility: Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Global instance
let arVisualizer;

/**
 * Initialize AR Emotion Visualizer
 */
async function initAREmotions() {
  arVisualizer = new AREmotionVisualizer();
  
  const supported = await arVisualizer.checkARSupport();
  
  const startButton = document.getElementById('start-ar-emotions-btn');
  if (startButton) {
    if (supported) {
      startButton.disabled = false;
      startButton.textContent = 'View Emotions in AR';
    } else {
      startButton.disabled = true;
      startButton.textContent = 'AR Not Supported';
      showNotification('WebXR AR is not supported on this device', 'warning');
    }
  }
}

/**
 * Start AR emotions experience
 */
async function startAREmotions() {
  try {
    const canvas = document.getElementById('ar-canvas');
    if (!canvas) {
      throw new Error('AR canvas not found');
    }

    showNotification('Starting AR experience...', 'info');
    
    await arVisualizer.startARSession(canvas);
    
    // Show AR UI
    document.getElementById('ar-overlay').style.display = 'block';
    
  } catch (error) {
    console.error('Error starting AR emotions:', error);
    showNotification('Failed to start AR: ' + error.message, 'error');
  }
}

/**
 * Stop AR emotions experience
 */
async function stopAREmotions() {
  if (arVisualizer) {
    await arVisualizer.stopARSession();
    document.getElementById('ar-overlay').style.display = 'none';
    showNotification('AR session ended', 'info');
  }
}

/**
 * Close mood details overlay
 */
function closeARMoodDetails() {
  const overlay = document.getElementById('ar-mood-details');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
  } text-white`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAREmotions);
} else {
  initAREmotions();
}
