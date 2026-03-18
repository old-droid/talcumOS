// ==================== STATE MANAGER ====================
// Handles state storage using Supabase
// PGlite is only used as a temporary buffer for offline operations

class StateManager {
    constructor() {
        this.supabase = null;
        this.ready = false;
    }

    async init() {
        // Wait for Supabase to be ready
        if (window.kernelInitPromise && window.kernelInitPromise.promise) {
            try {
                await window.kernelInitPromise.promise;
            } catch (e) {
                console.error('Failed to wait for kernel init:', e);
                throw e;
            }
        }

        // Get Supabase client
        if (window.DB && window.DB.supabase) {
            this.supabase = window.DB.supabase;
        } else if (window.supabase_ready) {
            this.supabase = window.supabase_ready;
        } else {
            // Try to initialize Supabase
            if (window.DB && window.DB.initSupabase) {
                this.supabase = window.DB.initSupabase();
            }
        }

        if (!this.supabase) {
            throw new Error('Supabase client not available');
        }

        this.ready = true;
        return this;
    }

    async save(key, value) {
        if (!this.ready) await this.init();
        
        const userId = await this.getUserId();
        if (!userId) throw new Error('Not authenticated');

        const data = {
            user_id: userId,
            key: key,
            value: JSON.stringify(value),
            updated_at: new Date().toISOString()
        };

        const { error } = await this.supabase
            .from('app_state')
            .upsert(data, { onConflict: 'user_id,key' });

        if (error) {
            console.error('Failed to save state:', error);
            throw error;
        }
        return true;
    }

    async load(key) {
        if (!this.ready) await this.init();
        
        const userId = await this.getUserId();
        if (!userId) return null;

        const { data, error } = await this.supabase
            .from('app_state')
            .select('value')
            .eq('user_id', userId)
            .eq('key', key)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // Not "not found" error
                console.error('Failed to load state:', error);
            }
            return null;
        }
        return data ? JSON.parse(data.value) : null;
    }

    async saveLayout(apps) {
        return this.save('app_layout', apps);
    }

    async loadLayout() {
        const layout = await this.load('app_layout');
        return layout || this.getDefaultLayout();
    }

    async syncAll() {
        // Called on sign-in to ensure default layout exists
        const layout = await this.loadLayout();
        if (!layout || layout.length === 0) {
            await this.saveLayout(this.getDefaultLayout());
        }
        return true;
    }

    getDefaultLayout() {
        return [
            { id: 'files', name: 'Files', icon: '📁', x: 0, y: 0 },
            { id: 'terminal', name: 'Terminal', icon: '⌨️', x: 1, y: 0 },
            { id: 'editor', name: 'Editor', icon: '✏️', x: 2, y: 0 },
            { id: 'calculator', name: 'Calculator', icon: '🧮', x: 3, y: 0 },
            { id: 'disk', name: 'Disk Utility', icon: '💾', x: 0, y: 1 },
            { id: 'notes', name: 'Notes', icon: '📝', x: 1, y: 1 },
            { id: 'settings', name: 'Settings', icon: '⚙️', x: 2, y: 1 },
            { id: 'photos', name: 'Photos', icon: '🖼️', x: 3, y: 1 }
        ];
    }

    async getUserId() {
        if (!this.ready) await this.init();
        
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            return user?.id || null;
        } catch (e) {
            return null;
        }
    }
}

// Create global instance
window.StateManager = new StateManager();

// Export for module usage
export { StateManager };
