// Main popup entry point - router for all screens
import { hasWallet } from '../shared/storage';
import { MessageType } from '../shared/types';
import * as api from '../shared/api/messages';
import { showSuccessMessage } from './utils';
import {
  showWelcomeScreen,
  showGenerateWalletScreen,
  showImportWalletScreen,
  showUnlockScreen,
  showWalletScreen,
  showSendScreen,
  showReceiveScreen,
  showSettingsScreen,
  showChangePasswordScreen,
  showExportKeyScreen,
  showDAppConnectionScreen,
  showDAppTransactionScreen,
  getCurrentBalance,
  getCurrentAddress,
} from './screens';
import { showBackupPrivateKey, showConfirmDialog } from './components';

console.log('🦊 Hoosat Wallet popup loaded');

// State
let isUnlocked = false;

// DOM Elements
const app = document.getElementById('app')!;

// Initialize popup
async function init() {
  console.log('Initializing popup...');

  // Check if wallet exists
  const walletExists = await hasWallet();

  if (!walletExists) {
    showWelcome();
    return;
  }

  // Check if wallet is unlocked (in background)
  try {
    const status = await api.checkUnlockStatus();

    if (status.isUnlocked) {
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
    try {
      // Get request data from background
      const request = await api.getPendingRequest(session.pendingRequestId);

      // Show appropriate approval screen
      await handlePendingRequest(request);
      return;
    } catch (error) {
      console.error('Failed to handle pending request:', error);
      // Clear invalid request and continue
      await chrome.storage.session.remove('pendingRequestId');
    }
  }

  showUnlock();
}

// ============================================================================
// DApp Request Handling
// ============================================================================

/**
 * Handle pending DApp request
 */
async function handlePendingRequest(request: any): Promise<void> {
  const { method } = request;

  if (method === 'hoosat_requestAccounts') {
    // Connection request
    showDAppConnectionScreen(
      app,
      request,
      () => handleConnectionApprove(request.id),
      () => handleConnectionReject(request.id)
    );
  } else if (method === 'hoosat_sendTransaction') {
    // Transaction request - need to ensure wallet is unlocked
    if (!isUnlocked) {
      // Show unlock first
      showUnlock();
      // TODO: After unlock, show transaction approval
      return;
    }

    // Get balance and estimate fee
    const balance = await api.getBalance(getCurrentAddress()!);
    const feeEstimate = await api.estimateFee(request.params.to, request.params.amount);

    showDAppTransactionScreen(
      app,
      request,
      balance,
      feeEstimate.fee,
      () => handleTransactionApprove(request.id),
      () => handleTransactionReject(request.id)
    );
  }
}

/**
 * Handle connection approve
 */
async function handleConnectionApprove(requestId: string): Promise<void> {
  await api.approveConnection(requestId);
  await chrome.storage.session.remove('pendingRequestId');
  showSuccessMessage('✅ Site connected successfully!', 2000);

  // Go to wallet screen
  setTimeout(() => {
    showWallet();
  }, 2000);
}

/**
 * Handle connection reject
 */
async function handleConnectionReject(requestId: string): Promise<void> {
  await api.rejectConnection(requestId);
  await chrome.storage.session.remove('pendingRequestId');
  showSuccessMessage('❌ Connection rejected', 2000);

  // Go back to normal flow
  setTimeout(() => {
    init();
  }, 2000);
}

/**
 * Handle transaction approve
 */
async function handleTransactionApprove(requestId: string): Promise<void> {
  await api.approveTransaction(requestId);
  await chrome.storage.session.remove('pendingRequestId');
  showSuccessMessage('✅ Transaction approved!', 2000);

  // Go to wallet screen
  setTimeout(() => {
    showWallet();
  }, 2000);
}

/**
 * Handle transaction reject
 */
async function handleTransactionReject(requestId: string): Promise<void> {
  await api.rejectTransaction(requestId);
  await chrome.storage.session.remove('pendingRequestId');
  showSuccessMessage('❌ Transaction rejected', 2000);

  // Go to wallet screen
  setTimeout(() => {
    showWallet();
  }, 2000);
}

// ============================================================================
// Screen Routers
// ============================================================================

/**
 * Show welcome screen
 */
function showWelcome() {
  showWelcomeScreen(app, showGenerate, showImport);
}

/**
 * Show generate wallet screen
 */
function showGenerate() {
  showGenerateWalletScreen(app, showWelcome, handleGenerateWallet);
}

/**
 * Show import wallet screen
 */
function showImport() {
  showImportWalletScreen(app, showWelcome, handleImportWallet);
}

/**
 * Show unlock screen
 */
function showUnlock() {
  showUnlockScreen(app, handleUnlock);
}

/**
 * Show main wallet screen
 */
async function showWallet() {
  await showWalletScreen(app, showSend, showReceive, handleLock, showSettings);
}

/**
 * Show send screen
 */
function showSend() {
  const balance = getCurrentBalance();
  showSendScreen(app, balance, showWallet, handleSendSuccess);
}

/**
 * Show receive screen
 */
function showReceive() {
  const address = getCurrentAddress();
  if (!address) {
    console.error('No address available');
    return;
  }
  showReceiveScreen(app, address, showWallet, copyAddress);
}

/**
 * Show settings screen
 */
function showSettings() {
  showSettingsScreen(app, showWallet, showChangePassword, showExportKey, handleReset);
}

/**
 * Show change password screen
 */
function showChangePassword() {
  showChangePasswordScreen(app, showSettings, handleChangePassword);
}

/**
 * Show export key screen
 */
function showExportKey() {
  showExportKeyScreen(app, showSettings, handleExportPrivateKey);
}

// ============================================================================
// Action Handlers
// ============================================================================

/**
 * Handle generate wallet
 */
async function handleGenerateWallet(password: string, confirmPassword: string): Promise<void> {
  const response = await api.generateWallet(password);

  // Show the generated private key
  showBackupPrivateKey(app, response.privateKey, response.address, password, async () => {
    isUnlocked = true;
    await showWallet();
    showSuccessMessage('🎉 Wallet created successfully!', 2000);
  });
}

/**
 * Handle import wallet
 */
async function handleImportWallet(privateKey: string, password: string, confirmPassword: string): Promise<void> {
  await api.importWallet(privateKey, password);

  // Auto-unlock with the password user just entered
  await api.unlockWallet(password);

  // Notify background that wallet is unlocked
  await api.notifyWalletUnlocked();

  isUnlocked = true;

  // Show wallet directly
  await showWallet();
  showSuccessMessage('🎉 Wallet imported successfully!', 2000);
}

/**
 * Handle unlock
 */
async function handleUnlock(password: string): Promise<void> {
  await api.unlockWallet(password);

  // Notify background
  await api.notifyWalletUnlocked();

  isUnlocked = true;

  // Show wallet
  await showWallet();
}

/**
 * Handle send success
 */
async function handleSendSuccess(txId: string): Promise<void> {
  await showWallet();
  // Show success message after returning to wallet
  showSuccessMessage(`Transaction sent! TX ID: ${txId.substring(0, 16)}...`);
}

/**
 * Copy address to clipboard
 */
function copyAddress(): void {
  const address = getCurrentAddress();
  if (!address) return;

  navigator.clipboard.writeText(address).then(() => {
    const btn = document.getElementById('copyBtn');
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 1000);
    }
  });
}

/**
 * Handle change password
 */
async function handleChangePassword(currentPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
  await api.changePassword(currentPassword, newPassword);

  // Show success and return to settings
  await showSettings();
  showSuccessMessage('🎉 Password changed successfully!', 3000);
}

/**
 * Handle export private key
 */
async function handleExportPrivateKey(password: string): Promise<{ privateKey: string; address: string }> {
  return await api.exportPrivateKey(password);
}

/**
 * Handle lock wallet
 */
async function handleLock(): Promise<void> {
  await api.lockWallet();
  isUnlocked = false;
  showUnlock();
}

/**
 * Handle reset wallet
 */
async function handleReset(): Promise<void> {
  const confirmed = await showConfirmDialog(
    'Reset Wallet',
    'Are you sure? This will delete your wallet. Make sure you have backed up your private key!'
  );

  if (confirmed) {
    await api.resetWallet();
    showWelcome();
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', init);
