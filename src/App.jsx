import { useRef } from 'react';
import 'mathlive';
import './App.css';

const SYMBOLS = [
  { label: 'φ', insert: '\\varphi' },
  { label: 'π', insert: '\\pi' },
  { label: '∫', insert: '\\int_{}^{}' },
  { label: '√', insert: '\\sqrt{}' },
  { label: 'x²', insert: '{}^2' },
  { label: 'a/b', insert: '\\frac{}{}' },
  { label: '∞', insert: '\\infty' },
  { label: '∑', insert: '\\sum_{}^{}' },
];

function App() {
  const pageRef = useRef(null);
  const lastFocusedMathField = useRef(null);
  const savedRange = useRef(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0);
    }
  };

  const insertFormula = () => {
    const mathField = document.createElement('math-field');
    mathField.className = 'inline-formula';
    mathField.style.fontSize = '20px';

    const range = savedRange.current;
    if (range) {
      range.deleteContents();
      range.insertNode(mathField);
      range.collapse(false);
      const space = document.createTextNode('\u00A0');
      range.insertNode(space);
    } else if (pageRef.current) {
      pageRef.current.appendChild(mathField);
    }

    mathField.addEventListener('focus', () => {
      lastFocusedMathField.current = mathField;
    });

    setTimeout(() => mathField.focus(), 0);
  };

  const insertSymbol = (latex) => {
    if (lastFocusedMathField.current) {
      lastFocusedMathField.current.executeCommand(['insert', latex]);
      lastFocusedMathField.current.focus();
    }
  };

  return (
    <div className="app">
      <div className="toolbar" onMouseDown={(e) => e.preventDefault()}>
        <button onClick={insertFormula}>+ Formel</button>
        {SYMBOLS.map((s) => (
          <button key={s.label} onClick={() => insertSymbol(s.insert)}>
            {s.label}
          </button>
        ))}
      </div>

      <div
        ref={pageRef}
        className="page-sheet"
        contentEditable
        suppressContentEditableWarning
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
      >
      </div>
    </div>
  );
}

export default App;