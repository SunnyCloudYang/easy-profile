/**
 * Markdown utility functions
 */

const MarkdownUtil = {
    /**
     * Convert markdown to HTML
     */
    toHTML(markdown) {
        return Parser.parseMarkdown(markdown);
    },

    /**
     * Extract headings from markdown
     */
    extractHeadings(markdown) {
        const headings = [];
        const lines = markdown.split('\n');

        for (const line of lines) {
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                headings.push({
                    level: match[1].length,
                    text: match[2],
                    id: this.slugify(match[2])
                });
            }
        }

        return headings;
    },

    /**
     * Create slug from text
     */
    slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Extract first paragraph
     */
    extractExcerpt(markdown, maxLength = 160) {
        const paragraphs = markdown.split(/\n\n+/);
        let excerpt = '';

        for (const p of paragraphs) {
            // Skip headings, code blocks, etc.
            if (p.match(/^(#|```|>|[-*+]|\d+\.)/)) {
                continue;
            }

            // Strip markdown formatting
            const text = this.stripFormatting(p);
            if (text.length > 0) {
                excerpt = text;
                break;
            }
        }

        if (excerpt.length > maxLength) {
            excerpt = excerpt.substring(0, maxLength).trim();
            excerpt = excerpt.substring(0, excerpt.lastIndexOf(' ')) + '...';
        }

        return excerpt;
    },

    /**
     * Strip markdown formatting
     */
    stripFormatting(markdown) {
        let text = markdown;

        // Remove code blocks
        text = text.replace(/```[\s\S]*?```/g, '');

        // Remove inline code
        text = text.replace(/`([^`]+)`/g, '$1');

        // Remove links but keep text
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

        // Remove images
        text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

        // Remove emphasis
        text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

        // Remove headings
        text = text.replace(/^#+\s+/gm, '');

        // Remove list markers
        text = text.replace(/^[-*+]\s+/gm, '');
        text = text.replace(/^\d+\.\s+/gm, '');

        // Remove blockquotes
        text = text.replace(/^>\s+/gm, '');

        // Remove horizontal rules
        text = text.replace(/^[-*_]{3,}$/gm, '');

        return text.trim();
    },

    /**
     * Calculate reading time
     */
    calculateReadingTime(markdown, wordsPerMinute = 200) {
        const text = this.stripFormatting(markdown);
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return minutes;
    },

    /**
     * Add IDs to headings
     */
    addHeadingIDs(html) {
        return html.replace(/<h([1-6])>(.+?)<\/h\1>/g, (match, level, text) => {
            const id = this.slugify(text);
            return `<h${level} id="${id}">${text}</h${level}>`;
        });
    },

    /**
     * Generate table of contents
     */
    generateTOC(markdown) {
        const headings = this.extractHeadings(markdown);
        if (headings.length === 0) return '';

        const items = headings.map(h => {
            const indent = '  '.repeat(h.level - 1);
            return `${indent}- [${h.text}](#${h.id})`;
        }).join('\n');

        return this.toHTML(items);
    },

    /**
     * Parse markdown with custom options
     */
    parse(markdown, options = {}) {
        let html = this.toHTML(markdown);

        if (options.headingIDs !== false) {
            html = this.addHeadingIDs(html);
        }

        return html;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownUtil;
}
