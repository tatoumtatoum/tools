# 🛠️ Tools Collection

A collection of useful web-based tools for developers, designers, and researchers. All tools run entirely in your browser with no server-side processing required.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://tatoumtatoum.github.io/tools/)

## 📚 Available Tools

### 1. Mermaid to PNG Converter

Convert Mermaid diagrams to high-quality PNG images with an intuitive interface.

**Features:**
- 🎨 Real-time diagram preview
- 📥 Drag-and-drop support for `.mmd` files
- 🔍 Zoom controls for precise viewing
- 💾 Export to PNG with customizable quality
- 📱 Fully responsive design
- 🌐 Works offline (Progressive Web App)

**Use Cases:**
- Creating diagram images for documentation
- Generating flowcharts for presentations
- Converting Mermaid code to shareable images

**[→ Open Mermaid to PNG Converter](mermaid-to-png.html)**

---

### 2. 🔬 Ingredient Safety Scanner

Scan food and cosmetic product labels to identify dangerous chemicals, carcinogens, and harmful additives.

**Features:**
- 📸 OCR-powered text extraction from product labels
- ⚠️ Automatic hazard detection using PubChem API
- 🧪 GHS (Globally Harmonized System) classification support
- 🔴 Identifies carcinogens, toxic substances, and dangerous chemicals
- 📊 Detailed safety information for each ingredient
- 🌍 Integration with Open Food Facts database
- 🧪 Comprehensive H-code (hazard code) database
- 📱 Mobile-friendly interface

**Technologies:**
- Tesseract.js for OCR
- PubChem API for chemical safety data
- Open Food Facts API for product information
- GHS H-code classification system

**Safety Categories Detected:**
- ⚠️ DANGER - Severe hazards
- ⚠️ WARNING - Moderate hazards  
- ⚠️ CAUTION - Minor hazards
- ✅ SAFE - No known hazards

**[→ Open Ingredient Safety Scanner](ingredient-scanner.html)**

---

### 3. Cat Detector

Detect whether an image contains a cat using real-time machine learning, with bounding box highlighting.

**Features:**
- 🤖 Real-time object detection using YOLOv8n via ONNX Runtime Web
- 📹 Live webcam detection with FPS counter
- 🖼️ Upload or drag-and-drop images
- 🟩 Bounding box highlighting on detected cats
- ⚡ High accuracy detection (37.3 mAP on COCO)
- 📱 Responsive mobile design

**Use Cases:**
- Fun cat detection experiments
- Learning about machine learning in the browser
- Quick image classification

**[→ Open Cat Detector](cat-detector.html)**

---

### 5. 🏥 Cabinet Médical

Application de démonstration pour la gestion d'un cabinet médical, avec authentification par rôle.

**Features:**
- 👨‍⚕️ Two roles: Doctor (full access) and Assistant (patients + appointments only)
- 🗂️ Patient records management (personal data, medical history)
- 📅 Appointment scheduling with status tracking
- 🩺 Consultations with vital signs and diagnosis
- 💊 Prescriptions with PDF export (jsPDF)
- 📋 Medical reports (compte-rendu, certificat, bilan)
- 📄 Feuilles de soin with CCAM codes and PDF export
- 📊 Dashboard with KPIs and today's schedule
- 🔄 Demo data reset button
- 🇫🇷 Full French localization
- 📱 Responsive mobile design

**Technologies:**
- Bootstrap 5 for UI
- Dexie.js for IndexedDB persistent storage
- Day.js for French date formatting
- jsPDF for PDF export

**Demo accounts:**
- Doctor: `dr.bennani` / `docteur123`
- Assistant: `fatima.alaoui` / `assistant123`

**[→ Open Cabinet Médical](cabinet-medical.html)**

---

### 4. 📝 Markdown to HTML Converter

Convert Markdown text to HTML with a live preview, auto-generated table of contents, and copyable raw HTML output.

**Features:**
- ✍️ Live preview as you type
- 📑 Auto-generated table of contents from headings
- 📋 Copy raw HTML output to clipboard
- 📊 GFM support (tables, task lists, strikethrough)
- 💻 Code block rendering
- 🔗 Anchor links for headings
- ⌨️ Tab key support in editor

**Technologies:**
- marked.js for Markdown parsing

**Use Cases:**
- Previewing Markdown content before publishing
- Converting Markdown to HTML for blogs or emails
- Generating table of contents for documents

**[→ Open Markdown to HTML Converter](markdown-to-html.html)**

---

## 🚀 Live Demo

All tools are available at: **[https://tatoumtatoum.github.io/tools/](https://tatoumtatoum.github.io/tools/)**

## 💻 Local Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/tatoumtatoum/tools.git
cd tools

# Install dependencies
npm install

# Start local server
npm run serve
```

The tools will be available at `http://localhost:3000`

### Development Scripts

```bash
# Start local development server
npm run serve

# Run all tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests in specific browsers
npm run test:chrome
npm run test:firefox
npm run test:webkit

# Run mobile tests
npm run test:mobile

# View test report
npm run report
```

## 🧪 Testing

The project uses Playwright for comprehensive end-to-end testing across multiple browsers:

- **Browsers Tested**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Test Coverage**: 
  - Mermaid to PNG functionality
  - Ingredient Scanner OCR and API integration
  - Markdown to HTML converter
  - Cat Detector classification and mobile
  - Mobile download scenarios
  - Cross-browser compatibility

Run tests with:
```bash
npm test
```

## 🏗️ Project Structure

```
tools/
├── index.html                          # Main landing page
├── mermaid-to-png.html                # Mermaid diagram converter
├── ingredient-scanner.html            # Ingredient safety scanner
├── cabinet-medical.html                # Medical practice management demo
├── cat-detector.html                  # Cat detection tool
├── markdown-to-html.html              # Markdown to HTML converter
├── manifest.json                      # PWA manifest
├── ingredient-scanner-manifest.json   # PWA manifest for scanner
├── sw.js                             # Service worker
├── tests/                            # Playwright tests
│   ├── cabinet-medical.spec.ts
│   ├── mermaid-to-png.spec.ts
│   ├── ingredient-scanner.spec.ts
│   ├── markdown-to-html.spec.ts
│   └── mobile-download-debug.spec.ts
├── package.json                      # Project dependencies
└── playwright.config.ts              # Playwright configuration
```

## 🌐 Deployment

The tools are deployed using GitHub Pages and are accessible at:
- **Main URL**: https://tatoumtatoum.github.io/tools/

### Deploy Your Own

1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Select the `main` branch as the source
4. Your tools will be available at `https://YOUR_USERNAME.github.io/tools/`

## 🔒 Privacy & Security

- **No Data Collection**: All tools run entirely in your browser
- **No Server Processing**: Images and text are processed locally
- **Offline Capable**: Tools work without an internet connection (after first load)
- **No External Uploads**: Your data never leaves your device

## 🛠️ Technologies Used

- **marked.js** - Markdown parsing
- **Mermaid.js** - Diagram rendering
- **Tesseract.js** - OCR text extraction
- **ONNX Runtime Web** - High-performance ML inference in browser
- **YOLOv8n** - State-of-the-art object detection model
- **PubChem API** - Chemical safety data
- **Open Food Facts API** - Product information
- **Dexie.js** - IndexedDB wrapper for persistent browser storage
- **Day.js** - Lightweight date formatting
- **jsPDF** - Client-side PDF generation
- **Playwright** - End-to-end testing
- **Progressive Web App (PWA)** - Offline functionality

## 📄 License

ISC License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For issues and feature requests, please use the [GitHub Issues](https://github.com/tatoumtatoum/tools/issues) page.

---

Made with ❤️ for the open-source community
