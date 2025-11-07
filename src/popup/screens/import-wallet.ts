import { ICONS } from '../utils/icons';
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
          <button id="backBtn" class="create-import-back-btn">${ICONS.back}</button>
          <div class="create-import-header-title">
            <img src="icons/icon48.png" class="create-import-header-icon" alt="Hoosat" />
            <h1>${t('importWallet')}</h1>
          </div>
          <div style="width: 32px;"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          <!-- Form Card -->
          <div class="create-import-card">
            <div class="create-import-form-group">
              <label for="privateKey">${t('privateKeyHex')}</label>
              <input type="text" id="privateKey" placeholder="${t('enterPrivateKey')}" autocomplete="off" />
            </div>

            <div class="create-import-form-group">
              <label for="password">${t('password')}</label>
              <input type="password" id="password" placeholder="${t('createPassword')}" autocomplete="new-password" />
            </div>

            <div class="create-import-password-strength" id="passwordStrength"></div>

            <div class="create-import-form-group">
              <label for="confirmPassword">${t('confirmPassword')}</label>
              <input type="password" id="confirmPassword" placeholder="${t('confirmPasswordPlaceholder')}" autocomplete="new-password" />
            </div>

            <div class="create-import-password-requirements">
              <div class="create-import-requirements-title">${t('passwordRequirements')}</div>
              <ul>
                <li>${t('passwordReq8Chars')}</li>
                <li>${t('passwordReqUppercase')}</li>
                <li>${t('passwordReqLowercase')}</li>
                <li>${t('passwordReqNumber')}</li>
              </ul>
            </div>

            <div class="create-import-error" id="error"></div>

            <button id="importWalletBtn" class="btn btn-primary create-import-submit-btn">${t('importWalletButton')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const handleImport = async () => {
    const privateKey = (document.getElementById('privateKey') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
    const errorEl = document.getElementById('error')!;

    errorEl.innerHTML = '';

    // Validation
    if (!privateKey) {
      errorEl.innerHTML = `${ICONS.warning} ${t('privateKeyRequired')}`;
      return;
    }

    if (!password || !confirmPassword) {
      errorEl.innerHTML = `${ICONS.warning} ${t('passwordRequired')}`;
      return;
    }

    if (password !== confirmPassword) {
      errorEl.innerHTML = `${ICONS.warning} ${t('passwordsDoNotMatch')}`;
      return;
    }

    // Use unified validation
    const validation = validatePassword(password);
    if (!validation.valid) {
      errorEl.innerHTML = `${ICONS.warning} ${validation.error!}`;
      return;
    }

    // Check strength (warn if too weak)
    const strength = calculatePasswordStrength(password);
    if (strength.score < 3) {
      errorEl.innerHTML = `${ICONS.warning} ${t('passwordTooWeak')} ${strength.feedback.slice(0, 2).join(', ')}`;
      return;
    }

    try {
      await onImport(privateKey, password, confirmPassword);
    } catch (error: any) {
      errorEl.innerHTML = `${ICONS.error} ${error.message || t('failedToImportWallet')}`;
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
