/**
 * Configuration Management System
 * Handles framework configuration with validation and defaults
 */

import { deepMerge } from '../utils/helpers.js';

/**
 * Default framework configuration
 */
const DEFAULT_CONFIG = {
    // Core settings
    container: '#app',
    debug: false,
    strictMode: false,
    
    // State management
    state: {},
    autoRerender: true,
    rerenderDelay: 16, // ~60fps
    
    // Routing
    routes: {},
    routing: {
        mode: 'hash', // 'hash' or 'history'
        base: '/',
        fallback: true
    },
    
    // DOM settings
    dom: {
        escapeHtml: true,
        validateVNodes: true,
        optimizeUpdates: true
    },
    
    // Event settings
    events: {
        delegation: true,
        passive: true,
        capture: false
    },
    
    // Performance settings
    performance: {
        trackRenderTimes: true,
        maxRenderHistory: 100,
        warnSlowRenders: true,
        slowRenderThreshold: 16 // ms
    },
    
    // Plugin settings
    plugins: {},
    
    // Development settings
    development: {
        showWarnings: true,
        validateComponents: true,
        trackComponentUpdates: false
    }
};

/**
 * Configuration schema for validation
 */
const CONFIG_SCHEMA = {
    container: 'string',
    debug: 'boolean',
    strictMode: 'boolean',
    state: 'object',
    autoRerender: 'boolean',
    rerenderDelay: 'number',
    routes: 'object',
    routing: {
        mode: value => ['hash', 'history'].includes(value),
        base: 'string',
        fallback: 'boolean'
    },
    dom: {
        escapeHtml: 'boolean',
        validateVNodes: 'boolean',
        optimizeUpdates: 'boolean'
    },
    events: {
        delegation: 'boolean',
        passive: 'boolean',
        capture: 'boolean'
    },
    performance: {
        trackRenderTimes: 'boolean',
        maxRenderHistory: 'number',
        warnSlowRenders: 'boolean',
        slowRenderThreshold: 'number'
    },
    plugins: 'object',
    development: {
        showWarnings: 'boolean',
        validateComponents: 'boolean',
        trackComponentUpdates: 'boolean'
    }
};

/**
 * Configuration management class
 */
export class Config {
    /**
     * Create a new configuration instance
     * @param {Object} userConfig - User-provided configuration
     */
    constructor(userConfig = {}) {
        this.config = deepMerge(DEFAULT_CONFIG, userConfig);
        this.validators = new Map();
        this.watchers = new Map();
        
        // Set up built-in validators
        this._setupValidators();
        
        // Validate initial configuration
        this.validate();
    }

    /**
     * Get the current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Get a specific configuration value
     * @param {string} path - Configuration path (e.g., 'dom.escapeHtml')
     * @returns {*} Configuration value
     */
    get(path) {
        return this._getNestedValue(this.config, path);
    }

    /**
     * Set a configuration value
     * @param {string} path - Configuration path
     * @param {*} value - New value
     * @returns {Config} Config instance for chaining
     */
    set(path, value) {
        const oldValue = this.get(path);
        this._setNestedValue(this.config, path, value);
        
        // Validate the change
        this._validatePath(path, value);
        
        // Notify watchers
        this._notifyWatchers(path, value, oldValue);
        
        return this;
    }

    /**
     * Update configuration with new values
     * @param {Object} newConfig - New configuration values
     * @returns {Config} Config instance for chaining
     */
    update(newConfig) {
        const oldConfig = { ...this.config };
        this.config = deepMerge(this.config, newConfig);
        
        // Validate updated configuration
        this.validate();
        
        // Notify watchers of changes
        this._notifyConfigWatchers(oldConfig, this.config);
        
        return this;
    }

    /**
     * Reset configuration to defaults
     * @returns {Config} Config instance for chaining
     */
    reset() {
        this.config = { ...DEFAULT_CONFIG };
        return this;
    }

    /**
     * Validate the current configuration
     * @throws {Error} If configuration is invalid
     */
    validate() {
        this._validateObject(this.config, CONFIG_SCHEMA, '');
    }

    /**
     * Register a custom validator for a configuration path
     * @param {string} path - Configuration path
     * @param {Function} validator - Validator function
     * @returns {Config} Config instance for chaining
     */
    addValidator(path, validator) {
        if (typeof validator !== 'function') {
            throw new Error('Validator must be a function');
        }
        
        if (!this.validators.has(path)) {
            this.validators.set(path, []);
        }
        
        this.validators.get(path).push(validator);
        return this;
    }

    /**
     * Watch for configuration changes
     * @param {string} path - Configuration path to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unwatch function
     */
    watch(path, callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        if (!this.watchers.has(path)) {
            this.watchers.set(path, []);
        }
        
        this.watchers.get(path).push(callback);
        
        // Return unwatch function
        return () => {
            const watchers = this.watchers.get(path);
            if (watchers) {
                const index = watchers.indexOf(callback);
                if (index > -1) {
                    watchers.splice(index, 1);
                }
            }
        };
    }

    // Private methods

    /**
     * Set up built-in validators
     * @private
     */
    _setupValidators() {
        // Container validator
        this.addValidator('container', (value) => {
            if (typeof value === 'string' && value.trim().length === 0) {
                throw new Error('Container selector cannot be empty');
            }
        });

        // Rerender delay validator
        this.addValidator('rerenderDelay', (value) => {
            if (typeof value === 'number' && (value < 0 || value > 1000)) {
                throw new Error('Rerender delay must be between 0 and 1000ms');
            }
        });

        // Performance threshold validator
        this.addValidator('performance.slowRenderThreshold', (value) => {
            if (typeof value === 'number' && value < 1) {
                throw new Error('Slow render threshold must be at least 1ms');
            }
        });
    }

    /**
     * Validate an object against a schema
     * @private
     * @param {Object} obj - Object to validate
     * @param {Object} schema - Schema to validate against
     * @param {string} path - Current path for error reporting
     */
    _validateObject(obj, schema, path) {
        Object.keys(schema).forEach(key => {
            const fullPath = path ? `${path}.${key}` : key;
            const value = obj[key];
            const schemaValue = schema[key];
            
            if (value === undefined) return;
            
            if (typeof schemaValue === 'string') {
                // Type validation
                if (typeof value !== schemaValue) {
                    throw new Error(`Configuration ${fullPath} must be of type ${schemaValue}`);
                }
            } else if (typeof schemaValue === 'function') {
                // Custom validation function
                if (!schemaValue(value)) {
                    throw new Error(`Configuration ${fullPath} failed validation`);
                }
            } else if (typeof schemaValue === 'object') {
                // Nested object validation
                if (typeof value === 'object' && value !== null) {
                    this._validateObject(value, schemaValue, fullPath);
                }
            }
        });
    }

    /**
     * Validate a specific configuration path
     * @private
     * @param {string} path - Configuration path
     * @param {*} value - Value to validate
     */
    _validatePath(path, value) {
        // Run custom validators
        if (this.validators.has(path)) {
            this.validators.get(path).forEach(validator => {
                validator(value);
            });
        }
        
        // Run schema validation for the specific path
        const schemaValidator = this._getNestedValue(CONFIG_SCHEMA, path);
        if (schemaValidator) {
            if (typeof schemaValidator === 'string') {
                if (typeof value !== schemaValidator) {
                    throw new Error(`Configuration ${path} must be of type ${schemaValidator}`);
                }
            } else if (typeof schemaValidator === 'function') {
                if (!schemaValidator(value)) {
                    throw new Error(`Configuration ${path} failed validation`);
                }
            }
        }
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

    /**
     * Set nested value in object using dot notation
     * @private
     * @param {Object} obj - Object to modify
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     */
    _setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    /**
     * Notify watchers of configuration changes
     * @private
     * @param {string} path - Changed path
     * @param {*} newValue - New value
     * @param {*} oldValue - Old value
     */
    _notifyWatchers(path, newValue, oldValue) {
        if (this.watchers.has(path)) {
            this.watchers.get(path).forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error(`Configuration watcher failed for ${path}:`, error);
                }
            });
        }
    }

    /**
     * Notify watchers of bulk configuration changes
     * @private
     * @param {Object} oldConfig - Old configuration
     * @param {Object} newConfig - New configuration
     */
    _notifyConfigWatchers(oldConfig, newConfig) {
        this.watchers.forEach((callbacks, path) => {
            const oldValue = this._getNestedValue(oldConfig, path);
            const newValue = this._getNestedValue(newConfig, path);
            
            if (oldValue !== newValue) {
                callbacks.forEach(callback => {
                    try {
                        callback(newValue, oldValue, path);
                    } catch (error) {
                        console.error(`Configuration watcher failed for ${path}:`, error);
                    }
                });
            }
        });
    }
}