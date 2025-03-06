import { EventSystem } from './events';

/**
 * Event handler for virtual DOM properties
 * Maps event props to event system
 */
const DOMEventHandling = {
  /**
   * Processes event props and attaches handlers
   * @param {HTMLElement} element - Real DOM element
   * @param {Object} props - Element properties
   * @returns {Object} Cleanup functions
   */
  attachEventHandlers(element, props) {
    const cleanupFunctions = [];
    
    // Process props for event handlers (props starting with "on")
    for (const [name, value] of Object.entries(props)) {
      if (name.startsWith('on') && typeof value === 'function') {
        const eventName = getEventNameFromProp(name);
        
        // Special case for delegation via CSS selector
        if (name.includes('_')) {
          // Format: onClick_li.item
          const [_, selector] = name.split('_');
          
          // Create root delegate if this is first delegated event
          if (!element._eventDelegate) {
            element._eventDelegate = EventSystem.createEventDelegate(element);
          }
          
          const removeListener = element._eventDelegate.on(
            eventName, 
            selector, 
            value
          );
          
          cleanupFunctions.push(removeListener);
        } else {
          // Regular event handler
          const removeListener = EventSystem.addEventListener(
            element, 
            eventName, 
            value
          );
          
          cleanupFunctions.push(removeListener);
        }
      }
    }
    
    // Return function to remove all attached handlers
    if (cleanupFunctions.length > 0) {
      element._eventCleanup = () => {
        cleanupFunctions.forEach(fn => fn());
      };
    }
    
    return element._eventCleanup;
  },
  
  /**
   * Updates event handlers when props change
   * @param {HTMLElement} element - Real DOM element
   * @param {Object} oldProps - Previous properties
   * @param {Object} newProps - New properties
   */
  updateEventHandlers(element, oldProps, newProps) {
    // Clean up old handlers first
    if (element._eventCleanup) {
      element._eventCleanup();
      element._eventCleanup = null;
    }
    
    // Attach new handlers
    return DOMEventHandling.attachEventHandlers(element, newProps);
  },
  
  /**
   * Removes all event handlers from an element
   * @param {HTMLElement} element - DOM element
   */
  removeAllEventHandlers(element) {
    // Call specific cleanup function if it exists
    if (element._eventCleanup) {
      element._eventCleanup();
      element._eventCleanup = null;
    }
    
    // Cleanup delegated events
    if (element._eventDelegate) {
      element._eventDelegate.removeAll();
      element._eventDelegate = null;
    }
    
    // Final cleanup of any remaining handlers
    EventSystem.removeAllEventListeners(element);
  }
};

/**
 * Gets event name from prop name
 * @param {string} propName - Property name (e.g., onClick)
 * @returns {string} Event name (e.g., click)
 */
function getEventNameFromProp(propName) {
  // Handle delegation format (onClick_selector)
  if (propName.includes('_')) {
    propName = propName.split('_')[0];
  }
  
  // Convert camelCase to lowercase (onClick -> click)
  return propName.substring(2).toLowerCase();
}

export { DOMEventHandling };