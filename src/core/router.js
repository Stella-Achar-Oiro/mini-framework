/**
 * Advanced Routing System
 * Flexible client-side routing with history API, hash routing, and route guards
 * @module core/router
 */

import { EventManager } from './dom-events.js';
import { Logger } from '../utils/logger.js';
import { ErrorBoundary, ERROR_TYPES } from '../utils/error-boundary.js';
import { generateUniqueId, deepClone } from '../utils/helpers.js';
import { RouteTransition, LazyRouteLoader, TRANSITION_TYPES } from './route-transitions.js';

/**
 * Route matching types
 */
const ROUTE_TYPES = {
    EXACT: 'exact',
    WILDCARD: 'wildcard',
    PARAMETER: 'parameter',
    REGEX: 'regex'
};

/**
 * Navigation modes
 */
const NAVIGATION_MODES = {
    HISTORY: 'history',
    HASH: 'hash'
};

/**
 * Route transition phases
 */
const TRANSITION_PHASES = {
    BEFORE_LEAVE: 'beforeLeave',
    LEAVING: 'leaving',
    LEFT: 'left',
    BEFORE_ENTER: 'beforeEnter',
    ENTERING: 'entering',
    ENTERED: 'entered'
};

/**
 * Route configuration class
 */
class Route {
    constructor(path, component, options = {}) {
        this.id = generateUniqueId('route');
        this.path = path;
        this.component = component;
        this.name = options.name || null;
        this.meta = options.meta || {};
        this.guards = options.guards || [];
        this.children = options.children || [];
        this.lazy = options.lazy || false;
        this.cache = options.cache !== false;
        this.transition = options.transition || null;
        this.middleware = options.middleware || [];
        
        // Compile route pattern
        this.pattern = this._compilePattern(path);
        this.keys = [];
        this.regex = this._pathToRegex(path);
    }

    /**
     * Check if this route matches a given path
     */
    match(path) {
        const match = this.regex.exec(path);
        if (!match) return null;

        const params = {};
        this.keys.forEach((key, index) => {
            params[key.name] = match[index + 1];
        });

        return {
            route: this,
            params,
            path,
            matched: match[0]
        };
    }

    /**
     * Compile route pattern for parameter extraction
     * @private
     */
    _compilePattern(path) {
        return {
            type: this._getRouteType(path),
            original: path,
            segments: path.split('/').filter(Boolean)
        };
    }

    /**
     * Convert path pattern to regex
     * @private
     */
    _pathToRegex(path) {
        this.keys = [];
        
        // Handle exact matches first
        if (!path.includes(':') && !path.includes('*') && !path.includes('(')) {
            return new RegExp(`^${path.replace(/\//g, '\\/')}$`);
        }

        // Convert parameter patterns (:param) to regex groups
        let pattern = path.replace(/\//g, '\\/');
        
        // Handle named parameters (:param)
        pattern = pattern.replace(/:(\w+)/g, (match, name) => {
            this.keys.push({ name, optional: false });
            return '([^/]+)';
        });

        // Handle optional parameters (:param?)
        pattern = pattern.replace(/:(\w+)\?/g, (match, name) => {
            this.keys.push({ name, optional: true });
            return '([^/]*)?';
        });

        // Handle wildcards (*)
        pattern = pattern.replace(/\*/g, '(.*)');

        return new RegExp(`^${pattern}$`);
    }

    /**
     * Determine route type
     * @private
     */
    _getRouteType(path) {
        if (path.includes('*')) return ROUTE_TYPES.WILDCARD;
        if (path.includes(':')) return ROUTE_TYPES.PARAMETER;
        if (path.includes('(') || path.includes('[')) return ROUTE_TYPES.REGEX;
        return ROUTE_TYPES.EXACT;
    }
}

/**
 * Route guard class
 */
class RouteGuard {
    constructor(guard, options = {}) {
        this.guard = guard;
        this.name = options.name || 'anonymous';
        this.global = options.global || false;
        this.priority = options.priority || 0;
    }

    async execute(to, from, next) {
        try {
            return await this.guard(to, from, next);
        } catch (error) {
            console.error(`Route guard ${this.name} error:`, error);
            return false;
        }
    }
}

/**
 * Navigation history entry
 */
class HistoryEntry {
    constructor(route, params, query, meta = {}) {
        this.id = generateUniqueId('history');
        this.route = route;
        this.params = params || {};
        this.query = query || {};
        this.meta = meta;
        this.timestamp = Date.now();
        this.fullPath = this._buildFullPath();
    }

    _buildFullPath() {
        let path = this.route.path;
        
        // Replace parameters
        Object.entries(this.params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, value);
        });

        // Add query string
        const queryString = new URLSearchParams(this.query).toString();
        return queryString ? `${path}?${queryString}` : path;
    }
}

/**
 * Advanced Router class
 */
export class Router {
    constructor(options = {}) {
        this.options = {
            mode: NAVIGATION_MODES.HISTORY,
            base: '',
            hashPrefix: '#',
            fallback: '/',
            caseSensitive: false,
            enableTransitions: true,
            enableGuards: true,
            enableMiddleware: true,
            maxHistory: 50,
            debug: false,
            ...options
        };

        this.logger = new Logger(this.options.debug);
        this.errorBoundary = new ErrorBoundary(this.options.debug);
        this.events = new EventManager({ debug: this.options.debug });

        // Initialize transition system
        this.transition = new RouteTransition({
            type: this.options.transition?.type || TRANSITION_TYPES.FADE,
            duration: this.options.transition?.duration || 300,
            debug: this.options.debug
        });

        // Initialize lazy loader
        this.lazyLoader = new LazyRouteLoader({
            timeout: this.options.lazyTimeout || 30000,
            cache: this.options.lazyCache !== false,
            debug: this.options.debug
        });

        // Route storage
        this.routes = new Map();
        this.namedRoutes = new Map();
        this.globalGuards = [];
        this.globalMiddleware = [];

        // Navigation state
        this.currentRoute = null;
        this.previousRoute = null;
        this.history = [];
        this.historyIndex = -1;
        this.isNavigating = false;

        // Browser integration
        this.supportsHistory = window.history && window.history.pushState;
        this.currentMode = this.options.mode;
        
        // Fallback to hash mode if history API not supported
        if (!this.supportsHistory && this.currentMode === NAVIGATION_MODES.HISTORY) {
            this.currentMode = NAVIGATION_MODES.HASH;
            this.logger.warn('History API not supported, falling back to hash mode');
        }

        // Performance tracking
        this.stats = {
            navigations: 0,
            totalNavigationTime: 0,
            averageNavigationTime: 0,
            guardsExecuted: 0,
            middlewareExecuted: 0
        };

        this.logger.debug('Router initialized', this.options);
    }

    /**
     * Initialize the router
     */
    init() {
        this._setupEventListeners();
        
        // Setup transition CSS
        if (this.options.enableTransitions) {
            this.transition.createTransitionClasses();
        }
        
        this._handleInitialRoute();
        this.logger.debug('Router started');
        return this;
    }

    /**
     * Register a route
     */
    route(path, component, options = {}) {
        const route = new Route(path, component, options);
        
        this.routes.set(path, route);
        
        if (route.name) {
            this.namedRoutes.set(route.name, route);
        }

        // Register nested routes
        if (route.children.length > 0) {
            route.children.forEach(child => {
                const childPath = this._combinePaths(path, child.path);
                this.route(childPath, child.component, {
                    ...child,
                    parent: route
                });
            });
        }

        this.logger.debug(`Route registered: ${path}`, route);
        return this;
    }

    /**
     * Navigate to a path
     */
    async navigate(to, options = {}) {
        if (this.isNavigating && !options.force) {
            this.logger.warn('Navigation already in progress');
            return false;
        }

        const startTime = performance.now();
        this.isNavigating = true;

        try {
            // Parse navigation target
            const navigation = this._parseNavigation(to);
            const route = this._matchRoute(navigation.path);

            if (!route) {
                throw new Error(`No route found for path: ${navigation.path}`);
            }

            // Create route objects
            const fromRoute = this.currentRoute;
            const toRoute = {
                ...route,
                params: { ...route.params, ...navigation.params },
                query: { ...navigation.query },
                hash: navigation.hash,
                fullPath: navigation.fullPath
            };

            // Execute guards
            if (this.options.enableGuards) {
                const guardResult = await this._executeGuards(toRoute, fromRoute);
                if (!guardResult) {
                    this.isNavigating = false;
                    return false;
                }
            }

            // Execute middleware
            if (this.options.enableMiddleware) {
                await this._executeMiddleware(toRoute, fromRoute);
            }

            // Perform navigation
            await this._performNavigation(toRoute, fromRoute, options);

            // Update browser URL
            this._updateUrl(toRoute.fullPath, options);

            // Add to history
            this._addToHistory(toRoute);

            // Update current route
            this.previousRoute = fromRoute;
            this.currentRoute = toRoute;

            // Emit navigation event
            this.events.emit(window, 'navigate', {
                to: toRoute,
                from: fromRoute
            });

            // Update stats
            const navigationTime = performance.now() - startTime;
            this.stats.navigations++;
            this.stats.totalNavigationTime += navigationTime;
            this.stats.averageNavigationTime = this.stats.totalNavigationTime / this.stats.navigations;

            this.logger.debug(`Navigation completed in ${navigationTime.toFixed(2)}ms`, toRoute);
            return true;

        } catch (error) {
            this.errorBoundary.handleError('Navigation failed', error, ERROR_TYPES.ROUTER);
            return false;
        } finally {
            this.isNavigating = false;
        }
    }

    /**
     * Navigate by route name
     */
    async navigateByName(name, params = {}, query = {}) {
        const route = this.namedRoutes.get(name);
        if (!route) {
            throw new Error(`Named route not found: ${name}`);
        }

        let path = route.path;
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, value);
        });

        const queryString = new URLSearchParams(query).toString();
        const fullPath = queryString ? `${path}?${queryString}` : path;

        return this.navigate(fullPath);
    }

    /**
     * Go back in history
     */
    async back() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const entry = this.history[this.historyIndex];
            return this.navigate(entry.fullPath, { replace: true });
        }
        return false;
    }

    /**
     * Go forward in history
     */
    async forward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const entry = this.history[this.historyIndex];
            return this.navigate(entry.fullPath, { replace: true });
        }
        return false;
    }

    /**
     * Replace current route
     */
    async replace(to) {
        return this.navigate(to, { replace: true });
    }

    /**
     * Add global route guard
     */
    addGuard(guard, options = {}) {
        const routeGuard = new RouteGuard(guard, { ...options, global: true });
        this.globalGuards.push(routeGuard);
        
        // Sort by priority
        this.globalGuards.sort((a, b) => b.priority - a.priority);
        
        this.logger.debug(`Global guard added: ${routeGuard.name}`);
        return () => this.removeGuard(routeGuard);
    }

    /**
     * Remove global route guard
     */
    removeGuard(guard) {
        const index = this.globalGuards.indexOf(guard);
        if (index > -1) {
            this.globalGuards.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Add global middleware
     */
    use(middleware, options = {}) {
        this.globalMiddleware.push({
            middleware,
            name: options.name || 'anonymous',
            priority: options.priority || 0
        });

        // Sort by priority
        this.globalMiddleware.sort((a, b) => b.priority - a.priority);
        
        this.logger.debug(`Global middleware added: ${options.name || 'anonymous'}`);
        return this;
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute ? deepClone(this.currentRoute) : null;
    }

    /**
     * Get route by name
     */
    getRoute(name) {
        return this.namedRoutes.get(name);
    }

    /**
     * Get router stats
     */
    getStats() {
        return {
            ...this.stats,
            totalRoutes: this.routes.size,
            namedRoutes: this.namedRoutes.size,
            globalGuards: this.globalGuards.length,
            globalMiddleware: this.globalMiddleware.length,
            historySize: this.history.length,
            currentHistoryIndex: this.historyIndex
        };
    }

    /**
     * Check if a path matches current route
     */
    isActive(path) {
        if (!this.currentRoute) return false;
        return this.currentRoute.route.path === path;
    }

    /**
     * Generate URL for route
     */
    url(path, params = {}, query = {}) {
        let url = path;
        
        // Replace parameters
        Object.entries(params).forEach(([key, value]) => {
            url = url.replace(`:${key}`, value);
        });

        // Add query string
        const queryString = new URLSearchParams(query).toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        // Add base and hash prefix
        if (this.currentMode === NAVIGATION_MODES.HASH) {
            url = `${this.options.hashPrefix}${url}`;
        }

        return this.options.base + url;
    }

    /**
     * Preload route components
     */
    async preloadRoutes(routePaths = []) {
        const routesToPreload = routePaths.length > 0 
            ? routePaths.map(path => this.routes.get(path)).filter(Boolean)
            : Array.from(this.routes.values()).filter(route => route.lazy);

        return this.lazyLoader.preloadRoutes(routesToPreload);
    }

    /**
     * Get lazy loader statistics
     */
    getLazyStats() {
        return this.lazyLoader.getStats();
    }

    /**
     * Clear lazy route cache
     */
    clearLazyCache() {
        return this.lazyLoader.clearCache();
    }

    /**
     * Destroy the router
     */
    destroy() {
        this._removeEventListeners();
        this.routes.clear();
        this.namedRoutes.clear();
        this.globalGuards = [];
        this.globalMiddleware = [];
        this.history = [];
        this.currentRoute = null;
        this.previousRoute = null;
        this.events.destroy();
        this.lazyLoader.clearCache();
        this.logger.debug('Router destroyed');
    }

    // Private methods

    /**
     * Setup event listeners for navigation
     * @private
     */
    _setupEventListeners() {
        if (this.currentMode === NAVIGATION_MODES.HISTORY) {
            window.addEventListener('popstate', this._handlePopState.bind(this));
        } else {
            window.addEventListener('hashchange', this._handleHashChange.bind(this));
        }

        // Handle link clicks
        document.addEventListener('click', this._handleLinkClick.bind(this));
    }

    /**
     * Remove event listeners
     * @private
     */
    _removeEventListeners() {
        if (this.currentMode === NAVIGATION_MODES.HISTORY) {
            window.removeEventListener('popstate', this._handlePopState.bind(this));
        } else {
            window.removeEventListener('hashchange', this._handleHashChange.bind(this));
        }

        document.removeEventListener('click', this._handleLinkClick.bind(this));
    }

    /**
     * Handle initial route on startup
     * @private
     */
    _handleInitialRoute() {
        const path = this._getCurrentPath();
        this.navigate(path, { replace: true });
    }

    /**
     * Handle popstate events (history mode)
     * @private
     */
    _handlePopState(event) {
        const path = this._getCurrentPath();
        this.navigate(path, { replace: true });
    }

    /**
     * Handle hashchange events (hash mode)
     * @private
     */
    _handleHashChange() {
        const path = this._getCurrentPath();
        this.navigate(path, { replace: true });
    }

    /**
     * Handle link clicks for automatic navigation
     * @private
     */
    _handleLinkClick(event) {
        const link = event.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        
        // Skip external links
        if (href.startsWith('http') || href.startsWith('//')) return;
        
        // Skip if has target
        if (link.getAttribute('target')) return;
        
        // Skip if download attribute
        if (link.hasAttribute('download')) return;
        
        // Skip if ctrl/cmd/shift click
        if (event.ctrlKey || event.metaKey || event.shiftKey) return;

        event.preventDefault();
        this.navigate(href);
    }

    /**
     * Get current path from URL
     * @private
     */
    _getCurrentPath() {
        if (this.currentMode === NAVIGATION_MODES.HISTORY) {
            return window.location.pathname + window.location.search + window.location.hash;
        } else {
            return window.location.hash.replace(this.options.hashPrefix, '') || '/';
        }
    }

    /**
     * Parse navigation target
     * @private
     */
    _parseNavigation(to) {
        if (typeof to === 'string') {
            const [pathAndQuery, hash] = to.split('#');
            const [path, queryString] = pathAndQuery.split('?');
            const query = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};
            
            return {
                path: path || '/',
                query,
                hash: hash || '',
                params: {},
                fullPath: to
            };
        }

        // Object navigation
        return {
            path: to.path || '/',
            query: to.query || {},
            hash: to.hash || '',
            params: to.params || {},
            fullPath: to.path || '/'
        };
    }

    /**
     * Match route for given path
     * @private
     */
    _matchRoute(path) {
        for (const route of this.routes.values()) {
            const match = route.match(path);
            if (match) {
                return match;
            }
        }
        return null;
    }

    /**
     * Execute route guards
     * @private
     */
    async _executeGuards(to, from) {
        const guards = [
            ...this.globalGuards,
            ...(to.route.guards || [])
        ];

        for (const guard of guards) {
            const result = await guard.execute(to, from, (path) => {
                if (path === false) return false;
                if (path) this.navigate(path);
                return true;
            });

            this.stats.guardsExecuted++;

            if (result === false) {
                this.logger.debug(`Navigation blocked by guard: ${guard.name}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Execute middleware
     * @private
     */
    async _executeMiddleware(to, from) {
        const middleware = [
            ...this.globalMiddleware,
            ...(to.route.middleware || [])
        ];

        for (const mw of middleware) {
            try {
                await mw.middleware(to, from);
                this.stats.middlewareExecuted++;
            } catch (error) {
                this.logger.error(`Middleware error: ${mw.name}`, error);
            }
        }
    }

    /**
     * Perform the actual navigation
     * @private
     */
    async _performNavigation(to, from, options) {
        try {
            // Load component if lazy
            if (to.route.lazy && typeof to.route.component === 'function') {
                this.logger.debug(`Lazy loading route component: ${to.route.path}`);
                to.route.component = await this.lazyLoader.loadRoute(to.route);
            }

            // Get current and new route elements (this would be integrated with framework rendering)
            const fromElement = options.fromElement || null;
            const toElement = options.toElement || null;

            // Perform transition if enabled
            if (this.options.enableTransitions && !options.skipTransition) {
                await this.transition.transition(fromElement, toElement, from, to);
            }

            // Emit events for integration with framework rendering
            this.events.emit(window, 'routeComponentLoaded', {
                route: to,
                component: to.route.component
            });

            this.logger.debug('Navigation performed successfully', { to, from });
        } catch (error) {
            this.logger.error('Navigation performance failed:', error);
            throw error;
        }
    }

    /**
     * Update browser URL
     * @private
     */
    _updateUrl(path, options = {}) {
        if (this.currentMode === NAVIGATION_MODES.HISTORY) {
            if (options.replace) {
                window.history.replaceState(null, '', this.options.base + path);
            } else {
                window.history.pushState(null, '', this.options.base + path);
            }
        } else {
            if (options.replace) {
                window.location.replace(`${this.options.hashPrefix}${path}`);
            } else {
                window.location.hash = path;
            }
        }
    }

    /**
     * Add entry to navigation history
     * @private
     */
    _addToHistory(route) {
        // Remove future entries if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        const entry = new HistoryEntry(route.route, route.params, route.query);
        this.history.push(entry);
        this.historyIndex = this.history.length - 1;

        // Limit history size
        if (this.history.length > this.options.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    /**
     * Combine parent and child paths
     * @private
     */
    _combinePaths(parent, child) {
        const cleanParent = parent.endsWith('/') ? parent.slice(0, -1) : parent;
        const cleanChild = child.startsWith('/') ? child.slice(1) : child;
        return cleanChild ? `${cleanParent}/${cleanChild}` : cleanParent;
    }
}