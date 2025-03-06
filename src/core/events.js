/**
 * Creates and manages a synthetic event system
 */
const EventSystem = (function() {
    // Event registry to track all handlers
    // Format: { elementId: { eventType: [{ handler, delegate, originalHandler }] } }
    const eventRegistry = new Map();
    
    // Counter for generating unique element IDs
    let nextElementId = 1;
    
    // Synthetic event cache for reuse (performance optimization)
    const eventPool = [];
    const MAX_POOL_SIZE = 20;
    
    // List of events that don't bubble and need direct attachment
    const nonBubblingEvents = new Set([
      'mouseenter', 'mouseleave', 'load', 'unload', 'abort', 'error',
      'resize', 'scroll', 'toggle', 'focus', 'blur'
    ]);
    
    /**
     * Gets or sets a unique ID for an element
     * @param {HTMLElement} element - DOM element
     * @returns {string} Unique element ID
     */
    function getElementId(element) {
      if (!element._eventId) {
        element._eventId = `element-${nextElementId++}`;
      }
      return element._eventId;
    }
    
    /**
     * Creates a synthetic event object
     * @param {Event} nativeEvent - Native browser event
     * @returns {Object} Synthetic event object
     */
    function createSyntheticEvent(nativeEvent) {
      // Get an event from the pool or create a new one
      const syntheticEvent = eventPool.length > 0 
        ? eventPool.pop() 
        : { persist: () => { syntheticEvent._persisted = true; } };
      
      // Reset properties
      syntheticEvent._persisted = false;
      
      // Copy native event properties
      syntheticEvent.nativeEvent = nativeEvent;
      syntheticEvent.type = nativeEvent.type;
      syntheticEvent.target = nativeEvent.target;
      syntheticEvent.currentTarget = nativeEvent.currentTarget;
      syntheticEvent.bubbles = nativeEvent.bubbles;
      syntheticEvent.cancelable = nativeEvent.cancelable;
      syntheticEvent.timeStamp = nativeEvent.timeStamp;
      syntheticEvent.defaultPrevented = nativeEvent.defaultPrevented;
      syntheticEvent.isTrusted = nativeEvent.isTrusted;
      
      // Add event methods
      syntheticEvent.preventDefault = function() {
        this.defaultPrevented = true;
        if (nativeEvent.preventDefault) {
          nativeEvent.preventDefault();
        } else {
          nativeEvent.returnValue = false;
        }
      };
      
      syntheticEvent.stopPropagation = function() {
        if (nativeEvent.stopPropagation) {
          nativeEvent.stopPropagation();
        } else {
          nativeEvent.cancelBubble = true;
        }
      };
      
      syntheticEvent.stopImmediatePropagation = function() {
        this._stopImmediatePropagation = true;
        if (nativeEvent.stopImmediatePropagation) {
          nativeEvent.stopImmediatePropagation();
        } else {
          this.stopPropagation();
        }
      };
      
      // Copy specific properties for different event types
      switch (nativeEvent.type) {
        case 'mousedown':
        case 'mouseup':
        case 'click':
        case 'dblclick':
        case 'mousemove':
        case 'mouseover':
        case 'mouseout':
        case 'mouseenter':
        case 'mouseleave':
          syntheticEvent.clientX = nativeEvent.clientX;
          syntheticEvent.clientY = nativeEvent.clientY;
          syntheticEvent.screenX = nativeEvent.screenX;
          syntheticEvent.screenY = nativeEvent.screenY;
          syntheticEvent.pageX = nativeEvent.pageX || nativeEvent.clientX + document.body.scrollLeft;
          syntheticEvent.pageY = nativeEvent.pageY || nativeEvent.clientY + document.body.scrollTop;
          syntheticEvent.button = nativeEvent.button;
          syntheticEvent.buttons = nativeEvent.buttons;
          syntheticEvent.relatedTarget = nativeEvent.relatedTarget;
          syntheticEvent.ctrlKey = nativeEvent.ctrlKey;
          syntheticEvent.shiftKey = nativeEvent.shiftKey;
          syntheticEvent.altKey = nativeEvent.altKey;
          syntheticEvent.metaKey = nativeEvent.metaKey;
          break;
          
        case 'keydown':
        case 'keyup':
        case 'keypress':
          syntheticEvent.key = nativeEvent.key;
          syntheticEvent.code = nativeEvent.code;
          syntheticEvent.keyCode = nativeEvent.keyCode;
          syntheticEvent.charCode = nativeEvent.charCode;
          syntheticEvent.ctrlKey = nativeEvent.ctrlKey;
          syntheticEvent.shiftKey = nativeEvent.shiftKey;
          syntheticEvent.altKey = nativeEvent.altKey;
          syntheticEvent.metaKey = nativeEvent.metaKey;
          syntheticEvent.repeat = nativeEvent.repeat;
          break;
          
        case 'focus':
        case 'blur':
        case 'focusin':
        case 'focusout':
          syntheticEvent.relatedTarget = nativeEvent.relatedTarget;
          break;
          
        case 'change':
        case 'input':
        case 'submit':
          // For form events, include the form element and value
          if (nativeEvent.target) {
            syntheticEvent.value = nativeEvent.target.value;
            syntheticEvent.checked = nativeEvent.target.checked;
            syntheticEvent.form = nativeEvent.target.form;
          }
          break;
          
        case 'touchstart':
        case 'touchmove':
        case 'touchend':
        case 'touchcancel':
          // Touch events have touches collections
          syntheticEvent.touches = nativeEvent.touches;
          syntheticEvent.targetTouches = nativeEvent.targetTouches;
          syntheticEvent.changedTouches = nativeEvent.changedTouches;
          break;
      }
      
      return syntheticEvent;
    }
    
    /**
     * Returns synthetic event to the pool for reuse
     * @param {Object} syntheticEvent - Synthetic event object
     */
    function releaseEvent(syntheticEvent) {
      if (syntheticEvent && !syntheticEvent._persisted) {
        // Reset all properties
        for (const prop in syntheticEvent) {
          if (prop !== 'persist') {
            syntheticEvent[prop] = null;
          }
        }
        
        // Add to pool if not full
        if (eventPool.length < MAX_POOL_SIZE) {
          eventPool.push(syntheticEvent);
        }
      }
    }
    
    /**
     * Creates delegated event handler
     * @param {string} eventType - Type of event
     * @param {HTMLElement} element - Target element
     * @param {string|null} delegateSelector - CSS selector for delegation
     * @param {Function} handler - Event handler function
     * @returns {Function} Delegated event handler
     */
    function createDelegatedHandler(eventType, element, delegateSelector, handler) {
      return function delegatedEventHandler(nativeEvent) {
        // Create synthetic event
        const syntheticEvent = createSyntheticEvent(nativeEvent);
        
        try {
          // If no delegation, just call the handler
          if (!delegateSelector) {
            handler(syntheticEvent);
            return;
          }
          
          // For delegated events, check if the target matches the selector
          let targetElement = nativeEvent.target;
          
          // Traverse up the DOM tree to find matching elements
          while (targetElement && targetElement !== element) {
            if (elementMatchesSelector(targetElement, delegateSelector)) {
              // We found a matching element in the path
              syntheticEvent.delegateTarget = targetElement;
              
              // Call the handler with the matching element
              handler(syntheticEvent);
              
              // Stop if immediate propagation was stopped
              if (syntheticEvent._stopImmediatePropagation) {
                break;
              }
            }
            
            // Move up to parent
            targetElement = targetElement.parentNode;
          }
        } finally {
          // Return event to pool
          releaseEvent(syntheticEvent);
        }
      };
    }
    
    /**
     * Cross-browser element.matches implementation
     * @param {HTMLElement} element - DOM element
     * @param {string} selector - CSS selector
     * @returns {boolean} Whether element matches selector
     */
    function elementMatchesSelector(element, selector) {
      const matchesMethod = element.matches ||
                            element.matchesSelector ||
                            element.msMatchesSelector ||
                            element.mozMatchesSelector ||
                            element.webkitMatchesSelector ||
                            element.oMatchesSelector;
      
      if (matchesMethod) {
        return matchesMethod.call(element, selector);
      }
      
      // Fallback if no native matches method
      const allNodes = element.parentNode.querySelectorAll(selector);
      for (let i = 0; i < allNodes.length; i++) {
        if (allNodes[i] === element) {
          return true;
        }
      }
      
      return false;
    }
    
    /**
     * Attaches an event listener with optional delegation
     * @param {HTMLElement} element - DOM element
     * @param {string} eventType - Type of event
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event options
     * @returns {Function} Function to remove the listener
     */
    function addEventListener(element, eventType, handler, options = {}) {
      // Default options
      const finalOptions = {
        capture: false,
        passive: false,
        once: false,
        delegate: null,
        ...options
      };
      
      const elementId = getElementId(element);
      
      // Create delegated handler
      const wrappedHandler = createDelegatedHandler(
        eventType, 
        element, 
        finalOptions.delegate, 
        handler
      );
      
      // Initialize registry entries if needed
      if (!eventRegistry.has(elementId)) {
        eventRegistry.set(elementId, {});
      }
      
      const elementEvents = eventRegistry.get(elementId);
      
      if (!elementEvents[eventType]) {
        elementEvents[eventType] = [];
      }
      
      // Store handler reference for cleanup
      elementEvents[eventType].push({
        originalHandler: handler,
        wrappedHandler,
        options: finalOptions
      });
      
      // Attach the native event listener
      element.addEventListener(eventType, wrappedHandler, {
        capture: finalOptions.capture,
        passive: finalOptions.passive,
        once: finalOptions.once
      });
      
      // Return a function to remove this specific listener
      return function removeListener() {
        removeEventListener(element, eventType, handler);
      };
    }
    
    /**
     * Removes an event listener
     * @param {HTMLElement} element - DOM element
     * @param {string} eventType - Type of event
     * @param {Function} handler - Original event handler function
     */
    function removeEventListener(element, eventType, handler) {
      const elementId = element._eventId;
      
      if (!elementId || !eventRegistry.has(elementId)) {
        return;
      }
      
      const elementEvents = eventRegistry.get(elementId);
      
      if (!elementEvents[eventType]) {
        return;
      }
      
      // Find the handler entry
      const handlerIndex = elementEvents[eventType].findIndex(
        entry => entry.originalHandler === handler
      );
      
      if (handlerIndex !== -1) {
        const { wrappedHandler, options } = elementEvents[eventType][handlerIndex];
        
        // Remove from DOM
        element.removeEventListener(eventType, wrappedHandler, {
          capture: options.capture
        });
        
        // Remove from registry
        elementEvents[eventType].splice(handlerIndex, 1);
        
        // Clean up empty entries
        if (elementEvents[eventType].length === 0) {
          delete elementEvents[eventType];
          
          if (Object.keys(elementEvents).length === 0) {
            eventRegistry.delete(elementId);
          }
        }
      }
    }
    
    /**
     * Removes all event listeners from an element
     * @param {HTMLElement} element - DOM element
     */
    function removeAllEventListeners(element) {
      const elementId = element._eventId;
      
      if (!elementId || !eventRegistry.has(elementId)) {
        return;
      }
      
      const elementEvents = eventRegistry.get(elementId);
      
      // Remove each listener
      for (const eventType in elementEvents) {
        for (const { wrappedHandler, options } of elementEvents[eventType]) {
          element.removeEventListener(eventType, wrappedHandler, {
            capture: options.capture
          });
        }
      }
      
      // Clear registry
      eventRegistry.delete(elementId);
    }
    
    /**
     * Creates an event delegate for efficient event handling
     * @param {HTMLElement} rootElement - Root element for delegation
     * @returns {Object} Event delegation API
     */
    function createEventDelegate(rootElement) {
      if (!rootElement) {
        throw new Error('Root element is required for event delegation');
      }
      
      // Active listeners
      const listeners = new Map();
      
      return {
        /**
         * Add delegated event listener
         * @param {string} eventType - Type of event
         * @param {string} selector - CSS selector for delegation
         * @param {Function} handler - Event handler
         * @param {Object} options - Event options
         * @returns {Function} Function to remove the listener
         */
        on(eventType, selector, handler, options = {}) {
          // For non-bubbling events, we need to attach to each matching element
          if (nonBubblingEvents.has(eventType)) {
            const matchingElements = rootElement.querySelectorAll(selector);
            const cleanupFunctions = [];
            
            matchingElements.forEach(element => {
              const cleanup = addEventListener(element, eventType, handler, options);
              cleanupFunctions.push(cleanup);
            });
            
            // Return function to remove all listeners
            return function() {
              cleanupFunctions.forEach(cleanup => cleanup());
            };
          }
          
          // For bubbling events, use delegation
          const finalOptions = { ...options, delegate: selector };
          const removeListener = addEventListener(rootElement, eventType, handler, finalOptions);
          
          // Track for bulk removal
          const key = `${eventType}:${selector}`;
          if (!listeners.has(key)) {
            listeners.set(key, []);
          }
          
          listeners.get(key).push({ handler, removeListener });
          
          return removeListener;
        },
        
        /**
         * Remove specific delegated event listener
         * @param {string} eventType - Type of event
         * @param {string} selector - CSS selector for delegation
         * @param {Function} handler - Event handler
         */
        off(eventType, selector, handler) {
          const key = `${eventType}:${selector}`;
          
          if (listeners.has(key)) {
            const handlers = listeners.get(key);
            const index = handlers.findIndex(entry => entry.handler === handler);
            
            if (index !== -1) {
              handlers[index].removeListener();
              handlers.splice(index, 1);
              
              if (handlers.length === 0) {
                listeners.delete(key);
              }
            }
          }
        },
        
        /**
         * Remove all delegated event listeners
         */
        removeAll() {
          for (const handlers of listeners.values()) {
            for (const { removeListener } of handlers) {
              removeListener();
            }
          }
          
          listeners.clear();
        }
      };
    }
    
    // Public API
    return {
      addEventListener,
      removeEventListener,
      removeAllEventListeners,
      createEventDelegate
    };
  })();
  
  export { EventSystem };