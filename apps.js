// ==================== APPS ====================
// Mock app implementations with state management

const apps = {
    notes: {
        id: 'notes',
        name: 'Notes',
        icon: '📝',
        color: '#FF9500',
        state: {
            content: '',
            lastModified: null
        },
        open: function() {
            console.log('Opening Notes app');
            this.render();
        },
        render: function() {
            return `
                <div class="app-content" style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h2>Notes</h2>
                        <button class="toolbar-btn" onclick="apps.notes.save()">💾 Save</button>
                    </div>
                    <textarea id="notes-content" style="flex: 1; font-family: sans-serif; font-size: 14px; padding: 10px; border: 1px solid #ccc; border-radius: 8px; resize: none;">${this.state.content || ''}</textarea>
                </div>
            `;
        },
        save: async function() {
            const content = document.getElementById('notes-content').value;
            this.state.content = content;
            this.state.lastModified = new Date().toISOString();
            if (window.StateManager) {
                await window.StateManager.save('notes_state', this.state);
            }
            console.log('Notes saved');
        },
        loadState: async function() {
            if (window.StateManager) {
                const state = await window.StateManager.load('notes_state');
                if (state) this.state = state;
            }
        }
    },

    calculator: {
        id: 'calculator',
        name: 'Calculator',
        icon: '🧮',
        color: '#34C759',
        state: {
            display: '0',
            previousValue: null,
            operator: null,
            waitingForOperand: false
        },
        open: function() {
            console.log('Opening Calculator app');
            this.render();
        },
        render: function() {
            const buttons = [
                ['C', '±', '%', '÷'],
                ['7', '8', '9', '×'],
                ['4', '5', '6', '-'],
                ['1', '2', '3', '+'],
                ['0', '.', '=']
            ];
            
            let buttonsHtml = '';
            buttons.forEach(row => {
                row.forEach(btn => {
                    const isOperator = ['÷', '×', '-', '+', '='].includes(btn);
                    const isZero = btn === '0';
                    buttonsHtml += `
                        <button class="calc-btn ${isOperator ? 'operator' : ''} ${isZero ? 'zero' : ''}" 
                                onclick="apps.calculator.press('${btn}')">
                            ${btn}
                        </button>
                    `;
                });
            });
            
            return `
                <div class="app-content" style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
                    <h2 style="margin-bottom: 15px;">Calculator</h2>
                    <div class="calc-display" style="background: #1c1c1e; color: white; font-size: 48px; text-align: right; padding: 20px; border-radius: 10px; margin-bottom: 15px; font-family: sans-serif;">
                        ${this.state.display}
                    </div>
                    <div class="calc-buttons" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; flex: 1;">
                        ${buttonsHtml}
                    </div>
                </div>
            `;
        },
        press: function(btn) {
            const display = this.state.display;
            
            if (btn >= '0' && btn <= '9') {
                if (display === '0' || this.state.waitingForOperand) {
                    this.state.display = btn;
                    this.state.waitingForOperand = false;
                } else {
                    this.state.display = display + btn;
                }
            } else if (btn === '.') {
                if (!display.includes('.')) {
                    this.state.display = display + '.';
                }
            } else if (btn === 'C') {
                this.state.display = '0';
                this.state.previousValue = null;
                this.state.operator = null;
            } else if (btn === '±') {
                this.state.display = (parseFloat(display) * -1).toString();
            } else if (btn === '%') {
                this.state.display = (parseFloat(display) / 100).toString();
            } else if (['+', '-', '×', '÷'].includes(btn)) {
                this.state.previousValue = parseFloat(display);
                this.state.operator = btn;
                this.state.waitingForOperand = true;
            } else if (btn === '=') {
                if (this.state.operator && this.state.previousValue !== null) {
                    const current = parseFloat(display);
                    let result;
                    switch (this.state.operator) {
                        case '+': result = this.state.previousValue + current; break;
                        case '-': result = this.state.previousValue - current; break;
                        case '×': result = this.state.previousValue * current; break;
                        case '÷': result = this.state.previousValue / current; break;
                    }
                    this.state.display = result.toString();
                    this.state.previousValue = null;
                    this.state.operator = null;
                    this.state.waitingForOperand = true;
                }
            }
            
            this.render();
        }
    },

    camera: {
        id: 'camera',
        name: 'Camera',
        icon: '📷',
        color: '#5AC8FA',
        state: {
            stream: null
        },
        open: function() {
            console.log('Opening Camera app');
            this.render();
        },
        render: function() {
            return `
                <div class="app-content" style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
                    <h2 style="margin-bottom: 15px;">Camera</h2>
                    <div style="flex: 1; background: #000; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">
                        📷 Camera Preview (simulated)
                    </div>
                </div>
            `;
        }
    },

    weather: {
        id: 'weather',
        name: 'Weather',
        icon: '☀️',
        color: '#FF9500',
        state: {
            temperature: 72,
            condition: 'Sunny',
            location: 'San Francisco'
        },
        open: function() {
            console.log('Opening Weather app');
            this.render();
        },
        render: function() {
            return `
                <div class="app-content" style="padding: 20px; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <h2 style="margin-bottom: 15px;">Weather</h2>
                    <div style="font-size: 64px; margin-bottom: 20px;">☀️</div>
                    <div style="font-size: 48px; font-weight: bold;">${this.state.temperature}°F</div>
                    <div style="font-size: 24px; color: #8E8E93; margin-top: 10px;">${this.state.condition}</div>
                    <div style="font-size: 18px; color: #8E8E93; margin-top: 5px;">${this.state.location}</div>
                </div>
            `;
        }
    },

    music: {
        id: 'music',
        name: 'Music',
        icon: '🎵',
        color: '#FF375F',
        state: {
            currentSong: 'Sample Song',
            playing: false
        },
        open: function() {
            console.log('Opening Music app');
            this.render();
        },
        render: function() {
            return `
                <div class="app-content" style="padding: 20px; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <h2 style="margin-bottom: 20px;">Music</h2>
                    <div style="font-size: 64px; margin-bottom: 20px;">🎵</div>
                    <div style="font-size: 24px; margin-bottom: 10px;">${this.state.currentSong}</div>
                    <div style="display: flex; gap: 20px; margin-top: 20px;">
                        <button class="toolbar-btn" onclick="alert('Previous')">⏮️</button>
                        <button class="toolbar-btn" onclick="apps.music.togglePlay()">
                            ${this.state.playing ? '⏸️' : '▶️'}
                        </button>
                        <button class="toolbar-btn" onclick="alert('Next')">⏭️</button>
                    </div>
                </div>
            `;
        },
        togglePlay: function() {
            this.state.playing = !this.state.playing;
            this.render();
        }
    },

    settings: {
        id: 'settings',
        name: 'Settings',
        icon: '⚙️',
        color: '#8E8E93',
        state: {
            theme: 'light'
        },
        open: function() {
            console.log('Opening Settings app');
            this.render();
        },
        render: function() {
            return `
                <div class="app-content" style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
                    <h2 style="margin-bottom: 15px;">Settings</h2>
                    <div style="margin-top: 20px;">
                        <h3>Appearance</h3>
                        <div style="margin-top: 10px;">
                            <label>
                                <input type="radio" name="theme" value="light" checked> Light
                            </label>
                            <label style="margin-left: 20px;">
                                <input type="radio" name="theme" value="dark"> Dark
                            </label>
                        </div>
                    </div>
                    <div style="margin-top: 30px;">
                        <h3>About</h3>
                        <p>TalcumOS v1.0</p>
                        <p>Built with Supabase</p>
                    </div>
                </div>
            `;
        }
    },

    calendar: {
        id: 'calendar',
        name: 'Calendar',
        icon: '📅',
        color: '#FF3B30',
        state: {
            currentDate: new Date()
        },
        open: function() {
            console.log('Opening Calendar app');
            this.render();
        },
        render: function() {
            const date = this.state.currentDate;
            const year = date.getFullYear();
            const month = date.toLocaleString('default', { month: 'long' });
            
            // Generate calendar days
            const firstDay = new Date(year, date.getMonth(), 1).getDay();
            const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
            
            let daysHtml = '';
            for (let i = 0; i < firstDay; i++) {
                daysHtml += '<div></div>';
            }
            for (let day = 1; day <= daysInMonth; day++) {
                daysHtml += `<div class="calendar-day">${day}</div>`;
            }
            
            return `
                <div class="app-content" style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
                    <h2 style="margin-bottom: 15px;">Calendar</h2>
                    <div style="font-size: 24px; margin-bottom: 20px;">${month} ${year}</div>
                    <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; flex: 1;">
                        <div class="calendar-day-header">Sun</div>
                        <div class="calendar-day-header">Mon</div>
                        <div class="calendar-day-header">Tue</div>
                        <div class="calendar-day-header">Wed</div>
                        <div class="calendar-day-header">Thu</div>
                        <div class="calendar-day-header">Fri</div>
                        <div class="calendar-day-header">Sat</div>
                        ${daysHtml}
                    </div>
                </div>
            `;
        }
    },

    messages: {
        id: 'messages',
        name: 'Messages',
        icon: '💬',
        color: '#34C759',
        state: {},
        open: function() {
            console.log('Opening Messages app');
            this.render();
        },
        render: function() {
            return `
                <div class="app-content" style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
                    <h2 style="margin-bottom: 15px;">Messages</h2>
                    <div style="flex: 1; background: #f5f5f5; border-radius: 10px; padding: 15px;">
                        <div style="margin-bottom: 15px;">
                            <strong>Alice:</strong> Hey! How's TalcumOS?
                        </div>
                        <div style="margin-bottom: 15px;">
                            <strong>You:</strong> It's great! Working on the file manager now.
                        </div>
                    </div>
                </div>
            `;
        }
    },

    // Enhanced File Manager
    files: {
        id: 'files',
        name: 'Files',
        icon: '📁',
        color: '#5AC8FA',
        state: {
            currentPath: '/home/user',
            selectedFile: null,
            viewMode: 'grid'
        },
        open: function() {
            console.log('Opening Files app');
            this.render();
        },
        render: async function() {
            const vfs = window.VFS;
            if (!vfs) {
                return `<div class="app-content" style="padding: 20px;"><h2>Files</h2><p>VFS not available</p></div>`;
            }
            
            let content = '';
            try {
                const items = await vfs.listDirectory(this.state.currentPath);
                
                // Get disk usage for current directory
                let diskInfo = '';
                try {
                    const usage = await vfs.getDiskUsage(this.state.currentPath);
                    const usedMB = (usage.total / (1024 * 1024)).toFixed(2);
                    diskInfo = `<span style="color: #8E8E93;">| 📊 ${usedMB} MB used | ${usage.files} files | ${usage.directories} folders</span>`;
                } catch (e) {
                    diskInfo = '';
                }
                
                // Breadcrumb navigation
                const pathParts = this.state.currentPath.split('/').filter(p => p);
                let breadcrumb = '<div class="breadcrumb">';
                breadcrumb += '<span class="breadcrumb-item" data-path="/">🏠 Home</span>';
                let currentPath = '';
                pathParts.forEach((part, index) => {
                    currentPath += '/' + part;
                    breadcrumb += `<span class="breadcrumb-separator">/</span>`;
                    breadcrumb += `<span class="breadcrumb-item" data-path="${currentPath}">${part}</span>`;
                });
                breadcrumb += '</div>';
                
                // File grid/list - process items asynchronously first
                const processedItems = [];
                for (const item of items) {
                    const icon = item.type === 'directory' ? '📁' : await vfs.getFileIcon(this.state.currentPath + '/' + item.name);
                    const color = item.type === 'directory' ? '#5AC8FA' : await vfs.getFileColor(this.state.currentPath + '/' + item.name);
                    const isSelected = this.state.selectedFile === item.name;
                    
                    processedItems.push(`
                        <div class="file-item ${isSelected ? 'selected' : ''}" data-name="${item.name}" data-type="${item.type}">
                            <div class="file-icon" style="color: ${color}">${icon}</div>
                            <div class="file-name">${item.name}</div>
                        </div>
                    `);
                }
                const itemsHtml = processedItems.join('');
                
                content = `
                    <div class="app-content" style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h2>Files ${diskInfo}</h2>
                            <div class="file-toolbar">
                                <button class="toolbar-btn" onclick="apps.files.createFolder()">📁 New Folder</button>
                                <button class="toolbar-btn" onclick="apps.files.createFile()">📄 New File</button>
                                <button class="toolbar-btn" onclick="apps.files.deleteSelected()">🗑️ Delete</button>
                            </div>
                        </div>
                        ${breadcrumb}
                        <div class="file-grid" style="flex: 1; overflow-y: auto;">
                            ${itemsHtml}
                        </div>
                        <div style="margin-top: 10px; font-size: 12px; color: #8E8E93;">
                            Path: ${this.state.currentPath} | Items: ${items.length}
                        </div>
                    </div>
                `;
            } catch (e) {
                content = `<div class="app-content" style="padding: 20px;"><h2>Files</h2><p>Error: ${e.message}</p></div>`;
            }
            
            return content;
        },
        
        createFolder: async function() {
            const name = prompt('Enter folder name:');
            if (name) {
                try {
                    await window.VFS.mkdir(this.state.currentPath + '/' + name);
                    await this.render();
                } catch (e) {
                    alert('Error: ' + e.message);
                }
            }
        },
        
        createFile: async function() {
            const name = prompt('Enter file name:');
            if (name) {
                try {
                    await window.VFS.writeFile(this.state.currentPath + '/' + name, '');
                    await this.render();
                } catch (e) {
                    alert('Error: ' + e.message);
                }
            }
        },
        
        deleteSelected: async function() {
            if (!this.state.selectedFile) {
                alert('No file selected');
                return;
            }
            
            if (confirm(`Delete "${this.state.selectedFile}"?`)) {
                try {
                    await window.VFS.delete(this.state.currentPath + '/' + this.state.selectedFile);
                    this.state.selectedFile = null;
                    await this.render();
                } catch (e) {
                    alert('Error: ' + e.message);
                }
            }
        },
        
        navigate: async function(path) {
            this.state.currentPath = path;
            this.state.selectedFile = null;
            await this.render();
        },
        
        selectFile: async function(name) {
            this.state.selectedFile = name;
            await this.render();
        },
        
        openItem: async function(name) {
            const path = this.state.currentPath + '/' + name;
            const vfs = window.VFS;
            let node = await vfs.getNode(path);
            
            // Handle symbolic links
            if (node && node.type === 'symlink') {
                node = await vfs.resolveLink(path);
                if (!node) {
                    alert('Broken symbolic link');
                    return;
                }
            }
            
            if (!node) {
                alert('File not found');
                return;
            }
            
            if (node.type === 'directory') {
                await this.navigate(path);
            } else {
                // Open file with appropriate viewer
                const mimeType = await vfs.getFileType(path);
                if (mimeType.startsWith('text/')) {
                    // Open text file in viewer
                    const content = await vfs.readFileAsText(path);
                    this.showTextViewer(path, content);
                } else if (mimeType.startsWith('image/')) {
                    // Open image in viewer
                    this.showImageViewer(path);
                } else if (mimeType.startsWith('video/')) {
                    // Open video in viewer
                    this.showVideoViewer(path);
                } else {
                    alert('Cannot open file type: ' + mimeType);
                }
            }
        },
        
        showTextViewer: function(path, content) {
            const viewer = document.createElement('div');
            viewer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 1000;
                width: 80%;
                height: 80%;
                display: flex;
                flex-direction: column;
            `;
            
            viewer.innerHTML = `
                <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <strong>${path.split('/').pop()}</strong>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
                </div>
                <textarea style="flex: 1; border: none; padding: 15px; font-family: monospace; font-size: 14px; resize: none;" readonly>${content}</textarea>
            `;
            
            document.body.appendChild(viewer);
        },
        
        showImageViewer: async function(path) {
            const vfs = window.VFS;
            try {
                const blob = await vfs.readFileAsBlob(path);
                const url = URL.createObjectURL(blob);
                
                const viewer = document.createElement('div');
                viewer.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 1000;
                    max-width: 90%;
                    max-height: 90%;
                    display: flex;
                    flex-direction: column;
                `;
                
                viewer.innerHTML = `
                    <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <strong>${path.split('/').pop()}</strong>
                        <button onclick="this.parentElement.parentElement.remove(); URL.revokeObjectURL('${url}');" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
                    </div>
                    <div style="padding: 15px; display: flex; justify-content: center; align-items: center; background: #f5f5f5;">
                        <img src="${url}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
                    </div>
                `;
                
                document.body.appendChild(viewer);
            } catch (e) {
                alert('Error opening image: ' + e.message);
            }
        },
        
        showVideoViewer: async function(path) {
            const vfs = window.VFS;
            try {
                const blob = await vfs.readFileAsBlob(path);
                const url = URL.createObjectURL(blob);
                
                const viewer = document.createElement('div');
                viewer.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 1000;
                    width: 80%;
                    max-width: 800px;
                    display: flex;
                    flex-direction: column;
                `;
                
                viewer.innerHTML = `
                    <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <strong>${path.split('/').pop()}</strong>
                        <button onclick="this.parentElement.parentElement.remove(); URL.revokeObjectURL('${url}');" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
                    </div>
                    <div style="padding: 15px; display: flex; justify-content: center; align-items: center; background: #000;">
                        <video src="${url}" controls style="max-width: 100%; max-height: 70vh;"></video>
                    </div>
                `;
                
                document.body.appendChild(viewer);
            } catch (e) {
                alert('Error opening video: ' + e.message);
            }
        },
        
        showContextMenu: function(name, event) {
            event.preventDefault();
            const path = this.state.currentPath + '/' + name;
            const vfs = window.VFS;
            
            // Create context menu
            const menu = document.createElement('div');
            menu.style.cssText = `
                position: fixed;
                left: ${event.clientX}px;
                top: ${event.clientY}px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                min-width: 150px;
            `;
            
            const menuItems = [
                { label: 'Open', action: async () => await this.openItem(name) },
                { label: 'Rename', action: async () => await this.renameItem(name) },
                { label: 'Delete', action: async () => await this.deleteItem(name) },
                { label: 'Copy', action: async () => await this.copyItem(name) },
                { label: 'Info', action: async () => await this.showInfo(name) }
            ];
            
            menuItems.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.textContent = item.label;
                menuItem.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #eee;
                `;
                menuItem.addEventListener('click', async () => {
                    await item.action();
                    document.body.removeChild(menu);
                });
                menuItem.addEventListener('mouseover', () => {
                    menuItem.style.background = '#f0f0f0';
                });
                menuItem.addEventListener('mouseout', () => {
                    menuItem.style.background = 'white';
                });
                menu.appendChild(menuItem);
            });
            
            // Remove last border
            menu.lastChild.style.borderBottom = 'none';
            
            // Close menu when clicking elsewhere
            const closeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    document.body.removeChild(menu);
                    document.removeEventListener('click', closeMenu);
                }
            };
            
            setTimeout(() => {
                document.addEventListener('click', closeMenu);
            }, 100);
            
            document.body.appendChild(menu);
        },
        
        renameItem: async function(oldName) {
            const newName = prompt('Enter new name:', oldName);
            if (newName && newName !== oldName) {
                try {
                    const vfs = window.VFS;
                    const oldPath = this.state.currentPath + '/' + oldName;
                    const newPath = this.state.currentPath + '/' + newName;
                    await vfs.move(oldPath, newPath);
                    await this.render();
                } catch (e) {
                    alert('Error: ' + e.message);
                }
            }
        },
        
        deleteItem: async function(name) {
            if (confirm(`Delete "${name}"?`)) {
                try {
                    await window.VFS.delete(this.state.currentPath + '/' + name);
                    this.state.selectedFile = null;
                    await this.render();
                } catch (e) {
                    alert('Error: ' + e.message);
                }
            }
        },
        
        copyItem: async function(name) {
            const newName = prompt('Enter copy name:', name + ' copy');
            if (newName) {
                try {
                    const vfs = window.VFS;
                    const oldPath = this.state.currentPath + '/' + name;
                    const newPath = this.state.currentPath + '/' + newName;
                    await vfs.copy(oldPath, newPath);
                    await this.render();
                } catch (e) {
                    alert('Error: ' + e.message);
                }
            }
        },
        
        showInfo: async function(name) {
            try {
                const vfs = window.VFS;
                const path = this.state.currentPath + '/' + name;
                const info = await vfs.stat(path);
                
                const sizeKB = (info.size / 1024).toFixed(2);
                alert(`File: ${info.name}\nType: ${info.type}\nSize: ${sizeKB} KB\nModified: ${info.modified}\nPermissions: ${JSON.stringify(info.permissions)}`);
            } catch (e) {
                alert('Error: ' + e.message);
            }
        }
    }
};

// Export for module usage
console.log('APPS: Setting window.apps');
window.apps = apps;
console.log('APPS: window.apps set with keys:', Object.keys(apps));
export { apps };
