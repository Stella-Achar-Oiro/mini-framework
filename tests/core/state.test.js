import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateManager } from '../../src/core/state.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('basic state operations', () => {
    it('should set and get state values', async () => {
      await stateManager.setState('user.name', 'John');
      expect(stateManager.getState('user.name')).toBe('John');
    });

    it('should handle nested state paths', async () => {
      await stateManager.setState('user.profile.settings.theme', 'dark');
      expect(stateManager.getState('user.profile.settings.theme')).toBe('dark');
    });

    it('should return undefined for non-existent paths', () => {
      expect(stateManager.getState('non.existent.path')).toBeUndefined();
    });

    it('should handle array indices in paths', async () => {
      await stateManager.setState('items', ['a', 'b', 'c']);
      await stateManager.setState('items.1', 'modified');
      expect(stateManager.getState('items.1')).toBe('modified');
      expect(stateManager.getState('items')).toEqual(['a', 'modified', 'c']);
    });

    it('should merge objects correctly', async () => {
      await stateManager.setState('user', { name: 'John', age: 30 });
      await stateManager.mergeState('user', { age: 31, city: 'New York' });
      expect(stateManager.getState('user')).toEqual({
        name: 'John',
        age: 31,
        city: 'New York'
      });
    });

    it('should delete state properties', async () => {
      await stateManager.setState('user', { name: 'John', age: 30 });
      await stateManager.deleteState('user.age');
      expect(stateManager.getState('user')).toEqual({ name: 'John' });
    });

    it('should reset state to initial values', async () => {
      const initialState = { count: 0, user: null };
      stateManager = new StateManager(initialState);
      await stateManager.setState('count', 5);
      await stateManager.setState('user', { name: 'John' });
      
      stateManager.resetState();
      expect(stateManager.getState()).toEqual(initialState);
    });
  });

  describe('subscriptions', () => {
    it('should notify subscribers on state changes', () => {
      const callback = vi.fn();
      stateManager.subscribe(callback);
      
      stateManager.set('count', 1);
      expect(callback).toHaveBeenCalledWith(
        { count: 1 },
        {},
        expect.objectContaining({ type: 'set', path: 'count' })
      );
    });

    it('should support path-specific subscriptions', () => {
      const userCallback = vi.fn();
      const countCallback = vi.fn();
      
      stateManager.subscribe(userCallback, { path: 'user' });
      stateManager.subscribe(countCallback, { path: 'count' });
      
      stateManager.set('user.name', 'John');
      stateManager.set('count', 1);
      
      expect(userCallback).toHaveBeenCalledTimes(1);
      expect(countCallback).toHaveBeenCalledTimes(1);
    });

    it('should support conditional subscriptions', () => {
      const callback = vi.fn();
      stateManager.subscribe(callback, {
        condition: (newState) => newState.count > 5
      });
      
      stateManager.set('count', 3);
      expect(callback).not.toHaveBeenCalled();
      
      stateManager.set('count', 7);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support once-only subscriptions', () => {
      const callback = vi.fn();
      stateManager.subscribe(callback, { once: true });
      
      stateManager.set('count', 1);
      stateManager.set('count', 2);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support debounced subscriptions', (done) => {
      const callback = vi.fn();
      stateManager.subscribe(callback, { debounce: 50 });
      
      stateManager.set('count', 1);
      stateManager.set('count', 2);
      stateManager.set('count', 3);
      
      // Should not be called immediately
      expect(callback).not.toHaveBeenCalled();
      
      setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        done();
      }, 60);
    });

    it('should unsubscribe correctly', () => {
      const callback = vi.fn();
      const unsubscribe = stateManager.subscribe(callback);
      
      stateManager.set('count', 1);
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      stateManager.set('count', 2);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('computed properties', () => {
    it('should create computed properties', () => {
      stateManager.set('firstName', 'John');
      stateManager.set('lastName', 'Doe');
      
      stateManager.computed('fullName', (state) => 
        `${state.firstName} ${state.lastName}`
      );
      
      expect(stateManager.get('fullName')).toBe('John Doe');
    });

    it('should update computed properties when dependencies change', () => {
      stateManager.set('count', 5);
      stateManager.computed('doubled', (state) => state.count * 2);
      
      expect(stateManager.get('doubled')).toBe(10);
      
      stateManager.set('count', 7);
      expect(stateManager.get('doubled')).toBe(14);
    });

    it('should cache computed property results', () => {
      const computeFn = vi.fn((state) => state.count * 2);
      stateManager.set('count', 5);
      stateManager.computed('doubled', computeFn);
      
      // First access should compute
      stateManager.get('doubled');
      expect(computeFn).toHaveBeenCalledTimes(1);
      
      // Second access should use cache
      stateManager.get('doubled');
      expect(computeFn).toHaveBeenCalledTimes(1);
      
      // After state change, should recompute
      stateManager.set('count', 6);
      stateManager.get('doubled');
      expect(computeFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('middleware', () => {
    it('should execute middleware on state changes', () => {
      const middleware = vi.fn((action, next) => next());
      stateManager.use(middleware);
      
      stateManager.set('count', 1);
      expect(middleware).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'set', path: 'count' }),
        expect.any(Function)
      );
    });

    it('should allow middleware to modify actions', () => {
      const middleware = (action, next) => {
        if (action.type === 'set' && action.path === 'count') {
          action.value = action.value * 2;
        }
        next();
      };
      
      stateManager.use(middleware);
      stateManager.set('count', 5);
      
      expect(stateManager.get('count')).toBe(10);
    });

    it('should allow middleware to prevent actions', () => {
      const middleware = (action, next) => {
        if (action.path === 'forbidden') {
          return; // Don't call next()
        }
        next();
      };
      
      stateManager.use(middleware);
      stateManager.set('forbidden', 'value');
      
      expect(stateManager.get('forbidden')).toBeUndefined();
    });

    it('should execute multiple middleware in order', () => {
      const order = [];
      const middleware1 = (action, next) => {
        order.push('middleware1-before');
        next();
        order.push('middleware1-after');
      };
      const middleware2 = (action, next) => {
        order.push('middleware2-before');
        next();
        order.push('middleware2-after');
      };
      
      stateManager.use(middleware1);
      stateManager.use(middleware2);
      stateManager.set('count', 1);
      
      expect(order).toEqual([
        'middleware1-before',
        'middleware2-before',
        'middleware2-after',
        'middleware1-after'
      ]);
    });
  });

  describe('persistence', () => {
    it('should save state to localStorage', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      stateManager = new StateManager({}, { persist: true, storageKey: 'test' });
      
      stateManager.set('count', 5);
      expect(setItemSpy).toHaveBeenCalledWith('test', JSON.stringify({ count: 5 }));
    });

    it('should load state from localStorage', () => {
      const getItemSpy = vi.spyOn(localStorage, 'getItem')
        .mockReturnValue(JSON.stringify({ count: 10 }));
      
      stateManager = new StateManager({}, { persist: true, storageKey: 'test' });
      expect(stateManager.get('count')).toBe(10);
      expect(getItemSpy).toHaveBeenCalledWith('test');
    });

    it('should handle localStorage errors gracefully', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      stateManager = new StateManager({}, { persist: true });
      expect(() => stateManager.set('count', 1)).not.toThrow();
    });
  });

  describe('batch operations', () => {
    it('should batch multiple state changes', () => {
      const callback = vi.fn();
      stateManager.subscribe(callback);
      
      stateManager.batch(() => {
        stateManager.set('count', 1);
        stateManager.set('name', 'John');
        stateManager.set('active', true);
      });
      
      // Should only notify once for the batch
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in batch operations', () => {
      expect(() => {
        stateManager.batch(() => {
          stateManager.set('count', 1);
          throw new Error('Batch error');
        });
      }).toThrow('Batch error');
    });
  });

  describe('validation', () => {
    it('should validate state changes when validator is provided', () => {
      const validator = (path, value) => {
        if (path === 'count' && typeof value !== 'number') {
          throw new Error('Count must be a number');
        }
      };
      
      stateManager = new StateManager({}, { validator });
      
      expect(() => stateManager.set('count', 'invalid')).toThrow('Count must be a number');
      expect(() => stateManager.set('count', 5)).not.toThrow();
    });
  });

  describe('history', () => {
    it('should track state history when enabled', () => {
      stateManager = new StateManager({}, { trackHistory: true });
      
      stateManager.set('count', 1);
      stateManager.set('count', 2);
      stateManager.set('count', 3);
      
      const history = stateManager.getHistory();
      expect(history).toHaveLength(3);
      expect(history[2].action.value).toBe(3);
    });

    it('should support undo operations', () => {
      stateManager = new StateManager({}, { trackHistory: true });
      
      stateManager.set('count', 1);
      stateManager.set('count', 2);
      
      stateManager.undo();
      expect(stateManager.get('count')).toBe(1);
      
      stateManager.undo();
      expect(stateManager.get('count')).toBeUndefined();
    });

    it('should support redo operations', () => {
      stateManager = new StateManager({}, { trackHistory: true });
      
      stateManager.set('count', 1);
      stateManager.set('count', 2);
      stateManager.undo();
      stateManager.redo();
      
      expect(stateManager.get('count')).toBe(2);
    });
  });

  describe('performance', () => {
    it('should handle large state objects efficiently', () => {
      const largeState = {};
      for (let i = 0; i < 1000; i++) {
        largeState[`key${i}`] = `value${i}`;
      }
      
      const start = performance.now();
      stateManager.set('large', largeState);
      const setTime = performance.now() - start;
      
      const getStart = performance.now();
      const retrieved = stateManager.get('large');
      const getTime = performance.now() - getStart;
      
      expect(setTime).toBeLessThan(100); // Should be fast
      expect(getTime).toBeLessThan(10);  // Should be very fast
      expect(retrieved).toEqual(largeState);
    });

    it('should handle many subscribers efficiently', () => {
      const callbacks = [];
      for (let i = 0; i < 100; i++) {
        const callback = vi.fn();
        callbacks.push(callback);
        stateManager.subscribe(callback);
      }
      
      const start = performance.now();
      stateManager.set('count', 1);
      const notifyTime = performance.now() - start;
      
      expect(notifyTime).toBeLessThan(50); // Should be fast
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('error handling', () => {
    it('should handle subscription errors gracefully', () => {
      const goodCallback = vi.fn();
      const badCallback = vi.fn(() => { throw new Error('Subscription error'); });
      
      stateManager.subscribe(goodCallback);
      stateManager.subscribe(badCallback);
      
      expect(() => stateManager.set('count', 1)).not.toThrow();
      expect(goodCallback).toHaveBeenCalled();
    });

    it('should handle invalid state paths', () => {
      expect(() => stateManager.set('', 'value')).not.toThrow();
      expect(() => stateManager.set(null, 'value')).not.toThrow();
      expect(() => stateManager.get('')).not.toThrow();
    });
  });
});