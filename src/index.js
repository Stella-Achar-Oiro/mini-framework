import { createElement, render, updateElement } from './core/dom';
import { createStore } from './core/state';
import { createRouter } from './core/router';
import { EventSystem } from './core/events';

/**
 * Creates a new framework application
 * @param {Object} options - Application configuration
 * @returns {Object} Application instance
 */
function createApp(options = {}) {
  // Initialize state store with initial state
  const store = createStore(options.initialState || {});
  
  // Initialize router
  const router = createRouter(options.router || { mode: 'history' });
  
  // Track root details
  let rootElement = null;
  let rootComponent = null;
  let currentVNode = null;
  
  // Track mounted components for lifecycle hooks
  const mountedComponents = new Map();
  
  /**
   * Mounts the application to a DOM element
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Function} component - Root component function
   */
  function mount(container, component) {
    // Get container element
    rootElement = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
      
    if (!rootElement) {
      throw new Error(`Container element not found: ${container}`);
    }
    
    // Store root component
    rootComponent = component;
    
    // Set up router if routes provided
    if (options.routes) {
      router.addRoutes(options.routes);
      
      // Connect router to state
      router.on('change', (to) => {
        // Update state with route info
        store.setState({
          route: {
            path: to.path,
            params: to.params,
            query: to.query
          }
        });
        
        // Re-render application
        renderApp();
      });
    }
    
    // Subscribe to state changes
    store.subscribe(() => {
      renderApp();
    });
    
    // Initialize router and render initial app
    router.init();
    renderApp();
    
    return app;
  }
  
  /**
   * Renders the application with current state
   */
  function renderApp() {
    // Build component props
    const props = {
      state: store.getState(),
      actions: app.actions,
      router
    };
    
    // Create virtual DOM
    const newVNode = rootComponent(props);
    
    // Render or update DOM
    if (!currentVNode) {
      currentVNode = newVNode;
      render(newVNode, rootElement);
    } else {
      updateElement(currentVNode, newVNode, rootElement);
      currentVNode = newVNode;
    }
    
    // Process component lifecycle hooks
    processLifecycleHooks(rootElement);
  }
  
  /**
   * Processes component lifecycle hooks after render
   * @param {HTMLElement} container - Root container
   */
  function processLifecycleHooks(container) {
    // Find elements with component IDs
    const elements = container.querySelectorAll('[data-component-id]');
    
    // Track currently found components to detect unmounted components
    const foundComponents = new Set();
    
    // Process mounted and updated components
    elements.forEach(element => {
      const id = element.dataset.componentId;
      foundComponents.add(id);
      
      const component = element._component;
      if (component) {
        if (!mountedComponents.has(id)) {
          // New component - call mount hook
          mountedComponents.set(id, true);
          if (component.onMount) {
            component.onMount(element);
          }
        } else if (component.onUpdate) {
          // Existing component - call update hook
          component.onUpdate(element);
        }
      }
    });
    
    // Find and call unmount hooks for removed components
    for (const [id, _] of mountedComponents) {
      if (!foundComponents.has(id) && mountedComponents.get(id)) {
        const component = mountedComponents.get(id);
        if (component.onUnmount) {
          component.onUnmount();
        }
        mountedComponents.delete(id);
      }
    }
  }
  
  /**
   * Creates a component with lifecycle hooks
   * @param {Function} renderFn - Component render function
   * @param {Object} hooks - Component lifecycle hooks
   * @returns {Function} Component function
   */
  function createComponent(renderFn, hooks = {}) {
    // Generate unique ID for this component type
    const componentTypeId = Symbol('component');
    let instanceCounter = 0;
    
    // Return component function
    return function Component(props) {
      // Create unique ID for this instance
      const instanceId = `${componentTypeId.description}-${++instanceCounter}`;
      
      // Create virtual DOM from render function
      const vNode = renderFn(props);
      
      // Add component ID to root element
      if (vNode && typeof vNode === 'object') {
        // Add component data
        vNode.props = {
          ...vNode.props,
          'data-component-id': instanceId
        };
        
        // Attach hooks to element for lifecycle processing
        if (vNode._elementRef) {
          vNode._elementRef._component = {
            onMount: hooks.onMount,
            onUpdate: hooks.onUpdate,
            onUnmount: hooks.onUnmount
          };
        }
      }
      
      return vNode;
    };
  }
  
  /**
   * Connects a component to the state store
   * @param {Function} mapStateToProps - Function to map state to props
   * @param {Object|Function} mapActionsToProps - Actions mapping
   * @param {Function} component - Component to connect
   * @returns {Function} Connected component
   */
  function connect(mapStateToProps, mapActionsToProps, component) {
    return (ownProps = {}) => {
      // Get current state
      const state = store.getState();
      
      // Map state to props
      const stateProps = mapStateToProps ? mapStateToProps(state) : {};
      
      // Map actions to props
      let actionProps = {};
      
      if (typeof mapActionsToProps === 'function') {
        actionProps = mapActionsToProps(app.actions);
      } else if (mapActionsToProps) {
        // Map each action
        Object.keys(mapActionsToProps).forEach(key => {
          const actionKey = mapActionsToProps[key];
          actionProps[key] = (...args) => app.actions[actionKey](...args);
        });
      }
      
      // Combine all props
      const combinedProps = {
        ...ownProps,
        ...stateProps,
        ...actionProps,
        router
      };
      
      // Render component with combined props
      return component(combinedProps);
    };
  }
  
  /**
   * Creates action creators bound to the store
   * @param {Object} actionCreators - Action creator functions
   * @returns {Object} Bound actions
   */
  function createActions(actionCreators) {
    const boundActions = {};
    
    Object.entries(actionCreators).forEach(([name, fn]) => {
      boundActions[name] = (...args) => {
        // Get action object or function
        const action = fn(...args);
        
        // Handle thunks (functions) or regular actions (objects)
        if (typeof action === 'function') {
          // Thunk: call with getState and dispatch
          return action(store.getState, (actionOrFn) => {
            if (typeof actionOrFn === 'function') {
              actionOrFn(store.getState, boundActions);
            } else {
              store.setState(actionOrFn);
            }
          });
        } else {
          // Regular action object
          store.setState(action);
        }
      };
    });
    
    return boundActions;
  }
  
  // Create the application object with public API
  const app = {
    mount,
    createElement,
    createComponent,
    connect,
    store,
    router,
    actions: {},
    
    // Allow direct state subscription
    subscribe: store.subscribe
  };
  
  // Set up actions if provided
  if (options.actions) {
    app.actions = createActions(options.actions);
  }
  
  return app;
}

// Export public API
export {
  createApp,
  createElement
};