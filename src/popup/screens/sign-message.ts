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
          <div style="width: 32px;"></div>
          <div class="create-import-header-title">
            <img src="icons/icon48.png" class="create-import-header-icon" alt="Hoosat" />
            <h1>${t('signMessage')}</h1>
          </div>
          <div style="width: 32px;"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          <!-- Site Info Card -->
          <div class="create-import-card" style="text-align: center; margin-bottom: var(--spacing-md);">
            <div style="width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; background: rgba(20, 184, 166, 0.15); border: 2px solid rgba(20, 184, 166, 0.3); border-radius: 50%; margin: 0 auto var(--spacing-md); font-size: 36px; color: var(--color-hoosat-teal);">
              ${ICONS.signature}
            </div>
            <div style="margin-bottom: var(--spacing-xs); font-size: var(--font-size-sm); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">
              ${t('siteRequestingSignature')}
            </div>
            <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--text-primary); margin-bottom: var(--spacing-xs);">
              ${domain}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); word-break: break-all;">
              ${request.origin}
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: var(--spacing-xs); margin-top: var(--spacing-md); font-size: var(--font-size-xs); color: var(--text-tertiary);">
              ${ICONS.clock} ${t('requestedTime')} ${timeAgo}
              ${isOld ? `<span style="color: #eab308;">${ICONS.warning} ${t('oldRequestWarning')}</span>` : ''}
            </div>
          </div>

          <!-- Message to Sign -->
          <div class="hero-info-box" style="margin-bottom: var(--spacing-md);">
            <div class="hero-info-box-icon">${ICONS.fileSignature}</div>
            <div>
              <strong>${t('messageToSign')}</strong>
              <div style="margin-top: var(--spacing-xs); padding: var(--spacing-sm); background: rgba(15, 23, 42, 0.6); border-radius: var(--radius-sm); font-family: monospace; font-size: var(--font-size-xs); word-break: break-all; max-height: 200px; overflow-y: auto;">${displayMessage}</div>
              ${message.length > 500 ? `<div style="margin-top: var(--spacing-xs); font-size: var(--font-size-xs); color: var(--text-tertiary);">${t('messageTruncated')}</div>` : ''}
            </div>
          </div>

          <!-- Info Box -->
          <div class="hero-info-box" style="margin-bottom: var(--spacing-md);">
            <div class="hero-info-box-icon">${ICONS.info}</div>
            <div>
              ${t('signingProveOwnership')}<br>
              ${t('signingIsFree')}
            </div>
          </div>

          <!-- Security Warning Info Box -->
          <div class="hero-info-box error" style="margin-bottom: var(--spacing-md);">
            <div class="hero-info-box-icon">${ICONS.warning}</div>
            <div>
              <strong>${t('onlySignUnderstood')}</strong><br>
              ${t('maliciousSigningWarning')}
            </div>
          </div>

          <div class="create-import-error" id="error"></div>

          <!-- Action Buttons -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
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
    errorEl.innerHTML = `${ICONS.error} ${error.message || t('failedToSignMessage')}`;
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
    errorEl.innerHTML = `${ICONS.error} ${error.message || t('failedToReject')}`;
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    rejectBtn.textContent = t('reject');
  }
}
