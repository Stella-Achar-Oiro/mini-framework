# Mini Framework API Reference

## Overview

The Mini Framework is a lightweight, modular JavaScript framework that provides essential features for building modern web applications without external dependencies.

## Core Classes

### MiniFramework

The main framework class that orchestrates all features.

#### Constructor

```javascript
new MiniFramework(options)
```

**Parameters:**
- `options` (Object): Configuration options
  - `container` (string): CSS selector for container element
  - `state` (Object): Initial state object
  - `routes` (Object): Route definitions
  - `debug` (boolean): Enable debug mode
  - `plugins` (Array): Plugin configurations
  - `strictMode` (boolean): Enable strict mode for development

**Example:**

```javascript
const framework = new MiniFramework({
  container: '#app',
  state: { count: 0 },
  debug: true,
  routes: {
    '/': () => ({ tag: 'div', children: ['Home'] }),
    '/about': () => ({ tag: 'div', children: ['About'] })
  }
});
```

#### Methods

##### `init()`

Initializes the framework and starts the application.

```javascript
framework.init();
```

**Returns:** `void`

##### `render(vnode)`

Renders a virtual node to the DOM.

```javascript
framework.render({
  tag: 'div',
  attributes: { class: 'container' },
  children: ['Hello World']
});
```

**Parameters:**
- `vnode` (Object|Function): Virtual node or render function

##### `destroy()`

Destroys the framework instance and cleans up resources.

```javascript
framework.destroy();
```

**Returns:** `void`

### StateManager

Manages application state with reactive updates.

#### Constructor

```javascript
new StateManager(initialState, debug, options)
```

**Parameters:**
- `initialState` (Object): Initial state object
- `debug` (boolean): Enable debug mode
- `options` (Object): Additional options
  - `maxHistory` (number): Maximum history entries (default: 50)
  - `enablePersistence` (boolean): Enable localStorage persistence
  - `persistenceKey` (string): localStorage key
  - `enableBatching` (boolean): Enable update batching
  - `batchDelay` (number): Batching delay in ms

#### Methods

##### `getState(path)`

Gets state value at the specified path.

```javascript
const value = stateManager.getState('user.name');
const allState = stateManager.getState();
```

**Parameters:**
- `path` (string, optional): Dot-notation path to value

**Returns:** Any value at the path, or entire state if no path

##### `setState(pathOrState, value, options)`

Sets state value(s).

```javascript
// Set by path
await stateManager.setState('user.name', 'John');

// Set by object merge
await stateManager.setState({ user: { name: 'John' } });

// Set by function
await stateManager.setState(state => ({ ...state, count: state.count + 1 }));
```

**Parameters:**
- `pathOrState` (string|Object|Function): Path, state object, or update function
- `value` (any, optional): Value to set (when using path)
- `options` (Object, optional): Update options

**Returns:** `Promise<void>`

##### `mergeState(path, updates)`

Merges updates into existing state at path.

```javascript
await stateManager.mergeState('user', { age: 30, city: 'NYC' });
```

**Parameters:**
- `path` (string): Dot-notation path
- `updates` (Object): Updates to merge

**Returns:** `Promise<void>`

##### `deleteState(path)`

Deletes a property from state.

```javascript
await stateManager.deleteState('user.age');
```

**Parameters:**
- `path` (string): Dot-notation path to delete

**Returns:** `Promise<void>`

##### `subscribe(callback, options)`

Subscribes to state changes.

```javascript
const unsubscribe = stateManager.subscribe((newState, prevState, changeInfo) => {
  console.log('State changed:', changeInfo);
});

// Path-specific subscription
const unsubscribe = stateManager.subscribe(callback, {
  path: 'user.name',
  debounce: 100
});
```

**Parameters:**
- `callback` (Function): Callback function
- `options` (Object, optional): Subscription options
  - `path` (string): Path to watch
  - `condition` (Function): Condition function
  - `once` (boolean): One-time subscription
  - `debounce` (number): Debounce delay in ms
  - `immediate` (boolean): Call immediately with current state

**Returns:** `Function` - Unsubscribe function

##### `computed(name, computeFn)`

Creates a computed property.

```javascript
stateManager.computed('fullName', (state) => 
  `${state.firstName} ${state.lastName}`
);

const fullName = stateManager.getState('fullName');
```

**Parameters:**
- `name` (string): Computed property name
- `computeFn` (Function): Compute function

##### `batch(updateFn)`

Batches multiple state updates.

```javascript
await stateManager.batch(() => {
  stateManager.setState('count', 1);
  stateManager.setState('name', 'John');
  stateManager.setState('active', true);
});
```

**Parameters:**
- `updateFn` (Function): Function containing updates

**Returns:** `Promise<void>`

### DOM

Provides virtual DOM functionality and efficient DOM manipulation.

#### Constructor

```javascript
new DOM(options, eventManager)
```

**Parameters:**
- `options` (Object): DOM configuration options
- `eventManager` (EventManager, optional): Event manager instance

#### Methods

##### `createElement(vnode)`

Creates a DOM element from a virtual node.

```javascript
const element = dom.createElement({
  tag: 'div',
  attributes: { class: 'container', id: 'main' },
  children: [
    'Hello ',
    { tag: 'strong', children: ['World'] }
  ]
});
```

**Parameters:**
- `vnode` (Object|string|number): Virtual node, text content, or number

**Returns:** `Element` - DOM element

##### `diff(oldVNode, newVNode)`

Computes differences between two virtual nodes.

```javascript
const patches = dom.diff(oldVNode, newVNode);
```

**Parameters:**
- `oldVNode` (Object): Old virtual node
- `newVNode` (Object): New virtual node

**Returns:** `Array` - Array of patch operations

##### `patch(element, patches)`

Applies patches to a DOM element.

```javascript
dom.patch(element, patches);
```

**Parameters:**
- `element` (Element): DOM element to patch
- `patches` (Array): Array of patch operations

##### `batch(operations)`

Batches multiple DOM operations for performance.

```javascript
const results = dom.batch([
  () => document.createElement('div'),
  () => document.createElement('span'),
  () => document.createElement('p')
]);
```

**Parameters:**
- `operations` (Array): Array of operation functions

**Returns:** `Array` - Results of operations

### Router

Provides client-side routing with history API and hash routing support.

#### Constructor

```javascript
new Router(options)
```

**Parameters:**
- `options` (Object): Router configuration
  - `mode` (string): 'history' or 'hash' (default: 'hash')
  - `base` (string): Base path for history mode
  - `scrollBehavior` (string): Scroll behavior on navigation

#### Methods

##### `addRoute(path, component, options)`

Adds a route to the router.

```javascript
router.addRoute('/', HomeComponent);
router.addRoute('/user/:id', UserComponent);
router.addRoute('/posts/:category/:slug', PostComponent);

// With options
router.addRoute('/protected', ProtectedComponent, {
  beforeEnter: (to, from) => {
    return isAuthenticated();
  }
});
```

**Parameters:**
- `path` (string): Route path with optional parameters
- `component` (Function): Component function
- `options` (Object, optional): Route options
  - `beforeEnter` (Function): Route guard function
  - `lazy` (boolean): Enable lazy loading
  - `transition` (Object): Transition configuration

##### `navigate(path)`

Navigates to a specific path.

```javascript
await router.navigate('/user/123');
await router.navigate('/posts/tech/javascript-tips?sort=date');
```

**Parameters:**
- `path` (string): Path to navigate to

**Returns:** `Promise<void>`

##### `push(path)`

Pushes a new entry to history.

```javascript
await router.push('/new-page');
```

**Parameters:**
- `path` (string): Path to push

**Returns:** `Promise<void>`

##### `replace(path)`

Replaces current history entry.

```javascript
await router.replace('/login');
```

**Parameters:**
- `path` (string): Path to replace with

**Returns:** `Promise<void>`

##### `back()`

Navigates back in history.

```javascript
await router.back();
```

**Returns:** `Promise<void>`

##### `forward()`

Navigates forward in history.

```javascript
await router.forward();
```

**Returns:** `Promise<void>`

##### `beforeEach(guard)`

Adds a global route guard.

```javascript
router.beforeEach((to, from) => {
  if (to.path.startsWith('/admin') && !isAdmin()) {
    return '/login';
  }
  return true;
});
```

**Parameters:**
- `guard` (Function): Global guard function

## Helper Functions

### HTML Element Helpers

The framework provides convenient helper functions for creating virtual nodes:

```javascript
import { div, h1, p, button, ul, li } from './src/utils/helpers.js';

// Create elements
div({ class: 'container' }, 'Content');
h1('Page Title');
p('Paragraph text');
button({ onclick: handleClick }, 'Click me');

// Create lists
ul(
  li('Item 1'),
  li('Item 2'),
  li('Item 3')
);
```

Available helpers:
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Text: `div`, `span`, `p`
- Links: `a`
- Media: `img`
- Forms: `form`, `input`, `textarea`, `select`, `option`, `button`
- Lists: `ul`, `ol`, `li`
- Tables: `table`, `tr`, `td`, `th`
- Semantic: `header`, `footer`, `nav`, `main`, `section`, `article`, `aside`

### Utility Functions

#### `escapeHtml(str)`

Escapes HTML special characters.

```javascript
const safe = escapeHtml('<script>alert("xss")</script>');
// Returns: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
```

#### `deepClone(obj)`

Creates a deep clone of an object.

```javascript
const cloned = deepClone({ a: 1, b: { c: 2 } });
```

#### `deepEqual(obj1, obj2)`

Performs deep equality comparison.

```javascript
const isEqual = deepEqual(obj1, obj2);
```

#### `deepMerge(...objects)`

Merges multiple objects deeply.

```javascript
const merged = deepMerge(obj1, obj2, obj3);
```

#### `debounce(fn, delay)`

Creates a debounced function.

```javascript
const debouncedFn = debounce(() => console.log('Called'), 300);
```

#### `throttle(fn, delay)`

Creates a throttled function.

```javascript
const throttledFn = throttle(() => console.log('Called'), 300);
```

#### `get(obj, path, defaultValue)`

Gets a value from an object by path.

```javascript
const value = get(obj, 'user.profile.name', 'Unknown');
```

#### `set(obj, path, value)`

Sets a value in an object by path.

```javascript
set(obj, 'user.profile.name', 'John');
```

## Event Handling

The framework provides comprehensive event handling through the EventManager class.

### Event Delegation

Events are automatically delegated for performance:

```javascript
// Events are handled efficiently even for dynamically added elements
button({ onclick: handleClick }, 'Click me');
```

### Event Options

Support for various event options:

```javascript
button({
  onclick: handleClick,
  onmouseenter: { handler: handleHover, passive: true },
  ontouchmove: { handler: handleTouch, debounce: 100 }
}, 'Interactive Button');
```

## Virtual Node Structure

Virtual nodes follow this structure:

```javascript
{
  tag: 'div',                    // Element tag name
  attributes: {                  // Element attributes
    class: 'container',
    id: 'main',
    onclick: handleClick
  },
  children: [                    // Child nodes
    'Text content',              // Text nodes
    {                           // Nested elements
      tag: 'span',
      children: ['Nested content']
    }
  ],
  key: 'unique-key'             // Optional key for reconciliation
}
```

## Performance Considerations

### State Updates
- Use `batch()` for multiple state updates
- Leverage path-specific subscriptions to reduce unnecessary renders
- Use computed properties for derived state

### DOM Operations
- Virtual DOM diffing minimizes actual DOM manipulations
- Event delegation reduces memory usage
- Batch DOM operations when possible

### Memory Management
- Unsubscribe from state changes when components unmount
- Use weak references where appropriate
- Clean up event listeners automatically

## Error Handling

The framework includes comprehensive error boundaries:

```javascript
// Errors are caught and handled gracefully
const framework = new MiniFramework({
  debug: true,  // Enable detailed error reporting
  onError: (error, context) => {
    console.error('Framework error:', error, context);
  }
});
```

## TypeScript Support

While the framework is written in JavaScript, it provides excellent TypeScript compatibility through JSDoc annotations. Type definitions are available for all public APIs.