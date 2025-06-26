/**
 * Common utility functions
 */

/**
 * Deep clone an object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = deepClone(obj[key]);
        });
        return cloned;
    }
}

/**
 * Deep merge objects
 */
export function deepMerge(target, source) {
    if (typeof target !== 'object' || typeof source !== 'object') {
        return source;
    }

    const result = { ...target };
    
    Object.keys(source).forEach(key => {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    });

    return result;
}

/**
 * Debounce function execution
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function execution
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Generate unique ID
 */
export function generateId() {
    return Math.random().toString(36).substring(2, 11);
}

/**
 * Check if value is empty
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Generate a more robust unique ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateUniqueId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 11);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Check if a value is a plain object
 * @param {*} value - Value to check
 * @returns {boolean} True if plain object
 */
export function isPlainObject(value) {
    return value !== null && 
           typeof value === 'object' && 
           value.constructor === Object;
}

/**
 * Flatten an array of arrays
 * @param {Array} arr - Array to flatten
 * @param {number} depth - Depth to flatten (default: 1)
 * @returns {Array} Flattened array
 */
export function flatten(arr, depth = 1) {
    if (depth === 0) return arr.slice();
    
    return arr.reduce((acc, val) => {
        if (Array.isArray(val)) {
            acc.push(...flatten(val, depth - 1));
        } else {
            acc.push(val);
        }
        return acc;
    }, []);
}

/**
 * Create a deep comparison between two values
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {boolean} True if deeply equal
 */
export function deepEqual(a, b) {
    if (a === b) return true;
    
    if (a == null || b == null) return a === b;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a !== 'object') return a === b;
    
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => deepEqual(item, b[index]));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
        keysB.includes(key) && deepEqual(a[key], b[key])
    );
}

/**
 * Pick specific properties from an object
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Keys to pick
 * @returns {Object} New object with picked properties
 */
export function pick(obj, keys) {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}

/**
 * Omit specific properties from an object
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Keys to omit
 * @returns {Object} New object without omitted properties
 */
export function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert camelCase to kebab-case
 * @param {string} str - String to convert
 * @returns {string} Kebab-case string
 */
export function camelToKebab(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 * @param {string} str - String to convert
 * @returns {string} CamelCase string
 */
export function kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Clamp a number between min and max values
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Generate a random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
export function random(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format a number with thousands separators
 * @param {number} num - Number to format
 * @param {string} separator - Thousands separator (default: ',')
 * @returns {string} Formatted number
 */
export function formatNumber(num, separator = ',') {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Get a nested property from an object using dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Found value or default
 */
export function get(obj, path, defaultValue) {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
        if (result == null || typeof result !== 'object') {
            return defaultValue;
        }
        result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
}

/**
 * Set a nested property in an object using dot notation
 * @param {Object} obj - Object to modify
 * @param {string} path - Dot notation path
 * @param {*} value - Value to set
 * @returns {Object} Modified object
 */
export function set(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let current = obj;
    for (const key of keys) {
        if (current[key] == null || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    
    current[lastKey] = value;
    return obj;
}

/**
 * Remove undefined values from an object
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
export function compact(obj) {
    const result = {};
    Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
            result[key] = obj[key];
        }
    });
    return result;
}

/**
 * Group array items by a key or function
 * @param {Array} array - Array to group
 * @param {string|Function} key - Key or function to group by
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
    }, {});
}

/**
 * Create a memoized version of a function
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Function to generate cache key
 * @returns {Function} Memoized function
 */
export function memoize(fn, keyFn = (...args) => JSON.stringify(args)) {
    const cache = new Map();
    
    return function memoized(...args) {
        const key = keyFn(...args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate a URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the delay
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Promise that resolves with the result or rejects
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (i === maxRetries) {
                throw lastError;
            }
            
            await sleep(delay * Math.pow(2, i));
        }
    }
}

/**
 * Convert bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Human readable size
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}