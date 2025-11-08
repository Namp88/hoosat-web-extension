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
    <div class="create-import-hero">
      <!-- Static Background -->
      <div class="create-import-background">
        <div class="create-import-gradient-orb create-import-orb-1"></div>
        <div class="create-import-gradient-orb create-import-orb-2"></div>
        <div class="create-import-grid-pattern"></div>
      </div>

      <!-- Container -->
      <div class="create-import-container">
        <!-- Header -->
        <div class="create-import-header">
          <div class="hero-header-spacer"></div>
          <div class="create-import-header-title">
            <img src="icons/icon48.png" class="create-import-header-icon" alt="Hoosat" />
            <h1>${t('backupPrivateKey')}</h1>
          </div>
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          <!-- Critical Warning Info Box -->
          <div class="hero-info-box error">
            <div class="hero-info-box-icon">${ICONS.key}</div>
            <div>
              <strong>${t('saveThisPrivateKey')}</strong><br>
              ${t('writeItDownWarning')}
            </div>
          </div>

          <!-- Key Display Card -->
          <div class="create-import-card">
            <div class="create-import-form-group">
              <label>${t('yourPrivateKey')}</label>
              <div class="hero-code-block mb-md" id="keyValue">${privateKey}</div>
              <button id="copyKeyBtn" class="btn btn-secondary btn-full-width">${ICONS.copy} ${t('copyToClipboard')}</button>
            </div>

            <div class="create-import-form-group">
              <label>${t('yourAddress')}</label>
              <div class="hero-code-block" id="addressValue">${address}</div>
            </div>

            <label class="backup-confirm-label">
              <input type="checkbox" id="confirmBackup" class="backup-confirm-checkbox" />
              <span class="backup-confirm-text">${t('confirmBackup')}</span>
            </label>

            <button id="continueBtn" class="btn btn-primary create-import-submit-btn" disabled>${t('continue')}</button>
          </div>
        </div>
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
