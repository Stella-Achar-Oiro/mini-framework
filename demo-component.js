/**
 * Demo Component to test DOM Abstraction System
 */

import { MiniFramework } from './src/index.js';
import { h, div, button, p, input, br } from './src/utils/dom-helpers.js';

// Create a simple counter component
function Counter(props = {}) {
    const initialCount = props.initialCount || 0;
    
    return div({ class: 'counter-container', style: 'padding: 20px; border: 1px solid #ddd; margin: 10px;' }, [
        h('h2', { style: 'color: #333;' }, 'DOM Abstraction Demo'),
        p({ class: 'counter-display' }, `Count: ${initialCount}`),
        div({ class: 'button-group' }, [
            button({ 
                class: 'btn btn-primary',
                style: 'margin: 5px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;',
                onClick: () => console.log('Increment clicked!')
            }, 'Increment'),
            button({ 
                class: 'btn btn-secondary',
                style: 'margin: 5px; padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;',
                onClick: () => console.log('Decrement clicked!')
            }, 'Decrement'),
            br(),
            input({ 
                type: 'text',
                placeholder: 'Type something...',
                style: 'margin: 5px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;',
                onInput: (e) => console.log('Input value:', e.target.value)
            })
        ]),
        p({ style: 'font-size: 14px; color: #666; margin-top: 15px;' }, [
            'This demo shows the DOM abstraction system working with:',
            br(),
            '• Virtual node creation (h function)',
            br(),
            '• Event handling (onClick, onInput)',
            br(),
            '• Attribute handling (class, style, etc.)',
            br(),
            '• Nested elements and text nodes'
        ])
    ]);
}

// Initialize framework when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new MiniFramework({
        container: '#app',
        debug: true
    });

    app.init();
    
    // Render the demo component
    const demoComponent = Counter({ initialCount: 5 });
    app.render(demoComponent);
    
    console.log('Demo component rendered!');
    console.log('Virtual node structure:', demoComponent);
});