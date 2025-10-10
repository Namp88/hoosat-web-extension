import { getCurrentWallet } from '../shared/storage';
import { decryptPrivateKey } from '../shared/crypto';
import { DEFAULT_NODE_URL, DEFAULT_NETWORK } from '../shared/constants';
import type { Network } from '../shared/constants';
import type { UnlockedWallet } from '../shared/types';
import { HoosatTxBuilder, HoosatUtils, HoosatWebClient, HoosatCrypto } from 'hoosat-sdk-web';

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
   * Calculate transaction fee
   */
  private calculateFee(inputs: number, outputs: number): string {
    return HoosatCrypto.calculateFee(inputs, outputs);
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
      const amountSompi = typeof params.amount === 'string' ? params.amount : Math.floor(params.amount * 100000000).toString();

      console.log('💸 Sending transaction:', {
        to: params.to,
        amount: amountSompi,
        payload: params.payload,
      });

      // Get UTXOs for current wallet
      const utxos = await this.getUtxos(this.unlockedWallet.address);

      if (!utxos || utxos.length === 0) {
        throw new Error('No UTXOs available');
      }

      // Calculate total available balance
      const totalAvailable = utxos.reduce((sum, utxo) => {
        return sum + BigInt(utxo.utxoEntry.amount);
      }, BigInt(0));

      console.log('💰 Total available:', totalAvailable.toString(), 'sompi');
      console.log('📊 UTXOs count:', utxos.length);

      // Calculate fee (assume we'll have change output)
      const numInputs = utxos.length;
      const numOutputs = 2; // recipient + change
      const estimatedFee = this.calculateFee(numInputs, numOutputs);

      console.log('💵 Estimated fee:', estimatedFee, 'sompi for', numInputs, 'inputs and', numOutputs, 'outputs');

      // Check if we have enough funds (amount + fee)
      const totalRequired = BigInt(amountSompi) + BigInt(estimatedFee);

      if (totalAvailable < totalRequired) {
        throw new Error(
          `Insufficient funds. Available: ${totalAvailable} sompi, Required: ${totalRequired} sompi (${amountSompi} + ${estimatedFee} fee)`
        );
      }

      // Calculate change
      const change = totalAvailable - totalRequired;
      console.log('💵 Change:', change.toString(), 'sompi');

      // Build transaction
      const txBuilder = new HoosatTxBuilder({ debug: false });

      // Add inputs with private key (IMPORTANT!)
      for (const utxo of utxos) {
        txBuilder.addInput(utxo, this.unlockedWallet.privateKey);
      }

      // Add output (recipient)
      txBuilder.addOutput(params.to, amountSompi);

      // Set fee
      txBuilder.setFee(estimatedFee);

      // Add change output
      txBuilder.addChangeOutput(this.unlockedWallet.address);

      // Add payload if provided
      if (params.payload) {
        console.log('📝 Payload:', params.payload);
        // Payload might need special handling depending on SDK version
      }

      // Sign transaction (NO parameters - keys already in inputs!)
      console.log('✍️ Signing transaction...');
      const signedTx = txBuilder.sign();

      // Add payload to signed transaction if provided
      if (params.payload && signedTx) {
        signedTx.payload = params.payload;
      }

      // Submit transaction
      console.log('📤 Submitting transaction...');
      const result = await this.client.submitTransaction(signedTx);

      if (!result || !result.transactionId) {
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
