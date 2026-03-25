/**
 * Extension registry - stores registered extensions
 */

const ExtensionRegistry = {
    extensions: new Map(),

    /**
     * Register an extension
     */
    register(name, extension) {
        if (this.extensions.has(name)) {
            console.warn(`Extension "${name}" is already registered. Overwriting.`);
        }
        this.extensions.set(name, extension);
    },

    /**
     * Get an extension
     */
    get(name) {
        return this.extensions.get(name);
    },

    /**
     * Check if extension exists
     */
    has(name) {
        return this.extensions.has(name);
    },

    /**
     * Remove an extension
     */
    remove(name) {
        this.extensions.delete(name);
    },

    /**
     * Get all extensions
     */
    getAll() {
        return Array.from(this.extensions.entries());
    },

    /**
     * Clear all extensions
     */
    clear() {
        this.extensions.clear();
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExtensionRegistry;
}
