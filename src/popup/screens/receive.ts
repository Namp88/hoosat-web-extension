import { ICONS } from '../utils/icons';
import { t } from '../utils/i18n';
import { HoosatQR } from 'hoosat-sdk-web';

/**
 * Show receive screen
 */
export async function showReceiveScreen(
  app: HTMLElement,
  address: string,
  onBack: () => void,
  onCopy: () => void
): Promise<void> {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">${ICONS.back}</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('receiveHTN')}</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="receive-info">
          <div class="qr-container">
            <div id="qrCode" class="qr-code-loading">${t('loading')}</div>
          </div>
          <h3>${t('yourAddress')}</h3>
          <div class="address-display">${address}</div>
          <button id="copyBtn" class="btn btn-primary">${t('copyAddress')}</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('copyBtn')!.addEventListener('click', onCopy);

  // Generate QR code asynchronously
  try {
    const qrDataUrl = await HoosatQR.generateAddressQR(address, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    const qrContainer = document.getElementById('qrCode');
    if (qrContainer) {
      qrContainer.className = 'qr-code';
      qrContainer.innerHTML = `<img src="${qrDataUrl}" alt="QR Code" />`;
    }
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    const qrContainer = document.getElementById('qrCode');
    if (qrContainer) {
      qrContainer.className = 'qr-code-error';
      qrContainer.textContent = 'QR code generation failed';
    }
  }
}
