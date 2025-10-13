/**
 * UI helper functions for DOM manipulation
 */

/**
 * Show success toast message
 */
export function showSuccessMessage(message: string, duration: number = 3000): void {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-toast';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);

  setTimeout(() => {
    successDiv.classList.add('show');
  }, 10);

  setTimeout(() => {
    successDiv.classList.remove('show');
    setTimeout(() => {
      successDiv.remove();
    }, 300);
  }, duration);
}

/**
 * Show error message in element
 */
export function showError(elementId: string, message: string): void {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = message;
  }
}

/**
 * Clear error message
 */
export function clearError(elementId: string): void {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = '';
  }
}

/**
 * Show confirm dialog
 */
export function showConfirmDialog(title: string, message: string): Promise<boolean> {
  return new Promise(resolve => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal-content';

    modal.innerHTML = `
      <div class="modal-header">
        <h2>${title}</h2>
      </div>
      <div class="modal-body">
        <p>${message}</p>
      </div>
      <div class="modal-actions">
        <button id="modalCancel" class="btn btn-secondary">Cancel</button>
        <button id="modalConfirm" class="btn btn-danger">Confirm</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);

    // Handle buttons
    const closeModal = (confirmed: boolean) => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve(confirmed);
      }, 300);
    };

    modal.querySelector('#modalCancel')!.addEventListener('click', () => closeModal(false));
    modal.querySelector('#modalConfirm')!.addEventListener('click', () => closeModal(true));

    // Close on overlay click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        closeModal(false);
      }
    });
  });
}

/**
 * Disable button with loading state
 */
export function setButtonLoading(buttonId: string, loading: boolean, loadingText?: string): void {
  const button = document.getElementById(buttonId) as HTMLButtonElement;
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.textContent || '';
    button.disabled = true;
    button.textContent = loadingText || 'Loading...';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Submit';
    delete button.dataset.originalText;
  }
}

/**
 * Get input value safely
 */
export function getInputValue(inputId: string): string {
  const input = document.getElementById(inputId) as HTMLInputElement;
  return input ? input.value.trim() : '';
}

/**
 * Focus element safely
 */
export function focusElement(elementId: string): void {
  const element = document.getElementById(elementId) as HTMLElement;
  if (element) {
    element.focus();
  }
}
