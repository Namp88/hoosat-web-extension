import { APP_NAME } from '../../shared/constants';

/**
 * Show unlock wallet screen
 */
export function showUnlockScreen(
  app: HTMLElement,
  onUnlock: (password: string) => Promise<void>
): void {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-left">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${APP_NAME}</h1>
        </div>
      </div>

      <div class="content">
        <div class="unlock-form">
          <h2>Unlock Wallet</h2>

          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Enter password" />
          </div>

          <div class="error" id="error"></div>

          <button id="unlockBtn" class="btn btn-primary">Unlock</button>
        </div>
      </div>
    </div>
  `;

  const handleUnlockAction = async () => {
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const errorEl = document.getElementById('error')!;

    errorEl.textContent = '';

    if (!password) {
      errorEl.textContent = 'Password is required';
      return;
    }

    try {
      await onUnlock(password);
    } catch (error: any) {
      errorEl.textContent = error.message || 'Invalid password';
    }
  };

  // Click handler
  document.getElementById('unlockBtn')!.addEventListener('click', handleUnlockAction);

  // Enter key handler
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  passwordInput.addEventListener('keypress', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlockAction();
    }
  });

  // Auto-focus password field
  passwordInput.focus();
}
