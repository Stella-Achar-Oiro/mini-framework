/**
 * State Management System
 * Reactive state updates with immutable operations and performance optimizations
 * @module core/state
 */

import { ErrorBoundary, ERROR_TYPES } from '../utils/error-boundary.js';
import { Logger } from '../utils/logger.js';
import { deepClone, deepEqual, get, set, debounce } from '../utils/helpers.js';

/**
 * State change types for debugging and middleware
 */
const STATE_CHANGE_TYPES = {
    SET: 'set',
    MERGE: 'merge',
    UPDATE: 'update',
    DELETE: 'delete',
    RESET: 'reset',
    BATCH: 'batch'
};

/**
 * State subscription types
 */
const SUBSCRIPTION_TYPES = {
    GLOBAL: 'global',
    PATH: 'path',
    COMPUTED: 'computed'
};

/**
 * Subscription wrapper with metadata
 */
class StateSubscription {
    constructor(callback, options = {}) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.callback = callback;
        this.type = options.type || SUBSCRIPTION_TYPES.GLOBAL;
        this.path = options.path || null;
        this.condition = options.condition || null;
        this.immediate = options.immediate || false;
        this.once = options.once || false;
        this.debounce = options.debounce || 0;
        this.priority = options.priority || 0;
        this.active = true;
        this.callCount = 0;
        this.lastValue = undefined;
        
        // Apply debouncing if specified
        if (this.debounce > 0) {
            this.debouncedCallback = debounce(callback, this.debounce);
        }
    }

    call(newState, prevState, changeInfo) {
        if (!this.active) return false;
        
        // Check condition if specified
        if (this.condition && !this.condition(newState, prevState, changeInfo)) {
            return false;
        }
        
        try {
            this.callCount++;
            
            if (this.debounce > 0) {
                this.debouncedCallback(newState, prevState, changeInfo);
            } else {
                this.callback(newState, prevState, changeInfo);
            }
            
            // Remove if once-only subscription
            if (this.once) {
                this.active = false;
                return 'remove';
            }
            
            return true;
        } catch (error) {
            console.error(`State subscription ${this.id} error:`, error);
            return false;
        }
    }

    matches(path) {
        if (this.type !== SUBSCRIPTION_TYPES.PATH) return true;
        if (!this.path || !path) return false;
        
        // Exact match or parent path match
        return path.startsWith(this.path) || this.path.startsWith(path);
    }
}

/**
 * State middleware function wrapper
 */
class StateMiddleware {
    constructor(fn, options = {}) {
        this.fn = fn;
        this.name = options.name || 'anonymous';
        this.priority = options.priority || 0;
        this.async = options.async || false;
    }

    async execute(action, currentState, nextState) {
        try {
            if (this.async) {
                return await this.fn(action, currentState, nextState);
            } else {
                return this.fn(action, currentState, nextState);
            }
        } catch (error) {
            console.error(`State middleware ${this.name} error:`, error);
            return nextState; // Return unchanged state on error
        }
    }
}

/**
 * Enhanced State Manager with reactive updates and performance optimizations
 */
export class StateManager {
    /**
     * Create a new state manager
     * @param {Object} initialState - Initial state object
     * @param {boolean} debug - Enable debug mode
     * @param {Object} options - Additional options
     */
    constructor(initialState = {}, debug = false, options = {}) {
        this.options = {
            maxHistory: 50,
            enablePersistence: false,
            persistenceKey: 'miniFramework.state',
            enableBatching: true,
            batchDelay: 16, // ~60fps
            enableValidation: true,
            enableMiddleware: true,
            enableComputed: true,
            ...options
        };

        this.debugEnabled = debug;
        this.logger = new Logger(debug);
        this.errorBoundary = new ErrorBoundary(debug);
        
        // State storage
        this.state = this._createReactiveState(deepClone(initialState));
        this.prevState = {};
        
        // Subscriptions
        this.subscriptions = new Map();
        this.pathWatchers = new Map();
        this.computedProperties = new Map();
        
        // History and debugging
        this.history = [];
        this.future = []; // For undo/redo
        this.currentHistoryIndex = -1;
        
        // Middleware
        this.middleware = [];
        this.validators = new Map();
        
        // Batching
        this.batchedUpdates = [];
        this.batchTimeout = null;
        this.isBatching = false;
        
        // Performance tracking
        this.stats = {
            updates: 0,
            subscriptionCalls: 0,
            batchedUpdates: 0,
            averageUpdateTime: 0,
            totalUpdateTime: 0
        };
        
        // Load persisted state if enabled
        if (this.options.enablePersistence) {
            this._loadPersistedState();
        }
        
        this.logger.debug('StateManager initialized', this.state);
    }

    /**
     * Get the current state (immutable copy)
     * @param {string} path - Optional path to get specific value
     * @returns {*} Current state or value at path
     */
    getState(path = null) {
        if (path) {
            return get(this.state, path);
        }
        return deepClone(this.state);
    }

    /**
     * Set state with various update patterns
     * @param {Object|Function|string} pathOrState - Path string, state object, or update function
     * @param {*} value - Value to set (if first param is path)
     * @param {Object} options - Update options
     * @returns {Promise<StateManager>} State manager instance for chaining
     */
    async setState(pathOrState, value = undefined, options = {}) {
        const updateOptions = {
            type: STATE_CHANGE_TYPES.SET,
            batch: this.options.enableBatching,
            validate: this.options.enableValidation,
            middleware: this.options.enableMiddleware,
            ...options
        };

        let updateFn;
        
        if (typeof pathOrState === 'string') {
            // Path-based update: setState('user.name', 'John')
            updateFn = (state) => {
                const newState = deepClone(state);
                set(newState, pathOrState, value);
                return newState;
            };
            updateOptions.path = pathOrState;
            updateOptions.value = value;
        } else if (typeof pathOrState === 'function') {
            // Function-based update: setState(state => ({ ...state, count: state.count + 1 }))
            updateFn = pathOrState;
            updateOptions.type = STATE_CHANGE_TYPES.UPDATE;
        } else if (typeof pathOrState === 'object') {
            // Object merge: setState({ user: { name: 'John' } })
            updateFn = (state) => this._mergeState(state, pathOrState);
            updateOptions.type = STATE_CHANGE_TYPES.MERGE;
            updateOptions.updates = pathOrState;
        } else {
            throw new Error('Invalid setState parameter type');
        }

        return this._performUpdate(updateFn, updateOptions);
    }

    /**
     * Merge state (shallow or deep)
     * @param {Object} updates - Updates to merge
     * @param {Object} options - Merge options
     * @returns {Promise<StateManager>} State manager instance
     */
    async mergeState(updates, options = {}) {
        return this.setState(updates, undefined, {
            ...options,
            type: STATE_CHANGE_TYPES.MERGE
        });
    }

    /**
     * Delete a property from state
     * @param {string} path - Path to delete
     * @param {Object} options - Delete options
     * @returns {Promise<StateManager>} State manager instance
     */
    async deleteState(path, options = {}) {
        const updateFn = (state) => {
            const newState = deepClone(state);
            const keys = path.split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((obj, key) => obj?.[key], newState);
            
            if (target && lastKey in target) {
                delete target[lastKey];
            }
            
            return newState;
        };

        return this._performUpdate(updateFn, {
            ...options,
            type: STATE_CHANGE_TYPES.DELETE,
            path
        });
    }

    /**
     * Batch multiple state updates for performance
     * @param {Function} updateFn - Function that performs multiple updates
     * @returns {Promise<StateManager>} State manager instance
     */
    async batch(updateFn) {
        const wasBatching = this.isBatching;
        this.isBatching = true;
        
        try {
            await updateFn();
            
            if (!wasBatching) {
                // Execute all batched updates
                await this._executeBatch();
            }
        } finally {
            if (!wasBatching) {
                this.isBatching = false;
            }
        }
        
        return this;
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Callback function
     * @param {Object} options - Subscription options
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback, options = {}) {
        const subscription = new StateSubscription(callback, {
            type: SUBSCRIPTION_TYPES.GLOBAL,
            ...options
        });
        
        this.subscriptions.set(subscription.id, subscription);
        
        // Call immediately if requested
        if (subscription.immediate) {
            subscription.call(this.state, this.prevState, { type: 'initial' });
        }
        
        this.logger.debug(`Subscription ${subscription.id} added`);
        
        return () => this._unsubscribe(subscription.id);
    }

    /**
     * Watch a specific state path for changes
     * @param {string} path - State path to watch (dot notation)
     * @param {Function} callback - Callback function
     * @param {Object} options - Watch options
     * @returns {Function} Unwatch function
     */
    watch(path, callback, options = {}) {
        const subscription = new StateSubscription(callback, {
            type: SUBSCRIPTION_TYPES.PATH,
            path,
            ...options
        });
        
        // Store current value for comparison
        subscription.lastValue = get(this.state, path);
        
        if (!this.pathWatchers.has(path)) {
            this.pathWatchers.set(path, new Set());
        }
        this.pathWatchers.get(path).add(subscription.id);
        
        this.subscriptions.set(subscription.id, subscription);
        
        // Call immediately if requested
        if (subscription.immediate) {
            callback(subscription.lastValue, undefined, { type: 'initial', path });
        }
        
        this.logger.debug(`Path watcher ${subscription.id} added for path: ${path}`);
        
        return () => this._unsubscribe(subscription.id);
    }

    /**
     * Create a computed property that updates when dependencies change
     * @param {string} name - Computed property name
     * @param {Function} computeFn - Function to compute the value
     * @param {Array<string>} dependencies - State paths this computed property depends on
     * @returns {Function} Remove computed property function
     */
    computed(name, computeFn, dependencies = []) {
        if (!this.options.enableComputed) {
            this.logger.warn('Computed properties are disabled');
            return () => {};
        }
        
        const computed = {
            name,
            computeFn,
            dependencies,
            lastValue: undefined,
            cache: new Map()
        };
        
        // Compute initial value
        computed.lastValue = computeFn(this.state);
        
        // Watch dependencies
        const watchers = dependencies.map(dep => 
            this.watch(dep, () => {
                const newValue = computeFn(this.state);
                if (!deepEqual(newValue, computed.lastValue)) {
                    computed.lastValue = newValue;
                    this._notifyComputedChange(name, newValue);
                }
            })
        );
        
        this.computedProperties.set(name, { ...computed, watchers });
        
        this.logger.debug(`Computed property ${name} created with dependencies:`, dependencies);
        
        return () => {
            // Remove watchers
            computed.watchers?.forEach(unwatch => unwatch());
            this.computedProperties.delete(name);
            this.logger.debug(`Computed property ${name} removed`);
        };
    }

    /**
     * Get a computed property value
     * @param {string} name - Computed property name
     * @returns {*} Computed value
     */
    getComputed(name) {
        const computed = this.computedProperties.get(name);
        return computed ? computed.lastValue : undefined;
    }

    /**
     * Add middleware for state updates
     * @param {Function} middlewareFn - Middleware function
     * @param {Object} options - Middleware options
     * @returns {Function} Remove middleware function
     */
    use(middlewareFn, options = {}) {
        const middleware = new StateMiddleware(middlewareFn, options);
        this.middleware.push(middleware);
        
        // Sort by priority (higher priority first)
        this.middleware.sort((a, b) => b.priority - a.priority);
        
        this.logger.debug(`Middleware ${middleware.name} added`);
        
        return () => {
            const index = this.middleware.indexOf(middleware);
            if (index > -1) {
                this.middleware.splice(index, 1);
                this.logger.debug(`Middleware ${middleware.name} removed`);
            }
        };
    }

    /**
     * Add state validator
     * @param {string} path - State path to validate
     * @param {Function} validator - Validator function
     * @returns {Function} Remove validator function
     */
    addValidator(path, validator) {
        if (!this.validators.has(path)) {
            this.validators.set(path, []);
        }
        
        this.validators.get(path).push(validator);
        
        this.logger.debug(`Validator added for path: ${path}`);
        
        return () => {
            const validators = this.validators.get(path);
            if (validators) {
                const index = validators.indexOf(validator);
                if (index > -1) {
                    validators.splice(index, 1);
                }
            }
        };
    }

    /**
     * Reset state to initial or provided state
     * @param {Object} newState - Optional new state to reset to
     * @returns {Promise<StateManager>} State manager instance
     */
    async reset(newState = {}) {
        return this._performUpdate(() => deepClone(newState), {
            type: STATE_CHANGE_TYPES.RESET
        });
    }

    /**
     * Undo last state change
     * @returns {Promise<StateManager>} State manager instance
     */
    async undo() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            const previousState = this.history[this.currentHistoryIndex];
            
            return this._performUpdate(() => deepClone(previousState.state), {
                type: 'undo',
                skipHistory: true
            });
        }
        
        this.logger.warn('No more states to undo');
        return this;
    }

    /**
     * Redo next state change
     * @returns {Promise<StateManager>} State manager instance
     */
    async redo() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            const nextState = this.history[this.currentHistoryIndex];
            
            return this._performUpdate(() => deepClone(nextState.state), {
                type: 'redo',
                skipHistory: true
            });
        }
        
        this.logger.warn('No more states to redo');
        return this;
    }

    /**
     * Get state history
     * @returns {Array} State history
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Clear state history
     * @returns {StateManager} State manager instance
     */
    clearHistory() {
        this.history = [];
        this.future = [];
        this.currentHistoryIndex = -1;
        return this;
    }

    /**
     * Get state management statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this.stats,
            activeSubscriptions: this.subscriptions.size,
            pathWatchers: this.pathWatchers.size,
            computedProperties: this.computedProperties.size,
            middleware: this.middleware.length,
            historySize: this.history.length
        };
    }

    /**
     * Export state for persistence or debugging
     * @returns {Object} Serializable state object
     */
    export() {
        return {
            state: this.getState(),
            history: this.history,
            stats: this.getStats(),
            timestamp: Date.now()
        };
    }

    /**
     * Import state from exported data
     * @param {Object} data - Exported state data
     * @returns {Promise<StateManager>} State manager instance
     */
    async import(data) {
        if (data.state) {
            await this.reset(data.state);
        }
        
        if (data.history) {
            this.history = [...data.history];
            this.currentHistoryIndex = this.history.length - 1;
        }
        
        this.logger.debug('State imported successfully');
        return this;
    }

    /**
     * Destroy the state manager
     */
    destroy() {
        // Clear all subscriptions
        this.subscriptions.clear();
        this.pathWatchers.clear();
        
        // Clear computed properties
        this.computedProperties.forEach(computed => {
            computed.watchers?.forEach(unwatch => unwatch());
        });
        this.computedProperties.clear();
        
        // Clear batching
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        // Clear history
        this.clearHistory();
        
        // Reset state
        this.state = {};
        this.prevState = {};
        
        this.logger.debug('StateManager destroyed');
    }

    // Private methods

    /**
     * Create reactive state proxy
     * @private
     */
    _createReactiveState(initialState) {
        // For now, return the state as-is
        // In a more advanced implementation, this could use Proxy for reactivity
        return initialState;
    }

    /**
     * Perform a state update with all middleware and validation
     * @private
     */
    async _performUpdate(updateFn, options = {}) {
        const startTime = performance.now();

        try {
            // Store previous state
            this.prevState = deepClone(this.state);
            
            // Apply update function
            let newState = updateFn(this.state);
            
            // Run middleware
            if (options.middleware && this.middleware.length > 0) {
                newState = await this._runMiddleware(options, this.state, newState);
            }
            
            // Validate state
            if (options.validate) {
                await this._validateState(newState, options);
            }
            
            // Check if state actually changed
            if (deepEqual(this.state, newState)) {
                this.logger.debug('State update resulted in no changes');
                return this;
            }
            
            // Update state
            this.state = newState;
            
            // Add to history
            if (!options.skipHistory) {
                this._addToHistory(this.state, options);
            }
            
            // Handle batching
            if (options.batch && this.options.enableBatching && !this.isBatching) {
                this._scheduleBatch();
            } else {
                // Notify subscribers immediately
                await this._notifySubscribers(this.state, this.prevState, options);
            }
            
            // Persist state if enabled
            if (this.options.enablePersistence) {
                this._persistState();
            }
            
            // Update stats
            const updateTime = performance.now() - startTime;
            this.stats.updates++;
            this.stats.totalUpdateTime += updateTime;
            this.stats.averageUpdateTime = this.stats.totalUpdateTime / this.stats.updates;
            
            this.logger.debug(`State updated in ${updateTime.toFixed(2)}ms`, options);
            
            return this;
            
        } catch (error) {
            this.errorBoundary.handleError('State update failed', error, ERROR_TYPES.STATE);
            throw error;
        }
    }

    /**
     * Run middleware chain
     * @private
     */
    async _runMiddleware(action, currentState, nextState) {
        let result = nextState;
        
        for (const middleware of this.middleware) {
            result = await middleware.execute(action, currentState, result);
        }
        
        return result;
    }

    /**
     * Validate state using registered validators
     * @private
     */
    async _validateState(newState, options) {
        const validationPromises = [];
        
        this.validators.forEach((validators, path) => {
            const value = get(newState, path);
            
            validators.forEach(validator => {
                validationPromises.push(
                    Promise.resolve(validator(value, newState, options))
                        .then(isValid => {
                            if (!isValid) {
                                throw new Error(`Validation failed for path: ${path}`);
                            }
                        })
                );
            });
        });
        
        await Promise.all(validationPromises);
    }

    /**
     * Add state to history
     * @private
     */
    _addToHistory(state, options) {
        // Clear future states if we're not at the end
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        }
        
        this.history.push({
            state: deepClone(state),
            timestamp: Date.now(),
            action: options
        });
        
        this.currentHistoryIndex = this.history.length - 1;
        
        // Limit history size
        if (this.history.length > this.options.maxHistory) {
            this.history.shift();
            this.currentHistoryIndex--;
        }
    }

    /**
     * Schedule batched update
     * @private
     */
    _scheduleBatch() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        this.batchTimeout = setTimeout(() => {
            this._executeBatch();
        }, this.options.batchDelay);
    }

    /**
     * Execute batched updates
     * @private
     */
    async _executeBatch() {
        if (this.batchedUpdates.length === 0) return;
        
        const updates = [...this.batchedUpdates];
        this.batchedUpdates = [];
        this.batchTimeout = null;
        
        // Notify all subscribers with batched updates
        await this._notifySubscribers(this.state, this.prevState, {
            type: STATE_CHANGE_TYPES.BATCH,
            updates
        });
        
        this.stats.batchedUpdates += updates.length;
        this.logger.debug(`Executed batch of ${updates.length} updates`);
    }

    /**
     * Notify all subscribers of state changes
     * @private
     */
    async _notifySubscribers(newState, prevState, changeInfo) {
        const notificationPromises = [];
        const toRemove = [];
        
        this.subscriptions.forEach((subscription, id) => {
            // Check if this subscription should be notified
            if (subscription.type === SUBSCRIPTION_TYPES.PATH) {
                const newValue = get(newState, subscription.path);
                const prevValue = get(prevState, subscription.path);
                
                if (deepEqual(newValue, prevValue)) {
                    return; // No change for this path
                }
                
                subscription.lastValue = newValue;
            }
            
            const promise = new Promise(resolve => {
                try {
                    const result = subscription.call(newState, prevState, changeInfo);
                    
                    if (result === 'remove') {
                        toRemove.push(id);
                    }
                    
                    this.stats.subscriptionCalls++;
                    resolve();
                } catch (error) {
                    this.logger.error(`Subscription ${id} error:`, error);
                    resolve();
                }
            });
            
            notificationPromises.push(promise);
        });
        
        await Promise.all(notificationPromises);
        
        // Remove one-time subscriptions
        toRemove.forEach(id => this._unsubscribe(id));
    }

    /**
     * Notify computed property change
     * @private
     */
    _notifyComputedChange(name, newValue) {
        // Emit computed property change event
        this._notifySubscribers(this.state, this.prevState, {
            type: 'computed',
            property: name,
            value: newValue
        });
    }

    /**
     * Unsubscribe a subscription
     * @private
     */
    _unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) return false;
        
        this.subscriptions.delete(subscriptionId);
        
        // Remove from path watchers if applicable
        if (subscription.type === SUBSCRIPTION_TYPES.PATH && subscription.path) {
            const watchers = this.pathWatchers.get(subscription.path);
            if (watchers) {
                watchers.delete(subscriptionId);
                if (watchers.size === 0) {
                    this.pathWatchers.delete(subscription.path);
                }
            }
        }
        
        this.logger.debug(`Subscription ${subscriptionId} removed`);
        return true;
    }

    /**
     * Merge state objects
     * @private
     */
    _mergeState(currentState, updates) {
        const newState = deepClone(currentState);
        
        Object.keys(updates).forEach(key => {
            if (updates[key] && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
                // Deep merge for objects
                newState[key] = this._mergeState(newState[key] || {}, updates[key]);
            } else {
                // Direct assignment for primitives and arrays
                newState[key] = updates[key];
            }
        });
        
        return newState;
    }

    /**
     * Load persisted state from localStorage
     * @private
     */
    _loadPersistedState() {
        try {
            const persistedData = localStorage.getItem(this.options.persistenceKey);
            if (persistedData) {
                const data = JSON.parse(persistedData);
                this.state = { ...this.state, ...data.state };
                this.logger.debug('Persisted state loaded');
            }
        } catch (error) {
            this.logger.error('Failed to load persisted state:', error);
        }
    }

    /**
     * Persist current state to localStorage
     * @private
     */
    _persistState() {
        try {
            const data = {
                state: this.state,
                timestamp: Date.now()
            };
            localStorage.setItem(this.options.persistenceKey, JSON.stringify(data));
        } catch (error) {
            this.logger.error('Failed to persist state:', error);
        }
    }
}