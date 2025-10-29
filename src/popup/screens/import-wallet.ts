import { validatePassword, calculatePasswordStrength, addPasswordStrengthIndicator } from '../utils';
import { t } from '../utils/i18n';

/**
 * Show import wallet screen
 */
export function showImportWalletScreen(
  app: HTMLElement,
  onBack: () => void,
  onImport: (privateKey: string, password: string, confirmPassword: string) => Promise<void>
): void {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('importWallet')}</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="form">
          <div class="form-group">
            <label for="privateKey">${t('privateKeyHex')}</label>
            <input type="text" id="privateKey" placeholder="${t('enterPrivateKey')}" autocomplete="off" />
          </div>

          <div class="form-group">
            <label for="password">${t('password')}</label>
            <input type="password" id="password" placeholder="${t('createPassword')}" autocomplete="new-password" />
          </div>

          <div class="password-strength" id="passwordStrength"></div>

          <div class="form-group">
            <label for="confirmPassword">${t('confirmPassword')}</label>
            <input type="password" id="confirmPassword" placeholder="${t('confirmPasswordPlaceholder')}" autocomplete="new-password" />
          </div>

          <div class="password-requirements">
            <div class="requirements-title">${t('passwordRequirements')}</div>
            <ul>
              <li>${t('passwordReq8Chars')}</li>
              <li>${t('passwordReqUppercase')}</li>
              <li>${t('passwordReqLowercase')}</li>
              <li>${t('passwordReqNumber')}</li>
            </ul>
          </div>

          <div class="error" id="error"></div>

          <button id="importWalletBtn" class="btn btn-primary">${t('importWalletButton')}</button>
        </div>
      </div>
    </div>
  `;

  const handleImport = async () => {
    const privateKey = (document.getElementById('privateKey') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
    const errorEl = document.getElementById('error')!;

    errorEl.textContent = '';

    // Validation
    if (!privateKey) {
      errorEl.textContent = t('privateKeyRequired');
      return;
    }

    if (!password || !confirmPassword) {
      errorEl.textContent = t('passwordRequired');
      return;
    }

    if (password !== confirmPassword) {
      errorEl.textContent = t('passwordsDoNotMatch');
      return;
    }

    // Use unified validation
    const validation = validatePassword(password);
    if (!validation.valid) {
      errorEl.textContent = validation.error!;
      return;
    }

    // Check strength (warn if too weak)
    const strength = calculatePasswordStrength(password);
    if (strength.score < 3) {
      errorEl.textContent = t('passwordTooWeak') + ' ' + strength.feedback.slice(0, 2).join(', ');
      return;
    }

    try {
      await onImport(privateKey, password, confirmPassword);
    } catch (error: any) {
      errorEl.textContent = error.message || t('failedToImportWallet');
    }
  };

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('importWalletBtn')!.addEventListener('click', handleImport);

  // Enter key handler
  document.getElementById('confirmPassword')!.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleImport();
    }
  });

  // Add password strength indicator
  addPasswordStrengthIndicator('password', 'passwordStrength');
}
