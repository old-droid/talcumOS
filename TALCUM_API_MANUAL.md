# talcumOS Talcum API Manual

## Overview

The **Talcum API** is a lightweight, in-memory data storage and retrieval system designed for talcumOS applications. It provides a simple interface for apps to persist data, manage files, and communicate with the core OS through iframe message passing.

---

## Core API Methods

### 1. `talcum.store(key, value)`

**Description:** Store a value in memory with a unique key.

**Parameters:**
- `key` (string): Unique identifier for the data
- `value` (any): Data to store (strings, objects, arrays)

**Returns:** `true` on success

**Example:**
```javascript
talcum.store('user_name', 'John');
talcum.store('settings', JSON.stringify({theme: 'dark', lang: 'en'}));
```

---

### 2. `talcum.pull(key)`

**Description:** Retrieve a value from memory by key.

**Parameters:**
- `key` (string): Unique identifier

**Returns:** The stored value, or `null` if not found

**Example:**
```javascript
const name = talcum.pull('user_name');
const settings = JSON.parse(talcum.pull('settings') || '{}');
```

---

### 3. `talcum.list()`

**Description:** Get all stored keys in the system.

**Parameters:** None

**Returns:** Array of all keys

**Example:**
```javascript
const allKeys = talcum.list();
console.log(allKeys); // ['user_name', 'settings', 'dir_documents', ...]
```

---

### 4. `talcum.remove(key)`

**Description:** Delete a key-value pair from memory.

**Parameters:**
- `key` (string): Unique identifier to remove

**Returns:** `true` on success

**Example:**
```javascript
talcum.remove('user_name');
```

---

## Iframe Communication Protocol

For apps loaded in iframes, use the postMessage API to communicate with talcumOS:

### Message Format

```javascript
// Send message from iframe to parent
window.parent.postMessage({
    source: 'talcum-api',
    action: 'store|pull|list|remove',
    key: 'your_key',
    value: 'your_value',
    requestId: 'unique_id'
}, '*');

// Listen for responses
window.addEventListener('message', function(event) {
    if (event.data.source === 'talcum-os') {
        console.log('Result:', event.data.result);
    }
});
```

### Example Iframe App

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Iframe App</title>
</head>
<body>
    <h1>My App</h1>
    <input id="input" placeholder="Enter data">
    <button onclick="saveData()">Save</button>
    <div id="output"></div>

    <script>
        function saveData() {
            const value = document.getElementById('input').value;
            window.parent.postMessage({
                source: 'talcum-api',
                action: 'store',
                key: 'my_data',
                value: value,
                requestId: Date.now()
            }, '*');
        }

        function loadData() {
            window.parent.postMessage({
                source: 'talcum-api',
                action: 'pull',
                key: 'my_data',
                requestId: Date.now()
            }, '*');
        }

        window.addEventListener('message', function(event) {
            if (event.data.source === 'talcum-os') {
                document.getElementById('output').innerText = event.data.result;
            }
        });

        loadData();
    </script>
</body>
</html>
```

---

## Terminal Commands (Dynamic)

The Terminal module (`terminal.js`) provides dynamic command execution with Talcum API integration:

### Available Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `help` | `help` | List all available commands |
| `clear` | `clear` | Clear terminal output |
| `date` | `date` | Display current date and time |
| `whoami` | `whoami` | Display current user |
| `pwd` | `pwd` | Print working directory |
| `uptime` | `uptime` | Show system uptime |
| `fortune` | `fortune` | Display a random quote |
| `ls` | `ls` | List all stored files |
| `echo` | `echo <text>` | Echo text to output |
| `mkdir` | `mkdir <name>` | Create a new folder |
| `touch` | `touch <filename>` | Create a new empty file |
| `rm` | `rm <name>` | Remove a file or folder |
| `cat` | `cat <filename>` | Display file contents |
| `save` | `save <name> <content>` | Save content to a file |
| `load` | `load <name>` | Load and display file content |

### Terminal Examples

```bash
$ mkdir documents
Directory created: documents

$ touch notes.txt
File created: notes.txt

$ save notes.txt "Hello World"
Saved: notes.txt (11 bytes)

$ cat notes.txt
Hello World

$ ls
documents  notes.txt

$ rm notes.txt
Removed: notes.txt
```

---

## Data Persistence

### In-Memory Storage

All data is stored in the `osData` object in memory. When users export their data via the "Exit" app, the entire `osData` is encrypted and converted to a data code.

### Data Structure

```javascript
osData = {
    installedApps: [],      // Array of installed app IDs
    notes: [],              // Array of note objects
    customApps: [],         // Array of custom app objects
    customData: {}          // Key-value store for app data
};
```

### Exporting/Importing Data

**Export:**
1. Click "Exit" app
2. Copy the generated data code
3. Save it securely

**Import:**
1. Unlock talcumOS
2. Paste the data code in the "Data Code" field
3. Click "Unlock"

---

## App Development Guidelines

### Creating a Custom App

1. **Prepare your HTML/CSS/JavaScript**
2. **Host it on a web server** (HTTPS required)
3. **Add to talcumOS:**
   - Open Store app
   - Click "Custom App"
   - Enter app name and URL
   - Choose "Iframe" (embedded) or "Redirect" (new tab)
   - Click "Add"

### Best Practices

- **Use Talcum API** for persistent storage across sessions
- **Keep file sizes small** (under 50KB recommended)
- **Test in Safari 12+** for compatibility
- **Use postMessage** for iframe communication
- **Handle errors gracefully** with try-catch blocks

### Example Custom App

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Counter App</title>
    <style>
        body { font-family: -apple-system, sans-serif; padding: 20px; }
        button { padding: 10px 20px; font-size: 16px; }
    </style>
</head>
<body>
    <h1>Counter</h1>
    <p>Count: <span id="count">0</span></p>
    <button onclick="increment()">+</button>
    <button onclick="decrement()">-</button>
    <button onclick="reset()">Reset</button>

    <script>
        function increment() {
            let count = parseInt(window.parent.talcum?.pull('counter') || '0');
            count++;
            window.parent.talcum?.store('counter', count.toString());
            document.getElementById('count').innerText = count;
        }

        function decrement() {
            let count = parseInt(window.parent.talcum?.pull('counter') || '0');
            count--;
            window.parent.talcum?.store('counter', count.toString());
            document.getElementById('count').innerText = count;
        }

        function reset() {
            window.parent.talcum?.store('counter', '0');
            document.getElementById('count').innerText = '0';
        }

        // Load initial value
        document.getElementById('count').innerText = 
            window.parent.talcum?.pull('counter') || '0';
    </script>
</body>
</html>
```

---

## Security Considerations

1. **Data Encryption:** All exported data is encrypted with AES-256-GCM using PBKDF2 key derivation
2. **Iframe Sandbox:** Custom apps loaded via iframe have restricted permissions
3. **Same-Origin Policy:** Cross-origin requests require CORS headers
4. **No Backend:** All data stays on the device; no server uploads

---

## Performance Tips

1. **Minimize DOM Operations:** Batch updates when possible
2. **Use Lazy Loading:** Load images with `loading="lazy"`
3. **Optimize Storage:** Keep individual values under 1MB
4. **Clean Up:** Remove unused keys with `talcum.remove()`

---

## Troubleshooting

### Data Not Persisting

- Ensure you're using `talcum.store()` to save data
- Export and import your data code to persist across sessions
- Check browser console for errors

### Iframe App Not Loading

- Verify URL is HTTPS
- Check browser console for CORS errors
- Ensure the app doesn't block iframe embedding

### Terminal Commands Not Working

- Verify `terminal.js` is loaded
- Check that `execTerminalCommand()` is defined
- Review console for JavaScript errors

---

## API Reference Summary

| Method | Signature | Returns |
|--------|-----------|---------|
| store | `talcum.store(key, value)` | `true` |
| pull | `talcum.pull(key)` | value or `null` |
| list | `talcum.list()` | Array of keys |
| remove | `talcum.remove(key)` | `true` |

---

## Version

- **talcumOS:** v2.6
- **Talcum API:** v1.0
- **Minimum iOS:** 12.5.8+
- **Minimum Safari:** 12+

---

## Support

For issues or questions, refer to the talcumOS GitHub repository or check the system logs in the Terminal app.
