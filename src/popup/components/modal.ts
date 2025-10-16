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
    modal.className = 'modal-content confirm-modal';

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
    const closeModal = (result: boolean) => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 300);
    };

    document.getElementById('modalCancel')!.addEventListener('click', () => closeModal(false));
    document.getElementById('modalConfirm')!.addEventListener('click', () => closeModal(true));

    // Close on overlay click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        closeModal(false);
      }
    });
  });
}
