/**
 * Main application orchestrator
 */

const App = {
    config: null,
    currentPage: null,
    theme: 'light',
    components: {},
    sectionTypes: {},

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Execute beforeInit hooks
            await ExtensionManager.executeHook('beforeInit');

            // Load configuration
            this.config = await this.loadConfig();

            // Initialize theme
            this.initTheme();

            // Load templates
            await this.loadTemplates();

            // Initialize router
            this.initRouter();

            // Initialize extensions
            await this.initExtensions();

            // Hide loading, show content
            DOM.hide('#loading');
            DOM.show('#content');

            // Execute afterInit hooks
            await ExtensionManager.executeHook('afterInit');

            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            await ExtensionManager.executeHook('onError', { error, phase: 'init' });
            throw error;
        }
    },

    /**
     * Load configuration
     */
    async loadConfig() {
        try {
            const config = await Loader.loadYAML('config.yml');
            return config;
        } catch (error) {
            console.error('Failed to load config.yml:', error);
            // Return default config
            return {
                site: {
                    title: 'My Profile',
                    description: 'Personal profile and portfolio',
                    lang: 'en',
                    footer: '© 2026. All rights reserved.'
                },
                home: { sections: [] },
                pages: {},
                social: []
            };
        }
    },

    /**
     * Initialize theme
     */
    initTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.theme = savedTheme;
        }

        this.applyTheme(this.theme);

        // Listen for system theme changes (only if no saved preference)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    /**
     * Apply theme
     */
    applyTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update theme icon
        const icon = DOM.$('.theme-icon');
        if (icon) {
            const icons = {
                'light': '🌙',
                'dark': '☀️',
                'midnight': '🌊',
                'ocean': '🌑',
                'ocean-dark': '☀️'
            };
            icon.textContent = icons[theme] || '🎨';
        }

        // Execute theme change hooks
        ExtensionManager.executeHook('onThemeChange', { theme });
    },

    /**
     * Toggle theme — cycles through all available themes
     */
    toggleTheme() {
        const themes = ['light', 'midnight', 'ocean', 'ocean-dark'];
        const currentIndex = themes.indexOf(this.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.applyTheme(themes[nextIndex]);
    },

    /**
     * Load templates
     */
    async loadTemplates() {
        // Load main layout
        const mainLayout = await Loader.load('templates/layouts/main.html');
        Renderer.registerTemplate('layout-main', mainLayout);

        // Load component templates
        const templates = {
            'section': 'templates/components/section.html',
            'timeline': 'templates/components/timeline.html',
            'gallery': 'templates/components/gallery.html',
            'hero': 'templates/components/hero.html',
            'project': 'templates/pages/project.html',
            'skills': 'templates/components/skills.html'
        };

        for (const [name, url] of Object.entries(templates)) {
            try {
                await Renderer.loadTemplate(name, url);
            } catch (error) {
                console.warn(`Failed to load template "${name}":`, error);
            }
        }
    },

    /**
     * Initialize router
     */
    initRouter() {
        // Register routes from config
        const pages = this.config.pages || {};

        for (const [path, pageConfig] of Object.entries(pages)) {
            Router.register(path, async (params) => {
                await this.renderPage(path, pageConfig, params);
            });
        }

        // Blog post route
        Router.register('/blog/:slug', async (params) => {
            await this.renderBlogPost(params);
        });

        // Project detail route
        Router.register('/projects/:slug', async (params) => {
            await this.renderProject(params);
        });

        // Home page
        Router.register('/', async () => {
            await this.renderHome();
        });

        // 404 page
        Router.register('*', async () => {
            await this.render404();
        });

        // Add before navigation hook
        Router.beforeEach(async (to, from) => {
            await ExtensionManager.executeHook('beforeNavigate', { to, from });
        });

        // Add after navigation hook
        Router.afterEach(async (to, from) => {
            await ExtensionManager.executeHook('afterNavigate', { to, from });
            this.updateActiveNavLink();
        });

        // Initialize router
        Router.init();
    },

    /**
     * Initialize extensions
     */
    async initExtensions() {
        const extensions = this.config.extensions || {};

        for (const [name, config] of Object.entries(extensions)) {
            if (config.enabled !== false && config.url) {
                try {
                    await ExtensionManager.loadExtension(name, config.url);
                } catch (error) {
                    console.warn(`Failed to load extension "${name}":`, error);
                }
            }
        }

        await ExtensionManager.initAll();
    },

    /**
     * Render home page
     */
    async renderHome() {
        const homeConfig = this.config.home || {};
        const sections = homeConfig.sections || [];

        let content = '';
        for (const sectionRef of sections) {
            content += await this.renderSection(sectionRef);
        }

        await this.renderLayout(content, {
            title: homeConfig.title || this.config.site.title,
            description: homeConfig.description || this.config.site.description
        });

        this.currentPage = 'home';
    },

    /**
     * Render a page
     */
    async renderPage(path, pageConfig, params) {
        let content = '';

        // Load page content if it's a markdown file
        if (pageConfig.content) {
            const { frontMatter, content: markdown } = await Loader.loadMarkdown(pageConfig.content);
            content = MarkdownUtil.parse(markdown);
        }

        // Render sections
        if (pageConfig.sections) {
            for (const sectionRef of pageConfig.sections) {
                content += await this.renderSection(sectionRef);
            }
        }

        await this.renderLayout(content, {
            title: pageConfig.title || this.config.site.title,
            description: pageConfig.description || this.config.site.description,
            ...pageConfig
        });

        this.currentPage = path;
    },

    /**
     * Render a blog post
     */
    async renderBlogPost(params) {
        try {
            const slug = params.slug;
            const { frontMatter, content: markdown } = await Loader.loadMarkdown(`content/posts/${slug}.md`);
            const htmlContent = MarkdownUtil.parse(markdown);

            // Load post template if not already loaded
            if (!this.components['post']) {
                await Renderer.loadTemplate('post', 'templates/pages/post.html');
            }

            const postHtml = Renderer.render('post', {
                title: frontMatter.title,
                date: frontMatter.date,
                tags: frontMatter.tags,
                content: htmlContent
            });

            await this.renderLayout(postHtml, {
                title: frontMatter.title + ' - ' + this.config.site.title,
                description: frontMatter.description || this.config.site.description
            });

            this.currentPage = 'blog-post';
        } catch (error) {
            console.error('Failed to load blog post:', error);
            await this.render404();
        }
    },

    /**
     * Render a project detail page
     */
    async renderProject(params) {
        try {
            const slug = params.slug;
            const { frontMatter, content: markdown } = await Loader.loadMarkdown(`content/projects/${slug}.md`);
            const htmlContent = MarkdownUtil.parse(markdown);

            const projectHtml = Renderer.render('project', {
                title: frontMatter.title,
                subtitle: frontMatter.subtitle,
                date: frontMatter.date,
                status: frontMatter.status,
                image: frontMatter.image,
                tags: frontMatter.tags,
                link: frontMatter.link,
                github: frontMatter.github,
                features: frontMatter.features,
                challenges: frontMatter.challenges,
                related: frontMatter.related,
                content: htmlContent
            });

            await this.renderLayout(projectHtml, {
                title: frontMatter.title + ' - ' + this.config.site.title,
                description: frontMatter.description || frontMatter.subtitle || this.config.site.description
            });

            this.currentPage = 'project';
        } catch (error) {
            console.error('Failed to load project:', error);
            await this.render404();
        }
    },

    /**
     * Render a section
     */
    async renderSection(sectionRef) {
        let sectionConfig;

        try {
            // Load from file or use inline config
            if (typeof sectionRef === 'string') {
                const { frontMatter, content } = await Loader.loadMarkdown(`content/sections/${sectionRef}.md`);
                sectionConfig = { ...frontMatter };

                // Check if content is YAML (starts with a key:) or markdown
                if (content && content.trim()) {
                    const trimmedContent = content.trim();
                    // If content looks like YAML (has key: at the start), parse as YAML
                    if (/^[a-zA-Z_][a-zA-Z0-9_]*:/.test(trimmedContent)) {
                        const yamlData = Parser.parseYAML(trimmedContent);
                        // Merge YAML data into section config
                        Object.assign(sectionConfig, yamlData);
                    } else {
                        // Treat as markdown
                        sectionConfig.content = MarkdownUtil.parse(content);
                    }
                }
            } else {
                sectionConfig = sectionRef;
            }

            // Use custom section type handler if available
            const type = sectionConfig.type || 'section';
            if (this.sectionTypes[type]) {
                return this.sectionTypes[type](sectionConfig);
            }

            // Use appropriate template based on type
            let templateName = 'section';
            if (type === 'timeline') {
                templateName = 'timeline';
            } else if (type === 'hero') {
                templateName = 'hero';
                const heroConfig = this.config.home && this.config.home.hero ? this.config.home.hero : {};
                // Inject title/subtitle from config if not present in markdown
                if (heroConfig) {
                    if (!sectionConfig.title) sectionConfig.title = heroConfig.title;
                    if (!sectionConfig.subtitle) sectionConfig.subtitle = heroConfig.subtitle;
                }
                // Inject social links: check enableSocial from section front matter or home.hero, use home.hero.social or top-level social
                const enableSocial = sectionConfig.enableSocial !== undefined ? sectionConfig.enableSocial : heroConfig.enableSocial;
                const socialSource = (heroConfig.social && heroConfig.social.length) ? heroConfig.social : (this.config.social || []);
                if (enableSocial && socialSource.length) {
                    sectionConfig.social = socialSource;
                }
            } else if (type === 'skills') {
                templateName = 'skills';
            }

            return Renderer.render(templateName, sectionConfig);
        } catch (error) {
            console.error(`Failed to render section "${sectionRef}":`, error);
            return `<div class="error">Failed to load section: ${sectionRef}</div>`;
        }
    },

    /**
     * Render the main layout
     */
    async renderLayout(content, pageConfig = {}) {
        const context = {
            lang: this.config.site.lang || 'en',
            theme: this.theme,
            title: pageConfig.title || this.config.site.title,
            description: pageConfig.description || this.config.site.description,
            site: this.config.site,
            navigation: this.getNavigation(),
            content: content,
            meta: this.getSEOMeta(pageConfig),
            stylesheets: pageConfig.stylesheets || [],
            scripts: pageConfig.scripts || [],
            social: this.config.social || []
        };

        const html = Renderer.render('layout-main', context);
        document.body.innerHTML = html;

        // Add fade-in animation to main content
        const main = document.querySelector('.app-main');
        if (main) {
            main.classList.add('fade-in');
        }

        this.initNavBurger();

        // Update document title and meta tags
        this.updatePageMeta(pageConfig);

        // Reinitialize theme since we replaced the body
        this.applyTheme(this.theme);

        // Execute afterRender hooks
        await ExtensionManager.executeHook('afterRender', { pageConfig });
    },

    /**
     * Initialize mobile nav burger: toggle menu and close on link click or escape
     */
    initNavBurger() {
        const nav = document.querySelector('.app-nav');
        const burger = document.querySelector('.nav-burger');
        const menu = document.getElementById('nav-menu');
        if (!nav || !burger || !menu) return;

        const open = () => {
            nav.classList.add('is-open');
            burger.setAttribute('aria-expanded', 'true');
            burger.setAttribute('aria-label', 'Close menu');
        };
        const close = () => {
            nav.classList.remove('is-open');
            burger.setAttribute('aria-expanded', 'false');
            burger.setAttribute('aria-label', 'Open menu');
        };
        const toggle = () => (nav.classList.contains('is-open') ? close() : open());

        burger.addEventListener('click', toggle);
        menu.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', close);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
        });
    },

    /**
     * Get SEO meta tags
     */
    getSEOMeta(pageConfig) {
        const seo = this.config.seo || {};
        const meta = pageConfig.meta || [];

        // Add Open Graph meta tags
        const defaultMeta = [
            { name: 'og:title', content: pageConfig.title || this.config.site.title },
            { name: 'og:description', content: pageConfig.description || this.config.site.description },
            { name: 'og:type', content: 'website' }
        ];

        if (seo.ogImage) {
            defaultMeta.push({ name: 'og:image', content: seo.ogImage });
        }

        // Add Twitter Card meta tags
        if (seo.twitterCard) {
            defaultMeta.push(
                { name: 'twitter:card', content: seo.twitterCard }
            );
        }

        if (seo.twitterSite) {
            defaultMeta.push(
                { name: 'twitter:site', content: seo.twitterSite }
            );
        }

        return [...defaultMeta, ...meta];
    },

    /**
     * Update page meta tags in head
     */
    updatePageMeta(pageConfig) {
        // Update title
        document.title = pageConfig.title || this.config.site.title;

        // Update or create meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = pageConfig.description || this.config.site.description;

        // Update canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = window.location.href;
    },

    /**
     * Get navigation items with active state
     */
    getNavigation() {
        const nav = [
            { label: 'Home', url: '/' }
        ];

        const pages = this.config.pages || {};
        for (const [path, pageConfig] of Object.entries(pages)) {
            if (pageConfig.showInNav !== false) {
                nav.push({
                    label: pageConfig.label || path,
                    url: path,
                    active: Router.isActive(path)
                });
            }
        }

        return nav;
    },

    /**
     * Update active navigation link
     */
    updateActiveNavLink() {
        const currentPath = Router.getCurrentPath();

        DOM.$$('.nav-link').forEach(link => {
            const href = link.getAttribute('href')?.replace('#', '') || '';
            if (href === currentPath || (currentPath.startsWith(href) && href !== '/')) {
                DOM.addClass(link, 'active');
            } else {
                DOM.removeClass(link, 'active');
            }
        });
    },

    /**
     * Render 404 page
     */
    async render404() {
        const content = `
            <div class="section text-center">
                <h1>404</h1>
                <p>Page not found</p>
                <a href="#/" class="btn btn-primary">Go Home</a>
            </div>
        `;

        await this.renderLayout(content, {
            title: '404 - Page Not Found'
        });
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
