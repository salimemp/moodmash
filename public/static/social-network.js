/**
 * Social Support Network
 * Connect with friends, send messages, join support groups
 */

class SocialNetwork {
  constructor() {
    this.connections = [];
    this.pendingRequests = [];
    this.messages = [];
    this.init();
  }

  async init() {
    this.render();
    await this.loadConnections();
    await this.loadPendingRequests();
  }

  render() {
    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-800 mb-4">
            <i class="fas fa-users text-purple-600"></i>
            Social Support Network
          </h1>
          <p class="text-gray-600 text-lg">
            Connect with friends and build your support network
          </p>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow-lg mb-8">
          <div class="flex border-b">
            <button onclick="socialNetwork.showTab('connections')" id="tab-connections" class="tab-button active flex-1 px-6 py-4 font-semibold text-purple-600 border-b-2 border-purple-600">
              <i class="fas fa-user-friends mr-2"></i>
              My Connections
            </button>
            <button onclick="socialNetwork.showTab('requests')" id="tab-requests" class="tab-button flex-1 px-6 py-4 font-semibold text-gray-600 hover:text-purple-600">
              <i class="fas fa-user-plus mr-2"></i>
              Requests <span id="requests-badge" class="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full hidden">0</span>
            </button>
            <button onclick="socialNetwork.showTab('messages')" id="tab-messages" class="tab-button flex-1 px-6 py-4 font-semibold text-gray-600 hover:text-purple-600">
              <i class="fas fa-comments mr-2"></i>
              Messages
            </button>
            <button onclick="socialNetwork.showTab('find')" id="tab-find" class="tab-button flex-1 px-6 py-4 font-semibold text-gray-600 hover:text-purple-600">
              <i class="fas fa-search mr-2"></i>
              Find People
            </button>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <!-- Connections Tab -->
            <div id="tab-content-connections" class="tab-content">
              <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Your Support Network</h3>
                <div id="connections-list" class="space-y-4">
                  <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
                    <p>Loading connections...</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Requests Tab -->
            <div id="tab-content-requests" class="tab-content hidden">
              <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Pending Requests</h3>
                <div id="requests-list" class="space-y-4">
                  <div class="text-center py-8 text-gray-500">
                    <p>No pending requests</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Messages Tab -->
            <div id="tab-content-messages" class="tab-content hidden">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Conversations List -->
                <div class="md:col-span-1 border-r">
                  <h3 class="text-lg font-bold text-gray-800 mb-4">Conversations</h3>
                  <div id="conversations-list" class="space-y-2">
                    <p class="text-gray-500 text-sm">Select a connection to start messaging</p>
                  </div>
                </div>

                <!-- Message Thread -->
                <div class="md:col-span-2">
                  <div id="message-thread" class="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4">
                    <div class="text-center text-gray-500 py-8">
                      <i class="fas fa-comments text-4xl mb-3"></i>
                      <p>Select a conversation to view messages</p>
                    </div>
                  </div>

                  <!-- Message Input -->
                  <div id="message-input-container" class="hidden">
                    <div class="flex gap-2">
                      <input type="text" id="message-input" placeholder="Type your message..." 
                        class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <button onclick="socialNetwork.sendMessage()" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Find People Tab -->
            <div id="tab-content-find" class="tab-content hidden">
              <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Find People</h3>
                <div class="mb-4">
                  <input type="text" id="search-users" placeholder="Search by username or email..." 
                    class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
                <div id="search-results" class="space-y-4">
                  <p class="text-gray-500 text-center py-8">Search for people to connect with</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Features Info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl mb-3">🤝</div>
            <h3 class="font-bold text-gray-800 mb-2">Build Your Network</h3>
            <p class="text-sm text-gray-600">Connect with friends, family, and supporters</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl mb-3">💬</div>
            <h3 class="font-bold text-gray-800 mb-2">Private Messaging</h3>
            <p class="text-sm text-gray-600">Chat securely with your connections</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl mb-3">🔒</div>
            <h3 class="font-bold text-gray-800 mb-2">Privacy First</h3>
            <p class="text-sm text-gray-600">Your conversations are private and secure</p>
          </div>
        </div>
      </div>
    `;
  }

  showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active', 'text-purple-600', 'border-purple-600', 'border-b-2');
      btn.classList.add('text-gray-600');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active', 'text-purple-600', 'border-purple-600', 'border-b-2');
    document.getElementById(`tab-${tabName}`).classList.remove('text-gray-600');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    document.getElementById(`tab-content-${tabName}`).classList.remove('hidden');
  }

  async loadConnections() {
    try {
      const response = await axios.get('/api/social/connections');

      // Handle both response formats: { success: true, connections: [] } and { connections: [] }
      this.connections = response.data.connections || response.data || [];
      this.renderConnections();
    } catch (error) {
      console.error('Failed to load connections:', error);
      // Clear loading state and show empty state
      this.connections = [];
      this.renderConnections();
    }
  }

  renderConnections() {
    const container = document.getElementById('connections-list');
    
    if (this.connections.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-user-friends text-4xl mb-3"></i>
          <p class="mb-4">You don't have any connections yet</p>
          <button onclick="socialNetwork.showTab('find')" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Find People to Connect
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.connections.map(conn => `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 font-bold text-xl">
            ${conn.name ? conn.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h4 class="font-semibold text-gray-800">${conn.name || 'Anonymous'}</h4>
            <p class="text-sm text-gray-600">@${conn.username || 'unknown'}</p>
            <p class="text-xs text-gray-500">${conn.connection_type}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="socialNetwork.openChat(${conn.connected_user_id})" 
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
            <i class="fas fa-comment"></i> Message
          </button>
        </div>
      </div>
    `).join('');
  }

  async loadPendingRequests() {
    // TODO: Implement pending requests loading
    const badge = document.getElementById('requests-badge');
    badge.classList.add('hidden');
  }

  openChat(userId) {
    this.showTab('messages');
    this.currentChatUserId = userId;
    this.loadMessages(userId);
    
    document.getElementById('message-input-container').classList.remove('hidden');
  }

  async loadMessages(userId) {
    try {
      const response = await axios.get(`/api/social/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });

      if (response.data.success) {
        this.renderMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  renderMessages(messages) {
    const container = document.getElementById('message-thread');
    
    if (messages.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <p>No messages yet. Start the conversation!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = messages.reverse().map(msg => {
      const isOwn = msg.sender_id === parseInt(localStorage.getItem('user_id'));
      return `
        <div class="mb-4 ${isOwn ? 'text-right' : 'text-left'}">
          <div class="inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwn ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}">
            ${!isOwn ? `<p class="text-xs font-semibold mb-1">${msg.sender_name}</p>` : ''}
            <p>${msg.message}</p>
            <p class="text-xs mt-1 opacity-75">${new Date(msg.created_at).toLocaleTimeString()}</p>
          </div>
        </div>
      `;
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  async sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message || !this.currentChatUserId) return;

    try {
      const response = await axios.post('/api/social/messages', {
        recipient_id: this.currentChatUserId,
        message
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });

      if (response.data.success) {
        input.value = '';
        this.loadMessages(this.currentChatUserId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  }
}

// Initialize
const socialNetwork = new SocialNetwork();
