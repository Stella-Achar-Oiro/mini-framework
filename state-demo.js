/**
 * State Management Demo
 * Comprehensive demonstration of state management features
 */

import { MiniFramework } from './src/index.js';
import { h, div, button, p, input, span, textarea } from './src/utils/dom-helpers.js';

// Create a state-driven component that demonstrates all state features
function StateManagementDemo(props = {}) {
    const state = props.state || {};
    
    return div({ class: 'state-demo', style: 'padding: 20px; max-width: 1200px; margin: 0 auto;' }, [
        h('h1', { style: 'text-align: center; color: #333; margin-bottom: 30px;' }, '🚀 State Management System Demo'),
        
        // Counter Section
        div({ class: 'section', style: 'margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;' }, [
            h('h2', { style: 'color: #007bff; margin-top: 0;' }, '📊 Counter State'),
            div({ style: 'display: flex; align-items: center; gap: 15px; margin: 15px 0;' }, [
                span({ style: 'font-size: 18px; font-weight: bold;' }, `Count: ${state.count || 0}`),
                span({ style: 'font-size: 14px; color: #666;' }, `Double: ${(state.count || 0) * 2}`),
                span({ style: 'font-size: 14px; color: #666;' }, `Even: ${(state.count || 0) % 2 === 0 ? 'Yes' : 'No'}`)
            ]),
            div({ style: 'display: flex; gap: 10px; margin: 15px 0;' }, [
                button({ 
                    class: 'increment-btn',
                    style: 'padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;'
                }, 'Increment'),
                button({ 
                    class: 'decrement-btn',
                    style: 'padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;'
                }, 'Decrement'),
                button({ 
                    class: 'reset-btn',
                    style: 'padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;'
                }, 'Reset'),
                button({ 
                    class: 'batch-update-btn',
                    style: 'padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;'
                }, 'Batch Update')
            ])
        ]),

        // User Profile Section
        div({ class: 'section', style: 'margin: 20px 0; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;' }, [
            h('h2', { style: 'color: #856404; margin-top: 0;' }, '👤 User Profile State'),
            div({ style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px;' }, [
                div({}, [
                    p({ style: 'margin: 5px 0; font-weight: bold;' }, `Name: ${state.user?.name || 'Unknown'}`),
                    p({ style: 'margin: 5px 0; font-weight: bold;' }, `Email: ${state.user?.email || 'Not set'}`),
                    p({ style: 'margin: 5px 0; font-weight: bold;' }, `Age: ${state.user?.age || 'Not set'}`),
                    p({ style: 'margin: 5px 0; font-weight: bold;' }, `Active: ${state.user?.active ? 'Yes' : 'No'}`)
                ]),
                div({}, [
                    input({ 
                        class: 'name-input',
                        type: 'text',
                        placeholder: 'Enter name...',
                        value: state.user?.name || '',
                        style: 'width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;'
                    }),
                    input({ 
                        class: 'email-input',
                        type: 'email',
                        placeholder: 'Enter email...',
                        value: state.user?.email || '',
                        style: 'width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;'
                    }),
                    input({ 
                        class: 'age-input',
                        type: 'number',
                        placeholder: 'Enter age...',
                        value: state.user?.age || '',
                        style: 'width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;'
                    }),
                    button({ 
                        class: 'toggle-active-btn',
                        style: 'width: 100%; padding: 8px; margin: 5px 0; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer;'
                    }, 'Toggle Active')
                ])
            ])
        ]),

        // Todo List Section
        div({ class: 'section', style: 'margin: 20px 0; padding: 20px; background: #d1ecf1; border-radius: 8px; border-left: 4px solid #17a2b8;' }, [
            h('h2', { style: 'color: #0c5460; margin-top: 0;' }, '📝 Todo List State'),
            div({ style: 'margin: 15px 0;' }, [
                input({ 
                    class: 'todo-input',
                    type: 'text',
                    placeholder: 'Enter new todo...',
                    style: 'width: 70%; padding: 8px; border: 1px solid #ddd; border-radius: 4px 0 0 4px;'
                }),
                button({ 
                    class: 'add-todo-btn',
                    style: 'width: 30%; padding: 8px; background: #17a2b8; color: white; border: none; border-radius: 0 4px 4px 0; cursor: pointer;'
                }, 'Add Todo')
            ]),
            div({ class: 'todo-list', style: 'margin: 15px 0;' }, 
                (state.todos || []).map((todo, index) => 
                    div({ 
                        key: todo.id,
                        style: `padding: 10px; margin: 5px 0; background: white; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; ${todo.completed ? 'opacity: 0.6;' : ''}`
                    }, [
                        span({ 
                            style: `flex: 1; ${todo.completed ? 'text-decoration: line-through;' : ''}`
                        }, todo.text),
                        div({ style: 'display: flex; gap: 5px;' }, [
                            button({ 
                                class: 'toggle-todo-btn',
                                'data-todo-id': todo.id,
                                style: 'padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;'
                            }, todo.completed ? 'Undo' : 'Done'),
                            button({ 
                                class: 'delete-todo-btn',
                                'data-todo-id': todo.id,
                                style: 'padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;'
                            }, 'Delete')
                        ])
                    ])
                )
            ),
            div({ style: 'margin: 15px 0; display: flex; gap: 10px;' }, [
                button({ 
                    class: 'clear-completed-btn',
                    style: 'padding: 8px 16px; background: #fd7e14; color: white; border: none; border-radius: 4px; cursor: pointer;'
                }, 'Clear Completed'),
                span({ style: 'padding: 8px; color: #6c757d;' }, 
                    `${(state.todos || []).filter(t => !t.completed).length} remaining`
                )
            ])
        ]),

        // History and Debugging Section
        div({ class: 'section', style: 'margin: 20px 0; padding: 20px; background: #f8d7da; border-radius: 8px; border-left: 4px solid #dc3545;' }, [
            h('h2', { style: 'color: #721c24; margin-top: 0;' }, '🔍 State History & Debugging'),
            div({ style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;' }, [
                div({}, [
                    h('h4', { style: 'margin: 0 0 10px 0;' }, 'Time Travel'),
                    div({ style: 'display: flex; gap: 10px; margin: 10px 0;' }, [
                        button({ 
                            class: 'undo-btn',
                            style: 'padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;'
                        }, '⏪ Undo'),
                        button({ 
                            class: 'redo-btn',
                            style: 'padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;'
                        }, '⏩ Redo')
                    ])
                ]),
                div({}, [
                    h('h4', { style: 'margin: 0 0 10px 0;' }, 'State Management'),
                    div({ style: 'display: flex; gap: 10px; margin: 10px 0; flex-wrap: wrap;' }, [
                        button({ 
                            class: 'export-state-btn',
                            style: 'padding: 6px 12px; background: #20c997; color: white; border: none; border-radius: 4px; cursor: pointer;'
                        }, '📤 Export'),
                        button({ 
                            class: 'clear-history-btn',
                            style: 'padding: 6px 12px; background: #e83e8c; color: white; border: none; border-radius: 4px; cursor: pointer;'
                        }, '🗑️ Clear History'),
                        button({ 
                            class: 'show-stats-btn',
                            style: 'padding: 6px 12px; background: #6610f2; color: white; border: none; border-radius: 4px; cursor: pointer;'
                        }, '📊 Stats')
                    ])
                ])
            ]),
            div({ class: 'state-output', style: 'margin: 15px 0;' }, [
                h('h4', { style: 'margin: 0 0 10px 0;' }, 'Current State (Live)'),
                textarea({ 
                    readonly: true,
                    style: 'width: 100%; height: 120px; font-family: monospace; font-size: 12px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa;',
                    value: JSON.stringify(state, null, 2)
                })
            ])
        ]),

        // Features Summary
        div({ style: 'margin: 20px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;' }, [
            h('h2', { style: 'color: #155724; margin-top: 0;' }, '✨ State Management Features'),
            div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;' }, [
                div({}, [
                    h('h4', { style: 'color: #155724; margin: 0 0 10px 0;' }, '🔄 Reactive Updates'),
                    p({ style: 'margin: 0; font-size: 14px; color: #155724;' }, 'Automatic UI re-rendering when state changes')
                ]),
                div({}, [
                    h('h4', { style: 'color: #155724; margin: 0 0 10px 0;' }, '👁️ Path Watching'),
                    p({ style: 'margin: 0; font-size: 14px; color: #155724;' }, 'Subscribe to specific state paths for targeted updates')
                ]),
                div({}, [
                    h('h4', { style: 'color: #155724; margin: 0 0 10px 0;' }, '⚡ Batching'),
                    p({ style: 'margin: 0; font-size: 14px; color: #155724;' }, 'Performance optimization through update batching')
                ]),
                div({}, [
                    h('h4', { style: 'color: #155724; margin: 0 0 10px 0;' }, '✅ Validation'),
                    p({ style: 'margin: 0; font-size: 14px; color: #155724;' }, 'State validation and middleware support')
                ]),
                div({}, [
                    h('h4', { style: 'color: #155724; margin: 0 0 10px 0;' }, '⏰ Time Travel'),
                    p({ style: 'margin: 0; font-size: 14px; color: #155724;' }, 'Undo/redo functionality for debugging')
                ]),
                div({}, [
                    h('h4', { style: 'color: #155724; margin: 0 0 10px 0;' }, '💾 Persistence'),
                    p({ style: 'margin: 0; font-size: 14px; color: #155724;' }, 'Automatic localStorage persistence')
                ])
            ])
        ])
    ]);
}

// Initialize framework when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new MiniFramework({
        container: '#app',
        debug: true,
        autoRerender: true,
        state: {
            count: 0,
            user: {
                name: 'John Doe',
                email: 'john@example.com',
                age: 25,
                active: true
            },
            todos: [
                { id: 1, text: 'Learn Mini Framework', completed: false },
                { id: 2, text: 'Build awesome app', completed: false },
                { id: 3, text: 'Test state management', completed: true }
            ]
        },
        events: {
            delegation: true,
            debug: true
        }
    });

    app.init();

    // Set up state management event handlers
    let todoIdCounter = 4;

    // Counter controls
    app.events.on('.increment-btn', 'click', () => {
        app.state.setState('count', (app.state.getState('count') || 0) + 1);
    });

    app.events.on('.decrement-btn', 'click', () => {
        app.state.setState('count', (app.state.getState('count') || 0) - 1);
    });

    app.events.on('.reset-btn', 'click', () => {
        app.state.setState('count', 0);
    });

    app.events.on('.batch-update-btn', 'click', () => {
        app.state.batch(async () => {
            await app.state.setState('count', (app.state.getState('count') || 0) + 5);
            await app.state.setState('user.name', 'Batch Updated User');
            await app.state.setState('user.active', true);
        });
    });

    // User profile controls
    app.events.on('.name-input', 'input', (e) => {
        app.state.setState('user.name', e.target.value);
    });

    app.events.on('.email-input', 'input', (e) => {
        app.state.setState('user.email', e.target.value);
    });

    app.events.on('.age-input', 'input', (e) => {
        app.state.setState('user.age', parseInt(e.target.value) || 0);
    });

    app.events.on('.toggle-active-btn', 'click', () => {
        const currentActive = app.state.getState('user.active');
        app.state.setState('user.active', !currentActive);
    });

    // Todo controls
    app.events.on('.add-todo-btn', 'click', () => {
        const input = document.querySelector('.todo-input');
        const text = input.value.trim();
        if (text) {
            const todos = app.state.getState('todos') || [];
            const newTodo = { id: todoIdCounter++, text, completed: false };
            app.state.setState('todos', [...todos, newTodo]);
            input.value = '';
        }
    });

    app.events.on('.todo-input', 'keypress', (e) => {
        if (e.key === 'Enter') {
            document.querySelector('.add-todo-btn').click();
        }
    });

    app.events.on('.toggle-todo-btn', 'click', (e) => {
        const todoId = parseInt(e.currentTarget.dataset.todoId);
        const todos = app.state.getState('todos') || [];
        const updatedTodos = todos.map(todo => 
            todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
        );
        app.state.setState('todos', updatedTodos);
    });

    app.events.on('.delete-todo-btn', 'click', (e) => {
        const todoId = parseInt(e.currentTarget.dataset.todoId);
        const todos = app.state.getState('todos') || [];
        const updatedTodos = todos.filter(todo => todo.id !== todoId);
        app.state.setState('todos', updatedTodos);
    });

    app.events.on('.clear-completed-btn', 'click', () => {
        const todos = app.state.getState('todos') || [];
        const activeTodos = todos.filter(todo => !todo.completed);
        app.state.setState('todos', activeTodos);
    });

    // History and debugging controls
    app.events.on('.undo-btn', 'click', () => {
        app.state.undo();
    });

    app.events.on('.redo-btn', 'click', () => {
        app.state.redo();
    });

    app.events.on('.export-state-btn', 'click', () => {
        const exported = app.state.export();
        console.log('📤 Exported State:', exported);
        
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'state-export.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    app.events.on('.clear-history-btn', 'click', () => {
        app.state.clearHistory();
        console.log('🗑️ State history cleared');
    });

    app.events.on('.show-stats-btn', 'click', () => {
        const stats = app.state.getStats();
        console.log('📊 State Management Stats:', stats);
        alert(`State Stats:\n\nUpdates: ${stats.updates}\nSubscriptions: ${stats.activeSubscriptions}\nHistory Size: ${stats.historySize}\nAvg Update Time: ${stats.averageUpdateTime.toFixed(2)}ms`);
    });

    // Set up watchers for specific paths
    app.state.watch('count', (newValue, oldValue) => {
        console.log(`🔢 Count changed: ${oldValue} → ${newValue}`);
    });

    app.state.watch('user.name', (newValue, oldValue) => {
        console.log(`👤 User name changed: ${oldValue} → ${newValue}`);
    });

    app.state.watch('todos', (newTodos, oldTodos) => {
        console.log(`📝 Todos updated: ${oldTodos?.length || 0} → ${newTodos?.length || 0} items`);
    });

    // Set up computed properties
    app.state.computed('completedTodos', (state) => {
        return (state.todos || []).filter(todo => todo.completed);
    }, ['todos']);

    app.state.computed('userDisplayName', (state) => {
        const user = state.user || {};
        return `${user.name || 'Unknown'} (${user.email || 'no email'})`;
    }, ['user.name', 'user.email']);

    // Add some middleware
    app.state.use((action, currentState, nextState) => {
        console.log('🔄 State middleware:', action.type, action);
        return nextState;
    }, { name: 'logger', priority: 1 });

    // Add state validation
    app.state.addValidator('count', (value) => {
        return typeof value === 'number' && value >= 0;
    });

    app.state.addValidator('user.age', (value, fullState) => {
        return !value || (typeof value === 'number' && value >= 0 && value <= 150);
    });

    // Subscribe to global state changes
    app.state.subscribe((newState, prevState, changeInfo) => {
        console.log('🌍 Global state change:', changeInfo.type, changeInfo);
    });

    // Render the demo
    function renderDemo() {
        const currentState = app.state.getState();
        const demo = StateManagementDemo({ state: currentState });
        app.render(demo);
    }

    // Subscribe to state changes for re-rendering
    app.state.subscribe(() => {
        renderDemo();
    });

    // Initial render
    renderDemo();

    console.log('🎉 State Management Demo initialized!');
    console.log('📊 Initial state:', app.state.getState());
    console.log('📈 Computed completedTodos:', app.state.getComputed('completedTodos'));
    console.log('📈 Computed userDisplayName:', app.state.getComputed('userDisplayName'));
});