// src/core/component.js

/**
 * Creates a component with props and lifecycle hooks
 * @param {Function} renderFn - Function that returns a vDOM element
 * @param {Object} options - Component options
 * @returns {Function} Component function
 */
function defineComponent(renderFn, options = {}) {
    // Extract lifecycle hooks and other options
    const { 
      onMount = null,
      onUpdate = null, 
      onUnmount = null,
      computed = {} 
    } = options;
    
    // The component function
    return function Component(props) {
      // Create vDOM element
      const vNode = renderFn(props);
      
      // Set up local computations
      const computedValues = {};
      for (const [key, computeFn] of Object.entries(computed)) {
        computedValues[key] = computeFn(props);
      }
      
      // Attach lifecycle hooks to the vNode
      if (vNode) {
        vNode._componentHooks = {
          onMount,
          onUpdate, 
          onUnmount,
          computed: computedValues
        };
      }
      
      return vNode;
    };
  }
  
  export { defineComponent };