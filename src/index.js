/**
 * Mini Framework - Main Entry Point
 * A lightweight, modular JavaScript framework
 */

import { MiniFramework } from './core/index.js';

// Export the main framework class
export { MiniFramework };

// Export individual modules for advanced usage
export * from './core/index.js';
export * from './utils/index.js';

// Auto-initialize for browser usage
if (typeof window !== 'undefined') {
    window.MiniFramework = MiniFramework;
    
    // Simple demo initialization
    document.addEventListener('DOMContentLoaded', () => {
        const appElement = document.getElementById('app');
        if (appElement && appElement.textContent.includes('Framework will render here')) {
            appElement.innerHTML = `
                <h2>Mini Framework Loaded Successfully!</h2>
                <p>Ready for development...</p>
                <small>Check console for framework instance</small>
            `;
            console.log('Mini Framework initialized:', MiniFramework);
        }
    });
}