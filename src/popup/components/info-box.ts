/**
 * Info box component helper
 * Creates styled info/warning/error boxes
 */

/**
 * Create info box HTML
 */
export function createInfoBox(config: {
  type: 'info' | 'warning' | 'error';
  icon: string;
  title?: string;
  message?: string;
  listItems?: string[];
  style?: string;
}): string {
  const { type, icon, title, message, listItems, style } = config;

  const styleAttr = style ? ` style="${style}"` : '';

  return `
    <div class="hero-info-box ${type}"${styleAttr}>
      <div class="hero-info-box-icon">${icon}</div>
      <div>
        ${title ? `<strong>${title}</strong>` : ''}
        ${title && message ? '<br>' : ''}
        ${message || ''}
        ${
          listItems
            ? `
          <ul style="margin: var(--spacing-xs) 0 0 var(--spacing-md); padding: 0; list-style-position: inside;">
            ${listItems.map(item => `<li>${item}</li>`).join('')}
          </ul>
        `
            : ''
        }
      </div>
    </div>
  `;
}

/**
 * Create warning box (convenience function)
 */
export function createWarningBox(config: {
  icon: string;
  title?: string;
  message?: string;
  listItems?: string[];
  style?: string;
}): string {
  return createInfoBox({ ...config, type: 'warning' });
}

/**
 * Create error box (convenience function)
 */
export function createErrorBox(config: {
  icon: string;
  title?: string;
  message?: string;
  listItems?: string[];
  style?: string;
}): string {
  return createInfoBox({ ...config, type: 'error' });
}

/**
 * Create info box (convenience function)
 */
export function createInfoInfoBox(config: {
  icon: string;
  title?: string;
  message?: string;
  listItems?: string[];
  style?: string;
}): string {
  return createInfoBox({ ...config, type: 'info' });
}
