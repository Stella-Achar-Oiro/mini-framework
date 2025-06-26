/**
 * Module Loading and Dependency Management System
 * Handles dynamic module loading and dependency resolution
 */

import { Logger } from '../utils/logger.js';
import { ErrorBoundary, ERROR_TYPES } from '../utils/error-boundary.js';

/**
 * Module states
 */
const MODULE_STATES = {
    PENDING: 'pending',
    LOADING: 'loading',
    LOADED: 'loaded',
    ERROR: 'error'
};

/**
 * Module loader class for dynamic imports and dependency management
 */
export class ModuleLoader {
    /**
     * Create a new module loader
     * @param {Object} options - Loader options
     */
    constructor(options = {}) {
        this.options = {
            baseUrl: '',
            timeout: 30000,
            retries: 3,
            cache: true,
            debug: false,
            ...options
        };

        this.logger = new Logger(this.options.debug);
        this.errorBoundary = new ErrorBoundary(this.options.debug);
        
        // Module registry
        this.modules = new Map();
        this.dependencies = new Map();
        this.loadingPromises = new Map();
        
        // Plugin registry
        this.plugins = new Map();
        this.hooks = {
            beforeLoad: [],
            afterLoad: [],
            onError: []
        };
    }

    /**
     * Register a module
     * @param {string} name - Module name
     * @param {Function|Object} module - Module definition
     * @param {Array<string>} deps - Module dependencies
     * @returns {ModuleLoader} Module loader instance for chaining
     */
    register(name, module, deps = []) {
        if (this.modules.has(name)) {
            this.logger.warn(`Module "${name}" already registered, overwriting`);
        }

        this.modules.set(name, {
            name,
            module,
            dependencies: deps,
            state: MODULE_STATES.LOADED,
            exports: module,
            loadTime: Date.now()
        });

        this.dependencies.set(name, deps);
        this.logger.debug(`Module "${name}" registered with dependencies:`, deps);
        
        return this;
    }

    /**
     * Load a module dynamically
     * @param {string} name - Module name or path
     * @param {Object} options - Load options
     * @returns {Promise} Promise that resolves with the module
     */
    async load(name, options = {}) {
        const loadOptions = { ...this.options, ...options };
        
        // Check if already loaded and cached
        if (this.modules.has(name) && loadOptions.cache) {
            const module = this.modules.get(name);
            if (module.state === MODULE_STATES.LOADED) {
                return module.exports;
            }
        }

        // Check if already loading
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        // Start loading
        const loadPromise = this._loadModule(name, loadOptions);
        this.loadingPromises.set(name, loadPromise);

        try {
            const result = await loadPromise;
            this.loadingPromises.delete(name);
            return result;
        } catch (error) {
            this.loadingPromises.delete(name);
            throw error;
        }
    }

    /**
     * Load multiple modules
     * @param {Array<string>} names - Module names to load
     * @param {Object} options - Load options
     * @returns {Promise<Array>} Promise that resolves with all modules
     */
    async loadAll(names, options = {}) {
        const loadPromises = names.map(name => this.load(name, options));
        return Promise.all(loadPromises);
    }

    /**
     * Check if a module is loaded
     * @param {string} name - Module name
     * @returns {boolean} True if loaded
     */
    isLoaded(name) {
        const module = this.modules.get(name);
        return module && module.state === MODULE_STATES.LOADED;
    }

    /**
     * Get a loaded module
     * @param {string} name - Module name
     * @returns {*} Module exports or null
     */
    get(name) {
        const module = this.modules.get(name);
        return module && module.state === MODULE_STATES.LOADED ? module.exports : null;
    }

    /**
     * Unload a module
     * @param {string} name - Module name
     * @returns {boolean} True if unloaded
     */
    unload(name) {
        if (this.modules.has(name)) {
            this.modules.delete(name);
            this.dependencies.delete(name);
            this.loadingPromises.delete(name);
            this.logger.debug(`Module "${name}" unloaded`);
            return true;
        }
        return false;
    }

    /**
     * Clear all modules
     * @returns {ModuleLoader} Module loader instance for chaining
     */
    clear() {
        this.modules.clear();
        this.dependencies.clear();
        this.loadingPromises.clear();
        this.logger.debug('All modules cleared');
        return this;
    }

    /**
     * Get dependency graph
     * @returns {Object} Dependency graph
     */
    getDependencyGraph() {
        const graph = {};
        this.dependencies.forEach((deps, name) => {
            graph[name] = deps;
        });
        return graph;
    }

    /**
     * Check for circular dependencies
     * @returns {Array<string>} Array of circular dependency chains
     */
    checkCircularDependencies() {
        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];

        const visit = (name, path = []) => {
            if (recursionStack.has(name)) {
                const cycleStart = path.indexOf(name);
                cycles.push([...path.slice(cycleStart), name]);
                return;
            }

            if (visited.has(name)) {
                return;
            }

            visited.add(name);
            recursionStack.add(name);

            const deps = this.dependencies.get(name) || [];
            deps.forEach(dep => {
                visit(dep, [...path, name]);
            });

            recursionStack.delete(name);
        };

        this.dependencies.forEach((_, name) => {
            if (!visited.has(name)) {
                visit(name);
            }
        });

        return cycles;
    }

    /**
     * Add a hook
     * @param {string} hookName - Hook name
     * @param {Function} callback - Hook callback
     * @returns {ModuleLoader} Module loader instance for chaining
     */
    hook(hookName, callback) {
        if (!this.hooks[hookName]) {
            throw new Error(`Unknown hook: ${hookName}`);
        }
        
        this.hooks[hookName].push(callback);
        return this;
    }

    /**
     * Register a plugin
     * @param {string} name - Plugin name
     * @param {Object} plugin - Plugin definition
     * @returns {ModuleLoader} Module loader instance for chaining
     */
    use(name, plugin) {
        this.plugins.set(name, plugin);
        
        if (typeof plugin.install === 'function') {
            plugin.install(this);
        }
        
        this.logger.debug(`Plugin "${name}" registered`);
        return this;
    }

    // Private methods

    /**
     * Internal module loading logic
     * @private
     * @param {string} name - Module name
     * @param {Object} options - Load options
     * @returns {Promise} Module loading promise
     */
    async _loadModule(name, options) {
        return this.errorBoundary.wrapAsync(async () => {
            this._callHooks('beforeLoad', name);

            // Set module state to loading
            this._setModuleState(name, MODULE_STATES.LOADING);

            const startTime = performance.now();
            let module;

            try {
                // Determine module path
                const modulePath = this._resolveModulePath(name, options);
                
                // Load the module
                module = await this._importModule(modulePath, options);
                
                // Extract dependencies if available
                const dependencies = this._extractDependencies(module);
                if (dependencies.length > 0) {
                    this.dependencies.set(name, dependencies);
                    
                    // Load dependencies first
                    await this._loadDependencies(dependencies, options);
                }

                // Store the loaded module
                const loadTime = performance.now() - startTime;
                this._setModuleLoaded(name, module, dependencies, loadTime);
                
                this._callHooks('afterLoad', name, module);
                this.logger.debug(`Module "${name}" loaded in ${loadTime.toFixed(2)}ms`);
                
                return module;

            } catch (error) {
                this._setModuleState(name, MODULE_STATES.ERROR, error);
                this._callHooks('onError', name, error);
                throw error;
            }
        }, `Module load: ${name}`, ERROR_TYPES.SYSTEM);
    }

    /**
     * Import a module from a path
     * @private
     * @param {string} path - Module path
     * @param {Object} options - Import options
     * @returns {Promise} Import promise
     */
    async _importModule(path, options) {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Module load timeout: ${path}`));
            }, options.timeout);
        });

        // Race between import and timeout
        return Promise.race([
            import(path),
            timeoutPromise
        ]);
    }

    /**
     * Resolve module path
     * @private
     * @param {string} name - Module name
     * @param {Object} options - Options
     * @returns {string} Resolved path
     */
    _resolveModulePath(name, options) {
        // If it's already a full path, use as is
        if (name.startsWith('http') || name.startsWith('/') || name.startsWith('./')) {
            return name;
        }

        // If it's a relative name, resolve relative to base URL
        const baseUrl = options.baseUrl || this.options.baseUrl;
        if (baseUrl) {
            return `${baseUrl.replace(/\/$/, '')}/${name}`;
        }

        // Try to resolve as relative import
        return `./${name}`;
    }

    /**
     * Extract dependencies from module
     * @private
     * @param {*} module - Module to analyze
     * @returns {Array<string>} Dependencies
     */
    _extractDependencies(module) {
        const dependencies = [];
        
        // Check for explicit dependencies property
        if (module.dependencies && Array.isArray(module.dependencies)) {
            dependencies.push(...module.dependencies);
        }

        // Check for default export dependencies
        if (module.default && module.default.dependencies) {
            dependencies.push(...module.default.dependencies);
        }

        return [...new Set(dependencies)]; // Remove duplicates
    }

    /**
     * Load module dependencies
     * @private
     * @param {Array<string>} dependencies - Dependencies to load
     * @param {Object} options - Load options
     * @returns {Promise} Dependencies load promise
     */
    async _loadDependencies(dependencies, options) {
        const loadPromises = dependencies.map(dep => this.load(dep, options));
        await Promise.all(loadPromises);
    }

    /**
     * Set module state
     * @private
     * @param {string} name - Module name
     * @param {string} state - New state
     * @param {Error} error - Optional error
     */
    _setModuleState(name, state, error = null) {
        const existing = this.modules.get(name) || { name };
        this.modules.set(name, {
            ...existing,
            state,
            error
        });
    }

    /**
     * Mark module as loaded
     * @private
     * @param {string} name - Module name
     * @param {*} module - Module exports
     * @param {Array<string>} dependencies - Dependencies
     * @param {number} loadTime - Load time in ms
     */
    _setModuleLoaded(name, module, dependencies, loadTime) {
        this.modules.set(name, {
            name,
            module,
            dependencies,
            state: MODULE_STATES.LOADED,
            exports: module,
            loadTime,
            timestamp: Date.now()
        });
    }

    /**
     * Call hooks
     * @private
     * @param {string} hookName - Hook name
     * @param {...*} args - Hook arguments
     */
    _callHooks(hookName, ...args) {
        if (this.hooks[hookName]) {
            this.hooks[hookName].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    this.logger.error(`Hook ${hookName} failed:`, error);
                }
            });
        }
    }
}

/**
 * Create a module dependency resolver
 */
export class DependencyResolver {
    /**
     * Resolve dependency order
     * @param {Object} dependencies - Dependency graph
     * @returns {Array<string>} Resolved order
     */
    static resolve(dependencies) {
        const resolved = [];
        const unresolved = [];

        const resolve = (name) => {
            if (unresolved.includes(name)) {
                throw new Error(`Circular dependency: ${unresolved.join(' -> ')} -> ${name}`);
            }

            if (!resolved.includes(name)) {
                unresolved.push(name);
                
                const deps = dependencies[name] || [];
                deps.forEach(dep => resolve(dep));
                
                resolved.push(name);
                unresolved.splice(unresolved.indexOf(name), 1);
            }
        };

        Object.keys(dependencies).forEach(name => resolve(name));
        
        return resolved;
    }
}