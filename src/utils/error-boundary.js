/**
 * Error Boundary System
 * Provides robust error handling and recovery mechanisms
 */

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
    RENDER: 'render',
    STATE: 'state',
    ROUTING: 'routing',
    COMPONENT: 'component',
    PLUGIN: 'plugin',
    SYSTEM: 'system',
    USER: 'user'
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Error boundary class for handling and recovering from errors
 */
export class ErrorBoundary {
    /**
     * Create a new error boundary
     * @param {boolean} debug - Enable debug mode
     * @param {Object} options - Error boundary options
     */
    constructor(debug = false, options = {}) {
        this.debug = debug;
        this.options = {
            maxRetries: 3,
            retryDelay: 1000,
            enableRecovery: true,
            logErrors: true,
            showErrorUI: false,
            ...options
        };
        
        this.errors = [];
        this.retryCount = new Map();
        this.errorHandlers = new Map();
        this.recoveryStrategies = new Map();
        
        // Set up default error handlers
        this._setupDefaultHandlers();
        
        // Set up global error handling
        this._setupGlobalHandlers();
    }

    /**
     * Wrap a function with error boundary
     * @param {Function} fn - Function to wrap
     * @param {string} context - Error context for debugging
     * @param {string} type - Error type
     * @returns {*} Function result or error fallback
     */
    wrap(fn, context = 'Unknown', type = ERROR_TYPES.SYSTEM) {
        try {
            return fn();
        } catch (error) {
            return this.handleError(context, error, type);
        }
    }

    /**
     * Wrap an async function with error boundary
     * @param {Function} fn - Async function to wrap
     * @param {string} context - Error context for debugging
     * @param {string} type - Error type
     * @returns {Promise} Promise result or error fallback
     */
    async wrapAsync(fn, context = 'Unknown', type = ERROR_TYPES.SYSTEM) {
        try {
            return await fn();
        } catch (error) {
            return this.handleError(context, error, type);
        }
    }

    /**
     * Handle an error with recovery strategies
     * @param {string} context - Error context
     * @param {Error} error - The error that occurred
     * @param {string} type - Error type
     * @param {string} severity - Error severity
     * @returns {*} Recovery result or null
     */
    handleError(context, error, type = ERROR_TYPES.SYSTEM, severity = ERROR_SEVERITY.MEDIUM) {
        const errorInfo = {
            context,
            error,
            type,
            severity,
            timestamp: Date.now(),
            stack: error.stack,
            message: error.message,
            id: this._generateErrorId()
        };

        // Log the error
        this._logError(errorInfo);
        
        // Store error for analysis
        this.errors.push(errorInfo);
        
        // Keep only last 100 errors
        if (this.errors.length > 100) {
            this.errors.shift();
        }

        // Try to recover from the error
        if (this.options.enableRecovery) {
            return this._attemptRecovery(errorInfo);
        }

        // If recovery is disabled, just log and re-throw for critical errors
        if (severity === ERROR_SEVERITY.CRITICAL) {
            throw error;
        }

        return null;
    }

    /**
     * Register a custom error handler
     * @param {string} type - Error type to handle
     * @param {Function} handler - Error handler function
     * @returns {ErrorBoundary} Error boundary instance for chaining
     */
    onError(type, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Error handler must be a function');
        }
        
        if (!this.errorHandlers.has(type)) {
            this.errorHandlers.set(type, []);
        }
        
        this.errorHandlers.get(type).push(handler);
        return this;
    }

    /**
     * Register a recovery strategy for an error type
     * @param {string} type - Error type
     * @param {Function} strategy - Recovery strategy function
     * @returns {ErrorBoundary} Error boundary instance for chaining
     */
    addRecoveryStrategy(type, strategy) {
        if (typeof strategy !== 'function') {
            throw new Error('Recovery strategy must be a function');
        }
        
        this.recoveryStrategies.set(type, strategy);
        return this;
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            bySeverity: {},
            recent: this.errors.slice(-10),
            mostCommon: null
        };

        // Count by type and severity
        this.errors.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });

        // Find most common error type
        const mostCommonType = Object.keys(stats.byType)
            .reduce((a, b) => stats.byType[a] > stats.byType[b] ? a : b, null);
        
        if (mostCommonType) {
            stats.mostCommon = {
                type: mostCommonType,
                count: stats.byType[mostCommonType]
            };
        }

        return stats;
    }

    /**
     * Clear error history
     * @returns {ErrorBoundary} Error boundary instance for chaining
     */
    clearErrors() {
        this.errors = [];
        this.retryCount.clear();
        return this;
    }

    /**
     * Check if framework is in a healthy state
     * @returns {boolean} True if healthy
     */
    isHealthy() {
        const recentErrors = this.errors.filter(
            error => Date.now() - error.timestamp < 60000 // Last minute
        );
        
        const criticalErrors = recentErrors.filter(
            error => error.severity === ERROR_SEVERITY.CRITICAL
        );
        
        // Unhealthy if more than 5 errors in the last minute or any critical errors
        return recentErrors.length <= 5 && criticalErrors.length === 0;
    }

    // Private methods

    /**
     * Set up default error handlers
     * @private
     */
    _setupDefaultHandlers() {
        // Render error handler
        this.onError(ERROR_TYPES.RENDER, (errorInfo) => {
            if (this.debug) {
                console.error(`Render error in ${errorInfo.context}:`, errorInfo.error);
            }
            
            // Try to render error fallback
            return this._createErrorFallback(errorInfo);
        });

        // State error handler
        this.onError(ERROR_TYPES.STATE, (errorInfo) => {
            if (this.debug) {
                console.error(`State error in ${errorInfo.context}:`, errorInfo.error);
            }
        });

        // Component error handler
        this.onError(ERROR_TYPES.COMPONENT, (errorInfo) => {
            if (this.debug) {
                console.error(`Component error in ${errorInfo.context}:`, errorInfo.error);
            }
        });
    }

    /**
     * Set up global error handlers
     * @private
     */
    _setupGlobalHandlers() {
        if (typeof window !== 'undefined') {
            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError(
                    'Unhandled Promise Rejection',
                    new Error(event.reason),
                    ERROR_TYPES.SYSTEM,
                    ERROR_SEVERITY.HIGH
                );
            });

            // Handle uncaught errors
            window.addEventListener('error', (event) => {
                this.handleError(
                    'Uncaught Error',
                    event.error || new Error(event.message),
                    ERROR_TYPES.SYSTEM,
                    ERROR_SEVERITY.HIGH
                );
            });
        }
    }

    /**
     * Attempt to recover from an error
     * @private
     * @param {Object} errorInfo - Error information
     * @returns {*} Recovery result or null
     */
    _attemptRecovery(errorInfo) {
        const { context, type } = errorInfo;
        
        // Check retry limit
        const retryKey = `${context}-${type}`;
        const currentRetries = this.retryCount.get(retryKey) || 0;
        
        if (currentRetries >= this.options.maxRetries) {
            if (this.debug) {
                console.warn(`Max retries exceeded for ${context}`);
            }
            return null;
        }

        // Increment retry count
        this.retryCount.set(retryKey, currentRetries + 1);

        // Call custom error handlers
        if (this.errorHandlers.has(type)) {
            const handlers = this.errorHandlers.get(type);
            for (const handler of handlers) {
                try {
                    const result = handler(errorInfo);
                    if (result !== undefined) {
                        return result;
                    }
                } catch (handlerError) {
                    if (this.debug) {
                        console.error('Error handler failed:', handlerError);
                    }
                }
            }
        }

        // Try recovery strategy
        if (this.recoveryStrategies.has(type)) {
            try {
                return this.recoveryStrategies.get(type)(errorInfo);
            } catch (recoveryError) {
                if (this.debug) {
                    console.error('Recovery strategy failed:', recoveryError);
                }
            }
        }

        return null;
    }

    /**
     * Log an error based on configuration
     * @private
     * @param {Object} errorInfo - Error information
     */
    _logError(errorInfo) {
        if (!this.options.logErrors) return;

        const { context, error, type, severity } = errorInfo;
        
        if (this.debug || severity === ERROR_SEVERITY.CRITICAL) {
            console.group(`🚨 Error in ${context}`);
            console.error('Type:', type);
            console.error('Severity:', severity);
            console.error('Error:', error);
            console.error('Stack:', error.stack);
            console.groupEnd();
        }
    }

    /**
     * Create error fallback content
     * @private
     * @param {Object} errorInfo - Error information
     * @returns {Object} Error fallback vnode
     */
    _createErrorFallback(errorInfo) {
        return {
            tag: 'div',
            attrs: {
                class: 'mini-framework-error',
                style: 'padding: 20px; border: 2px solid #ff6b6b; background: #ffe0e0; color: #d63031; border-radius: 4px;'
            },
            children: [
                {
                    tag: 'h3',
                    children: ['⚠️ Something went wrong']
                },
                this.debug ? {
                    tag: 'details',
                    children: [
                        { tag: 'summary', children: ['Error Details'] },
                        { tag: 'p', children: [`Context: ${errorInfo.context}`] },
                        { tag: 'p', children: [`Type: ${errorInfo.type}`] },
                        { tag: 'p', children: [`Message: ${errorInfo.error.message}`] }
                    ]
                } : {
                    tag: 'p',
                    children: ['Please try refreshing the page.']
                }
            ]
        };
    }

    /**
     * Generate unique error ID
     * @private
     * @returns {string} Unique error ID
     */
    _generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}