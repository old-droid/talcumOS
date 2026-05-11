# TalcumOS Lightweight App Architecture

## 1. Architecture Plan
TalcumOS utilizes a **Shared Runtime Micro-kernel** approach. The core OS handles window management, events, and persistence, while apps are treated as lightweight, stateless modules.

- **Shared Runtime:** A single execution context for all built-in apps to minimize overhead.
- **Lazy Loading:** Apps are only fetched and initialized when the user clicks the icon.
- **Virtual DOM (Minimal):** Direct DOM manipulation using `insertAdjacentHTML` for speed, avoiding heavy frameworks.
- **App Lifecycle:** `Load -> Init -> Active -> Suspended -> Terminated`.

## 2. File/Module Structure
```text
/
├── index.html          # Core OS, Kernel, Window Manager
├── runtime.js          # Shared App Runtime & Lifecycle Manager
├── components.js       # Shared UI Components (iOS-style widgets)
├── apps/               # Lazy-loaded app modules
│   ├── browser.js
│   ├── productivity.js # Bundled: Notes, Calendar, Reminders
│   ├── media.js        # Bundled: Photos, Music, TV
│   └── ...
└── assets/             # Compressed SVG icons and vector graphics
```

## 3. Performance Optimization Plan
- **On-Demand Rendering:** Apps do not exist in the DOM until opened.
- **GPU Layer Management:** Use `transform: translateZ(0)` only on active windows to prevent VRAM exhaustion on iPad Air 1.
- **Event Delegation:** Single event listener at the window level for app interactions.
- **Zero-Dependency:** No external libraries; use native `fetch`, `Promise`, and `IntersectionObserver`.

## 4. Memory Optimization Plan
- **Immediate Suspension:** Inactive apps have their `requestAnimationFrame` loops paused and heavy listeners detached.
- **DOM Pruning:** When an app is closed, its entire DOM subtree is purged.
- **Object Pooling:** Reuse modal and list elements across different apps.
- **GC Triggers:** Explicitly nullify large data objects when apps transition to the background.

## 5. Security Considerations
- **Isolated Webviews:** Browser and third-party apps run in `sandbox`ed iframes.
- **Messaging Protocol:** All app-to-OS communication goes through a validated `postMessage` gateway.
- **Permission Model:** Apps must request "Capabilities" (Camera, Files) which are handled by the Kernel.

## 6. Lightweight Implementation Examples
### Shared Runtime Snippet
```javascript
const AppRuntime = {
    registry: {},
    activeApps: new Map(),
    async launch(appId) {
        if (!this.registry[appId]) await this.loadModule(appId);
        const app = new this.registry[appId]();
        app.mount(document.getElementById('app-container'));
        this.activeApps.set(appId, app);
    },
    suspend(appId) {
        const app = this.activeApps.get(appId);
        if (app) app.onSuspend();
    }
};
```

## 7. Risks and Mitigations
- **Risk:** Memory pressure on iOS 12.5.8 (1GB RAM).
  - **Mitigation:** Strict limit of 3 concurrent "Active" apps; others are auto-suspended.
- **Risk:** WebKit JIT overhead for 23 apps.
  - **Mitigation:** Code splitting to keep the initial parse under 100KB.
- **Risk:** Slow startup for complex editors.
  - **Mitigation:** Use "Shell-first" rendering; show UI stubs while logic loads.
