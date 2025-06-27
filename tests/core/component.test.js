import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MiniFramework } from '../../src/core/component.js';

describe('MiniFramework', () => {
  let container;
  let framework;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (framework && !framework.isDestroyed) {
      framework.destroy();
    }
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should create framework instance with default options', () => {
      framework = new MiniFramework({
        container: '#app'
      });
      
      expect(framework.isInitialized).toBe(false);
      expect(framework.isDestroyed).toBe(false);
      expect(framework.phase).toBe('created');
    });

    it('should initialize framework with custom options', () => {
      framework = new MiniFramework({
        container: '#app',
        state: { count: 0 },
        debug: true,
        strictMode: true
      });

      framework.init();
      
      expect(framework.isInitialized).toBe(true);
      expect(framework.state.get('count')).toBe(0);
    });

    it('should initialize DOM, state, events, and router', () => {
      framework = new MiniFramework({
        container: '#app',
        routes: {
          '/': () => ({ tag: 'div', children: ['Home'] }),
          '/about': () => ({ tag: 'div', children: ['About'] })
        }
      });

      framework.init();

      expect(framework.dom).toBeDefined();
      expect(framework.state).toBeDefined();
      expect(framework.events).toBeDefined();
      expect(framework.router).toBeDefined();
    });

    it('should throw error if container not found', () => {
      framework = new MiniFramework({
        container: '#nonexistent'
      });

      expect(() => framework.init()).toThrow();
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      framework = new MiniFramework({
        container: '#app',
        state: { message: 'Hello World' }
      });
      framework.init();
    });

    it('should render simple components', () => {
      const vnode = {
        tag: 'div',
        children: ['Hello World']
      };

      framework.render(vnode);
      expect(container.innerHTML).toContain('Hello World');
    });

    it('should render components with state', () => {
      const vnode = {
        tag: 'div',
        children: [framework.state.get('message')]
      };

      framework.render(vnode);
      expect(container.innerHTML).toContain('Hello World');
    });

    it('should update rendering when state changes', () => {
      framework.render(() => ({
        tag: 'div',
        children: [framework.state.get('message')]
      }));

      framework.state.set('message', 'Updated Message');
      expect(container.innerHTML).toContain('Updated Message');
    });

    it('should handle rendering errors gracefully', () => {
      const badVnode = {
        tag: 'div',
        children: [() => { throw new Error('Render error'); }]
      };

      expect(() => framework.render(badVnode)).not.toThrow();
    });
  });

  describe('lifecycle', () => {
    it('should go through proper lifecycle phases', () => {
      const phases = [];
      
      framework = new MiniFramework({
        container: '#app',
        onCreated: () => phases.push('created'),
        onMounting: () => phases.push('mounting'),
        onMounted: () => phases.push('mounted'),
        onDestroyed: () => phases.push('destroyed')
      });

      expect(framework.phase).toBe('created');
      
      framework.init();
      expect(framework.phase).toBe('mounted');
      
      framework.destroy();
      expect(framework.phase).toBe('destroyed');
    });

    it('should call lifecycle hooks', () => {
      const hooks = {
        onCreated: vi.fn(),
        onMounting: vi.fn(),
        onMounted: vi.fn(),
        onUpdating: vi.fn(),
        onUpdated: vi.fn(),
        onDestroyed: vi.fn()
      };

      framework = new MiniFramework({
        container: '#app',
        ...hooks
      });

      framework.init();
      expect(hooks.onMounted).toHaveBeenCalled();

      framework.render({ tag: 'div', children: ['test'] });
      expect(hooks.onUpdated).toHaveBeenCalled();

      framework.destroy();
      expect(hooks.onDestroyed).toHaveBeenCalled();
    });
  });

  describe('state management integration', () => {
    beforeEach(() => {
      framework = new MiniFramework({
        container: '#app',
        state: { 
          user: { name: 'John' },
          count: 0 
        }
      });
      framework.init();
    });

    it('should reactive render on state changes', () => {
      framework.render(() => ({
        tag: 'div',
        children: [`Count: ${framework.state.get('count')}`]
      }));

      expect(container.innerHTML).toContain('Count: 0');

      framework.state.set('count', 5);
      expect(container.innerHTML).toContain('Count: 5');
    });

    it('should handle nested state updates', () => {
      framework.render(() => ({
        tag: 'div',
        children: [`User: ${framework.state.get('user.name')}`]
      }));

      expect(container.innerHTML).toContain('User: John');

      framework.state.set('user.name', 'Jane');
      expect(container.innerHTML).toContain('User: Jane');
    });
  });

  describe('event handling integration', () => {
    beforeEach(() => {
      framework = new MiniFramework({
        container: '#app',
        state: { count: 0 }
      });
      framework.init();
    });

    it('should handle click events', () => {
      const clickHandler = vi.fn();
      
      framework.render({
        tag: 'button',
        attributes: {
          onclick: clickHandler
        },
        children: ['Click me']
      });

      const button = container.querySelector('button');
      button.click();
      expect(clickHandler).toHaveBeenCalled();
    });

    it('should handle events with state updates', () => {
      framework.render(() => ({
        tag: 'div',
        children: [
          `Count: ${framework.state.get('count')}`,
          {
            tag: 'button',
            attributes: {
              onclick: () => framework.state.set('count', framework.state.get('count') + 1)
            },
            children: ['Increment']
          }
        ]
      }));

      expect(container.innerHTML).toContain('Count: 0');
      
      const button = container.querySelector('button');
      button.click();
      expect(container.innerHTML).toContain('Count: 1');
    });
  });

  describe('routing integration', () => {
    beforeEach(() => {
      framework = new MiniFramework({
        container: '#app',
        routes: {
          '/': () => ({ tag: 'div', children: ['Home Page'] }),
          '/about': () => ({ tag: 'div', children: ['About Page'] }),
          '/user/:id': (params) => ({ 
            tag: 'div', 
            children: [`User ID: ${params.id}`] 
          })
        }
      });
      framework.init();
    });

    it('should render routes', () => {
      framework.router.navigate('/');
      expect(container.innerHTML).toContain('Home Page');

      framework.router.navigate('/about');
      expect(container.innerHTML).toContain('About Page');
    });

    it('should handle route parameters', () => {
      framework.router.navigate('/user/123');
      expect(container.innerHTML).toContain('User ID: 123');
    });

    it('should handle route not found', () => {
      framework.router.navigate('/nonexistent');
      // Should not crash and should render fallback or empty
      expect(() => framework.router.navigate('/nonexistent')).not.toThrow();
    });
  });

  describe('plugins', () => {
    it('should register and use plugins', () => {
      const plugin = {
        name: 'testPlugin',
        install: vi.fn((framework) => {
          framework.testMethod = vi.fn();
        })
      };

      framework = new MiniFramework({
        container: '#app',
        plugins: [plugin]
      });

      framework.init();
      
      expect(plugin.install).toHaveBeenCalledWith(framework);
      expect(framework.testMethod).toBeDefined();
    });

    it('should handle plugin errors gracefully', () => {
      const badPlugin = {
        name: 'badPlugin',
        install: () => { throw new Error('Plugin error'); }
      };

      framework = new MiniFramework({
        container: '#app',
        plugins: [badPlugin]
      });

      expect(() => framework.init()).not.toThrow();
    });
  });

  describe('performance', () => {
    beforeEach(() => {
      framework = new MiniFramework({
        container: '#app',
        state: { items: [] }
      });
      framework.init();
    });

    it('should handle large lists efficiently', () => {
      const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
      framework.state.set('items', items);

      const start = performance.now();
      framework.render(() => ({
        tag: 'ul',
        children: framework.state.get('items').map(item => ({
          tag: 'li',
          children: [item]
        }))
      }));
      const renderTime = performance.now() - start;

      expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
      expect(container.querySelectorAll('li')).toHaveLength(1000);
    });

    it('should batch multiple state updates', () => {
      const renderSpy = vi.spyOn(framework, 'render');
      
      framework.render(() => ({
        tag: 'div',
        children: [`Count: ${framework.state.get('count', 0)}`]
      }));

      // Batch multiple updates
      framework.state.batch(() => {
        framework.state.set('count', 1);
        framework.state.set('count', 2);
        framework.state.set('count', 3);
      });

      // Should only render once for the batch
      expect(renderSpy).toHaveBeenCalledTimes(2); // Initial + batch
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors', () => {
      framework = new MiniFramework({
        container: '#nonexistent'
      });

      expect(() => framework.init()).toThrow();
      expect(framework.isInitialized).toBe(false);
    });

    it('should handle render errors with error boundaries', () => {
      framework = new MiniFramework({
        container: '#app',
        debug: true
      });
      framework.init();

      const errorVnode = () => {
        throw new Error('Render error');
      };

      expect(() => framework.render(errorVnode)).not.toThrow();
    });

    it('should handle state subscription errors', () => {
      framework = new MiniFramework({
        container: '#app'
      });
      framework.init();

      const badCallback = () => { throw new Error('Subscription error'); };
      framework.state.subscribe(badCallback);

      expect(() => framework.state.set('test', 'value')).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      framework = new MiniFramework({
        container: '#app',
        state: { count: 0 }
      });
      framework.init();

      const stateSpy = vi.spyOn(framework.state, 'cleanup');
      const eventsSpy = vi.spyOn(framework.events, 'cleanup');

      framework.destroy();

      expect(framework.isDestroyed).toBe(true);
      expect(framework.phase).toBe('destroyed');
      expect(stateSpy).toHaveBeenCalled();
      expect(eventsSpy).toHaveBeenCalled();
    });

    it('should prevent operations after destroy', () => {
      framework = new MiniFramework({
        container: '#app'
      });
      framework.init();
      framework.destroy();

      expect(() => framework.render({ tag: 'div' })).toThrow();
      expect(() => framework.state.set('test', 'value')).toThrow();
    });
  });
});