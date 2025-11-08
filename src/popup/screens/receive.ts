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
    <div class="receive-hero">
      <!-- Static Background -->
      <div class="receive-background">
        <div class="receive-gradient-orb receive-orb-1"></div>
        <div class="receive-gradient-orb receive-orb-2"></div>
        <div class="receive-grid-pattern"></div>
      </div>

      <!-- Container -->
      <div class="receive-container">
        <!-- Header -->
        <div class="receive-header">
          <button id="backBtn" class="receive-back-btn">${ICONS.back}</button>
          <div class="receive-header-title">
            <img src="icons/icon48.png" class="receive-header-icon" alt="Hoosat" />
            <h1>${t('receiveHTN')}</h1>
          </div>
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="receive-content">
          <!-- QR Card -->
          <div class="receive-qr-card">
            <div class="receive-qr-container">
              <div id="qrCode" class="receive-qr-code-loading">${t('loading')}</div>
            </div>

            <div class="receive-address-label">${t('yourAddress')}</div>
            <div class="receive-address-value">${address}</div>

            <button id="copyBtn" class="btn btn-primary receive-copy-btn">
              ${ICONS.copy} ${t('copyAddress')}
            </button>
          </div>
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
      qrContainer.className = 'receive-qr-code';
      qrContainer.innerHTML = `<img src="${qrDataUrl}" alt="QR Code" />`;
    }
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    const qrContainer = document.getElementById('qrCode');
    if (qrContainer) {
      qrContainer.className = 'receive-qr-code-error';
      qrContainer.innerHTML = `${ICONS.error} ${t('qrCodeGenerationFailed')}`;
    }
  }
}
