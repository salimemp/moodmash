// Voice Journal Frontend
(function() {
  let mediaRecorder = null;
  let audioChunks = [];
  let recordingStartTime = null;
  let timerInterval = null;
  let recognition = null;
  let fullTranscript = '';

  const recordBtn = document.getElementById('record-btn');
  const statusEl = document.getElementById('status');
  const timerEl = document.getElementById('timer');
  const transcriptArea = document.getElementById('transcript-area');
  const transcriptEl = document.getElementById('transcript');
  const titleArea = document.getElementById('title-area');
  const titleEl = document.getElementById('title');
  const saveBtn = document.getElementById('save-btn');
  const entriesEl = document.getElementById('entries');

  // Initialize
  loadEntries();
  setupSpeechRecognition();

  // Record button click
  recordBtn.addEventListener('click', toggleRecording);

  // Save button click
  saveBtn.addEventListener('click', saveEntry);

  function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            fullTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        transcriptEl.value = fullTranscript + interimTranscript;
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          statusEl.textContent = 'Speech recognition error: ' + event.error;
        }
      };
    }
  }

  async function toggleRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      fullTranscript = '';
      transcriptEl.value = '';

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      recordingStartTime = Date.now();

      // Start speech recognition
      if (recognition) {
        recognition.start();
      }

      // Update UI
      recordBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
      recordBtn.classList.add('bg-gray-600', 'animate-pulse');
      recordBtn.innerHTML = '<svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>';
      statusEl.textContent = 'Recording... Click to stop';
      timerEl.classList.remove('hidden');
      transcriptArea.classList.remove('hidden');

      // Start timer
      timerInterval = setInterval(updateTimer, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      statusEl.textContent = 'Error: ' + (err.message || 'Could not access microphone');
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }

    if (recognition) {
      recognition.stop();
    }

    clearInterval(timerInterval);

    // Update UI
    recordBtn.classList.remove('bg-gray-600', 'animate-pulse');
    recordBtn.classList.add('bg-red-600', 'hover:bg-red-700');
    recordBtn.innerHTML = '<svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>';
    statusEl.textContent = 'Recording stopped. Edit transcript and save.';
    titleArea.classList.remove('hidden');
    saveBtn.classList.remove('hidden');
  }

  function updateTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    timerEl.textContent = `${minutes}:${seconds}`;
  }

  async function saveEntry() {
    const transcript = transcriptEl.value.trim();
    const title = titleEl.value.trim();

    if (!transcript && audioChunks.length === 0) {
      alert('Please record something first');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      // Convert audio to base64 (for small recordings)
      let audioData = null;
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        if (audioBlob.size < 1024 * 1024) { // Less than 1MB
          audioData = await blobToBase64(audioBlob);
        }
      }

      const duration = recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0;

      const response = await fetch('/api/voice-journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          transcript: transcript || null,
          audio_data: audioData,
          duration_seconds: duration
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      // Reset form
      transcriptEl.value = '';
      titleEl.value = '';
      timerEl.textContent = '00:00';
      timerEl.classList.add('hidden');
      transcriptArea.classList.add('hidden');
      titleArea.classList.add('hidden');
      saveBtn.classList.add('hidden');
      statusEl.textContent = 'Saved! Click to start a new recording.';
      audioChunks = [];
      fullTranscript = '';
      recordingStartTime = null;

      // Reload entries
      loadEntries();

    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save entry. Please try again.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Journal Entry';
    }
  }

  async function loadEntries() {
    try {
      const response = await fetch('/api/voice-journals?limit=10');
      const data = await response.json();

      if (data.journals && data.journals.length > 0) {
        entriesEl.innerHTML = data.journals.map(j => `
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold">${escapeHtml(j.title || 'Untitled')}</h3>
              <span class="text-sm text-gray-400">${formatDate(j.created_at)}</span>
            </div>
            ${j.transcript ? `<p class="text-gray-300 text-sm mb-2">${escapeHtml(j.transcript.substring(0, 200))}${j.transcript.length > 200 ? '...' : ''}</p>` : ''}
            <div class="flex gap-2 text-sm">
              ${j.emotion_detected ? `<span class="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">${j.emotion_detected}</span>` : ''}
              ${j.duration_seconds ? `<span class="text-gray-400">${Math.floor(j.duration_seconds / 60)}:${(j.duration_seconds % 60).toString().padStart(2, '0')}</span>` : ''}
            </div>
          </div>
        `).join('');
      } else {
        entriesEl.innerHTML = '<p class="text-gray-400">No voice journal entries yet. Start recording!</p>';
      }
    } catch (err) {
      console.error('Error loading entries:', err);
      entriesEl.innerHTML = '<p class="text-red-400">Failed to load entries</p>';
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
})();
