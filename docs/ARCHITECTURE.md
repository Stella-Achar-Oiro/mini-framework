# Mini Framework Architecture

## Overview

The Mini Framework is designed with a modular architecture that separates concerns while maintaining tight integration between components. This document explains the internal architecture and design decisions.

## Core Design Principles

### 1. Modularity
Each core system (DOM, State, Router, Events) operates independently but can communicate through well-defined interfaces.

### 2. Performance
- Virtual DOM for efficient updates
- Event delegation for memory efficiency  
- Batched state updates to minimize re-renders
- Lazy loading and code splitting support

### 3. Developer Experience
- Intuitive API design
- Comprehensive error handling
- Debugging tools and logging
- TypeScript-friendly with JSDoc annotations

### 4. Zero Dependencies
The framework is completely self-contained with no external dependencies.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MiniFramework                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │    State    │ │     DOM     │ │   Router    │ │ Events │ │
│  │  Manager    │ │ Abstraction │ │   System    │ │Manager │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
│         │               │               │            │      │
│         └───────────────┼───────────────┼────────────┘      │
│                         │               │                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Utilities                             │ │
│  │  • Helpers  • Error Boundary  • Logger  • Config      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Systems

### MiniFramework (Orchestrator)

The main framework class that coordinates all subsystems.

**Responsibilities:**
- Initialize and configure subsystems
- Manage framework lifecycle
- Coordinate communication between systems
- Handle global error boundaries
- Provide unified API

**Key Features:**
- Lifecycle management (created → mounting → mounted → updating → updated → destroyed)
- Plugin system for extensibility
- Performance monitoring and metrics
- Debug mode with comprehensive logging

### StateManager

Reactive state management with immutable updates.

**Architecture:**

```
StateManager
├── State Storage (Proxy-wrapped for reactivity)
├── Subscription System
│   ├── Global subscriptions
│   ├── Path-specific subscriptions  
│   └── Computed properties
├── Middleware Pipeline
├── History Tracking (optional)
└── Persistence Layer (optional)
```

**Key Features:**

1. **Reactive Updates**: Uses Proxy objects to detect state changes
2. **Path-based Subscriptions**: Subscribe to specific state paths
3. **Computed Properties**: Derived state with automatic dependency tracking
4. **Middleware Support**: Transform state changes
5. **Batching**: Group multiple updates for performance
6. **History**: Undo/redo functionality
7. **Persistence**: localStorage integration

**State Update Flow:**

```
setState() → Middleware Pipeline → State Mutation → Notify Subscribers → Re-render
```

### DOM Abstraction

Virtual DOM implementation for efficient DOM manipulation.

**Architecture:**

```
DOM
├── Virtual Node System
│   ├── Element nodes
│   ├── Text nodes
│   ├── Comment nodes
│   └── Fragment nodes
├── Diffing Algorithm
│   ├── Tree diffing
│   ├── Key-based reconciliation
│   └── Minimal patch generation
├── Patching System
│   ├── Element updates
│   ├── Attribute updates
│   └── Children reconciliation
└── Performance Optimizations
    ├── Element caching
    ├── Event delegation
    └── Batch updates
```

**Virtual Node Structure:**

```javascript
{
  tag: 'div',                    // Element type
  attributes: {                  // Props and attributes
    class: 'container',
    onclick: handler
  },
  children: [...],              // Child nodes
  key: 'unique-key',            // Reconciliation key
  _vnode: true,                 // Internal flag
  _element: domElement          // Cached DOM reference
}
```

**Diffing Algorithm:**

1. **Text Node Diffing**: Direct content comparison
2. **Element Diffing**: Tag name, attributes, and children comparison
3. **Children Diffing**: Key-based reconciliation with LCS algorithm
4. **Patch Generation**: Minimal set of operations to transform DOM

### Router System

Client-side routing with history API and hash routing support.

**Architecture:**

```
Router
├── Route Registry
│   ├── Static routes
│   ├── Parameterized routes
│   ├── Wildcard routes
│   └── Regex routes
├── Navigation System
│   ├── History management
│   ├── Hash management
│   └── Base path handling
├── Route Guards
│   ├── Global guards
│   ├── Route-specific guards
│   └── Async guard support
├── Transition System
│   ├── Route transitions
│   ├── Animation support
│   └── Loading states
└── Lazy Loading
    ├── Dynamic imports
    ├── Code splitting
    └── Preloading
```

**Route Matching:**

1. **Path Parsing**: Convert route patterns to regex
2. **Parameter Extraction**: Extract route parameters
3. **Query Parsing**: Parse query strings
4. **Guard Execution**: Run route guards
5. **Component Resolution**: Resolve route component
6. **Transition Execution**: Handle route transitions

### Event Management

Efficient event handling with delegation and optimization.

**Architecture:**

```
EventManager
├── Event Delegation
│   ├── Root-level listeners
│   ├── Event bubbling
│   └── Target resolution
├── Event Optimization
│   ├── Passive listeners
│   ├── Debouncing
│   └── Throttling
├── Custom Events
│   ├── Framework events
│   ├── Component events
│   └── User events
└── Memory Management
    ├── Automatic cleanup
    ├── Weak references
    └── Listener tracking
```

**Event Flow:**

```
DOM Event → Event Delegation → Handler Resolution → Event Processing → Cleanup
```

## Data Flow

### 1. Application Initialization

```
new MiniFramework() → Configure Systems → Initialize Subsystems → Ready State
```

### 2. State Updates

```
User Action → Event Handler → setState() → State Validation → 
Middleware → State Mutation → Subscriber Notification → Component Re-render → DOM Update
```

### 3. Route Navigation

```
URL Change → Route Matching → Guard Execution → Component Resolution → 
State Update → Re-render → Transition Animation
```

### 4. DOM Updates

```
Component Render → Virtual Node Creation → Diff Calculation → 
Patch Generation → DOM Mutation → Event Binding
```

## Performance Optimizations

### 1. Virtual DOM
- Minimal DOM manipulations through diffing
- Key-based reconciliation for lists
- Batch DOM updates to avoid layout thrashing

### 2. State Management
- Immutable state updates prevent unnecessary re-renders
- Path-specific subscriptions reduce notification overhead
- Computed properties cache results until dependencies change

### 3. Event Handling
- Event delegation reduces memory usage
- Passive event listeners improve scroll performance
- Debouncing and throttling prevent excessive handler calls

### 4. Bundle Optimization
- Tree shaking support for unused code elimination
- Lazy loading for route-based code splitting
- Module boundaries for better caching

## Memory Management

### 1. Automatic Cleanup
- Unsubscribe from state changes when components unmount
- Remove event listeners automatically
- Clear caches and references on destroy

### 2. Weak References
- Use WeakMap for element caches
- Prevent memory leaks from circular references
- Allow garbage collection of unused objects

### 3. Resource Tracking
- Track subscriptions, listeners, and resources
- Provide cleanup methods for all systems
- Monitor memory usage in debug mode

## Error Handling

### 1. Error Boundaries
- Catch and handle errors at system boundaries
- Prevent error propagation from breaking the application
- Provide recovery mechanisms where possible

### 2. Validation
- Validate state updates and transitions
- Check component structure and props
- Verify route configurations and guards

### 3. Debugging Support
- Comprehensive logging with different levels
- Error context and stack traces
- Performance metrics and warnings

## Extension Points

### 1. Plugins
- Register plugins that extend framework functionality
- Plugin lifecycle hooks for initialization and cleanup
- Access to internal APIs for advanced integrations

### 2. Middleware
- State middleware for transforming updates
- Router middleware for custom navigation logic
- Event middleware for processing or filtering events

### 3. Custom Components
- Component registration system
- Lifecycle hooks for components
- Props validation and transformation

## Testing Architecture

### 1. Unit Testing
- Isolated testing of individual systems
- Mocked dependencies for focused testing
- Comprehensive test coverage of public APIs

### 2. Integration Testing
- End-to-end testing of system interactions
- Real browser environment testing
- Performance regression testing

### 3. Test Utilities
- Framework-specific testing helpers
- Component testing utilities
- State management testing tools

## Build System

### 1. Development Build
- Source maps for debugging
- Hot reloading for development
- Comprehensive error messages

### 2. Production Build
- Minification and optimization
- Dead code elimination
- Bundle splitting and compression

### 3. Module Formats
- UMD for browser globals
- ES modules for modern bundlers
- CommonJS for Node.js compatibility

## Configuration System

### 1. Framework Configuration
- Global settings for behavior modification
- Environment-specific configurations
- Runtime configuration updates

### 2. Build Configuration
- Bundler settings and optimizations
- Development vs production modes
- Custom plugin configurations

### 3. Runtime Configuration
- Dynamic feature enabling/disabling
- Performance tuning parameters
- Debug and logging levels

This architecture provides a solid foundation for building scalable web applications while maintaining excellent performance and developer experience.