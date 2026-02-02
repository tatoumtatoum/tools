# 🛠️ Tools Collection

A collection of useful web-based tools for productivity, safety, and image analysis.

## 📋 Tools

### 1. **Mermaid to PNG Converter**
Convert Mermaid diagrams to high-quality PNG images with ease.
- **Features**: Drag-and-drop support, zoom controls, instant preview
- **URL**: `/tools/mermaid-to-png.html`
- **Use case**: Create and export diagrams for presentations, documentation, and design files

### 2. **🔬 Ingredient Safety Scanner**
Scan food and cosmetic labels to identify dangerous chemicals, carcinogens, and harmful additives using OCR technology.
- **Features**: OCR text recognition, chemical database matching, safety alerts
- **URL**: `/tools/ingredient-scanner.html`
- **Use case**: Check product ingredients for potential health risks before purchase

### 3. **Cat Detector**
Detect if an image contains a cat using TensorFlow.js and MobileNet deep learning model.
- **Features**: AI-powered cat detection, works with uploaded images
- **URL**: `/tools/cat-detector.html`
- **Use case**: Automatically identify cat images in your photo collection

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tataoumtatoum/tools.git
cd tools
```

2. Install dependencies:
```bash
npm install
```

### Running Locally

Start the HTTP server:
```bash
npm run serve
```

The tools will be available at `http://localhost:3000`

Access individual tools:
- Mermaid to PNG: `http://localhost:3000/mermaid-to-png.html`
- Ingredient Scanner: `http://localhost:3000/ingredient-scanner.html`
- Cat Detector: `http://localhost:3000/cat-detector.html`

## 🧪 Testing

Run end-to-end tests with Playwright:

```bash
# Run all tests
npm test

# Run tests with interactive UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests for specific browser
npm run test:chrome
npm run test:firefox
npm run test:webkit

# Run mobile tests
npm run test:mobile

# View test report
npm run report
```

## 📁 Project Structure

```
.
├── index.html                          # Main landing page
├── mermaid-to-png.html                 # Mermaid converter tool
├── ingredient-scanner.html             # Ingredient scanner tool
├── cat-detector.html                   # Cat detection tool
├── sw.js                               # Service worker for offline support
├── manifest.json                       # PWA manifest
├── playwright.config.ts                # Playwright test configuration
├── package.json                        # Project dependencies and scripts
├── tests/                              # End-to-end test suite
│   ├── mermaid-to-png.spec.ts
│   ├── ingredient-scanner.spec.ts
│   ├── mobile-download-debug.spec.ts
│   └── ...
└── node_modules/                       # Project dependencies
```

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript/TypeScript
- **Testing**: Playwright (supports Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
- **Build**: npm, http-server
- **ML**: TensorFlow.js, MobileNet (for Cat Detector)

## 📜 License

ISC - See package.json for details

## 🐛 Issues & Feedback

Found a bug or have a suggestion? [Open an issue on GitHub](https://github.com/tataoumtatoum/tools/issues)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**Happy tool using! 🎉**
