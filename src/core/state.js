/**
 * State Management System - Placeholder
 * This will be implemented in Prompt 5
 * @module core/state
 */

/**
 * State management class for reactive state updates
 * @class StateManager
 */
export class StateManager {
    /**
     * Create a new state manager
     * @param {Object} initialState - Initial state object
     * @param {boolean} debug - Enable debug mode
     */
    constructor(initialState = {}, debug = false) {
        this.state = { ...initialState };
        this.subscribers = [];
        this.debug = debug;
        this.history = [];
        this.maxHistory = 50;
    }

    /**
     * Get the current state
     * @returns {Object} Current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Update the state
     * @param {Object|Function} newState - New state or update function
     * @returns {StateManager} State manager instance for chaining
     */
    setState(newState) {
        const prevState = { ...this.state };
        
        if (typeof newState === 'function') {
            this.state = { ...this.state, ...newState(this.state) };
        } else {
            this.state = { ...this.state, ...newState };
        }
        
        // Store history
        this.history.push({ state: prevState, timestamp: Date.now() });
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        // Notify subscribers
        this._notifySubscribers(this.state, prevState);
        
        return this;
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        this.subscribers.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Watch a specific state path for changes
     * @param {string} path - State path to watch (dot notation)
     * @param {Function} callback - Callback function
     * @returns {Function} Unwatch function
     */
    watch(path, callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        const watcher = (newState, prevState) => {
            const newValue = this._getNestedValue(newState, path);
            const prevValue = this._getNestedValue(prevState, path);
            
            if (newValue !== prevValue) {
                callback(newValue, prevValue, path);
            }
        };
        
        return this.subscribe(watcher);
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
     * @returns {StateManager} State manager instance for chaining
     */
    clearHistory() {
        this.history = [];
        return this;
    }

    /**
     * Reset state to initial state
     * @returns {StateManager} State manager instance for chaining
     */
    reset() {
        this.state = {};
        this.history = [];
        this._notifySubscribers(this.state, {});
        return this;
    }

    /**
     * Destroy the state manager
     */
    destroy() {
        this.subscribers = [];
        this.history = [];
        this.state = {};
    }

    // Private methods

    /**
     * Notify all subscribers of state changes
     * @private
     * @param {Object} newState - New state
     * @param {Object} prevState - Previous state
     */
    _notifySubscribers(newState, prevState) {
        this.subscribers.forEach(callback => {
            try {
                callback(newState, prevState);
            } catch (error) {
                if (this.debug) {
                    console.error('State subscriber error:', error);
                }
            }
        });
    }

    /**
     * Get nested value from object using dot notation
     * @private
     * @param {Object} obj - Object to search
     * @param {string} path - Dot notation path
     * @returns {*} Found value or undefined
     */
    _getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
}