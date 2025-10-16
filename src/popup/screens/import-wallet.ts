import { APP_NAME } from '../../shared/constants';
import { validatePassword, calculatePasswordStrength, addPasswordStrengthIndicator } from '../utils';

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
          <h1>Import Wallet</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="form">
          <div class="form-group">
            <label for="privateKey">Private Key (hex)</label>
            <input type="text" id="privateKey" placeholder="Enter your private key" autocomplete="off" />
          </div>

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

          <button id="importWalletBtn" class="btn btn-primary">Import Wallet</button>
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
      errorEl.textContent = 'Private key is required';
      return;
    }

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
      await onImport(privateKey, password, confirmPassword);
    } catch (error: any) {
      errorEl.textContent = error.message || 'Failed to import wallet';
    }
  };

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('importWalletBtn')!.addEventListener('click', handleImport);

  // Enter key handler
  document.getElementById('confirmPassword')!.addEventListener('keypress', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleImport();
    }
  });

  // Add password strength indicator
  addPasswordStrengthIndicator('password', 'passwordStrength');
}
