/**
 * TodoMVC Application Entry Point
 * Using Mini Framework
 */

import { MiniFramework } from '../../src/index.js';
import TodoApp from './components/TodoApp.js';

// Initialize the framework
const framework = new MiniFramework({
    container: '#todoapp',
    debug: false,
    routing: {
        mode: 'hash',
        base: ''
    }
});

// Create TodoMVC app instance
const todoApp = new TodoApp(framework);

// Render function
function render() {
    const appElement = document.getElementById('todoapp');
    if (appElement) {
        // Clear existing content
        appElement.innerHTML = '';
        
        // Ensure the container has the todoapp class
        appElement.className = 'todoapp';
        
        // Render the TodoMVC app
        const vnode = todoApp.render();
        framework.dom.render(vnode, appElement);
    }
}

// Setup reactive rendering
framework.state.subscribe(() => {
    render();
});

// Setup router change event handling
framework.router.events.on(window, 'navigate', () => {
    render();
});

// Initialize the framework and render
framework.init();

// Ensure the state is initialized before rendering
todoApp.initializeState();

// Initial render
render();
console.log('TodoMVC app initialized with Mini Framework');

// Export for debugging
window.todoApp = todoApp;
window.framework = framework;