import { createElement, createApp } from '../framework';

// Create TodoItem with lifecycle hooks
const TodoItem = createApp().createComponent(
  function({ todo, onToggle, onRemove, onEdit }) {
    // Local editing state
    let editing = false;
    let editText = todo.text;
    
    // Handler for double-click to edit
    const handleDoubleClick = () => {
      editing = true;
      
      // Force re-render
      const element = document.querySelector(`li[data-id="${todo.id}"]`);
      if (element) {
        element.className = `${todo.completed ? 'completed' : ''} editing`;
        
        // Focus the input after a short delay
        setTimeout(() => {
          const input = element.querySelector('.edit');
          if (input) {
            input.focus();
            input.select();
          }
        }, 10);
      }
    };
    
    // Handler for edit completion
    const handleSubmit = () => {
      const newText = editText.trim();
      
      if (newText) {
        onEdit(todo.id, newText);
      } else {
        onRemove(todo.id);
      }
      
      editing = false;
    };
    
    // Handler for edit cancellation
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        // Cancel editing
        editText = todo.text;
        editing = false;
        
        // Force re-render
        const element = document.querySelector(`li[data-id="${todo.id}"]`);
        if (element) {
          element.className = todo.completed ? 'completed' : '';
        }
      }
    };
    
    return createElement('li', {
      className: `${todo.completed ? 'completed' : ''} ${editing ? 'editing' : ''}`,
      'data-id': todo.id
    }, [
      createElement('div', { className: 'view' }, [
        createElement('input', {
          className: 'toggle',
          type: 'checkbox',
          checked: todo.completed,
          onChange: () => onToggle(todo.id)
        }),
        createElement('label', {
          onDblClick: handleDoubleClick
        }, todo.text),
        createElement('button', {
          className: 'destroy',
          onClick: () => onRemove(todo.id)
        })
      ]),
      editing && createElement('input', {
        className: 'edit',
        value: editText,
        onChange: (e) => { editText = e.target.value; },
        onBlur: handleSubmit,
        onKeyDown: handleKeyDown
      })
    ]);
  },
  {
    // Mount hook
    onMount: (element) => {
      console.log('TodoItem mounted:', element.dataset.id);
    },
    
    // Unmount hook
    onUnmount: () => {
      console.log('TodoItem unmounted');
    }
  }
);

export { TodoItem };