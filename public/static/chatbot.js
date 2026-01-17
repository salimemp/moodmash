// AI Chatbot - Mood
(function() {
  'use strict';
  
  // State
  let currentConversationId = null;
  let currentLanguage = localStorage.getItem('moodmash_language') || 'en';
  let ttsEnabled = false;
  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];
  let recordingTimer = null;
  let recordingSeconds = 0;
  
  // Elements
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const voiceBtn = document.getElementById('voice-btn');
  const ttsToggle = document.getElementById('tts-toggle');
  const ttsStatus = document.getElementById('tts-status');
  const typingIndicator = document.getElementById('typing-indicator');
  const conversationsList = document.getElementById('conversations-list');
  const newChatBtn = document.getElementById('new-chat-btn');
  const voiceModal = document.getElementById('voice-modal');
  const stopRecording = document.getElementById('stop-recording');
  const cancelRecording = document.getElementById('cancel-recording');
  const voiceTimer = document.getElementById('voice-timer');
  const languageBtn = document.getElementById('language-btn');
  const languageModal = document.getElementById('language-modal');
  const languageOptions = document.getElementById('language-options');
  const closeLanguageModal = document.getElementById('close-language-modal');
  const messagesUsed = document.getElementById('messages-used');
  const messagesLimit = document.getElementById('messages-limit');
  
  // Initialize
  async function init() {
    await loadConversations();
    await loadUsage();
    setupEventListeners();
    setupAccessibility();
  }
  
  function setupEventListeners() {
    // Chat form submission
    chatForm.addEventListener('submit', handleSendMessage);
    
    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });
    
    // Keyboard shortcuts
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
    
    // Voice button
    voiceBtn.addEventListener('click', startVoiceRecording);
    stopRecording.addEventListener('click', stopVoiceRecording);
    cancelRecording.addEventListener('click', cancelVoiceRecording);
    
    // TTS toggle
    ttsToggle.addEventListener('click', toggleTTS);
    
    // New chat button
    newChatBtn.addEventListener('click', startNewChat);
    
    // Language modal
    languageBtn.addEventListener('click', () => {
      languageModal.classList.remove('hidden');
      languageModal.classList.add('flex');
    });
    
    closeLanguageModal.addEventListener('click', () => {
      languageModal.classList.add('hidden');
      languageModal.classList.remove('flex');
    });
    
    languageOptions.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        currentLanguage = btn.dataset.lang;
        localStorage.setItem('moodmash_language', currentLanguage);
        document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
        languageModal.classList.add('hidden');
        languageModal.classList.remove('flex');
      });
    });
    
    // Close modal on outside click
    languageModal.addEventListener('click', (e) => {
      if (e.target === languageModal) {
        languageModal.classList.add('hidden');
        languageModal.classList.remove('flex');
      }
    });
  }
  
  function setupAccessibility() {
    // Focus management
    chatInput.setAttribute('aria-describedby', 'usage-info');
    
    // Escape key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        voiceModal.classList.add('hidden');
        languageModal.classList.add('hidden');
        languageModal.classList.remove('flex');
      }
    });
  }
  
  async function loadConversations() {
    try {
      const res = await fetch('/api/chatbot/conversations');
      const data = await res.json();
      
      if (data.success && data.conversations?.length) {
        data.conversations.forEach(conv => {
          const btn = document.createElement('button');
          btn.className = 'px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg whitespace-nowrap flex-shrink-0 truncate max-w-[200px]';
          btn.textContent = conv.title || 'Conversation';
          btn.onclick = () => loadConversation(conv.id);
          conversationsList.appendChild(btn);
        });
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }
  
  async function loadConversation(conversationId) {
    currentConversationId = conversationId;
    
    try {
      const res = await fetch(`/api/chatbot/messages/${conversationId}`);
      const data = await res.json();
      
      if (data.success) {
        chatMessages.innerHTML = '';
        data.messages.forEach(msg => appendMessage(msg.role, msg.content));
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }
  
  async function loadUsage() {
    try {
      const res = await fetch('/api/subscription/usage');
      const data = await res.json();
      
      if (data.success) {
        messagesUsed.textContent = data.usage.ai_messages.used;
        const limit = data.usage.ai_messages.limit;
        messagesLimit.textContent = limit === -1 ? '∞' : limit;
      }
    } catch (error) {
      console.error('Failed to load usage:', error);
    }
  }
  
  async function handleSendMessage(e) {
    e.preventDefault();
    
    const content = chatInput.value.trim();
    if (!content) return;
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Add user message
    appendMessage('user', content);
    
    // Show typing indicator
    typingIndicator.classList.remove('hidden');
    typingIndicator.classList.add('flex');
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Disable input while processing
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    try {
      const res = await fetch('/api/chatbot/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversationId,
          content,
          language: currentLanguage
        })
      });
      
      const data = await res.json();
      
      // Hide typing indicator
      typingIndicator.classList.add('hidden');
      typingIndicator.classList.remove('flex');
      
      if (data.success) {
        currentConversationId = data.conversationId;
        appendMessage('assistant', data.message.content);
        
        // Update usage
        const used = parseInt(messagesUsed.textContent) + 1;
        messagesUsed.textContent = used;
        
        // TTS if enabled
        if (ttsEnabled) {
          speakText(data.message.content);
        }
      } else if (data.upgrade) {
        appendMessage('assistant', data.message);
      } else {
        appendMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      typingIndicator.classList.add('hidden');
      typingIndicator.classList.remove('flex');
      appendMessage('assistant', 'Sorry, I couldn\'t connect. Please try again.');
    }
    
    // Re-enable input
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function appendMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex gap-3' + (role === 'user' ? ' justify-end' : '');
    msgDiv.setAttribute('role', 'article');
    
    if (role === 'user') {
      msgDiv.innerHTML = `
        <div class="bg-purple-600 rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
          <p>${escapeHtml(content)}</p>
        </div>
        <div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">👤</div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">🌟</div>
        <div class="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
          <p>${formatMessage(content)}</p>
          <button class="text-xs text-gray-400 hover:text-white mt-2" onclick="window.speakText('${escapeHtml(content).replace(/'/g, "\\'")}')" aria-label="Read aloud">
            🔊 Read aloud
          </button>
        </div>
      `;
    }
    
    chatMessages.appendChild(msgDiv);
  }
  
  function formatMessage(content) {
    // Basic markdown-like formatting
    return escapeHtml(content)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function startNewChat() {
    currentConversationId = null;
    chatMessages.innerHTML = `
      <div class="flex gap-3">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">🌟</div>
        <div class="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
          <p>Hi there! I'm Mood, your supportive AI companion. 🌟</p>
          <p class="mt-2">I'm here to listen, help you understand your emotions, and offer support. How are you feeling today?</p>
        </div>
      </div>
    `;
    chatInput.focus();
  }
  
  // Voice Recording
  async function startVoiceRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processVoiceInput(audioBlob);
      };
      
      mediaRecorder.start();
      isRecording = true;
      recordingSeconds = 0;
      
      // Show modal
      voiceModal.classList.remove('hidden');
      voiceModal.classList.add('flex');
      
      // Start timer
      recordingTimer = setInterval(() => {
        recordingSeconds++;
        const mins = Math.floor(recordingSeconds / 60).toString().padStart(2, '0');
        const secs = (recordingSeconds % 60).toString().padStart(2, '0');
        voiceTimer.textContent = `${mins}:${secs}`;
      }, 1000);
      
    } catch (error) {
      alert('Microphone access denied. Please enable microphone permissions.');
    }
  }
  
  function stopVoiceRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      clearInterval(recordingTimer);
      voiceModal.classList.add('hidden');
      voiceModal.classList.remove('flex');
    }
  }
  
  function cancelVoiceRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      clearInterval(recordingTimer);
      audioChunks = [];
      voiceModal.classList.add('hidden');
      voiceModal.classList.remove('flex');
    }
  }
  
  async function processVoiceInput(audioBlob) {
    if (audioChunks.length === 0) return;
    
    // Show processing state
    chatInput.placeholder = 'Processing voice...';
    chatInput.disabled = true;
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', currentLanguage);
      
      const res = await fetch('/api/voice/speech-to-text', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (data.success && data.text) {
        chatInput.value = data.text;
        chatInput.disabled = false;
        chatInput.placeholder = 'Type your message...';
        chatInput.focus();
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      chatInput.placeholder = 'Type your message...';
      chatInput.disabled = false;
      alert('Voice processing failed. Please try again or type your message.');
    }
  }
  
  // Text-to-Speech
  function toggleTTS() {
    ttsEnabled = !ttsEnabled;
    ttsStatus.textContent = ttsEnabled ? 'TTS On' : 'TTS Off';
    ttsToggle.classList.toggle('text-purple-400', ttsEnabled);
  }
  
  window.speakText = function(text) {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLanguage === 'ar' ? 'ar-SA' : 
                       currentLanguage === 'es' ? 'es-ES' :
                       currentLanguage === 'fr' ? 'fr-FR' :
                       currentLanguage === 'de' ? 'de-DE' : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      speechSynthesis.speak(utterance);
    }
  };
  
  function speakText(text) {
    window.speakText(text);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
