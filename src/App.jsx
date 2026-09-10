import { useRef, useState } from 'react';
import 'mathlive';
import * as fpModule from 'function-plot';
const functionPlot = fpModule.default?.default || fpModule.default || fpModule;
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } from 'docx';
import html2canvas from 'html2canvas';
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

  const insertCoordSystem = () => {
  const wrapper = document.createElement('div');
  wrapper.className = 'coord-wrapper';
  wrapper.contentEditable = 'false';

  const plotDiv = document.createElement('div');
  plotDiv.className = 'coord-plot';

  const inputRow = document.createElement('div');
  inputRow.className = 'coord-input-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'z.B. x^2';
  input.className = 'coord-input';

  const renderPlot = (fn) => {
    plotDiv.innerHTML = '';
    try {
      functionPlot({
        target: plotDiv,
        width: 500,
        height: 350,
        grid: true,
        data: fn ? [{ fn }] : [],
      });
    } catch (err) {
      console.error('Plot-Fehler:', err)
    }
  };

  input.addEventListener('input', () => renderPlot(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  });

  inputRow.appendChild(document.createTextNode('f(x) = '));
  inputRow.appendChild(input);
  wrapper.appendChild(inputRow);
  wrapper.appendChild(plotDiv);

  const range = savedRange.current;
  if (range) {
    range.deleteContents();
    range.insertNode(wrapper);
    const space = document.createTextNode('\u00A0');
    wrapper.after(space);
  } else if (pageRef.current) {
    pageRef.current.appendChild(wrapper);
  }

  renderPlot('');
  setTimeout(() => input.focus(), 0);
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

  const removeHighlight = () => {
    document.execCommand('hiliteColor', false, 'transparent');
    pageRef.current.focus();
  };

  const setHeading = (tag) => {
    document.execCommand('formatBlock', false, tag);
    pageRef.current.focus();
  };

  const undo = () => {
    document.execCommand('undo');
    pageRef.current.focus();
  };

  const redo = () => {
    document.execCommand('redo');
    pageRef.current.focus();
  };

  const handlePageKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '\u00A0\u00A0\u00A0\u00A0');
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('undo');
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      document.execCommand('redo');
    }
  };

  const collectSegments = (node, fmt, segments) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    if (text.trim()) {
      segments.push({ type: 'text', text, ...fmt });
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const tag = node.tagName.toLowerCase();

  if (tag === 'math-field' || node.classList?.contains('coord-wrapper')) {
    segments.push({ type: 'image', element: node });
    return;
  }

  const newFmt = { ...fmt };
  if (tag === 'b' || tag === 'strong' || node.style?.fontWeight === 'bold') newFmt.bold = true;
  if (tag === 'u' || node.style?.textDecoration?.includes('underline')) newFmt.underline = true;
  if (tag === 'h1') newFmt.heading = 'H1';
  if (tag === 'h2') newFmt.heading = 'H2';

  Array.from(node.childNodes).forEach((child) => collectSegments(child, newFmt, segments));

  if (['div', 'p', 'h1', 'h2'].includes(tag)) {
    segments.push({ type: 'break' });
  }
};

const exportToWord = async () => {
  const segments = [];
  Array.from(pageRef.current.childNodes).forEach((n) => collectSegments(n, {}, segments));

  const children = [];
  let currentRuns = [];
  let currentHeading = null;

  const flushParagraph = () => {
    if (currentRuns.length > 0) {
      children.push(
        new Paragraph({
          heading:
            currentHeading === 'H1'
              ? HeadingLevel.HEADING_1
              : currentHeading === 'H2'
              ? HeadingLevel.HEADING_2
              : undefined,
          children: currentRuns,
        })
      );
    }
    currentRuns = [];
    currentHeading = null;
  };

  for (const seg of segments) {
    if (seg.type === 'break') {
      flushParagraph();
    } else if (seg.type === 'text') {
      currentHeading = seg.heading || currentHeading;
      let size = 28;
      if (currentHeading === 'H1') size = 44;
      else if (currentHeading === 'H2') size = 36;

      currentRuns.push(
        new TextRun({
          text: seg.text,
          bold: seg.bold,
          underline: seg.underline ? {} : undefined,
          font: 'Georgia',
          size: size,
        })
      );
    } else if (seg.type === 'image') {
      const isInline = seg.element.tagName.toLowerCase() === 'math-field';
      if (!isInline) flushParagraph();
      seg.element.classList.add('exporting');
      try {
        const canvas = await html2canvas(seg.element, { backgroundColor: '#ffffff', scale: 2 });
        const imageData = canvas.toDataURL('image/png').split(',')[1];
        const imgWidth = Math.min(canvas.width / 2, isInline ? 150 : 500);
        const imgHeight = (canvas.height / canvas.width) * imgWidth;

        const imageRun = new ImageRun({
          data: Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0)),
          transformation: { width: imgWidth, height: imgHeight },
        });

        if (isInline) {
          currentRuns.push(imageRun);
        } else {
          children.push(new Paragraph({ children: [imageRun] }));
        }
      } catch (err) {
        console.error('Bild-Export-Fehler:', err);
      } finally {
        seg.element.classList.remove('exporting');
      }
    }
  }
  flushParagraph();

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'notizen.docx';
  a.click();
  URL.revokeObjectURL(url);
};

  const toggleMathKeyboard = () => {
    if (window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.visible = !window.mathVirtualKeyboard.visible;
    }
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
          <span className="ribbon-label">Verlauf</span>
          <div className="symbol-row">
            <button onClick={undo} title="Rückgängig">↺</button>
            <button onClick={redo} title="Wiederholen">↻</button>
          </div>
        </div>

        <div className="ribbon-divider"></div>

        <div className="ribbon-group">
          <span className="ribbon-label">Einfügen</span>
          <div className="symbol-row">
            <button className="primary-btn" onClick={insertFormula}>+ Formel</button>
            <button onClick={toggleMathKeyboard} title="Mathe-Tastatur">⌨️</button>
            <button onClick={insertCoordSystem}>+ Koordinatensystem</button>
          </div>
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
          <span className="ribbon-label">Textgröße</span>
          <div className="symbol-row">
            <button onClick={() => setHeading('H1')}>H1</button>
            <button onClick={() => setHeading('H2')}>H2</button>
            <button onClick={() => setHeading('P')}>Normal</button>
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
            <button onClick={removeHighlight} title="Markierung entfernen">H̶</button>
            <button onClick={() => formatText('justifyLeft')}>⯇</button>
            <button onClick={() => formatText('justifyCenter')}>≡</button>
            <button onClick={() => formatText('justifyRight')}>⯈</button>
          </div>
        </div>

        <div className="ribbon-divider"></div>

        <div className="ribbon-group">
          <span className="ribbon-label">Export</span>
          <div className="symbol-row">
            <button className="primary-btn" onClick={exportToWord}>⬇ Word</button>
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
        onKeyDown={handlePageKeyDown}
      >
      </div>
    </div>
  );
}

export default App;