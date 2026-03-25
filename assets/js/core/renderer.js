/**
 * Template renderer with {{variable}} syntax
 */

const Renderer = {
    templates: new Map(),
    compiledTemplates: new Map(),

    /**
     * Load a template file
     */
    async loadTemplate(name, url) {
        const content = await Loader.load(url);
        this.templates.set(name, content);
        return content;
    },

    /**
     * Compile template string to function
     */
    compile(template) {
        return (context) => {
            return this.renderTemplate(template, context);
        };
    },

    /**
     * Render template with context, handling nested structures recursively
     */
    renderTemplate(template, context) {
        let result = template;
        let cursor = 0;
        let output = '';

        while (cursor < template.length) {
            // Find next tag
            const eachStart = template.indexOf('{{#each ', cursor);
            const ifStart = template.indexOf('{{#if ', cursor);
            const nextTag = this.findNextTag(template, cursor, ['{{#each ', '{{#if ']);

            if (nextTag === -1) {
                // No more tags, append rest and finish
                output += template.substring(cursor);
                break;
            }

            // Append content before tag
            output += template.substring(cursor, nextTag);

            if (template.substring(nextTag, nextTag + 7) === '{{#each') {
                // Process each block
                const { result: eachResult, endPos } = this.processEachBlock(template, nextTag, context);
                output += eachResult;
                cursor = endPos;
            } else if (template.substring(nextTag, nextTag + 6) === '{{#if ') {
                // Process if block
                const { result: ifResult, endPos } = this.processIfBlock(template, nextTag, context);
                output += ifResult;
                cursor = endPos;
            } else {
                cursor = nextTag + 2;
            }
        }

        // Replace variables in final output
        output = this.replaceVariables(output, context);

        return output;
    },

    /**
     * Find next tag position
     */
    findNextTag(template, start, tags) {
        let minPos = -1;
        for (const tag of tags) {
            const pos = template.indexOf(tag, start);
            if (pos !== -1 && (minPos === -1 || pos < minPos)) {
                minPos = pos;
            }
        }
        return minPos;
    },

    /**
     * Process {{#each}} block
     */
    processEachBlock(template, start, context) {
        // Extract array name
        const match = template.substring(start).match(/\{\{#each\s+(\w+(?:\.\w+)*)\}\}/);
        if (!match) {
            return { result: '', endPos: start + 2 };
        }

        const arrayPath = match[1];
        const tagEnd = start + match[0].length;

        // Find matching {{/each}}
        let depth = 1;
        let pos = tagEnd;
        while (pos < template.length && depth > 0) {
            const nextEach = template.indexOf('{{#each', pos);
            const nextEndEach = template.indexOf('{{/each}}', pos);

            if (nextEndEach === -1) {
                // No closing tag found
                return { result: '', endPos: template.length };
            }

            if (nextEach !== -1 && nextEach < nextEndEach) {
                depth++;
                pos = nextEach + 7;
            } else {
                depth--;
                if (depth === 0) {
                    // Found matching close tag
                    const innerTemplate = template.substring(tagEnd, nextEndEach);
                    const array = this.getNestedValue(context, arrayPath) || [];

                    let result = '';
                    if (Array.isArray(array)) {
                        result = array.map(item => {
                            // Recursively process inner template with item context
                            return this.renderTemplate(innerTemplate, item);
                        }).join('');
                    }

                    return { result, endPos: nextEndEach + 9 }; // +9 for {{/each}}
                }
                pos = nextEndEach + 8;
            }
        }

        return { result: '', endPos: template.length };
    },

    /**
     * Process {{#if}} block
     */
    processIfBlock(template, start, context) {
        // Extract condition name
        const match = template.substring(start).match(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}/);
        if (!match) {
            return { result: '', endPos: start + 2 };
        }

        const conditionPath = match[1];
        const tagEnd = start + match[0].length;

        // Find matching {{/if}}
        let depth = 1;
        let pos = tagEnd;
        while (pos < template.length && depth > 0) {
            const nextIf = template.indexOf('{{#if', pos);
            const nextEndIf = template.indexOf('{{/if}}', pos);

            if (nextEndIf === -1) {
                return { result: '', endPos: template.length };
            }

            if (nextIf !== -1 && nextIf < nextEndIf) {
                depth++;
                pos = nextIf + 5;
            } else {
                depth--;
                if (depth === 0) {
                    const innerTemplate = template.substring(tagEnd, nextEndIf);
                    const condition = this.getNestedValue(context, conditionPath);
                    const result = condition ? this.renderTemplate(innerTemplate, context) : '';
                    return { result, endPos: nextEndIf + 7 }; // +7 for {{/if}}
                }
                pos = nextEndIf + 7;
            }
        }

        return { result: '', endPos: template.length };
    },

    /**
     * Process conditionals in template
     */
    processConditionals(template, context) {
        return template.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, conditionPath, innerTemplate) => {
            const condition = this.getNestedValue(context, conditionPath);
            if (condition) {
                return innerTemplate;
            }
            return '';
        });
    },

    /**
     * Replace {{variable}} placeholders
     */
    replaceVariables(template, context) {
        return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            path = path.trim();

            // Handle special case of {{.}} for current item in loop
            if (path === '.') {
                return context !== undefined && context !== null ? String(context) : '';
            }

            const value = this.getNestedValue(context, path);
            return value !== undefined && value !== null ? String(value) : '';
        });
    },

    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, path) {
        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[part];
        }

        return current;
    },

    /**
     * Render a template with context
     */
    render(templateName, context) {
        const template = this.templates.get(templateName);
        if (!template) {
            console.error(`Template not found: ${templateName}`);
            return '';
        }

        let compiled = this.compiledTemplates.get(templateName);
        if (!compiled) {
            compiled = this.compile(template);
            this.compiledTemplates.set(templateName, compiled);
        }

        return compiled(context);
    },

    /**
     * Render template string directly
     */
    renderString(templateString, context) {
        const compiled = this.compile(templateString);
        return compiled(context);
    },

    /**
     * Register a template from string
     */
    registerTemplate(name, templateString) {
        this.templates.set(name, templateString);
    },

    /**
     * Clear template cache
     */
    clearCache() {
        this.templates.clear();
        this.compiledTemplates.clear();
    },

    /**
     * Load all templates from manifest
     */
    async loadTemplates(templates) {
        const promises = [];
        for (const [name, url] of Object.entries(templates)) {
            promises.push(this.loadTemplate(name, url));
        }
        await Promise.all(promises);
    },

    /**
     * Helper to render component with partials
     */
    renderComponent(componentName, context, partials = {}) {
        // Register partials temporarily
        const previousTemplates = new Map(this.templates);

        for (const [name, template] of Object.entries(partials)) {
            this.registerTemplate(name, template);
        }

        const result = this.render(componentName, context);

        // Restore previous templates
        for (const name of Object.keys(partials)) {
            if (previousTemplates.has(name)) {
                this.templates.set(name, previousTemplates.get(name));
            } else {
                this.templates.delete(name);
            }
        }

        return result;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
