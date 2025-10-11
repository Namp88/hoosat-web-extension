// Background service worker - manages wallet state and handles RPC requests

import {
  RPCMethod,
  MessageType,
  ExtensionMessage,
  DAppRequest,
  ErrorCode,
  RPCError,
  WalletData,
  TransactionHistory,
} from '../shared/types';
import {
  getCurrentWallet,
  isOriginConnected,
  addConnectedSite,
  addWallet,
  clearAllData,
  hasWallet,
  saveTransactionToHistory,
} from '../shared/storage';
import { encryptPrivateKey } from '../shared/crypto';
import { WalletManager } from './wallet-manager';
import { HoosatUtils, HoosatCrypto } from 'hoosat-sdk-web';

console.log('🦊 Hoosat Wallet background script started');

// Wallet manager instance
const walletManager = new WalletManager();

// Pending requests from DApps (waiting for user approval)
const pendingRequests = new Map<string, DAppRequest>();

// Session state (cleared on extension reload)
let isUnlocked = false;
let sessionTimeout: number | null = null;
let lastActivityTime: number = 0;

// Auto-lock after inactivity
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const GRACE_PERIOD_MS = 2 * 60 * 1000; // 2 minutes - no password needed if reopened within this time

function resetSessionTimeout() {
  lastActivityTime = Date.now();

  if (sessionTimeout) {
    clearTimeout(sessionTimeout);
  }

  sessionTimeout = setTimeout(() => {
    lockWallet();
  }, SESSION_TIMEOUT_MS);
}

function lockWallet() {
  isUnlocked = false;
  walletManager.lock();

  // Notify popup
  chrome.runtime
    .sendMessage({
      type: MessageType.WALLET_LOCKED,
    })
    .catch(() => {
      // Popup might be closed, ignore error
    });

  console.log('🔒 Wallet locked due to inactivity');
}

// Listen to messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  console.log('📨 Received message:', message.type, message.data);

  handleMessage(message, sender)
    .then(response => {
      sendResponse({ success: true, data: response });
    })
    .catch(error => {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Keep channel open for async response
});

async function handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<any> {
  const { type, data } = message;

  // Update activity time on any message (except status checks)
  if (isUnlocked && type !== 'CHECK_UNLOCK_STATUS' && type !== 'CHECK_WALLET') {
    resetSessionTimeout();
  }

  switch (type) {
    case MessageType.RPC_REQUEST:
      return handleRPCRequest(data, sender);

    case MessageType.WALLET_UNLOCKED:
      isUnlocked = true;
      resetSessionTimeout();
      return { success: true };

    case MessageType.TRANSACTION_APPROVED:
      return handleTransactionApproval(data.requestId, true);

    case MessageType.TRANSACTION_REJECTED:
      return handleTransactionApproval(data.requestId, false);

    case MessageType.CONNECTION_APPROVED:
      return handleConnectionApproval(data.requestId, true);

    case MessageType.CONNECTION_REJECTED:
      return handleConnectionApproval(data.requestId, false);

    // Popup-specific messages
    case 'GENERATE_WALLET':
      return handleGenerateWallet(data);

    case 'IMPORT_WALLET':
      return handleImportWallet(data);

    case 'UNLOCK_WALLET':
      return handleUnlockWallet(data);

    case 'LOCK_WALLET':
      return handleLockWallet();

    case 'RESET_WALLET':
      return handleResetWallet();

    case 'GET_BALANCE':
      return handleGetBalanceFromPopup(data);

    case 'SEND_TRANSACTION':
      return handleSendTransactionFromPopup(data);

    case 'ESTIMATE_FEE':
      return handleEstimateFee(data);

    case 'CHECK_WALLET':
      return handleCheckWallet();

    case 'CHECK_UNLOCK_STATUS':
      return handleCheckUnlockStatus();

    case 'CONTENT_SCRIPT_READY':
      return { success: true };

    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

// ============================================================================
// Popup Handlers
// ============================================================================

/**
 * Generate new wallet
 */
async function handleGenerateWallet(data: { password: string }): Promise<any> {
  const { password } = data;

  try {
    const keyPair = HoosatCrypto.generateKeyPair('mainnet');

    // Convert private key to hex string
    const privateKeyHex = keyPair.privateKey.toString('hex');
    const address = keyPair.address;

    // Encrypt private key
    const encryptedPrivateKey = encryptPrivateKey(privateKeyHex, password);

    // Create wallet data
    const walletData: WalletData = {
      address,
      encryptedPrivateKey,
      createdAt: Date.now(),
    };

    // Save to storage
    await addWallet(walletData);

    console.log('✅ Wallet generated:', address);

    return { address, privateKey: privateKeyHex };
  } catch (error: any) {
    console.error('❌ Failed to generate wallet:', error);
    throw new Error(error.message || 'Failed to generate wallet');
  }
}

/**
 * Import/Create wallet from private key
 */
async function handleImportWallet(data: { privateKey: string; password: string }): Promise<any> {
  const { privateKey, password } = data;

  try {
    // Validate private key format (hex string)
    if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error('Invalid private key format. Must be 64-character hex string');
    }

    // Derive address from private key using HoosatCrypto
    const keyPair = HoosatCrypto.importKeyPair(privateKey);

    if (!keyPair || !keyPair.address) {
      throw new Error('Failed to derive address from private key');
    }

    const address = keyPair.address;

    // Encrypt private key
    const encryptedPrivateKey = encryptPrivateKey(privateKey, password);

    // Create wallet data
    const walletData: WalletData = {
      address,
      encryptedPrivateKey,
      createdAt: Date.now(),
    };

    // Save to storage
    await addWallet(walletData);

    console.log('✅ Wallet imported:', address);

    return { address };
  } catch (error: any) {
    console.error('❌ Failed to import wallet:', error);
    throw new Error(error.message || 'Failed to import wallet');
  }
}

/**
 * Unlock wallet with password
 */
async function handleUnlockWallet(data: { password: string }): Promise<any> {
  const { password } = data;

  try {
    const address = await walletManager.unlock(password);
    isUnlocked = true;
    resetSessionTimeout();

    console.log('✅ Wallet unlocked via popup:', address);

    return { address };
  } catch (error: any) {
    console.error('❌ Failed to unlock wallet:', error);
    throw new Error(error.message || 'Invalid password');
  }
}

/**
 * Estimate fee for transaction from popup
 */
async function handleEstimateFee(data: { to: string; amount: number | string }): Promise<any> {
  if (!isUnlocked) {
    throw new Error('Wallet is locked');
  }

  try {
    const feeEstimate = await walletManager.estimateFee({
      to: data.to,
      amount: data.amount,
    });

    console.log('💵 Fee estimated:', feeEstimate);

    return feeEstimate;
  } catch (error: any) {
    console.error('❌ Failed to estimate fee:', error);
    throw new Error(error.message || 'Failed to estimate fee');
  }
}

/**
 * Lock wallet
 */
async function handleLockWallet(): Promise<any> {
  walletManager.lock();
  isUnlocked = false;

  if (sessionTimeout) {
    clearTimeout(sessionTimeout);
    sessionTimeout = null;
  }

  console.log('🔒 Wallet locked via popup');

  return { success: true };
}

/**
 * Reset/Delete wallet
 */
async function handleResetWallet(): Promise<any> {
  try {
    // Clear all data
    await clearAllData();

    // Lock wallet
    walletManager.lock();
    isUnlocked = false;

    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      sessionTimeout = null;
    }

    console.log('🗑️ Wallet reset');

    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to reset wallet:', error);
    throw new Error('Failed to reset wallet');
  }
}

/**
 * Get balance from popup
 */
async function handleGetBalanceFromPopup(data: { address: string }): Promise<string> {
  const { address } = data;

  try {
    const balance = await walletManager.getBalance(address);
    return balance;
  } catch (error: any) {
    console.error('❌ Failed to get balance:', error);
    throw new Error(error.message || 'Failed to get balance');
  }
}

/**
 * Send transaction from popup
 */
async function handleSendTransactionFromPopup(data: { to: string; amount: number | string; fee?: string }): Promise<string> {
  if (!isUnlocked) {
    throw new Error('Wallet is locked');
  }

  try {
    // Convert amount to sompi (smallest unit)
    const amountInSompi = typeof data.amount === 'number' ? Math.floor(data.amount * 100000000).toString() : data.amount;

    const txId = await walletManager.sendTransaction({
      to: data.to,
      amount: amountInSompi,
      fee: data.fee, // custom fee in sompi if provided
    });

    console.log('✅ Transaction sent from popup:', txId);

    // Save to history
    const wallet = await getCurrentWallet();
    if (wallet) {
      const transaction: TransactionHistory = {
        txId: txId,
        type: 'sent',
        amount: amountInSompi,
        to: data.to,
        from: wallet.address,
        timestamp: Date.now(),
        fee: data.fee, // save actual fee used
      };

      await saveTransactionToHistory(transaction);
      console.log('💾 Transaction saved to history');
    }

    return txId;
  } catch (error: any) {
    console.error('❌ Failed to send transaction:', error);
    throw new Error(error.message || 'Transaction failed');
  }
}

/**
 * Check if wallet exists
 */
async function handleCheckWallet(): Promise<any> {
  const exists = await hasWallet();
  return { exists };
}

/**
 * Check unlock status and grace period
 */
async function handleCheckUnlockStatus(): Promise<any> {
  // Check if unlocked
  if (!isUnlocked) {
    return { isUnlocked: false, inGracePeriod: false };
  }

  // Check grace period
  const timeSinceLastActivity = Date.now() - lastActivityTime;
  const inGracePeriod = timeSinceLastActivity < GRACE_PERIOD_MS;

  // Update activity time on check
  if (inGracePeriod) {
    resetSessionTimeout();
  }

  return {
    isUnlocked: true,
    inGracePeriod,
    address: walletManager.getCurrentAddress(),
  };
}

// ============================================================================
// RPC Handlers (from DApps)
// ============================================================================

async function handleRPCRequest(request: any, sender: chrome.runtime.MessageSender): Promise<any> {
  const { method, params } = request;

  // Get origin from sender
  const origin = new URL(sender.url!).origin;

  console.log(`🌐 RPC request from ${origin}: ${method}`);

  // Check if wallet is unlocked (except for some read-only methods)
  if (!isUnlocked && method !== RPCMethod.GET_NETWORK) {
    throw createRPCError(ErrorCode.UNAUTHORIZED, 'Wallet is locked');
  }

  // Reset session timeout on activity
  resetSessionTimeout();

  switch (method) {
    case RPCMethod.REQUEST_ACCOUNTS:
      return handleRequestAccounts(origin);

    case RPCMethod.GET_ACCOUNTS:
      return handleGetAccounts(origin);

    case RPCMethod.GET_BALANCE:
      return handleGetBalance(params);

    case RPCMethod.SEND_TRANSACTION:
      return handleSendTransaction(origin, params);

    case RPCMethod.GET_NETWORK:
      return handleGetNetwork();

    default:
      throw createRPCError(ErrorCode.UNSUPPORTED_METHOD, `Method not supported: ${method}`);
  }
}

async function handleRequestAccounts(origin: string): Promise<string[]> {
  // Check if already connected
  const isConnected = await isOriginConnected(origin);

  if (isConnected) {
    const wallet = await getCurrentWallet();
    return wallet ? [wallet.address] : [];
  }

  // Need user approval - create pending request
  const requestId = `connect_${Date.now()}`;
  const request: DAppRequest = {
    id: requestId,
    origin,
    method: RPCMethod.REQUEST_ACCOUNTS,
    params: {},
    timestamp: Date.now(),
  };

  pendingRequests.set(requestId, request);

  // Open popup to show connection request
  await openPopupWithRequest(requestId);

  // Wait for user response (timeout after 5 minutes)
  return waitForApproval(requestId, 5 * 60 * 1000);
}

async function handleGetAccounts(origin: string): Promise<string[]> {
  const isConnected = await isOriginConnected(origin);

  if (!isConnected) {
    return [];
  }

  const wallet = await getCurrentWallet();
  return wallet ? [wallet.address] : [];
}

async function handleGetBalance(params: any): Promise<string> {
  const { address } = params;

  if (!address) {
    throw createRPCError(ErrorCode.UNSUPPORTED_METHOD, 'Address is required');
  }

  // Get balance from blockchain
  const balance = await walletManager.getBalance(address);
  return balance;
}

async function handleSendTransaction(origin: string, params: any): Promise<string> {
  // Check if connected
  const isConnected = await isOriginConnected(origin);

  if (!isConnected) {
    throw createRPCError(ErrorCode.UNAUTHORIZED, 'Origin not connected');
  }

  // Validate params
  if (!params.to || params.amount === undefined) {
    throw createRPCError(ErrorCode.UNSUPPORTED_METHOD, 'Invalid transaction params');
  }

  // Create pending request for user approval
  const requestId = `tx_${Date.now()}`;
  const request: DAppRequest = {
    id: requestId,
    origin,
    method: RPCMethod.SEND_TRANSACTION,
    params,
    timestamp: Date.now(),
  };

  pendingRequests.set(requestId, request);

  // Open popup to show transaction request
  await openPopupWithRequest(requestId);

  // Wait for user approval (timeout after 5 minutes)
  return waitForApproval(requestId, 5 * 60 * 1000);
}

async function handleGetNetwork(): Promise<string> {
  return walletManager.getNetwork();
}

async function handleConnectionApproval(requestId: string, approved: boolean): Promise<any> {
  const request = pendingRequests.get(requestId);

  if (!request) {
    throw new Error('Request not found');
  }

  if (approved) {
    await addConnectedSite(request.origin);
    const wallet = await getCurrentWallet();

    // Resolve the promise waiting for approval
    resolveApproval(requestId, wallet ? [wallet.address] : []);
  } else {
    rejectApproval(requestId, createRPCError(ErrorCode.USER_REJECTED, 'User rejected connection'));
  }

  pendingRequests.delete(requestId);

  return { success: true };
}

async function handleTransactionApproval(requestId: string, approved: boolean): Promise<any> {
  const request = pendingRequests.get(requestId);

  if (!request) {
    throw new Error('Request not found');
  }

  if (approved) {
    // Sign and send transaction
    try {
      const txId = await walletManager.sendTransaction(request.params);

      // Save to history
      const wallet = await getCurrentWallet();
      if (wallet) {
        const amountInSompi =
          typeof request.params.amount === 'number' ? Math.floor(request.params.amount * 100000000).toString() : request.params.amount;

        const transaction: TransactionHistory = {
          txId: txId,
          type: 'sent',
          amount: amountInSompi,
          to: request.params.to,
          from: wallet.address,
          timestamp: Date.now(),
          fee: request.params.fee, // save fee if provided
        };

        await saveTransactionToHistory(transaction);
        console.log('💾 Transaction from DApp saved to history');
      }

      resolveApproval(requestId, txId);
    } catch (error: any) {
      rejectApproval(requestId, createRPCError(ErrorCode.DISCONNECTED, error.message));
    }
  } else {
    rejectApproval(requestId, createRPCError(ErrorCode.USER_REJECTED, 'User rejected transaction'));
  }

  pendingRequests.delete(requestId);

  return { success: true };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Open popup with pending request
 */
async function openPopupWithRequest(requestId: string): Promise<void> {
  // Store requestId in session for popup to fetch
  await chrome.storage.session.set({ pendingRequestId: requestId });

  // Open popup
  await chrome.action.openPopup();
}

/**
 * Create RPC error
 */
function createRPCError(code: ErrorCode, message: string): RPCError {
  return { code, message };
}

// Approval waiting mechanism
const approvalResolvers = new Map<
  string,
  {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }
>();

function waitForApproval(requestId: string, timeout: number): Promise<any> {
  return new Promise((resolve, reject) => {
    approvalResolvers.set(requestId, { resolve, reject });

    // Timeout
    setTimeout(() => {
      if (approvalResolvers.has(requestId)) {
        approvalResolvers.delete(requestId);
        reject(createRPCError(ErrorCode.USER_REJECTED, 'Request timeout'));
      }
    }, timeout);
  });
}

function resolveApproval(requestId: string, value: any) {
  const resolver = approvalResolvers.get(requestId);
  if (resolver) {
    resolver.resolve(value);
    approvalResolvers.delete(requestId);
  }
}

function rejectApproval(requestId: string, error: any) {
  const resolver = approvalResolvers.get(requestId);
  if (resolver) {
    resolver.reject(error);
    approvalResolvers.delete(requestId);
  }
}

// Export for testing
export { handleMessage, handleRPCRequest };
