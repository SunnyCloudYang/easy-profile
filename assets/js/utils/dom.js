/**
 * DOM utility functions
 */

const DOM = {
    /**
     * Query selector
     */
    $(selector, context = document) {
        return context.querySelector(selector);
    },

    /**
     * Query selector all
     */
    $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    },

    /**
     * Create element with attributes and children
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);

        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else if (key === 'dataset') {
                Object.assign(element.dataset, value);
            } else {
                element.setAttribute(key, value);
            }
        }

        for (const child of children) {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        }

        return element;
    },

    /**
     * Set HTML content
     */
    setHTML(selector, html) {
        const element = this.$(selector);
        if (element) {
            element.innerHTML = html;
        }
        return element;
    },

    /**
     * Set text content
     */
    setText(selector, text) {
        const element = this.$(selector);
        if (element) {
            element.textContent = text;
        }
        return element;
    },

    /**
     * Add class
     */
    addClass(selector, className) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (element) {
            element.classList.add(...className.split(' '));
        }
        return element;
    },

    /**
     * Remove class
     */
    removeClass(selector, className) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (element) {
            element.classList.remove(...className.split(' '));
        }
        return element;
    },

    /**
     * Toggle class
     */
    toggleClass(selector, className) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (element) {
            element.classList.toggle(className);
        }
        return element;
    },

    /**
     * Check if has class
     */
    hasClass(selector, className) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        return element?.classList.contains(className) || false;
    },

    /**
     * Show element
     */
    show(selector) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (element) {
            element.style.display = '';
        }
        return element;
    },

    /**
     * Hide element
     */
    hide(selector) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (element) {
            element.style.display = 'none';
        }
        return element;
    },

    /**
     * Remove element
     */
    remove(selector) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (element) {
            element.remove();
        }
    },

    /**
     * Append child
     */
    append(parent, child) {
        const parentElement = typeof parent === 'string' ? this.$(parent) : parent;
        if (parentElement) {
            if (typeof child === 'string') {
                parentElement.insertAdjacentHTML('beforeend', child);
            } else {
                parentElement.appendChild(child);
            }
        }
        return parentElement;
    },

    /**
     * Prepend child
     */
    prepend(parent, child) {
        const parentElement = typeof parent === 'string' ? this.$(parent) : parent;
        if (parentElement) {
            if (typeof child === 'string') {
                parentElement.insertAdjacentHTML('afterbegin', child);
            } else {
                parentElement.insertBefore(child, parentElement.firstChild);
            }
        }
        return parentElement;
    },

    /**
     * Get/set data attribute
     */
    data(selector, key, value) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (!element) return undefined;

        if (value === undefined) {
            return element.dataset[key];
        }

        element.dataset[key] = value;
        return element;
    },

    /**
     * Get/set attribute
     */
    attr(selector, key, value) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (!element) return undefined;

        if (value === undefined) {
            return element.getAttribute(key);
        }

        element.setAttribute(key, value);
        return element;
    },

    /**
     * Get element offset
     */
    offset(selector) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
        };
    },

    /**
     * Scroll to element
     */
    scrollTo(selector, options = {}) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', ...options });
        }
    },

    /**
     * Event delegation
     */
    delegate(parent, eventType, selector, handler) {
        const parentElement = typeof parent === 'string' ? this.$(parent) : parent;
        if (!parentElement) return;

        parentElement.addEventListener(eventType, (event) => {
            const target = event.target.closest(selector);
            if (target && parentElement.contains(target)) {
                handler.call(target, event, target);
            }
        });
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOM;
}
