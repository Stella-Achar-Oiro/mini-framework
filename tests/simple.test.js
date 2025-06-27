import { describe, it, expect } from 'vitest';
import { StateManager } from '../src/core/state.js';
import { DOM } from '../src/core/dom.js';
import { escapeHtml, deepClone } from '../src/utils/helpers.js';

describe('Simple Framework Tests', () => {
  describe('StateManager', () => {
    it('should create a state manager', () => {
      const stateManager = new StateManager();
      expect(stateManager).toBeDefined();
    });

    it('should have getState method', () => {
      const stateManager = new StateManager({ test: 'value' });
      expect(typeof stateManager.getState).toBe('function');
      expect(stateManager.getState('test')).toBe('value');
    });

    it('should have setState method', async () => {
      const stateManager = new StateManager();
      expect(typeof stateManager.setState).toBe('function');
      await stateManager.setState('test', 'value');
      expect(stateManager.getState('test')).toBe('value');
    });
  });

  describe('DOM', () => {
    it('should create a DOM instance', () => {
      const dom = new DOM();
      expect(dom).toBeDefined();
    });

    it('should create text nodes', () => {
      const dom = new DOM();
      const element = dom.createElement('Hello');
      expect(element.textContent).toBe('Hello');
    });

    it('should create element nodes', () => {
      const dom = new DOM();
      const element = dom.createElement({ tag: 'div' });
      expect(element.tagName).toBe('DIV');
    });
  });

  describe('Helpers', () => {
    it('should escape HTML', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('should deep clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });
  });
});