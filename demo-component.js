/**
 * Demo Component to test DOM Abstraction System
 */

import { MiniFramework } from './src/index.js';
import { h, div, button, p, input, br, debounceEvent, throttleEvent, onceEvent, preventEvent, dataEvent } from './src/utils/dom-helpers.js';

// Create an enhanced demo component showcasing the event system
function EnhancedEventDemo(props = {}) {
    const initialCount = props.initialCount || 0;
    
    return div({ class: 'demo-container', style: 'padding: 20px; border: 1px solid #ddd; margin: 10px; max-width: 800px;' }, [
        h('h2', { style: 'color: #333; text-align: center;' }, '🎯 Event Handling System Demo'),
        
        // Basic event handling section
        div({ class: 'section', style: 'margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 6px;' }, [
            h('h3', { style: 'color: #495057; margin-top: 0;' }, 'Basic Event Handling'),
            p({ class: 'counter-display', style: 'font-size: 18px; font-weight: bold;' }, `Count: ${initialCount}`),
            div({ class: 'button-group', style: 'display: flex; gap: 10px; flex-wrap: wrap;' }, [
                button({ 
                    class: 'btn btn-primary',
                    style: 'padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;',
                    onClick: () => console.log('🔵 Increment clicked!')
                }, 'Increment'),
                button({ 
                    class: 'btn btn-secondary',
                    style: 'padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;',
                    onClick: () => console.log('🔘 Decrement clicked!')
                }, 'Decrement'),
                button({ 
                    class: 'btn btn-success',
                    style: 'padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;',
                    onClick: onceEvent(() => console.log('🟢 This only fires once!'))
                }, 'One-Time Event')
            ])
        ]),

        // Advanced event handling section
        div({ class: 'section', style: 'margin: 20px 0; padding: 15px; background: #e3f2fd; border-radius: 6px;' }, [
            h('h3', { style: 'color: #1976d2; margin-top: 0;' }, 'Advanced Event Features'),
            div({ style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 15px;' }, [
                div({}, [
                    h('h4', { style: 'margin: 0 0 10px 0; color: #333;' }, 'Debounced Input'),
                    input({ 
                        type: 'text',
                        placeholder: 'Type to see debouncing...',
                        style: 'width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;',
                        onInput: debounceEvent((e) => console.log('⏱️ Debounced input:', e.target.value), 500)
                    })
                ]),
                div({}, [
                    h('h4', { style: 'margin: 0 0 10px 0; color: #333;' }, 'Throttled Button'),
                    button({ 
                        style: 'width: 100%; padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;',
                        onClick: throttleEvent(() => console.log('⚡ Throttled click!'), 1000)
                    }, 'Click Me Fast!')
                ])
            ])
        ]),

        // Data binding section
        div({ class: 'section', style: 'margin: 20px 0; padding: 15px; background: #fff3e0; border-radius: 6px;' }, [
            h('h3', { style: 'color: #f57c00; margin-top: 0;' }, 'Event Data Binding'),
            div({ style: 'display: flex; gap: 10px; flex-wrap: wrap;' }, [
                button({ 
                    style: 'padding: 8px 16px; background: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer;',
                    onClick: dataEvent((e) => {
                        console.log('📦 Button with data:', e.customData);
                    }, { buttonId: 'data-button-1', action: 'test' })
                }, 'Button with Data'),
                button({ 
                    style: 'padding: 8px 16px; background: #e91e63; color: white; border: none; border-radius: 4px; cursor: pointer;',
                    onClick: preventEvent((e) => {
                        console.log('🚫 Default prevented, but I still fired!');
                    })
                }, 'Prevent Default')
            ])
        ]),

        // Form section with validation
        div({ class: 'section', style: 'margin: 20px 0; padding: 15px; background: #f3e5f5; border-radius: 6px;' }, [
            h('h3', { style: 'color: #7b1fa2; margin-top: 0;' }, 'Form Events'),
            h('form', { 
                style: 'display: flex; flex-direction: column; gap: 10px;',
                onSubmit: preventEvent((e) => {
                    console.log('📝 Form submitted!');
                })
            }, [
                input({ 
                    type: 'email',
                    placeholder: 'Enter email...',
                    style: 'padding: 8px; border: 1px solid #ccc; border-radius: 4px;',
                    onChange: (e) => console.log('📧 Email changed:', e.target.value)
                }),
                button({ 
                    type: 'submit',
                    style: 'padding: 10px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;'
                }, 'Submit Form')
            ])
        ]),

        // Event delegation demo
        div({ class: 'section', style: 'margin: 20px 0; padding: 15px; background: #ffebee; border-radius: 6px;' }, [
            h('h3', { style: 'color: #d32f2f; margin-top: 0;' }, 'Event Delegation'),
            p({ style: 'margin: 10px 0; color: #666;' }, 'Click any item below (events are delegated):'),
            div({ 
                class: 'delegation-container',
                style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;'
            }, [
                div({ 
                    class: 'delegated-item',
                    style: 'padding: 15px; background: #ffcdd2; border-radius: 4px; cursor: pointer; text-align: center;',
                    'data-item': 'item-1'
                }, 'Item 1'),
                div({ 
                    class: 'delegated-item',
                    style: 'padding: 15px; background: #f8bbd9; border-radius: 4px; cursor: pointer; text-align: center;',
                    'data-item': 'item-2'
                }, 'Item 2'),
                div({ 
                    class: 'delegated-item',
                    style: 'padding: 15px; background: #e1bee7; border-radius: 4px; cursor: pointer; text-align: center;',
                    'data-item': 'item-3'
                }, 'Item 3'),
                div({ 
                    class: 'delegated-item',
                    style: 'padding: 15px; background: #d1c4e9; border-radius: 4px; cursor: pointer; text-align: center;',
                    'data-item': 'item-4'
                }, 'Item 4')
            ])
        ]),

        // Feature summary
        div({ style: 'margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 6px; border-left: 4px solid #4caf50;' }, [
            h('h3', { style: 'color: #2e7d32; margin-top: 0;' }, '✨ Event System Features Demonstrated'),
            h('ul', { style: 'margin: 10px 0; padding-left: 20px; color: #555;' }, [
                h('li', {}, 'Custom event wrapper with enhanced functionality'),
                h('li', {}, 'Event delegation for performance optimization'),
                h('li', {}, 'Debounced and throttled event handlers'),
                h('li', {}, 'One-time event listeners'),
                h('li', {}, 'Event data binding and custom properties'),
                h('li', {}, 'Automatic preventDefault and stopPropagation'),
                h('li', {}, 'Error boundaries and safe event handling'),
                h('li', {}, 'Performance tracking and statistics'),
                h('li', {}, 'Memory management and cleanup')
            ])
        ])
    ]);
}

// Initialize framework when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new MiniFramework({
        container: '#app',
        debug: true,
        events: {
            delegation: true,
            debug: true,
            enableStats: true
        }
    });

    app.init();
    
    // Set up event delegation for the demo
    app.events.on('.delegated-item', 'click', (event) => {
        const item = event.currentTarget.dataset.item;
        console.log(`🎯 Delegated click on ${item}!`);
        event.currentTarget.style.transform = 'scale(0.95)';
        setTimeout(() => {
            event.currentTarget.style.transform = 'scale(1)';
        }, 150);
    });

    // Set up some global event listeners to show delegation
    app.events.on('.btn', 'mouseenter', (event) => {
        event.currentTarget.style.opacity = '0.8';
    });

    app.events.on('.btn', 'mouseleave', (event) => {
        event.currentTarget.style.opacity = '1';
    });
    
    // Render the enhanced demo component
    const demoComponent = EnhancedEventDemo({ initialCount: 0 });
    app.render(demoComponent);
    
    console.log('🎉 Enhanced Event Demo rendered!');
    console.log('🎯 EventManager stats:', app.events.getStats());
    console.log('📊 Virtual node structure:', demoComponent);
    
    // Demonstrate programmatic events after a delay
    setTimeout(() => {
        console.log('🚀 Emitting custom event...');
        app.events.emit('.demo-container', 'customEvent', { 
            message: 'This is a custom event!',
            timestamp: Date.now()
        });
    }, 2000);
    
    // Log event stats periodically
    setInterval(() => {
        const stats = app.events.getStats();
        if (stats.eventsProcessed > 0) {
            console.log('📈 Event Stats:', stats);
        }
    }, 10000);
});