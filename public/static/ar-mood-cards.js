/**
 * AR Mood Cards with AR.js
 * 
 * Marker-based AR for quick mood logging
 * 
 * Features:
 * - Scan printable mood cards
 * - Instant mood logging
 * - 3D animations on markers
 * - A-Frame + AR.js integration
 */

class ARMoodCards {
  constructor() {
    this.currentDetectedEmotion = null;
    this.lastLoggedTime = 0;
    this.cooldownPeriod = 3000; // 3 seconds cooldown
  }

  /**
   * Initialize AR.js scene
   */
  initializeARScene() {
    // Scene is created via A-Frame in HTML
    // This method handles event listeners

    const markers = document.querySelectorAll('a-marker');
    
    markers.forEach((marker, index) => {
      marker.addEventListener('markerFound', () => {
        this.onMarkerFound(marker.getAttribute('data-emotion'));
      });

      marker.addEventListener('markerLost', () => {
        this.onMarkerLost();
      });
    });
  }

  /**
   * Handle marker detected
   */
  onMarkerFound(emotion) {
    this.currentDetectedEmotion = emotion;
    
    // Show detection notification
    this.showDetectionUI(emotion);
    
    // Auto-log mood after 2 seconds of continuous detection
    setTimeout(() => {
      if (this.currentDetectedEmotion === emotion) {
        this.logMood(emotion);
      }
    }, 2000);
  }

  /**
   * Handle marker lost
   */
  onMarkerLost() {
    this.currentDetectedEmotion = null;
    this.hideDetectionUI();
  }

  /**
   * Log mood entry
   */
  async logMood(emotion) {
    // Check cooldown
    const now = Date.now();
    if (now - this.lastLoggedTime < this.cooldownPeriod) {
      return;
    }

    this.lastLoggedTime = now;

    try {
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotion: emotion,
          intensity: 7, // Default intensity for card-based logging
          timestamp: new Date().toISOString(),
          logged_via: 'ar_card'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to log mood');
      }

      const result = await response.json();
      
      // Show success animation
      this.showSuccessAnimation(emotion);
      this.showNotification(`${this.capitalizeFirst(emotion)} mood logged!`, 'success');
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      
    } catch (error) {
      console.error('Error logging mood:', error);
      this.showNotification('Failed to log mood', 'error');
    }
  }

  /**
   * Show detection UI
   */
  showDetectionUI(emotion) {
    const detectionUI = document.getElementById('ar-detection-ui');
    if (detectionUI) {
      const emotionEmoji = this.getEmotionEmoji(emotion);
      detectionUI.innerHTML = `
        <div class="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg text-center">
          <div class="text-6xl mb-2">${emotionEmoji}</div>
          <h3 class="text-xl font-bold text-gray-800 mb-1">
            ${this.capitalizeFirst(emotion)}
          </h3>
          <p class="text-sm text-gray-600">Hold steady to log mood...</p>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div class="bg-purple-600 h-2 rounded-full animate-progress" style="width: 0%"></div>
          </div>
        </div>
      `;
      detectionUI.style.display = 'block';

      // Animate progress bar
      const progressBar = detectionUI.querySelector('.animate-progress');
      let width = 0;
      const interval = setInterval(() => {
        if (width >= 100) {
          clearInterval(interval);
        } else {
          width += 5;
          progressBar.style.width = width + '%';
        }
      }, 100);
    }
  }

  /**
   * Hide detection UI
   */
  hideDetectionUI() {
    const detectionUI = document.getElementById('ar-detection-ui');
    if (detectionUI) {
      detectionUI.style.display = 'none';
    }
  }

  /**
   * Show success animation
   */
  showSuccessAnimation(emotion) {
    const successUI = document.getElementById('ar-success-ui');
    if (successUI) {
      const emotionEmoji = this.getEmotionEmoji(emotion);
      successUI.innerHTML = `
        <div class="bg-green-500 text-white rounded-lg p-6 shadow-lg text-center animate-bounce">
          <div class="text-7xl mb-2">${emotionEmoji}</div>
          <h3 class="text-2xl font-bold mb-1">Mood Logged!</h3>
          <p class="text-sm">${this.capitalizeFirst(emotion)}</p>
        </div>
      `;
      successUI.style.display = 'block';

      setTimeout(() => {
        successUI.style.display = 'none';
      }, 2000);
    }
  }

  /**
   * Get emotion emoji
   */
  getEmotionEmoji(emotion) {
    const emojiMap = {
      'happy': '😊',
      'sad': '😢',
      'anxious': '😰',
      'calm': '😌',
      'energetic': '⚡',
      'tired': '😴',
      'angry': '😠',
      'excited': '🎉',
      'content': '🙂',
      'stressed': '😓'
    };
    return emojiMap[emotion] || '😐';
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
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

  /**
   * Utility: Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate printable mood cards
   */
  generatePrintableCards() {
    const emotions = [
      'happy', 'sad', 'anxious', 'calm', 'energetic',
      'tired', 'angry', 'excited', 'content', 'stressed'
    ];

    const cardsHTML = emotions.map((emotion, index) => {
      const emoji = this.getEmotionEmoji(emotion);
      const color = this.getEmotionColor(emotion);
      
      return `
        <div class="mood-card" style="background-color: ${color};">
          <div class="mood-card-content">
            <div class="mood-emoji">${emoji}</div>
            <h3 class="mood-title">${this.capitalizeFirst(emotion)}</h3>
            <div class="mood-marker">
              <img src="/api/ar-markers/${emotion}.png" alt="${emotion} marker" />
            </div>
            <p class="mood-instructions">Scan with MoodMash AR</p>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MoodMash AR Mood Cards</title>
        <style>
          @media print {
            body { margin: 0; }
            .mood-card { page-break-inside: avoid; }
          }
          
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          
          .cards-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          
          .mood-card {
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          
          .mood-emoji {
            font-size: 48px;
            margin-bottom: 10px;
          }
          
          .mood-title {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
            color: #333;
          }
          
          .mood-marker {
            margin: 15px 0;
          }
          
          .mood-marker img {
            width: 100px;
            height: 100px;
            border: 2px solid #333;
          }
          
          .mood-instructions {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
          }
          
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #7C3AED;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          }
          
          @media print {
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print Cards</button>
        <h1 style="text-align: center; color: #7C3AED;">MoodMash AR Mood Cards</h1>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">
          Print these cards and scan them with the MoodMash AR feature to instantly log your mood!
        </p>
        <div class="cards-container">
          ${cardsHTML}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get emotion color
   */
  getEmotionColor(emotion) {
    const colorMap = {
      'happy': '#FFD700',
      'sad': '#4169E1',
      'anxious': '#FF4500',
      'calm': '#32CD32',
      'energetic': '#FF69B4',
      'tired': '#708090',
      'angry': '#FF0000',
      'excited': '#FF8C00',
      'content': '#87CEEB',
      'stressed': '#8B0000'
    };
    return colorMap[emotion] || '#CCCCCC';
  }
}

// Global instance
let arMoodCards;

/**
 * Initialize AR Mood Cards
 */
function initARMoodCards() {
  arMoodCards = new ARMoodCards();
  arMoodCards.initializeARScene();
}

/**
 * Download printable cards
 */
function downloadPrintableCards() {
  if (!arMoodCards) {
    arMoodCards = new ARMoodCards();
  }

  const cardsHTML = arMoodCards.generatePrintableCards();
  const blob = new Blob([cardsHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'moodmash-ar-cards.html';
  a.click();
  URL.revokeObjectURL(url);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if on AR page
    if (document.querySelector('a-scene')) {
      initARMoodCards();
    }
  });
} else {
  if (document.querySelector('a-scene')) {
    initARMoodCards();
  }
}
