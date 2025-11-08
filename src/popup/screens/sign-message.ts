import { ICONS } from '../utils/icons';
import { APP_NAME } from '../../shared/constants';
import { DAppRequest } from '../../shared/types';
import { formatTimeAgo, isRequestOld } from '../utils/ui-helpers';
import { t } from '../utils/i18n';
import { displayError } from '../utils/error-handler';
import { setButtonsEnabled } from '../utils/button-state';
import { createInfoInfoBox, createErrorBox } from '../components/info-box';

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
    <div class="create-import-hero">
      <!-- Static Background -->
      <div class="create-import-background">
        <div class="create-import-gradient-orb create-import-orb-1"></div>
        <div class="create-import-gradient-orb create-import-orb-2"></div>
        <div class="create-import-grid-pattern"></div>
      </div>

      <!-- Container -->
      <div class="create-import-container">
        <!-- Header -->
        <div class="create-import-header">
          <div class="hero-header-spacer"></div>
          <div class="create-import-header-title">
            <img src="icons/icon48.png" class="create-import-header-icon" alt="Hoosat" />
            <h1>${t('signMessage')}</h1>
          </div>
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          <!-- Site Info Card -->
          <div class="create-import-card hero-card-center">
            <div class="hero-icon-circle">
              ${ICONS.signature}
            </div>
            <div class="hero-meta-label">
              ${t('siteRequestingSignature')}
            </div>
            <div class="hero-domain-text">
              ${domain}
            </div>
            <div class="hero-url-text">
              ${request.origin}
            </div>
            <div class="hero-timestamp" style="margin-top: var(--spacing-md);">
              ${ICONS.clock} ${t('requestedTime')} ${timeAgo}
              ${isOld ? `<span style="color: var(--color-warning);">${ICONS.warning} ${t('oldRequestWarning')}</span>` : ''}
            </div>
          </div>

          <!-- Message to Sign -->
          ${createInfoInfoBox({
            icon: ICONS.fileSignature,
            title: t('messageToSign'),
            message: `<div class="hero-code-block" style="margin-top: var(--spacing-xs); max-height: 200px; overflow-y: auto;">${displayMessage}</div>${message.length > 500 ? `<div style="margin-top: var(--spacing-xs); font-size: var(--font-size-xs); color: var(--text-tertiary);">${t('messageTruncated')}</div>` : ''}`,
            style: 'margin-bottom: var(--spacing-md);'
          })}

          ${createInfoInfoBox({
            icon: ICONS.info,
            message: `${t('signingProveOwnership')}<br>${t('signingIsFree')}`,
            style: 'margin-bottom: var(--spacing-md);'
          })}

          ${createErrorBox({
            icon: ICONS.warning,
            title: t('onlySignUnderstood'),
            message: t('maliciousSigningWarning'),
            style: 'margin-bottom: var(--spacing-md);'
          })}

          <div class="create-import-error" id="error"></div>

          <!-- Action Buttons -->
          <div class="hero-btn-group-2col">
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
  const approveBtn = document.getElementById('approveBtn') as HTMLButtonElement;
  const rejectBtn = document.getElementById('rejectBtn') as HTMLButtonElement;

  try {
    setButtonsEnabled(['approveBtn', 'rejectBtn'], false);
    approveBtn.innerHTML = t('signing');

    await onApprove();
  } catch (error: any) {
    displayError('error', error.message || t('failedToSignMessage'));
    setButtonsEnabled(['approveBtn', 'rejectBtn'], true);
    approveBtn.innerHTML = t('signMessage');
  }
}

/**
 * Handle reject message signing
 */
async function handleReject(onReject: () => Promise<void>): Promise<void> {
  const rejectBtn = document.getElementById('rejectBtn') as HTMLButtonElement;

  try {
    setButtonsEnabled(['approveBtn', 'rejectBtn'], false);
    rejectBtn.innerHTML = t('rejecting');

    await onReject();
  } catch (error: any) {
    displayError('error', error.message || t('failedToReject'));
    setButtonsEnabled(['approveBtn', 'rejectBtn'], true);
    rejectBtn.innerHTML = t('reject');
  }
}
