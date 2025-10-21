import { RPCMethod, DAppRequest, ErrorCode, RPCError, TransactionHistory } from '../../shared/types';
import { getCurrentWallet, isOriginConnected, addConnectedSite, removeConnectedSite, saveTransactionToHistory } from '../../shared/storage';
import { SOMPI_PER_HTN } from '../../shared/constants';
import { WalletManager } from '../wallet-manager';

// Pending requests from DApps (waiting for user approval)
const pendingRequests = new Map<string, DAppRequest>();

/**
 * Get pending request by ID (for popup)
 */
export function getPendingRequest(requestId: string): DAppRequest | undefined {
  return pendingRequests.get(requestId);
}

// Approval waiting mechanism
const approvalResolvers = new Map<
  string,
  {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }
>();

/**
 * Handle RPC request from DApp
 */
export async function handleRPCRequest(
  request: any,
  sender: chrome.runtime.MessageSender,
  walletManager: WalletManager,
  sessionManager?: any
): Promise<any> {
  const { method, params } = request;

  // Get origin from sender
  const origin = new URL(sender.url!).origin;

  console.log(`🌐 RPC request from ${origin}: ${method}`);

  // Check if wallet needs to be unlocked for this method
  // Note: SEND_TRANSACTION and SIGN_MESSAGE are not in this list because we want
  // to open popup and let user unlock there, then approve the request
  const requiresUnlock: RPCMethod[] = [
    // Add methods here that should be rejected immediately if wallet is locked
    // (currently empty - all sensitive operations go through popup approval)
  ];

  if (requiresUnlock.includes(method as RPCMethod) && sessionManager && !sessionManager.getIsUnlocked()) {
    throw createRPCError(ErrorCode.UNAUTHORIZED, 'Wallet is locked. Please unlock your wallet first.');
  }

  switch (method) {
    case RPCMethod.REQUEST_ACCOUNTS:
      return handleRequestAccounts(origin);

    case RPCMethod.GET_ACCOUNTS:
      return handleGetAccounts(origin);

    case RPCMethod.GET_BALANCE:
      return handleGetBalanceRPC(params, walletManager);

    case RPCMethod.SEND_TRANSACTION:
      return handleSendTransactionRPC(origin, params);

    case RPCMethod.GET_NETWORK:
      return handleGetNetwork(walletManager);

    case RPCMethod.SIGN_MESSAGE:
      return handleSignMessageRPC(origin, params);

    case RPCMethod.DISCONNECT:
      return handleDisconnectRPC(origin);

    default:
      throw createRPCError(ErrorCode.UNSUPPORTED_METHOD, `Method not supported: ${method}`);
  }
}

/**
 * Request accounts (connection approval)
 */
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

/**
 * Get accounts (read-only)
 */
async function handleGetAccounts(origin: string): Promise<string[]> {
  const isConnected = await isOriginConnected(origin);

  if (!isConnected) {
    return [];
  }

  const wallet = await getCurrentWallet();
  return wallet ? [wallet.address] : [];
}

/**
 * Get balance via RPC
 */
async function handleGetBalanceRPC(params: any, walletManager: WalletManager): Promise<string> {
  const { address } = params;

  if (!address) {
    throw createRPCError(ErrorCode.UNSUPPORTED_METHOD, 'Address is required');
  }

  // Get balance from blockchain
  const balance = await walletManager.getBalance(address);
  return balance;
}

/**
 * Send transaction via RPC
 */
async function handleSendTransactionRPC(origin: string, params: any): Promise<string> {
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

/**
 * Get network
 */
async function handleGetNetwork(walletManager: WalletManager): Promise<string> {
  return walletManager.getNetwork();
}

/**
 * Disconnect wallet from origin
 */
async function handleDisconnectRPC(origin: string): Promise<{ success: boolean }> {
  // Check if connected
  const isConnected = await isOriginConnected(origin);

  if (!isConnected) {
    console.log(`🔌 Origin ${origin} was not connected`);
    return { success: true }; // Already disconnected
  }

  // Remove connected site
  await removeConnectedSite(origin);
  console.log(`🔌 Disconnected origin: ${origin}`);

  return { success: true };
}

/**
 * Sign message via RPC
 */
async function handleSignMessageRPC(origin: string, params: any): Promise<string> {
  // Check if connected
  const isConnected = await isOriginConnected(origin);

  if (!isConnected) {
    throw createRPCError(ErrorCode.UNAUTHORIZED, 'Origin not connected');
  }

  // Validate params
  if (!params.message || typeof params.message !== 'string') {
    throw createRPCError(ErrorCode.UNSUPPORTED_METHOD, 'Invalid message parameter');
  }

  // Create pending request for user approval
  const requestId = `sign_${Date.now()}`;
  const request: DAppRequest = {
    id: requestId,
    origin,
    method: RPCMethod.SIGN_MESSAGE,
    params,
    timestamp: Date.now(),
  };

  pendingRequests.set(requestId, request);

  // Open popup to show sign message request
  await openPopupWithRequest(requestId);

  // Wait for user approval (timeout after 5 minutes)
  return waitForApproval(requestId, 5 * 60 * 1000);
}

/**
 * Handle connection approval
 */
export async function handleConnectionApproval(requestId: string, approved: boolean): Promise<{ success: boolean }> {
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

/**
 * Handle transaction approval
 */
export async function handleTransactionApproval(
  requestId: string,
  approved: boolean,
  walletManager: WalletManager,
  customFeeSompi?: string
): Promise<{ success: boolean }> {
  const request = pendingRequests.get(requestId);

  if (!request) {
    throw new Error('Request not found');
  }

  if (approved) {
    // Sign and send transaction
    try {
      // Use custom fee if provided, otherwise use fee from request params
      const txParams = {
        ...request.params,
        fee: customFeeSompi || request.params.fee,
      };

      const txId = await walletManager.sendTransaction(txParams);

      // Save to history
      const wallet = await getCurrentWallet();
      if (wallet) {
        const amountInSompi =
          typeof request.params.amount === 'number' ? Math.floor(request.params.amount * SOMPI_PER_HTN).toString() : request.params.amount;

        const transaction: TransactionHistory = {
          txId: txId,
          type: 'sent',
          amount: amountInSompi,
          to: request.params.to,
          from: wallet.address,
          timestamp: Date.now(),
          fee: customFeeSompi || request.params.fee, // save actual fee used
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

/**
 * Handle sign message approval
 */
export async function handleSignMessageApproval(
  requestId: string,
  approved: boolean,
  walletManager: WalletManager
): Promise<{ success: boolean }> {
  const request = pendingRequests.get(requestId);

  if (!request) {
    throw new Error('Request not found');
  }

  if (approved) {
    try {
      const signature = await walletManager.signMessage(request.params.message);
      resolveApproval(requestId, signature);
    } catch (error: any) {
      rejectApproval(requestId, createRPCError(ErrorCode.DISCONNECTED, error.message));
    }
  } else {
    rejectApproval(requestId, createRPCError(ErrorCode.USER_REJECTED, 'User rejected message signing'));
  }

  pendingRequests.delete(requestId);

  return { success: true };
}

/**
 * Helper functions
 */

function createRPCError(code: ErrorCode, message: string): RPCError {
  return { code, message };
}

async function openPopupWithRequest(requestId: string): Promise<void> {
  // Store requestId in session for popup to fetch
  await chrome.storage.session.set({ pendingRequestId: requestId });

  // Open popup
  await chrome.action.openPopup();
}

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
