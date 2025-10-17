import { APP_NAME, MIN_PASSWORD_LENGTH } from '../../shared/constants';
import { calculatePasswordStrength } from '../utils';

/**
 * Show change password screen
 */
export function showChangePasswordScreen(
  app: HTMLElement,
  onBack: () => void,
  onChangePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<void>
): void {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Change Password</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="info-box warning">
          <div class="info-icon">⚠️</div>
          <div class="info-text">
            <strong>Important:</strong> After changing your password, make sure to remember it. You cannot recover your wallet without the correct password!
          </div>
        </div>

        <div class="form">
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              placeholder="Enter current password"
              autocomplete="current-password"
            />
          </div>

          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              placeholder="Enter new password"
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label for="confirmNewPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              placeholder="Confirm new password"
              autocomplete="new-password"
            />
          </div>

          <div class="password-strength" id="passwordStrength"></div>

          <div class="error" id="error"></div>

          <button id="changePasswordBtn" class="btn btn-primary">Change Password</button>
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
      strengthDiv.textContent = '';
      return;
    }

    if (strength.score < 2) {
      strengthDiv.classList.add('weak');
      strengthDiv.textContent = '🔴 Weak password';
    } else if (strength.score < 4) {
      strengthDiv.classList.add('medium');
      strengthDiv.textContent = '🟡 Medium password';
    } else {
      strengthDiv.classList.add('strong');
      strengthDiv.textContent = '🟢 Strong password';
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

  errorEl.textContent = '';

  // Validation
  if (!currentPassword) {
    errorEl.textContent = 'Current password is required';
    return;
  }

  if (!newPassword || !confirmNewPassword) {
    errorEl.textContent = 'New password is required';
    return;
  }

  if (newPassword !== confirmNewPassword) {
    errorEl.textContent = 'New passwords do not match';
    return;
  }

  if (newPassword === currentPassword) {
    errorEl.textContent = 'New password must be different from current password';
    return;
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    errorEl.textContent = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    return;
  }

  // Check password strength
  const strength = calculatePasswordStrength(newPassword);
  if (strength.score < 3) {
    errorEl.textContent = 'Password is too weak. ' + strength.feedback.join(', ');
    return;
  }

  try {
    const changeBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
    changeBtn.disabled = true;
    changeBtn.textContent = 'Changing Password...';

    await onChangePassword(currentPassword, newPassword, confirmNewPassword);
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to change password';
    const changeBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
    changeBtn.disabled = false;
    changeBtn.textContent = 'Change Password';
  }
}
