/**
 * DOM Helper Functions
 * Utility functions for common DOM operations and virtual node creation
 * @module utils/dom-helpers
 */

/**
 * Create virtual node helper function (JSX-like)
 * @param {string} tag - HTML tag name
 * @param {Object|null} props - Element properties/attributes
 * @param {...*} children - Child elements
 * @returns {Object} Virtual node object
 */
export function h(tag, props = null, ...children) {
    const attrs = props || {};
    const flatChildren = children.flat(Infinity).filter(child => 
        child != null && child !== false && child !== true
    );
    
    return {
        type: 'element',
        tag: String(tag).toLowerCase(),
        attrs,
        children: flatChildren,
        key: attrs.key || null,
        ref: attrs.ref || null,
        _isVNode: true
    };
}

/**
 * Create a text virtual node
 * @param {string|number} text - Text content
 * @returns {Object} Text virtual node
 */
export function text(text) {
    return {
        type: 'text',
        text: String(text),
        _isVNode: true
    };
}

/**
 * Create a comment virtual node
 * @param {string} comment - Comment text
 * @returns {Object} Comment virtual node
 */
export function comment(comment) {
    return {
        type: 'comment',
        comment: String(comment),
        _isVNode: true
    };
}

/**
 * Create a fragment virtual node
 * @param {...*} children - Child elements
 * @returns {Object} Fragment virtual node
 */
export function fragment(...children) {
    return {
        type: 'fragment',
        children: children.flat(Infinity).filter(child => 
            child != null && child !== false && child !== true
        ),
        _isVNode: true
    };
}

/**
 * Conditional rendering helper
 * @param {boolean} condition - Condition to check
 * @param {*} trueValue - Value to return if true
 * @param {*} falseValue - Value to return if false (optional)
 * @returns {*} Conditional result
 */
export function when(condition, trueValue, falseValue = null) {
    return condition ? trueValue : falseValue;
}

/**
 * Map array to virtual nodes
 * @param {Array} items - Items to map
 * @param {Function} mapFn - Mapping function
 * @param {string} keyProp - Property to use as key (optional)
 * @returns {Array} Array of virtual nodes
 */
export function map(items, mapFn, keyProp = null) {
    if (!Array.isArray(items)) {
        return [];
    }
    
    return items.map((item, index) => {
        const vnode = mapFn(item, index);
        
        // Auto-assign key if specified
        if (keyProp && item && typeof item === 'object' && item[keyProp]) {
            if (vnode && typeof vnode === 'object' && vnode._isVNode) {
                vnode.key = item[keyProp];
                vnode.attrs = vnode.attrs || {};
                vnode.attrs.key = item[keyProp];
            }
        }
        
        return vnode;
    });
}

/**
 * Create a class name string from various formats
 * @param {...*} classes - Class values (strings, arrays, objects)
 * @returns {string} Class name string
 */
export function cls(...classes) {
    const result = [];
    
    classes.forEach(cls => {
        if (!cls) return;
        
        if (typeof cls === 'string') {
            result.push(cls);
        } else if (Array.isArray(cls)) {
            result.push(...cls.filter(Boolean));
        } else if (typeof cls === 'object') {
            Object.entries(cls).forEach(([className, condition]) => {
                if (condition) {
                    result.push(className);
                }
            });
        }
    });
    
    return result.join(' ');
}

/**
 * Create inline styles from object
 * @param {Object} styles - Styles object
 * @returns {string} CSS string
 */
export function style(styles) {
    if (typeof styles === 'string') {
        return styles;
    }
    
    if (!styles || typeof styles !== 'object') {
        return '';
    }
    
    return Object.entries(styles)
        .filter(([, value]) => value != null)
        .map(([property, value]) => {
            const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
            return `${cssProperty}: ${value}`;
        })
        .join('; ');
}

/**
 * Common HTML elements as helper functions
 */
export const div = (props, ...children) => h('div', props, ...children);
export const span = (props, ...children) => h('span', props, ...children);
export const p = (props, ...children) => h('p', props, ...children);
export const h1 = (props, ...children) => h('h1', props, ...children);
export const h2 = (props, ...children) => h('h2', props, ...children);
export const h3 = (props, ...children) => h('h3', props, ...children);
export const h4 = (props, ...children) => h('h4', props, ...children);
export const h5 = (props, ...children) => h('h5', props, ...children);
export const h6 = (props, ...children) => h('h6', props, ...children);
export const a = (props, ...children) => h('a', props, ...children);
export const img = (props) => h('img', props);
export const button = (props, ...children) => h('button', props, ...children);
export const input = (props) => h('input', props);
export const textarea = (props, ...children) => h('textarea', props, ...children);
export const select = (props, ...children) => h('select', props, ...children);
export const option = (props, ...children) => h('option', props, ...children);
export const ul = (props, ...children) => h('ul', props, ...children);
export const ol = (props, ...children) => h('ol', props, ...children);
export const li = (props, ...children) => h('li', props, ...children);
export const nav = (props, ...children) => h('nav', props, ...children);
export const section = (props, ...children) => h('section', props, ...children);
export const article = (props, ...children) => h('article', props, ...children);
export const header = (props, ...children) => h('header', props, ...children);
export const footer = (props, ...children) => h('footer', props, ...children);
export const main = (props, ...children) => h('main', props, ...children);
export const aside = (props, ...children) => h('aside', props, ...children);
export const table = (props, ...children) => h('table', props, ...children);
export const thead = (props, ...children) => h('thead', props, ...children);
export const tbody = (props, ...children) => h('tbody', props, ...children);
export const tr = (props, ...children) => h('tr', props, ...children);
export const th = (props, ...children) => h('th', props, ...children);
export const td = (props, ...children) => h('td', props, ...children);
export const form = (props, ...children) => h('form', props, ...children);
export const label = (props, ...children) => h('label', props, ...children);
export const br = () => h('br');
export const hr = () => h('hr');

/**
 * Validate virtual node structure
 * @param {*} vnode - Virtual node to validate
 * @returns {boolean} True if valid
 */
export function isValidVNode(vnode) {
    if (vnode == null || typeof vnode === 'string' || typeof vnode === 'number' || typeof vnode === 'boolean') {
        return true; // Primitive values are valid
    }
    
    if (Array.isArray(vnode)) {
        return vnode.every(child => isValidVNode(child));
    }
    
    if (typeof vnode !== 'object') {
        return false;
    }
    
    if (!vnode._isVNode) {
        return false;
    }
    
    if (vnode.type === 'element' && (!vnode.tag || typeof vnode.tag !== 'string')) {
        return false;
    }
    
    if (vnode.children && !Array.isArray(vnode.children)) {
        return false;
    }
    
    if (vnode.children) {
        return vnode.children.every(child => isValidVNode(child));
    }
    
    return true;
}

/**
 * Deep clone a virtual node
 * @param {*} vnode - Virtual node to clone
 * @returns {*} Cloned virtual node
 */
export function cloneVNode(vnode) {
    if (vnode == null || typeof vnode !== 'object') {
        return vnode;
    }
    
    if (Array.isArray(vnode)) {
        return vnode.map(child => cloneVNode(child));
    }
    
    if (vnode._isVNode) {
        return {
            ...vnode,
            attrs: vnode.attrs ? { ...vnode.attrs } : {},
            children: vnode.children ? vnode.children.map(child => cloneVNode(child)) : []
        };
    }
    
    return vnode;
}

/**
 * Find virtual nodes by predicate
 * @param {*} vnode - Virtual node to search
 * @param {Function} predicate - Search predicate
 * @returns {Array} Found virtual nodes
 */
export function findVNodes(vnode, predicate) {
    const results = [];
    
    function search(node) {
        if (node == null || typeof node !== 'object') {
            return;
        }
        
        if (Array.isArray(node)) {
            node.forEach(search);
            return;
        }
        
        if (node._isVNode) {
            if (predicate(node)) {
                results.push(node);
            }
            
            if (node.children) {
                node.children.forEach(search);
            }
        }
    }
    
    search(vnode);
    return results;
}

/**
 * Create enhanced event handler with options
 * @param {Function} handler - Event handler function
 * @param {Object} options - Event options
 * @returns {Object} Event configuration object
 */
export function eventHandler(handler, options = {}) {
    return {
        handler,
        ...options
    };
}

/**
 * Create a debounced event handler
 * @param {Function} handler - Event handler function
 * @param {number} delay - Debounce delay in ms
 * @param {Object} options - Additional options
 * @returns {Object} Event configuration object
 */
export function debounceEvent(handler, delay, options = {}) {
    return eventHandler(handler, { ...options, debounce: delay });
}

/**
 * Create a throttled event handler
 * @param {Function} handler - Event handler function
 * @param {number} limit - Throttle limit in ms
 * @param {Object} options - Additional options
 * @returns {Object} Event configuration object
 */
export function throttleEvent(handler, limit, options = {}) {
    return eventHandler(handler, { ...options, throttle: limit });
}

/**
 * Create a one-time event handler
 * @param {Function} handler - Event handler function
 * @param {Object} options - Additional options
 * @returns {Object} Event configuration object
 */
export function onceEvent(handler, options = {}) {
    return eventHandler(handler, { ...options, once: true });
}

/**
 * Create a conditional event handler
 * @param {Function} handler - Event handler function
 * @param {Function} condition - Condition function
 * @param {Object} options - Additional options
 * @returns {Object} Event configuration object
 */
export function whenEvent(handler, condition, options = {}) {
    return eventHandler(handler, { ...options, condition });
}

/**
 * Create an event handler with data binding
 * @param {Function} handler - Event handler function
 * @param {Object} data - Data to bind to event
 * @param {Object} options - Additional options
 * @returns {Object} Event configuration object
 */
export function dataEvent(handler, data, options = {}) {
    return eventHandler(handler, { ...options, data });
}

/**
 * Create an event handler with preventDefault
 * @param {Function} handler - Event handler function
 * @param {Object} options - Additional options
 * @returns {Object} Event configuration object
 */
export function preventEvent(handler, options = {}) {
    return eventHandler(handler, { ...options, preventDefault: true });
}

/**
 * Create an event handler with stopPropagation
 * @param {Function} handler - Event handler function
 * @param {Object} options - Additional options
 * @returns {Object} Event configuration object
 */
export function stopEvent(handler, options = {}) {
    return eventHandler(handler, { ...options, stopPropagation: true });
}

/**
 * Convert virtual node to HTML string (server-side rendering helper)
 * @param {*} vnode - Virtual node to convert
 * @returns {string} HTML string
 */
export function vnodeToHTML(vnode) {
    if (vnode == null) {
        return '';
    }
    
    if (typeof vnode === 'string' || typeof vnode === 'number' || typeof vnode === 'boolean') {
        return String(vnode).replace(/[&<>"']/g, match => {
            const escape = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return escape[match];
        });
    }
    
    if (Array.isArray(vnode)) {
        return vnode.map(vnodeToHTML).join('');
    }
    
    if (!vnode._isVNode) {
        return '';
    }
    
    if (vnode.type === 'text') {
        return vnodeToHTML(vnode.text);
    }
    
    if (vnode.type === 'comment') {
        return `<!-- ${vnode.comment} -->`;
    }
    
    if (vnode.type === 'fragment') {
        return vnode.children ? vnode.children.map(vnodeToHTML).join('') : '';
    }
    
    if (vnode.type === 'element') {
        const { tag, attrs, children } = vnode;
        const attrString = attrs ? Object.entries(attrs)
            .filter(([key, value]) => key !== 'key' && key !== 'ref' && value != null && !key.startsWith('on'))
            .map(([key, value]) => {
                if (key === 'className') key = 'class';
                if (typeof value === 'boolean') {
                    return value ? key : '';
                }
                return `${key}="${String(value).replace(/"/g, '&quot;')}"`;
            })
            .filter(Boolean)
            .join(' ') : '';
        
        const openTag = `<${tag}${attrString ? ' ' + attrString : ''}>`;
        
        // Self-closing tags
        const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        if (selfClosing.includes(tag)) {
            return openTag.slice(0, -1) + ' />';
        }
        
        const childrenHTML = children ? children.map(vnodeToHTML).join('') : '';
        return `${openTag}${childrenHTML}</${tag}>`;
    }
    
    return '';
}