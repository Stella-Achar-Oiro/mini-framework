# Mini Framework

A lightweight, modular JavaScript framework for building interactive web applications.

## Features

- **Modular Architecture** - Clean separation of concerns
- **DOM Abstraction** - Virtual DOM-like object structure  
- **Event System** - Custom event handling and delegation
- **State Management** - Reactive state updates
- **Client-side Routing** - Hash and pushState routing
- **ES6+ Modern** - Built with modern JavaScript features
- **Small Bundle** - Lightweight and performant

## Quick Start

```javascript
import { MiniFramework } from './src/index.js';

const app = new MiniFramework({
    container: '#app',
    debug: true
});

app.init();
```

## Project Structure

```
mini-framework/
├── src/
│   ├── core/           # Core framework modules
│   ├── utils/          # Utility functions
│   └── index.js        # Main entry point
├── examples/
│   └── todoMVC/        # TodoMVC implementation
├── docs/               # Documentation
├── tests/              # Test files
└── dist/               # Built files
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Serve locally
npm run serve
```

## Status

 **In Development** - This framework is being built incrementally following a structured prompt system.

### Completed
-  Project setup and architecture
-  Core framework foundation
-  DOM abstraction system
-  Event handling system  
-  State management system
-  Routing system with transitions
-  **TodoMVC implementation** 🎉

### Coming Next
-  Comprehensive testing suite
-  Complete API documentation
-  Performance optimizations
-  Production build tools

## License

MIT