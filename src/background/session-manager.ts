import { MessageType } from '../shared/types';
import { GRACE_PERIOD } from '../shared/constants';
import { getAutoLockSettings } from '../shared/storage';
import { WalletManager } from './wallet-manager';

export class SessionManager {
  private isUnlocked = false;
  private sessionTimeout: number | null = null;
  private lastActivityTime = 0;
  private walletManager: WalletManager;
  private timeoutMinutes = 30; // Default timeout in minutes

  constructor(walletManager: WalletManager) {
    this.walletManager = walletManager;
    this.loadSettings();
  }

  /**
   * Load auto-lock settings
   */
  private async loadSettings(): Promise<void> {
    try {
      const settings = await getAutoLockSettings();
      this.timeoutMinutes = settings.timeoutMinutes;
    } catch (error) {
      console.error('Failed to load auto-lock settings:', error);
    }
  }

  /**
   * Mark wallet as unlocked and start session timeout
   */
  unlock(): void {
    this.isUnlocked = true;
    this.resetTimeout();
  }

  /**
   * Lock the wallet
   */
  lock(): void {
    this.isUnlocked = false;
    this.walletManager.lock();

    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }

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

  /**
   * Reset session timeout on activity
   */
  resetTimeout(): void {
    this.lastActivityTime = Date.now();

    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    const timeoutMs = this.timeoutMinutes * 60 * 1000;
    this.sessionTimeout = setTimeout(() => {
      this.lock();
    }, timeoutMs) as any;
  }

  /**
   * Update timeout setting (called when user changes setting)
   */
  async updateTimeoutSetting(minutes: number): Promise<void> {
    this.timeoutMinutes = minutes;

    // If wallet is unlocked, reset timeout with new duration
    if (this.isUnlocked) {
      this.resetTimeout();
    }
  }

  /**
   * Check if wallet is unlocked
   */
  getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Get unlock status with grace period info
   */
  getUnlockStatus(): { isUnlocked: boolean; inGracePeriod: boolean; address: string | null } {
    if (!this.isUnlocked) {
      return { isUnlocked: false, inGracePeriod: false, address: null };
    }

    // Check grace period
    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    const inGracePeriod = timeSinceLastActivity < GRACE_PERIOD;

    // Update activity time on check if in grace period
    if (inGracePeriod) {
      this.resetTimeout();
    }

    return {
      isUnlocked: true,
      inGracePeriod,
      address: this.walletManager.getCurrentAddress(),
    };
  }

  /**
   * Update activity time (call on user interactions)
   */
  updateActivity(): void {
    if (this.isUnlocked) {
      this.resetTimeout();
    }
  }
}
