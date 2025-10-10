// Global type definitions for browser extension

// Buffer polyfill
import { Buffer as BufferPolyfill } from 'buffer';

declare global {
  // Make Buffer available globally
  const Buffer: typeof BufferPolyfill;

  interface Window {
    Buffer: typeof BufferPolyfill;
  }
}

export {};
