import { getCurrentWallet } from '../shared/storage';
import { decryptPrivateKey } from '../shared/crypto';
import { DEFAULT_NODE_URL, DEFAULT_NETWORK } from '../shared/constants';
import type { Network } from '../shared/constants';
import type { UnlockedWallet } from '../shared/types';
import { HoosatTxBuilder, HoosatUtils, HoosatWebClient } from 'hoosat-sdk-web';

export class WalletManager {
  private client: HoosatWebClient;
  private network: Network;
  private unlockedWallet: UnlockedWallet | null = null;

  constructor() {
    this.network = DEFAULT_NETWORK;
    this.client = new HoosatWebClient({
      baseUrl: 'https://proxy.hoosat.net/api/v1',
      timeout: 30000,
      debug: true,
    });

    console.log('✅ WalletManager initialized');
  }

  private getNodeHost(): string {
    const url = new URL(DEFAULT_NODE_URL);
    return url.hostname;
  }

  private getNodePort(): number {
    const url = new URL(DEFAULT_NODE_URL);
    return parseInt(url.port) || 42420;
  }

  /**
   * Unlock wallet with password
   */
  async unlock(password: string): Promise<string> {
    const walletData = await getCurrentWallet();

    if (!walletData) {
      throw new Error('No wallet found');
    }

    try {
      // Decrypt private key
      const privateKeyHex = decryptPrivateKey(walletData.encryptedPrivateKey, password);

      // Convert hex string to Buffer (now available via webpack polyfill)
      const privateKey = Buffer.from(privateKeyHex, 'hex');

      // Store in memory for session
      this.unlockedWallet = {
        address: walletData.address,
        privateKey,
      };

      console.log('🔓 Wallet unlocked:', walletData.address);
      return walletData.address;
    } catch (error: any) {
      throw new Error('Invalid password');
    }
  }

  /**
   * Lock wallet (clear from memory)
   */
  lock(): void {
    this.unlockedWallet = null;
    console.log('🔒 Wallet locked');
  }

  /**
   * Check if wallet is unlocked
   */
  isUnlocked(): boolean {
    return this.unlockedWallet !== null;
  }

  /**
   * Get balance for address
   */
  async getBalance(address: string): Promise<string> {
    try {
      const result = await this.client.getBalance(address);

      if (!result) {
        throw new Error('Failed to get balance');
      }

      return result.balance;
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get UTXOs for address
   */
  async getUtxos(address: string) {
    try {
      const result = await this.client.getUtxos([address]);

      if (!result) {
        throw new Error('Failed to get UTXOs');
      }

      return result.utxos;
    } catch (error: any) {
      throw new Error(`Failed to get UTXOs: ${error.message}`);
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(params: { to: string; amount: number | string; payload?: string }): Promise<string> {
    if (!this.unlockedWallet) {
      throw new Error('Wallet is locked');
    }

    try {
      // Validate recipient address
      if (!HoosatUtils.isValidAddress(params.to)) {
        throw new Error('Invalid recipient address');
      }

      // Convert amount to sompi if needed
      const amountSompi = typeof params.amount === 'string' ? params.amount : params.amount.toString();

      // Get UTXOs for current wallet
      const utxos = await this.getUtxos(this.unlockedWallet.address);

      if (!utxos || utxos.length === 0) {
        throw new Error('No UTXOs available');
      }

      // Build transaction
      const txBuilder = new HoosatTxBuilder({ debug: false });

      // Add inputs (UTXOs)
      for (const utxo of utxos) {
        txBuilder.addInput({
          outpoint: utxo.outpoint,
          utxoEntry: {
            amount: utxo.utxoEntry.amount,
            scriptPublicKey: {
              script: utxo.utxoEntry.scriptPublicKey.script,
              version: utxo.utxoEntry.scriptPublicKey.version,
            },
            blockDaaScore: utxo.utxoEntry.blockDaaScore,
            isCoinbase: utxo.utxoEntry.isCoinbase,
          },
        });
      }

      // Add output (recipient)
      txBuilder.addOutput(params.to, amountSompi);

      // Add change output
      txBuilder.addChangeOutput(this.unlockedWallet.address);

      // Estimate and set fee
      const estimatedFee = txBuilder.estimateFee();
      txBuilder.setFee(estimatedFee);

      // Add payload if provided
      if (params.payload) {
        // Payload will be added in transaction structure
        // For now, hoosat-sdk TxBuilder doesn't have explicit addPayload method
        // We'll need to add it to the transaction after building
      }

      // Sign transaction
      const signedTx = txBuilder.sign(this.unlockedWallet.privateKey);

      // Add payload to signed transaction if provided
      if (params.payload) {
        signedTx.payload = params.payload;
      }

      // Submit transaction
      const result = await this.client.submitTransaction(signedTx);

      if (!result) {
        throw new Error('Failed to submit transaction');
      }

      console.log('✅ Transaction sent:', result.transactionId);
      return result.transactionId;
    } catch (error: any) {
      console.error('❌ Failed to send transaction:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get current network
   */
  getNetwork(): string {
    return this.network;
  }

  /**
   * Get current address (if unlocked)
   */
  getCurrentAddress(): string | null {
    return this.unlockedWallet?.address || null;
  }

  /**
   * Sign message (for future use)
   */
  async signMessage(message: string): Promise<string> {
    if (!this.unlockedWallet) {
      throw new Error('Wallet is locked');
    }

    // TODO: Implement message signing using HoosatCrypto
    throw new Error('Message signing not implemented yet');
  }
}
