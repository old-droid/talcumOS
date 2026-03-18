// ==================== SUPABASE VIRTUAL FILE SYSTEM ====================
// VFS implementation using Supabase for storage and metadata

class SupabaseVFS {
    constructor(supabaseClient, bucketName = 'vfs-files') {
        this.supabase = supabaseClient;
        this.bucketName = bucketName;
        this.initialized = false;
        
        // File type handlers (same as before)
        this.fileHandlers = {
            // Text files
            'text/plain': { icon: '📄', color: '#8E8E93' },
            'text/html': { icon: '🌐', color: '#007AFF' },
            'text/css': { icon: '🎨', color: '#FF9500' },
            'text/javascript': { icon: '📜', color: '#FFD60A' },
            'text/xml': { icon: '📄', color: '#8E8E93' },
            'text/markdown': { icon: '📝', color: '#8E8E93' },
            
            // Application files
            'application/json': { icon: '📋', color: '#34C759' },
            'application/pdf': { icon: '📕', color: '#FF3B30' },
            'application/zip': { icon: '📦', color: '#8E8E93' },
            'application/x-tar': { icon: '📦', color: '#8E8E93' },
            'application/x-gzip': { icon: '📦', color: '#8E8E93' },
            'application/msword': { icon: '📘', color: '#007AFF' },
            'application/vnd.ms-excel': { icon: '📗', color: '#34C759' },
            'application/vnd.ms-powerpoint': { icon: '📙', color: '#FF9500' },
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📘', color: '#007AFF' },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📗', color: '#34C759' },
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: '📙', color: '#FF9500' },
            
            // Image files
            'image/png': { icon: '🖼️', color: '#AF52DE' },
            'image/jpeg': { icon: '🖼️', color: '#AF52DE' },
            'image/gif': { icon: '🖼️', color: '#AF52DE' },
            'image/svg+xml': { icon: '🎨', color: '#5AC8FA' },
            'image/webp': { icon: '🖼️', color: '#AF52DE' },
            'image/bmp': { icon: '🖼️', color: '#AF52DE' },
            'image/tiff': { icon: '🖼️', color: '#AF52DE' },
            
            // Audio files
            'audio/mpeg': { icon: '🎵', color: '#FF375F' },
            'audio/wav': { icon: '🎵', color: '#FF375F' },
            'audio/ogg': { icon: '🎵', color: '#FF375F' },
            'audio/mp4': { icon: '🎵', color: '#FF375F' },
            'audio/aac': { icon: '🎵', color: '#FF375F' },
            
            // Video files
            'video/mp4': { icon: '🎬', color: '#FF2D55' },
            'video/webm': { icon: '🎬', color: '#FF2D55' },
            'video/ogg': { icon: '🎬', color: '#FF2D55' },
            'video/quicktime': { icon: '🎬', color: '#FF2D55' },
            'video/x-msvideo': { icon: '🎬', color: '#FF2D55' },
            
            // Executable files
            'application/x-executable': { icon: '⚙️', color: '#8E8E93' },
            'application/x-sharedlib': { icon: '🔧', color: '#8E8E93' },
            
            // Archive files
            'application/x-rar-compressed': { icon: '📦', color: '#8E8E93' },
            'application/x-7z-compressed': { icon: '📦', color: '#8E8E93' },
            
            // Default
            'application/octet-stream': { icon: '💾', color: '#8E8E93' }
        };
    }

    async init() {
        if (this.initialized) return;
        
        if (!this.supabase) {
            throw new Error('Supabase client not available');
        }
        
        // Verify auth
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error) {
            throw new Error(`Authentication error: ${error.message}`);
        }
        
        if (!user) {
            throw new Error('User not authenticated');
        }
        
        this.userId = user.id;
        this.initialized = true;
        
        // Initialize default directories if they don't exist
        await this.initializeDefaults();
    }

    async initializeDefaults() {
        const defaultDirs = [
            '/home',
            '/home/user',
            '/home/user/Documents',
            '/home/user/Downloads',
            '/home/user/Pictures',
            '/home/user/Music',
            '/home/user/Videos',
            '/usr',
            '/usr/bin',
            '/usr/lib',
            '/tmp'
        ];
        
        for (const dir of defaultDirs) {
            try {
                await this.mkdir(dir);
            } catch (e) {
                // Directory might already exist
            }
        }
        
        // Create default files
        try {
            await this.writeFile('/home/user/Documents/README.txt', 'Welcome to TalcumOS VFS!\n\nThis is a virtual file system with full file operation support.');
        } catch (e) {
            // File might already exist
        }
        
        try {
            await this.writeFile('/home/user/Documents/todo.txt', '1. Explore the file system\n2. Create some files\n3. Have fun!');
        } catch (e) {
            // File might already exist
        }
    }

    // Path utilities
    normalizePath(path) {
        if (!path) return '/';
        path = path.replace(/\\/g, '/');
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        // Remove double slashes
        path = path.replace(/\/+/g, '/');
        // Remove trailing slash except for root
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        return path;
    }

    splitPath(path) {
        path = this.normalizePath(path);
        if (path === '/') return { parent: '/', name: '' };
        const parts = path.split('/');
        return {
            parent: '/' + parts.slice(1, -1).join('/'),
            name: parts[parts.length - 1]
        };
    }

    // Database operations
    async getNode(path) {
        await this.init();
        path = this.normalizePath(path);
        
        if (path === '/') {
            return {
                id: null,
                path: '/',
                name: '/',
                type: 'directory',
                user_id: this.userId,
                parent_id: null
            };
        }
        
        const { data, error } = await this.supabase
            .from('files')
            .select('*')
            .eq('path', path)
            .eq('user_id', this.userId)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') { // Row not found
                return null;
            }
            throw new Error(`Error fetching node: ${error.message}`);
        }
        
        return data;
    }

    async getParentNode(path) {
        const { parent } = this.splitPath(path);
        return this.getNode(parent);
    }

    // Directory operations
    async mkdir(path, permissions = { read: true, write: true, execute: true }) {
        await this.init();
        path = this.normalizePath(path);
        const { parent, name } = this.splitPath(path);
        
        if (!name) throw new Error('Invalid directory name');
        
        // Check if directory already exists
        const existing = await this.getNode(path);
        if (existing) {
            if (existing.type === 'directory') return true; // Already exists
            throw new Error(`Path exists but is not a directory: ${path}`);
        }
        
        // Check parent exists
        const parentNode = await this.getNode(parent);
        if (!parentNode) {
            throw new Error(`Parent directory does not exist: ${parent}`);
        }
        
        if (parentNode.type !== 'directory') {
            throw new Error(`Parent is not a directory: ${parent}`);
        }
        
        // Insert directory record
        const { error } = await this.supabase
            .from('files')
            .insert({
                user_id: this.userId,
                parent_id: parentNode.id,
                name: name,
                path: path,
                type: 'directory',
                mime_type: null,
                storage_path: null,
                size: 0,
                permissions: permissions
            });
            
        if (error) {
            throw new Error(`Failed to create directory: ${error.message}`);
        }
        
        return true;
    }

    async listDirectory(path) {
        await this.init();
        path = this.normalizePath(path);
        
        const node = await this.getNode(path);
        if (!node) throw new Error(`Directory not found: ${path}`);
        if (node.type !== 'directory') throw new Error(`Not a directory: ${path}`);
        
        // Get all files/directories in this directory
        const { data, error } = await this.supabase
            .from('files')
            .select('*')
            .eq('parent_id', node.id)
            .eq('user_id', this.userId)
            .order('type', { ascending: true })
            .order('name', { ascending: true });
            
        if (error) {
            throw new Error(`Error listing directory: ${error.message}`);
        }
        
        return data.map(item => ({
            name: item.name,
            type: item.type,
            size: item.size || 0,
            modified: item.updated_at,
            permissions: item.permissions
        }));
    }

    // File operations
    async writeFile(path, content, mimeType = null) {
        await this.init();
        path = this.normalizePath(path);
        const { parent, name } = this.splitPath(path);
        
        if (!name) throw new Error('Invalid file name');
        
        // Auto-detect MIME type if not provided
        if (!mimeType) {
            mimeType = this.detectMimeType(name);
        }
        
        // Convert string content to Uint8Array if needed
        let data;
        if (typeof content === 'string') {
            const encoder = new TextEncoder();
            data = encoder.encode(content);
        } else if (content instanceof Uint8Array) {
            data = content;
        } else if (content instanceof ArrayBuffer) {
            data = new Uint8Array(content);
        } else {
            throw new Error('Content must be string or Uint8Array');
        }
        
        // Check parent directory
        const parentNode = await this.getNode(parent);
        if (!parentNode) {
            throw new Error(`Parent directory does not exist: ${parent}`);
        }
        
        if (parentNode.type !== 'directory') {
            throw new Error(`Parent is not a directory: ${parent}`);
        }
        
        // Generate storage path
        const fileExt = path.split('.').pop();
        const storagePath = `${this.userId}/${Date.now()}_${name}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await this.supabase
            .storage
            .from(this.bucketName)
            .upload(storagePath, data, {
                contentType: mimeType,
                upsert: true
            });
            
        if (uploadError) {
            throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
        
        // Get file size
        const size = data.length;
        
        // Check if file already exists
        const existingFile = await this.getNode(path);
        
        if (existingFile) {
            // Update existing file
            const { error: updateError } = await this.supabase
                .from('files')
                .update({
                    storage_path: storagePath,
                    size: size,
                    mime_type: mimeType,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingFile.id);
                
            if (updateError) {
                throw new Error(`Failed to update file metadata: ${updateError.message}`);
            }
        } else {
            // Insert new file
            const { error: insertError } = await this.supabase
                .from('files')
                .insert({
                    user_id: this.userId,
                    parent_id: parentNode.id,
                    name: name,
                    path: path,
                    type: 'file',
                    mime_type: mimeType,
                    storage_path: storagePath,
                    size: size,
                    permissions: { read: true, write: true, execute: false }
                });
                
            if (insertError) {
                throw new Error(`Failed to insert file metadata: ${insertError.message}`);
            }
        }
        
        return true;
    }

    async readFile(path) {
        await this.init();
        path = this.normalizePath(path);
        
        const node = await this.getNode(path);
        if (!node) throw new Error(`File not found: ${path}`);
        if (node.type !== 'file') throw new Error(`Not a file: ${path}`);
        
        if (!node.storage_path) {
            throw new Error('File has no storage path');
        }
        
        // Download from Supabase Storage
        const { data, error } = await this.supabase
            .storage
            .from(this.bucketName)
            .download(node.storage_path);
            
        if (error) {
            throw new Error(`Failed to download file: ${error.message}`);
        }
        
        // Convert Blob to Uint8Array
        const arrayBuffer = await data.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }

    async readFileAsText(path) {
        const content = await this.readFile(path);
        const decoder = new TextDecoder();
        return decoder.decode(content);
    }

    async readFileAsDataURL(path) {
        const node = await this.getNode(path);
        if (!node) throw new Error(`File not found: ${path}`);
        if (node.type !== 'file') throw new Error(`Not a file: ${path}`);
        
        const content = await this.readFile(path);
        const base64 = btoa(String.fromCharCode(...content));
        return `data:${node.mimeType};base64,${base64}`;
    }

    async delete(path) {
        await this.init();
        path = this.normalizePath(path);
        
        const node = await this.getNode(path);
        if (!node) throw new Error(`File or directory not found: ${path}`);
        
        // If it's a file, delete from storage
        if (node.type === 'file' && node.storage_path) {
            const { error } = await this.supabase
                .storage
                .from(this.bucketName)
                .remove([node.storage_path]);
                
            if (error) {
                console.warn(`Failed to remove file from storage: ${error.message}`);
            }
        }
        
        // Delete from database (cascades to children for directories)
        const { error } = await this.supabase
            .from('files')
            .delete()
            .eq('id', node.id);
            
        if (error) {
            throw new Error(`Failed to delete: ${error.message}`);
        }
        
        return true;
    }

    async move(oldPath, newPath) {
        await this.init();
        oldPath = this.normalizePath(oldPath);
        newPath = this.normalizePath(newPath);
        
        const node = await this.getNode(oldPath);
        if (!node) throw new Error(`Source not found: ${oldPath}`);
        
        const { parent: newParent, name: newName } = this.splitPath(newPath);
        const newParentNode = await this.getNode(newParent);
        
        if (!newParentNode || newParentNode.type !== 'directory') {
            throw new Error(`Destination directory not found: ${newParent}`);
        }
        
        // Update the file/directory record
        const { error } = await this.supabase
            .from('files')
            .update({
                name: newName,
                path: newPath,
                parent_id: newParentNode.id
            })
            .eq('id', node.id);
            
        if (error) {
            throw new Error(`Failed to move: ${error.message}`);
        }
        
        return true;
    }

    async copy(oldPath, newPath) {
        await this.init();
        oldPath = this.normalizePath(oldPath);
        newPath = this.normalizePath(newPath);
        
        const node = await this.getNode(oldPath);
        if (!node) throw new Error(`Source not found: ${oldPath}`);
        
        const { parent: newParent, name: newName } = this.splitPath(newPath);
        const newParentNode = await this.getNode(newParent);
        
        if (!newParentNode || newParentNode.type !== 'directory') {
            throw new Error(`Destination directory not found: ${newParent}`);
        }
        
        if (node.type === 'directory') {
            // Create new directory
            await this.mkdir(newPath);
            
            // Copy children recursively
            const children = await this.listDirectory(oldPath);
            for (const child of children) {
                await this.copy(`${oldPath}/${child.name}`, `${newPath}/${child.name}`);
            }
        } else if (node.type === 'file') {
            // Read file content
            const content = await this.readFile(oldPath);
            
            // Write to new location
            await this.writeFile(newPath, content, node.mime_type);
        }
        
        return true;
    }

    async exists(path) {
        try {
            const node = await this.getNode(path);
            return node !== null;
        } catch (e) {
            return false;
        }
    }

    async getFileType(path) {
        const node = await this.getNode(path);
        if (!node || node.type !== 'file') return null;
        
        return node.mime_type || 'application/octet-stream';
    }

    async getFileIcon(path) {
        const mimeType = await this.getFileType(path);
        if (!mimeType) return '📁';
        
        const handler = this.fileHandlers[mimeType];
        if (handler) return handler.icon;
        
        // Check for wildcard types
        const baseType = mimeType.split('/')[0];
        if (baseType === 'image') return '🖼️';
        if (baseType === 'audio') return '🎵';
        if (baseType === 'video') return '🎬';
        
        return '📄';
    }

    async getFileColor(path) {
        const mimeType = await this.getFileType(path);
        if (!mimeType) return '#8E8E93';
        
        const handler = this.fileHandlers[mimeType];
        if (handler) return handler.color;
        
        return '#8E8E93';
    }

    async search(directory, query, recursive = true) {
        await this.init();
        const results = [];
        
        const searchNode = async (currentPath) => {
            const items = await this.listDirectory(currentPath);
            
            for (const item of items) {
                const itemPath = `${currentPath}/${item.name}`;
                
                if (item.type === 'file' && item.name.includes(query)) {
                    results.push({
                        path: itemPath,
                        name: item.name,
                        type: 'file',
                        mimeType: await this.getFileType(itemPath)
                    });
                }
                
                if (item.type === 'directory' && recursive) {
                    await searchNode(itemPath);
                }
            }
        };
        
        await searchNode(directory);
        return results;
    }

    async getDiskUsage(path = '/') {
        await this.init();
        path = this.normalizePath(path);
        
        const node = await this.getNode(path);
        if (!node) return { total: 0, files: 0, directories: 0 };
        
        // For directories, we need to recursively calculate usage
        // This is a simplified version - in production, you might want to cache this
        let total = 0;
        let files = 0;
        let directories = 0;
        
        const countUsage = async (currentPath) => {
            const items = await this.listDirectory(currentPath);
            
            for (const item of items) {
                const itemPath = `${currentPath}/${item.name}`;
                
                if (item.type === 'file') {
                    total += item.size || 0;
                    files++;
                } else if (item.type === 'directory') {
                    directories++;
                    await countUsage(itemPath);
                }
            }
        };
        
        if (node.type === 'directory') {
            await countUsage(path);
        } else if (node.type === 'file') {
            total = node.size || 0;
            files = 1;
        }
        
        return { total, files, directories };
    }

    async chmod(path, permissions) {
        await this.init();
        const node = await this.getNode(path);
        if (!node) throw new Error(`Path not found: ${path}`);
        
        const newPermissions = {
            ...node.permissions,
            ...permissions
        };
        
        const { error } = await this.supabase
            .from('files')
            .update({ permissions: newPermissions })
            .eq('id', node.id);
            
        if (error) {
            throw new Error(`Failed to update permissions: ${error.message}`);
        }
        
        return true;
    }

    async symlink(targetPath, linkPath) {
        await this.init();
        targetPath = this.normalizePath(targetPath);
        linkPath = this.normalizePath(linkPath);
        
        const targetNode = await this.getNode(targetPath);
        if (!targetNode) throw new Error(`Target not found: ${targetPath}`);
        
        const { parent, name } = this.splitPath(linkPath);
        const parentNode = await this.getNode(parent);
        
        if (!parentNode || parentNode.type !== 'directory') {
            throw new Error(`Parent directory not found: ${parent}`);
        }
        
        const { error } = await this.supabase
            .from('files')
            .insert({
                user_id: this.userId,
                parent_id: parentNode.id,
                name: name,
                path: linkPath,
                type: 'symlink',
                mime_type: null,
                storage_path: targetPath, // Store target path in storage_path field
                size: 0,
                permissions: { read: true, write: true, execute: true }
            });
            
        if (error) {
            throw new Error(`Failed to create symlink: ${error.message}`);
        }
        
        return true;
    }

    async readlink(path) {
        const node = await this.getNode(path);
        if (!node) throw new Error(`Path not found: ${path}`);
        if (node.type !== 'symlink') throw new Error(`Not a symbolic link: ${path}`);
        
        return node.storage_path; // Target path is stored in storage_path
    }

    async resolveLink(path) {
        const node = await this.getNode(path);
        if (!node) return null;
        
        if (node.type === 'symlink') {
            const targetPath = node.storage_path;
            return this.getNode(targetPath);
        }
        
        return node;
    }

    async stat(path) {
        const node = await this.getNode(path);
        if (!node) throw new Error(`Path not found: ${path}`);
        
        return {
            type: node.type,
            name: node.name,
            size: node.size || 0,
            permissions: node.permissions,
            created: node.created_at,
            modified: node.updated_at,
            owner: node.user_id,
            mimeType: node.mime_type
        };
    }

    // Helper method to detect MIME type
    detectMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'txt': 'text/plain',
            'html': 'text/html',
            'htm': 'text/html',
            'css': 'text/css',
            'js': 'text/javascript',
            'json': 'application/json',
            'xml': 'text/xml',
            'md': 'text/markdown',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'bmp': 'image/bmp',
            'tif': 'image/tiff',
            'tiff': 'image/tiff',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'm4a': 'audio/mp4',
            'aac': 'audio/aac',
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'pdf': 'application/pdf',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            'tar': 'application/x-tar',
            'gz': 'application/x-gzip',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    }
}

// Export for module usage
export { SupabaseVFS };
