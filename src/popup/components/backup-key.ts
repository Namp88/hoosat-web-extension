import { MessageType } from '../../shared/types';
import { t } from '../utils/i18n';
import { ICONS } from '../utils/icons';

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
          <h1>${t('backupPrivateKey')}</h1>
        </div>
      </div>

      <div class="content">
        <div class="info-box critical">
          <div class="info-icon">${ICONS.key}</div>
          <div class="info-text">
            <strong>${t('saveThisPrivateKey')}</strong><br>
            ${t('writeItDownWarning')}
          </div>
        </div>

        <div class="key-display">
          <label>${t('yourPrivateKey')}</label>
          <div class="key-value" id="keyValue">${privateKey}</div>
          <button id="copyKeyBtn" class="btn btn-secondary icon-with-text">${ICONS.copy} ${t('copyToClipboard')}</button>
        </div>

        <div class="key-display">
          <label>${t('yourAddress')}</label>
          <div class="key-value small" id="addressValue">${address}</div>
        </div>

        <div class="backup-confirm">
          <label class="checkbox-label">
            <input type="checkbox" id="confirmBackup" />
            <span>${t('confirmBackup')}</span>
          </label>
        </div>

        <button id="continueBtn" class="btn btn-primary" disabled>${t('continue')}</button>
      </div>
    </div>
  `;

  // Copy button
  document.getElementById('copyKeyBtn')!.addEventListener('click', () => {
    navigator.clipboard.writeText(privateKey).then(() => {
      const btn = document.getElementById('copyKeyBtn')!;
      const originalText = btn.innerHTML;
      btn.innerHTML = `${ICONS.check} ${t('copied')}`;
      setTimeout(() => {
        btn.innerHTML = originalText;
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
