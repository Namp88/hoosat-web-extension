import { t } from '../utils/i18n';

export interface UnlockContext {
  title?: string; // Custom title instead of "Unlock Wallet"
  message?: string; // Additional message to show
  origin?: string; // DApp origin if this is a DApp request
}

/**
 * Show unlock wallet screen
 */
export function showUnlockScreen(
  app: HTMLElement,
  onUnlock: (password: string) => Promise<void>,
  context?: UnlockContext
): void {
  const title = context?.title || t('unlockWallet');

  // Extract domain from origin if provided
  let domain = null;
  if (context?.origin) {
    try {
      domain = new URL(context.origin).hostname;
    } catch (e) {
      domain = context.origin;
    }
  }

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-left">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('appName')}</h1>
        </div>
      </div>

      <div class="content">
        <div class="unlock-form">
          ${
            context?.origin
              ? `
          <div class="dapp-origin" style="margin-bottom: 20px;">
            <div class="dapp-origin-label">${t('requestFrom')}</div>
            <div class="dapp-origin-value">${domain}</div>
            <div class="dapp-origin-full">${context.origin}</div>
          </div>
          `
              : ''
          }

          <h2>${title}</h2>

          ${
            context?.message
              ? `
          <div class="info-box warning" style="margin-bottom: 20px;">
            <div class="info-icon">🔐</div>
            <div class="info-text">${context.message}</div>
          </div>
          `
              : ''
          }

          <div class="form-group">
            <label for="password">${t('password')}</label>
            <input type="password" id="password" placeholder="${t('enterPassword')}" autocomplete="current-password" />
          </div>

          <div class="error" id="error"></div>

          <button type="button" id="unlockBtn" class="btn btn-primary">${t('unlock')}</button>
        </div>
      </div>
    </div>
  `;

  const handleUnlockAction = async () => {
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const errorEl = document.getElementById('error')!;

    errorEl.textContent = '';

    if (!password) {
      errorEl.textContent = t('passwordRequired');
      return;
    }

    try {
      await onUnlock(password);
    } catch (error: any) {
      errorEl.textContent = error.message || t('invalidPassword');
    }
  };

  // Button click handler
  document.getElementById('unlockBtn')!.addEventListener('click', handleUnlockAction);

  // Auto-focus password field
  const passwordInput = document.getElementById('password') as HTMLInputElement;

  // Enter key handler
  passwordInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleUnlockAction();
    }
  });

  passwordInput.focus();
}
