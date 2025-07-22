import MiniFramework from '../src/index.js';

const app = new MiniFramework({
  container: '#app',
  state: { count: 0 }
});

app.init();

function Counter() {
  let count = app.state.get('count');
  console.log("Count is: ", count);

  return {
    tag: 'div',
    attributes: { class: 'counter' },
    children: [
      {
        tag: 'h2',
        children: [`Count: ${count}`]
      },
      {
        tag: 'button',
        attributes: {
          onclick: () => {
              app.state.set('count', count - 1);
              console.log('Decrement button clicked, current count:', count);
          },
          class: 'btn'
        },
        children: ['-']
      },
      {
        tag: 'button',
        attributes: {
          onclick: () => {
              app.state.set('count', count + 1);
              console.log('Increment button clicked, current count:', count);
          },
          class: 'btn'
        },
        children: ['+']
      }
    ]
  };
}

// Auto re-render on state changes
app.state.subscribe(() => app.render(Counter));
app.render(Counter);
