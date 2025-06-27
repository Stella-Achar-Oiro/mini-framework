import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DOM } from '../../src/core/dom.js';

describe('DOM', () => {
  let dom;

  beforeEach(() => {
    dom = new DOM();
  });

  describe('createElement', () => {
    it('should create simple text nodes', () => {
      const element = dom.createElement('Hello World');
      expect(element.nodeType).toBe(Node.TEXT_NODE);
      expect(element.textContent).toBe('Hello World');
    });

    it('should create elements with tag names', () => {
      const vnode = { tag: 'div' };
      const element = dom.createElement(vnode);
      expect(element.tagName).toBe('DIV');
    });

    it('should create elements with attributes', () => {
      const vnode = {
        tag: 'div',
        attributes: {
          id: 'test',
          class: 'container',
          'data-testid': 'my-div'
        }
      };
      const element = dom.createElement(vnode);
      expect(element.id).toBe('test');
      expect(element.className).toBe('container');
      expect(element.getAttribute('data-testid')).toBe('my-div');
    });

    it('should create elements with children', () => {
      const vnode = {
        tag: 'div',
        children: [
          'Hello ',
          { tag: 'span', children: ['World'] }
        ]
      };
      const element = dom.createElement(vnode);
      expect(element.childNodes.length).toBe(2);
      expect(element.firstChild.textContent).toBe('Hello ');
      expect(element.lastChild.tagName).toBe('SPAN');
      expect(element.lastChild.textContent).toBe('World');
    });

    it('should handle boolean attributes correctly', () => {
      const vnode = {
        tag: 'input',
        attributes: {
          disabled: true,
          checked: false,
          readonly: true
        }
      };
      const element = dom.createElement(vnode);
      expect(element.disabled).toBe(true);
      expect(element.checked).toBe(false);
      expect(element.readOnly).toBe(true);
    });

    it('should handle event handlers', () => {
      const clickHandler = vi.fn();
      const vnode = {
        tag: 'button',
        attributes: {
          onclick: clickHandler
        }
      };
      const element = dom.createElement(vnode);
      element.click();
      expect(clickHandler).toHaveBeenCalled();
    });

    it('should escape HTML in text content when enabled', () => {
      const dom = new DOM({ escapeHtml: true });
      const element = dom.createElement('<script>alert("xss")</script>');
      expect(element.textContent).toBe('<script>alert("xss")</script>');
    });

    it('should handle fragment nodes', () => {
      const vnode = {
        tag: 'fragment',
        children: [
          'Text 1',
          { tag: 'span', children: ['Text 2'] },
          'Text 3'
        ]
      };
      const element = dom.createElement(vnode);
      expect(element.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
      expect(element.childNodes.length).toBe(3);
    });
  });

  describe('diff', () => {
    it('should detect no changes when vnodes are identical', () => {
      const vnode1 = { tag: 'div', children: ['Hello'] };
      const vnode2 = { tag: 'div', children: ['Hello'] };
      const patches = dom.diff(vnode1, vnode2);
      expect(patches).toEqual([]);
    });

    it('should detect text content changes', () => {
      const vnode1 = 'Hello';
      const vnode2 = 'Goodbye';
      const patches = dom.diff(vnode1, vnode2);
      expect(patches).toHaveLength(1);
      expect(patches[0].type).toBe('TEXT');
    });

    it('should detect attribute changes', () => {
      const vnode1 = { tag: 'div', attributes: { class: 'old' } };
      const vnode2 = { tag: 'div', attributes: { class: 'new' } };
      const patches = dom.diff(vnode1, vnode2);
      expect(patches).toHaveLength(1);
      expect(patches[0].type).toBe('ATTRIBUTES');
    });

    it('should detect children changes', () => {
      const vnode1 = { tag: 'div', children: ['Hello'] };
      const vnode2 = { tag: 'div', children: ['Hello', 'World'] };
      const patches = dom.diff(vnode1, vnode2);
      expect(patches).toHaveLength(1);
      expect(patches[0].type).toBe('CHILDREN');
    });

    it('should detect element replacement', () => {
      const vnode1 = { tag: 'div' };
      const vnode2 = { tag: 'span' };
      const patches = dom.diff(vnode1, vnode2);
      expect(patches).toHaveLength(1);
      expect(patches[0].type).toBe('REPLACE');
    });

    it('should handle key-based reconciliation', () => {
      const vnode1 = {
        tag: 'div',
        children: [
          { tag: 'span', key: 'a', children: ['A'] },
          { tag: 'span', key: 'b', children: ['B'] }
        ]
      };
      const vnode2 = {
        tag: 'div',
        children: [
          { tag: 'span', key: 'b', children: ['B'] },
          { tag: 'span', key: 'a', children: ['A'] }
        ]
      };
      const patches = dom.diff(vnode1, vnode2);
      expect(patches).toHaveLength(1);
      expect(patches[0].type).toBe('CHILDREN');
    });
  });

  describe('patch', () => {
    it('should apply text content patches', () => {
      const element = document.createTextNode('Hello');
      const patches = [{ type: 'TEXT', content: 'Goodbye' }];
      dom.patch(element, patches);
      expect(element.textContent).toBe('Goodbye');
    });

    it('should apply attribute patches', () => {
      const element = document.createElement('div');
      element.className = 'old';
      const patches = [{
        type: 'ATTRIBUTES',
        attributes: { class: 'new', id: 'test' }
      }];
      dom.patch(element, patches);
      expect(element.className).toBe('new');
      expect(element.id).toBe('test');
    });

    it('should apply children patches', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>Old</span>';
      const patches = [{
        type: 'CHILDREN',
        children: [
          { tag: 'span', children: ['New'] },
          { tag: 'p', children: ['Added'] }
        ]
      }];
      dom.patch(element, patches);
      expect(element.children.length).toBe(2);
      expect(element.children[0].textContent).toBe('New');
      expect(element.children[1].textContent).toBe('Added');
    });

    it('should replace elements', () => {
      const parent = document.createElement('div');
      const oldElement = document.createElement('span');
      oldElement.textContent = 'Old';
      parent.appendChild(oldElement);
      
      const patches = [{
        type: 'REPLACE',
        vnode: { tag: 'p', children: ['New'] }
      }];
      dom.patch(oldElement, patches);
      expect(parent.children[0].tagName).toBe('P');
      expect(parent.children[0].textContent).toBe('New');
    });
  });

  describe('batch operations', () => {
    it('should batch multiple DOM operations', () => {
      const operations = [
        () => document.createElement('div'),
        () => document.createElement('span'),
        () => document.createElement('p')
      ];
      
      const results = dom.batch(operations);
      expect(results).toHaveLength(3);
      expect(results[0].tagName).toBe('DIV');
      expect(results[1].tagName).toBe('SPAN');
      expect(results[2].tagName).toBe('P');
    });

    it('should handle errors in batch operations', () => {
      const operations = [
        () => document.createElement('div'),
        () => { throw new Error('Test error'); },
        () => document.createElement('span')
      ];
      
      expect(() => dom.batch(operations)).toThrow('Test error');
    });
  });

  describe('performance optimizations', () => {
    it('should cache elements when caching is enabled', () => {
      const dom = new DOM({ cacheElements: true });
      const vnode = { tag: 'div', attributes: { id: 'test' } };
      
      const element1 = dom.createElement(vnode);
      const element2 = dom.createElement(vnode);
      
      // Should be the same cached element
      expect(element1).toBe(element2);
    });

    it('should use document fragments for multiple children', () => {
      const dom = new DOM({ useDocumentFragment: true });
      const vnode = {
        tag: 'div',
        children: [
          { tag: 'span', children: ['1'] },
          { tag: 'span', children: ['2'] },
          { tag: 'span', children: ['3'] }
        ]
      };
      
      const element = dom.createElement(vnode);
      expect(element.children.length).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should handle invalid vnodes gracefully', () => {
      const invalidVnode = { tag: null };
      expect(() => dom.createElement(invalidVnode)).not.toThrow();
    });

    it('should handle circular references in vnodes', () => {
      const vnode = { tag: 'div' };
      vnode.children = [vnode]; // Circular reference
      
      expect(() => dom.createElement(vnode)).not.toThrow();
    });

    it('should validate vnodes when validation is enabled', () => {
      const dom = new DOM({ validateVNodes: true });
      const invalidVnode = { tag: 123 }; // Invalid tag type
      
      expect(() => dom.createElement(invalidVnode)).toThrow();
    });
  });

  describe('memory management', () => {
    it('should clean up element cache', () => {
      const element = document.createElement('div');
      dom.elementCache.set(element, { someData: 'test' });
      
      dom.cleanup();
      expect(dom.elementCache.has(element)).toBe(false);
    });

    it('should clean up vnode cache', () => {
      const vnode = { tag: 'div' };
      dom.vnodeCache.set('test-key', vnode);
      
      dom.cleanup();
      expect(dom.vnodeCache.size).toBe(0);
    });
  });
});