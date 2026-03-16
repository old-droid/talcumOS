// File Browser JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const fileList = document.getElementById('file-list');
    const breadcrumb = document.getElementById('breadcrumb');
    const newFolderBtn = document.getElementById('new-folder-btn');
    const newFileBtn = document.getElementById('new-file-btn');
    const contextMenu = document.getElementById('context-menu');
    const newItemDialog = document.getElementById('new-item-dialog');
    const dialogTitle = document.getElementById('dialog-title');
    const newItemInput = document.getElementById('new-item-input');
    const dialogCancelBtn = document.getElementById('dialog-cancel-btn');
    const dialogConfirmBtn = document.getElementById('dialog-confirm-btn');
    const contextMenuOpen = document.getElementById('context-menu-open');
    const contextMenuRename = document.getElementById('context-menu-rename');
    const contextMenuDelete = document.getElementById('context-menu-delete');
    const contextMenuInfo = document.getElementById('context-menu-info');
    
    let currentPath = '';
    let selectedItem = null;
    let selectedItemType = null;
    let contextMenuX = 0;
    let contextMenuY = 0;
    
    // Initialize
    loadDirectory('');
    
    // Load directory contents
    function loadDirectory(path) {
        currentPath = path;
        updateBreadcrumb(path);
        
        // Show loading state
        fileList.innerHTML = '<div class="file-item loading">Loading...</div>';
        
        // Fetch directory contents from server
        fetch(`/api/filebrowser?path=${encodeURIComponent(path)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                renderFileList(data);
            })
            .catch(error => {
                console.error('Error loading directory:', error);
                fileList.innerHTML = '<div class="file-item loading">Error loading directory</div>';
            });
    }
    
    // Update breadcrumb navigation
    function updateBreadcrumb(path) {
        if (path === '') {
            breadcrumb.innerHTML = '<span>VFS</span>';
            return;
        }
        
        const parts = path.split('/').filter(part => part !== '');
        let breadcrumbHTML = '<span onclick="loadDirectory(\'\')">VFS</span>';
        
        let accumulatedPath = '';
        parts.forEach((part, index) => {
            accumulatedPath += (accumulatedPath ? '/' : '') + part;
            breadcrumbHTML += ` <span onclick="loadDirectory('${accumulatedPath}')" ${index === parts.length - 1 ? 'class="active"' : ''}>${part}</span>`;
        });
        
        breadcrumb.innerHTML = breadcrumbHTML;
    }
    
    // Render file list
    function renderFileList(items) {
        if (items.length === 0) {
            fileList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📁</div><div class="empty-state-title">Empty folder</div><div class="empty-state-title">This folder is empty</div></div>';
            return;
        }
        
        fileList.innerHTML = '';
        
        // Sort folders first, then files
        const sortedItems = [...items].sort((a, b) => {
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
        
        sortedItems.forEach(item => {
            const fileItem = document.createElement('div');
            fileItem.className = `file-item ${item.type}`;
            fileItem.dataset.path = item.path;
            fileItem.dataset.type = item.type;
            fileItem.dataset.name = item.name;
            
            fileItem.innerHTML = `
                <div class="file-icon ${item.type}">${item.type === 'folder' ? '📁' : '📄'}</div>
                <div class="file-info">
                    <div class="file-name">${escapeHtml(item.name)}</div>
                    <div class="file-type">${item.type === 'folder' ? 'Folder' : 'File'}</div>
                    ${item.type === 'file' ? `<div class="file-size">${formatFileSize(item.size)}</div>` : ''}
                </div>
                <div class="file-actions">
                    ${item.type === 'file' ? '<button class="action-btn view">View</button>' : ''}
                    <button class="action-btn more">⋯</button>
                </div>
            `;
            
            // Add click handlers
            fileItem.addEventListener('click', (e) => {
                // Ignore clicks on action buttons
                if (e.target.classList.contains('action-btn')) return;
                
                // Select item
                selectItem(fileItem);
                
                // Navigate if it's a folder
                if (item.type === 'folder') {
                    loadDirectory(item.path);
                }
            });
            
            // Add double-click handler for opening files
            fileItem.addEventListener('dblclick', (e) => {
                // Ignore double clicks on action buttons
                if (e.target.classList.contains('action-btn')) return;
                
                if (item.type === 'file') {
                    viewFile(item);
                }
            });
            
            // Add context menu handler
            fileItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                
                // Select item on right-click
                selectItem(fileItem);
                
                // Show context menu
                showContextMenu(e.pageX, e.pageY, item);
            });
            
            fileList.appendChild(fileItem);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileItem = e.target.closest('.file-item');
                const item = {
                    name: fileItem.dataset.name,
                    path: fileItem.dataset.path,
                    type: fileItem.dataset.type,
                    size: parseInt(fileItem.dataset.size || 0)
                };
                viewFile(item);
            });
        });
        
        document.querySelectorAll('.action-btn.more').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileItem = e.target.closest('.file-item');
                const item = {
                    name: fileItem.dataset.name,
                    path: fileItem.dataset.path,
                    type: fileItem.dataset.type,
                    size: parseInt(fileItem.dataset.size || 0)
                };
                showContextMenu(e.pageX, e.pageY, item);
            });
        });
    }
    
    // Select item
    function selectItem(fileItem) {
        // Deselect previously selected item
        if (selectedItem) {
            selectedItem.classList.remove('selected');
        }
        
        // Select new item
        fileItem.classList.add('selected');
        selectedItem = fileItem;
        selectedItemType = fileItem.dataset.type;
        selectedItem.name = fileItem.dataset.name;
        selectedItem.path = fileItem.dataset.path;
    }
    
    // Show context menu
    function showContextMenu(x, y, item) {
        contextMenuX = x;
        contextMenuY = y;
        selectedItem = {
            name: item.name,
            path: item.path,
            type: item.type,
            size: item.size
        };
        selectedItemType = item.type;
        
        // Update context menu items based on item type
        if (item.type === 'folder') {
            contextMenuOpen.textContent = 'Open';
            contextMenuOpen.style.display = 'flex';
            contextMenuRename.style.display = 'flex';
            contextMenuDelete.style.display = 'flex';
            contextMenuInfo.style.display = 'flex';
        } else {
            contextMenuOpen.textContent = 'View';
            contextMenuOpen.style.display = 'flex';
            contextMenuRename.style.display = 'flex';
            contextMenuDelete.style.display = 'flex';
            contextMenuInfo.style.display = 'flex';
        }
        
        // Position context menu
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.display = 'block';
    }
    
    // Hide context menu
    function hideContextMenu() {
        contextMenu.style.display = 'none';
    }
    
    // Hide new item dialog
    function hideNewItemDialog() {
        newItemDialog.style.display = 'none';
        newItemInput.value = '';
    }
    
    // Show new item dialog
    function showNewItemDialog(isFolder) {
        dialogTitle.textContent = isFolder ? 'New Folder' : 'New File';
        newItemDialog.style.display = 'flex';
        newItemInput.focus();
        
        // Store whether we're creating a folder or file
        newItemDialog.dataset.isFolder = isFolder;
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    // View file
    function viewFile(item) {
        // For now, just show an alert with file info
        // In a real app, we'd fetch and display the file content
        alert(`File: ${item.name}\nPath: ${item.path}\nType: ${item.type}\nSize: ${formatFileSize(item.size)}\n\nNote: File viewing functionality would be implemented here.`);
    }
    
    // Rename item
    function renameItem() {
        if (!selectedItem) return;
        
        const newName = prompt('Enter new name:', selectedItem.name);
        if (newName === null || newName.trim() === '') return;
        
        const cleanName = newName.trim();
        if (cleanName === selectedItem.name) return;
        
        // Validate name
        if (!cleanName || cleanName.includes('/') || cleanName.includes('..')) {
            alert('Invalid name');
            return;
        }
        
        // Construct paths
        const oldPath = selectedItem.path ? `${selectedItem.path}/${selectedItem.name}` : selectedItem.name;
        const newPath = selectedItem.path ? `${selectedItem.path}/${cleanName}` : cleanName;
        
        // Send rename request
        fetch(`/api/filebrowser`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'rename',
                oldPath: oldPath,
                newPath: newPath
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadDirectory(currentPath);
            } else {
                alert('Error renaming: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error renaming item');
        });
    }
    
    // Delete item
    function deleteItem() {
        if (!selectedItem) return;
        
        if (!confirm(`Are you sure you want to delete "${selectedItem.name}"?`)) {
            return;
        }
        
        // Construct path
        const itemPath = selectedItem.path ? `${selectedItem.path}/${selectedItem.name}` : selectedItem.name;
        
        // Send delete request
        fetch(`/api/filebrowser`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete',
                path: itemPath
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // If we deleted the current directory, go back
                if (selectedItem.path === currentPath && selectedItem.type === 'folder') {
                    // Go to parent directory
                    const parentPath = currentPath.split('/').slice(0, -1).join('/');
                    loadDirectory(parentPath);
                } else {
                    loadDirectory(currentPath);
                }
            } else {
                alert('Error deleting: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting item');
        });
    }
    
    // Get item info
    function getItemInfo() {
        if (!selectedItem) return;
        
        // Fetch detailed info from server
        const itemPath = selectedItem.path ? `${selectedItem.path}/${selectedItem.name}` : selectedItem.name;
        
        fetch(`/api/filebrowser?path=${encodeURIComponent(itemPath)}&info=true`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Show info in a modal or alert
                let infoText = `Name: ${selectedItem.name}\n`;
                infoText += `Type: ${selectedItem.type === 'folder' ? 'Folder' : 'File'}\n`;
                infoText += `Path: ${itemPath}\n`;
                
                if (selectedItem.type === 'file') {
                    infoText += `Size: ${formatFileSize(selectedItem.size)}\n`;
                }
                
                // Add date info if available
                if (data.modified) {
                    const date = new Date(data.modified);
                    infoText += `Modified: ${date.toLocaleString()}\n`;
                }
                
                if (data.created) {
                    const date = new Date(data.created);
                    infoText += `Created: ${date.toLocaleString()}\n`;
                }
                
                alert(infoText);
            })
            .catch(error => {
                console.error('Error getting item info:', error);
                // Fallback to basic info
                alert(`Name: ${selectedItem.name}\nType: ${selectedItem.type === 'folder' ? 'Folder' : 'File'}\nPath: ${selectedItem.path ? `${selectedItem.path}/${selectedItem.name}` : selectedItem.name}\nSize: ${selectedItem.type === 'file' ? formatFileSize(selectedItem.size) : 'N/A'}`);
            });
    }
    
    // Event listeners
    newFolderBtn.addEventListener('click', () => showNewItemDialog(true));
    newFileBtn.addEventListener('click', () => showNewItemDialog(false));
    
    dialogCancelBtn.addEventListener('click', hideNewItemDialog);
    
    dialogConfirmBtn.addEventListener('click', () => {
        const itemName = newItemInput.value.trim();
        if (itemName === '') {
            alert('Please enter a name');
            return;
        }
        
        // Validate name
        if (itemName.includes('/') || itemName.includes('..')) {
            alert('Invalid name');
            return;
        }
        
        const isFolder = newItemDialog.dataset.isFolder === 'true';
        
        // Construct path
        const itemPath = currentPath ? `${currentPath}/${itemName}` : itemName;
        
        // Send create request
        fetch(`/api/filebrowser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: isFolder ? 'create_folder' : 'create_file',
                path: currentPath,
                name: itemName
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                hideNewItemDialog();
                loadDirectory(currentPath);
            } else {
                alert('Error creating: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error creating item');
        });
    });
    
    contextMenuOpen.addEventListener('click', () => {
        hideContextMenu();
        if (selectedItemType === 'folder') {
            loadDirectory(selectedItem.path);
        } else {
            viewFile(selectedItem);
        }
    });
    
    contextMenuRename.addEventListener('click', () => {
        hideContextMenu();
        renameItem();
    });
    
    contextMenuDelete.addEventListener('click', () => {
        hideContextMenu();
        deleteItem();
    });
    
    contextMenuInfo.addEventListener('click', () => {
        hideContextMenu();
        getItemInfo();
    });
    
    // Hide context menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target) && !e.target.closest('.file-item')) {
            hideContextMenu();
        }
        
        // Also hide new item dialog if clicking outside
        if (!newItemDialog.contains(e.target) && e.target !== newFolderBtn && e.target !== newFileBtn) {
            hideNewItemDialog();
        }
    });
    
    // Hide context menu on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideContextMenu();
            hideNewItemDialog();
        }
    });
    
    // Prevent context menu on the actual page
    document.addEventListener('contextmenu', (e) => {
        // Only allow context menu on file items
        if (!e.target.closest('.file-item')) {
            e.preventDefault();
        }
    });
    
    // Expose loadDirectory function for breadcrumb
    window.loadDirectory = loadDirectory;
});