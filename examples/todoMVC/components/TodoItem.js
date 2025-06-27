/**
 * TodoMVC Item Component - Individual todo item
 */

// DOM functions accessed through app.dom

export default class TodoItem {
    constructor(app, todo, isEditing) {
        this.app = app;
        this.todo = todo;
        this.isEditing = isEditing;
    }

    handleToggle() {
        this.app.toggleTodo(this.todo.id);
    }

    handleDestroy() {
        this.app.deleteTodo(this.todo.id);
    }

    handleDoubleClick() {
        this.app.startEditing(this.todo.id);
    }

    handleEditKeyPress(event) {
        if (event.key === 'Enter') {
            this.handleEditSubmit(event);
        } else if (event.key === 'Escape') {
            this.app.cancelEditing();
        }
    }

    handleEditSubmit(event) {
        const text = event.target.value.trim();
        this.app.updateTodo(this.todo.id, text);
    }

    handleEditBlur(event) {
        if (this.isEditing) {
            this.handleEditSubmit(event);
        }
    }

    render() {
        const classes = [
            this.todo.completed && 'completed',
            this.isEditing && 'editing'
        ].filter(Boolean).join(' ');

        return this.app.dom.createVNode('li', {
            class: classes
        }, [
            this.app.dom.createVNode('div', { class: 'view' }, [
                this.app.dom.createVNode('input', {
                    class: 'toggle',
                    type: 'checkbox',
                    checked: this.todo.completed,
                    onChange: () => this.handleToggle()
                }),
                
                this.app.dom.createVNode('label', {
                    onDoubleclick: () => this.handleDoubleClick()
                }, [this.todo.text]),
                
                this.app.dom.createVNode('button', {
                    class: 'destroy',
                    onClick: () => this.handleDestroy()
                })
            ]),
            
            this.isEditing && this.app.dom.createVNode('input', {
                class: 'edit',
                value: this.todo.text,
                autofocus: true,
                onKeypress: (event) => this.handleEditKeyPress(event),
                onBlur: (event) => this.handleEditBlur(event)
            })
        ].filter(Boolean));
    }
}