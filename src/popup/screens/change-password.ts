import { MIN_PASSWORD_LENGTH } from '../../shared/constants';
import { calculatePasswordStrength } from '../utils';
import { t, tn } from '../utils/i18n';
import { ICONS } from '../utils/icons';

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
          <div style="width: 32px;"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          <!-- Warning Info Box -->
          <div class="hero-info-box warning">
            <div class="hero-info-box-icon">${ICONS.warning}</div>
            <div>
              <strong>${t('important')}</strong> ${t('changePasswordWarning')}
            </div>
          </div>

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
  document.getElementById('confirmNewPassword')!.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleChangePassword(onChangePassword);
    }
  });

  // Focus current password field
  (document.getElementById('currentPassword') as HTMLInputElement).focus();

  // Password strength indicator
  const newPasswordInput = document.getElementById('newPassword') as HTMLInputElement;
  const strengthDiv = document.getElementById('passwordStrength')!;

  newPasswordInput.addEventListener('input', () => {
    const password = newPasswordInput.value;
    const strength = calculatePasswordStrength(password);

    strengthDiv.className = 'password-strength';

    if (password.length === 0) {
      strengthDiv.innerHTML = '';
      return;
    }

    if (strength.score < 2) {
      strengthDiv.classList.add('weak');
      strengthDiv.innerHTML = `${ICONS.statusRed} ${t('weakPassword')}`;
    } else if (strength.score < 4) {
      strengthDiv.classList.add('medium');
      strengthDiv.innerHTML = `${ICONS.statusYellow} ${t('mediumPassword')}`;
    } else {
      strengthDiv.classList.add('strong');
      strengthDiv.innerHTML = `${ICONS.statusGreen} ${t('strongPassword')}`;
    }
  });
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
  const errorEl = document.getElementById('error')!;

  errorEl.innerHTML = '';

  // Validation
  if (!currentPassword) {
    errorEl.innerHTML = `${ICONS.warning} ${t('currentPasswordRequired')}`;
    return;
  }

  if (!newPassword || !confirmNewPassword) {
    errorEl.innerHTML = `${ICONS.warning} ${t('newPasswordRequired')}`;
    return;
  }

  if (newPassword !== confirmNewPassword) {
    errorEl.innerHTML = `${ICONS.warning} ${t('newPasswordsDoNotMatch')}`;
    return;
  }

  if (newPassword === currentPassword) {
    errorEl.innerHTML = `${ICONS.warning} ${t('newPasswordMustBeDifferent')}`;
    return;
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    errorEl.innerHTML = `${ICONS.warning} ${tn('passwordMustBeAtLeast', MIN_PASSWORD_LENGTH.toString())}`;
    return;
  }

  // Check password strength
  const strength = calculatePasswordStrength(newPassword);
  if (strength.score < 3) {
    errorEl.innerHTML = `${ICONS.warning} ${t('passwordTooWeak')} ${strength.feedback.join(', ')}`;
    return;
  }

  try {
    const changeBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
    changeBtn.disabled = true;
    changeBtn.textContent = t('changingPassword');

    await onChangePassword(currentPassword, newPassword, confirmNewPassword);
  } catch (error: any) {
    errorEl.innerHTML = `${ICONS.error} ${error.message || t('failedToChangePassword')}`;
    const changeBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
    changeBtn.disabled = false;
    changeBtn.textContent = t('changePasswordButton');
  }
}
