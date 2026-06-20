/**
 * talcumOS API Wrapper Library
 * A nice, easy-to-use JS wrapper for 3rd party apps to interact with talcumOS.
 */
const TalcumAPI = (() => {
    const requestId = () => Math.random().toString(36).substring(2, 15);
    const pendingRequests = new Map();

    window.addEventListener('message', (event) => {
        const { source, action, requestId, result, error } = event.data;
        if (source !== 'talcum-os') return;

        if (pendingRequests.has(requestId)) {
            const { resolve, reject } = pendingRequests.get(requestId);
            pendingRequests.delete(requestId);
            if (error) reject(new Error(error));
            else resolve(result);
        }
    });

    const sendRequest = (action, payload = {}) => {
        return new Promise((resolve, reject) => {
            const id = requestId();
            pendingRequests.set(id, { resolve, reject });
            
            window.parent.postMessage({
                source: 'talcum-api',
                action,
                requestId: id,
                ...payload
            }, '*');
        });
    };

    return {
        /**
         * Store data in talcumOS
         * @param {string} key 
         * @param {any} value 
         */
        store: (key, value) => sendRequest('store', { key, value }),

        /**
         * Retrieve data from talcumOS
         * @param {string} key 
         */
        pull: (key) => sendRequest('pull', { key }),

        /**
         * List all keys for the current app
         */
        list: () => sendRequest('list'),

        /**
         * Remove data from talcumOS
         * @param {string} key 
         */
        remove: (key) => sendRequest('remove', { key }),

        /**
         * Request system info or capabilities
         */
        getInfo: () => sendRequest('info')
    };
})();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TalcumAPI;
} else {
    window.TalcumAPI = TalcumAPI;
}
