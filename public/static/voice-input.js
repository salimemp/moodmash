/**
 * Voice Input Manager (v1.0)
 * 
 * Features:
 * - Web Speech API integration
 * - Continuous and single-use recording
 * - Mood recognition from voice
 * - Voice commands
 * - Multi-language support
 * - Error handling and fallbacks
 */

class VoiceInputManager {
  constructor(options = {}) {
    this.options = {
      lang: options.lang || 'en-US',
      continuous: options.continuous || false,
      interimResults: options.interimResults || true,
      maxAlternatives: options.maxAlternatives || 1,
      onResult: options.onResult || (() => {}),
      onError: options.onError || (() => {}),
      onStart: options.onStart || (() => {}),
      onEnd: options.onEnd || (() => {}),
      ...options,
    }

    this.recognition = null
    this.isRecording = false
    this.transcript = ''
    
    this.init()
  }

  /**
   * Initialize speech recognition
   */
  init() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.error('[VoiceInput] Speech Recognition not supported in this browser')
      this.showError('Voice input is not supported in your browser. Please try Chrome, Edge, or Safari.')
      return
    }

    // Create recognition instance
    this.recognition = new SpeechRecognition()
    this.recognition.lang = this.options.lang
    this.recognition.continuous = this.options.continuous
    this.recognition.interimResults = this.options.interimResults
    this.recognition.maxAlternatives = this.options.maxAlternatives

    // Set up event listeners
    this.setupEventListeners()

    console.log('[VoiceInput] Voice Input Manager initialized')
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isRecording = true
      this.transcript = ''
      this.options.onStart()
      console.log('[VoiceInput] Recording started')
    }

    this.recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      this.transcript = finalTranscript || interimTranscript

      this.options.onResult({
        transcript: this.transcript,
        isFinal: finalTranscript.length > 0,
        interimTranscript,
        finalTranscript,
      })

      console.log('[VoiceInput] Transcript:', this.transcript)
    }

    this.recognition.onerror = (event) => {
      console.error('[VoiceInput] Error:', event.error)
      
      const errorMessages = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Microphone not found or not working.',
        'not-allowed': 'Microphone access denied. Please allow microphone access.',
        'network': 'Network error occurred. Please check your connection.',
        'aborted': 'Speech recognition was aborted.',
      }

      const message = errorMessages[event.error] || `An error occurred: ${event.error}`
      this.options.onError(event.error, message)
      this.showError(message)
    }

    this.recognition.onend = () => {
      this.isRecording = false
      this.options.onEnd()
      console.log('[VoiceInput] Recording ended')
    }
  }

  /**
   * Start recording
   */
  start() {
    if (!this.recognition) {
      this.showError('Speech recognition not available')
      return
    }

    if (this.isRecording) {
      console.warn('[VoiceInput] Already recording')
      return
    }

    try {
      this.recognition.start()
    } catch (error) {
      console.error('[VoiceInput] Failed to start:', error)
      this.showError('Failed to start recording. Please try again.')
    }
  }

  /**
   * Stop recording
   */
  stop() {
    if (!this.recognition) return

    if (!this.isRecording) {
      console.warn('[VoiceInput] Not recording')
      return
    }

    try {
      this.recognition.stop()
    } catch (error) {
      console.error('[VoiceInput] Failed to stop:', error)
    }
  }

  /**
   * Toggle recording
   */
  toggle() {
    if (this.isRecording) {
      this.stop()
    } else {
      this.start()
    }
  }

  /**
   * Change language
   */
  setLanguage(lang) {
    this.options.lang = lang
    if (this.recognition) {
      this.recognition.lang = lang
    }
  }

  /**
   * Analyze mood from transcript
   */
  analyzeMood(transcript) {
    const text = transcript.toLowerCase()

    // Mood keywords
    const moodKeywords = {
      'Excited': ['excited', 'thrilled', 'energetic', 'pumped', 'enthusiastic'],
      'Happy': ['happy', 'good', 'great', 'wonderful', 'amazing', 'fantastic', 'joyful'],
      'Content': ['content', 'satisfied', 'peaceful', 'calm', 'relaxed', 'okay'],
      'Neutral': ['neutral', 'fine', 'normal', 'alright', 'meh'],
      'Sad': ['sad', 'down', 'unhappy', 'depressed', 'blue', 'upset', 'disappointed'],
      'Anxious': ['anxious', 'worried', 'nervous', 'stressed', 'tense', 'uneasy'],
      'Angry': ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated'],
    }

    // Find matching mood
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return mood
        }
      }
    }

    return null
  }

  /**
   * Process voice command
   */
  processCommand(transcript) {
    const text = transcript.toLowerCase().trim()

    // Log mood command
    if (text.startsWith('log mood') || text.startsWith('i feel') || text.startsWith('i\'m feeling')) {
      const mood = this.analyzeMood(text)
      
      if (mood) {
        return {
          type: 'log_mood',
          mood: mood,
          text: transcript,
        }
      }
    }

    // View stats command
    if (text.includes('show stats') || text.includes('view stats') || text.includes('my stats')) {
      return {
        type: 'view_stats',
      }
    }

    // Navigate commands
    if (text.includes('go to') || text.includes('open')) {
      if (text.includes('dashboard')) {
        return { type: 'navigate', page: '/' }
      }
      if (text.includes('log')) {
        return { type: 'navigate', page: '/log' }
      }
      if (text.includes('insights')) {
        return { type: 'navigate', page: '/insights' }
      }
      if (text.includes('activities')) {
        return { type: 'navigate', page: '/activities' }
      }
    }

    // No command matched
    return {
      type: 'text',
      text: transcript,
    }
  }

  /**
   * Get transcript
   */
  getTranscript() {
    return this.transcript
  }

  /**
   * Clear transcript
   */
  clearTranscript() {
    this.transcript = ''
  }

  /**
   * Check if recording
   */
  isActive() {
    return this.isRecording
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-MX', name: 'Spanish (Mexico)' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'ar-SA', name: 'Arabic' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ru-RU', name: 'Russian' },
    ]
  }

  /**
   * Check browser support
   */
  static isSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'voice-error-toast fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
    errorDiv.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
      </div>
    `
    
    document.body.appendChild(errorDiv)
    
    setTimeout(() => {
      errorDiv.remove()
    }, 5000)
  }

  /**
   * Create voice input button
   */
  static createButton(options = {}) {
    const button = document.createElement('button')
    button.className = options.className || 'voice-input-btn'
    button.innerHTML = `
      <i class="fas fa-microphone"></i>
      <span class="voice-status">Tap to speak</span>
    `
    
    const manager = new VoiceInputManager({
      onStart: () => {
        button.classList.add('recording')
        button.querySelector('.voice-status').textContent = 'Listening...'
        button.querySelector('i').className = 'fas fa-microphone-alt'
        if (options.onStart) options.onStart()
      },
      onEnd: () => {
        button.classList.remove('recording')
        button.querySelector('.voice-status').textContent = 'Tap to speak'
        button.querySelector('i').className = 'fas fa-microphone'
        if (options.onEnd) options.onEnd()
      },
      onResult: (result) => {
        if (result.isFinal) {
          button.querySelector('.voice-status').textContent = result.transcript
        }
        if (options.onResult) options.onResult(result)
      },
      onError: (error, message) => {
        button.classList.remove('recording')
        if (options.onError) options.onError(error, message)
      },
    })
    
    button.addEventListener('click', () => {
      manager.toggle()
    })
    
    return { button, manager }
  }
}

// Add CSS styles
const style = document.createElement('style')
style.textContent = `
  .voice-input-btn {
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }
  
  .voice-input-btn:hover {
    background: #4f46e5;
    transform: scale(1.05);
  }
  
  .voice-input-btn.recording {
    background: #ef4444;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  .voice-status {
    font-size: 0.875rem;
  }
  
  .voice-error-toast {
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
`
document.head.appendChild(style)

// Expose to window
window.VoiceInputManager = VoiceInputManager

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceInputManager
}

console.log('[VoiceInput] Voice Input Manager loaded')
