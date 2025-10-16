import { APP_NAME } from '../../shared/constants';

/**
 * Show welcome screen with Create/Import wallet options
 */
export function showWelcomeScreen(
  app: HTMLElement,
  onCreateNew: () => void,
  onImport: () => void
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
        <div class="welcome">
          <h2>Welcome!</h2>
          <p>Choose how to get started</p>
        </div>

        <div class="wallet-options">
          <button id="createNewBtn" class="btn btn-primary wallet-option-btn">
            <div class="option-icon">🔑</div>
            <div class="option-text">
              <div class="option-title">Create New Wallet</div>
              <div class="option-desc">Generate a new wallet</div>
            </div>
          </button>

          <button id="importBtn" class="btn btn-secondary wallet-option-btn">
            <div class="option-icon">📥</div>
            <div class="option-text">
              <div class="option-title">Import Existing Wallet</div>
              <div class="option-desc">Use your private key</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('createNewBtn')!.addEventListener('click', onCreateNew);
  document.getElementById('importBtn')!.addEventListener('click', onImport);
}
