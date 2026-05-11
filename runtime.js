/**
 * TalcumOS Shared Runtime
 * Optimized for low-memory environments (iOS 12.5.8)
 */
window.TalcumRuntime = (() => {
    const apps = new Map();
    const registry = {};

    return {
        register: (id, factory) => {
            registry[id] = factory;
        },
        
        launch: async (id) => {
            if (apps.has(id)) {
                return apps.get(id).resume();
            }

            if (!registry[id]) {
                // Dynamic import shim for older WebKit
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = `apps/${id}.js`;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const appInstance = registry[id](window.talcum);
            apps.set(id, appInstance);
            appInstance.init();
        },

        suspend: (id) => {
            if (apps.has(id)) apps.get(id).suspend();
        },

        terminate: (id) => {
            if (apps.has(id)) {
                apps.get(id).destroy();
                apps.delete(id);
            }
        }
    };
})();
