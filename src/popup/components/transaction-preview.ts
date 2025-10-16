import { formatAddress } from '../utils';
import { SOMPI_PER_HTN } from '../../shared/constants';

export interface TransactionPreviewData {
  to: string;
  amount: number;
  minFee: number; // in HTN
  minFeeSompi: string; // in sompi
  balance: string; // in sompi
  inputs?: number;
  outputs?: number;
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

      modal.innerHTML = `
        <div class="modal-header">
          <h2>Confirm Transaction</h2>
        </div>
        <div class="modal-body">
          <div class="tx-preview-section">
            <div class="tx-preview-label">Sending to</div>
            <div class="tx-preview-value address-preview">${formatAddress(data.to)}</div>
            <div class="tx-preview-full">${data.to}</div>
          </div>

          <div class="tx-preview-section">
            <div class="tx-preview-label">Amount</div>
            <div class="tx-preview-value amount-value">${data.amount.toFixed(8)} HTN</div>
          </div>

          <div class="tx-preview-divider"></div>

          <div class="tx-preview-section">
            <div class="tx-preview-label-row">
              <div class="tx-preview-label">Network Fee</div>
              ${isCustomFee && !isEditingFee ? '<div class="custom-fee-badge">Custom</div>' : ''}
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
                <button id="editFeeBtn" class="btn-link-small">Edit fee</button>
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
                <div class="fee-edit-hint">Minimum: ${data.minFee.toFixed(8)} HTN</div>
                <div class="fee-edit-actions">
                  <button id="cancelFeeBtn" class="btn btn-secondary btn-small">Cancel</button>
                  <button id="saveFeeBtn" class="btn btn-primary btn-small">Save</button>
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
            ⚠️ Warning: Fee is ${feeMultiplier.toFixed(1)}x higher than minimum!
          </div>
          `
              : ''
          }

          <div class="tx-preview-section total-section">
            <div class="tx-preview-label">Total</div>
            <div class="tx-preview-value total-value">${total.toFixed(8)} HTN</div>
          </div>

          <div class="tx-preview-warning">
            ⚠️ Please verify all details before confirming
          </div>
        </div>
        <div class="modal-actions">
          <button id="modalCancel" class="btn btn-secondary">Cancel</button>
          <button id="modalConfirm" class="btn btn-primary">Confirm & Send</button>
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
          feeError.textContent = 'Invalid fee value';
          return;
        }

        if (newFeeHTN < data.minFee) {
          feeError.textContent = `Fee cannot be less than ${data.minFee.toFixed(8)} HTN`;
          return;
        }

        // Check if total exceeds balance
        const totalWithNewFee = data.amount + newFeeHTN;
        const balanceHTN = Number(balance) / SOMPI_PER_HTN;

        if (totalWithNewFee > balanceHTN) {
          feeError.textContent = 'Insufficient balance for this fee';
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
