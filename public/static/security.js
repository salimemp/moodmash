// Security Dashboard JavaScript

document.addEventListener('DOMContentLoaded', loadSecurityDashboard);

async function loadSecurityDashboard() {
  try {
    const res = await fetch('/api/security/dashboard');
    const data = await res.json();
    
    // Update security score
    document.getElementById('score-value').textContent = data.securityScore || '--';
    
    // Update 2FA buttons
    const totpBtn = document.getElementById('totp-btn');
    const emailBtn = document.getElementById('email-2fa-btn');
    
    if (data.twoFactor.methods.includes('totp')) {
      totpBtn.textContent = 'Enabled ✓';
      totpBtn.className = 'px-4 py-2 bg-green-600 rounded-lg cursor-default';
      totpBtn.onclick = null;
    }
    if (data.twoFactor.methods.includes('email')) {
      emailBtn.textContent = 'Enabled ✓';
      emailBtn.className = 'px-4 py-2 bg-green-600 rounded-lg cursor-default';
      emailBtn.onclick = null;
    }
    
    // Update backup codes count
    document.getElementById('backup-count').textContent = data.backupCodes.remaining;
    
    // Load sessions
    loadSessions();
    
    // Load login history
    loadLoginHistory();
    
    // Load security events
    loadSecurityEvents();
  } catch (err) {
    console.error('Failed to load security dashboard:', err);
  }
}

async function loadSessions() {
  try {
    const res = await fetch('/api/security/sessions');
    const data = await res.json();
    const container = document.getElementById('sessions-list');
    
    if (!data.sessions || data.sessions.length === 0) {
      container.innerHTML = '<div class="text-center py-4 text-gray-400">No active sessions</div>';
      return;
    }
    
    container.innerHTML = data.sessions.map(session => `
      <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
        <div>
          <div class="font-medium">${session.device_info || 'Unknown Device'}</div>
          <div class="text-sm text-gray-400">
            ${session.ip_address || 'Unknown IP'} • ${formatDate(session.last_activity)}
            ${session.is_current ? '<span class="text-green-400 ml-2">Current</span>' : ''}
          </div>
        </div>
        ${!session.is_current ? `
          <button onclick="terminateSession('${session.id}')" class="text-red-400 hover:text-red-300 text-sm">
            End
          </button>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load sessions:', err);
  }
}

async function loadLoginHistory() {
  try {
    const res = await fetch('/api/security/login-history');
    const data = await res.json();
    const container = document.getElementById('login-history');
    
    if (!data.history || data.history.length === 0) {
      container.innerHTML = '<div class="text-center py-4 text-gray-400">No login history</div>';
      return;
    }
    
    container.innerHTML = data.history.slice(0, 20).map(login => `
      <div class="flex items-center justify-between p-2 bg-gray-700/50 rounded text-sm">
        <div>
          <span class="${login.success ? 'text-green-400' : 'text-red-400'}">
            ${login.success ? '✓' : '✗'}
          </span>
          ${login.device_info || 'Unknown Device'}
        </div>
        <div class="text-gray-400">
          ${login.ip_address || 'Unknown'} • ${formatDate(login.created_at)}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load login history:', err);
  }
}

async function loadSecurityEvents() {
  try {
    const res = await fetch('/api/security/events');
    const data = await res.json();
    const container = document.getElementById('security-events');
    
    if (!data.events || data.events.length === 0) {
      container.innerHTML = '<div class="text-center py-4 text-gray-400">No security events</div>';
      return;
    }
    
    container.innerHTML = data.events.map(event => `
      <div class="flex items-center justify-between p-2 bg-gray-700/50 rounded text-sm">
        <div>
          <span class="${getSeverityColor(event.severity)}">
            ${getSeverityIcon(event.severity)}
          </span>
          ${formatEventType(event.event_type)}
        </div>
        <div class="text-gray-400">${formatDate(event.created_at)}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load security events:', err);
  }
}

function setup2FA(type) {
  if (type === 'totp') {
    window.location.href = '/2fa-setup';
  } else if (type === 'email') {
    enableEmail2FA();
  }
}

async function enableEmail2FA() {
  try {
    const res = await fetch('/api/security/2fa/email/enable', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('Email 2FA enabled successfully!');
      location.reload();
    } else {
      alert(data.error || 'Failed to enable Email 2FA');
    }
  } catch (err) {
    alert('An error occurred');
  }
}

async function regenerateBackupCodes() {
  const code = prompt('Enter your current 2FA code to regenerate backup codes:');
  if (!code) return;
  
  try {
    const res = await fetch('/api/security/2fa/backup-codes/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    
    if (data.success) {
      alert('New backup codes:\n\n' + data.backupCodes.join('\n') + '\n\nSave these codes!');
      location.reload();
    } else {
      alert(data.error || 'Failed to regenerate codes');
    }
  } catch (err) {
    alert('An error occurred');
  }
}

async function terminateSession(sessionId) {
  if (!confirm('End this session?')) return;
  
  try {
    const res = await fetch(`/api/security/sessions/${sessionId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadSessions();
    } else {
      alert(data.error || 'Failed to terminate session');
    }
  } catch (err) {
    alert('An error occurred');
  }
}

async function terminateAllSessions() {
  if (!confirm('End all other sessions?')) return;
  
  try {
    const res = await fetch('/api/security/sessions/terminate-all', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('All other sessions terminated');
      loadSessions();
    } else {
      alert(data.error || 'Failed to terminate sessions');
    }
  } catch (err) {
    alert('An error occurred');
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getSeverityColor(severity) {
  const colors = {
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  };
  return colors[severity] || 'text-gray-400';
}

function getSeverityIcon(severity) {
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨'
  };
  return icons[severity] || '•';
}

function formatEventType(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
