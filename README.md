# talcumOS (Link Edition)

A minimalist, static, and functional web-based operating system inspired by iOS.

## 🚀 Features

- **Link-Based Storage**: No databases, no servers. Your data is encoded directly into the URL hash.
- **iOS-Inspired UI**: Clean, responsive, and familiar interface.
- **Functional Apps**:
  - **Notes**: Persistent text storage.
  - **Calculator**: Fully functional arithmetic operations.
  - **Weather**: Real-time simulated weather display.
- **Optimized & Lightweight**: The entire OS is contained within a single HTML file (`index.html`).

## 🛠️ How to Use

1. **Login**: Provide a previously generated talcumOS URL to load your data, or leave it blank to start fresh.
2. **Usage**: Open apps from the home screen.
3. **Save/Exit**: Click the **Exit** app. It will generate a unique link containing all your data.
4. **Persistence**: Copy the generated link and store it somewhere safe (e.g., **Google Keep Web**). To resume your session, simply visit that link.

## 📦 Technical Details

- **Architecture**: Static HTML5 + CSS3 + Vanilla JavaScript.
- **Data Persistence**: Base64 + UTF-8 encoding of a JSON state object stored in the URL fragment (`#`).
- **Privacy**: Since data is stored in the URL and handled client-side, no data ever touches a server.
