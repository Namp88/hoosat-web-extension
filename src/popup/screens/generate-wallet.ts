import { ICONS } from '../utils/icons';
import { addPasswordStrengthIndicator, validateAndCheckPasswordStrength } from '../utils';
import { t } from '../utils/i18n';
import { displayError, clearError, validatePasswordMatch } from '../utils/error-handler';
import { addEnterKeyHandler } from '../utils/keyboard';
import { executeWithButtonLoading } from '../utils/button-state';
import { createWarningBox } from '../components/info-box';

/**
 * Show generate new wallet screen
 */
export function showGenerateWalletScreen(
  app: HTMLElement,
  onBack: () => void,
  onGenerate: (password: string, confirmPassword: string) => Promise<void>
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
            <h1>${t('createNewWalletTitle')}</h1>
          </div>
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          ${createWarningBox({
            icon: ICONS.warning,
            title: t('important'),
            message: t('savePrivateKeyWarning')
          })}

          <!-- Form Card -->
          <div class="create-import-card">
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

            <button id="generateBtn" class="btn btn-primary create-import-submit-btn">${t('generateWallet')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const handleGenerate = async () => {
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

    clearError('error');

    // Validation
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
        buttonId: 'generateBtn',
        loadingText: `${ICONS.spinner} ${t('generating')}`,
        originalText: t('generateWallet'),
        errorElementId: 'error',
        errorMessage: t('failedToGenerateWallet')
      },
      () => onGenerate(password, confirmPassword)
    );
  };

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('generateBtn')!.addEventListener('click', handleGenerate);

  // Enter key handler
  addEnterKeyHandler('confirmPassword', handleGenerate);

  // Add password strength indicator
  addPasswordStrengthIndicator('password', 'passwordStrength');
}
