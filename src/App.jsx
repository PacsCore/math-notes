import { useEffect, useRef } from 'react';
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
  { label: '≤', insert: '\\leq' },
  { label: '≥', insert: '\\geq' },
  { label: 'α', insert: '\\alpha' },
  { label: '→', insert: '\\rightarrow' },
];

function App() {
  const mathFieldRef = useRef(null);

  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.value = '';
    }
  }, []);

  const insertSymbol = (latex) => {
    if (mathFieldRef.current) {
      mathFieldRef.current.executeCommand(['insert', latex]);
      mathFieldRef.current.focus();
    }
  };

  return (
    <div className="page">
      <h1>Math Notizen</h1>
      <div className="toolbar">
        {SYMBOLS.map((s) => (
          <button key={s.label} onClick={() => insertSymbol(s.insert)}>
            {s.label}
          </button>
        ))}
      </div>
      <math-field ref={mathFieldRef} style={{ fontSize: '24px', width: '100%', minHeight: '60px', border: '1px solid #ccc', padding: '10px' }}>
      </math-field>
    </div>
  );
}

export default App;