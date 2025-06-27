import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  deepClone,
  deepEqual,
  deepMerge,
  debounce,
  throttle,
  get,
  set,
  generateUniqueId,
  isPlainObject,
  createElement,
  h1, h2, h3, h4, h5, h6,
  div, span, p, a, img, button,
  ul, ol, li, table, tr, td, th,
  form, input, textarea, select, option,
  header, footer, nav, main, section, article, aside
} from '../../src/utils/helpers.js';

describe('Helpers', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle strings without special characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should handle all special characters', () => {
      expect(escapeHtml('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#x27;');
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, [3, 4]];
      const cloned = deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should handle circular references', () => {
      const obj = { a: 1 };
      obj.self = obj;
      
      const cloned = deepClone(obj);
      expect(cloned.a).toBe(1);
      expect(cloned.self).toBe(cloned);
    });

    it('should clone dates', () => {
      const date = new Date('2023-01-01');
      const cloned = deepClone(date);
      
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
  });

  describe('deepEqual', () => {
    it('should compare primitive values', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('a', 'a')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
      
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('a', 'b')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
    });

    it('should compare arrays', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
      
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should compare objects', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
      
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should handle different types', () => {
      expect(deepEqual(1, '1')).toBe(false);
      expect(deepEqual([], {})).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };
      const merged = deepMerge(obj1, obj2);
      
      expect(merged).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4
      });
    });

    it('should not mutate original objects', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 } };
      const original1 = deepClone(obj1);
      const original2 = deepClone(obj2);
      
      deepMerge(obj1, obj2);
      
      expect(obj1).toEqual(original1);
      expect(obj2).toEqual(original2);
    });

    it('should merge multiple objects', () => {
      const merged = deepMerge(
        { a: 1 },
        { b: 2 },
        { c: 3 }
      );
      
      expect(merged).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should handle arrays', () => {
      const merged = deepMerge(
        { arr: [1, 2] },
        { arr: [3, 4] }
      );
      
      expect(merged.arr).toEqual([3, 4]); // Arrays are replaced, not merged
    });
  });

  describe('debounce', () => {
    it('should delay function execution', (done) => {
      let callCount = 0;
      const fn = () => callCount++;
      const debouncedFn = debounce(fn, 50);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).toBe(0);
      
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 60);
    });

    it('should cancel previous calls', (done) => {
      let callCount = 0;
      const fn = () => callCount++;
      const debouncedFn = debounce(fn, 50);
      
      debouncedFn();
      setTimeout(() => debouncedFn(), 25);
      setTimeout(() => debouncedFn(), 40);
      
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });
  });

  describe('throttle', () => {
    it('should limit function execution rate', (done) => {
      let callCount = 0;
      const fn = () => callCount++;
      const throttledFn = throttle(fn, 50);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(callCount).toBe(1);
      
      setTimeout(() => {
        throttledFn();
        expect(callCount).toBe(2);
        done();
      }, 60);
    });
  });

  describe('get', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: [3, 4, { e: 5 }]
      }
    };

    it('should get nested values', () => {
      expect(get(obj, 'a')).toBe(1);
      expect(get(obj, 'b.c')).toBe(2);
      expect(get(obj, 'b.d.0')).toBe(3);
      expect(get(obj, 'b.d.2.e')).toBe(5);
    });

    it('should return default value for missing paths', () => {
      expect(get(obj, 'x', 'default')).toBe('default');
      expect(get(obj, 'b.x', 'default')).toBe('default');
      expect(get(obj, 'b.d.10', 'default')).toBe('default');
    });

    it('should handle empty paths', () => {
      expect(get(obj, '')).toBe(obj);
      expect(get(obj, null)).toBe(obj);
      expect(get(obj, undefined)).toBe(obj);
    });
  });

  describe('set', () => {
    it('should set nested values', () => {
      const obj = { a: 1 };
      set(obj, 'b.c', 2);
      
      expect(obj).toEqual({
        a: 1,
        b: { c: 2 }
      });
    });

    it('should set array values', () => {
      const obj = { arr: [1, 2, 3] };
      set(obj, 'arr.1', 'modified');
      
      expect(obj.arr).toEqual([1, 'modified', 3]);
    });

    it('should create missing intermediate objects', () => {
      const obj = {};
      set(obj, 'a.b.c.d', 'deep');
      
      expect(obj).toEqual({
        a: {
          b: {
            c: {
              d: 'deep'
            }
          }
        }
      });
    });

    it('should handle array indices in paths', () => {
      const obj = {};
      set(obj, 'items.0.name', 'first');
      
      expect(obj).toEqual({
        items: [{ name: 'first' }]
      });
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate IDs with prefix', () => {
      const id = generateUniqueId('test');
      expect(id).toMatch(/^test-/);
    });
  });

  describe('isPlainObject', () => {
    it('should identify plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
    });

    it('should reject non-plain objects', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(42)).toBe(false);
    });
  });

  describe('createElement', () => {
    it('should create virtual nodes', () => {
      const vnode = createElement('div', { class: 'test' }, ['Hello']);
      
      expect(vnode).toEqual({
        tag: 'div',
        attributes: { class: 'test' },
        children: ['Hello']
      });
    });

    it('should handle children as arguments', () => {
      const vnode = createElement('div', null, 'Hello', 'World');
      
      expect(vnode.children).toEqual(['Hello', 'World']);
    });

    it('should handle no attributes', () => {
      const vnode = createElement('div', null, 'Hello');
      
      expect(vnode.attributes).toBe(null);
      expect(vnode.children).toEqual(['Hello']);
    });
  });

  describe('HTML helper functions', () => {
    it('should create heading elements', () => {
      expect(h1('Title')).toEqual({
        tag: 'h1',
        attributes: null,
        children: ['Title']
      });
      
      expect(h2({ class: 'subtitle' }, 'Subtitle')).toEqual({
        tag: 'h2',
        attributes: { class: 'subtitle' },
        children: ['Subtitle']
      });
    });

    it('should create basic elements', () => {
      expect(div('content')).toEqual({
        tag: 'div',
        attributes: null,
        children: ['content']
      });
      
      expect(span({ id: 'test' }, 'text')).toEqual({
        tag: 'span',
        attributes: { id: 'test' },
        children: ['text']
      });
    });

    it('should create form elements', () => {
      expect(input({ type: 'text', name: 'username' })).toEqual({
        tag: 'input',
        attributes: { type: 'text', name: 'username' },
        children: []
      });
      
      expect(button({ onclick: 'handleClick()' }, 'Click me')).toEqual({
        tag: 'button',
        attributes: { onclick: 'handleClick()' },
        children: ['Click me']
      });
    });

    it('should create list elements', () => {
      const list = ul(
        li('Item 1'),
        li('Item 2'),
        li('Item 3')
      );
      
      expect(list.tag).toBe('ul');
      expect(list.children).toHaveLength(3);
      expect(list.children[0].tag).toBe('li');
    });

    it('should create table elements', () => {
      const tableEl = table(
        tr(
          th('Name'),
          th('Age')
        ),
        tr(
          td('John'),
          td('30')
        )
      );
      
      expect(tableEl.tag).toBe('table');
      expect(tableEl.children).toHaveLength(2);
      expect(tableEl.children[0].children[0].tag).toBe('th');
    });

    it('should create semantic elements', () => {
      expect(header('Header content')).toEqual({
        tag: 'header',
        attributes: null,
        children: ['Header content']
      });
      
      expect(nav('Navigation')).toEqual({
        tag: 'nav',
        attributes: null,
        children: ['Navigation']
      });
      
      expect(main({ class: 'main-content' }, 'Main content')).toEqual({
        tag: 'main',
        attributes: { class: 'main-content' },
        children: ['Main content']
      });
    });
  });
});