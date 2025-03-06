/**
 * Creates a client-side router
 * @param {Object} options - Router configuration options
 * @returns {Object} Router API
 */
function createRouter(options = {}) {
    // Default options
    const config = {
      mode: 'history', // or 'hash'
      base: '',
      notFoundHandler: () => console.error('Route not found'),
      ...options
    };
    
    // Store for routes
    const routes = [];
    
    // Current route state
    let currentRoute = null;
    let currentComponent = null;
    
    // Middleware pipeline
    const globalMiddleware = [];
    
    // Event callbacks
    const eventHandlers = {
      change: []
    };
    
    /**
     * Adds routes to the router
     * @param {Array|Object} routeConfig - Route configuration(s)
     */
    function addRoutes(routeConfig) {
      const routesToAdd = Array.isArray(routeConfig) ? routeConfig : [routeConfig];
      
      routesToAdd.forEach(route => {
        // Process nested routes
        if (route.children) {
          const children = route.children;
          delete route.children;
          
          // Add the parent route
          routes.push(route);
          
          // Process and add children
          children.forEach(child => {
            // Create full path for child
            child.path = route.path.endsWith('/') 
              ? `${route.path}${child.path}`.replace(/\/\//g, '/') 
              : `${route.path}/${child.path}`;
            
            // Inherit middleware from parent
            if (route.middleware && !child.middleware) {
              child.middleware = route.middleware;
            } else if (route.middleware && child.middleware) {
              child.middleware = [...route.middleware, ...child.middleware];
            }
            
            // Add the child route
            routes.push(child);
          });
        } else {
          routes.push(route);
        }
      });
    }
    
    /**
     * Registers global middleware
     * @param {Function} middleware - Middleware function
     */
    function use(middleware) {
      if (typeof middleware === 'function') {
        globalMiddleware.push(middleware);
      }
    }
    
    /**
     * Matches a path against available routes
     * @param {string} path - URL path to match
     * @returns {Object|null} Matched route info or null
     */
    function matchRoute(path) {
      // Normalize the path
      const normalizedPath = path.replace(/\/+$/, '') || '/';
      
      // Try to find a matching route
      for (const route of routes) {
        const params = {};
        const pattern = createRoutePattern(route.path);
        const match = normalizedPath.match(pattern);
        
        if (match) {
          // Extract named parameters
          if (route.path.includes(':')) {
            const paramNames = getParamNames(route.path);
            
            paramNames.forEach((name, index) => {
              params[name] = decodeURIComponent(match[index + 1] || '');
            });
          }
          
          return {
            route,
            params,
            query: extractQueryParams(window.location.search)
          };
        }
      }
      
      return null;
    }
    
    /**
     * Creates a regex pattern from a route path
     * @param {string} path - Route path with potential parameters
     * @returns {RegExp} Regular expression for matching
     */
    function createRoutePattern(path) {
      const pattern = path
        // Handle path parameters
        .replace(/:([^\\/]+)/g, '([^\\/]+)')
        // Make trailing slashes optional
        .replace(/\/$/, '/?')
        // Escape forward slashes
        .replace(/\//g, '\\/');
      
      return new RegExp(`^${pattern}$`);
    }
    
    /**
     * Gets parameter names from a route path
     * @param {string} path - Route path with parameters
     * @returns {Array} Array of parameter names
     */
    function getParamNames(path) {
      const paramNames = [];
      const paramRegex = /:([^\\/]+)/g;
      let match;
      
      while ((match = paramRegex.exec(path)) !== null) {
        paramNames.push(match[1]);
      }
      
      return paramNames;
    }
    
    /**
     * Extracts query parameters from a query string
     * @param {string} queryString - URL query string
     * @returns {Object} Query parameters object
     */
    function extractQueryParams(queryString) {
      const query = {};
      const searchParams = new URLSearchParams(queryString);
      
      for (const [key, value] of searchParams.entries()) {
        query[key] = value;
      }
      
      return query;
    }
    
    /**
     * Handles a route change
     * @param {string} path - Path to navigate to
     * @param {Object} state - State to pass to the route
     * @returns {Promise} Promise that resolves when navigation is complete
     */
    async function handleRouteChange(path, state = {}) {
      // Match the route
      const matchedRoute = matchRoute(path);
      
      if (!matchedRoute) {
        config.notFoundHandler(path);
        return false;
      }
      
      const { route, params, query } = matchedRoute;
      
      // Create the route context object
      const to = {
        path,
        params,
        query,
        state,
        route: route
      };
      
      const from = currentRoute;
      
      // Collect middleware to run
      const middlewareChain = [
        ...globalMiddleware,
        ...(route.middleware || [])
      ];
      
      // Run middleware chain
      let canProceed = true;
      
      for (const middleware of middlewareChain) {
        const result = await middleware(to, from);
        if (result === false) {
          canProceed = false;
          break;
        }
      }
      
      if (!canProceed) {
        // A middleware rejected the navigation
        return false;
      }
      
      // Update current route
      currentRoute = to;
      
      // Trigger change event
      triggerEvent('change', to, from);
      
      // Return the matched route info
      return to;
    }
    
    /**
     * Navigates to a specific path
     * @param {string} path - Path to navigate to
     * @param {Object} state - State to pass to history
     */
    function navigate(path, state = {}) {
      // Handle absolute vs relative paths
      const targetPath = path.startsWith('/') 
        ? path 
        : resolvePath(path, currentRoute ? currentRoute.path : '/');
      
      // Update browser history
      if (config.mode === 'history') {
        history.pushState(state, '', config.base + targetPath);
      } else {
        // Hash mode
        window.location.hash = targetPath;
      }
      
      // Handle the route change
      return handleRouteChange(targetPath, state);
    }
    
    /**
     * Resolves a relative path against a base path
     * @param {string} relativePath - Relative path
     * @param {string} basePath - Base path
     * @returns {string} Resolved absolute path
     */
    function resolvePath(relativePath, basePath) {
      // Handle parent directory navigation
      if (relativePath.startsWith('../')) {
        const baseSegments = basePath.split('/').filter(Boolean);
        baseSegments.pop(); // Remove the last segment
        const baseDir = '/' + baseSegments.join('/');
        return resolvePath(relativePath.substring(3), baseDir);
      }
      
      // Handle current directory reference
      if (relativePath.startsWith('./')) {
        relativePath = relativePath.substring(2);
      }
      
      // Handle absolute paths
      if (relativePath.startsWith('/')) {
        return relativePath;
      }
      
      // Handle empty relative path
      if (!relativePath) {
        return basePath;
      }
      
      // Join paths, ensuring one slash between segments
      return `${basePath.endsWith('/') ? basePath : basePath + '/'}${relativePath}`;
    }
    
    /**
     * Navigates back in history
     */
    function back() {
      history.back();
    }
    
    /**
     * Navigates forward in history
     */
    function forward() {
      history.forward();
    }
    
    /**
     * Replaces current history entry
     * @param {string} path - Path to navigate to
     * @param {Object} state - State to pass to history
     */
    function replace(path, state = {}) {
      const targetPath = path.startsWith('/') 
        ? path 
        : resolvePath(path, currentRoute ? currentRoute.path : '/');
      
      if (config.mode === 'history') {
        history.replaceState(state, '', config.base + targetPath);
      } else {
        window.location.hash = targetPath;
        window.history.replaceState(state, '', window.location.href);
      }
      
      return handleRouteChange(targetPath, state);
    }
    
    /**
     * Registers an event handler
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Function to remove the handler
     */
    function on(event, handler) {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      
      return () => {
        const index = eventHandlers[event].indexOf(handler);
        if (index !== -1) {
          eventHandlers[event].splice(index, 1);
        }
      };
    }
    
    /**
     * Triggers an event
     * @param {string} event - Event name
     * @param {...any} args - Event arguments
     */
    function triggerEvent(event, ...args) {
      if (eventHandlers[event]) {
        eventHandlers[event].forEach(handler => handler(...args));
      }
    }
    
    /**
     * Initializes the router
     */
    function init() {
      // Set up history event listeners
      if (config.mode === 'history') {
        window.addEventListener('popstate', () => {
          const path = window.location.pathname.replace(config.base, '');
          handleRouteChange(path, window.history.state);
        });
      } else {
        // Hash mode
        window.addEventListener('hashchange', () => {
          const path = window.location.hash.slice(1);
          handleRouteChange(path, window.history.state);
        });
      }
      
      // Handle initial route
      let initialPath;
      if (config.mode === 'history') {
        initialPath = window.location.pathname.replace(config.base, '');
      } else {
        initialPath = window.location.hash.slice(1) || '/';
      }
      
      // Trigger the initial route
      return handleRouteChange(initialPath, window.history.state);
    }
    
    // Return the public API
    return {
      addRoutes,
      use,
      navigate,
      back,
      forward,
      replace,
      on,
      init,
      matchRoute,
      getCurrentRoute: () => currentRoute
    };
  }
  
  // Create a route guard/middleware
  function createGuard(guardFn) {
    return async (to, from) => {
      try {
        return await guardFn(to, from);
      } catch (error) {
        console.error('Route guard error:', error);
        return false;
      }
    };
  }
  
  export { createRouter, createGuard };