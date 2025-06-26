/**
 * Event Handling System
 * Custom event registration and management with delegation support
 * @module core/dom-events
 */

import { ErrorBoundary, ERROR_TYPES } from '../utils/error-boundary.js';
import { Logger } from '../utils/logger.js';
import { generateUniqueId, debounce, throttle } from '../utils/helpers.js';

/**
 * Event priority levels
 */
const EVENT_PRIORITY = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

/**
 * Event phases
 */
const EVENT_PHASES = {
    CAPTURE: 'capture',
    TARGET: 'target',
    BUBBLE: 'bubble'
};

/**
 * Custom event wrapper with enhanced functionality
 */
class CustomEvent {
    constructor(originalEvent, data = {}) {
        this.originalEvent = originalEvent;
        this.type = originalEvent?.type || 'custom';
        this.target = originalEvent?.target || null;
        this.currentTarget = originalEvent?.currentTarget || null;
        this.data = data;
        this.timestamp = Date.now();
        this.phase = EVENT_PHASES.TARGET;
        this.bubbles = originalEvent?.bubbles ?? true;
        this.cancelable = originalEvent?.cancelable ?? true;
        this.defaultPrevented = false;
        this.propagationStopped = false;
        this.immediatePropagationStopped = false;
        this.trusted = originalEvent?.isTrusted ?? false;
        this.id = generateUniqueId('event');
    }

    preventDefault() {
        this.defaultPrevented = true;
        if (this.originalEvent && this.cancelable) {
            this.originalEvent.preventDefault();
        }
    }

    stopPropagation() {
        this.propagationStopped = true;
        if (this.originalEvent) {
            this.originalEvent.stopPropagation();
        }
    }

    stopImmediatePropagation() {
        this.immediatePropagationStopped = true;
        this.propagationStopped = true;
        if (this.originalEvent) {
            this.originalEvent.stopImmediatePropagation();
        }
    }

    /**
     * Get the event path (elements from target to root)
     */
    getPath() {
        const path = [];
        let element = this.target;
        
        while (element) {
            path.push(element);
            element = element.parentElement;
        }
        
        return path;
    }

    /**
     * Check if event occurred within a specific element
     */
    isWithin(element) {
        return this.getPath().includes(element);
    }
}

/**
 * Event listener wrapper with metadata
 */
class EventListener {
    constructor(handler, options = {}) {
        this.id = generateUniqueId('listener');
        this.handler = handler;
        this.options = {
            once: false,
            passive: false,
            capture: false,
            priority: EVENT_PRIORITY.NORMAL,
            debounce: 0,
            throttle: 0,
            condition: null,
            ...options
        };
        this.callCount = 0;
        this.lastCalled = 0;
        this.totalTime = 0;
        this.disabled = false;
        
        // Apply debounce/throttle if specified
        this.wrappedHandler = this._wrapHandler();
    }

    _wrapHandler() {
        let handler = this.handler;
        
        if (this.options.debounce > 0) {
            handler = debounce(handler, this.options.debounce);
        } else if (this.options.throttle > 0) {
            handler = throttle(handler, this.options.throttle);
        }
        
        return handler;
    }

    call(event, context = null) {
        if (this.disabled) return;
        
        // Check condition if specified
        if (this.options.condition && !this.options.condition(event)) {
            return;
        }
        
        const startTime = performance.now();
        
        try {
            this.callCount++;
            this.lastCalled = Date.now();
            
            const result = this.wrappedHandler.call(context, event);
            
            this.totalTime += performance.now() - startTime;
            
            return result;
        } catch (error) {
            console.error(`Event handler error:`, error);
            throw error;
        }
    }

    disable() {
        this.disabled = true;
    }

    enable() {
        this.disabled = false;
    }

    getStats() {
        return {
            id: this.id,
            callCount: this.callCount,
            lastCalled: this.lastCalled,
            totalTime: this.totalTime,
            averageTime: this.callCount > 0 ? this.totalTime / this.callCount : 0,
            disabled: this.disabled
        };
    }
}

/**
 * Event Manager class for centralized event handling
 */
export class EventManager {
    constructor(options = {}) {
        this.options = {
            delegation: true,
            passive: false,
            capture: false,
            debug: false,
            maxListeners: 100,
            enableStats: true,
            ...options
        };

        this.logger = new Logger(this.options.debug);
        this.errorBoundary = new ErrorBoundary(this.options.debug);
        
        // Event storage
        this.listeners = new Map(); // eventType -> Set of listeners
        this.delegatedListeners = new Map(); // element -> Map of eventType -> Set of listeners
        this.customEvents = new Map(); // custom event definitions
        this.eventHistory = []; // event history for debugging
        
        // Performance tracking
        this.stats = {
            eventsProcessed: 0,
            listenersRegistered: 0,
            delegationHits: 0,
            totalProcessingTime: 0
        };
        
        // Root element for delegation
        this.rootElement = null;
        this.delegationHandlers = new Map();
        
        this.logger.debug('EventManager initialized', this.options);
    }

    /**
     * Initialize event delegation on a root element
     * @param {Element} rootElement - Root element for delegation
     */
    init(rootElement = document.body) {
        this.rootElement = rootElement;
        this._setupDelegation();
        this.logger.debug('Event delegation initialized on', rootElement);
    }

    /**
     * Register an event listener
     * @param {string|Element} target - Event target (selector string or element)
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Listener options
     * @returns {string} Listener ID for removal
     */
    on(target, eventType, handler, options = {}) {
        if (typeof handler !== 'function') {
            throw new Error('Event handler must be a function');
        }

        const listener = new EventListener(handler, options);
        
        if (typeof target === 'string') {
            // Selector-based event (delegation)
            return this._registerDelegatedEvent(target, eventType, listener);
        } else if (target instanceof Element) {
            // Direct element event
            return this._registerDirectEvent(target, eventType, listener);
        } else {
            throw new Error('Target must be a CSS selector string or DOM element');
        }
    }

    /**
     * Remove an event listener
     * @param {string} listenerId - Listener ID returned by on()
     * @returns {boolean} True if removed successfully
     */
    off(listenerId) {
        // Search through all listeners to find and remove
        for (const [eventType, listenerSet] of this.listeners) {
            for (const listener of listenerSet) {
                if (listener.id === listenerId) {
                    listenerSet.delete(listener);
                    if (listenerSet.size === 0) {
                        this.listeners.delete(eventType);
                    }
                    this.logger.debug(`Listener ${listenerId} removed`);
                    return true;
                }
            }
        }
        
        // Search delegated listeners
        for (const [element, eventMap] of this.delegatedListeners) {
            for (const [eventType, listenerSet] of eventMap) {
                for (const listener of listenerSet) {
                    if (listener.id === listenerId) {
                        listenerSet.delete(listener);
                        if (listenerSet.size === 0) {
                            eventMap.delete(eventType);
                            if (eventMap.size === 0) {
                                this.delegatedListeners.delete(element);
                            }
                        }
                        this.logger.debug(`Delegated listener ${listenerId} removed`);
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Emit a custom event
     * @param {string|Element} target - Event target
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     * @param {Object} options - Event options
     * @returns {CustomEvent} The emitted event
     */
    emit(target, eventType, data = {}, options = {}) {
        const eventOptions = {
            bubbles: true,
            cancelable: true,
            ...options
        };

        // Create custom event
        const customEvent = new CustomEvent(null, data);
        customEvent.type = eventType;
        customEvent.bubbles = eventOptions.bubbles;
        customEvent.cancelable = eventOptions.cancelable;

        if (typeof target === 'string') {
            // Emit on all matching elements
            const elements = this.rootElement ? 
                this.rootElement.querySelectorAll(target) : 
                document.querySelectorAll(target);
                
            elements.forEach(element => {
                customEvent.target = element;
                customEvent.currentTarget = element;
                this._processEvent(customEvent);
            });
        } else if (target instanceof Element) {
            customEvent.target = target;
            customEvent.currentTarget = target;
            this._processEvent(customEvent);
        }

        return customEvent;
    }

    /**
     * Register a custom event type
     * @param {string} eventType - Custom event type name
     * @param {Object} definition - Event definition
     */
    defineCustomEvent(eventType, definition = {}) {
        this.customEvents.set(eventType, {
            bubbles: true,
            cancelable: true,
            detail: null,
            ...definition
        });
        
        this.logger.debug(`Custom event "${eventType}" defined`);
    }

    /**
     * Create an event listener with specific conditions
     * @param {string|Element} target - Event target
     * @param {string} eventType - Event type
     * @param {Function} condition - Condition function
     * @param {Function} handler - Event handler
     * @param {Object} options - Additional options
     * @returns {string} Listener ID
     */
    when(target, eventType, condition, handler, options = {}) {
        return this.on(target, eventType, handler, {
            ...options,
            condition
        });
    }

    /**
     * Create a one-time event listener
     * @param {string|Element} target - Event target
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Additional options
     * @returns {string} Listener ID
     */
    once(target, eventType, handler, options = {}) {
        return this.on(target, eventType, handler, {
            ...options,
            once: true
        });
    }

    /**
     * Create a debounced event listener
     * @param {string|Element} target - Event target
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler
     * @param {number} delay - Debounce delay in ms
     * @param {Object} options - Additional options
     * @returns {string} Listener ID
     */
    debounce(target, eventType, handler, delay, options = {}) {
        return this.on(target, eventType, handler, {
            ...options,
            debounce: delay
        });
    }

    /**
     * Create a throttled event listener
     * @param {string|Element} target - Event target
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler
     * @param {number} limit - Throttle limit in ms
     * @param {Object} options - Additional options
     * @returns {string} Listener ID
     */
    throttle(target, eventType, handler, limit, options = {}) {
        return this.on(target, eventType, handler, {
            ...options,
            throttle: limit
        });
    }

    /**
     * Get event statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const listenerCount = Array.from(this.listeners.values())
            .reduce((sum, set) => sum + set.size, 0);
            
        const delegatedCount = Array.from(this.delegatedListeners.values())
            .reduce((sum, eventMap) => 
                sum + Array.from(eventMap.values())
                    .reduce((subSum, set) => subSum + set.size, 0), 0);

        return {
            ...this.stats,
            activeListeners: listenerCount,
            activeDelegatedListeners: delegatedCount,
            customEventTypes: this.customEvents.size,
            averageProcessingTime: this.stats.eventsProcessed > 0 ? 
                this.stats.totalProcessingTime / this.stats.eventsProcessed : 0
        };
    }

    /**
     * Remove all event listeners
     */
    removeAllListeners() {
        // Remove delegation handlers
        this.delegationHandlers.forEach((handler, eventType) => {
            if (this.rootElement) {
                this.rootElement.removeEventListener(eventType, handler, true);
                this.rootElement.removeEventListener(eventType, handler, false);
            }
        });
        
        this.listeners.clear();
        this.delegatedListeners.clear();
        this.delegationHandlers.clear();
        this.customEvents.clear();
        this.eventHistory = [];
        
        this.logger.debug('All event listeners removed');
    }

    /**
     * Destroy the event manager
     */
    destroy() {
        this.removeAllListeners();
        this.rootElement = null;
        this.logger.debug('EventManager destroyed');
    }

    // Private methods

    /**
     * Register a direct element event
     * @private
     */
    _registerDirectEvent(element, eventType, listener) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        
        const wrappedHandler = (event) => {
            const customEvent = new CustomEvent(event);
            customEvent.currentTarget = element;
            this._callListener(listener, customEvent);
        };
        
        listener.wrappedDOMHandler = wrappedHandler;
        
        element.addEventListener(eventType, wrappedHandler, {
            capture: listener.options.capture,
            passive: listener.options.passive,
            once: listener.options.once
        });
        
        this.listeners.get(eventType).add(listener);
        this.stats.listenersRegistered++;
        
        this.logger.debug(`Direct event listener registered: ${eventType} on`, element);
        
        return listener.id;
    }

    /**
     * Register a delegated event
     * @private
     */
    _registerDelegatedEvent(selector, eventType, listener) {
        if (!this.delegatedListeners.has(selector)) {
            this.delegatedListeners.set(selector, new Map());
        }
        
        const selectorMap = this.delegatedListeners.get(selector);
        if (!selectorMap.has(eventType)) {
            selectorMap.set(eventType, new Set());
        }
        
        selectorMap.get(eventType).add(listener);
        listener.selector = selector;
        
        // Setup delegation handler if not already done
        this._ensureDelegationHandler(eventType);
        
        this.stats.listenersRegistered++;
        
        this.logger.debug(`Delegated event listener registered: ${eventType} for selector "${selector}"`);
        
        return listener.id;
    }

    /**
     * Setup event delegation
     * @private
     */
    _setupDelegation() {
        if (!this.options.delegation || !this.rootElement) {
            return;
        }
        
        // Common events to delegate
        const commonEvents = [
            'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
            'keydown', 'keyup', 'keypress', 'focus', 'blur', 'change', 'input',
            'submit', 'reset', 'scroll', 'resize', 'load', 'unload'
        ];
        
        commonEvents.forEach(eventType => {
            this._ensureDelegationHandler(eventType);
        });
    }

    /**
     * Ensure delegation handler exists for event type
     * @private
     */
    _ensureDelegationHandler(eventType) {
        if (this.delegationHandlers.has(eventType) || !this.rootElement) {
            return;
        }
        
        const handler = (event) => {
            this._handleDelegatedEvent(event);
        };
        
        // Add both capture and bubble phase handlers
        this.rootElement.addEventListener(eventType, handler, true); // Capture
        this.rootElement.addEventListener(eventType, handler, false); // Bubble
        
        this.delegationHandlers.set(eventType, handler);
    }

    /**
     * Handle delegated events
     * @private
     */
    _handleDelegatedEvent(originalEvent) {
        const customEvent = new CustomEvent(originalEvent);
        customEvent.phase = originalEvent.eventPhase === 1 ? 
            EVENT_PHASES.CAPTURE : 
            originalEvent.eventPhase === 3 ? 
                EVENT_PHASES.BUBBLE : 
                EVENT_PHASES.TARGET;
        
        // Find matching selectors for the event path
        const path = customEvent.getPath();
        
        for (const element of path) {
            if (customEvent.immediatePropagationStopped) break;
            
            for (const [selector, eventMap] of this.delegatedListeners) {
                if (element.matches && element.matches(selector)) {
                    const listeners = eventMap.get(originalEvent.type);
                    if (listeners) {
                        customEvent.currentTarget = element;
                        this.stats.delegationHits++;
                        
                        for (const listener of listeners) {
                            if (customEvent.immediatePropagationStopped) break;
                            this._callListener(listener, customEvent);
                        }
                    }
                }
            }
            
            if (customEvent.propagationStopped) break;
        }
    }

    /**
     * Process a custom event
     * @private
     */
    _processEvent(event) {
        const startTime = performance.now();
        
        try {
            // Add to history if enabled
            if (this.options.enableStats) {
                this.eventHistory.push({
                    type: event.type,
                    timestamp: event.timestamp,
                    target: event.target,
                    data: event.data
                });
                
                // Keep only last 100 events
                if (this.eventHistory.length > 100) {
                    this.eventHistory.shift();
                }
            }
            
            // Process direct listeners
            const listeners = this.listeners.get(event.type);
            if (listeners) {
                for (const listener of listeners) {
                    if (event.immediatePropagationStopped) break;
                    this._callListener(listener, event);
                }
            }
            
            this.stats.eventsProcessed++;
            this.stats.totalProcessingTime += performance.now() - startTime;
            
        } catch (error) {
            this.errorBoundary.handleError('Event processing failed', error, ERROR_TYPES.COMPONENT);
        }
    }

    /**
     * Call an event listener safely
     * @private
     */
    _callListener(listener, event) {
        try {
            const result = listener.call(event);
            
            // Remove one-time listeners
            if (listener.options.once) {
                this.off(listener.id);
            }
            
            return result;
        } catch (error) {
            this.errorBoundary.handleError(`Event listener ${listener.id} failed`, error, ERROR_TYPES.COMPONENT);
        }
    }
}