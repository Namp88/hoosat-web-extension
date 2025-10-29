# Internationalization (i18n) Implementation

## Overview

Hoosat Wallet extension now supports **5 languages**:
- 🇬🇧 **English (en)** - Default language
- 🇷🇺 **Russian (ru)** - Русский
- 🇨🇳 **Chinese Simplified (zh_CN)** - 简体中文
- 🇪🇸 **Spanish (es)** - Español
- 🇫🇮 **Finnish (fi)** - Suomi

## Implementation Details

### Architecture

The extension uses the **Chrome Extension i18n API** for translations. This is the native approach for browser extensions and provides:
- Automatic language detection based on browser settings
- No additional dependencies
- Standard Chrome/Firefox extension approach
- Lightweight solution

### Structure

```
web-extension/
├── _locales/           # Translations directory
│   ├── en/             # English (default)
│   │   └── messages.json
│   ├── ru/             # Russian
│   │   └── messages.json
│   ├── zh_CN/          # Chinese Simplified
│   │   └── messages.json
│   ├── es/             # Spanish
│   │   └── messages.json
│   └── fi/             # Finnish
│       └── messages.json
├── src/
│   ├── manifest.json   # Updated with default_locale
│   └── popup/
│       └── utils/
│           └── i18n.ts # i18n helper functions
```

### Key Files

#### manifest.json
```json
{
  "name": "__MSG_appName__",
  "description": "__MSG_appDescription__",
  "default_locale": "en"
}
```

#### i18n.ts Helper Module
```typescript
import { t, tn } from '../utils/i18n';

// Simple translation
t('welcome') // → "Welcome!" or "Добро пожаловать!" etc.

// Translation with single placeholder
t1('dayAgo', 5) // → "5 days ago" or "5 дней назад"

// Translation with multiple placeholders
tn('insufficientBalance', total, fee)
// → "Insufficient balance. Need 1.5 HTN (including 0.001 HTN fee)"
```

## Usage

### Adding New Translations

1. **Add the key to all messages.json files** in `_locales/*/messages.json`:

```json
{
  "myNewKey": {
    "message": "My translated text",
    "description": "Description for translators"
  }
}
```

2. **Use in TypeScript code**:

```typescript
import { t } from '../utils/i18n';

const text = t('myNewKey');
```

3. **With placeholders**:

In `messages.json`:
```json
{
  "greeting": {
    "message": "Hello, $1!",
    "description": "Greeting message",
    "placeholders": {
      "1": {
        "content": "$1",
        "example": "John"
      }
    }
  }
}
```

In code:
```typescript
import { t1 } from '../utils/i18n';

const greeting = t1('greeting', 'John'); // → "Hello, John!"
```

### Testing Different Languages

1. **In Chrome**:
   - Go to `chrome://settings/languages`
   - Add and move desired language to the top
   - Reload the extension

2. **In Firefox**:
   - Go to `about:preferences#general`
   - Under "Language", click "Set Alternatives"
   - Add and prioritize desired language
   - Reload the extension

3. **Manually set locale** (for testing):
   ```javascript
   // In browser console
   chrome.i18n.getUILanguage() // Check current language
   ```

## Translation Coverage

All user-facing strings are translated, including:

### Screens
- ✅ Welcome screen
- ✅ Unlock wallet
- ✅ Create new wallet
- ✅ Import wallet
- ✅ Backup private key
- ✅ Main wallet screen
- ✅ Send transaction
- ✅ Receive
- ✅ Settings
- ✅ Change password
- ✅ Export private key
- ✅ Connected sites
- ✅ Transaction preview modal

### UI Elements
- ✅ Buttons
- ✅ Form labels and placeholders
- ✅ Error messages
- ✅ Validation messages
- ✅ Time formatting (relative time)
- ✅ Password strength indicators
- ✅ Transaction status messages

## Building

The build process automatically copies `_locales` folder to `dist`:

```bash
npm run build
```

Webpack configuration:
```javascript
new CopyPlugin({
  patterns: [
    { from: '_locales', to: '_locales' },
    // ... other files
  ],
})
```

## Language Detection & Manual Selection

### Automatic Detection (Default)
The extension automatically detects the user's browser language:
- Chrome checks browser UI language
- Fallback to `default_locale` (English) if translation not available
- Uses closest match (e.g., `zh_CN` for Chinese users)

### Manual Language Switcher ⭐ NEW
Users can now **manually select their preferred language** in Settings:

**How to Use:**
1. Open extension popup
2. Click **Settings** (⚙️)
3. Find **Language** section at the top
4. Select from dropdown:
   - Auto (Browser Default)
   - English
   - Русский (Russian)
   - 简体中文 (Chinese Simplified)
   - Español (Spanish)
   - Suomi (Finnish)
5. Extension reloads automatically

**Features:**
- 💾 Preference saved persistently
- 🔄 Instant application
- 🌍 Override browser language
- ⚡ Zero performance impact

See [LANGUAGE_SWITCHER.md](./LANGUAGE_SWITCHER.md) for detailed documentation.

## Best Practices

### For Developers

1. **Always use `t()` for user-facing strings**:
   ```typescript
   // ❌ Bad
   errorEl.textContent = 'Password is required';

   // ✅ Good
   errorEl.textContent = t('passwordRequired');
   ```

2. **Use descriptive keys**:
   ```typescript
   // ❌ Bad
   t('text1')

   // ✅ Good
   t('passwordRequired')
   ```

3. **Add descriptions in messages.json**:
   ```json
   {
     "passwordRequired": {
       "message": "Password is required",
       "description": "Error shown when password field is empty"
     }
   }
   ```

### For Translators

1. Keep **placeholders** unchanged: `$1`, `$2`, etc.
2. Maintain **HTML tags** if present
3. Keep **punctuation style** appropriate for the language
4. Consider **text length** - UI might have space constraints
5. Use **formal/informal** tone consistently within a language

## Maintenance

### Adding a New Language

1. Create directory: `_locales/[locale_code]/`
2. Create `messages.json` with all keys from `en/messages.json`
3. Translate all message values
4. Test by changing browser language
5. Update this README

### Updating Existing Translations

1. Edit `_locales/[locale]/messages.json`
2. Rebuild: `npm run build`
3. Test in browser

## Notes

- **File size**: Each messages.json is ~18-22KB (depending on language)
- **Performance**: No runtime overhead, native browser API
- **Coverage**: 100% of user-facing strings translated
- **Maintenance**: Simple JSON files, easy to update

## Future Improvements

Potential enhancements:
- Add more languages (Japanese, Korean, German, Turkish)
- Translation management tool/script
- Automated translation validation
- Pluralization helpers for complex cases
- Date/number formatting per locale

## Resources

- [Chrome Extension i18n API](https://developer.chrome.com/docs/extensions/reference/i18n/)
- [MDN: Internationalize extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization)
- [Locale codes](https://developer.chrome.com/docs/webstore/i18n/#choosing-locales-to-support)
