import { APP_NAME } from '../../shared/constants';
import { DAppRequest } from '../../shared/types';
import { formatTimeAgo, isRequestOld } from '../utils/ui-helpers';

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
          <h1>Sign Message</h1>
        </div>
      </div>

      <div class="content">
        <div class="dapp-request-container">
          <div class="dapp-icon">✍️</div>

          <div class="dapp-origin">
            <div class="dapp-origin-label">Site requesting signature:</div>
            <div class="dapp-origin-value">${domain}</div>
            <div class="dapp-origin-full">${request.origin}</div>
          </div>

          <div class="request-timestamp ${isOld ? 'old' : ''}">
            <span class="timestamp-icon">⏰</span>
            <span class="timestamp-text">Requested ${timeAgo}</span>
            ${isOld ? '<span class="timestamp-warning">⚠️ Old request</span>' : ''}
          </div>

          <div class="info-box info">
            <div class="info-icon">📝</div>
            <div class="info-text">
              <strong>Message to sign:</strong>
              <div class="message-content">${displayMessage}</div>
              ${message.length > 500 ? '<div class="message-truncated">(Message truncated for display)</div>' : ''}
            </div>
          </div>

          <div class="info-box warning">
            <div class="info-icon">ℹ️</div>
            <div class="info-text">
              Signing this message proves you own this wallet address.
              This action is free and does not send a transaction.
            </div>
          </div>

          <div class="info-box critical">
            <div class="info-icon">⚠️</div>
            <div class="info-text">
              <strong>Only sign messages you understand!</strong><br>
              Malicious sites may trick you into signing harmful messages.
            </div>
          </div>

          <div class="error" id="error"></div>

          <div class="dapp-actions">
            <button id="rejectBtn" class="btn btn-secondary">Reject</button>
            <button id="approveBtn" class="btn btn-primary">Sign Message</button>
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
    approveBtn.textContent = 'Signing...';

    await onApprove();
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to sign message';
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    approveBtn.textContent = 'Sign Message';
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
    rejectBtn.textContent = 'Rejecting...';

    await onReject();
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to reject';
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    rejectBtn.textContent = 'Reject';
  }
}
