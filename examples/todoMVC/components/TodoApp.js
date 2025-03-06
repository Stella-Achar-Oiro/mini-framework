import { createElement } from '../framework';
import { TodoList } from './TodoList';
import { TodoFooter } from './TodoFooter';
import { TodoInput } from './TodoInput';

function TodoApp({ state, actions }) {
  const { todos, filter } = state;
  
  // Filter todos based on current filter
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });
  
  // Count active and completed todos
  const activeTodoCount = todos.filter(todo => !todo.completed).length;
  const completedCount = todos.length - activeTodoCount;
  const allCompleted = todos.length > 0 && activeTodoCount === 0;
  
  return createElement('div', { className: 'todoapp' }, [
    createElement('header', { className: 'header' }, [
      createElement('h1', {}, 'todos'),
      createElement(TodoInput, {
        onSave: actions.addTodo
      })
    ]),
    
    todos.length > 0 && createElement('section', { className: 'main' }, [
      createElement('input', {
        id: 'toggle-all',
        className: 'toggle-all',
        type: 'checkbox',
        checked: allCompleted,
        onChange: (e) => {
          todos.forEach(todo => {
            if (todo.completed !== e.target.checked) {
              actions.toggleTodo(todo.id);
            }
          });
        }
      }),
      createElement('label', { htmlFor: 'toggle-all' }, 'Mark all as complete'),
      
      createElement(TodoList, {
        todos: filteredTodos,
        onToggle: actions.toggleTodo,
        onRemove: actions.removeTodo,
        onEdit: actions.editTodo
      })
    ]),
    
    todos.length > 0 && createElement(TodoFooter, {
      activeCount: activeTodoCount,
      completedCount: completedCount,
      filter: filter,
      onClearCompleted: actions.clearCompleted
    })
  ]);
}

export { TodoApp };