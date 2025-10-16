import { RPCMethod, DAppRequest, ErrorCode, RPCError, TransactionHistory } from '../../shared/types';
import { getCurrentWallet, isOriginConnected, addConnectedSite, saveTransactionToHistory } from '../../shared/storage';
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
  walletManager: WalletManager
): Promise<any> {
  const { method, params } = request;

  // Get origin from sender
  const origin = new URL(sender.url!).origin;

  console.log(`🌐 RPC request from ${origin}: ${method}`);

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
  walletManager: WalletManager
): Promise<{ success: boolean }> {
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
          typeof request.params.amount === 'number' ? Math.floor(request.params.amount * SOMPI_PER_HTN).toString() : request.params.amount;

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
