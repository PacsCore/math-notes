import { useRef, useState } from 'react';
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
  const [darkMode, setDarkMode] = useState(true);

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
  let spaceNode;
  if (range) {
    range.deleteContents();
    range.insertNode(mathField);
    range.collapse(false);
    spaceNode = document.createTextNode('\u00A0');
    range.insertNode(spaceNode);
  } else if (pageRef.current) {
    spaceNode = document.createTextNode('\u00A0');
    pageRef.current.appendChild(mathField);
    pageRef.current.appendChild(spaceNode);
  }

  mathField.addEventListener('focus', () => {
    lastFocusedMathField.current = mathField;
  });

  mathField.addEventListener('blur', () => {
    if (mathField.value.trim() === '') {
      mathField.remove();
      if (spaceNode) spaceNode.remove();
    }
    if (lastFocusedMathField.current === mathField) {
      lastFocusedMathField.current = null;
    }
  });

  mathField.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      mathField.blur();

      const range = document.createRange();
      const sel = window.getSelection();
      if (mathField.nextSibling) {
        range.setStartAfter(mathField.nextSibling);
      } else {
        range.setStartAfter(mathField);
      }
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      pageRef.current.focus();
    }
  });

  setTimeout(() => mathField.focus(), 0);
};

  const insertSymbol = (latex) => {
  if (lastFocusedMathField.current) {
    lastFocusedMathField.current.executeCommand(['insert', latex]);
    lastFocusedMathField.current.focus();
  }
};

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    pageRef.current.focus();
  };

  return (
    <div className={'app ' + (darkMode ? 'dark' : 'light')}>
      <div className="header-bar">
        <h1>FastNotes: Math</h1>
        <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="ribbon" onMouseDown={(e) => e.preventDefault()}>
        <div className="ribbon-group">
          <span className="ribbon-label">Einfügen</span>
          <button className="primary-btn" onClick={insertFormula}>+ Formel</button>
        </div>

        <div className="ribbon-divider"></div>

        <div className="ribbon-group">
          <span className="ribbon-label">Symbole</span>
          <div className="symbol-row">
            {SYMBOLS.map((s) => (
              <button key={s.label} onClick={() => insertSymbol(s.insert)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ribbon-divider"></div>

        <div className="ribbon-group">
          <span className="ribbon-label">Format</span>
          <div className="symbol-row">
            <button onClick={() => formatText('bold')}><b>F</b></button>
            <button onClick={() => formatText('underline')}><u>U</u></button>
            <button onClick={() => formatText('foreColor', '#e63946')}>A</button>
            <button onClick={() => formatText('hiliteColor', '#fff176')}>H</button>
            <button onClick={() => formatText('justifyLeft')}>⯇</button>
            <button onClick={() => formatText('justifyCenter')}>≡</button>
            <button onClick={() => formatText('justifyRight')}>⯈</button>
          </div>
        </div>
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