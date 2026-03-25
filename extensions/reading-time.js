/**
 * Reading Time Extension
 * Adds reading time estimates to blog posts
 */

return {
    name: 'ReadingTime',

    /**
     * Initialize the extension
     */
    async init() {
        console.log('ReadingTime extension initialized');

        // Register a custom section type
        ExtensionManager.registerSectionType('blog-post', this.renderBlogPost.bind(this));
    },

    /**
     * Render blog post with reading time
     */
    renderBlogPost(config) {
        const readingTime = MarkdownUtil.calculateReadingTime(config.content || '');

        const postConfig = {
            ...config,
            subtitle: `${readingTime} min read${config.subtitle ? ' • ' + config.subtitle : ''}`
        };

        return Renderer.render('section', postConfig);
    },

    /**
     * Cleanup
     */
    async destroy() {
        console.log('ReadingTime extension destroyed');
    }
};
