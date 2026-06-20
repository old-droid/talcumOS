# talcumOS API Manual (v2.7)

## Overview
The **Talcum API** is now a secure, IPFS-backed storage system. All 3rd party apps should use the native `postMessage` wrapper library (`talcum-api.js`) for seamless integration.

## Integration for 3rd Party Apps

### 1. Include the Library
Add the following script to your app:
```html
<script src="https://talcumos.com/talcum-api.js"></script>
```

### 2. Usage Examples

#### Store Data
```javascript
await TalcumAPI.store('settings', { theme: 'dark' });
```

#### Retrieve Data
```javascript
const settings = await TalcumAPI.pull('settings');
```

#### List All Keys
```javascript
const keys = await TalcumAPI.list();
```

#### Remove Data
```javascript
await TalcumAPI.remove('settings');
```

## Security & Persistence
- **Encryption:** All data is encrypted using AES-GCM (256-bit) before leaving the device.
- **Storage:** Ciphertext is uploaded to IPFS (via Web3.Storage).
- **Identity:** Users login with a **Username** and **Passcode**. The "Data Code" system has been deprecated in favor of CID-based retrieval.

## App Development Guidelines
- Use `TalcumAPI` for all storage operations.
- Ensure your app is responsive and follows the iOS-style design language.
- Avoid heavy dependencies to maintain the "Lightweight" nature of talcumOS.
