import { APP_NAME } from '../../shared/constants';
import { MessageType } from '../../shared/types';

/**
 * Show backup private key screen after wallet generation
 */
export function showBackupPrivateKey(
  app: HTMLElement,
  privateKey: string,
  address: string,
  password: string,
  onContinue: () => Promise<void>
): void {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-left">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Backup Private Key</h1>
        </div>
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
    try {
      // Auto-unlock with the password
      const unlockResponse = await chrome.runtime.sendMessage({
        type: 'UNLOCK_WALLET',
        data: { password },
      });

      if (!unlockResponse.success) {
        throw new Error(unlockResponse.error);
      }

      // Notify background that wallet is unlocked
      await chrome.runtime.sendMessage({
        type: MessageType.WALLET_UNLOCKED,
      });

      // Continue to wallet
      await onContinue();
    } catch (error: any) {
      console.error('Failed to unlock after wallet creation:', error);
      throw error;
    }
  });
}
