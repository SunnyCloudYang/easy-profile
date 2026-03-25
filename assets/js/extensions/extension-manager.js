/**
 * Extension manager - handles extension lifecycle and hooks
 */

const ExtensionManager = {
    hooks: {
        beforeInit: [],
        afterInit: [],
        beforeRender: [],
        afterRender: [],
        beforeNavigate: [],
        afterNavigate: [],
        onThemeChange: [],
        onError: []
    },

    /**
     * Initialize all registered extensions
     */
    async initAll() {
        const extensions = ExtensionRegistry.getAll();

        for (const [name, extension] of extensions) {
            try {
                if (extension.init) {
                    await extension.init();
                }
            } catch (error) {
                console.error(`Failed to initialize extension "${name}":`, error);
                this.executeHook('onError', { extension: name, error, phase: 'init' });
            }
        }
    },

    /**
     * Register a hook
     */
    on(hookName, callback) {
        if (!this.hooks[hookName]) {
            console.warn(`Unknown hook: ${hookName}`);
            return;
        }
        this.hooks[hookName].push(callback);
    },

    /**
     * Remove a hook
     */
    off(hookName, callback) {
        if (!this.hooks[hookName]) return;

        const index = this.hooks[hookName].indexOf(callback);
        if (index > -1) {
            this.hooks[hookName].splice(index, 1);
        }
    },

    /**
     * Execute a hook
     */
    async executeHook(hookName, data) {
        if (!this.hooks[hookName]) return;

        for (const callback of this.hooks[hookName]) {
            try {
                await callback(data);
            } catch (error) {
                console.error(`Error in hook "${hookName}":`, error);
            }
        }
    },

    /**
     * Load extension from URL
     */
    async loadExtension(name, url) {
        try {
            const code = await Loader.load(url);
            const extension = new Function('App', 'Parser', 'Loader', 'Renderer', 'Router', 'DOM', code);
            const instance = extension(App, Parser, Loader, Renderer, Router, DOM);
            ExtensionRegistry.register(name, instance);
            return instance;
        } catch (error) {
            console.error(`Failed to load extension "${name}" from ${url}:`, error);
            throw error;
        }
    },

    /**
     * Load multiple extensions
     */
    async loadExtensions(extensions) {
        const promises = [];
        for (const [name, url] of Object.entries(extensions)) {
            promises.push(this.loadExtension(name, url));
        }
        await Promise.all(promises);
    },

    /**
     * Register a custom component
     */
    registerComponent(name, component) {
        if (!App.components) {
            App.components = {};
        }
        App.components[name] = component;
    },

    /**
     * Register a custom section type
     */
    registerSectionType(type, handler) {
        if (!App.sectionTypes) {
            App.sectionTypes = {};
        }
        App.sectionTypes[type] = handler;
    },

    /**
     * Get extension
     */
    getExtension(name) {
        return ExtensionRegistry.get(name);
    },

    /**
     * Check if extension is loaded
     */
    isLoaded(name) {
        return ExtensionRegistry.has(name);
    },

    /**
     * Destroy all extensions
     */
    async destroyAll() {
        const extensions = ExtensionRegistry.getAll();

        for (const [name, extension] of extensions) {
            try {
                if (extension.destroy) {
                    await extension.destroy();
                }
            } catch (error) {
                console.error(`Failed to destroy extension "${name}":`, error);
            }
        }

        // Clear all hooks
        for (const hookName of Object.keys(this.hooks)) {
            this.hooks[hookName] = [];
        }
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExtensionManager;
}
