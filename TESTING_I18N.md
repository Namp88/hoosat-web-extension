# Testing i18n Implementation

## Quick Test Guide

### 1. Build the Extension

```bash
cd web-extension
npm run build
```

Check that `dist/_locales/` contains 5 language folders:
- `en/` (English)
- `ru/` (Russian)
- `zh_CN/` (Chinese)
- `es/` (Spanish)
- `fi/` (Finnish)

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `web-extension/dist` folder
5. Extension should load successfully

### 3. Test Different Languages

#### Method 1: Change Browser Language (Recommended)

**Chrome:**
1. Go to `chrome://settings/languages`
2. Click "Add languages"
3. Add language you want to test (e.g., Russian, Spanish)
4. Click the three dots next to the language
5. Select "Move to the top"
6. Restart Chrome
7. Open the extension popup

**Firefox:**
1. Go to `about:preferences#general`
2. Scroll to "Language"
3. Click "Set Alternatives..."
4. Add and prioritize desired language
5. Restart Firefox
6. Open the extension popup

#### Method 2: Use Chrome with Language Parameter (Quick Test)

```bash
# Test Russian
"C:\Program Files\Google\Chrome\Application\chrome.exe" --lang=ru --user-data-dir=C:\temp\chrome-ru

# Test Chinese
"C:\Program Files\Google\Chrome\Application\chrome.exe" --lang=zh-CN --user-data-dir=C:\temp\chrome-zh

# Test Spanish
"C:\Program Files\Google\Chrome\Application\chrome.exe" --lang=es --user-data-dir=C:\temp\chrome-es

# Test Finnish
"C:\Program Files\Google\Chrome\Application\chrome.exe" --lang=fi --user-data-dir=C:\temp\chrome-fi
```

### 4. What to Test

Open the extension and verify translations in these screens:

#### Welcome Screen
- [ ] "Welcome!" title
- [ ] "Choose how to get started" text
- [ ] "Create New Wallet" button
- [ ] "Import Existing Wallet" button

#### Create Wallet Screen
- [ ] "Create New Wallet" title
- [ ] "Important:" warning label
- [ ] Password requirements list
- [ ] "Generate Wallet" button
- [ ] Error messages (try submitting empty form)

#### Import Wallet Screen
- [ ] "Import Wallet" title
- [ ] "Private Key (hex)" label
- [ ] Password fields
- [ ] "Import Wallet" button

#### Main Wallet Screen
- [ ] "Address" and "Balance" labels
- [ ] "Send" and "Receive" buttons
- [ ] "Recent Transactions" title
- [ ] Transaction type labels (Sent/Received)

#### Send Screen
- [ ] "Send HTN" title
- [ ] "Recipient Address" label
- [ ] "Amount (HTN)" label
- [ ] "Available:" label
- [ ] "Send Transaction" button
- [ ] Error messages (try invalid input)

#### Receive Screen
- [ ] "Receive HTN" title
- [ ] "Your Address" label
- [ ] "Copy Address" button

#### Settings Screen
- [ ] All button labels with emoji icons
- [ ] Screen titles

### 5. Test Dynamic Content

#### Time Formatting
1. Go to "Connected Sites" (if you have connected sites)
2. Check time format: "5 minutes ago", "2 days ago", etc.
3. Should be translated: "5 минут назад" (Russian), "hace 5 minutos" (Spanish)

#### Error Messages with Placeholders
1. Try to send more HTN than you have
2. Error message should show: "Insufficient balance. Need X HTN (including Y HTN fee)"
3. Numbers should be in correct format with proper translation

#### Password Strength Indicator
1. Create new wallet or change password
2. Type weak/medium/strong passwords
3. Check strength labels are translated: "Weak password", "Medium password", "Strong password"

### 6. Expected Results

For each language, verify:
- ✅ All text is translated (no English fallbacks except technical terms)
- ✅ Buttons, labels, and placeholders are in target language
- ✅ Error messages are translated
- ✅ Dynamic content (time, numbers) works correctly
- ✅ Layout doesn't break with longer translations
- ✅ Emoji icons display correctly

### 7. Debugging

#### Check Current Language
Open browser console in extension popup:
```javascript
chrome.i18n.getUILanguage()
// Returns: "en", "ru", "zh-CN", "es", or "fi"
```

#### Check Specific Translation
```javascript
chrome.i18n.getMessage('welcome')
// Should return translated string
```

#### Common Issues

**Issue**: Extension shows English despite changing language
- **Solution**: Restart browser completely after language change

**Issue**: Translation key appears instead of text (e.g., "welcome")
- **Solution**: Check that key exists in `_locales/[lang]/messages.json`

**Issue**: Build fails
- **Solution**: Run `npm run build` and check for errors

**Issue**: `_locales` folder missing in dist
- **Solution**: Check `webpack.config.js` has copy plugin configured

### 8. Manual Spot Checks

#### Russian (ru)
- "Welcome!" → "Добро пожаловать!"
- "Password" → "Пароль"
- "Send" → "Отправить"
- "Receive" → "Получить"

#### Chinese Simplified (zh_CN)
- "Welcome!" → "欢迎!"
- "Password" → "密码"
- "Send" → "发送"
- "Receive" → "接收"

#### Spanish (es)
- "Welcome!" → "¡Bienvenido!"
- "Password" → "Contraseña"
- "Send" → "Enviar"
- "Receive" → "Recibir"

#### Finnish (fi)
- "Welcome!" → "Tervetuloa!"
- "Password" → "Salasana"
- "Send" → "Lähetä"
- "Receive" → "Vastaanota"

### 9. Automated Testing (Future)

Consider adding:
```javascript
// Test that all keys exist in all languages
describe('i18n', () => {
  it('should have all keys in all languages', () => {
    const languages = ['en', 'ru', 'zh_CN', 'es', 'fi'];
    const enKeys = Object.keys(require('./_locales/en/messages.json'));

    languages.forEach(lang => {
      const langKeys = Object.keys(require(`./_locales/${lang}/messages.json`));
      expect(langKeys).toEqual(enKeys);
    });
  });
});
```

## Reporting Issues

If you find translation issues:
1. Note the screen/component
2. Note the incorrect text
3. Note the expected translation
4. Note the language code
5. File an issue with this information

## Success Criteria

✅ Extension loads without errors
✅ All 5 languages display correctly
✅ No English fallbacks in non-English modes
✅ Dynamic content (dates, errors) translated
✅ Layout remains intact with longer translations
✅ Emojis and icons display properly
✅ Password validation works in all languages
