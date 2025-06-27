import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MiniFramework } from '../../src/core/component.js';
import TodoApp from '../../examples/todoMVC/components/TodoApp.js';

describe('TodoMVC Integration Tests', () => {
  let container;
  let framework;
  let todoApp;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    container.id = 'todoapp';
    container.className = 'todoapp';
    document.body.appendChild(container);

    // Initialize framework
    framework = new MiniFramework({
      container: '#todoapp',
      debug: false
    });
    framework.init();

    // Initialize TodoMVC app
    todoApp = new TodoApp(framework);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    if (framework && !framework.isDestroyed) {
      framework.destroy();
    }
    document.body.innerHTML = '';
    localStorage.clear();
    window.location.hash = '';
  });

  describe('Initial State', () => {
    it('should initialize with empty todo list', () => {
      const todos = framework.state.get('todos');
      expect(todos).toEqual([]);
    });

    it('should initialize with "all" filter', () => {
      const filter = framework.state.get('filter');
      expect(filter).toBe('all');
    });

    it('should render the TodoMVC UI structure', () => {
      todoApp.render();
      
      expect(container.querySelector('.header')).toBeTruthy();
      expect(container.querySelector('.main')).toBeTruthy();
      expect(container.querySelector('.footer')).toBeTruthy();
    });

    it('should render the new todo input', () => {
      todoApp.render();
      
      const input = container.querySelector('.new-todo');
      expect(input).toBeTruthy();
      expect(input.placeholder).toBe('What needs to be done?');
    });
  });

  describe('Adding Todos', () => {
    beforeEach(() => {
      todoApp.render();
    });

    it('should add a new todo when Enter is pressed', () => {
      const input = container.querySelector('.new-todo');
      input.value = 'Buy milk';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);
      
      const todos = framework.state.get('todos');
      expect(todos).toHaveLength(1);
      expect(todos[0].text).toBe('Buy milk');
      expect(todos[0].completed).toBe(false);
    });

    it('should clear input after adding todo', () => {
      const input = container.querySelector('.new-todo');
      input.value = 'Buy milk';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);
      
      expect(input.value).toBe('');
    });

    it('should not add empty todos', () => {
      const input = container.querySelector('.new-todo');
      input.value = '   ';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);
      
      const todos = framework.state.get('todos');
      expect(todos).toHaveLength(0);
    });

    it('should trim whitespace from new todos', () => {
      const input = container.querySelector('.new-todo');
      input.value = '  Buy milk  ';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);
      
      const todos = framework.state.get('todos');
      expect(todos[0].text).toBe('Buy milk');
    });

    it('should assign unique IDs to todos', () => {
      const input = container.querySelector('.new-todo');
      
      input.value = 'Todo 1';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      
      input.value = 'Todo 2';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      
      const todos = framework.state.get('todos');
      expect(todos[0].id).not.toBe(todos[1].id);
      expect(typeof todos[0].id).toBe('string');
    });
  });

  describe('Displaying Todos', () => {
    beforeEach(() => {
      // Add some test todos
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false },
        { id: '2', text: 'Walk dog', completed: true },
        { id: '3', text: 'Write code', completed: false }
      ]);
      todoApp.render();
    });

    it('should display all todos', () => {
      const todoItems = container.querySelectorAll('.todo-list li');
      expect(todoItems).toHaveLength(3);
    });

    it('should display todo text correctly', () => {
      const labels = container.querySelectorAll('.todo-list label');
      expect(labels[0].textContent).toBe('Buy milk');
      expect(labels[1].textContent).toBe('Walk dog');
      expect(labels[2].textContent).toBe('Write code');
    });

    it('should mark completed todos with correct class', () => {
      const todoItems = container.querySelectorAll('.todo-list li');
      expect(todoItems[0].classList.contains('completed')).toBe(false);
      expect(todoItems[1].classList.contains('completed')).toBe(true);
      expect(todoItems[2].classList.contains('completed')).toBe(false);
    });

    it('should check completed todo checkboxes', () => {
      const checkboxes = container.querySelectorAll('.toggle');
      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true);
      expect(checkboxes[2].checked).toBe(false);
    });
  });

  describe('Toggling Todos', () => {
    beforeEach(() => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false },
        { id: '2', text: 'Walk dog', completed: true }
      ]);
      todoApp.render();
    });

    it('should toggle todo completion status', () => {
      const firstCheckbox = container.querySelector('.toggle');
      firstCheckbox.click();
      
      const todos = framework.state.get('todos');
      expect(todos[0].completed).toBe(true);
    });

    it('should update UI when todo is toggled', () => {
      const firstCheckbox = container.querySelector('.toggle');
      const firstItem = container.querySelector('.todo-list li');
      
      expect(firstItem.classList.contains('completed')).toBe(false);
      
      firstCheckbox.click();
      
      expect(firstItem.classList.contains('completed')).toBe(true);
    });

    it('should toggle all todos with toggle-all checkbox', () => {
      const toggleAll = container.querySelector('.toggle-all');
      toggleAll.click();
      
      const todos = framework.state.get('todos');
      expect(todos.every(todo => todo.completed)).toBe(true);
    });

    it('should uncheck toggle-all when not all todos are completed', () => {
      const toggleAll = container.querySelector('.toggle-all');
      const firstCheckbox = container.querySelector('.toggle');
      
      // First make all completed
      toggleAll.click();
      expect(toggleAll.checked).toBe(true);
      
      // Then uncheck one
      firstCheckbox.click();
      expect(toggleAll.checked).toBe(false);
    });
  });

  describe('Editing Todos', () => {
    beforeEach(() => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false }
      ]);
      todoApp.render();
    });

    it('should enter edit mode on double click', () => {
      const label = container.querySelector('.todo-list label');
      label.dispatchEvent(new Event('dblclick'));
      
      const editingId = framework.state.get('editingId');
      expect(editingId).toBe('1');
      
      const editInput = container.querySelector('.edit');
      expect(editInput).toBeTruthy();
      expect(editInput.value).toBe('Buy milk');
    });

    it('should save changes on Enter', () => {
      const label = container.querySelector('.todo-list label');
      label.dispatchEvent(new Event('dblclick'));
      
      const editInput = container.querySelector('.edit');
      editInput.value = 'Buy organic milk';
      editInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      
      const todos = framework.state.get('todos');
      expect(todos[0].text).toBe('Buy organic milk');
      expect(framework.state.get('editingId')).toBe(null);
    });

    it('should cancel edit on Escape', () => {
      const label = container.querySelector('.todo-list label');
      label.dispatchEvent(new Event('dblclick'));
      
      const editInput = container.querySelector('.edit');
      editInput.value = 'Buy organic milk';
      editInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      
      const todos = framework.state.get('todos');
      expect(todos[0].text).toBe('Buy milk'); // Unchanged
      expect(framework.state.get('editingId')).toBe(null);
    });

    it('should save changes on blur', () => {
      const label = container.querySelector('.todo-list label');
      label.dispatchEvent(new Event('dblclick'));
      
      const editInput = container.querySelector('.edit');
      editInput.value = 'Buy organic milk';
      editInput.dispatchEvent(new Event('blur'));
      
      const todos = framework.state.get('todos');
      expect(todos[0].text).toBe('Buy organic milk');
    });

    it('should delete todo if edited text is empty', () => {
      const label = container.querySelector('.todo-list label');
      label.dispatchEvent(new Event('dblclick'));
      
      const editInput = container.querySelector('.edit');
      editInput.value = '';
      editInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      
      const todos = framework.state.get('todos');
      expect(todos).toHaveLength(0);
    });
  });

  describe('Deleting Todos', () => {
    beforeEach(() => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false },
        { id: '2', text: 'Walk dog', completed: true }
      ]);
      todoApp.render();
    });

    it('should delete todo when destroy button is clicked', () => {
      const destroyButton = container.querySelector('.destroy');
      destroyButton.click();
      
      const todos = framework.state.get('todos');
      expect(todos).toHaveLength(1);
      expect(todos[0].text).toBe('Walk dog');
    });

    it('should show destroy button on hover', () => {
      const todoItem = container.querySelector('.todo-list li');
      todoItem.dispatchEvent(new Event('mouseenter'));
      
      const destroyButton = container.querySelector('.destroy');
      expect(destroyButton.style.display).not.toBe('none');
    });
  });

  describe('Filtering Todos', () => {
    beforeEach(() => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false },
        { id: '2', text: 'Walk dog', completed: true },
        { id: '3', text: 'Write code', completed: false }
      ]);
      todoApp.render();
    });

    it('should show all todos by default', () => {
      const visibleItems = container.querySelectorAll('.todo-list li:not(.hidden)');
      expect(visibleItems).toHaveLength(3);
    });

    it('should filter to active todos', () => {
      framework.state.set('filter', 'active');
      todoApp.render();
      
      const visibleItems = container.querySelectorAll('.todo-list li:not(.hidden)');
      expect(visibleItems).toHaveLength(2);
    });

    it('should filter to completed todos', () => {
      framework.state.set('filter', 'completed');
      todoApp.render();
      
      const visibleItems = container.querySelectorAll('.todo-list li:not(.hidden)');
      expect(visibleItems).toHaveLength(1);
    });

    it('should update filter when navigation links are clicked', () => {
      const activeLink = container.querySelector('a[href="#/active"]');
      activeLink.click();
      
      expect(framework.state.get('filter')).toBe('active');
    });
  });

  describe('Footer Display', () => {
    it('should hide footer when no todos exist', () => {
      framework.state.set('todos', []);
      todoApp.render();
      
      const footer = container.querySelector('.footer');
      expect(footer.style.display).toBe('none');
    });

    it('should show footer when todos exist', () => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false }
      ]);
      todoApp.render();
      
      const footer = container.querySelector('.footer');
      expect(footer.style.display).not.toBe('none');
    });

    it('should display correct item count', () => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false },
        { id: '2', text: 'Walk dog', completed: true },
        { id: '3', text: 'Write code', completed: false }
      ]);
      todoApp.render();
      
      const count = container.querySelector('.todo-count');
      expect(count.textContent).toContain('2 items left');
    });

    it('should use singular form for one item', () => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false }
      ]);
      todoApp.render();
      
      const count = container.querySelector('.todo-count');
      expect(count.textContent).toContain('1 item left');
    });

    it('should show clear completed button when completed todos exist', () => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false },
        { id: '2', text: 'Walk dog', completed: true }
      ]);
      todoApp.render();
      
      const clearButton = container.querySelector('.clear-completed');
      expect(clearButton.style.display).not.toBe('none');
    });

    it('should hide clear completed button when no completed todos', () => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false }
      ]);
      todoApp.render();
      
      const clearButton = container.querySelector('.clear-completed');
      expect(clearButton.style.display).toBe('none');
    });
  });

  describe('Clear Completed', () => {
    beforeEach(() => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false },
        { id: '2', text: 'Walk dog', completed: true },
        { id: '3', text: 'Write code', completed: true }
      ]);
      todoApp.render();
    });

    it('should clear all completed todos', () => {
      const clearButton = container.querySelector('.clear-completed');
      clearButton.click();
      
      const todos = framework.state.get('todos');
      expect(todos).toHaveLength(1);
      expect(todos[0].text).toBe('Buy milk');
    });
  });

  describe('Routing', () => {
    beforeEach(() => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false },
        { id: '2', text: 'Walk dog', completed: true }
      ]);
      todoApp.render();
    });

    it('should update filter when hash changes', () => {
      window.location.hash = '#/active';
      window.dispatchEvent(new Event('hashchange'));
      
      expect(framework.state.get('filter')).toBe('active');
    });

    it('should highlight active filter in navigation', () => {
      framework.state.set('filter', 'active');
      todoApp.render();
      
      const activeLink = container.querySelector('a[href="#/active"]');
      expect(activeLink.classList.contains('selected')).toBe(true);
    });

    it('should default to "all" filter for root path', () => {
      window.location.hash = '#/';
      window.dispatchEvent(new Event('hashchange'));
      
      expect(framework.state.get('filter')).toBe('all');
    });
  });

  describe('Persistence', () => {
    it('should save todos to localStorage', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false }
      ]);
      
      expect(setItemSpy).toHaveBeenCalledWith(
        'todos-miniframework',
        JSON.stringify([{ id: '1', text: 'Buy milk', completed: false }])
      );
    });

    it('should load todos from localStorage on init', () => {
      const testTodos = [
        { id: '1', text: 'Saved todo', completed: true }
      ];
      
      localStorage.setItem('todos-miniframework', JSON.stringify(testTodos));
      
      const newTodoApp = new TodoApp(framework);
      const todos = framework.state.get('todos');
      
      expect(todos).toEqual(testTodos);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      framework.state.set('todos', [
        { id: '1', text: 'Buy milk', completed: false }
      ]);
      todoApp.render();
    });

    it('should have proper ARIA labels', () => {
      const toggleAll = container.querySelector('.toggle-all');
      expect(toggleAll.getAttribute('aria-label')).toBeTruthy();
      
      const newTodo = container.querySelector('.new-todo');
      expect(newTodo.getAttribute('aria-label')).toBeTruthy();
    });

    it('should be keyboard navigable', () => {
      const input = container.querySelector('.new-todo');
      expect(input.tabIndex).not.toBe(-1);
      
      const checkbox = container.querySelector('.toggle');
      expect(checkbox.tabIndex).not.toBe(-1);
    });
  });

  describe('Performance', () => {
    it('should handle large number of todos efficiently', () => {
      const largeTodoList = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        text: `Todo ${i}`,
        completed: i % 2 === 0
      }));
      
      const start = performance.now();
      framework.state.set('todos', largeTodoList);
      todoApp.render();
      const renderTime = performance.now() - start;
      
      expect(renderTime).toBeLessThan(200); // Should render in less than 200ms
      expect(container.querySelectorAll('.todo-list li')).toHaveLength(1000);
    });

    it('should debounce rapid state changes', () => {
      const renderSpy = vi.spyOn(todoApp, 'render');
      
      // Rapid successive changes
      for (let i = 0; i < 10; i++) {
        framework.state.set(`temp${i}`, i);
      }
      
      // Should batch render calls
      expect(renderSpy.mock.calls.length).toBeLessThan(10);
    });
  });
});