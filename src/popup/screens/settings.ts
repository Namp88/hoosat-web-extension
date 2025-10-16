import { APP_NAME } from '../../shared/constants';

/**
 * Show settings screen
 */
export function showSettingsScreen(
  app: HTMLElement,
  onBack: () => void,
  onChangePassword: () => void,
  onExportKey: () => void,
  onConnectedSites: () => void,
  onReset: () => void
): void {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Settings</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="settings">
          <button id="connectedSitesBtn" class="btn btn-secondary">🔗 Connected Sites</button>
          <button id="changePasswordBtn" class="btn btn-secondary">🔑 Change Password</button>
          <button id="exportKeyBtn" class="btn btn-secondary">📤 Export Private Key</button>
          <button id="resetBtn" class="btn btn-danger">🗑️ Reset Wallet</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('connectedSitesBtn')!.addEventListener('click', onConnectedSites);
  document.getElementById('changePasswordBtn')!.addEventListener('click', onChangePassword);
  document.getElementById('exportKeyBtn')!.addEventListener('click', onExportKey);
  document.getElementById('resetBtn')!.addEventListener('click', onReset);
}
