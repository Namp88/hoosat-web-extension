// Popup UI script - main wallet interface

import { hasWallet, getCurrentWallet, loadWallet } from '../shared/storage';
import { MessageType } from '../shared/types';
import { APP_NAME } from '../shared/constants';

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
  } else {
    // Check if there's a pending request
    const session = await chrome.storage.session.get('pendingRequestId');

    if (session.pendingRequestId) {
      showPendingRequest(session.pendingRequestId);
    } else {
      showUnlockWallet();
    }
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
          <p>Create a new wallet to get started</p>
        </div>
        
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
          
          <button id="createBtn" class="btn btn-primary">Create Wallet</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('createBtn')!.addEventListener('click', handleCreateWallet);
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
            <p class="empty">No transactions yet</p>
          </div>
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

// Handle create wallet
async function handleCreateWallet() {
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
    // Import wallet (will be implemented in background)
    const response = await chrome.runtime.sendMessage({
      type: 'IMPORT_WALLET',
      data: { privateKey, password },
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    // Wallet created, show unlock screen
    showUnlockWallet();
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to create wallet';
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

    // Show success and return to wallet
    alert(`Transaction sent! TX ID: ${response.data}`);
    await showWallet();
  } catch (error: any) {
    errorEl.textContent = error.message || 'Transaction failed';
  }
}

// Handle lock wallet
async function handleLock() {
  await chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });
  isUnlocked = false;
  showUnlockWallet();
}

// Handle reset wallet
async function handleReset() {
  if (confirm('Are you sure? This will delete your wallet. Make sure you have backed up your private key!')) {
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
