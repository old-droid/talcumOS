/**
 * TalcumOS Browser App Module
 */
TalcumRuntime.register('browser', (api) => {
    let container = null;

    return {
        init: () => {
            container = document.createElement('div');
            container.className = 'app-window';
            container.id = 'app-browser';
            container.innerHTML = `
                <div class="nav-bar">
                    <span class="nav-title">Browser</span>
                    <span class="nav-btn" onclick="TalcumRuntime.suspend('browser')">Done</span>
                </div>
                <div class="app-content" style="display: flex; flex-direction: column;">
                    <div style="padding: 10px; background: #fff; border-bottom: 0.5px solid #ccc;">
                        <input type="url" id="browser-url" class="search-input" placeholder="Enter URL..." value="https://www.google.com">
                    </div>
                    <iframe id="browser-frame" src="https://www.google.com" style="flex: 1; border: none;" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
                </div>
            `;
            document.body.appendChild(container);
            container.style.display = 'flex';
            
            document.getElementById('browser-url').onkeypress = (e) => {
                if (e.key === 'Enter') {
                    let url = e.target.value;
                    if (!url.startsWith('http')) url = 'https://' + url;
                    document.getElementById('browser-frame').src = url;
                }
            };
        },
        resume: () => {
            container.style.display = 'flex';
        },
        suspend: () => {
            container.style.display = 'none';
        },
        destroy: () => {
            if (container) container.remove();
        }
    };
});
