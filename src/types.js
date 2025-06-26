/**
 * Type definitions and constants
 * For better code organization and documentation
 */

/**
 * Virtual Node structure
 * @typedef {Object} VNode
 * @property {string} tag - HTML tag name
 * @property {Object} attrs - Element attributes
 * @property {Array<VNode|string>} children - Child elements
 * @property {Object} events - Event handlers
 */

/**
 * Component definition
 * @typedef {Function|Object} Component
 */

/**
 * Router route definition
 * @typedef {Object} Route
 * @property {string} path - Route path pattern
 * @property {Function} handler - Route handler function
 */

// Export for JSDoc usage
export const Types = {};