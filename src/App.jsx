import { useEffect, useRef } from 'react';
import 'mathlive';
import './App.css';

function App() {
  const mathFieldRef = useRef(null);

  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.value = 'x^2 + \\int_0^1 f(x)\\,dx';
    }
  }, []);

  return (
    <div className="page">
      <h1>Math Notizen</h1>
      <math-field ref={mathFieldRef} style={{ fontSize: '24px', width: '100%', minHeight: '60px', border: '1px solid #ccc', padding: '10px' }}>
      </math-field>
    </div>
  );
}

export default App;