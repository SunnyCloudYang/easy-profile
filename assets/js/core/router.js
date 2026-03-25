/**
 * Client-side router for hash-based navigation
 */

const Router = {
    routes: new Map(),
    currentRoute: null,
    beforeHooks: [],
    afterHooks: [],

    /**
     * Register a route
     */
    register(path, handler) {
        this.routes.set(path, handler);
    },

    /**
     * Register multiple routes
     */
    registerRoutes(routes) {
        for (const [path, handler] of Object.entries(routes)) {
            this.register(path, handler);
        }
    },

    /**
     * Navigate to a path
     */
    navigate(path) {
        window.location.hash = path;
    },

    /**
     * Get current path from hash
     */
    getCurrentPath() {
        const hash = window.location.hash.slice(1) || '/';
        return hash;
    },

    /**
     * Parse route parameters
     */
    parseParams(routePath, actualPath) {
        const params = {};
        const routeParts = routePath.split('/');
        const pathParts = actualPath.split('/');

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].slice(1);
                params[paramName] = pathParts[i];
            }
        }

        return params;
    },

    /**
     * Match route
     */
    matchRoute(path) {
        // Direct match
        if (this.routes.has(path)) {
            return { handler: this.routes.get(path), params: {} };
        }

        // Parameterized routes
        for (const [routePath, handler] of this.routes.entries()) {
            const routeParts = routePath.split('/');
            const pathParts = path.split('/');

            if (routeParts.length !== pathParts.length) {
                continue;
            }

            let match = true;
            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i] !== pathParts[i] && !routeParts[i].startsWith(':')) {
                    match = false;
                    break;
                }
            }

            if (match) {
                const params = this.parseParams(routePath, path);
                return { handler, params };
            }
        }

        // Not found route
        if (this.routes.has('*')) {
            return { handler: this.routes.get('*'), params: {} };
        }

        return null;
    },

    /**
     * Handle route change
     */
    async handleRoute() {
        const path = this.getCurrentPath();

        // Execute before hooks
        for (const hook of this.beforeHooks) {
            const result = await hook(path, this.currentRoute);
            if (result === false) {
                return;
            }
        }

        const match = this.matchRoute(path);

        if (!match) {
            console.error(`No route found for path: ${path}`);
            return;
        }

        const previousRoute = this.currentRoute;
        this.currentRoute = { path, params: match.params };

        try {
            await match.handler(match.params);

            // Execute after hooks
            for (const hook of this.afterHooks) {
                await hook(path, previousRoute);
            }
        } catch (error) {
            console.error(`Error handling route ${path}:`, error);
            throw error;
        }
    },

    /**
     * Add before navigation hook
     */
    beforeEach(hook) {
        this.beforeHooks.push(hook);
    },

    /**
     * Add after navigation hook
     */
    afterEach(hook) {
        this.afterHooks.push(hook);
    },

    /**
     * Initialize router
     */
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });

        // Handle initial route
        if (!window.location.hash) {
            window.location.hash = '#/';
        } else {
            this.handleRoute();
        }
    },

    /**
     * Check if route is active
     */
    isActive(path) {
        const currentPath = this.getCurrentPath();
        return currentPath === path || currentPath.startsWith(path + '/');
    },

    /**
     * Get route params
     */
    getParams() {
        return this.currentRoute?.params || {};
    },

    /**
     * Get current route info
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}
