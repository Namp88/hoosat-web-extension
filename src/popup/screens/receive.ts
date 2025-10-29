import { t } from '../utils/i18n';

/**
 * Show receive screen
 */
export function showReceiveScreen(
  app: HTMLElement,
  address: string,
  onBack: () => void,
  onCopy: () => void
): void {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('receiveHTN')}</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="receive-info">
          <h3>${t('yourAddress')}</h3>
          <div class="address-display">${address}</div>
          <button id="copyBtn" class="btn btn-primary">${t('copyAddress')}</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('copyBtn')!.addEventListener('click', onCopy);
}
