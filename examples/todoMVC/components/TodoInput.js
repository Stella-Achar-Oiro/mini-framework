import { createElement } from '../framework';

function TodoInput({ onSave }) {
  let inputValue = '';
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const text = inputValue.trim();
      
      if (text) {
        onSave(text);
        inputValue = '';
        e.target.value = '';
      }
    }
  };
  
  return createElement('input', {
    className: 'new-todo',
    placeholder: 'What needs to be done?',
    autoFocus: true,
    value: inputValue,
    onChange: (e) => { inputValue = e.target.value; },
    onKeyDown: handleKeyDown
  });
}

export { TodoInput };