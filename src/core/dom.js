/**
 * DOM Abstraction System
 * Virtual DOM-like object structure with efficient DOM manipulation
 * @module core/dom
 */

import { escapeHtml, isPlainObject, deepEqual } from '../utils/helpers.js';
import { ErrorBoundary, ERROR_TYPES } from '../utils/error-boundary.js';

/**
 * Virtual node types
 */
const VNODE_TYPES = {
    ELEMENT: 'element',
    TEXT: 'text',
    COMMENT: 'comment',
    FRAGMENT: 'fragment'
};

/**
 * DOM abstraction class for virtual DOM operations
 * @class DOM
 */
export class DOM {
    /**
     * Create a new DOM abstraction instance
     * @param {Object} options - DOM configuration options
     * @param {EventManager} eventManager - Optional event manager instance
     */
    constructor(options = {}, eventManager = null) {
        this.options = {
            escapeHtml: true,
            validateVNodes: true,
            optimizeUpdates: true,
            useDocumentFragment: true,
            trackKeys: true,
            passive: false,
            capture: false,
            ...options
        };

        this.errorBoundary = new ErrorBoundary(this.options.debug);
        this.elementCache = new WeakMap();
        this.vnodeCache = new Map();
        this.eventManager = eventManager;
    }

    /**
     * Create a DOM element from a virtual node
     * @param {Object|string|number} vnode - Virtual node, text content, or number
     * @returns {Element|Text|Comment} Created DOM element
     */
    createElement(vnode) {
        return this.errorBoundary.wrap(() => {
            // Handle null/undefined
            if (vnode == null) {
                return document.createComment('null');
            }

            // Handle primitive values (string, number, boolean)
            if (typeof vnode === 'string' || typeof vnode === 'number' || typeof vnode === 'boolean') {
                const textContent = String(vnode);
                return document.createTextNode(
                    this.options.escapeHtml ? escapeHtml(textContent) : textContent
                );
            }

            // Handle arrays (fragments)
            if (Array.isArray(vnode)) {
                return this._createFragment(vnode);
            }

            // Validate virtual node object
            if (this.options.validateVNodes) {
                this._validateVNode(vnode);
            }

            // Handle different vnode types
            switch (vnode.type) {
                case VNODE_TYPES.TEXT:
                    return this._createTextNode(vnode);
                case VNODE_TYPES.COMMENT:
                    return this._createComment(vnode);
                case VNODE_TYPES.FRAGMENT:
                    return this._createFragment(vnode.children);
                case VNODE_TYPES.ELEMENT:
                default:
                    return this._createElement(vnode);
            }
        }, 'createElement failed', ERROR_TYPES.RENDER);
    }

    /**
     * Create a virtual node object
     * @param {string} tag - HTML tag name
     * @param {Object} attrs - Element attributes
     * @param {Array|string} children - Child elements or text content
     * @returns {Object} Virtual node object
     */
    createVNode(tag, attrs = {}, children = []) {
        // Handle text-only children
        if (typeof children === 'string' || typeof children === 'number') {
            children = [children];
        }

        // Ensure children is an array
        if (!Array.isArray(children)) {
            children = children ? [children] : [];
        }

        // Flatten children array
        const flatChildren = this._flattenChildren(children);

        return {
            type: VNODE_TYPES.ELEMENT,
            tag: String(tag).toLowerCase(),
            attrs: { ...attrs },
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
    createTextVNode(text) {
        return {
            type: VNODE_TYPES.TEXT,
            text: String(text),
            _isVNode: true
        };
    }

    /**
     * Create a comment virtual node
     * @param {string} comment - Comment text
     * @returns {Object} Comment virtual node
     */
    createCommentVNode(comment) {
        return {
            type: VNODE_TYPES.COMMENT,
            comment: String(comment),
            _isVNode: true
        };
    }

    /**
     * Create a fragment virtual node
     * @param {Array} children - Child elements
     * @returns {Object} Fragment virtual node
     */
    createFragmentVNode(children) {
        return {
            type: VNODE_TYPES.FRAGMENT,
            children: this._flattenChildren(children),
            _isVNode: true
        };
    }

    /**
     * Render virtual nodes to a container
     * @param {Object|Array} vnode - Virtual node or array to render
     * @param {Element} container - Container element
     * @returns {Element|DocumentFragment} Rendered element
     */
    render(vnode, container) {
        return this.errorBoundary.wrap(() => {
            if (!container || !container.appendChild) {
                throw new Error('Invalid container element');
            }

            const element = this.createElement(vnode);
            
            if (element instanceof DocumentFragment) {
                container.appendChild(element);
                return container;
            } else {
                container.appendChild(element);
                return element;
            }
        }, 'render failed', ERROR_TYPES.RENDER);
    }

    /**
     * Update an existing element with new virtual node
     * @param {Element} element - DOM element to update
     * @param {Object} oldVNode - Old virtual node
     * @param {Object} newVNode - New virtual node
     * @returns {Element} Updated element
     */
    updateElement(element, oldVNode, newVNode) {
        return this.errorBoundary.wrap(() => {
            if (!element) {
                return this.createElement(newVNode);
            }

            // If vnodes are the same reference, no update needed
            if (oldVNode === newVNode) {
                return element;
            }

            // If new vnode is null/undefined, remove element
            if (newVNode == null) {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                return null;
            }

            // If old vnode is null/undefined, create new element
            if (oldVNode == null) {
                const newElement = this.createElement(newVNode);
                if (element.parentNode) {
                    element.parentNode.replaceChild(newElement, element);
                }
                return newElement;
            }

            // Handle different types of updates
            return this._updateElement(element, oldVNode, newVNode);
        }, 'updateElement failed', ERROR_TYPES.RENDER);
    }

    /**
     * Patch a container with new virtual nodes using diffing
     * @param {Element} container - Container element
     * @param {Object|Array} oldVNode - Old virtual node
     * @param {Object|Array} newVNode - New virtual node
     * @returns {Element} Updated container
     */
    patch(container, oldVNode, newVNode) {
        return this.errorBoundary.wrap(() => {
            if (container.children.length === 0 && oldVNode == null) {
                // Initial render
                return this.render(newVNode, container);
            }

            // Update existing content
            const firstChild = container.firstChild;
            const updatedElement = this.updateElement(firstChild, oldVNode, newVNode);
            
            return container;
        }, 'patch failed', ERROR_TYPES.RENDER);
    }

    // Private methods

    /**
     * Create an HTML element from a virtual node
     * @private
     * @param {Object} vnode - Virtual node
     * @returns {Element} Created element
     */
    _createElement(vnode) {
        const { tag, attrs, children } = vnode;

        // Create the element
        const element = document.createElement(tag);

        // Set attributes
        this._setAttributes(element, attrs);

        // Add children
        if (children && children.length > 0) {
            this._appendChildren(element, children);
        }

        // Store vnode reference for future updates
        if (this.options.trackKeys && vnode.key) {
            this.elementCache.set(element, vnode);
        }

        return element;
    }

    /**
     * Create a text node
     * @private
     * @param {Object} vnode - Text virtual node
     * @returns {Text} Text node
     */
    _createTextNode(vnode) {
        const textContent = this.options.escapeHtml ? escapeHtml(vnode.text) : vnode.text;
        return document.createTextNode(textContent);
    }

    /**
     * Create a comment node
     * @private
     * @param {Object} vnode - Comment virtual node
     * @returns {Comment} Comment node
     */
    _createComment(vnode) {
        return document.createComment(vnode.comment);
    }

    /**
     * Create a document fragment from children
     * @private
     * @param {Array} children - Child vnodes
     * @returns {DocumentFragment|Element} Fragment or container element
     */
    _createFragment(children) {
        if (this.options.useDocumentFragment) {
            const fragment = document.createDocumentFragment();
            this._appendChildren(fragment, children);
            return fragment;
        } else {
            // Use a div container if fragments are not supported
            const container = document.createElement('div');
            container.style.display = 'contents'; // CSS to make container invisible
            this._appendChildren(container, children);
            return container;
        }
    }

    /**
     * Set attributes on an element
     * @private
     * @param {Element} element - DOM element
     * @param {Object} attrs - Attributes object
     */
    _setAttributes(element, attrs) {
        Object.entries(attrs).forEach(([key, value]) => {
            this._setAttribute(element, key, value);
        });
    }

    /**
     * Set a single attribute on an element
     * @private
     * @param {Element} element - DOM element
     * @param {string} key - Attribute key
     * @param {*} value - Attribute value
     */
    _setAttribute(element, key, value) {
        // Skip special attributes
        if (key === 'key' || key === 'ref') {
            return;
        }

        // Handle event attributes (onClick, onMouseOver, etc.)
        if (key.startsWith('on') && typeof value === 'function') {
            this._setEventAttribute(element, key, value);
            return;
        }

        // Handle null/undefined values
        if (value == null || value === false) {
            element.removeAttribute(key);
            return;
        }

        // Handle boolean attributes
        if (value === true) {
            element.setAttribute(key, '');
            return;
        }

        // Handle special cases
        switch (key) {
            case 'className':
            case 'class':
                this._setClass(element, value);
                break;
            case 'style':
                this._setStyle(element, value);
                break;
            case 'value':
                // For input elements, set the property as well
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.value = value;
                }
                element.setAttribute(key, value);
                break;
            case 'checked':
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = !!value;
                }
                break;
            case 'selected':
                if (element.tagName === 'OPTION') {
                    element.selected = !!value;
                }
                break;
            case 'disabled':
                if (value) {
                    element.setAttribute('disabled', '');
                    element.disabled = true;
                } else {
                    element.removeAttribute('disabled');
                    element.disabled = false;
                }
                break;
            case 'readonly':
                if (value) {
                    element.setAttribute('readonly', '');
                    element.readOnly = true;
                } else {
                    element.removeAttribute('readonly');
                    element.readOnly = false;
                }
                break;
            case 'innerHTML':
                element.innerHTML = value;
                break;
            case 'textContent':
                element.textContent = value;
                break;
            default:
                // Handle data-* and aria-* attributes
                if (key.startsWith('data-') || key.startsWith('aria-')) {
                    element.setAttribute(key, value);
                } else {
                    // For other attributes, try to set as property first
                    try {
                        if (key in element) {
                            element[key] = value;
                        } else {
                            element.setAttribute(key, value);
                        }
                    } catch (e) {
                        element.setAttribute(key, value);
                    }
                }
                break;
        }
    }

    /**
     * Set event attribute on an element
     * @private
     * @param {Element} element - DOM element
     * @param {string} eventName - Event name (e.g., 'onClick')
     * @param {Function} handler - Event handler function
     */
    _setEventAttribute(element, eventName, handler) {
        // Support for custom event syntax with data binding
        if (typeof handler === 'object' && handler.handler) {
            return this._setCustomEventAttribute(element, eventName, handler);
        }
        
        // Convert React-style event names to DOM event names
        const domEventName = this._convertEventName(eventName);
        
        // Store event handler reference for cleanup
        if (!element._miniFrameworkEvents) {
            element._miniFrameworkEvents = new Map();
            element._miniFrameworkEventIds = new Map();
        }
        
        // Remove previous handler if exists
        const previousHandlerId = element._miniFrameworkEventIds.get(domEventName);
        if (previousHandlerId && this.eventManager) {
            this.eventManager.off(previousHandlerId);
        }
        
        // If we have an EventManager, use it for enhanced event handling
        if (this.eventManager) {
            const listenerId = this.eventManager.on(element, domEventName, handler, {
                passive: this.options.passive,
                capture: this.options.capture
            });
            
            element._miniFrameworkEventIds.set(domEventName, listenerId);
        } else {
            // Fallback to standard event handling
            const previousHandler = element._miniFrameworkEvents.get(domEventName);
            if (previousHandler) {
                element.removeEventListener(domEventName, previousHandler);
            }
            
            // Create wrapped handler for better error handling
            const wrappedHandler = (event) => {
                try {
                    return handler(event);
                } catch (error) {
                    if (this.errorBoundary) {
                        this.errorBoundary.handleError(`Event handler ${eventName}`, error, 'component');
                    } else {
                        console.error(`Event handler error for ${eventName}:`, error);
                    }
                }
            };
            
            // Add new handler
            element.addEventListener(domEventName, wrappedHandler);
            element._miniFrameworkEvents.set(domEventName, wrappedHandler);
        }
    }

    /**
     * Set custom event attribute with enhanced options
     * @private
     * @param {Element} element - DOM element
     * @param {string} eventName - Event name
     * @param {Object} eventConfig - Event configuration object
     */
    _setCustomEventAttribute(element, eventName, eventConfig) {
        const {
            handler,
            data = {},
            once = false,
            passive = false,
            capture = false,
            debounce = 0,
            throttle = 0,
            condition = null,
            preventDefault = false,
            stopPropagation = false,
            priority = 'normal'
        } = eventConfig;
        
        const domEventName = this._convertEventName(eventName);
        
        if (!this.eventManager) {
            console.warn('EventManager not available, using standard event handling');
            return this._setEventAttribute(element, eventName, handler);
        }
        
        // Enhanced event handler with custom options
        const enhancedHandler = (event) => {
            if (preventDefault) {
                event.preventDefault();
            }
            
            if (stopPropagation) {
                event.stopPropagation();
            }
            
            // Add custom data to event
            if (Object.keys(data).length > 0) {
                Object.assign(event, { customData: data });
            }
            
            return handler(event);
        };
        
        const options = {
            once,
            passive,
            capture,
            debounce,
            throttle,
            condition,
            priority: priority === 'high' ? 2 : priority === 'low' ? 0 : 1
        };
        
        // Store previous listener ID for cleanup
        if (!element._miniFrameworkEventIds) {
            element._miniFrameworkEventIds = new Map();
        }
        
        const previousHandlerId = element._miniFrameworkEventIds.get(domEventName);
        if (previousHandlerId) {
            this.eventManager.off(previousHandlerId);
        }
        
        const listenerId = this.eventManager.on(element, domEventName, enhancedHandler, options);
        element._miniFrameworkEventIds.set(domEventName, listenerId);
    }

    /**
     * Convert React-style event names to DOM event names
     * @private
     * @param {string} eventName - React-style event name
     * @returns {string} DOM event name
     */
    _convertEventName(eventName) {
        // Remove 'on' prefix and convert to lowercase
        const name = eventName.slice(2).toLowerCase();
        
        // Handle special cases
        const eventMap = {
            'doubleclick': 'dblclick',
            'change': 'change',
            'input': 'input',
            'submit': 'submit',
            'reset': 'reset',
            'focus': 'focus',
            'blur': 'blur',
            'scroll': 'scroll',
            'resize': 'resize',
            'load': 'load',
            'unload': 'unload',
            'beforeunload': 'beforeunload',
            'error': 'error',
            'select': 'select',
            'contextmenu': 'contextmenu',
            'wheel': 'wheel',
            'copy': 'copy',
            'cut': 'cut',
            'paste': 'paste',
            'drag': 'drag',
            'dragend': 'dragend',
            'dragenter': 'dragenter',
            'dragleave': 'dragleave',
            'dragover': 'dragover',
            'dragstart': 'dragstart',
            'drop': 'drop'
        };
        
        return eventMap[name] || name;
    }

    /**
     * Set class attribute
     * @private
     * @param {Element} element - DOM element
     * @param {string|Array|Object} value - Class value
     */
    _setClass(element, value) {
        if (typeof value === 'string') {
            element.className = value;
        } else if (Array.isArray(value)) {
            element.className = value.filter(Boolean).join(' ');
        } else if (isPlainObject(value)) {
            const classes = Object.entries(value)
                .filter(([, condition]) => condition)
                .map(([className]) => className);
            element.className = classes.join(' ');
        }
    }

    /**
     * Set style attribute
     * @private
     * @param {Element} element - DOM element
     * @param {string|Object} value - Style value
     */
    _setStyle(element, value) {
        if (typeof value === 'string') {
            element.style.cssText = value;
        } else if (isPlainObject(value)) {
            Object.entries(value).forEach(([property, val]) => {
                if (val == null) {
                    element.style.removeProperty(property);
                } else {
                    element.style[property] = val;
                }
            });
        }
    }

    /**
     * Append children to an element
     * @private
     * @param {Element|DocumentFragment} element - Parent element
     * @param {Array} children - Child vnodes
     */
    _appendChildren(element, children) {
        children.forEach(child => {
            const childElement = this.createElement(child);
            if (childElement) {
                element.appendChild(childElement);
            }
        });
    }

    /**
     * Update an existing element
     * @private
     * @param {Element} element - DOM element
     * @param {Object} oldVNode - Old virtual node
     * @param {Object} newVNode - New virtual node
     * @returns {Element} Updated element
     */
    _updateElement(element, oldVNode, newVNode) {
        // Handle primitive types
        if (typeof newVNode === 'string' || typeof newVNode === 'number' || typeof newVNode === 'boolean') {
            if (element.nodeType === Node.TEXT_NODE) {
                const newText = String(newVNode);
                if (element.textContent !== newText) {
                    element.textContent = this.options.escapeHtml ? escapeHtml(newText) : newText;
                }
                return element;
            } else {
                // Replace with text node
                const textNode = document.createTextNode(String(newVNode));
                if (element.parentNode) {
                    element.parentNode.replaceChild(textNode, element);
                }
                return textNode;
            }
        }

        // Handle different vnode types
        if (oldVNode.type !== newVNode.type || oldVNode.tag !== newVNode.tag) {
            // Different types, replace completely
            const newElement = this.createElement(newVNode);
            if (element.parentNode) {
                element.parentNode.replaceChild(newElement, element);
            }
            return newElement;
        }

        // Same type, update in place
        if (newVNode.type === VNODE_TYPES.TEXT) {
            if (oldVNode.text !== newVNode.text) {
                element.textContent = this.options.escapeHtml ? 
                    escapeHtml(newVNode.text) : newVNode.text;
            }
            return element;
        }

        if (newVNode.type === VNODE_TYPES.ELEMENT) {
            // Update attributes
            this._updateAttributes(element, oldVNode.attrs, newVNode.attrs);
            
            // Update children
            this._updateChildren(element, oldVNode.children, newVNode.children);
        }

        return element;
    }

    /**
     * Update element attributes
     * @private
     * @param {Element} element - DOM element
     * @param {Object} oldAttrs - Old attributes
     * @param {Object} newAttrs - New attributes
     */
    _updateAttributes(element, oldAttrs, newAttrs) {
        const allKeys = new Set([...Object.keys(oldAttrs), ...Object.keys(newAttrs)]);
        
        allKeys.forEach(key => {
            const oldValue = oldAttrs[key];
            const newValue = newAttrs[key];
            
            if (oldValue !== newValue) {
                // Special handling for event attributes
                if (key.startsWith('on') && typeof oldValue === 'function' && newValue == null) {
                    this._removeEventAttribute(element, key);
                } else {
                    this._setAttribute(element, key, newValue);
                }
            }
        });
    }

    /**
     * Remove event attribute from an element
     * @private
     * @param {Element} element - DOM element
     * @param {string} eventName - Event name (e.g., 'onClick')
     */
    _removeEventAttribute(element, eventName) {
        if (!element._miniFrameworkEvents) {
            return;
        }
        
        const domEventName = this._convertEventName(eventName);
        const handler = element._miniFrameworkEvents.get(domEventName);
        
        if (handler) {
            element.removeEventListener(domEventName, handler);
            element._miniFrameworkEvents.delete(domEventName);
        }
    }

    /**
     * Clean up all event listeners on an element
     * @private
     * @param {Element} element - DOM element
     */
    _cleanupEventListeners(element) {
        if (element._miniFrameworkEvents) {
            element._miniFrameworkEvents.forEach((handler, eventName) => {
                element.removeEventListener(eventName, handler);
            });
            element._miniFrameworkEvents.clear();
        }
    }

    /**
     * Update element children
     * @private
     * @param {Element} element - Parent element
     * @param {Array} oldChildren - Old children
     * @param {Array} newChildren - New children
     */
    _updateChildren(element, oldChildren = [], newChildren = []) {
        const maxLength = Math.max(oldChildren.length, newChildren.length);
        
        for (let i = 0; i < maxLength; i++) {
            const oldChild = oldChildren[i];
            const newChild = newChildren[i];
            const childElement = element.childNodes[i];
            
            if (newChild == null) {
                // Remove extra children
                if (childElement) {
                    element.removeChild(childElement);
                }
            } else if (oldChild == null) {
                // Add new children
                const newElement = this.createElement(newChild);
                element.appendChild(newElement);
            } else {
                // Update existing child
                this.updateElement(childElement, oldChild, newChild);
            }
        }
    }

    /**
     * Flatten children array recursively
     * @private
     * @param {Array} children - Children array
     * @returns {Array} Flattened children
     */
    _flattenChildren(children) {
        const result = [];
        
        children.forEach(child => {
            if (Array.isArray(child)) {
                result.push(...this._flattenChildren(child));
            } else if (child != null && child !== false && child !== true) {
                result.push(child);
            }
        });
        
        return result;
    }

    /**
     * Validate a virtual node
     * @private
     * @param {Object} vnode - Virtual node to validate
     */
    _validateVNode(vnode) {
        if (!vnode || typeof vnode !== 'object') {
            throw new Error('Virtual node must be an object');
        }

        if (!vnode._isVNode && !vnode.tag && vnode.type !== VNODE_TYPES.TEXT && vnode.type !== VNODE_TYPES.COMMENT) {
            throw new Error('Invalid virtual node: missing tag or type');
        }

        if (vnode.tag && typeof vnode.tag !== 'string') {
            throw new Error('Virtual node tag must be a string');
        }

        if (vnode.attrs && !isPlainObject(vnode.attrs)) {
            throw new Error('Virtual node attrs must be a plain object');
        }

        if (vnode.children && !Array.isArray(vnode.children)) {
            throw new Error('Virtual node children must be an array');
        }
    }
}