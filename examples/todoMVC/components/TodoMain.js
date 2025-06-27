/**
 * TodoMVC Main Component - Contains the todo list and toggle all
 */

// DOM functions accessed through app.dom
import TodoItem from './TodoItem.js';

export default class TodoMain {
    constructor(app, todos, editingId) {
        this.app = app;
        this.todos = todos;
        this.editingId = editingId;
    }

    handleToggleAll() {
        this.app.toggleAll();
    }

    render() {
        const allTodos = this.app.state.getState().todos;
        const allCompleted = allTodos.length > 0 && allTodos.every(todo => todo.completed);

        return [
            this.app.dom.createVNode('input', {
                id: 'toggle-all',
                class: 'toggle-all',
                type: 'checkbox',
                checked: allCompleted,
                onChange: () => this.handleToggleAll()
            }),
            
            this.app.dom.createVNode('label', {
                for: 'toggle-all'
            }, ['Mark all as complete']),
            
            this.app.dom.createVNode('ul', {
                class: 'todo-list'
            }, this.todos.map(todo => 
                new TodoItem(this.app, todo, this.editingId === todo.id).render()
            ))
        ];
    }
}