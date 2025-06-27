/**
 * TodoMVC Footer Component - Contains filters and clear completed
 */

// DOM functions accessed through app.dom

export default class TodoFooter {
    constructor(app, activeCount, completedCount, currentFilter) {
        this.app = app;
        this.activeCount = activeCount;
        this.completedCount = completedCount;
        this.currentFilter = currentFilter;
    }

    handleFilterClick(filter, event) {
        event.preventDefault();
        this.app.setFilter(filter);
    }

    handleClearCompleted() {
        this.app.clearCompleted();
    }

    render() {
        const itemsText = this.activeCount === 1 ? 'item' : 'items';
        
        return [
            this.app.dom.createVNode('span', { class: 'todo-count' }, [
                this.app.dom.createVNode('strong', {}, [this.activeCount.toString()]),
                ` ${itemsText} left`
            ]),
            
            this.app.dom.createVNode('ul', { class: 'filters' }, [
                this.app.dom.createVNode('li', {}, [
                    this.app.dom.createVNode('a', {
                        href: '#/',
                        class: this.currentFilter === 'all' ? 'selected' : '',
                        onClick: (event) => this.handleFilterClick('all', event)
                    }, ['All'])
                ]),
                this.app.dom.createVNode('li', {}, [
                    this.app.dom.createVNode('a', {
                        href: '#/active',
                        class: this.currentFilter === 'active' ? 'selected' : '',
                        onClick: (event) => this.handleFilterClick('active', event)
                    }, ['Active'])
                ]),
                this.app.dom.createVNode('li', {}, [
                    this.app.dom.createVNode('a', {
                        href: '#/completed',
                        class: this.currentFilter === 'completed' ? 'selected' : '',
                        onClick: (event) => this.handleFilterClick('completed', event)
                    }, ['Completed'])
                ])
            ]),
            
            this.completedCount > 0 && this.app.dom.createVNode('button', {
                class: 'clear-completed',
                onClick: () => this.handleClearCompleted()
            }, ['Clear completed'])
        ].filter(Boolean);
    }
}