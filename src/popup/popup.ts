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
        <h1>${APP_NAME}</h1>
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
        <h1>Create New Wallet</h1>
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
            <input type="password" id="password" placeholder="Create password" />
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" placeholder="Confirm password" />
          </div>
          
          <div class="error" id="error"></div>
          
          <button id="generateBtn" class="btn btn-primary">Generate Wallet</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', showCreateWallet);
  document.getElementById('generateBtn')!.addEventListener('click', handleGenerateWallet);
}

// Show import wallet screen
function showImportWallet() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <h1>Import Wallet</h1>
        <div style="width: 32px;"></div>
      </div>
      
      <div class="content">
        <div class="form">
          <div class="form-group">
            <label for="privateKey">Private Key (hex)</label>
            <input type="text" id="privateKey" placeholder="Enter your private key" />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Create password" />
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" placeholder="Confirm password" />
          </div>
          
          <div class="error" id="error"></div>
          
          <button id="importWalletBtn" class="btn btn-primary">Import Wallet</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', showCreateWallet);
  document.getElementById('importWalletBtn')!.addEventListener('click', handleImportWallet);
}

// Show unlock wallet screen
function showUnlockWallet() {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <h1>${APP_NAME}</h1>
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
        <h1>${APP_NAME}</h1>
        <button id="settingsBtn" class="btn-icon">⚙️</button>
      </div>
      
      <div class="content">
        <div class="wallet-info">
          <div class="address">
            <label>Address</label>
            <div class="address-value" id="address">${formatAddress(currentAddress)}</div>
            <button id="copyBtn" class="btn-icon">📋</button>
          </div>
          
          <div class="balance">
            <label>Balance</label>
            <div class="balance-value" id="balance">${formatBalance(balance)} HTN</div>
            <button id="refreshBtn" class="btn-icon">🔄</button>
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

  if (password.length < 8) {
    errorEl.textContent = 'Password must be at least 8 characters';
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
    showBackupPrivateKey(response.data.privateKey, response.data.address);
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to generate wallet';
  }
}

// Show backup private key screen
function showBackupPrivateKey(privateKey: string, address: string) {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <h1>Backup Private Key</h1>
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
    // Wallet already created, just show unlock screen
    showUnlockWallet();
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

  if (password.length < 8) {
    errorEl.textContent = 'Password must be at least 8 characters';
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

    // Wallet imported, show unlock screen
    showUnlockWallet();
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
        <h1>Send HTN</h1>
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
          
          <div class="form-group">
            <label for="payload">Payload (optional)</label>
            <input type="text" id="payload" placeholder="Message or data" />
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
        <h1>Receive HTN</h1>
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
        <h1>Settings</h1>
      </div>
      
      <div class="content">
        <div class="settings">
          <button id="lockBtn" class="btn btn-secondary">Lock Wallet</button>
          <button id="resetBtn" class="btn btn-danger">Reset Wallet</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', showWallet);
  document.getElementById('lockBtn')!.addEventListener('click', handleLock);
  document.getElementById('resetBtn')!.addEventListener('click', handleReset);
}

// Handle send transaction
async function handleSendTransaction() {
  const recipient = (document.getElementById('recipient') as HTMLInputElement).value.trim();
  const amount = (document.getElementById('amount') as HTMLInputElement).value;
  const payload = (document.getElementById('payload') as HTMLInputElement).value.trim();
  const errorEl = document.getElementById('error')!;

  errorEl.textContent = '';

  if (!recipient || !amount) {
    errorEl.textContent = 'Recipient and amount are required';
    return;
  }

  try {
    // Disable button during sending
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    const originalText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    const response = await chrome.runtime.sendMessage({
      type: 'SEND_TRANSACTION',
      data: {
        to: recipient,
        amount: parseFloat(amount),
        payload: payload || undefined,
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
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Transaction';
  }
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
