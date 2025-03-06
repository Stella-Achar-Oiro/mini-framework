/**
 * Creates a centralized state store
 * @param {Object} initialState - Initial state object
 * @returns {Object} Store API
 */
function createStore(initialState = {}) {
    // The current state (private)
    let state = { ...initialState };
    
    // Computed values cache
    const computedCache = new Map();
    
    // Subscribers
    // Format: { id: string, selector: Function, callback: Function, dependencies: Array }
    const subscribers = [];
    let nextSubscriberId = 1;
    
    // Batching state updates
    let isDispatching = false;
    let pendingChanges = false;
    let batchTimeoutId = null;
    
    /**
     * Gets the current state or a slice of it
     * @param {Function} selector - Optional selector function
     * @returns {any} Selected state
     */
    function getState(selector) {
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    }
    
    /**
     * Creates a computed value based on state
     * @param {Function} computeFn - Function to compute the value
     * @param {Array} dependencies - Array of state paths this depends on
     * @returns {Function} Function that returns the computed value
     */
    function computed(computeFn, dependencies = []) {
      const computedId = nextSubscriberId++;
      
      // Initialize cache entry
      if (!computedCache.has(computedId)) {
        computedCache.set(computedId, {
          value: computeFn(state),
          dirty: false,
          dependencies
        });
      }
      
      // Add a pseudo-subscriber for this computed value to track changes
      subscribers.push({
        id: `computed-${computedId}`,
        selector: state => dependencies.some(dep => getNestedValue(state, dep)),
        callback: () => {
          const cacheEntry = computedCache.get(computedId);
          cacheEntry.dirty = true;
        },
        dependencies
      });
      
      // Return a function that returns the computed value
      return () => {
        const cacheEntry = computedCache.get(computedId);
        
        // Recompute if dirty
        if (cacheEntry.dirty) {
          cacheEntry.value = computeFn(state);
          cacheEntry.dirty = false;
        }
        
        return cacheEntry.value;
      };
    }
    
    /**
     * Updates the state and notifies subscribers
     * @param {Object|Function} updater - New state object or updater function
     */
    function setState(updater) {
      if (isDispatching) {
        // We're already dispatching, so queue this update
        pendingChanges = true;
        const prevState = { ...state };
        
        // Apply the update
        if (typeof updater === 'function') {
          state = { ...updater(state) };
        } else {
          state = { ...state, ...updater };
        }
        
        // Schedule notification when the current dispatch finishes
        return;
      }
      
      isDispatching = true;
      const prevState = { ...state };
      
      // Apply the update
      if (typeof updater === 'function') {
        state = { ...updater(state) };
      } else {
        state = { ...state, ...updater };
      }
      
      // Determine which subscribers to notify
      const notifyList = subscribers.filter(subscriber => {
        // If no selector, always notify
        if (!subscriber.selector) return true;
        
        // Check if the selected state changed
        const prevSelectedState = subscriber.selector(prevState);
        const newSelectedState = subscriber.selector(state);
        
        return !shallowEqual(prevSelectedState, newSelectedState);
      });
      
      // Notify relevant subscribers
      isDispatching = false;
      
      // If we had nested updates, recursively process them
      if (pendingChanges) {
        pendingChanges = false;
        // Notify with a slight delay to allow batching
        clearTimeout(batchTimeoutId);
        batchTimeoutId = setTimeout(() => {
          notifySubscribers(notifyList);
        }, 0);
      } else {
        notifySubscribers(notifyList);
      }
    }
    
    /**
     * Notifies a list of subscribers about state changes
     * @param {Array} notifyList - Subscribers to notify
     */
    function notifySubscribers(notifyList) {
      notifyList.forEach(subscriber => {
        try {
          const selectedState = subscriber.selector 
            ? subscriber.selector(state) 
            : state;
          subscriber.callback(selectedState, state);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
    
    /**
     * Subscribes to state changes
     * @param {Function} callback - Function to call when state changes
     * @param {Function} selector - Optional selector function to filter updates
     * @param {Array} dependencies - Optional dependencies array
     * @returns {Function} Unsubscribe function
     */
    function subscribe(callback, selector = null, dependencies = []) {
      const id = nextSubscriberId++;
      const subscriber = { id, callback, selector, dependencies };
      subscribers.push(subscriber);
      
      // Initial call with current state
      if (selector) {
        callback(selector(state), state);
      } else {
        callback(state, state);
      }
      
      // Return unsubscribe function
      return function unsubscribe() {
        const index = subscribers.findIndex(s => s.id === id);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
      };
    }
    
    /**
     * Creates an action creator
     * @param {Function} actionFn - Function that returns a state update
     * @returns {Function} Action function that can be called directly
     */
    function createAction(actionFn) {
      return (...args) => {
        const updater = actionFn(...args);
        setState(updater);
      };
    }
    
    /**
     * Helper to get a nested value from an object using a path string
     * @param {Object} obj - Object to retrieve from
     * @param {String} path - Dot-notation path
     * @returns {any} Value at the path
     */
    function getNestedValue(obj, path) {
      return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
    }
    
    /**
     * Helper to do a shallow equality check
     * @param {any} obj1 - First object
     * @param {any} obj2 - Second object
     * @returns {Boolean} Whether objects are shallow equal
     */
    function shallowEqual(obj1, obj2) {
      if (obj1 === obj2) return true;
      if (typeof obj1 !== 'object' || obj1 === null || 
          typeof obj2 !== 'object' || obj2 === null) {
        return obj1 === obj2;
      }
      
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      return keys1.every(key => 
        obj2.hasOwnProperty(key) && obj1[key] === obj2[key]
      );
    }
    
    // Return the public API
    return {
      getState,
      setState,
      subscribe,
      computed,
      createAction,
      
      // Shorthand for common operations
      get: getState,
      set: setState,
      select: (selector) => getState(selector)
    };
  }
  
  export { createStore };