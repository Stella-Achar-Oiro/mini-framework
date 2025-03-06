export const todoActions = {
    // Add a new todo
    addTodo: (text) => (state) => ({
      todos: [
        ...state.todos,
        {
          id: Date.now(),
          text,
          completed: false
        }
      ]
    }),
    
    // Toggle a todo's completed status
    toggleTodo: (id) => (state) => ({
      todos: state.todos.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    }),
    
    // Remove a todo
    removeTodo: (id) => (state) => ({
      todos: state.todos.filter(todo => todo.id !== id)
    }),
    
    // Edit a todo's text
    editTodo: (id, text) => (state) => ({
      todos: state.todos.map(todo =>
        todo.id === id
          ? { ...todo, text }
          : todo
      )
    }),
    
    // Clear all completed todos
    clearCompleted: () => (state) => ({
      todos: state.todos.filter(todo => !todo.completed)
    }),
    
    // Set the current filter
    setFilter: (filter) => ({
      filter
    }),
    
    // Example thunk - save todos with delay
    saveTodos: () => (getState, dispatch) => {
      const state = getState();
      
      // Save to localStorage
      localStorage.setItem('todos', JSON.stringify(state.todos));
      
      // Example of async operation
      setTimeout(() => {
        console.log('Todos saved successfully');
      }, 500);
    }
  };