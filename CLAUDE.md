# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collection of self-contained, browser-based web tools deployed as static HTML files via Cloudflare Pages at. Each tool is a single HTML file with inline CSS/JS — no build step, no bundler, no backend.

## Development Commands

```bash
npm run serve             # Start local server on http://localhost:3000
npm test                  # Run all Playwright E2E tests (requires server running)
npm run test:ui           # Interactive Playwright UI mode
npm run test:headed       # Run tests with visible browser
npm run test:chrome       # Chromium only
npm run test:mobile       # Mobile Chrome + Mobile Safari
npx playwright test tests/markdown-to-html.spec.ts   # Run a single test file
npm run report            # View last HTML test report
```

The Playwright config auto-starts `http-server` on port 3000. In development, only Chromium + Mobile Chrome run; CI runs all 7 browser configs with 2 retries.

## Architecture

- **Each tool is one self-contained HTML file** at the repo root: `mermaid-to-png.html`, `ingredient-scanner.html`, `cat-detector.html`, `markdown-to-html.html`
- `index.html` is the landing page linking to all tools
- `sw.js` is the PWA Service Worker (caches mermaid tool for offline use)
- `manifest.json` / `ingredient-scanner-manifest.json` are PWA manifests
- All JS/CSS is inline within each HTML file — no external source files to import
- External libraries loaded via CDN (Mermaid.js, Tesseract.js, ONNX Runtime, marked.js, GitHub Markdown CSS)
- API integrations: GitHub Markdown API, PubChem API, Open Food Facts API

## Testing

Tests live in `tests/` as Playwright spec files (TypeScript). Each tool has a corresponding `tests/<tool-name>.spec.ts`. Tests run against `http://localhost:3000` and expect the HTML files served from the repo root.

## Key Conventions

- No build/transpile step — edit the HTML file directly and refresh
- Mobile-responsive: all tools must work on mobile viewports (media queries at 768px and 400px breakpoints)
- Tools should work offline where possible (Service Worker caching)
