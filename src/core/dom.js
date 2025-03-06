import { DOMEventHandling } from './dom-events';

/**
 * Creates a virtual DOM element
 * @param {string} tag - HTML tag name
 * @param {Object} props - Element properties and attributes
 * @param {Array} children - Child elements
 * @returns {Object} Virtual DOM node
 */
function createElement(tag, props = {}, ...children) {
  // Flatten nested arrays of children
  const flatChildren = children.flat(Infinity);
  
  // Process children to handle primitive values
  const processedChildren = flatChildren.map(child => 
    (typeof child === 'string' || typeof child === 'number') 
      ? { type: 'TEXT_ELEMENT', props: { nodeValue: String(child) } }
      : child
  );
  
  return {
    type: tag,
    props: {
      ...props,
      children: processedChildren.filter(child => child != null)
    }
  };
}

/**
 * Creates a real DOM element from a virtual node
 * @param {Object} vNode - Virtual DOM node
 * @returns {Node} Real DOM node
 */
function createDOMElement(vNode) {
  // Handle text nodes
  if (vNode.type === 'TEXT_ELEMENT') {
    return document.createTextNode(vNode.props.nodeValue);
  }
  
  // Create the DOM element
  const element = document.createElement(vNode.type);
  
  // Separate event props from regular props
  const eventProps = {};
  const regularProps = {};
  
  // Process props into their appropriate categories
  Object.entries(vNode.props || {}).forEach(([name, value]) => {
    // Skip the children property
    if (name === 'children') return;
    
    if (name.startsWith('on') && typeof value === 'function') {
      eventProps[name] = value;
    } else {
      regularProps[name] = value;
    }
  });
  
  // Add attributes and properties
  Object.entries(regularProps).forEach(([name, value]) => {
    // Special case for className -> class
    if (name === 'className') {
      element.setAttribute('class', value);
    } 
    // Special case for style objects
    else if (name === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    }
    // Regular attributes
    else if (typeof value !== 'function') {
      element.setAttribute(name, value);
    }
  });
  
  // Attach event handlers using our event system
  DOMEventHandling.attachEventHandlers(element, eventProps);
  
  // Store current event props for future diffing
  element._currentEventProps = eventProps;
  
  // Recursively create and append children
  (vNode.props.children || []).forEach(childVNode => {
    if (childVNode != null) {
      const childElement = createDOMElement(childVNode);
      element.appendChild(childElement);
    }
  });
  
  return element;
}

/**
 * Renders a virtual DOM tree to a container
 * @param {Object} vNode - Virtual DOM node
 * @param {HTMLElement} container - DOM container
 * @param {Function} callback - Optional callback after render
 */
function render(vNode, container, callback) {
  if (!vNode) return;
  
  // Clean up any existing content and event handlers
  if (container.firstChild) {
    removeElement(container.firstChild);
  }
  
  // Create the DOM element
  const domElement = createDOMElement(vNode);
  
  // Clear and update the container
  container.innerHTML = '';
  container.appendChild(domElement);
  
  // Store reference to the virtual DOM for future diffs
  container._vNode = vNode;
  
  // Execute callback if provided
  if (typeof callback === 'function') {
    callback();
  }
  
  return domElement;
}

/**
 * Removes an element and cleans up its event handlers
 * @param {HTMLElement} element - DOM element to remove
 */
function removeElement(element) {
  // Clean up all event handlers before removing
  DOMEventHandling.removeAllEventHandlers(element);
  
  // Remove children recursively
  if (element.childNodes && element.childNodes.length) {
    Array.from(element.childNodes).forEach(child => {
      removeElement(child);
    });
  }
  
  // Remove the element from the DOM if it has a parent
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Updates the DOM efficiently by only changing what's needed
 * @param {Object} oldVNode - Previous virtual DOM tree
 * @param {Object} newVNode - New virtual DOM tree
 * @param {HTMLElement} container - DOM container
 */
function updateElement(oldVNode, newVNode, container) {
  // If no old vNode exists, simply render the new one
  if (!oldVNode) {
    const newElement = createDOMElement(newVNode);
    container.appendChild(newElement);
    return;
  }
  
  // If no new vNode exists, remove the old element
  if (!newVNode) {
    if (container.firstChild) {
      removeElement(container.firstChild);
    }
    return;
  }
  
  // If node types are different, replace the old node
  if (oldVNode.type !== newVNode.type) {
    const newElement = createDOMElement(newVNode);
    if (container.firstChild) {
      removeElement(container.firstChild);
    }
    container.appendChild(newElement);
    return;
  }
  
  // Diff and patch the DOM
  const patches = diff(oldVNode, newVNode);
  patch(container.firstChild, patches);
  
  // Update the stored virtual DOM reference
  container._vNode = newVNode;
}

/**
 * Compares two virtual DOM trees and returns necessary changes
 * @param {Object} oldVNode - Previous virtual DOM tree
 * @param {Object} newVNode - New virtual DOM tree
 * @returns {Object} Object describing the changes
 */
function diff(oldVNode, newVNode) {
  // Base case: completely different nodes
  if (!oldVNode || !newVNode || oldVNode.type !== newVNode.type) {
    return { type: 'REPLACE', newVNode };
  }
  
  // Text node comparison
  if (oldVNode.type === 'TEXT_ELEMENT') {
    if (oldVNode.props.nodeValue !== newVNode.props.nodeValue) {
      return { type: 'TEXT', newValue: newVNode.props.nodeValue };
    }
    return null;
  }
  
  // Compare props to find changes
  const propChanges = {};
  let hasPropChanges = false;
  
  // Check for changed or new props
  Object.entries(newVNode.props || {}).forEach(([name, value]) => {
    // Skip children as they're handled separately
    if (name === 'children') return;
    
    if (oldVNode.props[name] !== value) {
      propChanges[name] = value;
      hasPropChanges = true;
    }
  });
  
  // Check for removed props
  Object.keys(oldVNode.props || {}).forEach(name => {
    if (name === 'children') return;
    
    if (!(name in newVNode.props)) {
      propChanges[name] = null;
      hasPropChanges = true;
    }
  });
  
  // Compare children
  const oldChildren = oldVNode.props.children || [];
  const newChildren = newVNode.props.children || [];
  const childPatches = [];
  
  // Find the maximum length to iterate through
  const maxLength = Math.max(oldChildren.length, newChildren.length);
  
  for (let i = 0; i < maxLength; i++) {
    // Recursively diff each child
    const childPatch = diff(oldChildren[i], newChildren[i]);
    if (childPatch) {
      childPatches.push({ index: i, patch: childPatch });
    }
  }
  
  // Return the combined changes
  if (!hasPropChanges && childPatches.length === 0) {
    return null;
  }
  
  return {
    type: 'UPDATE',
    props: hasPropChanges ? propChanges : null,
    children: childPatches.length > 0 ? childPatches : null
  };
}

/**
 * Applies changes to the DOM based on the diff result
 * @param {HTMLElement} domElement - DOM element to update
 * @param {Object} patches - Changes to apply
 */
function patch(domElement, patches) {
  if (!patches || !domElement) return;
  
  switch (patches.type) {
    case 'REPLACE':
      // Replace the entire node
      const newElement = createDOMElement(patches.newVNode);
      domElement.parentNode.replaceChild(newElement, domElement);
      // Clean up old element's event handlers
      DOMEventHandling.removeAllEventHandlers(domElement);
      return newElement;
      
    case 'TEXT':
      // Update text content
      domElement.nodeValue = patches.newValue;
      return domElement;
      
    case 'UPDATE':
      // Update props if needed
      if (patches.props) {
        // Separate event props from regular props
        const eventProps = {};
        const regularProps = {};
        
        Object.entries(patches.props).forEach(([name, value]) => {
          if (name.startsWith('on') && (typeof value === 'function' || value === null)) {
            eventProps[name] = value;
          } else {
            regularProps[name] = value;
          }
        });
        
        // Update regular props
        Object.entries(regularProps).forEach(([name, value]) => {
          // Handle null values (removed props)
          if (value === null) {
            if (name === 'className') {
              domElement.removeAttribute('class');
            } else {
              domElement.removeAttribute(name);
            }
          } 
          // Handle updates
          else if (name === 'className') {
            domElement.setAttribute('class', value);
          } else if (name === 'style' && typeof value === 'object') {
            Object.assign(domElement.style, value);
          } else {
            domElement.setAttribute(name, value);
          }
        });
        
        // Update event handlers
        DOMEventHandling.updateEventHandlers(
          domElement, 
          domElement._currentEventProps || {}, 
          eventProps
        );
        
        // Update stored event props reference
        domElement._currentEventProps = {
          ...domElement._currentEventProps,
          ...eventProps
        };
        
        // Remove null event props from reference
        for (const [name, value] of Object.entries(eventProps)) {
          if (value === null && domElement._currentEventProps) {
            delete domElement._currentEventProps[name];
          }
        }
      }
      
      // Update children if needed
      if (patches.children) {
        patches.children.forEach(({ index, patch }) => {
          if (domElement.childNodes[index]) {
            patch(domElement.childNodes[index], patch);
          }
        });
      }
      
      return domElement;
  }
}

export { createElement, render, updateElement, diff, patch, removeElement };