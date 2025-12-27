/**
 * Voice Journaling Feature
 * 
 * Features:
 * - Record voice journals
 * - Web Speech API transcription
 * - Audio recording and playback
 * - AI analysis integration
 * - Save to R2 storage
 */

class VoiceJournal {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recognition = null;
    this.transcript = '';
    this.audioBlob = null;
    
    this.initSpeechRecognition();
  }

  /**
   * Initialize Web Speech API
   */
  initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      this.transcript = finalTranscript || interimTranscript;
      this.updateTranscriptDisplay();
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        this.showNotification('No speech detected. Please try again.', 'warning');
      }
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        // Restart if still recording
        this.recognition.start();
      }
    };
  }

  /**
   * Start recording voice journal
   */
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.createAudioPlayback();
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      
      // Start transcription
      if (this.recognition) {
        this.recognition.start();
      }
      
      this.isRecording = true;
      this.updateRecordingUI(true);
      this.showNotification('Recording started. Speak freely...', 'success');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      this.showNotification('Microphone access denied. Please allow microphone access.', 'error');
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.recognition) {
      this.recognition.stop();
    }

    this.isRecording = false;
    this.updateRecordingUI(false);
    this.showNotification('Recording stopped. Processing...', 'info');
  }

  /**
   * Create audio playback element
   */
  createAudioPlayback() {
    const audioUrl = URL.createObjectURL(this.audioBlob);
    const audioPlayer = document.getElementById('voice-playback');
    
    if (audioPlayer) {
      audioPlayer.src = audioUrl;
      audioPlayer.style.display = 'block';
      audioPlayer.controls = true;
    }
  }

  /**
   * Save voice journal to backend
   */
  async saveVoiceJournal() {
    if (!this.audioBlob || !this.transcript) {
      this.showNotification('Please record a voice journal first.', 'warning');
      return;
    }

    try {
      // Upload audio to R2
      const formData = new FormData();
      formData.append('audio', this.audioBlob, 'voice-journal.webm');
      formData.append('transcript', this.transcript);
      formData.append('duration', Math.floor(this.audioBlob.size / 1000)); // Approximate duration

      const response = await fetch('/api/voice-journal', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to save voice journal');
      }

      const result = await response.json();
      this.showNotification('Voice journal saved successfully!', 'success');
      
      // Analyze with AI
      await this.analyzeVoiceJournal(result.id);
      
      // Reset form
      this.resetForm();
      
    } catch (error) {
      console.error('Error saving voice journal:', error);
      this.showNotification('Failed to save voice journal. Please try again.', 'error');
    }
  }

  /**
   * Analyze voice journal with Gemini AI
   */
  async analyzeVoiceJournal(journalId) {
    try {
      const response = await fetch('/api/ai/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: this.transcript,
          journalId: journalId
        })
      });

      if (!response.ok) {
        throw new Error('AI analysis failed');
      }

      const analysis = await response.json();
      this.displayAIAnalysis(analysis);
      
    } catch (error) {
      console.error('Error analyzing voice journal:', error);
    }
  }

  /**
   * Display AI analysis results
   */
  displayAIAnalysis(analysis) {
    const analysisContainer = document.getElementById('ai-analysis-results');
    if (!analysisContainer) return;

    const html = `
      <div class="bg-white rounded-lg shadow-lg p-6 mt-4">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-brain text-purple-600 mr-2"></i>
          AI Analysis
        </h3>
        
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-gray-700">Emotional Tone</h4>
            <div class="flex items-center mt-2">
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" 
                     style="width: ${analysis.sentiment * 100}%"></div>
              </div>
              <span class="ml-3 text-sm font-medium text-gray-600">
                ${(analysis.sentiment * 100).toFixed(0)}% Positive
              </span>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-gray-700">Detected Emotions</h4>
            <div class="flex flex-wrap gap-2 mt-2">
              ${analysis.emotions.map(emotion => `
                <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  ${emotion}
                </span>
              `).join('')}
            </div>
          </div>

          ${analysis.triggers && analysis.triggers.length > 0 ? `
            <div>
              <h4 class="font-semibold text-gray-700">Key Triggers</h4>
              <ul class="mt-2 space-y-1">
                ${analysis.triggers.map(trigger => `
                  <li class="text-gray-600">• ${trigger}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <div>
            <h4 class="font-semibold text-gray-700">AI Insights</h4>
            <p class="text-gray-600 mt-2">${analysis.insights}</p>
          </div>

          ${analysis.recommendations && analysis.recommendations.length > 0 ? `
            <div>
              <h4 class="font-semibold text-gray-700">Recommendations</h4>
              <ul class="mt-2 space-y-2">
                ${analysis.recommendations.map(rec => `
                  <li class="flex items-start">
                    <i class="fas fa-lightbulb text-yellow-500 mr-2 mt-1"></i>
                    <span class="text-gray-600">${rec}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    analysisContainer.innerHTML = html;
  }

  /**
   * Update transcript display
   */
  updateTranscriptDisplay() {
    const transcriptElement = document.getElementById('voice-transcript');
    if (transcriptElement) {
      transcriptElement.value = this.transcript;
      transcriptElement.style.display = 'block';
    }
  }

  /**
   * Update recording UI
   */
  updateRecordingUI(isRecording) {
    const recordBtn = document.getElementById('voice-record-btn');
    const stopBtn = document.getElementById('voice-stop-btn');
    const saveBtn = document.getElementById('voice-save-btn');
    const statusIndicator = document.getElementById('recording-status');

    if (recordBtn) {
      recordBtn.disabled = isRecording;
      recordBtn.style.display = isRecording ? 'none' : 'block';
    }

    if (stopBtn) {
      stopBtn.disabled = !isRecording;
      stopBtn.style.display = isRecording ? 'block' : 'none';
    }

    if (saveBtn) {
      saveBtn.style.display = !isRecording && this.audioBlob ? 'block' : 'none';
    }

    if (statusIndicator) {
      statusIndicator.style.display = isRecording ? 'flex' : 'none';
    }
  }

  /**
   * Reset form
   */
  resetForm() {
    this.transcript = '';
    this.audioBlob = null;
    this.audioChunks = [];
    
    const transcriptElement = document.getElementById('voice-transcript');
    if (transcriptElement) {
      transcriptElement.value = '';
      transcriptElement.style.display = 'none';
    }

    const audioPlayer = document.getElementById('voice-playback');
    if (audioPlayer) {
      audioPlayer.style.display = 'none';
      audioPlayer.src = '';
    }

    const analysisContainer = document.getElementById('ai-analysis-results');
    if (analysisContainer) {
      analysisContainer.innerHTML = '';
    }

    this.updateRecordingUI(false);
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
}

// Initialize voice journal when DOM is ready
let voiceJournal;

document.addEventListener('DOMContentLoaded', () => {
  // Check if on voice journal page
  if (document.getElementById('voice-journal-container')) {
    voiceJournal = new VoiceJournal();

    // Bind event listeners
    const recordBtn = document.getElementById('voice-record-btn');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => voiceJournal.startRecording());
    }

    const stopBtn = document.getElementById('voice-stop-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => voiceJournal.stopRecording());
    }

    const saveBtn = document.getElementById('voice-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => voiceJournal.saveVoiceJournal());
    }

    const resetBtn = document.getElementById('voice-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => voiceJournal.resetForm());
    }
  }
});
