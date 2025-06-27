/**
 * TodoMVC Header Component - Contains the new todo input
 */

// DOM functions accessed through app.dom

export default class TodoHeader {
    constructor(app) {
        this.app = app;
    }

    handleKeyPress(event) {
        if (event.key === 'Enter') {
            const text = event.target.value;
            this.app.addTodo(text);
            event.target.value = '';
        }
    }

    render() {
        return this.app.dom.createVNode('input', {
            class: 'new-todo',
            placeholder: 'What needs to be done?',
            autofocus: true,
            onKeypress: (event) => this.handleKeyPress(event)
        });
    }
}