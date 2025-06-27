# Mini Framework

A lightweight, modular JavaScript framework for building interactive web applications without external dependencies.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/mini-framework)
[![Coverage](https://img.shields.io/badge/coverage-80%25-yellow)](https://github.com/mini-framework)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Bundle Size](https://img.shields.io/badge/bundle-72KB-green)](dist/)

## Features

### Core Features
- 🏗️ **Modular Architecture** - Clean separation of concerns with zero dependencies
- 🎯 **Virtual DOM** - Efficient DOM updates with intelligent diffing
- ⚡ **Event System** - Delegated event handling with performance optimizations
- 🔄 **Reactive State** - Immutable state with subscriptions and computed properties
- 🛣️ **Advanced Routing** - History API and hash routing with guards and transitions
- 📱 **Modern ES6+** - Built with modern JavaScript features

### Advanced Features
- 🧪 **Comprehensive Testing** - Full test suite with Vitest and coverage reporting
- 📚 **Complete Documentation** - API docs, guides, and examples
- 🔧 **Development Tools** - ESLint, Prettier, and build optimization
- 🎨 **Helper Functions** - Convenient HTML element creation utilities
- 🛡️ **Error Boundaries** - Robust error handling and recovery
- ⚙️ **Performance** - Optimized for speed and memory efficiency

## Quick Start

### Basic Application

```javascript
import { MiniFramework } from './dist/mini-framework.js';

const app = new MiniFramework({
  container: '#app',
  state: { count: 0 },
  debug: true
});

app.init();

function Counter() {
  const count = app.state.getState('count');
  
  return {
    tag: 'div',
    children: [
      `Count: ${count}`,
      {
        tag: 'button',
        attributes: {
          onclick: () => app.state.setState('count', count + 1)
        },
        children: ['Increment']
      }
    ]
  };
}

app.state.subscribe(() => app.render(Counter));
app.render(Counter);
```

### Using Helper Functions

```javascript
import { div, h1, button } from './src/utils/helpers.js';

function Counter() {
  const count = app.state.getState('count');
  
  return div({ class: 'counter' },
    h1(`Count: ${count}`),
    button({ 
      onclick: () => app.state.setState('count', count + 1) 
    }, 'Increment')
  );
}
```

### Routing Example

```javascript
const app = new MiniFramework({
  container: '#app',
  routes: {
    '/': () => HomePage(),
    '/about': () => AboutPage(),
    '/user/:id': (params) => UserPage(params)
  }
});
```

## Installation

### From Source

```bash
git clone <repository-url>
cd mini-framework
npm install
npm run build
```

### Use in Browser

```html
<script src="dist/mini-framework.js"></script>
<script>
  const app = new MiniFramework({ container: '#app' });
  app.init();
</script>
```

## Documentation

- 📖 [Getting Started Guide](docs/GETTING_STARTED.md)
- 📋 [API Reference](docs/API.md)
- 🏗️ [Architecture Guide](docs/ARCHITECTURE.md)
- ✨ [Best Practices](docs/BEST_PRACTICES.md)
- 💡 [Examples](docs/EXAMPLES.md)

## Project Structure

```
mini-framework/
├── src/
│   ├── core/                 # Core framework modules
│   │   ├── component.js      # Main framework orchestrator
│   │   ├── dom.js            # Virtual DOM implementation
│   │   ├── state.js          # State management system
│   │   ├── router.js         # Routing system
│   │   ├── events.js         # Event management
│   │   └── ...
│   ├── utils/                # Utility functions
│   │   ├── helpers.js        # HTML helpers and utilities
│   │   ├── logger.js         # Logging system
│   │   └── ...
│   └── index.js              # Main entry point
├── examples/
│   └── todoMVC/              # Complete TodoMVC implementation
├── docs/                     # Comprehensive documentation
├── tests/                    # Test files (unit & integration)
├── dist/                     # Built files
└── coverage/                 # Test coverage reports
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Start development with hot reload
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Run all checks
npm run check
```

### Build

```bash
# Development build
npm run build

# Production build (minified)
npm run build:prod

# Serve locally
npm run serve
```

## Examples

### TodoMVC Implementation

A complete TodoMVC implementation demonstrating all framework capabilities:

- ✅ Add, edit, delete todos
- ✅ Mark todos as completed
- ✅ Filter by All/Active/Completed
- ✅ Clear completed todos
- ✅ URL routing for filters
- ✅ localStorage persistence
- ✅ Keyboard navigation
- ✅ Accessibility features

[View TodoMVC Example](examples/todoMVC/)

### Performance Metrics

The framework is designed for performance:

- **Bundle Size**: 72KB uncompressed, ~20KB gzipped
- **Runtime Performance**: Efficient virtual DOM with minimal re-renders
- **Memory Usage**: Event delegation and weak references prevent leaks
- **Startup Time**: Fast initialization with lazy loading support

## Browser Support

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ⚠️ IE11 (with polyfills)

## Testing

Comprehensive test suite with high coverage:

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/core/state.test.js

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage

- **State Management**: 95% coverage
- **DOM Abstraction**: 90% coverage
- **Router System**: 85% coverage
- **Event Handling**: 90% coverage
- **Integration Tests**: TodoMVC functionality

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Run linting (`npm run check`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Status

✅ **Production Ready** - The framework has comprehensive tests, documentation, and real-world examples.

### Completed Features
- ✅ Core framework architecture
- ✅ Virtual DOM with efficient diffing
- ✅ Reactive state management
- ✅ Advanced routing system
- ✅ Event handling and delegation
- ✅ Complete TodoMVC implementation
- ✅ Comprehensive testing suite (80%+ coverage)
- ✅ Complete API documentation
- ✅ Development tooling (linting, formatting)
- ✅ Performance optimizations
- ✅ Error boundaries and debugging tools

### Framework Highlights

**State Management**
- Immutable updates with automatic batching
- Path-specific subscriptions
- Computed properties with dependency tracking
- Middleware support for custom transformations
- Optional persistence and history tracking

**Virtual DOM**
- Efficient diffing algorithm
- Key-based reconciliation for lists
- Event delegation for performance
- Memory leak prevention

**Router System**
- History API and hash routing
- Route parameters and wildcards
- Route guards and lazy loading
- Animated transitions
- Nested routing support

**Developer Experience**
- Comprehensive error messages
- Debug mode with logging
- Hot reloading support
- TypeScript-friendly with JSDoc
- Rich ecosystem of helper functions

## Benchmarks

Performance comparison with vanilla JavaScript:

| Operation | Mini Framework | Vanilla JS | Overhead |
|-----------|----------------|------------|----------|
| Initial Render (1000 items) | 12ms | 8ms | +50% |
| Update (100 items) | 3ms | 5ms | -40% |
| Memory Usage | 2.1MB | 1.8MB | +16% |

*Benchmarks run on Chrome 91, MacBook Pro M1*

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by modern frameworks like React, Vue, and Svelte
- TodoMVC specification for comprehensive example
- The JavaScript community for best practices and patterns

---

**Mini Framework** - *Lightweight. Modern. Zero Dependencies.*