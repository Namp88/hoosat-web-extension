// Content script - injected into web pages to provide Hoosat API

import { RPCMethod, MessageType, ExtensionMessage, RPCError } from '../shared/types';

console.log('🦊 Hoosat Wallet content script loaded');

// Inject provider into page context
const script = document.createElement('script');
script.textContent = `
  (function() {
    'use strict';
    
    // Hoosat Provider for DApps
    class HoosatProvider {
      constructor() {
        this.isHoosat = true;
        this.isConnected = false;
        this._requestId = 0;
        this._pendingRequests = new Map();
        
        // Listen for responses from content script
        window.addEventListener('message', (event) => {
          if (event.source !== window) return;
          if (event.data.type !== 'HOOSAT_RESPONSE') return;
          
          const { id, result, error } = event.data;
          const pending = this._pendingRequests.get(id);
          
          if (pending) {
            this._pendingRequests.delete(id);
            if (error) {
              pending.reject(error);
            } else {
              pending.resolve(result);
            }
          }
        });
      }
      
      async request(method, params = {}) {
        const id = ++this._requestId;
        
        return new Promise((resolve, reject) => {
          this._pendingRequests.set(id, { resolve, reject });
          
          // Send request to content script
          window.postMessage({
            type: 'HOOSAT_REQUEST',
            id,
            method,
            params
          }, '*');
          
          // Timeout after 60 seconds
          setTimeout(() => {
            if (this._pendingRequests.has(id)) {
              this._pendingRequests.delete(id);
              reject({ code: 4900, message: 'Request timeout' });
            }
          }, 60000);
        });
      }
      
      // Request connection to wallet
      async connect() {
        const accounts = await this.request('${RPCMethod.REQUEST_ACCOUNTS}');
        this.isConnected = accounts && accounts.length > 0;
        return accounts;
      }
      
      // Get connected accounts
      async getAccounts() {
        return this.request('${RPCMethod.GET_ACCOUNTS}');
      }
      
      // Get balance for address
      async getBalance(address) {
        return this.request('${RPCMethod.GET_BALANCE}', { address });
      }
      
      // Send transaction
      async sendTransaction(params) {
        return this.request('${RPCMethod.SEND_TRANSACTION}', params);
      }
      
      // Sign message
      async signMessage(message) {
        return this.request('${RPCMethod.SIGN_MESSAGE}', { message });
      }
      
      // Get network
      async getNetwork() {
        return this.request('${RPCMethod.GET_NETWORK}');
      }
      
      // Event listeners (for future implementation)
      on(event, callback) {
        // TODO: Implement event system
      }
      
      removeListener(event, callback) {
        // TODO: Implement event system
      }
    }
    
    // Inject provider into window
    window.hoosat = new HoosatProvider();
    
    // Dispatch event to notify DApp that provider is ready
    window.dispatchEvent(new Event('hoosat#initialized'));
    
    console.log('🦊 Hoosat Provider injected');
  })();
`;

// Inject script into page
(document.head || document.documentElement).appendChild(script);
script.remove();

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
