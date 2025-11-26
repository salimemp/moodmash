// Configure axios to send cookies with all requests
if (typeof axios !== 'undefined') { axios.defaults.withCredentials = true; }

// MoodMash AI Chat Assistant

let currentConversation = null;
let conversations = [];
let messages = [];

// Initialize
async function init() {
    console.log('[AI Chat] Initializing...');
    await loadConversations();
    renderChatInterface();
}

// Load user's conversations
async function loadConversations() {
    try {
        const response = await axios.get('/api/chat/conversations');
        conversations = response.data.conversations || [];
        console.log('[AI Chat] Loaded conversations:', conversations.length);
    } catch (error) {
        console.error('[AI Chat] Failed to load conversations:', error);
        conversations = [];
    }
}

// Create new conversation
async function createConversation() {
    try {
        const response = await axios.post('/api/chat/conversations', {
            title: 'New Chat'
        });
        
        const newConversation = response.data.conversation;
        conversations.unshift(newConversation);
        currentConversation = newConversation.id;
        messages = [];
        
        renderChatInterface();
        renderConversationsList();
    } catch (error) {
        console.error('[AI Chat] Failed to create conversation:', error);
        alert('Failed to create new chat');
    }
}

// Load messages for a conversation
async function loadMessages(conversationId) {
    try {
        const response = await axios.get(`/api/chat/conversations/${conversationId}/messages`);
        messages = response.data.messages || [];
        currentConversation = conversationId;
        renderMessages();
    } catch (error) {
        console.error('[AI Chat] Failed to load messages:', error);
        messages = [];
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // If no conversation, create one
    if (!currentConversation) {
        await createConversation();
    }
    
    // Clear input immediately
    input.value = '';
    
    // Add user message to UI
    const userMsg = {
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
    };
    messages.push(userMsg);
    renderMessages();
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await axios.post(`/api/chat/conversations/${currentConversation}/messages`, {
            message
        });
        
        // Remove typing indicator
        hideTypingIndicator();
        
        // Replace user message with server response (has ID)
        messages.pop();
        messages.push(response.data.userMessage);
        messages.push(response.data.assistantMessage);
        
        renderMessages();
        
        // Update conversation list
        await loadConversations();
        renderConversationsList();
    } catch (error) {
        console.error('[AI Chat] Failed to send message:', error);
        hideTypingIndicator();
        alert('Failed to send message. Please try again.');
    }
}

// Show typing indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('messagesContainer');
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'flex items-start space-x-3 mb-4';
    indicator.innerHTML = `
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <i class="fas fa-robot text-purple-600"></i>
        </div>
        <div class="flex-1 bg-gray-100 rounded-lg p-4">
            <div class="flex space-x-2">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// Render chat interface
function renderChatInterface() {
    const app = document.getElementById('app');
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
    
    app.innerHTML = `
        <div class="flex h-[calc(100vh-80px)] bg-gray-50">
            <!-- Sidebar -->
            <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div class="p-4 border-b border-gray-200">
                    <button 
                        onclick="createConversation()" 
                        class="w-full bg-purple-600 text-white rounded-lg py-3 px-4 hover:bg-purple-700 transition font-semibold flex items-center justify-center space-x-2"
                    >
                        <i class="fas fa-plus"></i>
                        <span>New Chat</span>
                    </button>
                </div>
                <div id="conversationsList" class="flex-1 overflow-y-auto p-4">
                    <!-- Conversations will be rendered here -->
                </div>
            </div>
            
            <!-- Main Chat Area -->
            <div class="flex-1 flex flex-col bg-white">
                <!-- Header -->
                <div class="border-b border-gray-200 p-4">
                    <h2 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-comments text-purple-600 mr-2"></i>
                        AI Chat Assistant
                    </h2>
                    <p class="text-gray-600 text-sm mt-1">Powered by Gemini AI</p>
                </div>
                
                <!-- Messages -->
                <div id="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4">
                    ${messages.length === 0 ? renderWelcomeMessage() : ''}
                </div>
                
                <!-- Input -->
                <div class="border-t border-gray-200 p-4 bg-gray-50">
                    <div class="flex space-x-4">
                        <input 
                            type="text" 
                            id="messageInput"
                            placeholder="Type your message..."
                            class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onkeypress="if(event.key === 'Enter') sendMessage()"
                        >
                        <button 
                            onclick="sendMessage()"
                            class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold flex items-center space-x-2"
                        >
                            <i class="fas fa-paper-plane"></i>
                            <span>Send</span>
                        </button>
                    </div>
                    <p class="text-gray-500 text-xs mt-2">
                        <i class="fas fa-info-circle"></i> AI responses are generated by Gemini and may not always be accurate.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    renderConversationsList();
    renderMessages();
}

// Render welcome message
function renderWelcomeMessage() {
    return `
        <div class="text-center py-12">
            <div class="inline-block p-6 bg-purple-100 rounded-full mb-4">
                <i class="fas fa-robot text-5xl text-purple-600"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">Welcome to AI Chat!</h3>
            <p class="text-gray-600 max-w-md mx-auto">
                I'm your MoodMash AI Assistant. I can help you with mood tracking, 
                provide emotional support, and answer your questions about mental wellness.
            </p>
            <p class="text-gray-500 text-sm mt-4">
                Start a conversation by typing a message below.
            </p>
        </div>
    `;
}

// Render conversations list
function renderConversationsList() {
    const container = document.getElementById('conversationsList');
    if (!container) return;
    
    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-comments text-4xl mb-2"></i>
                <p class="text-sm">No conversations yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = conversations.map(conv => `
        <div 
            onclick="loadMessages(${conv.id})"
            class="p-3 rounded-lg mb-2 cursor-pointer transition ${
                currentConversation === conv.id 
                    ? 'bg-purple-100 border-2 border-purple-500' 
                    : 'bg-gray-50 hover:bg-gray-100'
            }"
        >
            <div class="flex items-center justify-between">
                <h4 class="font-semibold text-gray-800 truncate">${conv.title || 'Untitled Chat'}</h4>
                <span class="text-xs text-gray-500">${conv.message_count || 0}</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
                ${new Date(conv.updated_at).toLocaleDateString()}
            </p>
        </div>
    `).join('');
}

// Render messages
function renderMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = renderWelcomeMessage();
        return;
    }
    
    container.innerHTML = messages.map(msg => {
        if (msg.role === 'user') {
            return `
                <div class="flex items-start justify-end space-x-3">
                    <div class="bg-purple-600 text-white rounded-lg p-4 max-w-2xl">
                        <p class="whitespace-pre-wrap">${escapeHtml(msg.content)}</p>
                    </div>
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                        <i class="fas fa-user text-white"></i>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <i class="fas fa-robot text-purple-600"></i>
                    </div>
                    <div class="flex-1 bg-gray-100 rounded-lg p-4 max-w-2xl">
                        <p class="whitespace-pre-wrap">${escapeHtml(msg.content)}</p>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
