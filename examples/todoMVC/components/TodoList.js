import { createElement } from '../framework';
import { TodoItem } from './TodoItem';

function TodoList({ todos, onToggle, onRemove, onEdit }) {
  return createElement('ul', { className: 'todo-list' },
    todos.map(todo =>
      createElement(TodoItem, {
        key: todo.id,
        todo: todo,
        onToggle: onToggle,
        onRemove: onRemove,
        onEdit: onEdit
      })
    )
  );
}

export { TodoList };