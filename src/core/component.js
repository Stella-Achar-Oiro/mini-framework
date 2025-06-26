/**
 * Mini Framework - Main Framework Class
 * Orchestrates all framework features
 */

import { DOM } from './dom.js';
import { EventManager } from './dom-events.js';
import { StateManager } from './state.js';
import { Router } from './router.js';
import { Logger } from '../utils/logger.js';
import { Config } from './config.js';
import { ErrorBoundary } from '../utils/error-boundary.js';
import { deepMerge } from '../utils/helpers.js';

/**
 * Framework lifecycle phases
 */
const LIFECYCLE_PHASES = {
    CREATED: 'created',
    MOUNTING: 'mounting',
    MOUNTED: 'mounted',
    UPDATING: 'updating',
    UPDATED: 'updated',
    UNMOUNTING: 'unmounting',
    DESTROYED: 'destroyed'
};

/**
 * Main Framework class that coordinates all features
 * @class MiniFramework
 */
export class MiniFramework {
    /**
     * Create a new framework instance
     * @param {Object} options - Configuration options
     * @param {string} options.container - CSS selector for container element
     * @param {Object} options.state - Initial state
     * @param {Object} options.routes - Route definitions
     * @param {boolean} options.debug - Enable debug mode
     * @param {Object} options.plugins - Plugin configurations
     * @param {boolean} options.strictMode - Enable strict mode for development
     */
    constructor(options = {}) {
        // Framework state
        this.phase = LIFECYCLE_PHASES.CREATED;
        this.isInitialized = false;
        this.isDestroyed = false;
        
        // Configure the framework
        this.config = new Config(options);
        this.options = this.config.getConfig();

        // Initialize error boundary
        this.errorBoundary = new ErrorBoundary(this.options.debug);
        
        // Initialize logger
        this.logger = new Logger(this.options.debug);
        
        // Initialize core systems with error boundaries
        try {
            this.dom = new DOM(this.options.dom);
            this.events = new EventManager(this.options.events);
            this.state = new StateManager(this.options.state, this.options.debug);
            this.router = new Router(this.options.routing);
        } catch (error) {
            this.errorBoundary.handleError('System initialization failed', error);
            throw error;
        }
        
        // Component and plugin registries
        this.components = new Map();
        this.plugins = new Map();
        this.middleware = [];
        
        // Lifecycle hooks
        this.hooks = {
            beforeMount: [],
            afterMount: [],
            beforeUpdate: [],
            afterUpdate: [],
            beforeUnmount: [],
            afterUnmount: []
        };
        
        // Container element
        this.container = null;
        this.renderCount = 0;
        
        // Performance tracking
        this.performance = {
            initTime: 0,
            renderTimes: [],
            lastRender: 0
        };
        
        this.logger.info('Mini Framework created', this.options);
        this._callHooks('created');
    }

    /**
     * Initialize the framework
     * @returns {MiniFramework} Framework instance for chaining
     */
    init() {
        if (this.isInitialized) {
            this.logger.warn('Framework already initialized');
            return this;
        }

        if (this.isDestroyed) {
            throw new Error('Cannot initialize destroyed framework instance');
        }

        const startTime = performance.now();
        this.phase = LIFECYCLE_PHASES.MOUNTING;

        return this.errorBoundary.wrap(() => {
            this._callHooks('beforeMount');

            // Find and validate container element
            this.container = document.querySelector(this.options.container);
            if (!this.container) {
                throw new Error(`Container element "${this.options.container}" not found`);
            }

            // Initialize plugins
            this._initializePlugins();

            // Initialize router with routes
            if (Object.keys(this.options.routes).length > 0) {
                Object.entries(this.options.routes).forEach(([path, handler]) => {
                    this.router.route(path, handler);
                });
                this.router.init();
            }

            // Connect state to re-rendering
            this.state.subscribe(() => {
                if (this.options.autoRerender) {
                    this._scheduleRerender();
                }
            });

            this.isInitialized = true;
            this.phase = LIFECYCLE_PHASES.MOUNTED;
            this.performance.initTime = performance.now() - startTime;

            this._callHooks('afterMount');
            this.logger.info(`Framework initialization complete in ${this.performance.initTime.toFixed(2)}ms`);
            
            return this;
        }, 'Framework initialization failed');
    }

    /**
     * Register a component
     */
    component(name, definition) {
        if (typeof definition !== 'function' && typeof definition !== 'object') {
            throw new Error('Component definition must be a function or object');
        }
        
        this.components.set(name, definition);
        this.logger.debug(`Component "${name}" registered`);
        return this;
    }

    /**
     * Render a component to the container
     */
    render(component, props = {}) {
        if (!this.container) {
            throw new Error('Framework not initialized. Call init() first.');
        }

        try {
            let vnode;
            
            if (typeof component === 'string') {
                // Component by name
                const componentDef = this.components.get(component);
                if (!componentDef) {
                    throw new Error(`Component "${component}" not found`);
                }
                vnode = typeof componentDef === 'function' ? componentDef(props) : componentDef;
            } else if (typeof component === 'function') {
                // Component function
                vnode = component(props);
            } else {
                // Direct vnode
                vnode = component;
            }

            // Clear container and render
            this.container.innerHTML = '';
            const element = this.dom.createElement(vnode);
            this.container.appendChild(element);
            
            this.logger.debug('Component rendered successfully');
            return this;
        } catch (error) {
            this.logger.error('Render failed:', error);
            throw error;
        }
    }

    /**
     * Get current state
     */
    getState() {
        return this.state.getState();
    }

    /**
     * Update state
     */
    setState(newState) {
        this.state.setState(newState);
        return this;
    }

    /**
     * Navigate to a route
     */
    navigate(path) {
        this.router.navigate(path);
        return this;
    }

    /**
     * Register a lifecycle hook
     * @param {string} hook - Hook name (beforeMount, afterMount, etc.)
     * @param {Function} callback - Hook callback function
     * @returns {MiniFramework} Framework instance for chaining
     */
    hook(hook, callback) {
        if (!this.hooks[hook]) {
            throw new Error(`Unknown hook: ${hook}`);
        }
        if (typeof callback !== 'function') {
            throw new Error('Hook callback must be a function');
        }
        this.hooks[hook].push(callback);
        return this;
    }

    /**
     * Register a plugin
     * @param {string} name - Plugin name
     * @param {Object|Function} plugin - Plugin definition
     * @returns {MiniFramework} Framework instance for chaining
     */
    use(name, plugin) {
        if (this.isInitialized) {
            this.logger.warn('Installing plugin after initialization may cause issues');
        }
        
        this.plugins.set(name, plugin);
        this.logger.debug(`Plugin "${name}" registered`);
        return this;
    }

    /**
     * Add middleware function
     * @param {Function} middleware - Middleware function
     * @returns {MiniFramework} Framework instance for chaining
     */
    middleware(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        this.middleware.push(middleware);
        return this;
    }

    /**
     * Get framework performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformance() {
        return {
            ...this.performance,
            averageRenderTime: this.performance.renderTimes.length > 0 
                ? this.performance.renderTimes.reduce((a, b) => a + b) / this.performance.renderTimes.length
                : 0,
            totalRenders: this.renderCount
        };
    }

    /**
     * Get framework configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return this.config.getConfig();
    }

    /**
     * Update framework configuration
     * @param {Object} newConfig - New configuration options
     * @returns {MiniFramework} Framework instance for chaining
     */
    configure(newConfig) {
        this.config.update(newConfig);
        this.options = this.config.getConfig();
        this.logger.debug('Configuration updated', newConfig);
        return this;
    }

    /**
     * Destroy framework instance
     */
    destroy() {
        if (this.isDestroyed) {
            this.logger.warn('Framework already destroyed');
            return;
        }

        this.phase = LIFECYCLE_PHASES.UNMOUNTING;
        this._callHooks('beforeUnmount');

        try {
            // Cleanup core systems
            this.events.removeAllListeners();
            this.state.destroy();
            this.router.destroy();
            
            // Clear registries
            this.components.clear();
            this.plugins.clear();
            this.middleware = [];
            
            // Clear hooks
            Object.keys(this.hooks).forEach(key => {
                this.hooks[key] = [];
            });

            // Clear container
            if (this.container) {
                this.container.innerHTML = '';
                this.container = null;
            }

            this._callHooks('afterUnmount');
            this.phase = LIFECYCLE_PHASES.DESTROYED;
            this.isDestroyed = true;
            
            this.logger.info('Framework destroyed');
        } catch (error) {
            this.errorBoundary.handleError('Framework destruction failed', error);
        }
    }

    // Private helper methods

    /**
     * Call lifecycle hooks
     * @private
     * @param {string} hookName - Name of the hook to call
     */
    _callHooks(hookName) {
        if (this.hooks[hookName]) {
            this.hooks[hookName].forEach(callback => {
                try {
                    callback.call(this);
                } catch (error) {
                    this.errorBoundary.handleError(`Hook ${hookName} failed`, error);
                }
            });
        }
    }

    /**
     * Initialize registered plugins
     * @private
     */
    _initializePlugins() {
        this.plugins.forEach((plugin, name) => {
            try {
                if (typeof plugin === 'function') {
                    plugin.call(this, this);
                } else if (plugin && typeof plugin.install === 'function') {
                    plugin.install.call(this, this);
                }
                this.logger.debug(`Plugin "${name}" initialized`);
            } catch (error) {
                this.errorBoundary.handleError(`Plugin ${name} initialization failed`, error);
            }
        });
    }

    /**
     * Schedule a re-render with debouncing
     * @private
     */
    _scheduleRerender() {
        if (this._rerenderTimeout) {
            clearTimeout(this._rerenderTimeout);
        }
        
        this._rerenderTimeout = setTimeout(() => {
            this._rerender();
        }, this.options.rerenderDelay || 16); // Default to ~60fps
    }

    /**
     * Internal re-render method
     * @private
     */
    _rerender() {
        if (!this.container || !this._lastComponent) {
            return;
        }

        this.phase = LIFECYCLE_PHASES.UPDATING;
        this._callHooks('beforeUpdate');

        const startTime = performance.now();
        
        try {
            // Re-render the last component with current state
            this.render(this._lastComponent, this._lastProps);
            
            const renderTime = performance.now() - startTime;
            this.performance.renderTimes.push(renderTime);
            this.performance.lastRender = renderTime;
            
            // Keep only last 100 render times for average calculation
            if (this.performance.renderTimes.length > 100) {
                this.performance.renderTimes.shift();
            }
            
            this.phase = LIFECYCLE_PHASES.UPDATED;
            this._callHooks('afterUpdate');
            
        } catch (error) {
            this.errorBoundary.handleError('Re-render failed', error);
        }
    }

    /**
     * Apply middleware to a value
     * @private
     * @param {*} value - Initial value
     * @param {string} type - Middleware type
     * @returns {*} Processed value
     */
    _applyMiddleware(value, type) {
        return this.middleware.reduce((acc, middleware) => {
            try {
                return middleware(acc, type, this) || acc;
            } catch (error) {
                this.errorBoundary.handleError('Middleware failed', error);
                return acc;
            }
        }, value);
    }
}