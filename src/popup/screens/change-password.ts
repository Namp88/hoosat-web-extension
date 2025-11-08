import { MIN_PASSWORD_LENGTH } from '../../shared/constants';
import { addPasswordStrengthIndicator, validateAndCheckPasswordStrength } from '../utils';
import { t, tn } from '../utils/i18n';
import { ICONS } from '../utils/icons';
import { displayError, clearError, validatePasswordMatch } from '../utils/error-handler';
import { addEnterKeyHandler } from '../utils/keyboard';
import { executeWithButtonLoading } from '../utils/button-state';
import { createWarningBox } from '../components/info-box';

/**
 * Show change password screen
 */
export function showChangePasswordScreen(
  app: HTMLElement,
  onBack: () => void,
  onChangePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<void>
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
            <h1>${t('changePasswordTitle')}</h1>
          </div>
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          ${createWarningBox({
            icon: ICONS.warning,
            title: t('important'),
            message: t('changePasswordWarning')
          })}

          <!-- Form Card -->
          <div class="create-import-card">
            <div class="create-import-form-group">
              <label for="currentPassword">${t('currentPassword')}</label>
              <input
                type="password"
                id="currentPassword"
                placeholder="${t('enterCurrentPassword')}"
                autocomplete="current-password"
              />
            </div>

            <div class="create-import-form-group">
              <label for="newPassword">${t('newPassword')}</label>
              <input
                type="password"
                id="newPassword"
                placeholder="${t('enterNewPassword')}"
                autocomplete="new-password"
              />
            </div>

            <div class="create-import-form-group">
              <label for="confirmNewPassword">${t('confirmNewPassword')}</label>
              <input
                type="password"
                id="confirmNewPassword"
                placeholder="${t('confirmNewPasswordPlaceholder')}"
                autocomplete="new-password"
              />
            </div>

            <div class="create-import-password-strength" id="passwordStrength"></div>

            <div class="create-import-error" id="error"></div>

            <button id="changePasswordBtn" class="btn btn-primary create-import-submit-btn">${t('changePasswordButton')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('changePasswordBtn')!.addEventListener('click', () => handleChangePassword(onChangePassword));

  // Enter key handler
  addEnterKeyHandler('confirmNewPassword', () => handleChangePassword(onChangePassword));

  // Focus current password field
  (document.getElementById('currentPassword') as HTMLInputElement).focus();

  // Password strength indicator
  addPasswordStrengthIndicator('newPassword', 'passwordStrength');
}

/**
 * Handle change password request
 */
async function handleChangePassword(
  onChangePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<void>
): Promise<void> {
  const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
  const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
  const confirmNewPassword = (document.getElementById('confirmNewPassword') as HTMLInputElement).value;

  clearError('error');

  // Validation
  if (!currentPassword) {
    displayError('error', t('currentPasswordRequired'));
    return;
  }

  if (!newPassword || !confirmNewPassword) {
    displayError('error', t('newPasswordRequired'));
    return;
  }

  if (!validatePasswordMatch(newPassword, confirmNewPassword, 'error')) {
    displayError('error', t('newPasswordsDoNotMatch'));
    return;
  }

  if (newPassword === currentPassword) {
    displayError('error', t('newPasswordMustBeDifferent'));
    return;
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    displayError('error', tn('passwordMustBeAtLeast', MIN_PASSWORD_LENGTH.toString()));
    return;
  }

  // Use unified validation with strength check
  const validation = validateAndCheckPasswordStrength(newPassword);
  if (!validation.valid) {
    displayError('error', validation.error!);
    return;
  }

  await executeWithButtonLoading(
    {
      buttonId: 'changePasswordBtn',
      loadingText: t('changingPassword'),
      originalText: t('changePasswordButton'),
      errorElementId: 'error',
      errorMessage: t('failedToChangePassword')
    },
    () => onChangePassword(currentPassword, newPassword, confirmNewPassword)
  );
}
