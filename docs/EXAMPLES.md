# Mini Framework Examples

This document provides comprehensive examples of building applications with Mini Framework, from simple components to complex applications.

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [State Management Examples](#state-management-examples)
3. [Router Examples](#router-examples)
4. [Form Examples](#form-examples)
5. [Advanced Patterns](#advanced-patterns)
6. [Real-World Examples](#real-world-examples)

## Basic Examples

### Hello World

The simplest possible Mini Framework application:

```javascript
const app = new MiniFramework({
  container: '#app'
});

app.init();

function HelloWorld() {
  return {
    tag: 'h1',
    children: ['Hello, Mini Framework!']
  };
}

app.render(HelloWorld);
```

### Counter Application

A reactive counter with state management:

```javascript
const app = new MiniFramework({
  container: '#app',
  state: { count: 0 }
});

app.init();

function Counter() {
  const count = app.state.getState('count');
  
  return {
    tag: 'div',
    attributes: { class: 'counter' },
    children: [
      {
        tag: 'h2',
        children: [`Count: ${count}`]
      },
      {
        tag: 'button',
        attributes: {
          onclick: () => app.state.setState('count', count - 1)
        },
        children: ['-']
      },
      {
        tag: 'button',
        attributes: {
          onclick: () => app.state.setState('count', count + 1)
        },
        children: ['+']
      }
    ]
  };
}

// Auto re-render on state changes
app.state.subscribe(() => app.render(Counter));
app.render(Counter);
```

### Using Helper Functions

The same counter using helper functions for cleaner code:

```javascript
import { div, h2, button } from './src/utils/helpers.js';

function Counter() {
  const count = app.state.getState('count');
  
  return div({ class: 'counter' },
    h2(`Count: ${count}`),
    button({ onclick: () => app.state.setState('count', count - 1) }, '-'),
    button({ onclick: () => app.state.setState('count', count + 1) }, '+')
  );
}
```

## State Management Examples

### Todo List with Complex State

```javascript
const app = new MiniFramework({
  container: '#app',
  state: {
    todos: [],
    filter: 'all',
    editingId: null
  }
});

app.init();

// Actions
const actions = {
  async addTodo(text) {
    const todo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    const todos = app.state.getState('todos');
    await app.state.setState('todos', [...todos, todo]);
  },
  
  async toggleTodo(id) {
    const todos = app.state.getState('todos');
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    await app.state.setState('todos', updatedTodos);
  },
  
  async deleteTodo(id) {
    const todos = app.state.getState('todos');
    await app.state.setState('todos', todos.filter(todo => todo.id !== id));
  },
  
  async editTodo(id, newText) {
    const todos = app.state.getState('todos');
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, text: newText } : todo
    );
    await app.state.setState('todos', updatedTodos);
    await app.state.setState('editingId', null);
  },
  
  setFilter(filter) {
    app.state.setState('filter', filter);
  },
  
  setEditing(id) {
    app.state.setState('editingId', id);
  }
};

// Computed properties
app.state.computed('filteredTodos', (state) => {
  const { todos, filter } = state;
  switch (filter) {
    case 'active':
      return todos.filter(todo => !todo.completed);
    case 'completed':
      return todos.filter(todo => todo.completed);
    default:
      return todos;
  }
});

app.state.computed('stats', (state) => {
  const todos = state.todos;
  return {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length
  };
});

// Components
function TodoApp() {
  return div({ class: 'todo-app' },
    h1('Todo List'),
    TodoForm(),
    TodoList(),
    TodoFooter()
  );
}

function TodoForm() {
  let inputRef;
  
  return form({
    class: 'todo-form',
    onsubmit: (e) => {
      e.preventDefault();
      const text = inputRef.value.trim();
      if (text) {
        actions.addTodo(text);
        inputRef.value = '';
      }
    }
  },
    input({
      ref: (el) => inputRef = el,
      type: 'text',
      placeholder: 'What needs to be done?',
      class: 'new-todo'
    })
  );
}

function TodoList() {
  const todos = app.state.getState('filteredTodos') || [];
  
  return ul({ class: 'todo-list' },
    ...todos.map(todo => TodoItem({ todo }))
  );
}

function TodoItem({ todo }) {
  const editingId = app.state.getState('editingId');
  const isEditing = editingId === todo.id;
  
  if (isEditing) {
    return EditingTodoItem({ todo });
  }
  
  return li({
    key: todo.id,
    class: todo.completed ? 'completed' : ''
  },
    div({ class: 'view' },
      input({
        type: 'checkbox',
        class: 'toggle',
        checked: todo.completed,
        onchange: () => actions.toggleTodo(todo.id)
      }),
      label({
        ondblclick: () => actions.setEditing(todo.id)
      }, todo.text),
      button({
        class: 'destroy',
        onclick: () => actions.deleteTodo(todo.id)
      }, '×')
    )
  );
}

function EditingTodoItem({ todo }) {
  let inputRef;
  
  const saveEdit = () => {
    const newText = inputRef.value.trim();
    if (newText) {
      actions.editTodo(todo.id, newText);
    } else {
      actions.deleteTodo(todo.id);
    }
  };
  
  return li({ key: todo.id, class: 'editing' },
    input({
      ref: (el) => {
        inputRef = el;
        if (el) {
          el.value = todo.text;
          el.focus();
          el.select();
        }
      },
      class: 'edit',
      onblur: saveEdit,
      onkeydown: (e) => {
        if (e.key === 'Enter') {
          saveEdit();
        } else if (e.key === 'Escape') {
          app.state.setState('editingId', null);
        }
      }
    })
  );
}

function TodoFooter() {
  const stats = app.state.getState('stats');
  const filter = app.state.getState('filter');
  
  if (stats.total === 0) return null;
  
  return footer({ class: 'footer' },
    span({ class: 'todo-count' },
      `${stats.active} ${stats.active === 1 ? 'item' : 'items'} left`
    ),
    ul({ class: 'filters' },
      FilterLink({ filter: 'all', current: filter, text: 'All' }),
      FilterLink({ filter: 'active', current: filter, text: 'Active' }),
      FilterLink({ filter: 'completed', current: filter, text: 'Completed' })
    ),
    stats.completed > 0 ? button({
      class: 'clear-completed',
      onclick: async () => {
        const activeTodos = app.state.getState('todos').filter(t => !t.completed);
        await app.state.setState('todos', activeTodos);
      }
    }, 'Clear completed') : null
  );
}

function FilterLink({ filter, current, text }) {
  return li(
    a({
      href: `#/${filter === 'all' ? '' : filter}`,
      class: filter === current ? 'selected' : '',
      onclick: (e) => {
        e.preventDefault();
        actions.setFilter(filter);
      }
    }, text)
  );
}

// Auto re-render on state changes
app.state.subscribe(() => app.render(TodoApp));
app.render(TodoApp);
```

### User Management with API Integration

```javascript
const app = new MiniFramework({
  container: '#app',
  state: {
    users: [],
    loading: false,
    error: null,
    selectedUser: null
  }
});

// API service
const userService = {
  async fetchUsers() {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },
  
  async createUser(userData) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },
  
  async updateUser(id, userData) {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },
  
  async deleteUser(id) {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete user');
  }
};

// Actions
const userActions = {
  async loadUsers() {
    await app.state.batch(() => {
      app.state.setState('loading', true);
      app.state.setState('error', null);
    });
    
    try {
      const users = await userService.fetchUsers();
      await app.state.setState('users', users);
    } catch (error) {
      await app.state.setState('error', error.message);
    } finally {
      await app.state.setState('loading', false);
    }
  },
  
  async createUser(userData) {
    try {
      const newUser = await userService.createUser(userData);
      const users = app.state.getState('users');
      await app.state.setState('users', [...users, newUser]);
    } catch (error) {
      await app.state.setState('error', error.message);
    }
  },
  
  async updateUser(id, userData) {
    try {
      const updatedUser = await userService.updateUser(id, userData);
      const users = app.state.getState('users');
      const updatedUsers = users.map(user => 
        user.id === id ? updatedUser : user
      );
      await app.state.setState('users', updatedUsers);
    } catch (error) {
      await app.state.setState('error', error.message);
    }
  },
  
  async deleteUser(id) {
    try {
      await userService.deleteUser(id);
      const users = app.state.getState('users');
      await app.state.setState('users', users.filter(user => user.id !== id));
    } catch (error) {
      await app.state.setState('error', error.message);
    }
  },
  
  selectUser(user) {
    app.state.setState('selectedUser', user);
  }
};

// Load users on app start
app.init().then(() => {
  userActions.loadUsers();
});
```

## Router Examples

### Multi-Page Application

```javascript
const app = new MiniFramework({
  container: '#app',
  routes: {
    '/': () => HomePage(),
    '/users': () => UsersPage(),
    '/users/:id': (params) => UserDetailPage(params),
    '/settings': () => SettingsPage(),
    '/about': () => AboutPage(),
    '*': () => NotFoundPage()
  }
});

app.init();

function App() {
  return div({ class: 'app' },
    Header(),
    main({ class: 'main-content' },
      // Router content will be rendered here
    ),
    Footer()
  );
}

function Header() {
  return header({ class: 'header' },
    nav({ class: 'nav' },
      a({ href: '#/' }, 'Home'),
      a({ href: '#/users' }, 'Users'),
      a({ href: '#/settings' }, 'Settings'),
      a({ href: '#/about' }, 'About')
    )
  );
}

function HomePage() {
  return div({ class: 'page home-page' },
    h1('Welcome to Our App'),
    p('This is the home page of our amazing application.'),
    div({ class: 'quick-actions' },
      a({ href: '#/users', class: 'btn btn-primary' }, 'View Users'),
      a({ href: '#/settings', class: 'btn btn-secondary' }, 'Settings')
    )
  );
}

function UsersPage() {
  const users = app.state.getState('users') || [];
  const loading = app.state.getState('loading');
  const error = app.state.getState('error');
  
  if (loading) {
    return div({ class: 'page users-page' },
      h1('Users'),
      div({ class: 'loading' }, 'Loading users...')
    );
  }
  
  if (error) {
    return div({ class: 'page users-page' },
      h1('Users'),
      div({ class: 'error' }, `Error: ${error}`),
      button({ onclick: userActions.loadUsers }, 'Retry')
    );
  }
  
  return div({ class: 'page users-page' },
    h1('Users'),
    div({ class: 'user-grid' },
      ...users.map(user => UserCard({ user }))
    )
  );
}

function UserCard({ user }) {
  return div({ class: 'user-card' },
    img({ src: user.avatar, alt: user.name }),
    h3(user.name),
    p(user.email),
    a({ href: `#/users/${user.id}` }, 'View Details')
  );
}

function UserDetailPage({ id }) {
  const users = app.state.getState('users') || [];
  const user = users.find(u => u.id === parseInt(id));
  
  if (!user) {
    return div({ class: 'page user-detail-page' },
      h1('User Not Found'),
      p(`No user found with ID: ${id}`),
      a({ href: '#/users' }, '← Back to Users')
    );
  }
  
  return div({ class: 'page user-detail-page' },
    a({ href: '#/users' }, '← Back to Users'),
    div({ class: 'user-detail' },
      img({ src: user.avatar, alt: user.name, class: 'avatar-large' }),
      h1(user.name),
      p(user.email),
      p(user.bio),
      div({ class: 'user-actions' },
        button({ onclick: () => userActions.selectUser(user) }, 'Edit'),
        button({ 
          onclick: () => userActions.deleteUser(user.id),
          class: 'btn-danger'
        }, 'Delete')
      )
    )
  );
}

// Route guards
app.router.beforeEach((to, from) => {
  // Example: Require authentication for certain routes
  if (to.path.startsWith('/settings') && !isAuthenticated()) {
    return '/login';
  }
  return true;
});
```

### Nested Routing

```javascript
const app = new MiniFramework({
  container: '#app',
  routes: {
    '/dashboard': () => DashboardLayout(),
    '/dashboard/overview': () => DashboardOverview(),
    '/dashboard/analytics': () => DashboardAnalytics(),
    '/dashboard/settings': () => DashboardSettings(),
    '/dashboard/users': () => DashboardUsers(),
    '/dashboard/users/:id': (params) => DashboardUserDetail(params)
  }
});

function DashboardLayout() {
  return div({ class: 'dashboard-layout' },
    DashboardSidebar(),
    div({ class: 'dashboard-content' },
      // Nested route content
    )
  );
}

function DashboardSidebar() {
  const currentPath = window.location.hash.slice(1);
  
  return aside({ class: 'dashboard-sidebar' },
    h2('Dashboard'),
    nav({ class: 'sidebar-nav' },
      a({
        href: '#/dashboard/overview',
        class: currentPath === '/dashboard/overview' ? 'active' : ''
      }, 'Overview'),
      a({
        href: '#/dashboard/analytics',
        class: currentPath === '/dashboard/analytics' ? 'active' : ''
      }, 'Analytics'),
      a({
        href: '#/dashboard/users',
        class: currentPath.startsWith('/dashboard/users') ? 'active' : ''
      }, 'Users'),
      a({
        href: '#/dashboard/settings',
        class: currentPath === '/dashboard/settings' ? 'active' : ''
      }, 'Settings')
    )
  );
}
```

## Form Examples

### Contact Form with Validation

```javascript
const app = new MiniFramework({
  container: '#app',
  state: {
    form: {
      name: '',
      email: '',
      message: '',
      submitted: false,
      errors: {}
    }
  }
});

// Validation rules
const validators = {
  name: (value) => {
    if (!value.trim()) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    return null;
  },
  
  email: (value) => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Invalid email format';
    return null;
  },
  
  message: (value) => {
    if (!value.trim()) return 'Message is required';
    if (value.length < 10) return 'Message must be at least 10 characters';
    return null;
  }
};

// Form actions
const formActions = {
  updateField(field, value) {
    app.state.setState(`form.${field}`, value);
    
    // Clear error when user starts typing
    const errors = app.state.getState('form.errors');
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      app.state.setState('form.errors', newErrors);
    }
  },
  
  validateField(field, value) {
    const error = validators[field](value);
    const errors = app.state.getState('form.errors');
    
    if (error) {
      app.state.setState('form.errors', { ...errors, [field]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[field];
      app.state.setState('form.errors', newErrors);
    }
    
    return !error;
  },
  
  validateForm() {
    const form = app.state.getState('form');
    const errors = {};
    
    Object.keys(validators).forEach(field => {
      const error = validators[field](form[field]);
      if (error) errors[field] = error;
    });
    
    app.state.setState('form.errors', errors);
    return Object.keys(errors).length === 0;
  },
  
  async submitForm() {
    app.state.setState('form.submitted', true);
    
    if (!this.validateForm()) {
      return;
    }
    
    const formData = app.state.getState('form');
    
    try {
      await app.state.setState('submitting', true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success
      await app.state.setState('form', {
        name: '',
        email: '',
        message: '',
        submitted: false,
        errors: {}
      });
      
      await app.state.setState('successMessage', 'Thank you! Your message has been sent.');
      
    } catch (error) {
      await app.state.setState('form.errors', {
        submit: 'Failed to send message. Please try again.'
      });
    } finally {
      await app.state.setState('submitting', false);
    }
  }
};

function ContactForm() {
  const form = app.state.getState('form');
  const submitting = app.state.getState('submitting');
  const successMessage = app.state.getState('successMessage');
  
  if (successMessage) {
    return div({ class: 'success-message' },
      h2('Message Sent!'),
      p(successMessage),
      button({
        onclick: () => app.state.setState('successMessage', null)
      }, 'Send Another Message')
    );
  }
  
  return form({ 
    class: 'contact-form',
    onsubmit: (e) => {
      e.preventDefault();
      formActions.submitForm();
    }
  },
    h1('Contact Us'),
    
    FormField({
      label: 'Name',
      type: 'text',
      value: form.name,
      error: form.errors.name,
      submitted: form.submitted,
      onChange: (value) => formActions.updateField('name', value),
      onBlur: () => formActions.validateField('name', form.name)
    }),
    
    FormField({
      label: 'Email',
      type: 'email',
      value: form.email,
      error: form.errors.email,
      submitted: form.submitted,
      onChange: (value) => formActions.updateField('email', value),
      onBlur: () => formActions.validateField('email', form.email)
    }),
    
    TextAreaField({
      label: 'Message',
      value: form.message,
      error: form.errors.message,
      submitted: form.submitted,
      onChange: (value) => formActions.updateField('message', value),
      onBlur: () => formActions.validateField('message', form.message)
    }),
    
    form.errors.submit && div({ class: 'error' }, form.errors.submit),
    
    button({
      type: 'submit',
      disabled: submitting,
      class: submitting ? 'loading' : ''
    }, submitting ? 'Sending...' : 'Send Message')
  );
}

function FormField({ label, type, value, error, submitted, onChange, onBlur }) {
  const hasError = error && (submitted || value.length > 0);
  
  return div({ class: `form-field ${hasError ? 'error' : ''}` },
    label({ class: 'field-label' }, label),
    input({
      type,
      value,
      class: 'field-input',
      oninput: (e) => onChange(e.target.value),
      onblur: onBlur,
      'aria-invalid': hasError ? 'true' : 'false'
    }),
    hasError && span({ class: 'field-error' }, error)
  );
}

function TextAreaField({ label, value, error, submitted, onChange, onBlur }) {
  const hasError = error && (submitted || value.length > 0);
  
  return div({ class: `form-field ${hasError ? 'error' : ''}` },
    label({ class: 'field-label' }, label),
    textarea({
      value,
      class: 'field-input',
      rows: 5,
      oninput: (e) => onChange(e.target.value),
      onblur: onBlur,
      'aria-invalid': hasError ? 'true' : 'false'
    }),
    hasError && span({ class: 'field-error' }, error)
  );
}

app.init();
app.state.subscribe(() => app.render(ContactForm));
app.render(ContactForm);
```

These examples demonstrate various patterns and techniques for building applications with Mini Framework. Each example focuses on different aspects of the framework and can serve as a starting point for your own applications.