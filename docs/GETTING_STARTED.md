# Getting Started with Mini Framework

## Installation

### From Source

1. Clone the repository:
```bash
git clone <repository-url>
cd mini-framework
```

2. Install dependencies:
```bash
npm install
```

3. Build the framework:
```bash
npm run build
```

### Using the Built Files

Include the built framework in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <div id="app"></div>
  <script src="dist/mini-framework.js"></script>
  <script>
    // Your app code here
  </script>
</body>
</html>
```

## Your First Application

Let's create a simple counter application to demonstrate the framework's capabilities.

### Step 1: Create the HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>Counter App</title>
  <style>
    .counter {
      text-align: center;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .count {
      font-size: 2em;
      margin: 20px 0;
    }
    
    button {
      font-size: 1.2em;
      padding: 10px 20px;
      margin: 0 10px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script src="dist/mini-framework.js"></script>
  <script>
    // Application code will go here
  </script>
</body>
</html>
```

### Step 2: Initialize the Framework

```javascript
// Create framework instance
const app = new MiniFramework({
  container: '#app',
  state: {
    count: 0
  },
  debug: true
});

// Initialize the framework
app.init();
```

### Step 3: Create the Counter Component

```javascript
// Define the counter component
function Counter() {
  const count = app.state.getState('count');
  
  return {
    tag: 'div',
    attributes: { class: 'counter' },
    children: [
      {
        tag: 'h1',
        children: ['Counter App']
      },
      {
        tag: 'div',
        attributes: { class: 'count' },
        children: [`Count: ${count}`]
      },
      {
        tag: 'div',
        children: [
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
          },
          {
            tag: 'button',
            attributes: {
              onclick: () => app.state.setState('count', 0)
            },
            children: ['Reset']
          }
        ]
      }
    ]
  };
}
```

### Step 4: Set Up Reactive Rendering

```javascript
// Subscribe to state changes for automatic re-rendering
app.state.subscribe(() => {
  app.render(Counter);
});

// Initial render
app.render(Counter);
```

### Complete Example

Here's the complete counter application:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Counter App</title>
  <style>
    .counter {
      text-align: center;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .count {
      font-size: 2em;
      margin: 20px 0;
    }
    
    button {
      font-size: 1.2em;
      padding: 10px 20px;
      margin: 0 10px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script src="dist/mini-framework.js"></script>
  <script>
    // Create framework instance
    const app = new MiniFramework({
      container: '#app',
      state: {
        count: 0
      },
      debug: true
    });

    // Initialize the framework
    app.init();

    // Define the counter component
    function Counter() {
      const count = app.state.getState('count');
      
      return {
        tag: 'div',
        attributes: { class: 'counter' },
        children: [
          {
            tag: 'h1',
            children: ['Counter App']
          },
          {
            tag: 'div',
            attributes: { class: 'count' },
            children: [`Count: ${count}`]
          },
          {
            tag: 'div',
            children: [
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
              },
              {
                tag: 'button',
                attributes: {
                  onclick: () => app.state.setState('count', 0)
                },
                children: ['Reset']
              }
            ]
          }
        ]
      };
    }

    // Subscribe to state changes for automatic re-rendering
    app.state.subscribe(() => {
      app.render(Counter);
    });

    // Initial render
    app.render(Counter);
  </script>
</body>
</html>
```

## Using Helper Functions

The framework provides helper functions to make creating virtual nodes easier:

```javascript
import { div, h1, button } from './src/utils/helpers.js';

function Counter() {
  const count = app.state.getState('count');
  
  return div({ class: 'counter' },
    h1('Counter App'),
    div({ class: 'count' }, `Count: ${count}`),
    div(
      button({ onclick: () => app.state.setState('count', count - 1) }, '-'),
      button({ onclick: () => app.state.setState('count', count + 1) }, '+'),
      button({ onclick: () => app.state.setState('count', 0) }, 'Reset')
    )
  );
}
```

## Adding Routing

Let's extend our application with routing:

```javascript
const app = new MiniFramework({
  container: '#app',
  state: {
    count: 0,
    currentPage: 'home'
  },
  routes: {
    '/': () => HomePage(),
    '/counter': () => CounterPage(),
    '/about': () => AboutPage()
  },
  debug: true
});

function HomePage() {
  return div({ class: 'page' },
    h1('Welcome to Mini Framework'),
    p('This is a demonstration of the Mini Framework capabilities.'),
    nav(),
  );
}

function CounterPage() {
  return div({ class: 'page' },
    Counter(),
    nav()
  );
}

function AboutPage() {
  return div({ class: 'page' },
    h1('About'),
    p('Mini Framework is a lightweight, modular JavaScript framework.'),
    nav()
  );
}

function nav() {
  return div({ class: 'nav' },
    a({ href: '#/' }, 'Home'),
    a({ href: '#/counter' }, 'Counter'),
    a({ href: '#/about' }, 'About')
  );
}
```

## Managing Complex State

For more complex applications, you can organize state with nested objects:

```javascript
const app = new MiniFramework({
  container: '#app',
  state: {
    user: {
      name: '',
      email: '',
      isLoggedIn: false
    },
    todos: [],
    ui: {
      loading: false,
      error: null
    }
  }
});

// Update nested state
await app.state.setState('user.name', 'John Doe');
await app.state.setState('user.isLoggedIn', true);

// Subscribe to specific state paths
app.state.subscribe((newState, prevState) => {
  console.log('User state changed:', newState.user);
}, { path: 'user' });

// Use computed properties
app.state.computed('todoCount', (state) => state.todos.length);
app.state.computed('completedTodos', (state) => 
  state.todos.filter(todo => todo.completed)
);
```

## Event Handling

The framework provides several ways to handle events:

```javascript
// Basic event handling
button({ onclick: handleClick }, 'Click me');

// Event with options
button({
  onclick: { 
    handler: handleClick, 
    debounce: 300 
  }
}, 'Debounced Click');

// Multiple events
input({
  onkeyup: handleKeyUp,
  onblur: handleBlur,
  onfocus: handleFocus
});

// Event delegation (automatic)
div(
  // Events work on dynamically added children
  ...items.map(item => 
    button({ onclick: () => selectItem(item.id) }, item.name)
  )
);
```

## Form Handling

Working with forms in Mini Framework:

```javascript
function ContactForm() {
  const formData = app.state.getState('form') || {};
  
  return form({ onsubmit: handleSubmit },
    div(
      label('Name:'),
      input({
        type: 'text',
        value: formData.name || '',
        oninput: (e) => app.state.setState('form.name', e.target.value)
      })
    ),
    div(
      label('Email:'),
      input({
        type: 'email',
        value: formData.email || '',
        oninput: (e) => app.state.setState('form.email', e.target.value)
      })
    ),
    div(
      label('Message:'),
      textarea({
        value: formData.message || '',
        oninput: (e) => app.state.setState('form.message', e.target.value)
      })
    ),
    button({ type: 'submit' }, 'Send')
  );
}

async function handleSubmit(e) {
  e.preventDefault();
  const formData = app.state.getState('form');
  
  await app.state.setState('ui.loading', true);
  
  try {
    // Submit form data
    await submitForm(formData);
    await app.state.setState('form', {}); // Clear form
  } catch (error) {
    await app.state.setState('ui.error', error.message);
  } finally {
    await app.state.setState('ui.loading', false);
  }
}
```

## Performance Tips

### 1. Use Path-Specific Subscriptions

```javascript
// Instead of subscribing to all state changes
app.state.subscribe(renderApp);

// Subscribe only to relevant changes
app.state.subscribe(renderUserProfile, { path: 'user' });
app.state.subscribe(renderTodoList, { path: 'todos' });
```

### 2. Batch State Updates

```javascript
// Instead of multiple setState calls
await app.state.setState('loading', true);
await app.state.setState('error', null);
await app.state.setState('data', responseData);

// Batch them together
await app.state.batch(() => {
  app.state.setState('loading', true);
  app.state.setState('error', null);
  app.state.setState('data', responseData);
});
```

### 3. Use Keys for List Items

```javascript
// Provide keys for efficient list reconciliation
ul(
  ...items.map(item => 
    li({ key: item.id }, item.name)
  )
);
```

### 4. Debounce Expensive Operations

```javascript
// Debounce search input
input({
  oninput: {
    handler: handleSearch,
    debounce: 300
  }
});
```

## Next Steps

Now that you have a basic understanding of Mini Framework:

1. **Explore the TodoMVC Example**: Check out the complete TodoMVC implementation in `/examples/todoMVC/`
2. **Read the API Documentation**: Learn about all available methods in `/docs/API.md`
3. **Study the Architecture**: Understand how the framework works internally in `/docs/ARCHITECTURE.md`
4. **Learn Best Practices**: Read recommended patterns in `/docs/BEST_PRACTICES.md`
5. **Build Something**: Start building your own application!

## Common Patterns

### Component Composition

```javascript
function App() {
  return div({ class: 'app' },
    Header(),
    main({ class: 'content' },
      Router()
    ),
    Footer()
  );
}

function Header() {
  return header({ class: 'header' },
    h1('My App'),
    Navigation()
  );
}

function Navigation() {
  return nav(
    a({ href: '#/' }, 'Home'),
    a({ href: '#/about' }, 'About'),
    a({ href: '#/contact' }, 'Contact')
  );
}
```

### Conditional Rendering

```javascript
function UserProfile() {
  const user = app.state.getState('user');
  const isLoggedIn = user && user.isLoggedIn;
  
  return div({ class: 'profile' },
    isLoggedIn ? [
      h2(`Welcome, ${user.name}!`),
      button({ onclick: logout }, 'Logout')
    ] : [
      h2('Please log in'),
      button({ onclick: showLogin }, 'Login')
    ]
  );
}
```

### Loading States

```javascript
function DataList() {
  const loading = app.state.getState('ui.loading');
  const error = app.state.getState('ui.error');
  const data = app.state.getState('data');
  
  if (loading) {
    return div({ class: 'loading' }, 'Loading...');
  }
  
  if (error) {
    return div({ class: 'error' }, `Error: ${error}`);
  }
  
  return ul({ class: 'data-list' },
    ...data.map(item => 
      li({ key: item.id }, item.name)
    )
  );
}
```

This should give you a solid foundation for building applications with Mini Framework!