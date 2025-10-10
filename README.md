# 🦊 Hoosat Wallet - Browser Extension

<div align="center">

![Hoosat Wallet](src/icons/icon128.png)

**A secure, non-custodial browser extension wallet for the Hoosat blockchain**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.2-blue)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)](https://chrome.google.com/webstore)

[Features](#features) • [Installation](#installation) • [Development](#development) • [Security](#security) • [Contributing](#contributing)

</div>

---

## 📋 Overview

Hoosat Wallet is a browser extension that allows you to securely manage your HTN (Hoosat) tokens directly from your browser. Built with TypeScript and designed for security, it provides a seamless interface for interacting with the Hoosat blockchain.

## ✨ Features

- 🔐 **Secure Key Storage** - Private keys encrypted with AES-256
- 🔑 **Multiple Wallet Support** - Create or import wallets
- 💸 **Send & Receive HTN** - Easy transaction management
- 📊 **Transaction History** - Track all your transactions
- 🌐 **DApp Integration** - Connect to decentralized applications
- 🔒 **Auto-lock** - Automatic wallet locking for security
- 🎨 **Modern UI** - Clean and intuitive interface
- 🚀 **Fast & Lightweight** - Optimized performance

## 🚀 Installation

### From Chrome Web Store

*Coming soon - Extension is currently under review*

### Manual Installation (Developer Mode)

1. Download the latest release from [Releases](https://github.com/yourusername/hoosat-web-extension/releases)
2. Extract the ZIP file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (top right corner)
5. Click "Load unpacked"
6. Select the extracted `dist` folder

## 🛠️ Development

### Prerequisites

- Node.js 20+ and npm
- TypeScript knowledge
- Chrome/Chromium browser

### Setup

```bash
# Clone repository
git clone https://github.com/Namp88/hoosat-web-extension.git
cd hoosat-web-extension

# Install dependencies
npm install

# Build for production
npm run build

# Build for development (with watch mode)
npm run dev
```

### Building

```bash
# Production build
npm run build

# Development build with watch
npm run dev

# Clean build directory
npm run clean
```

### Loading in Browser

1. Build the extension: `npm run build`
2. Open Chrome: `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## 🔐 Security

### Key Features

- **AES-256 Encryption** - Private keys are encrypted using industry-standard AES-256
- **Password Protection** - Strong password requirements enforced
- **Session Management** - Auto-lock after 30 minutes of inactivity
- **Grace Period** - 2-minute grace period for quick re-access
- **No Data Collection** - All data stored locally

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Best Practices

⚠️ **IMPORTANT SECURITY NOTES:**

- **NEVER share your private key** with anyone
- **BACKUP your private key** in a secure location
- **Use a strong password** to encrypt your wallet
- **Keep your password safe** - it cannot be recovered
- **Verify all transactions** before confirming

## 🌐 DApp Integration

### For DApp Developers

The extension injects a `window.hoosat` provider into web pages:

```javascript
// Check if Hoosat Wallet is installed
if (window.hoosat) {
  console.log('Hoosat Wallet detected!');
}

// Connect to wallet
const accounts = await window.hoosat.connect();
console.log('Connected:', accounts[0]);

// Get balance
const balance = await window.hoosat.getBalance(accounts[0]);
console.log('Balance:', balance);

// Send transaction
const txId = await window.hoosat.sendTransaction({
  to: 'hoosat:recipient_address',
  amount: 1.5, // HTN
  payload: 'Optional message'
});
console.log('Transaction sent:', txId);

// Get network
const network = await window.hoosat.getNetwork();
console.log('Network:', network);
```

### Available Methods

- `hoosat.connect()` - Request connection to wallet
- `hoosat.getAccounts()` - Get connected accounts
- `hoosat.getBalance(address)` - Get balance for address
- `hoosat.sendTransaction(params)` - Send transaction
- `hoosat.signMessage(message)` - Sign message (coming soon)
- `hoosat.getNetwork()` - Get current network

## 📦 Dependencies

### Core

- [hoosat-sdk-web](https://www.npmjs.com/package/hoosat-sdk-web) - Hoosat blockchain SDK
- [crypto-js](https://www.npmjs.com/package/crypto-js) - Encryption library
- [buffer](https://www.npmjs.com/package/buffer) - Node.js Buffer polyfill

### Development

- TypeScript 5.4+
- Webpack 5
- ts-loader

## 🗺️ Roadmap

- [x] Basic wallet functionality
- [x] Send/Receive transactions
- [x] Transaction history
- [x] DApp integration
- [ ] Multi-account support
- [ ] Message signing
- [ ] Advanced security features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Hoosat blockchain team
- Open source community
- All contributors

## 📞 Support

- GitHub Issues: [Report a bug](https://github.com/Namp88/hoosat-web-extension/issues)
- Documentation: [Wiki](https://github.com/Namp88/hoosat-web-extension/wiki)
- Community: [Discord/Telegram]

## ⚠️ Disclaimer

This wallet is provided "as is" without warranty of any kind. Always do your own research and use at your own risk. Never invest more than you can afford to lose.

---

<div align="center">
  Made with ❤️ for the Hoosat community
</div>