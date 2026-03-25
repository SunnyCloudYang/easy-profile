/**
 * Sample Analytics Extension
 * Demonstrates the extension system
 */

return {
    name: 'Analytics',

    /**
     * Initialize the extension
     */
    async init() {
        console.log('Analytics extension initialized');

        // Register hooks
        ExtensionManager.on('afterNavigate', this.trackPageView.bind(this));
        ExtensionManager.on('onThemeChange', this.trackThemeChange.bind(this));
    },

    /**
     * Track page view
     */
    trackPageView({ to, from }) {
        console.log(`Page view: ${from || 'initial'} -> ${to}`);

        // Here you would integrate with your analytics service
        // Example: Google Analytics, Plausible, etc.
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                'page_path': to
            });
        }
    },

    /**
     * Track theme change
     */
    trackThemeChange({ theme }) {
        console.log(`Theme changed to: ${theme}`);

        // Track user preference
        if (typeof gtag !== 'undefined') {
            gtag('event', 'theme_change', {
                'theme': theme
            });
        }
    },

    /**
     * Track custom event
     */
    trackEvent(category, action, label, value) {
        console.log(`Event: ${category} - ${action} - ${label}`);

        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label,
                'value': value
            });
        }
    },

    /**
     * Cleanup when extension is destroyed
     */
    async destroy() {
        console.log('Analytics extension destroyed');
    }
};
