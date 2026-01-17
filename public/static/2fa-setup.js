// 2FA Setup JavaScript

let totpSecret = '';
let backupCodes = [];

document.addEventListener('DOMContentLoaded', initSetup);

async function initSetup() {
  try {
    const res = await fetch('/api/security/2fa/totp/setup', { method: 'POST' });
    const data = await res.json();
    
    if (data.error) {
      alert(data.error);
      window.location.href = '/security';
      return;
    }
    
    totpSecret = data.secret;
    
    // Show QR code
    document.getElementById('qr-loading').classList.add('hidden');
    const qrImg = document.getElementById('qr-code');
    qrImg.src = data.qrCode;
    qrImg.classList.remove('hidden');
    
    // Show manual code
    document.getElementById('manual-code').textContent = data.secret;
  } catch (err) {
    console.error('Setup error:', err);
    alert('Failed to start 2FA setup');
  }
}

function showStep1() {
  document.getElementById('step1').classList.remove('hidden');
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.add('hidden');
}

function showStep2() {
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
  document.getElementById('step3').classList.add('hidden');
  document.getElementById('totp-code').focus();
}

async function verifyTOTP() {
  const code = document.getElementById('totp-code').value;
  const errorEl = document.getElementById('verify-error');
  
  if (!code || code.length !== 6) {
    errorEl.textContent = 'Please enter a 6-digit code';
    errorEl.classList.remove('hidden');
    return;
  }
  
  try {
    // Verify the code
    const verifyRes = await fetch('/api/security/2fa/totp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const verifyData = await verifyRes.json();
    
    if (!verifyData.success) {
      errorEl.textContent = verifyData.error || 'Invalid code';
      errorEl.classList.remove('hidden');
      return;
    }
    
    // Enable 2FA
    const enableRes = await fetch('/api/security/2fa/totp/enable', { method: 'POST' });
    const enableData = await enableRes.json();
    
    if (enableData.success) {
      backupCodes = enableData.backupCodes;
      showStep3();
    } else {
      errorEl.textContent = enableData.error || 'Failed to enable 2FA';
      errorEl.classList.remove('hidden');
    }
  } catch (err) {
    errorEl.textContent = 'An error occurred';
    errorEl.classList.remove('hidden');
  }
}

function showStep3() {
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.remove('hidden');
  
  // Display backup codes
  const codesContainer = document.getElementById('backup-codes');
  codesContainer.innerHTML = backupCodes.map(code => 
    `<div class="p-2 bg-gray-600 rounded text-center">${code}</div>`
  ).join('');
}

function downloadCodes() {
  const content = 'MoodMash Backup Codes\n\n' +
    'Save these codes in a safe place. Each code can only be used once.\n\n' +
    backupCodes.join('\n') +
    '\n\nGenerated: ' + new Date().toISOString();
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'moodmash-backup-codes.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// Auto-submit when 6 digits entered
document.getElementById('totp-code')?.addEventListener('input', (e) => {
  const value = e.target.value.replace(/\D/g, '');
  e.target.value = value;
  if (value.length === 6) {
    verifyTOTP();
  }
});
