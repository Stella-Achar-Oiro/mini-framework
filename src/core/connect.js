/**
 * Connects a component to the state store
 * @param {Function} mapStateToProps - Function that maps state to component props
 * @param {Object} mapActionsToProps - Object of action creators or function that maps actions
 * @param {Function} Component - Component to connect
 * @returns {Function} Connected component
 */
function connect(mapStateToProps, mapActionsToProps, Component) {
    return (props) => {
      return (appContext) => {
        // Get state and actions from app context
        const { state, actions, router } = appContext;
        
        // Compute props from state
        const stateProps = mapStateToProps ? mapStateToProps(state, router) : {};
        
        // Get action props
        let actionProps = {};
        if (typeof mapActionsToProps === 'function') {
          actionProps = mapActionsToProps(actions, router);
        } else if (mapActionsToProps) {
          // Map actions object
          for (const key of Object.keys(mapActionsToProps)) {
            actionProps[key] = (...args) => 
              actions[mapActionsToProps[key]](...args);
          }
        }
        
        // Combine all props
        const componentProps = {
          ...props,
          ...stateProps,
          ...actionProps,
          router
        };
        
        // Render the wrapped component with the combined props
        return Component(componentProps);
      };
    };
  }
  
  export { connect };