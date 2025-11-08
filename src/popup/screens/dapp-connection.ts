import { DAppRequest } from '../../shared/types';
import { formatTimeAgo, isRequestOld, t } from '../utils';
import { ICONS } from '../utils/icons';
import { displayError } from '../utils/error-handler';
import { setButtonsEnabled } from '../utils/button-state';
import { createWarningBox, createErrorBox } from '../components/info-box';
/**
 * Show DApp connection request screen
 */
export function showDAppConnectionScreen(
  app: HTMLElement,
  request: DAppRequest,
  onApprove: () => Promise<void>,
  onReject: () => Promise<void>
): void {
  // Extract domain from origin
  const url = new URL(request.origin);
  const domain = url.hostname;

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
            <h1>${t('connectionRequest')}</h1>
          </div>
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          <!-- Site Info Card -->
          <div class="create-import-card hero-card-center">
            <div class="hero-icon-circle">
              ${ICONS.globe}
            </div>
            <div class="hero-meta-label">
              ${t('siteRequestingConnection')}
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

          ${createWarningBox({
            icon: ICONS.warning,
            title: t('thisSiteWillBeAbleTo'),
            listItems: [
              t('viewYourWalletAddress'),
              t('requestTransactionApprovals'),
              t('viewAccountBalance')
            ]
          })}

          ${createErrorBox({
            icon: ICONS.lock,
            title: t('onlyConnectTrustedSites'),
            message: t('maliciousSitesWarning')
          })}

          <div class="create-import-error" id="error" style="margin: 0;"></div>

          <!-- Action Buttons -->
          <div class="hero-btn-group-2col">
            <button id="rejectBtn" class="btn btn-secondary">${t('reject')}</button>
            <button id="approveBtn" class="btn btn-primary">${t('connect')}</button>
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
 * Handle approve connection
 */
async function handleApprove(onApprove: () => Promise<void>): Promise<void> {
  const approveBtn = document.getElementById('approveBtn') as HTMLButtonElement;

  try {
    setButtonsEnabled(['approveBtn', 'rejectBtn'], false);
    approveBtn.innerHTML = t('connecting');

    await onApprove();
  } catch (error: any) {
    displayError('error', error.message || t('failedToApproveConnection'));
    setButtonsEnabled(['approveBtn', 'rejectBtn'], true);
    approveBtn.innerHTML = t('connect');
  }
}

/**
 * Handle reject connection
 */
async function handleReject(onReject: () => Promise<void>): Promise<void> {
  const rejectBtn = document.getElementById('rejectBtn') as HTMLButtonElement;

  try {
    setButtonsEnabled(['approveBtn', 'rejectBtn'], false);
    rejectBtn.innerHTML = t('rejecting');

    await onReject();
  } catch (error: any) {
    displayError('error', error.message || t('failedToRejectConnection'));
    setButtonsEnabled(['approveBtn', 'rejectBtn'], true);
    rejectBtn.innerHTML = t('reject');
  }
}
