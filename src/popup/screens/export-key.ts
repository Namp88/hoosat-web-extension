import { APP_NAME } from '../../shared/constants';

/**
 * Show export private key screen with password verification
 */
export function showExportKeyScreen(
  app: HTMLElement,
  onBack: () => void,
  onExport: (password: string) => Promise<{ privateKey: string; address: string }>
): void {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Export Private Key</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="info-box critical">
          <div class="info-icon">⚠️</div>
          <div class="info-text">
            <strong>Security Warning!</strong><br>
            Never share your private key with anyone. Anyone with access to your private key can steal your funds!
          </div>
        </div>

        <div class="form">
          <div class="form-group">
            <label for="password">Enter Password to Confirm</label>
            <input type="password" id="password" placeholder="Enter your password" autocomplete="off" />
          </div>

          <div class="error" id="error"></div>

          <button id="exportBtn" class="btn btn-primary">Show Private Key</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('exportBtn')!.addEventListener('click', () => handleExportPrivateKey(onExport, onBack));

  // Enter key handler
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  passwordInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleExportPrivateKey(onExport, onBack);
    }
  });

  // Focus password field
  passwordInput.focus();
}

/**
 * Handle export private key request
 */
async function handleExportPrivateKey(
  onExport: (password: string) => Promise<{ privateKey: string; address: string }>,
  onBack: () => void
): Promise<void> {
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const errorEl = document.getElementById('error')!;

  errorEl.textContent = '';

  if (!password) {
    errorEl.textContent = 'Password is required';
    return;
  }

  try {
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    exportBtn.disabled = true;
    exportBtn.textContent = 'Verifying...';

    const result = await onExport(password);

    // Show the private key
    showPrivateKeyExported(result.privateKey, result.address, onBack);
  } catch (error: any) {
    errorEl.textContent = error.message || 'Invalid password';
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    exportBtn.disabled = false;
    exportBtn.textContent = 'Show Private Key';
  }
}

/**
 * Show exported private key with security warnings
 */
function showPrivateKeyExported(privateKey: string, address: string, onBack: () => void): void {
  let isKeyVisible = false;

  const app = document.getElementById('app')!;

  const renderScreen = () => {
    app.innerHTML = `
      <div class="screen">
        <div class="header">
          <button id="backBtn" class="btn-icon">←</button>
          <div class="header-center">
            <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
            <h1>Your Private Key</h1>
          </div>
          <div style="width: 32px;"></div>
        </div>

        <div class="content">
          <div class="info-box critical">
            <div class="info-icon">🔐</div>
            <div class="info-text">
              <strong>Keep this key safe!</strong><br>
              Anyone with this key can access your funds. Store it securely and never share it.
            </div>
          </div>

          <div class="key-display">
            <label>Your Address</label>
            <div class="key-value small">${address}</div>
          </div>

          <div class="key-display">
            <label>Private Key (Hex)</label>
            <div class="key-value ${!isKeyVisible ? 'key-hidden' : ''}" id="keyValue">
              ${isKeyVisible ? privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
            </div>
            <button id="toggleKeyBtn" class="btn btn-secondary">
              ${isKeyVisible ? '🙈 Hide Key' : '👁️ Show Key'}
            </button>
          </div>

          ${
            isKeyVisible
              ? `
          <button id="copyKeyBtn" class="btn btn-primary">📋 Copy to Clipboard</button>
          `
              : ''
          }

          <div class="info-box warning" style="margin-top: 20px;">
            <div class="info-icon">💡</div>
            <div class="info-text">
              <strong>Best Practices:</strong><br>
              • Write it down on paper and store in a safe place<br>
              • Use a password manager (encrypted)<br>
              • Never store in plain text files<br>
              • Never send via email or messaging apps
            </div>
          </div>

          <button id="doneBtn" class="btn btn-secondary" style="margin-top: 12px;">Done</button>
        </div>
      </div>
    `;

    document.getElementById('backBtn')!.addEventListener('click', onBack);
    document.getElementById('doneBtn')!.addEventListener('click', onBack);

    document.getElementById('toggleKeyBtn')!.addEventListener('click', () => {
      isKeyVisible = !isKeyVisible;
      renderScreen();
    });

    if (isKeyVisible) {
      document.getElementById('copyKeyBtn')!.addEventListener('click', () => {
        navigator.clipboard.writeText(privateKey).then(() => {
          const btn = document.getElementById('copyKeyBtn')!;
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied to Clipboard!';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        });
      });
    }
  };

  renderScreen();
}
