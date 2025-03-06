// src/index.js
import { createElement, render, diff, patch } from './dom';
import { createStore } from './state';
import { createRouter } from './router';
import { createEventSystem } from './events';

// Framework initialization function
function createApp(config = {}) {
  // Create store with initial state
  const store = createStore(config.initialState || {});
  
  // Create router with routes config
  const router = createRouter(config.routes || []);
  
  // The app object that users will interact with
  return {
    // Mount the application to a DOM element
    mount(selector) {
      const container = document.querySelector(selector);
      if (!container) throw new Error(`Element ${selector} not found`);
      
      // Initialize router
      router.init(store);
      
      // Initial render
      render(config.rootComponent, container, store);
      
      return this;
    },
    
    // Expose core APIs
    createElement,
    createStore,
    router
  };
}

// Export all public APIs
export {
  createApp,
  createElement,
  render,
  createStore,
  createRouter,
  createEventSystem
};