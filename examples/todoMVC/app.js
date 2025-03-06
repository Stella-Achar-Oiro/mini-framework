import { createApp, createElement } from './framework';
import { TodoApp } from './components/TodoApp';
import { todoActions } from './actions';

// Create the application
const app = createApp({
  // Initial state
  initialState: {
    todos: [],
    filter: 'all'
  },
  
  // Actions
  actions: todoActions,
  
  // Router configuration
  router: {
    mode: 'hash' // Use hash-based routing
  },
  
  // Routes
  routes: [
    {
      path: '/',
      component: TodoApp,
      middleware: [(to) => {
        app.actions.setFilter('all');
        return true;
      }]
    },
    {
      path: '/active',
      component: TodoApp,
      middleware: [(to) => {
        app.actions.setFilter('active');
        return true;
      }]
    },
    {
      path: '/completed',
      component: TodoApp,
      middleware: [(to) => {
        app.actions.setFilter('completed');
        return true;
      }]
    }
  ]
});

// Mount application
app.mount('#app', TodoApp);