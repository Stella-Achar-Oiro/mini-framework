/**
 * Logger utility for debugging and monitoring
 */

export class Logger {
    constructor(debug = false) {
        this.debugEnabled = debug;
        this.prefix = '[MiniFramework]';
    }

    /**
     * Log info message
     */
    info(...args) {
        if (this.debugEnabled) {
            console.log(this.prefix, ...args);
        }
    }

    /**
     * Log debug message
     */
    debug(...args) {
        if (this.debugEnabled) {
            console.debug(this.prefix, ...args);
        }
    }

    /**
     * Log warning message
     */
    warn(...args) {
        console.warn(this.prefix, ...args);
    }

    /**
     * Log error message
     */
    error(...args) {
        console.error(this.prefix, ...args);
    }

    /**
     * Enable/disable debug mode
     */
    setDebug(enabled) {
        this.debugEnabled = enabled;
    }
}