import { useRef, useState, useEffect } from 'react';
import 'mathlive';
import * as fpModule from 'function-plot';
const functionPlot = fpModule.default?.default || fpModule.default || fpModule;
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } from 'docx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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

const translations = {
  de: {
    history: 'Verlauf',
    undo: 'Rückgängig',
    redo: 'Wiederholen',
    insert: 'Einfügen',
    formula: '+ Formel',
    mathKeyboard: 'Mathe-Tastatur',
    coordinateSystem: '+ Koordinatensystem',
    symbols: 'Symbole',
    textSize: 'Textgröße',
    normal: 'Normal',
    format: 'Format',
    removeHighlight: 'Markierung entfernen',
    export: 'Export',
    page: 'Seite',
    name: 'Name',
    namePlaceholder: 'Dein Name',
    word: '⬇ Word',
    light: '☀️ Hell',
    dark: '🌙 Dunkel',
    language: 'Sprache wechseln',
    functionLabel: 'f(x) = ',
    functionPlaceholder: 'z.B. x^2',
  },
  en: {
    history: 'History',
    undo: 'Undo',
    redo: 'Redo',
    insert: 'Insert',
    formula: '+ Formula',
    mathKeyboard: 'Math keyboard',
    coordinateSystem: '+ Coordinate system',
    symbols: 'Symbols',
    textSize: 'Text size',
    normal: 'Normal',
    format: 'Format',
    removeHighlight: 'Remove highlight',
    export: 'Export',
    page: 'Page',
    name: 'Name',
    namePlaceholder: 'Your name',
    word: '⬇ Word',
    light: '☀️ Light',
    dark: '🌙 Dark',
    language: 'Switch language',
    functionLabel: 'f(x) = ',
    functionPlaceholder: 'e.g. x^2',
  },
};

function App() {
  const pageRef = useRef(null);
  const lastFocusedMathField = useRef(null);
  const savedRange = useRef(null);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('de');
  const [studentName, setStudentName] = useState('');
  const t = (key) => translations[language][key];

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
      if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.visible = true;
      }
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
  input.placeholder = t('functionPlaceholder');
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

  inputRow.appendChild(document.createTextNode(t('functionLabel')));
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

  const attachMathFieldListeners = (mathField) => {
  mathField.addEventListener('focus', () => {
    lastFocusedMathField.current = mathField;
    if (window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.visible = true;
    }
  });
  mathField.addEventListener('blur', () => {
    if (mathField.value.trim() === '') {
      mathField.remove();
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
};

const attachCoordListeners = (wrapper) => {
  const input = wrapper.querySelector('.coord-input');
  const plotDiv = wrapper.querySelector('.coord-plot');
  if (!input || !plotDiv) return;

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
      console.error('Plot-Fehler:', err);
    }
  };

  input.addEventListener('input', () => renderPlot(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
  });

  renderPlot(input.value);
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

  const saveTimeout = useRef(null);

const handlePageInput = () => {
  if (saveTimeout.current) clearTimeout(saveTimeout.current);
  saveTimeout.current = setTimeout(() => {
    if (pageRef.current) {
      localStorage.setItem('mathnotes-content', pageRef.current.innerHTML);
    }
  }, 500);
};

useEffect(() => {
  const saved = localStorage.getItem('mathnotes-content');
  if (saved && pageRef.current) {
    pageRef.current.innerHTML = saved;
    pageRef.current.querySelectorAll('math-field').forEach(attachMathFieldListeners);
    pageRef.current.querySelectorAll('.coord-wrapper').forEach(attachCoordListeners);
  }
}, []);

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

  const exportToPDF = async () => {
    pageRef.current.classList.add('exporting-pdf');
    try {
      const canvas = await html2canvas(pageRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const pageWidthPx = canvas.width;
      const pageHeightPx = Math.floor(pageWidthPx * (297 / 210));
      const totalPages = Math.ceil(canvas.height / pageHeightPx);
      const pdf = new jsPDF({
        unit: 'px',
        format: [pageWidthPx, pageHeightPx],
      });

      for (let i = 0; i < totalPages; i += 1) {
        if (i > 0) {
          pdf.addPage([pageWidthPx, pageHeightPx]);
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = pageWidthPx;
        pageCanvas.height = pageHeightPx;
        const pageContext = pageCanvas.getContext('2d');
        pageContext.fillStyle = '#ffffff';
        pageContext.fillRect(0, 0, pageWidthPx, pageHeightPx);
        pageContext.drawImage(
          canvas,
          0,
          i * pageHeightPx,
          pageWidthPx,
          Math.min(pageHeightPx, canvas.height - i * pageHeightPx),
          0,
          0,
          pageWidthPx,
          Math.min(pageHeightPx, canvas.height - i * pageHeightPx)
        );

        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidthPx, pageHeightPx);
        pdf.setFontSize(12);
        pdf.text(
          `${studentName ? studentName + ' — ' : ''}${t('page')} ${i + 1} / ${totalPages}`,
          pageWidthPx / 2,
          pageHeightPx - 20,
          { align: 'center' }
        );
      }

      pdf.save('notizen.pdf');
    } catch (err) {
      console.error('PDF-Export-Fehler:', err);
    } finally {
      pageRef.current.classList.remove('exporting-pdf');
    }
  };

  const toggleMathKeyboard = () => {
    if (window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.visible = !window.mathVirtualKeyboard.visible;
    }
  };

  return (
    <div className={'app ' + (darkMode ? 'dark' : 'light') + ' lang-' + language}>
      <div className="header-bar">
        <h1>FastNotes: Math</h1>
        <div className="header-actions">
          <button
            className="mode-toggle"
            onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
            title={t('language')}
          >
            {language.toUpperCase()}
          </button>
          <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? t('light') : t('dark')}
          </button>
        </div>
      </div>

      <div className="ribbon" onMouseDown={(e) => {
        if (e.target.tagName !== 'INPUT') e.preventDefault();
      }}>
        <div className="ribbon-group">
          <span className="ribbon-label">{t('history')}</span>
          <div className="symbol-row">
            <button onClick={undo} title={t('undo')}>↺</button>
            <button onClick={redo} title={t('redo')}>↻</button>
          </div>
        </div>

        <div className="ribbon-divider"></div>

        <div className="ribbon-group">
          <span className="ribbon-label">{t('name')}</span>
          <div className="symbol-row">
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="name-input"
            />
          </div>
        </div>

        <div className="ribbon-divider"></div>

        <div className="ribbon-group">
          <span className="ribbon-label">{t('insert')}</span>
          <div className="symbol-row">
            <button className="primary-btn" onClick={insertFormula}>{t('formula')}</button>
            <button onClick={toggleMathKeyboard} title={t('mathKeyboard')}>⌨️</button>
            <button onClick={insertCoordSystem}>{t('coordinateSystem')}</button>
          </div>
        </div>

        <div className="ribbon-divider"></div>

        <div className="ribbon-group">
          <span className="ribbon-label">{t('symbols')}</span>
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
          <span className="ribbon-label">{t('textSize')}</span>
          <div className="symbol-row">
            <button onClick={() => setHeading('H1')}>H1</button>
            <button onClick={() => setHeading('H2')}>H2</button>
            <button onClick={() => setHeading('P')}>{t('normal')}</button>
          </div>
        </div>

        <div className="ribbon-divider"></div>

        <div className="ribbon-group">
          <span className="ribbon-label">{t('format')}</span>
          <div className="symbol-row">
            <button onClick={() => formatText('bold')}><b>F</b></button>
            <button onClick={() => formatText('underline')}><u>U</u></button>
            <button onClick={() => formatText('foreColor', '#e63946')}>A</button>
            <button onClick={() => formatText('hiliteColor', '#fff176')}>H</button>
            <button onClick={removeHighlight} title={t('removeHighlight')}>H̶</button>
            <button onClick={() => formatText('justifyLeft')}>⯇</button>
            <button onClick={() => formatText('justifyCenter')}>≡</button>
            <button onClick={() => formatText('justifyRight')}>⯈</button>
          </div>
        </div>

        <div className="ribbon-divider"></div>

        <div className="ribbon-group">
          <span className="ribbon-label">{t('export')}</span>
          <div className="symbol-row">
            <button className="primary-btn" onClick={exportToWord}>{t('word')}</button>
            <button className="primary-btn" onClick={exportToPDF}>⬇ PDF</button>
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
        onInput={handlePageInput}
      >
      </div>
    </div>
  );
}

export default App;