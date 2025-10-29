#!/usr/bin/env python3
"""
Script to update all screen files to use i18n
"""

import re
import os

# Mapping of old strings to i18n keys
TRANSLATIONS = {
    # Common
    r"'Password is required'": "t('passwordRequired')",
    r'"Password is required"': "t('passwordRequired')",
    r"'Invalid password'": "t('invalidPassword')",
    r'"Invalid password"': "t('invalidPassword')",
    r"'Password'": "t('password')",
    r'"Password"': "t('password')",
    r"'Enter password'": "t('enterPassword')",
    r'"Enter password"': "t('enterPassword')",

    # Unlock screen
    r"'Unlock Wallet'": "t('unlockWallet')",
    r'"Unlock Wallet"': "t('unlockWallet')",
    r"'Request from:'": "t('requestFrom')",
    r'"Request from:"': "t('requestFrom')",
    r"'Unlock'": "t('unlock')",
    r'"Unlock"': "t('unlock')",

    # Generate wallet
    r"'Create New Wallet'": "t('createNewWalletTitle')",
    r'"Create New Wallet"': "t('createNewWalletTitle')",
    r"'Important:'": "t('important')",
    r'"Important:"': "t('important')",
    r"'Create password'": "t('createPassword')",
    r'"Create password"': "t('createPassword')",
    r"'Confirm Password'": "t('confirmPassword')",
    r'"Confirm Password"': "t('confirmPassword')",
    r"'Confirm password'": "t('confirmPasswordPlaceholder')",
    r'"Confirm password"': "t('confirmPasswordPlaceholder')",
    r"'Password must contain:'": "t('passwordRequirements')",
    r'"Password must contain:"': "t('passwordRequirements')",
    r"'At least 8 characters'": "t('passwordReq8Chars')",
    r'"At least 8 characters"': "t('passwordReq8Chars')",
    r"'One uppercase letter \\(A-Z\\)'": "t('passwordReqUppercase')",
    r'"One uppercase letter \\(A-Z\\)"': "t('passwordReqUppercase')",
    r"'One lowercase letter \\(a-z\\)'": "t('passwordReqLowercase')",
    r'"One lowercase letter \\(a-z\\)"': "t('passwordReqLowercase')",
    r"'One number \\(0-9\\)'": "t('passwordReqNumber')",
    r'"One number \\(0-9\\)"': "t('passwordReqNumber')",
    r"'Generate Wallet'": "t('generateWallet')",
    r'"Generate Wallet"': "t('generateWallet')",
    r"'Passwords do not match'": "t('passwordsDoNotMatch')",
    r'"Passwords do not match"': "t('passwordsDoNotMatch')",
    r"'Failed to generate wallet'": "t('failedToGenerateWallet')",
    r'"Failed to generate wallet"': "t('failedToGenerateWallet')",

    # Import wallet
    r"'Import Wallet'": "t('importWallet')",
    r'"Import Wallet"': "t('importWallet')",
    r"'Private Key \\(hex\\)'": "t('privateKeyHex')",
    r'"Private Key \\(hex\\)"': "t('privateKeyHex')",
    r"'Enter your private key'": "t('enterPrivateKey')",
    r'"Enter your private key"': "t('enterPrivateKey')",
    r"'Private key is required'": "t('privateKeyRequired')",
    r'"Private key is required"': "t('privateKeyRequired')",
    r"'Failed to import wallet'": "t('failedToImportWallet')",
    r'"Failed to import wallet"': "t('failedToImportWallet')",

    # Send screen
    r"'Send HTN'": "t('sendHTN')",
    r'"Send HTN"': "t('sendHTN')",
    r"'Recipient Address'": "t('recipientAddress')",
    r'"Recipient Address"': "t('recipientAddress')",
    r"'Amount \\(HTN\\)'": "t('amount')",
    r'"Amount \\(HTN\\)"': "t('amount')",
    r"'Available:'": "t('available')",
    r'"Available:"': "t('available')",
    r"'Send Transaction'": "t('sendTransaction')",
    r'"Send Transaction"': "t('sendTransaction')",
    r"'Recipient and amount are required'": "t('recipientAndAmountRequired')",
    r'"Recipient and amount are required"': "t('recipientAndAmountRequired')",
    r"'Invalid address format\\. Must start with \"hoosat:\"'": "t('invalidAddressFormat')",
    r'"Invalid address format\\. Must start with \\"hoosat:\\""': "t('invalidAddressFormat')",
    r"'Invalid amount'": "t('invalidAmount')",
    r'"Invalid amount"': "t('invalidAmount')",
    r"'Estimating fee\\.\\.\\.'": "t('estimatingFee')",
    r'"Estimating fee\\.\\.\\."': "t('estimatingFee')",
    r"'Sending\\.\\.\\.'": "t('sending')",
    r'"Sending\\.\\.\\."': "t('sending')",
    r"'Transaction failed'": "t('transactionFailed')",
    r'"Transaction failed"': "t('transactionFailed')",

    # Receive screen
    r"'Receive HTN'": "t('receiveHTN')",
    r'"Receive HTN"': "t('receiveHTN')",
    r"'Your Address'": "t('yourAddress')",
    r'"Your Address"': "t('yourAddress')",
    r"'Copy Address'": "t('copyAddress')",
    r'"Copy Address"': "t('copyAddress')",

    # Settings
    r"'Settings'": "t('settings')",
    r'"Settings"': "t('settings')",
    r"'🔗 Connected Sites'": "t('connectedSites')",
    r'"🔗 Connected Sites"': "t('connectedSites')",
    r"'🔑 Change Password'": "t('changePassword')",
    r'"🔑 Change Password"': "t('changePassword')",
    r"'📤 Export Private Key'": "t('exportPrivateKey')",
    r'"📤 Export Private Key"': "t('exportPrivateKey')",
    r"'🗑️ Reset Wallet'": "t('resetWallet')",
    r'"🗑️ Reset Wallet"': "t('resetWallet')",

    # Wallet screen
    r"'Address'": "t('address')",
    r'"Address"': "t('address')",
    r"'Balance'": "t('balance')",
    r'"Balance"': "t('balance')",
    r"'Send'": "t('send')",
    r'"Send"': "t('send')",
    r"'Receive'": "t('receive')",
    r'"Receive"': "t('receive')",
    r"'Recent Transactions'": "t('recentTransactions')",
    r'"Recent Transactions"': "t('recentTransactions')",
    r"'No transactions yet'": "t('noTransactionsYet')",
    r'"No transactions yet"': "t('noTransactionsYet')",
    r"'Sent'": "t('sent')",
    r'"Sent"': "t('sent')",
    r"'Received'": "t('received')",
    r'"Received"': "t('received')",
    r"'To: '": "t('to')",
    r'"To: "': "t('to')",
    r"'From: '": "t('from')",
    r'"From: "': "t('from')",
}

def update_file(filepath):
    """Update a single file with i18n translations"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Replace APP_NAME import with i18n import
    content = re.sub(
        r"import \{ APP_NAME \} from '\.\.\/\.\.\/shared\/constants';",
        "import { t } from '../utils/i18n';",
        content
    )
    content = re.sub(
        r"import \{ APP_NAME,([^}]+)\} from '\.\.\/\.\.\/shared\/constants';",
        r"import {\1} from '../../shared/constants';\nimport { t } from '../utils/i18n';",
        content
    )

    # Replace ${APP_NAME} with ${t('appName')}
    content = re.sub(r'\$\{APP_NAME\}', "${t('appName')}", content)

    # Apply translations
    for pattern, replacement in TRANSLATIONS.items():
        content = re.sub(pattern, replacement, content)

    # Only write if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")
        return True
    return False

def main():
    """Main function"""
    screens_dir = os.path.join('src', 'popup', 'screens')

    updated_count = 0
    for filename in os.listdir(screens_dir):
        if filename.endswith('.ts') and filename != 'index.ts':
            filepath = os.path.join(screens_dir, filename)
            if update_file(filepath):
                updated_count += 1

    print(f"\nUpdated {updated_count} files")

if __name__ == '__main__':
    main()
