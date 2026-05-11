/**
 * Lightweight Lockscreen Widget for Google Keep
 * Isolated and resource-efficient.
 */
const KeepWidget = {
    init() {
        const lockScreen = document.getElementById('lock-screen');
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'keep-quick-access';
        widgetContainer.style = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            cursor: pointer;
            z-index: 1001;
        `;
        widgetContainer.innerHTML = `<img src="assets/keep-icon.svg" style="width: 30px; height: 30px;">`;
        
        widgetContainer.onclick = (e) => {
            e.stopPropagation();
            this.openKeep();
        };
        
        lockScreen.appendChild(widgetContainer);
    },

    openKeep() {
        const overlay = document.createElement('div');
        overlay.style = `
            position: fixed;
            inset: 0;
            background: #000;
            z-index: 2000;
            display: flex;
            flex-direction: column;
        `;
        
        overlay.innerHTML = `
            <div style="height: 44px; background: #f1f1f1; display: flex; align-items: center; padding: 0 15px;">
                <span style="color: #007AFF; cursor: pointer;" id="close-keep">Close</span>
                <span style="flex: 1; text-align: center; font-weight: 600;">Google Keep</span>
            </div>
            <iframe src="https://keep.google.com/" style="flex: 1; border: none;" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
        `;
        
        document.body.appendChild(overlay);
        document.getElementById('close-keep').onclick = () => document.body.removeChild(overlay);
    }
};

// Initialize if on lockscreen
if (document.getElementById('lock-screen')) KeepWidget.init();
