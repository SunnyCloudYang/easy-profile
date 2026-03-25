/**
 * Parser module using js-yaml and marked libraries
 */

const Parser = {
    /**
     * Parse YAML string to JavaScript object
     * Uses js-yaml library if available, falls back to basic parsing
     */
    parseYAML(yamlString) {
        if (typeof jsyaml !== 'undefined') {
            try {
                return jsyaml.load(yamlString);
            } catch (error) {
                console.error('YAML parsing error:', error);
                return {};
            }
        }
        // Fallback to basic parsing if js-yaml not loaded
        console.warn('js-yaml not loaded, using basic YAML parser');
        return this.parseYAMLBasic(yamlString);
    },

    /**
     * Basic YAML parser fallback
     * Handles simple key-value pairs and nested objects
     */
    parseYAMLBasic(yamlString) {
        const result = {};
        const lines = yamlString.split('\n');
        let currentObj = result;
        const stack = [result];
        const indentStack = [-1];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trimEnd();

            // Skip empty lines and comments
            if (!trimmed || trimmed.trim().startsWith('#')) continue;

            const indent = line.search(/\S|$/);
            const content = trimmed.trim();

            // Pop stack when indent decreases
            while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
                indentStack.pop();
                stack.pop();
            }

            currentObj = stack[stack.length - 1];

            // Parse key-value pair
            if (content.includes(':')) {
                const colonIndex = content.indexOf(':');
                const key = content.substring(0, colonIndex).trim();
                const value = content.substring(colonIndex + 1).trim();

                if (value === '') {
                    // New nested object
                    const newObj = {};
                    currentObj[key] = newObj;
                    stack.push(newObj);
                    indentStack.push(indent);
                } else {
                    // Simple value
                    currentObj[key] = this.parseYAMLValue(value);
                }
            }
        }

        return result;
    },

    /**
     * Parse YAML value to appropriate JavaScript type
     */
    parseYAMLValue(value) {
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }

        // Boolean
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // Null
        if (value.toLowerCase() === 'null' || value === '~') return null;

        // Number
        const num = Number(value);
        if (!isNaN(num)) return num;

        // String
        return value;
    },

    /**
     * Parse Markdown to HTML
     * Uses marked library if available, falls back to basic parsing
     */
    parseMarkdown(markdown) {
        if (typeof marked !== 'undefined') {
            try {
                // Configure marked options
                marked.setOptions({
                    breaks: true,
                    gfm: true
                });
                return marked.parse(markdown);
            } catch (error) {
                console.error('Markdown parsing error:', error);
                return markdown;
            }
        }
        // Fallback to basic parsing if marked not loaded
        console.warn('marked not loaded, using basic Markdown parser');
        return this.parseMarkdownBasic(markdown);
    },

    /**
     * Basic Markdown parser fallback
     */
    parseMarkdownBasic(markdown) {
        let html = markdown;

        // Escape HTML
        html = html.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');

        // Code blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
        });

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Headers
        html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Bold and Italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');

        // Paragraphs
        html = this.parseParagraphs(html);

        return html;
    },

    /**
     * Parse paragraphs
     */
    parseParagraphs(html) {
        const blocks = html.split(/\n\n+/);
        return blocks.map(block => {
            block = block.trim();
            if (!block) return '';

            // Don't wrap if already wrapped in block element
            if (block.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr|div|p)/)) {
                return block;
            }

            // Wrap in paragraph
            return `<p>${block.replace(/\n/g, '<br>')}</p>`;
        }).join('\n\n');
    },

    /**
     * Parse front matter from markdown (YAML between --- markers)
     */
    parseFrontMatter(content) {
        if (!content.startsWith('---')) {
            return { frontMatter: {}, content };
        }

        const endIndex = content.indexOf('---', 3);
        if (endIndex === -1) {
            return { frontMatter: {}, content };
        }

        const yaml = content.substring(3, endIndex).trim();
        const markdown = content.substring(endIndex + 3).trim();

        return {
            frontMatter: this.parseYAML(yaml),
            content: markdown
        };
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Parser;
}