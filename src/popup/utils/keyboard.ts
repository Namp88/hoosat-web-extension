/**
 * Keyboard event utilities
 */

/**
 * Add Enter key handler to element
 */
export function addEnterKeyHandler(elementId: string, handler: () => void): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handler();
      }
    });
  }
}

/**
 * Add Enter key handler to multiple elements
 */
export function addEnterKeyHandlers(elementIds: string[], handler: () => void): void {
  elementIds.forEach(id => addEnterKeyHandler(id, handler));
}
