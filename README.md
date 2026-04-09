# talcumOS v2.5

Optimized for **iPad Air 1 (iOS 12.5.8)**. talcumOS is a lightweight, single-file HTML operating system designed for performance, security, and low-memory environments.

## 🚀 Performance Optimizations for iPad Air 1

*   **DOM Reduction**: Minimized static DOM elements and transitioned to dynamic, on-demand rendering using `insertAdjacentHTML`.
*   **JS Efficiency**: Replaced heavy SVG paths with high-quality cloud-hosted PNG icons to reduce browser rendering load.
*   **Memory Management**: Implemented `requestAnimationFrame` for UI updates to prevent UI thread blocking and lag.
*   **Hardware Acceleration**: Used `will-change` and `backdrop-filter` sparingly to leverage GPU without overwhelming the A7 chip.

## 🛠 Talcum API (v2.0)

The Talcum API provides persistent data storage and is now fully compatible with **iframes**.

### Methods

| Method | Description |
| :--- | :--- |
| `talcum.store(key, value)` | Saves a string value to the encrypted OS state. |
| `talcum.pull(key)` | Retrieves a saved value by key. |
| `talcum.list()` | Returns an array of all saved keys. |
| `talcum.remove(key)` | Deletes a key-value pair from storage. |

### Iframe Integration

To use the Talcum API inside an iframe app, send messages to the parent window:

```javascript
// Example: Storing data from an iframe
window.parent.postMessage({
    source: 'talcum-api',
    action: 'store',
    key: 'my_app_data',
    value: 'Hello from Iframe!',
    requestId: Date.now()
}, '*');

// Listen for response
window.addEventListener('message', (event) => {
    if (event.data.source === 'talcum-os') {
        console.log('Action result:', event.data.result);
    }
});
```

## 📱 Built-in Apps

1.  **Notes**: Secure, local-first note taking.
2.  **Calculator**: Standard iOS-style utility.
3.  **Files**: Manage data stored via the Talcum API.
4.  **Terminal**: Functional UNIX-like shell with basic utilities.
5.  **AI Chat**: Privacy-focused assistant powered by Pollinations AI.
6.  **Store**: Install custom apps via JSON repositories or direct URLs.

## 🔐 Security

All data is stored in a local `osData` object. To persist data across sessions:
1.  Click **Exit**.
2.  The OS will encrypt your entire state (apps, notes, data) using **AES-GCM (256-bit)** with your passcode.
3.  Copy the generated **Data Code**.
4.  Next time you log in, paste the code and your passcode to restore everything.

---
*Created for the talcumOS community.*
