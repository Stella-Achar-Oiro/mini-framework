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

// Initialize the framework first
try {
    framework.init();
    console.log('Mini Framework initialized');
} catch (error) {
    console.error('Failed to initialize Mini Framework:', error);
    throw error;
}

// Create TodoMVC app instance after framework is initialized
const todoApp = new TodoApp(framework);

// Render function
function render() {
    const appElement = document.getElementById('todoapp');
    if (appElement) {
        // Clear existing content
        appElement.innerHTML = '';

        // Render the TodoMVC app
        const vnode = todoApp.render();
        framework.dom.render(vnode, appElement);
    }
}

// Setup reactive rendering
framework.state.subscribe(() => {
    render();
});

// Setup router change rendering
window.addEventListener('navigate', () => {
    render();
});

// Initial render
try {
    render();
    console.log('TodoMVC app initialized with Mini Framework');
} catch (error) {
    console.error('Failed to render TodoMVC:', error);
}

// Export for debugging
window.todoApp = todoApp;
window.framework = framework;