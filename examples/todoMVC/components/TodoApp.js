/**
 * TodoMVC Main Application Component
 */

// DOM functions will be provided by the framework instance
import TodoHeader from './TodoHeader.js';
import TodoMain from './TodoMain.js';
import TodoFooter from './TodoFooter.js';

export default class TodoApp {
    constructor(framework) {
        this.framework = framework;
        this.state = framework.state;
        this.router = framework.router;
        this.dom = framework.dom;
        
        this.initializeState();
        this.setupRouting();
        this.setupStateWatchers();
    }

    initializeState() {
        // Initialize TodoMVC state
        this.state.setState({
            todos: this.loadTodos(),
            filter: 'all',
            editingId: null
        });
    }

    setupRouting() {
        // Set up TodoMVC routing
        this.router.route('/', () => {
            this.state.setState({ filter: 'all' });
        });

        this.router.route('/active', () => {
            this.state.setState({ filter: 'active' });
        });

        this.router.route('/completed', () => {
            this.state.setState({ filter: 'completed' });
        });

        // Set initial route based on URL
        const currentPath = window.location.hash.slice(1) || '/';
        this.router.navigate(currentPath);
    }

    setupStateWatchers() {
        // Save todos to localStorage whenever todos change
        this.state.watch('todos', (todos) => {
            this.saveTodos(todos);
        });
    }

    loadTodos() {
        try {
            const stored = localStorage.getItem('todos-mini-framework');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('Failed to load todos from localStorage:', e);
            return [];
        }
    }

    saveTodos(todos) {
        try {
            localStorage.setItem('todos-mini-framework', JSON.stringify(todos));
        } catch (e) {
            console.warn('Failed to save todos to localStorage:', e);
        }
    }

    // Todo Actions
    addTodo(text) {
        if (!text.trim()) return;

        const newTodo = {
            id: Date.now() + Math.random(),
            text: text.trim(),
            completed: false
        };

        const todos = [...this.state.getState().todos, newTodo];
        this.state.setState({ todos });
    }

    toggleTodo(id) {
        const todos = this.state.getState().todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        this.state.setState({ todos });
    }

    updateTodo(id, text) {
        if (!text.trim()) {
            this.deleteTodo(id);
            return;
        }

        const todos = this.state.getState().todos.map(todo =>
            todo.id === id ? { ...todo, text: text.trim() } : todo
        );
        this.state.setState({ todos, editingId: null });
    }

    deleteTodo(id) {
        const todos = this.state.getState().todos.filter(todo => todo.id !== id);
        this.state.setState({ todos });
    }

    toggleAll() {
        const { todos } = this.state.getState();
        const allCompleted = todos.length > 0 && todos.every(todo => todo.completed);
        const updatedTodos = todos.map(todo => ({ ...todo, completed: !allCompleted }));
        this.state.setState({ todos: updatedTodos });
    }

    clearCompleted() {
        const todos = this.state.getState().todos.filter(todo => !todo.completed);
        this.state.setState({ todos });
    }

    setFilter(filter) {
        this.state.setState({ filter });
        const path = filter === 'all' ? '/' : `/${filter}`;
        this.router.navigate(path);
    }

    startEditing(id) {
        this.state.setState({ editingId: id });
    }

    cancelEditing() {
        this.state.setState({ editingId: null });
    }

    render() {
        const { todos, filter, editingId } = this.state.getState();
        
        // Filter todos based on current filter
        const filteredTodos = todos.filter(todo => {
            switch (filter) {
                case 'active': return !todo.completed;
                case 'completed': return todo.completed;
                default: return true;
            }
        });

        const activeTodos = todos.filter(todo => !todo.completed);
        const completedTodos = todos.filter(todo => todo.completed);
        const hasTodos = todos.length > 0;

        return this.dom.createVNode('section', {
            class: 'todoapp'
        }, [
            this.dom.createVNode('header', { class: 'header' }, [
                this.dom.createVNode('h1', {}, ['todos']),
                new TodoHeader(this).render()
            ]),
            
            hasTodos && this.dom.createVNode('section', { class: 'main' }, [
                new TodoMain(this, filteredTodos, editingId).render()
            ]),
            
            hasTodos && this.dom.createVNode('footer', { class: 'footer' }, [
                new TodoFooter(this, activeTodos.length, completedTodos.length, filter).render()
            ])
        ].filter(Boolean));
    }
}