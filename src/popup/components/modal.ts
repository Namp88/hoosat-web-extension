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

/**
 * Show alert dialog (info/error message)
 */
export function showAlertDialog(title: string, message: string, type: 'success' | 'error' | 'info' = 'info'): Promise<void> {
  return new Promise(resolve => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Create modal content
    const modal = document.createElement('div');
    modal.className = `modal-content alert-modal alert-${type}`;

    // Choose icon based on type
    let icon = '${ICONS.info}';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    modal.innerHTML = `
      <div class="modal-header">
        <h2>${icon} ${title}</h2>
      </div>
      <div class="modal-body">
        <p>${message}</p>
      </div>
      <div class="modal-actions">
        <button id="modalOk" class="btn btn-primary">OK</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);

    // Handle button
    const closeModal = () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 300);
    };

    document.getElementById('modalOk')!.addEventListener('click', closeModal);

    // Close on overlay click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        closeModal();
      }
    });
  });
}
