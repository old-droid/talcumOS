# talcumOS v2.0 - Optimized iOS-like Operating System

A lightweight, responsive, link-based operating system designed to run smoothly on low-memory devices like iPad Air 1 (1GB RAM).

## 🚀 Features

### Core Features
- **Link-Based Storage**: All data is encoded in the URL hash, no server required
- **Responsive Design**: Automatically adapts to any screen size using CSS `clamp()` and viewport units
- **Optimized Performance**: Minimal CSS, efficient JavaScript, optimized for 1GB RAM devices
- **iOS-Inspired UI**: Native iOS aesthetic with glassmorphism effects
- **Persistent Dock**: Quick access to favorite apps

### Built-in Apps

1. **Notes** - Simple note-taking with automatic data persistence
2. **Calculator** - Full-featured calculator with basic operations
3. **Weather** - Weather information display
4. **Files** - File browser interface
5. **Music** - Music player with playback controls
6. **YouTube** - Video player with Invidious proxy support
7. **Terminal** - Command-line interface with basic commands
8. **Settings** - System settings and preferences
9. **Custom App Proxy** - Load external web apps via iframe
10. **Exit** - Generate and save data link

## ⚡ Performance Optimizations

### Memory Optimization
- Minimal DOM structure
- Efficient CSS with no animations on scroll
- Lazy-loaded app windows
- No external dependencies or frameworks

### Responsive Design
- Uses CSS `clamp()` for fluid typography and spacing
- Grid layout adapts to screen size automatically
- Aspect ratio preservation for all elements
- Safe area insets for notched devices

### Network Optimization
- Single HTML file (~30KB)
- No external API calls (except YouTube proxy)
- Efficient data compression using Base64 encoding
- Works completely offline after initial load

## 📱 Usage

### Login
1. Leave the passcode field empty or enter any value
2. Paste a previously saved data link in the "Data Code" field, or leave blank to start fresh
3. Tap "Unlock"

### Save Your Data
1. Tap the "Exit" app
2. Copy the generated link
3. Store it in Google Keep Web or any note-taking app
4. Share the link to access your data on any device

### Add Custom Apps
1. Open the "Custom App" app
2. Enter the URL of any web app
3. Tap "Load App"
4. The app will load in an iframe

### YouTube Videos
1. Open the "YouTube" app
2. Enter a YouTube video ID or full URL
3. Tap "Load Video"
4. Uses Invidious proxy for privacy

## 🛠️ Technical Details

### Architecture
- Single-file HTML5 application
- No build process required
- Works on any modern browser
- Progressive Web App (PWA) capable

### Data Format
Data is stored as Base64-encoded JSON in the URL hash:
```
https://example.com/index.html#eyJub3RlcyI6IkhlbGxvIHdvcmxkIiwibXVzaWMiOnsidGl0bGUiOiJTb25nIn19
```

### Browser Compatibility
- iOS Safari 12+
- Android Chrome/Firefox
- Desktop browsers
- iPad Air 1 and newer

## ⌨️ Keyboard Shortcuts

### Terminal
- `help` - Show available commands
- `clear` - Clear terminal
- `echo <text>` - Print text
- `date` - Show current date/time
- `pwd` - Show current directory

## 📲 Tips for iPad Air 1

1. **Add to Home Screen**: Use "Add to Home Screen" in Safari for app-like experience
2. **Disable Zoom**: Pinch-zoom is disabled for better performance
3. **Clear Cache**: Periodically clear browser cache to free up memory
4. **Backup Data**: Always save your data link to Google Keep or similar service

## 📊 File Size
- Optimized for minimal bandwidth
- Single file: ~30KB (minified)
- No external dependencies
- Loads instantly on 3G connections

## 🔒 Privacy & Security
- All data stored locally in URL hash
- No server-side storage
- No tracking or analytics
- Works completely offline

## 🎯 Future Enhancements
- Photo gallery app
- Voice memo recorder
- Reminders/To-Do list
- Dark mode improvements
- Keyboard support

## 📄 License
Open source - Feel free to modify and distribute

## 💬 Support
For issues or feature requests, visit the GitHub repository.
