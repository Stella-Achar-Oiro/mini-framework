import { createElement } from '../framework';

function TodoFooter({ activeCount, completedCount, filter, onClearCompleted }) {
  return createElement('footer', { className: 'footer' }, [
    createElement('span', { className: 'todo-count' }, [
      createElement('strong', {}, String(activeCount)),
      ` item${activeCount !== 1 ? 's' : ''} left`
    ]),
    
    createElement('ul', { className: 'filters' }, [
      createElement('li', {}, [
        createElement('a', {
          className: filter === 'all' ? 'selected' : '',
          href: '#/'
        }, 'All')
      ]),
      createElement('li', {}, [
        createElement('a', {
          className: filter === 'active' ? 'selected' : '',
          href: '#/active'
        }, 'Active')
      ]),
      createElement('li', {}, [
        createElement('a', {
          className: filter === 'completed' ? 'selected' : '',
          href: '#/completed'
        }, 'Completed')
      ])
    ]),
    
    completedCount > 0 && createElement('button', {
      className: 'clear-completed',
      onClick: onClearCompleted
    }, 'Clear completed')
  ]);
}

export { TodoFooter };