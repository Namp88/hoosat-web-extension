import { formatAddress } from '../utils';
import { SOMPI_PER_HTN } from '../../shared/constants';
import { formatTimeAgo, isRequestOld } from '../utils/ui-helpers';
import { t, tn } from '../utils/i18n';
import { ICONS } from '../utils/icons';

export interface TransactionPreviewData {
  to: string;
  amount: number;
  minFee: number; // in HTN
  minFeeSompi: string; // in sompi
  balance: string; // in sompi
  inputs?: number;
  outputs?: number;
  origin?: string; // For DApp requests - show which site is requesting
  timestamp?: number; // For DApp requests - when was the request made
}

export interface TransactionPreviewResult {
  confirmed: boolean;
  customFeeSompi?: string;
}

/**
 * Show transaction preview modal
 */
export function showTransactionPreview(data: TransactionPreviewData): Promise<TransactionPreviewResult> {
  return new Promise(resolve => {
    let isEditingFee = false;
    let customFeeHTN = data.minFee;
    let customFeeSompi = data.minFeeSompi;

    // Use balance from data parameter (in sompi)
    const balance = BigInt(data.balance);

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal-content tx-preview-modal';

    function renderModal() {
      const total = data.amount + customFeeHTN;
      const isCustomFee = customFeeSompi !== data.minFeeSompi;
      const feeMultiplier = customFeeHTN / data.minFee;
      const showWarning = feeMultiplier > 10;

      // Extract domain from origin if provided
      const domain = data.origin ? new URL(data.origin).hostname : null;

      // Format timestamp if provided
      const timeAgo = data.timestamp ? formatTimeAgo(data.timestamp) : null;
      const isOld = data.timestamp ? isRequestOld(data.timestamp) : false;

      modal.innerHTML = `
        <div class="modal-header">
          <h2>${t('confirmTransaction')}</h2>
        </div>
        <div class="modal-body">
          ${
            data.origin
              ? `
          <div class="dapp-origin" style="margin-bottom: 16px;">
            <div class="dapp-origin-label">${t('requestedBy')}</div>
            <div class="dapp-origin-value">${domain}</div>
            <div class="dapp-origin-full">${data.origin}</div>
          </div>
          `
              : ''
          }

          ${
            data.timestamp
              ? `
          <div class="request-timestamp ${isOld ? 'old' : ''}" style="margin-bottom: 16px;">
            <span class="timestamp-icon">${ICONS.clock}</span>
            <span class="timestamp-text">${t('requested')} ${timeAgo}</span>
            ${isOld ? '<span class="timestamp-warning">${ICONS.warning} ' + t('oldRequest') + '</span>' : ''}
          </div>
          `
              : ''
          }

          <div class="tx-preview-section">
            <div class="tx-preview-label">${t('sendingTo')}</div>
            <div class="tx-preview-value address-preview">${formatAddress(data.to)}</div>
            <div class="tx-preview-full">${data.to}</div>
          </div>

          <div class="tx-preview-section">
            <div class="tx-preview-label">${t('amount')}</div>
            <div class="tx-preview-value amount-value">${data.amount.toFixed(8)} HTN</div>
          </div>

          <div class="tx-preview-divider"></div>

          <div class="tx-preview-section">
            <div class="tx-preview-label-row">
              <div class="tx-preview-label">${t('networkFee')}</div>
              ${isCustomFee && !isEditingFee ? '<div class="custom-fee-badge">' + t('custom') + '</div>' : ''}
            </div>
            ${
              !isEditingFee
                ? `
              <div class="fee-display">
                <div class="tx-preview-value fee-value">${customFeeHTN.toFixed(8)} HTN</div>
                ${
                  data.inputs && data.outputs
                    ? `<div class="tx-preview-note">${data.inputs} input${data.inputs > 1 ? 's' : ''} + ${data.outputs} output${data.outputs > 1 ? 's' : ''}</div>`
                    : ''
                }
                <button id="editFeeBtn" class="btn-link-small">${t('editFee')}</button>
              </div>
            `
                : `
              <div class="fee-edit-form">
                <input
                  type="number"
                  id="customFeeInput"
                  class="fee-input"
                  step="0.00000001"
                  value="${customFeeHTN.toFixed(8)}"
                  placeholder="${data.minFee.toFixed(8)}"
                />
                <div class="fee-edit-hint">${t('minimum')} ${data.minFee.toFixed(8)} HTN</div>
                <div class="fee-edit-actions">
                  <button id="cancelFeeBtn" class="btn btn-secondary btn-small">${t('cancel')}</button>
                  <button id="saveFeeBtn" class="btn btn-primary btn-small">${t('save')}</button>
                </div>
                <div class="error" id="feeError"></div>
              </div>
            `
            }
          </div>

          ${
            showWarning
              ? `
          <div class="tx-preview-warning-box">
            ${ICONS.warning} ${tn('feeWarningHigher', feeMultiplier.toFixed(1))}
          </div>
          `
              : ''
          }

          <div class="tx-preview-section total-section">
            <div class="tx-preview-label">${t('total')}</div>
            <div class="tx-preview-value total-value">${total.toFixed(8)} HTN</div>
          </div>

          <div class="tx-preview-warning">
            ${ICONS.warning} ${t('verifyDetails')}
          </div>
        </div>
        <div class="modal-actions">
          <button id="modalCancel" class="btn btn-secondary">${t('cancel')}</button>
          <button id="modalConfirm" class="btn btn-primary">${t('confirmAndSend')}</button>
        </div>
      `;
    }

    renderModal();
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);

    // Handle buttons
    const closeModal = (result: TransactionPreviewResult) => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 300);
    };

    // Event delegation for dynamic buttons
    modal.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;

      if (target.id === 'editFeeBtn') {
        isEditingFee = true;
        renderModal();
        // Focus input after render
        setTimeout(() => {
          const input = document.getElementById('customFeeInput') as HTMLInputElement;
          if (input) input.focus();
        }, 10);
      } else if (target.id === 'cancelFeeBtn') {
        isEditingFee = false;
        customFeeHTN = parseFloat(customFeeSompi) / SOMPI_PER_HTN;
        renderModal();
      } else if (target.id === 'saveFeeBtn') {
        const input = document.getElementById('customFeeInput') as HTMLInputElement;
        const feeError = document.getElementById('feeError')!;
        const newFeeHTN = parseFloat(input.value);

        if (isNaN(newFeeHTN) || newFeeHTN <= 0) {
          feeError.textContent = t('invalidFeeValue');
          return;
        }

        if (newFeeHTN < data.minFee) {
          feeError.textContent = tn('feeCannotBeLess', data.minFee.toFixed(8));
          return;
        }

        // Check if total exceeds balance
        const totalWithNewFee = data.amount + newFeeHTN;
        const balanceHTN = Number(balance) / SOMPI_PER_HTN;

        if (totalWithNewFee > balanceHTN) {
          feeError.textContent = t('insufficientBalanceForFee');
          return;
        }

        customFeeHTN = newFeeHTN;
        customFeeSompi = Math.floor(newFeeHTN * SOMPI_PER_HTN).toString();
        isEditingFee = false;
        renderModal();
      } else if (target.id === 'modalCancel') {
        closeModal({ confirmed: false });
      } else if (target.id === 'modalConfirm') {
        closeModal({
          confirmed: true,
          customFeeSompi: customFeeSompi !== data.minFeeSompi ? customFeeSompi : undefined,
        });
      }
    });

    // Close on overlay click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        closeModal({ confirmed: false });
      }
    });
  });
}
