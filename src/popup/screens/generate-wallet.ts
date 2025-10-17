import { APP_NAME } from '../../shared/constants';
import { validatePassword, calculatePasswordStrength, addPasswordStrengthIndicator } from '../utils';

/**
 * Show generate new wallet screen
 */
export function showGenerateWalletScreen(
  app: HTMLElement,
  onBack: () => void,
  onGenerate: (password: string, confirmPassword: string) => Promise<void>
): void {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Create New Wallet</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="info-box warning">
          <div class="info-icon">⚠️</div>
          <div class="info-text">
            <strong>Important:</strong> Save your private key securely. You'll need it to restore your wallet. Never share it with anyone!
          </div>
        </div>

        <div class="form">
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Create password" autocomplete="new-password" />
          </div>

          <div class="password-strength" id="passwordStrength"></div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" placeholder="Confirm password" autocomplete="new-password" />
          </div>

          <div class="password-requirements">
            <div class="requirements-title">Password must contain:</div>
            <ul>
              <li>At least 8 characters</li>
              <li>One uppercase letter (A-Z)</li>
              <li>One lowercase letter (a-z)</li>
              <li>One number (0-9)</li>
            </ul>
          </div>

          <div class="error" id="error"></div>

          <button id="generateBtn" class="btn btn-primary">Generate Wallet</button>
        </div>
      </div>
    </div>
  `;

  const handleGenerate = async () => {
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
    const errorEl = document.getElementById('error')!;

    errorEl.textContent = '';

    // Validation
    if (!password || !confirmPassword) {
      errorEl.textContent = 'Password is required';
      return;
    }

    if (password !== confirmPassword) {
      errorEl.textContent = 'Passwords do not match';
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
      errorEl.textContent = 'Password is too weak. ' + strength.feedback.slice(0, 2).join(', ');
      return;
    }

    try {
      await onGenerate(password, confirmPassword);
    } catch (error: any) {
      errorEl.textContent = error.message || 'Failed to generate wallet';
    }
  };

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('generateBtn')!.addEventListener('click', handleGenerate);

  // Enter key handler
  document.getElementById('confirmPassword')!.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleGenerate();
    }
  });

  // Add password strength indicator
  addPasswordStrengthIndicator('password', 'passwordStrength');
}
