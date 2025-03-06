/**
 * Integrates router with state management
 * @param {Object} router - Router instance
 * @param {Object} store - State store
 * @returns {Object} Enhanced router
 */
function connectRouterToStore(router, store) {
    // Initialize state with current route
    store.setState({
      router: {
        route: null,
        params: {},
        query: {}
      }
    });
    
    // Listen for route changes
    router.on('change', (to, from) => {
      // Update state with new route info
      store.setState({
        router: {
          route: to.path,
          params: to.params,
          query: to.query,
          state: to.state
        }
      });
    });
    
    // Enhanced navigation that can access store
    const enhancedNavigate = (path, state = {}) => {
      const storeState = store.getState();
      // You could include certain store state in navigation
      return router.navigate(path, { ...state, storeSnapshot: null });
    };
    
    // Return enhanced router
    return {
      ...router,
      navigate: enhancedNavigate
    };
  }
  
  export { connectRouterToStore };