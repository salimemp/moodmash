// Legal Pages (Privacy, Terms, Cookies)
(function() {
  'use strict';
  
  let isSpeaking = false;
  let utterance = null;
  
  async function init() {
    const path = window.location.pathname;
    let type = 'privacy';
    
    if (path.includes('terms')) type = 'terms';
    else if (path.includes('cookies')) type = 'cookies';
    
    await loadDocument(type);
    setupReadAloud();
  }
  
  async function loadDocument(type) {
    const container = document.getElementById(type + '-content') || 
                      document.querySelector('article');
    
    if (!container) return;
    
    try {
      const res = await fetch(`/api/legal/${type}`);
      const data = await res.json();
      
      if (data.success && data.document) {
        // Convert markdown to HTML
        const html = markdownToHtml(data.document.content);
        container.innerHTML = html;
      }
    } catch (error) {
      container.innerHTML = '<p class="text-red-400">Failed to load document. Please try again.</p>';
    }
  }
  
  function markdownToHtml(markdown) {
    return markdown
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6">$1</h1>')
      .replace(/^\*\*(.*)\*\*$/gim, '<p class="text-sm text-gray-400 mb-4">$1</p>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^---$/gim, '<hr class="my-8 border-gray-700">')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  }
  
  function setupReadAloud() {
    const btn = document.getElementById('read-aloud-btn');
    if (!btn) return;
    
    btn.addEventListener('click', toggleReadAloud);
  }
  
  function toggleReadAloud() {
    const btn = document.getElementById('read-aloud-btn');
    
    if (isSpeaking) {
      speechSynthesis.cancel();
      isSpeaking = false;
      btn.innerHTML = '🔊';
      btn.setAttribute('aria-label', 'Read aloud');
    } else {
      const content = document.querySelector('article')?.textContent || '';
      
      if ('speechSynthesis' in window) {
        utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        
        utterance.onend = () => {
          isSpeaking = false;
          btn.innerHTML = '🔊';
          btn.setAttribute('aria-label', 'Read aloud');
        };
        
        speechSynthesis.speak(utterance);
        isSpeaking = true;
        btn.innerHTML = '⏹️';
        btn.setAttribute('aria-label', 'Stop reading');
      }
    }
  }
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
