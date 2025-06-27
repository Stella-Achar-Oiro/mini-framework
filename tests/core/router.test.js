import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../../src/core/router.js';

describe('Router', () => {
  let router;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Reset location
    window.location.hash = '';
    window.location.pathname = '/';
    
    router = new Router({
      container: container,
      mode: 'hash'
    });
  });

  afterEach(() => {
    if (router) {
      router.destroy();
    }
    document.body.innerHTML = '';
    window.location.hash = '';
  });

  describe('initialization', () => {
    it('should create router with default options', () => {
      expect(router.mode).toBe('hash');
      expect(router.isActive).toBe(false);
    });

    it('should initialize with custom options', () => {
      const customRouter = new Router({
        container: container,
        mode: 'history',
        base: '/app',
        scrollBehavior: 'smooth'
      });

      expect(customRouter.mode).toBe('history');
      expect(customRouter.options.base).toBe('/app');
      expect(customRouter.options.scrollBehavior).toBe('smooth');
    });
  });

  describe('route registration', () => {
    it('should register simple routes', () => {
      const homeComponent = () => ({ tag: 'div', children: ['Home'] });
      const aboutComponent = () => ({ tag: 'div', children: ['About'] });

      router.addRoute('/', homeComponent);
      router.addRoute('/about', aboutComponent);

      expect(router.routes.size).toBe(2);
    });

    it('should register routes with parameters', () => {
      const userComponent = (params) => ({ 
        tag: 'div', 
        children: [`User: ${params.id}`] 
      });

      router.addRoute('/user/:id', userComponent);
      expect(router.routes.size).toBe(1);
    });

    it('should register routes with wildcards', () => {
      const catchAllComponent = () => ({ tag: 'div', children: ['Not Found'] });
      router.addRoute('*', catchAllComponent);
      expect(router.routes.size).toBe(1);
    });

    it('should register routes with guards', () => {
      const guard = vi.fn(() => true);
      const component = () => ({ tag: 'div', children: ['Protected'] });

      router.addRoute('/protected', component, {
        beforeEnter: guard
      });

      expect(router.routes.size).toBe(1);
    });

    it('should register nested routes', () => {
      const parentComponent = () => ({ tag: 'div', children: ['Parent'] });
      const childComponent = () => ({ tag: 'div', children: ['Child'] });

      router.addRoute('/parent', parentComponent);
      router.addRoute('/parent/child', childComponent);

      expect(router.routes.size).toBe(2);
    });
  });

  describe('route matching', () => {
    beforeEach(() => {
      router.addRoute('/', () => ({ tag: 'div', children: ['Home'] }));
      router.addRoute('/about', () => ({ tag: 'div', children: ['About'] }));
      router.addRoute('/user/:id', (params) => ({ 
        tag: 'div', 
        children: [`User: ${params.id}`] 
      }));
      router.addRoute('/posts/:category/:slug', (params) => ({
        tag: 'div',
        children: [`${params.category}: ${params.slug}`]
      }));
      router.addRoute('*', () => ({ tag: 'div', children: ['Not Found'] }));
    });

    it('should match exact routes', () => {
      const match = router.match('/about');
      expect(match).toBeTruthy();
      expect(match.route.path).toBe('/about');
    });

    it('should match parameterized routes', () => {
      const match = router.match('/user/123');
      expect(match).toBeTruthy();
      expect(match.route.path).toBe('/user/:id');
      expect(match.params.id).toBe('123');
    });

    it('should match routes with multiple parameters', () => {
      const match = router.match('/posts/tech/javascript-tips');
      expect(match).toBeTruthy();
      expect(match.params.category).toBe('tech');
      expect(match.params.slug).toBe('javascript-tips');
    });

    it('should match wildcard routes', () => {
      const match = router.match('/nonexistent/path');
      expect(match).toBeTruthy();
      expect(match.route.path).toBe('*');
    });

    it('should return null for no match when no wildcard', () => {
      const router = new Router({ container: container });
      router.addRoute('/', () => ({ tag: 'div', children: ['Home'] }));
      
      const match = router.match('/nonexistent');
      expect(match).toBeNull();
    });

    it('should parse query parameters', () => {
      const match = router.match('/user/123?tab=profile&sort=name');
      expect(match.query.tab).toBe('profile');
      expect(match.query.sort).toBe('name');
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      router.addRoute('/', () => ({ tag: 'div', children: ['Home'] }));
      router.addRoute('/about', () => ({ tag: 'div', children: ['About'] }));
      router.addRoute('/user/:id', (params) => ({ 
        tag: 'div', 
        children: [`User: ${params.id}`] 
      }));
      router.start();
    });

    it('should navigate to routes', async () => {
      await router.navigate('/about');
      expect(router.currentRoute.path).toBe('/about');
      expect(container.innerHTML).toContain('About');
    });

    it('should navigate with parameters', async () => {
      await router.navigate('/user/456');
      expect(router.currentRoute.path).toBe('/user/:id');
      expect(container.innerHTML).toContain('User: 456');
    });

    it('should handle navigation with query parameters', async () => {
      await router.navigate('/user/123?tab=settings');
      expect(router.currentParams.id).toBe('123');
      expect(router.currentQuery.tab).toBe('settings');
    });

    it('should update browser history in history mode', async () => {
      const historyRouter = new Router({
        container: container,
        mode: 'history'
      });
      historyRouter.addRoute('/test', () => ({ tag: 'div', children: ['Test'] }));
      historyRouter.start();

      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      
      await historyRouter.navigate('/test');
      expect(pushStateSpy).toHaveBeenCalledWith(
        expect.any(Object),
        '',
        '/test'
      );
    });

    it('should update hash in hash mode', async () => {
      await router.navigate('/about');
      expect(window.location.hash).toBe('#/about');
    });
  });

  describe('route guards', () => {
    it('should execute beforeEnter guards', async () => {
      const guard = vi.fn(() => true);
      const component = () => ({ tag: 'div', children: ['Protected'] });

      router.addRoute('/protected', component, {
        beforeEnter: guard
      });
      router.start();

      await router.navigate('/protected');
      expect(guard).toHaveBeenCalled();
      expect(container.innerHTML).toContain('Protected');
    });

    it('should prevent navigation when guard returns false', async () => {
      const guard = vi.fn(() => false);
      const component = () => ({ tag: 'div', children: ['Protected'] });

      router.addRoute('/', () => ({ tag: 'div', children: ['Home'] }));
      router.addRoute('/protected', component, {
        beforeEnter: guard
      });
      router.start();

      await router.navigate('/');
      await router.navigate('/protected');
      
      expect(guard).toHaveBeenCalled();
      expect(container.innerHTML).toContain('Home'); // Should stay on home
    });

    it('should handle async guards', async () => {
      const asyncGuard = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
      });
      const component = () => ({ tag: 'div', children: ['Async Protected'] });

      router.addRoute('/async-protected', component, {
        beforeEnter: asyncGuard
      });
      router.start();

      await router.navigate('/async-protected');
      expect(asyncGuard).toHaveBeenCalled();
      expect(container.innerHTML).toContain('Async Protected');
    });

    it('should handle global guards', async () => {
      const globalGuard = vi.fn(() => true);
      router.beforeEach(globalGuard);

      router.addRoute('/test', () => ({ tag: 'div', children: ['Test'] }));
      router.start();

      await router.navigate('/test');
      expect(globalGuard).toHaveBeenCalled();
    });
  });

  describe('lazy loading', () => {
    it('should support lazy loaded components', async () => {
      const lazyComponent = vi.fn(async () => ({
        tag: 'div',
        children: ['Lazy Loaded']
      }));

      router.addRoute('/lazy', lazyComponent, { lazy: true });
      router.start();

      await router.navigate('/lazy');
      expect(lazyComponent).toHaveBeenCalled();
      expect(container.innerHTML).toContain('Lazy Loaded');
    });

    it('should handle lazy loading errors', async () => {
      const failingLazyComponent = vi.fn(async () => {
        throw new Error('Failed to load');
      });

      router.addRoute('/failing-lazy', failingLazyComponent, { lazy: true });
      router.start();

      await expect(router.navigate('/failing-lazy')).rejects.toThrow();
    });
  });

  describe('route transitions', () => {
    it('should execute transition hooks', async () => {
      const beforeLeave = vi.fn();
      const beforeEnter = vi.fn();

      router.addRoute('/', () => ({ tag: 'div', children: ['Home'] }), {
        beforeLeave
      });
      router.addRoute('/about', () => ({ tag: 'div', children: ['About'] }), {
        beforeEnter
      });
      router.start();

      await router.navigate('/');
      await router.navigate('/about');

      expect(beforeLeave).toHaveBeenCalled();
      expect(beforeEnter).toHaveBeenCalled();
    });

    it('should support animated transitions', async () => {
      router.addRoute('/', () => ({ tag: 'div', children: ['Home'] }));
      router.addRoute('/about', () => ({ tag: 'div', children: ['About'] }), {
        transition: {
          name: 'fade',
          duration: 300
        }
      });
      router.start();

      await router.navigate('/');
      await router.navigate('/about');

      // Should have applied transition classes
      expect(container.querySelector('[data-transition]')).toBeTruthy();
    });
  });

  describe('programmatic navigation', () => {
    beforeEach(() => {
      router.addRoute('/', () => ({ tag: 'div', children: ['Home'] }));
      router.addRoute('/about', () => ({ tag: 'div', children: ['About'] }));
      router.start();
    });

    it('should support push navigation', async () => {
      await router.push('/about');
      expect(router.currentRoute.path).toBe('/about');
    });

    it('should support replace navigation', async () => {
      await router.navigate('/about');
      await router.replace('/');
      expect(router.currentRoute.path).toBe('/');
    });

    it('should support go/back/forward navigation', async () => {
      await router.navigate('/about');
      await router.back();
      expect(router.currentRoute.path).toBe('/');
    });
  });

  describe('error handling', () => {
    it('should handle component render errors', async () => {
      const errorComponent = () => {
        throw new Error('Component error');
      };

      router.addRoute('/error', errorComponent);
      router.start();

      await expect(router.navigate('/error')).rejects.toThrow();
    });

    it('should handle invalid routes gracefully', async () => {
      router.start();
      await router.navigate('/nonexistent');
      // Should not crash
      expect(router.isActive).toBe(true);
    });

    it('should handle guard errors', async () => {
      const errorGuard = () => {
        throw new Error('Guard error');
      };

      router.addRoute('/guarded', () => ({ tag: 'div', children: ['Guarded'] }), {
        beforeEnter: errorGuard
      });
      router.start();

      await expect(router.navigate('/guarded')).rejects.toThrow();
    });
  });

  describe('events', () => {
    it('should emit navigation events', async () => {
      const beforeNavigate = vi.fn();
      const afterNavigate = vi.fn();

      router.on('beforeNavigate', beforeNavigate);
      router.on('afterNavigate', afterNavigate);

      router.addRoute('/test', () => ({ tag: 'div', children: ['Test'] }));
      router.start();

      await router.navigate('/test');

      expect(beforeNavigate).toHaveBeenCalled();
      expect(afterNavigate).toHaveBeenCalled();
    });

    it('should emit route change events', async () => {
      const routeChange = vi.fn();
      router.on('routeChange', routeChange);

      router.addRoute('/test', () => ({ tag: 'div', children: ['Test'] }));
      router.start();

      await router.navigate('/test');
      expect(routeChange).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clean up event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      router.start();
      router.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(router.isActive).toBe(false);
    });

    it('should clear routes on destroy', () => {
      router.addRoute('/', () => ({ tag: 'div', children: ['Home'] }));
      router.destroy();

      expect(router.routes.size).toBe(0);
    });
  });

  describe('base path handling', () => {
    it('should handle base path in history mode', async () => {
      const baseRouter = new Router({
        container: container,
        mode: 'history',
        base: '/app'
      });

      baseRouter.addRoute('/test', () => ({ tag: 'div', children: ['Test'] }));
      baseRouter.start();

      await baseRouter.navigate('/test');
      expect(baseRouter.currentRoute.path).toBe('/test');
    });
  });

  describe('scroll behavior', () => {
    it('should handle scroll behavior on navigation', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      
      const scrollRouter = new Router({
        container: container,
        scrollBehavior: 'top'
      });

      scrollRouter.addRoute('/test', () => ({ tag: 'div', children: ['Test'] }));
      scrollRouter.start();

      await scrollRouter.navigate('/test');
      expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    });
  });
});