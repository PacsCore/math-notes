# FastNotes: Math

A digital replacement for paper math notebooks — write notes like in Word, insert mathematical formulas and coordinate systems, and export everything as a Word document to print.

## Features

- Flowing text editor (like Word) with formatting: bold, underline, color, highlight, alignment, headings
- Insert mathematical formulas inline (LaTeX input via MathLive, including virtual math keyboard)
- Symbol toolbar for common characters (π, ∫, √, ∑, etc.)
- Coordinate systems with live-rendered function graphs
- Undo/Redo
- Dark/Light mode
- German/English toggle
- Export as a Word document (.docx) for printing

## Tech Stack

- React + Vite
- MathLive + KaTeX (formulas)
- function-plot (coordinate systems)
- docx + html2canvas (Word export)

## Setup

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`.

## Build

```bash
npm run build
```