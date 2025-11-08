import { ICONS } from '../utils/icons';
import { addPasswordStrengthIndicator, validateAndCheckPasswordStrength } from '../utils';
import { t } from '../utils/i18n';
import { displayError, clearError, validatePasswordMatch } from '../utils/error-handler';
import { addEnterKeyHandler } from '../utils/keyboard';
import { executeWithButtonLoading } from '../utils/button-state';

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
          <div class="hero-header-spacer"></div>
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

    clearError('error');

    // Validation
    if (!privateKey) {
      displayError('error', t('privateKeyRequired'));
      return;
    }

    if (!password || !confirmPassword) {
      displayError('error', t('passwordRequired'));
      return;
    }

    if (!validatePasswordMatch(password, confirmPassword, 'error')) {
      displayError('error', t('passwordsDoNotMatch'));
      return;
    }

    // Use unified validation with strength check
    const validation = validateAndCheckPasswordStrength(password);
    if (!validation.valid) {
      displayError('error', validation.error!);
      return;
    }

    await executeWithButtonLoading(
      {
        buttonId: 'importWalletBtn',
        loadingText: `${ICONS.spinner} ${t('importing')}`,
        originalText: t('importWalletButton'),
        errorElementId: 'error',
        errorMessage: t('failedToImportWallet')
      },
      () => onImport(privateKey, password, confirmPassword)
    );
  };

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('importWalletBtn')!.addEventListener('click', handleImport);

  // Enter key handler
  addEnterKeyHandler('confirmPassword', handleImport);

  // Add password strength indicator
  addPasswordStrengthIndicator('password', 'passwordStrength');
}
