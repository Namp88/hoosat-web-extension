import { ICONS } from '../utils/icons';
import { APP_NAME } from '../../shared/constants';
import { DAppRequest } from '../../shared/types';
import { formatTimeAgo, isRequestOld } from '../utils/ui-helpers';
import { t } from '../utils/i18n';

/**
 * Show DApp sign message request screen
 */
export function showSignMessageScreen(
  app: HTMLElement,
  request: DAppRequest,
  onApprove: () => Promise<void>,
  onReject: () => Promise<void>
): void {
  // Extract domain from origin
  const url = new URL(request.origin);
  const domain = url.hostname;

  // Truncate long messages
  const message = request.params.message;
  const displayMessage = message.length > 500 ? message.substring(0, 500) + '...' : message;

  // Format timestamp
  const timeAgo = formatTimeAgo(request.timestamp);
  const isOld = isRequestOld(request.timestamp);

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('signMessage')}</h1>
        </div>
      </div>

      <div class="content">
        <div class="dapp-request-container">
          <div class="dapp-icon">${ICONS.signature}</div>

          <div class="dapp-origin">
            <div class="dapp-origin-label">${t('siteRequestingSignature')}</div>
            <div class="dapp-origin-value">${domain}</div>
            <div class="dapp-origin-full">${request.origin}</div>
          </div>

          <div class="request-timestamp ${isOld ? 'old' : ''}">
            <span class="timestamp-icon">${ICONS.clock}</span>
            <span class="timestamp-text">${t('requestedTime')} ${timeAgo}</span>
            ${isOld ? `<span class="timestamp-warning">${ICONS.warning} ${t('oldRequestWarning')}</span>` : ''}
          </div>

          <div class="info-box info">
            <div class="info-icon">${ICONS.fileSignature}</div>
            <div class="info-text">
              <strong>${t('messageToSign')}</strong>
              <div class="message-content">${displayMessage}</div>
              ${message.length > 500 ? `<div class="message-truncated">${t('messageTruncated')}</div>` : ''}
            </div>
          </div>

          <div class="info-box warning">
            <div class="info-icon">${ICONS.info}</div>
            <div class="info-text">
              ${t('signingProveOwnership')}
              ${t('signingIsFree')}
            </div>
          </div>

          <div class="info-box critical">
            <div class="info-icon">${ICONS.warning}</div>
            <div class="info-text">
              <strong>${t('onlySignUnderstood')}</strong><br>
              ${t('maliciousSigningWarning')}
            </div>
          </div>

          <div class="error" id="error"></div>

          <div class="dapp-actions">
            <button id="rejectBtn" class="btn btn-secondary">${t('reject')}</button>
            <button id="approveBtn" class="btn btn-primary">${t('signMessage')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('rejectBtn')!.addEventListener('click', () => handleReject(onReject));
  document.getElementById('approveBtn')!.addEventListener('click', () => handleApprove(onApprove));
}

/**
 * Handle approve message signing
 */
async function handleApprove(onApprove: () => Promise<void>): Promise<void> {
  const errorEl = document.getElementById('error')!;
  const approveBtn = document.getElementById('approveBtn') as HTMLButtonElement;
  const rejectBtn = document.getElementById('rejectBtn') as HTMLButtonElement;

  try {
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    approveBtn.textContent = t('signing');

    await onApprove();
  } catch (error: any) {
    errorEl.textContent = error.message || t('failedToSignMessage');
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    approveBtn.textContent = t('signMessage');
  }
}

/**
 * Handle reject message signing
 */
async function handleReject(onReject: () => Promise<void>): Promise<void> {
  const errorEl = document.getElementById('error')!;
  const approveBtn = document.getElementById('approveBtn') as HTMLButtonElement;
  const rejectBtn = document.getElementById('rejectBtn') as HTMLButtonElement;

  try {
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    rejectBtn.textContent = t('rejecting');

    await onReject();
  } catch (error: any) {
    errorEl.textContent = error.message || t('failedToReject');
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    rejectBtn.textContent = t('reject');
  }
}
