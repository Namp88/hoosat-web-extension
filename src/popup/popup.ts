// Popup UI script - main wallet interface

import { hasWallet, getCurrentWallet, loadWallet, loadTransactionHistory } from '../shared/storage';
import { MessageType, TransactionHistory } from '../shared/types';
import { APP_NAME, getExplorerTxUrl, getExplorerAddressUrl } from '../shared/constants';

console.log('🦊 Hoosat Wallet popup loaded');

// State
let isUnlocked = false;
let currentAddress: string | null = null;
let balance: string = '0';

// DOM Elements
const app = document.getElementById('app')!;

// Initialize popup
async function init() {
  console.log('Initializing popup...');

  // Check if wallet exists
  const walletExists = await hasWallet();

  if (!walletExists) {
    showCreateWallet();
    return;
  }

  // Check if wallet is unlocked (in background)
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_UNLOCK_STATUS' });

    if (response.success && response.data.isUnlocked) {
      // Wallet is unlocked in background, show wallet directly
      console.log('✅ Wallet is unlocked, showing wallet screen');
      isUnlocked = true;
      await showWallet();

      // Show brief welcome message
      showSuccessMessage('👋 Welcome back!', 1500);
      return;
    }
  } catch (error) {
    console.log('Could not check unlock status:', error);
  }

  // Check if there's a pending request
  const session = await chrome.storage.session.get('pendingRequestId');

  if (session.pendingRequestId) {
    showPendingRequest(session.pendingRequestId);
  } else {
    showUnlockWallet();
  }
}

// Show create wallet screen
function showCreateWallet() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-left">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${APP_NAME}</h1>
        </div>
      </div>
      
      <div class="content">
        <div class="welcome">
          <h2>Welcome!</h2>
          <p>Choose how to get started</p>
        </div>
        
        <div class="wallet-options">
          <button id="createNewBtn" class="btn btn-primary wallet-option-btn">
            <div class="option-icon">🔑</div>
            <div class="option-text">
              <div class="option-title">Create New Wallet</div>
              <div class="option-desc">Generate a new wallet</div>
            </div>
          </button>
          
          <button id="importBtn" class="btn btn-secondary wallet-option-btn">
            <div class="option-icon">📥</div>
            <div class="option-text">
              <div class="option-title">Import Existing Wallet</div>
              <div class="option-desc">Use your private key</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('createNewBtn')!.addEventListener('click', showGenerateWallet);
  document.getElementById('importBtn')!.addEventListener('click', showImportWallet);
}

// Show generate new wallet screen
function showGenerateWallet() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Create New Wallet</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>
      
      <div class="content">
        <div class="info-box warning">
          <div class="info-icon">⚠️</div>
          <div class="info-text">
            <strong>Important:</strong> Save your private key securely. You'll need it to restore your wallet. Never share it with anyone!
          </div>
        </div>
        
        <div class="form">
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Create password" autocomplete="new-password" />
          </div>
          
          <div class="password-strength" id="passwordStrength"></div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" placeholder="Confirm password" autocomplete="new-password" />
          </div>
          
          <div class="password-requirements">
            <div class="requirements-title">Password must contain:</div>
            <ul>
              <li>At least 8 characters</li>
              <li>One uppercase letter (A-Z)</li>
              <li>One lowercase letter (a-z)</li>
              <li>One number (0-9)</li>
            </ul>
          </div>
          
          <div class="error" id="error"></div>
          
          <button id="generateBtn" class="btn btn-primary">Generate Wallet</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', showCreateWallet);
  document.getElementById('generateBtn')!.addEventListener('click', handleGenerateWallet);

  // Add password strength indicator
  addPasswordStrengthIndicator('password', 'passwordStrength');
}

// Show import wallet screen
function showImportWallet() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Import Wallet</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>
      
      <div class="content">
        <div class="form">
          <div class="form-group">
            <label for="privateKey">Private Key (hex)</label>
            <input type="text" id="privateKey" placeholder="Enter your private key" autocomplete="off" />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Create password" autocomplete="new-password" />
          </div>
          
          <div class="password-strength" id="passwordStrength"></div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" placeholder="Confirm password" autocomplete="new-password" />
          </div>
          
          <div class="password-requirements">
            <div class="requirements-title">Password must contain:</div>
            <ul>
              <li>At least 8 characters</li>
              <li>One uppercase letter (A-Z)</li>
              <li>One lowercase letter (a-z)</li>
              <li>One number (0-9)</li>
            </ul>
          </div>
          
          <div class="error" id="error"></div>
          
          <button id="importWalletBtn" class="btn btn-primary">Import Wallet</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', showCreateWallet);
  document.getElementById('importWalletBtn')!.addEventListener('click', handleImportWallet);

  // Add password strength indicator
  addPasswordStrengthIndicator('password', 'passwordStrength');
}

// Show unlock wallet screen
function showUnlockWallet() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-left">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${APP_NAME}</h1>
        </div>
      </div>
      
      <div class="content">
        <div class="unlock-form">
          <h2>Unlock Wallet</h2>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Enter password" />
          </div>
          
          <div class="error" id="error"></div>
          
          <button id="unlockBtn" class="btn btn-primary">Unlock</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('unlockBtn')!.addEventListener('click', handleUnlock);

  // Auto-focus password field
  (document.getElementById('password') as HTMLInputElement).focus();
}

// Show main wallet screen
async function showWallet() {
  const wallet = await getCurrentWallet();

  if (!wallet) {
    showCreateWallet();
    return;
  }

  currentAddress = wallet.address;

  // Get balance
  await updateBalance();

  // Load transaction history
  const txHistory = await loadTransactionHistory();

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-left">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${APP_NAME}</h1>
        </div>
        <button id="settingsBtn" class="btn-icon">⚙️</button>
      </div>
      
      <div class="content">
        <div class="wallet-info">
          <div class="address">
            <label>Address</label>
            <div class="address-row">
              <div class="address-value" id="address">${formatAddress(currentAddress)}</div>
              <button id="copyBtn" class="btn-icon">📋</button>
            </div>
          </div> 
          
          <div class="balance">
            <label>Balance</label>
            <div class="balance-row">
              <div class="balance-value" id="balance">${formatBalance(balance)} HTN</div>
              <button id="refreshBtn" class="btn-icon">🔄</button>
            </div>
          </div>
        </div>
        
        <div class="actions">
          <button id="sendBtn" class="btn btn-primary">Send</button>
          <button id="receiveBtn" class="btn btn-secondary">Receive</button>
        </div>
        
        <div class="transactions">
          <h3>Recent Transactions</h3>
          <div class="tx-list" id="txList">
            ${txHistory.length > 0 ? renderTransactions(txHistory.slice(0, 10)) : '<p class="empty">No transactions yet</p>'}
          </div>
          ${txHistory.length > 0 ? `<button id="viewHistoryBtn" class="btn-link">View Full History in Explorer →</button>` : ''}
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('copyBtn')!.addEventListener('click', copyAddress);
  document.getElementById('refreshBtn')!.addEventListener('click', updateBalance);
  document.getElementById('sendBtn')!.addEventListener('click', showSendScreen);
  document.getElementById('receiveBtn')!.addEventListener('click', showReceiveScreen);
  document.getElementById('settingsBtn')!.addEventListener('click', showSettingsScreen);

  if (txHistory.length > 0) {
    document.getElementById('viewHistoryBtn')!.addEventListener('click', () => {
      window.open(getExplorerAddressUrl('mainnet', currentAddress!), '_blank');
    });

    // Add click listeners to each transaction
    document.querySelectorAll('.tx-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        window.open(getExplorerTxUrl('mainnet', txHistory[index].txId), '_blank');
      });
    });
  }
}

// Render transaction list
function renderTransactions(transactions: TransactionHistory[]): string {
  return transactions
    .map(
      tx => `
    <div class="tx-item" data-txid="${tx.txId}">
      <div class="tx-icon">${tx.type === 'sent' ? '📤' : '📥'}</div>
      <div class="tx-details">
        <div class="tx-type">${tx.type === 'sent' ? 'Sent' : 'Received'}</div>
        <div class="tx-address">${tx.type === 'sent' ? 'To: ' + formatAddress(tx.to!) : 'From: ' + formatAddress(tx.from || 'Unknown')}</div>
        <div class="tx-time">${formatTime(tx.timestamp)}</div>
      </div>
      <div class="tx-amount ${tx.type === 'sent' ? 'negative' : 'positive'}">
        ${tx.type === 'sent' ? '-' : '+'}${formatBalance(tx.amount)} HTN
      </div>
    </div>
  `
    )
    .join('');
}

// Format timestamp
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// Show pending request (connection or transaction)
async function showPendingRequest(requestId: string) {
  // TODO: Fetch request details from background
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <h1>${APP_NAME}</h1>
      </div>
      
      <div class="content">
        <div class="request">
          <h2>Pending Request</h2>
          <p>Loading request details...</p>
        </div>
      </div>
    </div>
  `;
}

// Handle generate new wallet
async function handleGenerateWallet() {
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
  const errorEl = document.getElementById('error')!;

  errorEl.textContent = '';

  // Validation
  if (!password || !confirmPassword) {
    errorEl.textContent = 'Password is required';
    return;
  }

  if (password !== confirmPassword) {
    errorEl.textContent = 'Passwords do not match';
    return;
  }

  // Use unified validation
  const validation = validatePassword(password);
  if (!validation.valid) {
    errorEl.textContent = validation.error!;
    return;
  }

  // Check strength (warn if too weak)
  const strength = calculatePasswordStrength(password);
  if (strength.score < 3) {
    errorEl.textContent = 'Password is too weak. ' + strength.feedback.slice(0, 2).join(', ');
    return;
  }

  try {
    // Generate new keypair
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_WALLET',
      data: { password },
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    // Show the generated private key
    showBackupPrivateKey(response.data.privateKey, response.data.address, password);
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to generate wallet';
  }
}

// Show backup private key screen
function showBackupPrivateKey(privateKey: string, address: string, password: string) {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-left">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Backup Private Key</h1>
        </div>
      </div>
      
      <div class="content">
        <div class="info-box critical">
          <div class="info-icon">🔐</div>
          <div class="info-text">
            <strong>Save this private key!</strong><br>
            Write it down and store it in a safe place. You'll need it to restore your wallet.
          </div>
        </div>
        
        <div class="key-display">
          <label>Your Private Key</label>
          <div class="key-value" id="keyValue">${privateKey}</div>
          <button id="copyKeyBtn" class="btn btn-secondary">📋 Copy to Clipboard</button>
        </div>
        
        <div class="key-display">
          <label>Your Address</label>
          <div class="key-value small" id="addressValue">${address}</div>
        </div>
        
        <div class="backup-confirm">
          <label class="checkbox-label">
            <input type="checkbox" id="confirmBackup" />
            <span>I have saved my private key securely</span>
          </label>
        </div>
        
        <button id="continueBtn" class="btn btn-primary" disabled>Continue</button>
      </div>
    </div>
  `;

  // Copy button
  document.getElementById('copyKeyBtn')!.addEventListener('click', () => {
    navigator.clipboard.writeText(privateKey).then(() => {
      const btn = document.getElementById('copyKeyBtn')!;
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });
  });

  // Enable continue button when checkbox is checked
  const checkbox = document.getElementById('confirmBackup') as HTMLInputElement;
  const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;

  checkbox.addEventListener('change', () => {
    continueBtn.disabled = !checkbox.checked;
  });

  continueBtn.addEventListener('click', async () => {
    try {
      // Auto-unlock with the password
      const unlockResponse = await chrome.runtime.sendMessage({
        type: 'UNLOCK_WALLET',
        data: { password },
      });

      if (!unlockResponse.success) {
        throw new Error(unlockResponse.error);
      }

      // Notify background that wallet is unlocked
      await chrome.runtime.sendMessage({
        type: MessageType.WALLET_UNLOCKED,
      });

      isUnlocked = true;

      // Show wallet directly
      await showWallet();
      showSuccessMessage('🎉 Wallet created successfully!', 2000);
    } catch (error: any) {
      console.error('Failed to unlock after wallet creation:', error);
      // Fallback to unlock screen if auto-unlock fails
      showUnlockWallet();
    }
  });
}

// Handle import wallet
async function handleImportWallet() {
  const privateKey = (document.getElementById('privateKey') as HTMLInputElement).value.trim();
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
  const errorEl = document.getElementById('error')!;

  errorEl.textContent = '';

  // Validation
  if (!privateKey) {
    errorEl.textContent = 'Private key is required';
    return;
  }

  if (!password || !confirmPassword) {
    errorEl.textContent = 'Password is required';
    return;
  }

  if (password !== confirmPassword) {
    errorEl.textContent = 'Passwords do not match';
    return;
  }

  // Use unified validation
  const validation = validatePassword(password);
  if (!validation.valid) {
    errorEl.textContent = validation.error!;
    return;
  }

  // Check strength (warn if too weak)
  const strength = calculatePasswordStrength(password);
  if (strength.score < 3) {
    errorEl.textContent = 'Password is too weak. ' + strength.feedback.slice(0, 2).join(', ');
    return;
  }

  try {
    // Import wallet
    const response = await chrome.runtime.sendMessage({
      type: 'IMPORT_WALLET',
      data: { privateKey, password },
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    // Auto-unlock with the password user just entered
    const unlockResponse = await chrome.runtime.sendMessage({
      type: 'UNLOCK_WALLET',
      data: { password },
    });

    if (!unlockResponse.success) {
      throw new Error(unlockResponse.error);
    }

    // Notify background that wallet is unlocked
    await chrome.runtime.sendMessage({
      type: MessageType.WALLET_UNLOCKED,
    });

    isUnlocked = true;

    // Show wallet directly
    await showWallet();
    showSuccessMessage('🎉 Wallet imported successfully!', 2000);
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to import wallet';
  }
}

// Handle unlock
async function handleUnlock() {
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const errorEl = document.getElementById('error')!;

  errorEl.textContent = '';

  if (!password) {
    errorEl.textContent = 'Password is required';
    return;
  }

  try {
    // Unlock wallet in background
    const response = await chrome.runtime.sendMessage({
      type: 'UNLOCK_WALLET',
      data: { password },
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    // Notify background
    await chrome.runtime.sendMessage({
      type: MessageType.WALLET_UNLOCKED,
    });

    isUnlocked = true;

    // Show wallet
    await showWallet();
  } catch (error: any) {
    errorEl.textContent = error.message || 'Invalid password';
  }
}

// Update balance
async function updateBalance() {
  if (!currentAddress) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_BALANCE',
      data: { address: currentAddress },
    });

    if (response.success) {
      balance = response.data;
      const balanceEl = document.getElementById('balance');
      if (balanceEl) {
        balanceEl.textContent = `${formatBalance(balance)} HTN`;
      }
    }
  } catch (error) {
    console.error('Failed to update balance:', error);
  }
}

// Copy address to clipboard
function copyAddress() {
  if (!currentAddress) return;

  navigator.clipboard.writeText(currentAddress).then(() => {
    // Show toast or feedback
    const btn = document.getElementById('copyBtn')!;
    btn.textContent = '✓';
    setTimeout(() => {
      btn.textContent = '📋';
    }, 1000);
  });
}

// Show send screen
function showSendScreen() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Send HTN</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>
      
      <div class="content">
        <div class="form">
          <div class="form-group">
            <label for="recipient">Recipient Address</label>
            <input type="text" id="recipient" placeholder="hoosat:..." />
          </div>
          
          <div class="form-group">
            <label for="amount">Amount (HTN)</label>
            <input type="number" id="amount" step="0.00000001" placeholder="0.00" />
          </div>
          
          <div class="balance-info">
            Available: ${formatBalance(balance)} HTN
          </div>
          
          <div class="error" id="error"></div>
          
          <button id="sendBtn" class="btn btn-primary">Send Transaction</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', showWallet);
  document.getElementById('sendBtn')!.addEventListener('click', handleSendTransaction);
}

// Show receive screen
function showReceiveScreen() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Receive HTN</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>
      
      <div class="content">
        <div class="receive-info">
          <h3>Your Address</h3>
          <div class="address-display">${currentAddress}</div>
          <button id="copyBtn" class="btn btn-primary">Copy Address</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', showWallet);
  document.getElementById('copyBtn')!.addEventListener('click', copyAddress);
}

// Show settings screen
function showSettingsScreen() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Settings</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>
      
      <div class="content">
        <div class="settings">
          <button id="changePasswordBtn" class="btn btn-secondary">🔑 Change Password</button>
          <button id="exportKeyBtn" class="btn btn-secondary">📤 Export Private Key</button>
          <button id="lockBtn" class="btn btn-secondary">🔒 Lock Wallet</button>
          <button id="resetBtn" class="btn btn-danger">🗑️ Reset Wallet</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', showWallet);
  document.getElementById('changePasswordBtn')!.addEventListener('click', showChangePassword);
  document.getElementById('exportKeyBtn')!.addEventListener('click', showExportPrivateKey);
  document.getElementById('lockBtn')!.addEventListener('click', handleLock);
  document.getElementById('resetBtn')!.addEventListener('click', handleReset);
}

/**
 * Show change password screen
 */
function showChangePassword() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Change Password</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>
      
      <div class="content">
        <div class="info-box warning">
          <div class="info-icon">⚠️</div>
          <div class="info-text">
            <strong>Important:</strong> After changing your password, make sure to remember it. You cannot recover your wallet without the correct password!
          </div>
        </div>
        
        <div class="form">
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <input 
              type="password" 
              id="currentPassword" 
              placeholder="Enter current password"
              autocomplete="current-password"
            />
          </div>
          
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input 
              type="password" 
              id="newPassword" 
              placeholder="Enter new password"
              autocomplete="new-password"
            />
          </div>
          
          <div class="form-group">
            <label for="confirmNewPassword">Confirm New Password</label>
            <input 
              type="password" 
              id="confirmNewPassword" 
              placeholder="Confirm new password"
              autocomplete="new-password"
            />
          </div>
          
          <div class="password-strength" id="passwordStrength"></div>
          
          <div class="error" id="error"></div>
          
          <button id="changePasswordBtn" class="btn btn-primary">Change Password</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', showSettingsScreen);
  document.getElementById('changePasswordBtn')!.addEventListener('click', handleChangePassword);

  // Focus current password field
  (document.getElementById('currentPassword') as HTMLInputElement).focus();

  // Password strength indicator
  const newPasswordInput = document.getElementById('newPassword') as HTMLInputElement;
  const strengthDiv = document.getElementById('passwordStrength')!;

  newPasswordInput.addEventListener('input', () => {
    const password = newPasswordInput.value;
    const strength = calculatePasswordStrength(password);

    strengthDiv.className = 'password-strength';

    if (password.length === 0) {
      strengthDiv.textContent = '';
      return;
    }

    if (strength.score < 2) {
      strengthDiv.classList.add('weak');
      strengthDiv.textContent = '🔴 Weak password';
    } else if (strength.score < 4) {
      strengthDiv.classList.add('medium');
      strengthDiv.textContent = '🟡 Medium password';
    } else {
      strengthDiv.classList.add('strong');
      strengthDiv.textContent = '🟢 Strong password';
    }
  });
}

/**
 * Validate password requirements
 */
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Add live password strength indicator to input field
 */
function addPasswordStrengthIndicator(inputId: string, strengthId: string) {
  const passwordInput = document.getElementById(inputId) as HTMLInputElement;
  const strengthDiv = document.getElementById(strengthId)!;

  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = calculatePasswordStrength(password);

    strengthDiv.className = 'password-strength';

    if (password.length === 0) {
      strengthDiv.textContent = '';
      return;
    }

    if (strength.score < 3) {
      strengthDiv.classList.add('weak');
      strengthDiv.textContent = '🔴 Weak password';
    } else if (strength.score < 4) {
      strengthDiv.classList.add('medium');
      strengthDiv.textContent = '🟡 Medium password';
    } else {
      strengthDiv.classList.add('strong');
      strengthDiv.textContent = '🟢 Strong password';
    }
  });
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password: string): { score: number; feedback: string[] } {
  let score = 0;
  const feedback: string[] = [];

  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  else if (password.length < 8) feedback.push('At least 8 characters');

  // Has uppercase
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  // Has lowercase
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  // Has numbers
  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add numbers');

  // Has special characters (bonus)
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Add special characters (recommended)');

  return { score, feedback };
}

/**
 * Handle change password request
 */
async function handleChangePassword() {
  const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
  const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
  const confirmNewPassword = (document.getElementById('confirmNewPassword') as HTMLInputElement).value;
  const errorEl = document.getElementById('error')!;

  errorEl.textContent = '';

  // Validation
  if (!currentPassword) {
    errorEl.textContent = 'Current password is required';
    return;
  }

  if (!newPassword || !confirmNewPassword) {
    errorEl.textContent = 'New password is required';
    return;
  }

  if (newPassword !== confirmNewPassword) {
    errorEl.textContent = 'New passwords do not match';
    return;
  }

  if (newPassword === currentPassword) {
    errorEl.textContent = 'New password must be different from current password';
    return;
  }

  if (newPassword.length < 8) {
    errorEl.textContent = 'Password must be at least 8 characters';
    return;
  }

  // Check password strength
  const strength = calculatePasswordStrength(newPassword);
  if (strength.score < 3) {
    errorEl.textContent = 'Password is too weak. ' + strength.feedback.join(', ');
    return;
  }

  try {
    const changeBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
    changeBtn.disabled = true;
    changeBtn.textContent = 'Changing Password...';

    // Request password change from background
    const response = await chrome.runtime.sendMessage({
      type: 'CHANGE_PASSWORD',
      data: {
        currentPassword,
        newPassword,
      },
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    // Show success and return to settings
    await showSettingsScreen();
    showSuccessMessage('🎉 Password changed successfully!', 3000);
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to change password';
    const changeBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
    changeBtn.disabled = false;
    changeBtn.textContent = 'Change Password';
  }
}

// Replace the handleSendTransaction function in popup.ts (starts around line 619)

// Handle send transaction
async function handleSendTransaction() {
  const recipient = (document.getElementById('recipient') as HTMLInputElement).value.trim();
  const amount = (document.getElementById('amount') as HTMLInputElement).value;
  const errorEl = document.getElementById('error')!;

  errorEl.textContent = '';

  // Validation
  if (!recipient || !amount) {
    errorEl.textContent = 'Recipient and amount are required';
    return;
  }

  if (!recipient.startsWith('hoosat:')) {
    errorEl.textContent = 'Invalid address format. Must start with "hoosat:"';
    return;
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    errorEl.textContent = 'Invalid amount';
    return;
  }

  try {
    // Show loading state
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    const originalText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Estimating fee...';

    // Get real fee estimate from background
    const feeEstimateResponse = await chrome.runtime.sendMessage({
      type: 'ESTIMATE_FEE',
      data: {
        to: recipient,
        amount: amountNum,
      },
    });

    if (!feeEstimateResponse.success) {
      throw new Error(feeEstimateResponse.error);
    }

    const feeEstimate = feeEstimateResponse.data;
    const minFeeSompi = BigInt(feeEstimate.fee);
    const minFeeHTN = parseFloat(feeEstimate.fee) / 100000000;

    console.log('💵 Minimum fee estimate:', {
      fee: feeEstimate.fee + ' sompi',
      feeHTN: minFeeHTN.toFixed(8) + ' HTN',
      inputs: feeEstimate.inputs,
      outputs: feeEstimate.outputs,
    });

    // Re-enable button
    sendBtn.disabled = false;
    sendBtn.textContent = originalText;

    // Check if amount exceeds balance
    const balanceSompi = BigInt(balance);
    const amountSompi = BigInt(Math.floor(amountNum * 100000000));
    const totalRequired = amountSompi + minFeeSompi;

    if (totalRequired > balanceSompi) {
      errorEl.textContent = `Insufficient balance. Need ${(parseFloat(totalRequired.toString()) / 100000000).toFixed(8)} HTN (including ${minFeeHTN.toFixed(8)} HTN fee)`;
      return;
    }

    // Show transaction preview with option to edit fee
    const result = await showTransactionPreview({
      to: recipient,
      amount: amountNum,
      minFee: minFeeHTN,
      minFeeSompi: feeEstimate.fee,
      inputs: feeEstimate.inputs,
      outputs: feeEstimate.outputs,
    });

    if (!result.confirmed) {
      return; // User cancelled
    }

    // Disable button during sending
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    // Use custom fee if provided, otherwise use minimum
    const finalFeeSompi = result.customFeeSompi || feeEstimate.fee;

    const response = await chrome.runtime.sendMessage({
      type: 'SEND_TRANSACTION',
      data: {
        to: recipient,
        amount: amountNum,
        fee: finalFeeSompi,
      },
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    // Wait a bit for background to save the transaction
    await new Promise(resolve => setTimeout(resolve, 100));

    // Show success and return to wallet
    await showWallet();

    // Show success message after returning to wallet
    showSuccessMessage(`Transaction sent! TX ID: ${response.data.substring(0, 16)}...`);
  } catch (error: any) {
    errorEl.textContent = error.message || 'Transaction failed';
    // Re-enable button
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Transaction';
    }
  }
}

/**
 * Show export private key screen with password verification
 */
function showExportPrivateKey() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Export Private Key</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>
      
      <div class="content">
        <div class="info-box critical">
          <div class="info-icon">⚠️</div>
          <div class="info-text">
            <strong>Security Warning!</strong><br>
            Never share your private key with anyone. Anyone with access to your private key can steal your funds!
          </div>
        </div>
        
        <div class="form">
          <div class="form-group">
            <label for="password">Enter Password to Confirm</label>
            <input type="password" id="password" placeholder="Enter your password" autocomplete="off" />
          </div>
          
          <div class="error" id="error"></div>
          
          <button id="exportBtn" class="btn btn-primary">Show Private Key</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', showSettingsScreen);
  document.getElementById('exportBtn')!.addEventListener('click', handleExportPrivateKey);

  // Focus password field
  (document.getElementById('password') as HTMLInputElement).focus();
}

/**
 * Handle export private key request
 */
async function handleExportPrivateKey() {
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const errorEl = document.getElementById('error')!;

  errorEl.textContent = '';

  if (!password) {
    errorEl.textContent = 'Password is required';
    return;
  }

  try {
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    exportBtn.disabled = true;
    exportBtn.textContent = 'Verifying...';

    // Request private key from background (will decrypt and verify password)
    const response = await chrome.runtime.sendMessage({
      type: 'EXPORT_PRIVATE_KEY',
      data: { password },
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    // Show the private key
    showPrivateKeyExported(response.data.privateKey, response.data.address);
  } catch (error: any) {
    errorEl.textContent = error.message || 'Invalid password';
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    exportBtn.disabled = false;
    exportBtn.textContent = 'Show Private Key';
  }
}

/**
 * Show exported private key with security warnings
 */
function showPrivateKeyExported(privateKey: string, address: string) {
  let isKeyVisible = false;

  const renderScreen = () => {
    app.innerHTML = `
      <div class="screen">
        <div class="header">
          <button id="backBtn" class="btn-icon">←</button>
          <div class="header-center">
            <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
            <h1>Your Private Key</h1>
          </div>
          <div style="width: 32px;"></div>
        </div>
        
        <div class="content">
          <div class="info-box critical">
            <div class="info-icon">🔐</div>
            <div class="info-text">
              <strong>Keep this key safe!</strong><br>
              Anyone with this key can access your funds. Store it securely and never share it.
            </div>
          </div>
          
          <div class="key-display">
            <label>Your Address</label>
            <div class="key-value small">${address}</div>
          </div>
          
          <div class="key-display">
            <label>Private Key (Hex)</label>
            <div class="key-value ${!isKeyVisible ? 'key-hidden' : ''}" id="keyValue">
              ${isKeyVisible ? privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
            </div>
            <button id="toggleKeyBtn" class="btn btn-secondary">
              ${isKeyVisible ? '🙈 Hide Key' : '👁️ Show Key'}
            </button>
          </div>
          
          ${
            isKeyVisible
              ? `
          <button id="copyKeyBtn" class="btn btn-primary">📋 Copy to Clipboard</button>
          `
              : ''
          }
          
          <div class="info-box warning" style="margin-top: 20px;">
            <div class="info-icon">💡</div>
            <div class="info-text">
              <strong>Best Practices:</strong><br>
              • Write it down on paper and store in a safe place<br>
              • Use a password manager (encrypted)<br>
              • Never store in plain text files<br>
              • Never send via email or messaging apps
            </div>
          </div>
          
          <button id="doneBtn" class="btn btn-secondary" style="margin-top: 12px;">Done</button>
        </div>
      </div>
    `;

    document.getElementById('backBtn')!.addEventListener('click', showSettingsScreen);
    document.getElementById('doneBtn')!.addEventListener('click', showSettingsScreen);

    document.getElementById('toggleKeyBtn')!.addEventListener('click', () => {
      isKeyVisible = !isKeyVisible;
      renderScreen();
    });

    if (isKeyVisible) {
      document.getElementById('copyKeyBtn')!.addEventListener('click', () => {
        navigator.clipboard.writeText(privateKey).then(() => {
          const btn = document.getElementById('copyKeyBtn')!;
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied to Clipboard!';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        });
      });
    }
  };

  renderScreen();
}

// Show success message
function showSuccessMessage(message: string, duration: number = 3000) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-toast';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);

  setTimeout(() => {
    successDiv.classList.add('show');
  }, 10);

  setTimeout(() => {
    successDiv.classList.remove('show');
    setTimeout(() => {
      successDiv.remove();
    }, 300);
  }, duration);
}

// Show custom confirm dialog
function showConfirmDialog(title: string, message: string): Promise<boolean> {
  return new Promise(resolve => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal-content';

    modal.innerHTML = `
      <div class="modal-header">
        <h2>${title}</h2>
      </div>
      <div class="modal-body">
        <p>${message}</p>
      </div>
      <div class="modal-actions">
        <button id="modalCancel" class="btn btn-secondary">Cancel</button>
        <button id="modalConfirm" class="btn btn-danger">Confirm</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);

    // Handle buttons
    const closeModal = (confirmed: boolean) => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve(confirmed);
      }, 300);
    };

    document.getElementById('modalCancel')!.addEventListener('click', () => closeModal(false));
    document.getElementById('modalConfirm')!.addEventListener('click', () => closeModal(true));

    // Close on overlay click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        closeModal(false);
      }
    });
  });
}

// Show transaction preview modal
interface TransactionPreviewData {
  to: string;
  amount: number;
  minFee: number; // in HTN
  minFeeSompi: string; // in sompi
  inputs?: number;
  outputs?: number;
}

interface TransactionPreviewResult {
  confirmed: boolean;
  customFeeSompi?: string;
}

function showTransactionPreview(data: TransactionPreviewData): Promise<TransactionPreviewResult> {
  return new Promise(resolve => {
    let isEditingFee = false;
    let customFeeHTN = data.minFee;
    let customFeeSompi = data.minFeeSompi;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal-content tx-preview-modal';

    function renderModal() {
      const total = data.amount + customFeeHTN;
      const isCustomFee = customFeeSompi !== data.minFeeSompi;
      const feeMultiplier = customFeeHTN / data.minFee;
      const showWarning = feeMultiplier > 10;

      modal.innerHTML = `
        <div class="modal-header">
          <h2>Confirm Transaction</h2>
        </div>
        <div class="modal-body">
          <div class="tx-preview-section">
            <div class="tx-preview-label">Sending to</div>
            <div class="tx-preview-value address-preview">${formatAddress(data.to)}</div>
            <div class="tx-preview-full">${data.to}</div>
          </div>
          
          <div class="tx-preview-section">
            <div class="tx-preview-label">Amount</div>
            <div class="tx-preview-value amount-value">${data.amount.toFixed(8)} HTN</div>
          </div>
          
          <div class="tx-preview-divider"></div>
          
          <div class="tx-preview-section">
            <div class="tx-preview-label-row">
              <div class="tx-preview-label">Network Fee</div>
              ${isCustomFee && !isEditingFee ? '<div class="custom-fee-badge">Custom</div>' : ''}
            </div>
            ${
              !isEditingFee
                ? `
              <div class="fee-display">
                <div class="tx-preview-value fee-value">${customFeeHTN.toFixed(8)} HTN</div>
                ${
                  data.inputs && data.outputs
                    ? `<div class="tx-preview-note">${data.inputs} input${data.inputs > 1 ? 's' : ''} + ${data.outputs} output${data.outputs > 1 ? 's' : ''}</div>`
                    : ''
                }
                <button id="editFeeBtn" class="btn-link-small">Edit fee</button>
              </div>
            `
                : `
              <div class="fee-edit-form">
                <input 
                  type="number" 
                  id="customFeeInput" 
                  class="fee-input" 
                  step="0.00000001" 
                  value="${customFeeHTN.toFixed(8)}"
                  placeholder="${data.minFee.toFixed(8)}"
                />
                <div class="fee-edit-hint">Minimum: ${data.minFee.toFixed(8)} HTN</div>
                <div class="fee-edit-actions">
                  <button id="cancelFeeBtn" class="btn btn-secondary btn-small">Cancel</button>
                  <button id="saveFeeBtn" class="btn btn-primary btn-small">Save</button>
                </div>
                <div class="error" id="feeError"></div>
              </div>
            `
            }
          </div>
          
          ${
            showWarning
              ? `
          <div class="tx-preview-warning-box">
            ⚠️ Warning: Fee is ${feeMultiplier.toFixed(1)}x higher than minimum!
          </div>
          `
              : ''
          }
          
          <div class="tx-preview-section total-section">
            <div class="tx-preview-label">Total</div>
            <div class="tx-preview-value total-value">${total.toFixed(8)} HTN</div>
          </div>
          
          <div class="tx-preview-warning">
            ⚠️ Please verify all details before confirming
          </div>
        </div>
        <div class="modal-actions">
          <button id="modalCancel" class="btn btn-secondary">Cancel</button>
          <button id="modalConfirm" class="btn btn-primary">Confirm & Send</button>
        </div>
      `;
    }

    renderModal();
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);

    // Handle buttons
    const closeModal = (result: TransactionPreviewResult) => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 300);
    };

    // Event delegation for dynamic buttons
    modal.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;

      if (target.id === 'editFeeBtn') {
        isEditingFee = true;
        renderModal();
        // Focus input after render
        setTimeout(() => {
          const input = document.getElementById('customFeeInput') as HTMLInputElement;
          if (input) input.focus();
        }, 10);
      } else if (target.id === 'cancelFeeBtn') {
        isEditingFee = false;
        customFeeHTN = parseFloat(customFeeSompi) / 100000000;
        renderModal();
      } else if (target.id === 'saveFeeBtn') {
        const input = document.getElementById('customFeeInput') as HTMLInputElement;
        const feeError = document.getElementById('feeError')!;
        const newFeeHTN = parseFloat(input.value);

        if (isNaN(newFeeHTN) || newFeeHTN <= 0) {
          feeError.textContent = 'Invalid fee value';
          return;
        }

        if (newFeeHTN < data.minFee) {
          feeError.textContent = `Fee cannot be less than ${data.minFee.toFixed(8)} HTN`;
          return;
        }

        // Check if total exceeds balance
        const totalWithNewFee = data.amount + newFeeHTN;
        const balanceHTN = parseFloat(balance) / 100000000;

        if (totalWithNewFee > balanceHTN) {
          feeError.textContent = 'Insufficient balance for this fee';
          return;
        }

        customFeeHTN = newFeeHTN;
        customFeeSompi = Math.floor(newFeeHTN * 100000000).toString();
        isEditingFee = false;
        renderModal();
      } else if (target.id === 'modalCancel') {
        closeModal({ confirmed: false });
      } else if (target.id === 'modalConfirm') {
        closeModal({
          confirmed: true,
          customFeeSompi: customFeeSompi !== data.minFeeSompi ? customFeeSompi : undefined,
        });
      }
    });

    // Close on overlay click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        closeModal({ confirmed: false });
      }
    });
  });
}

// Handle lock wallet
async function handleLock() {
  await chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });
  isUnlocked = false;
  showUnlockWallet();
}

// Handle reset wallet
async function handleReset() {
  const confirmed = await showConfirmDialog(
    'Reset Wallet',
    'Are you sure? This will delete your wallet. Make sure you have backed up your private key!'
  );

  if (confirmed) {
    await chrome.runtime.sendMessage({ type: 'RESET_WALLET' });
    showCreateWallet();
  }
}

// Utility: Format address
function formatAddress(address: string): string {
  if (address.length <= 20) return address;
  return `${address.substring(0, 12)}...${address.substring(address.length - 8)}`;
}

// Utility: Format balance
function formatBalance(sompi: string): string {
  const balance = parseFloat(sompi) / 100000000;
  return balance.toFixed(8);
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', init);
