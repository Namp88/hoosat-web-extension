// Content script - injected into web pages to provide Hoosat API

import { RPCMethod, MessageType } from '../shared/types';

console.log('🦊 Hoosat Wallet content script loaded');

// Inject provider script into page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected-provider.js');
script.onload = function () {
  // Remove script tag after execution
  script.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for requests from injected script
window.addEventListener('message', async (event: MessageEvent) => {
  // Only accept messages from same window
  if (event.source !== window) return;

  const { type, id, method, params } = event.data;

  if (type !== 'HOOSAT_REQUEST') return;

  console.log('📨 DApp request:', method, params);

  try {
    // Forward request to background script
    const response = await chrome.runtime.sendMessage({
      type: MessageType.RPC_REQUEST,
      data: { method, params },
    });

    if (!response.success) {
      throw response.error;
    }

    // Send response back to page
    window.postMessage(
      {
        type: 'HOOSAT_RESPONSE',
        id,
        result: response.data,
      },
      '*'
    );
  } catch (error: any) {
    console.error('❌ Request failed:', error);

    // Send error back to page
    window.postMessage(
      {
        type: 'HOOSAT_RESPONSE',
        id,
        error: {
          code: error.code || 4900,
          message: error.message || 'Request failed',
        },
      },
      '*'
    );
  }
});

// Notify background that content script is ready
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' }).catch(() => {
  // Extension might be reloading, ignore error
});
