/**
 * Event Handler Examples for Mini Framework
 * 
 * This file demonstrates the correct way to set click event handlers
 * and other event types in the mini framework.
 */

import { DOM } from './src/core/dom.js';

const dom = new DOM();

// Example 1: React-style onClick (Recommended)
const clickButton = dom.createVNode('button', {
    onClick: (event) => {
        console.log('Button clicked!', event);
        // The onclick property will be automatically set on the DOM element
    },
    id: 'click-button',
    class: 'btn btn-primary'
}, ['Click Me']);

// Example 2: Lowercase onclick (Also supported)
const clickButton2 = dom.createVNode('button', {
    onclick: (event) => {
        console.log('Button 2 clicked!', event);
        // The onclick property will be automatically set on the DOM element
    },
    id: 'click-button-2',
    class: 'btn btn-secondary'
}, ['Click Me Too']);

// Example 3: Multiple event handlers
const multiEventButton = dom.createVNode('button', {
    onClick: (event) => {
        console.log('Clicked!', event);
    },
    onMouseOver: (event) => {
        console.log('Mouse over!', event);
        event.target.style.backgroundColor = '#e0e0e0';
    },
    onMouseOut: (event) => {
        console.log('Mouse out!', event);
        event.target.style.backgroundColor = '';
    },
    onDoubleClick: (event) => {
        console.log('Double clicked!', event);
    }
}, ['Multi-Event Button']);

// Example 4: Form events
const formExample = dom.createVNode('form', {
    onSubmit: (event) => {
        event.preventDefault();
        console.log('Form submitted!');
        
        const formData = new FormData(event.target);
        console.log('Form data:', Object.fromEntries(formData));
    }
}, [
    dom.createVNode('input', {
        type: 'text',
        name: 'username',
        placeholder: 'Enter username',
        onChange: (event) => {
            console.log('Input changed:', event.target.value);
        },
        onFocus: (event) => {
            console.log('Input focused');
            event.target.style.borderColor = '#007bff';
        },
        onBlur: (event) => {
            console.log('Input blurred');
            event.target.style.borderColor = '';
        }
    }),
    dom.createVNode('button', {
        type: 'submit',
        onClick: (event) => {
            console.log('Submit button clicked');
        }
    }, ['Submit'])
]);

// Example 5: Event delegation pattern
const listExample = dom.createVNode('ul', {
    onClick: (event) => {
        // Event delegation - handle clicks on list items
        if (event.target.tagName === 'LI') {
            console.log('List item clicked:', event.target.textContent);
            event.target.style.backgroundColor = '#f0f0f0';
        }
    }
}, [
    dom.createVNode('li', {}, ['Item 1']),
    dom.createVNode('li', {}, ['Item 2']),
    dom.createVNode('li', {}, ['Item 3'])
]);

// Example 6: Keyboard events
const keyboardInput = dom.createVNode('input', {
    type: 'text',
    placeholder: 'Type something...',
    onKeyDown: (event) => {
        console.log('Key down:', event.key);
        if (event.key === 'Enter') {
            console.log('Enter pressed!');
        }
    },
    onKeyUp: (event) => {
        console.log('Key up:', event.key);
    },
    onKeyPress: (event) => {
        console.log('Key press:', event.key);
    }
});

// Example 7: Custom event handler with error handling
const errorHandlingButton = dom.createVNode('button', {
    onClick: (event) => {
        try {
            // Some operation that might throw an error
            console.log('Processing click...');
            
            // Simulate an error for demonstration
            if (Math.random() > 0.5) {
                throw new Error('Random error occurred!');
            }
            
            console.log('Click processed successfully!');
        } catch (error) {
            console.error('Error in click handler:', error);
            // The framework will also catch and log this error
        }
    }
}, ['Click Me (May Error)']);

// Usage example: Creating and appending elements
export function createEventExamples(container) {
    const examples = [
        clickButton,
        clickButton2,
        multiEventButton,
        formExample,
        listExample,
        keyboardInput,
        errorHandlingButton
    ];
    
    examples.forEach(vnode => {
        const element = dom.createElement(vnode);
        container.appendChild(element);
    });
}

// Key points about event handling in this framework:
/*
1. Event Name Conversion:
   - React-style: onClick → 'click' for addEventListener
   - React-style: onMouseOver → 'mouseover' for addEventListener
   - React-style: onDoubleClick → 'dblclick' for addEventListener
   - Lowercase: onclick → 'click' for addEventListener

2. DOM Property Setting:
   - The framework automatically sets element.onclick = handler
   - This makes element.onclick return the actual function
   - Both addEventListener and onclick property are set

3. Supported Event Types:
   - All standard DOM events are supported
   - Mouse events: click, dblclick, mousedown, mouseup, mouseover, mouseout, etc.
   - Keyboard events: keydown, keyup, keypress
   - Form events: submit, change, input, focus, blur
   - Window events: load, resize, scroll
   - And many more...

4. Event Handler Function:
   - Receives the standard DOM Event object as parameter
   - Can use event.preventDefault(), event.stopPropagation(), etc.
   - Errors in handlers are caught and logged by the framework

5. Cleanup:
   - Event listeners are automatically cleaned up when elements are removed
   - Both addEventListener listeners and onclick properties are cleaned up
*/
