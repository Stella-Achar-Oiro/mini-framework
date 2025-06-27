# Mini Framework Best Practices

## Table of Contents

1. [State Management](#state-management)
2. [Component Design](#component-design)
3. [Performance Optimization](#performance-optimization)
4. [Error Handling](#error-handling)
5. [Code Organization](#code-organization)
6. [Testing](#testing)
7. [Security](#security)
8. [Accessibility](#accessibility)

## State Management

### ✅ DO: Use Path-Specific Subscriptions

```javascript
// ✅ Good - Subscribe only to relevant state
app.state.subscribe(renderUserProfile, { path: 'user' });
app.state.subscribe(renderTodoList, { path: 'todos' });

// ❌ Avoid - Global subscriptions for specific UI parts
app.state.subscribe(renderEverything);
```

### ✅ DO: Batch State Updates

```javascript
// ✅ Good - Batch multiple updates
await app.state.batch(() => {
  app.state.setState('loading', false);
  app.state.setState('data', responseData);
  app.state.setState('error', null);
});

// ❌ Avoid - Individual updates causing multiple re-renders
await app.state.setState('loading', false);
await app.state.setState('data', responseData);
await app.state.setState('error', null);
```

### ✅ DO: Use Computed Properties for Derived State

```javascript
// ✅ Good - Computed properties for derived data
app.state.computed('completedTodos', (state) => 
  state.todos.filter(todo => todo.completed)
);

app.state.computed('todoStats', (state) => ({
  total: state.todos.length,
  completed: state.todos.filter(t => t.completed).length,
  active: state.todos.filter(t => !t.completed).length
}));

// ❌ Avoid - Calculating derived state in components
function TodoStats() {
  const todos = app.state.getState('todos');
  const completed = todos.filter(t => t.completed).length; // Recalculated every render
  const active = todos.filter(t => !t.completed).length;
  
  return div(`${completed}/${todos.length} completed`);
}
```

### ✅ DO: Keep State Flat When Possible

```javascript
// ✅ Good - Flat, normalized state
{
  users: {
    '1': { id: 1, name: 'John' },
    '2': { id: 2, name: 'Jane' }
  },
  todos: {
    '1': { id: 1, text: 'Buy milk', userId: 1 },
    '2': { id: 2, text: 'Walk dog', userId: 2 }
  },
  userTodos: {
    '1': ['1'],
    '2': ['2']
  }
}

// ❌ Avoid - Deeply nested state
{
  users: [
    {
      id: 1,
      name: 'John',
      todos: [
        { id: 1, text: 'Buy milk' }
      ]
    }
  ]
}
```

### ✅ DO: Use Immutable Updates

```javascript
// ✅ Good - Immutable updates
await app.state.setState('todos', todos => [
  ...todos,
  { id: Date.now(), text: newTodo, completed: false }
]);

// ❌ Avoid - Mutating existing state
const todos = app.state.getState('todos');
todos.push({ id: Date.now(), text: newTodo, completed: false });
await app.state.setState('todos', todos);
```

## Component Design

### ✅ DO: Create Pure, Functional Components

```javascript
// ✅ Good - Pure functional component
function UserCard({ user }) {
  return div({ class: 'user-card' },
    img({ src: user.avatar, alt: user.name }),
    h3(user.name),
    p(user.email)
  );
}

// ❌ Avoid - Components with side effects
function UserCard({ user }) {
  // Side effect - should be in event handler
  fetch(`/api/users/${user.id}/activity`);
  
  return div({ class: 'user-card' },
    img({ src: user.avatar, alt: user.name }),
    h3(user.name),
    p(user.email)
  );
}
```

### ✅ DO: Use Composition Over Complex Components

```javascript
// ✅ Good - Composed components
function UserProfile() {
  const user = app.state.getState('user');
  
  return div({ class: 'profile' },
    UserHeader({ user }),
    UserDetails({ user }),
    UserActions({ user })
  );
}

function UserHeader({ user }) {
  return header({ class: 'profile-header' },
    img({ src: user.avatar, alt: user.name }),
    h1(user.name)
  );
}

// ❌ Avoid - Monolithic components
function UserProfile() {
  const user = app.state.getState('user');
  
  return div({ class: 'profile' },
    // 100+ lines of mixed concerns
  );
}
```

### ✅ DO: Use Keys for Dynamic Lists

```javascript
// ✅ Good - Use unique keys for list items
function TodoList() {
  const todos = app.state.getState('todos');
  
  return ul({ class: 'todo-list' },
    ...todos.map(todo => 
      li({ key: todo.id, class: todo.completed ? 'completed' : '' },
        TodoItem({ todo })
      )
    )
  );
}

// ❌ Avoid - No keys or array indices as keys
function TodoList() {
  const todos = app.state.getState('todos');
  
  return ul({ class: 'todo-list' },
    ...todos.map((todo, index) => 
      li({ key: index }, // Don't use array index
        TodoItem({ todo })
      )
    )
  );
}
```

### ✅ DO: Validate Component Props

```javascript
// ✅ Good - Validate props
function Button({ text, onClick, disabled = false, variant = 'primary' }) {
  if (!text) {
    console.warn('Button: text prop is required');
    return null;
  }
  
  if (typeof onClick !== 'function') {
    console.warn('Button: onClick must be a function');
  }
  
  return button({
    class: `btn btn-${variant}`,
    disabled,
    onclick: onClick
  }, text);
}

// ❌ Avoid - No prop validation
function Button({ text, onClick, disabled, variant }) {
  return button({
    class: `btn btn-${variant}`,
    disabled,
    onclick: onClick
  }, text);
}
```

## Performance Optimization

### ✅ DO: Use Debouncing for Expensive Operations

```javascript
// ✅ Good - Debounce search input
function SearchInput() {
  return input({
    type: 'text',
    placeholder: 'Search...',
    oninput: {
      handler: (e) => performSearch(e.target.value),
      debounce: 300
    }
  });
}

// ❌ Avoid - No debouncing for expensive operations
function SearchInput() {
  return input({
    type: 'text',
    placeholder: 'Search...',
    oninput: (e) => performSearch(e.target.value) // Called on every keystroke
  });
}
```

### ✅ DO: Lazy Load Routes and Components

```javascript
// ✅ Good - Lazy loaded routes
const routes = {
  '/': () => HomePage(),
  '/profile': {
    component: () => import('./ProfilePage.js'),
    lazy: true
  },
  '/admin': {
    component: () => import('./AdminPage.js'),
    lazy: true,
    beforeEnter: requireAdmin
  }
};

// ❌ Avoid - All components loaded upfront
import HomePage from './HomePage.js';
import ProfilePage from './ProfilePage.js';
import AdminPage from './AdminPage.js';

const routes = {
  '/': () => HomePage(),
  '/profile': () => ProfilePage(),
  '/admin': () => AdminPage()
};
```

### ✅ DO: Optimize Event Handlers

```javascript
// ✅ Good - Event delegation and optimizations
function TodoList() {
  const todos = app.state.getState('todos');
  
  return ul({
    class: 'todo-list',
    onclick: (e) => {
      if (e.target.matches('.toggle')) {
        const todoId = e.target.dataset.todoId;
        toggleTodo(todoId);
      }
    }
  },
    ...todos.map(todo =>
      li(
        input({
          type: 'checkbox',
          class: 'toggle',
          'data-todo-id': todo.id,
          checked: todo.completed
        }),
        span(todo.text)
      )
    )
  );
}

// ❌ Avoid - Individual event handlers for each item
function TodoList() {
  const todos = app.state.getState('todos');
  
  return ul({ class: 'todo-list' },
    ...todos.map(todo =>
      li(
        input({
          type: 'checkbox',
          class: 'toggle',
          checked: todo.completed,
          onclick: () => toggleTodo(todo.id) // New function for each render
        }),
        span(todo.text)
      )
    )
  );
}
```

### ✅ DO: Use Passive Event Listeners

```javascript
// ✅ Good - Passive listeners for scroll/touch events
function ScrollableList() {
  return div({
    class: 'scrollable-list',
    onscroll: {
      handler: handleScroll,
      passive: true
    },
    ontouchmove: {
      handler: handleTouchMove,
      passive: true
    }
  }, ...items);
}

// ❌ Avoid - Active listeners for performance-critical events
function ScrollableList() {
  return div({
    class: 'scrollable-list',
    onscroll: handleScroll, // Blocks scroll performance
    ontouchmove: handleTouchMove
  }, ...items);
}
```

## Error Handling

### ✅ DO: Use Error Boundaries

```javascript
// ✅ Good - Wrap components in error boundaries
function App() {
  return div({ class: 'app' },
    ErrorBoundary({
      fallback: (error) => ErrorMessage({ error }),
      onError: (error, context) => logError(error, context)
    },
      Header(),
      Main(),
      Footer()
    )
  );
}

function ErrorMessage({ error }) {
  return div({ class: 'error-message' },
    h2('Something went wrong'),
    p(error.message),
    button({ onclick: () => window.location.reload() }, 'Reload Page')
  );
}
```

### ✅ DO: Handle Async Operations Properly

```javascript
// ✅ Good - Proper async error handling
async function loadUserData(userId) {
  await app.state.setState('user.loading', true);
  await app.state.setState('user.error', null);
  
  try {
    const userData = await fetchUser(userId);
    await app.state.setState('user.data', userData);
  } catch (error) {
    await app.state.setState('user.error', error.message);
    console.error('Failed to load user data:', error);
  } finally {
    await app.state.setState('user.loading', false);
  }
}

// ❌ Avoid - Unhandled async errors
async function loadUserData(userId) {
  const userData = await fetchUser(userId); // May throw
  await app.state.setState('user.data', userData);
}
```

### ✅ DO: Validate Input Data

```javascript
// ✅ Good - Input validation
function createTodo(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Todo text must be a non-empty string');
  }
  
  if (text.trim().length === 0) {
    throw new Error('Todo text cannot be empty');
  }
  
  if (text.length > 255) {
    throw new Error('Todo text must be less than 255 characters');
  }
  
  return {
    id: generateId(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
}

// ❌ Avoid - No input validation
function createTodo(text) {
  return {
    id: generateId(),
    text: text,
    completed: false,
    createdAt: new Date().toISOString()
  };
}
```

## Code Organization

### ✅ DO: Organize by Feature

```
src/
├── components/
│   ├── common/
│   │   ├── Button.js
│   │   ├── Modal.js
│   │   └── index.js
│   └── todos/
│       ├── TodoList.js
│       ├── TodoItem.js
│       ├── TodoForm.js
│       └── index.js
├── utils/
│   ├── api.js
│   ├── validation.js
│   └── helpers.js
├── state/
│   ├── todos.js
│   ├── user.js
│   └── index.js
└── app.js
```

### ✅ DO: Use Consistent Naming Conventions

```javascript
// ✅ Good - Consistent naming
const userActions = {
  loadUser: async (userId) => { /* ... */ },
  updateUser: async (userId, updates) => { /* ... */ },
  deleteUser: async (userId) => { /* ... */ }
};

const todoActions = {
  loadTodos: async () => { /* ... */ },
  createTodo: async (text) => { /* ... */ },
  updateTodo: async (id, updates) => { /* ... */ },
  deleteTodo: async (id) => { /* ... */ }
};

// ❌ Avoid - Inconsistent naming
const userActions = {
  getUser: async (userId) => { /* ... */ },
  updateUserInfo: async (userId, updates) => { /* ... */ },
  removeUser: async (userId) => { /* ... */ }
};
```

### ✅ DO: Export Clean APIs

```javascript
// ✅ Good - Clean module exports
// todos/index.js
export { TodoList } from './TodoList.js';
export { TodoItem } from './TodoItem.js';
export { TodoForm } from './TodoForm.js';
export { todoActions } from './actions.js';
export { todoState } from './state.js';

// Usage
import { TodoList, todoActions } from './components/todos';

// ❌ Avoid - Direct file imports
import { TodoList } from './components/todos/TodoList.js';
import { createTodo, updateTodo } from './components/todos/actions.js';
```

## Testing

### ✅ DO: Write Unit Tests for Components

```javascript
// ✅ Good - Component unit tests
describe('TodoItem', () => {
  it('should render todo text', () => {
    const todo = { id: 1, text: 'Buy milk', completed: false };
    const element = dom.createElement(TodoItem({ todo }));
    
    expect(element.textContent).toContain('Buy milk');
  });
  
  it('should call onToggle when checkbox clicked', () => {
    const todo = { id: 1, text: 'Buy milk', completed: false };
    const onToggle = vi.fn();
    const element = dom.createElement(TodoItem({ todo, onToggle }));
    
    const checkbox = element.querySelector('.toggle');
    checkbox.click();
    
    expect(onToggle).toHaveBeenCalledWith(1);
  });
});
```

### ✅ DO: Test State Management Logic

```javascript
// ✅ Good - State management tests
describe('todo state', () => {
  let stateManager;
  
  beforeEach(() => {
    stateManager = new StateManager();
  });
  
  it('should add new todo', async () => {
    await stateManager.setState('todos', []);
    await addTodo(stateManager, 'Buy milk');
    
    const todos = stateManager.getState('todos');
    expect(todos).toHaveLength(1);
    expect(todos[0].text).toBe('Buy milk');
  });
});
```

### ✅ DO: Test Integration Scenarios

```javascript
// ✅ Good - Integration tests
describe('Todo App Integration', () => {
  it('should complete full todo workflow', async () => {
    const app = new MiniFramework({
      container: document.createElement('div')
    });
    app.init();
    
    // Add todo
    await addTodo(app, 'Buy milk');
    expect(app.state.getState('todos')).toHaveLength(1);
    
    // Toggle todo
    await toggleTodo(app, todos[0].id);
    expect(app.state.getState('todos.0.completed')).toBe(true);
    
    // Delete todo
    await deleteTodo(app, todos[0].id);
    expect(app.state.getState('todos')).toHaveLength(0);
  });
});
```

## Security

### ✅ DO: Sanitize User Input

```javascript
// ✅ Good - Sanitize HTML content
import { escapeHtml } from './utils/helpers.js';

function CommentComponent({ comment }) {
  return div({ class: 'comment' },
    h4(escapeHtml(comment.author)),
    p(escapeHtml(comment.text)),
    span({ class: 'date' }, formatDate(comment.createdAt))
  );
}

// ❌ Avoid - Unsanitized user content
function CommentComponent({ comment }) {
  return div({ class: 'comment' },
    h4(comment.author), // XSS vulnerability
    p(comment.text),    // XSS vulnerability
    span({ class: 'date' }, formatDate(comment.createdAt))
  );
}
```

### ✅ DO: Validate and Sanitize URLs

```javascript
// ✅ Good - URL validation
function isValidUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function LinkComponent({ href, children }) {
  if (!isValidUrl(href)) {
    console.warn('Invalid URL provided to LinkComponent:', href);
    return span(children);
  }
  
  return a({ href, rel: 'noopener noreferrer' }, children);
}

// ❌ Avoid - No URL validation
function LinkComponent({ href, children }) {
  return a({ href }, children); // Potential security risk
}
```

## Accessibility

### ✅ DO: Use Semantic HTML

```javascript
// ✅ Good - Semantic HTML structure
function TodoApp() {
  return main({ class: 'todo-app' },
    header({ class: 'app-header' },
      h1('Todo Application')
    ),
    section({ class: 'todo-section' },
      TodoForm(),
      TodoList()
    )
  );
}

// ❌ Avoid - Non-semantic structure
function TodoApp() {
  return div({ class: 'todo-app' },
    div({ class: 'app-header' },
      div({ class: 'title' }, 'Todo Application')
    ),
    div({ class: 'todo-section' },
      TodoForm(),
      TodoList()
    )
  );
}
```

### ✅ DO: Include ARIA Labels and Roles

```javascript
// ✅ Good - Accessible form elements
function TodoForm() {
  return form({ 
    class: 'todo-form',
    onsubmit: handleSubmit,
    role: 'form',
    'aria-label': 'Add new todo'
  },
    label({ for: 'new-todo' }, 'New Todo:'),
    input({
      id: 'new-todo',
      type: 'text',
      placeholder: 'What needs to be done?',
      'aria-label': 'New todo text',
      required: true
    }),
    button({
      type: 'submit',
      'aria-label': 'Add todo'
    }, 'Add')
  );
}

// ❌ Avoid - Missing accessibility attributes
function TodoForm() {
  return form({ class: 'todo-form', onsubmit: handleSubmit },
    input({
      type: 'text',
      placeholder: 'What needs to be done?'
    }),
    button({ type: 'submit' }, 'Add')
  );
}
```

### ✅ DO: Ensure Keyboard Navigation

```javascript
// ✅ Good - Keyboard accessible
function ModalDialog({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return div({
    class: 'modal-overlay',
    onclick: (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    onkeydown: (e) => {
      if (e.key === 'Escape') onClose();
    }
  },
    div({
      class: 'modal-content',
      role: 'dialog',
      'aria-modal': 'true',
      tabindex: '-1'
    },
      button({
        class: 'close-button',
        onclick: onClose,
        'aria-label': 'Close dialog'
      }, '×'),
      children
    )
  );
}

// ❌ Avoid - No keyboard support
function ModalDialog({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return div({ class: 'modal-overlay', onclick: onClose },
    div({ class: 'modal-content' },
      button({ onclick: onClose }, '×'),
      children
    )
  );
}
```

By following these best practices, you'll build more maintainable, performant, and accessible applications with Mini Framework.