import { TransactionHistory } from '../../shared/types';
import { getCurrentWallet, saveTransactionToHistory } from '../../shared/storage';
import { WalletManager } from '../wallet-manager';

/**
 * Get balance from popup
 */
export async function handleGetBalance(data: { address: string }, walletManager: WalletManager): Promise<string> {
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
 * Estimate fee for transaction from popup
 */
export async function handleEstimateFee(
  data: { to: string; amount: number | string },
  walletManager: WalletManager
): Promise<any> {
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
 * Send transaction from popup
 */
export async function handleSendTransaction(
  data: { to: string; amount: number | string; fee?: string },
  walletManager: WalletManager
): Promise<string> {
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
