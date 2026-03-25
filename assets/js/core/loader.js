/**
 * File loader with caching and error handling
 */

const Loader = {
    cache: new Map(),

    /**
     * Load a file from URL
     */
    async load(url, options = {}) {
        const cacheKey = url;
        const useCache = options.cache !== false;

        // Check cache
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
            }

            const content = await response.text();

            // Cache result
            if (useCache) {
                this.cache.set(cacheKey, content);
            }

            return content;
        } catch (error) {
            console.error(`Error loading ${url}:`, error);
            throw error;
        }
    },

    /**
     * Load JSON file
     */
    async loadJSON(url, options = {}) {
        const content = await this.load(url, options);
        try {
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error parsing JSON from ${url}:`, error);
            throw error;
        }
    },

    /**
     * Load YAML file and parse
     */
    async loadYAML(url, options = {}) {
        const content = await this.load(url, options);
        try {
            return Parser.parseYAML(content);
        } catch (error) {
            console.error(`Error parsing YAML from ${url}:`, error);
            throw error;
        }
    },

    /**
     * Load Markdown file
     */
    async loadMarkdown(url, options = {}) {
        const content = await this.load(url, options);
        return Parser.parseFrontMatter(content);
    },

    /**
     * Load multiple files in parallel
     */
    async loadAll(urls, options = {}) {
        const promises = urls.map(url => this.load(url, options));
        return Promise.all(promises);
    },

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    },

    /**
     * Preload resources
     */
    async preload(resources) {
        const promises = resources.map(resource => {
            if (typeof resource === 'string') {
                return this.load(resource);
            } else if (resource.url) {
                return this.load(resource.url, resource.options || {});
            }
        });
        return Promise.all(promises);
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Loader;
}
