import { test, expect } from '@playwright/test';

test.describe('Mermaid to Image Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mermaid-to-image.html');
  });

  test.describe('Basic Rendering', () => {
    test('should load the page with default diagram', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Mermaid to Image Converter');
      await expect(page.getByTestId('mermaid-input')).toBeVisible();
      await expect(page.getByTestId('render-btn')).toBeVisible();
      await expect(page.getByTestId('download-btn')).toBeVisible();
    });

    test('should render default diagram on load', async ({ page }) => {
      // Wait for mermaid to render
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      const svg = page.locator('#preview-inner svg');
      await expect(svg).toBeVisible();
    });

    test('should enable download button after rendering', async ({ page }) => {
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      const downloadBtn = page.getByTestId('download-btn');
      await expect(downloadBtn).toBeEnabled();
    });

    test('should render custom diagram', async ({ page }) => {
      const input = page.getByTestId('mermaid-input');
      await input.clear();
      await input.fill(`graph LR
        A[Test] --> B[Custom]
        B --> C[Diagram]`);
      
      await page.getByTestId('render-btn').click();
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      
      const svg = page.locator('#preview-inner svg');
      await expect(svg).toBeVisible();
    });

    test('should show error for invalid mermaid code', async ({ page }) => {
      const input = page.getByTestId('mermaid-input');
      await input.clear();
      await input.fill('invalid mermaid code !!!');
      
      await page.getByTestId('render-btn').click();
      
      // Should show error message
      await expect(page.locator('.error')).toBeVisible({ timeout: 5000 });
      
      // Download button should be disabled
      await expect(page.getByTestId('download-btn')).toBeDisabled();
    });
  });

  test.describe('Open File Button', () => {
    test('should show the Open File button on desktop and mobile', async ({ page }) => {
      // Unlike the drop zone (hidden on mobile), the button must always be available.
      await expect(page.getByTestId('open-file-btn')).toBeVisible();
    });

    test('should have a hidden file input accepting mermaid files', async ({ page }) => {
      const fileInput = page.locator('#file-input');
      await expect(fileInput).toHaveAttribute('type', 'file');
      const accept = await fileInput.getAttribute('accept');
      expect(accept).toContain('.mmd');
      expect(accept).toContain('.mermaid');
    });

    test('should load diagram from a chosen file and render it', async ({ page }) => {
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });

      // Simulate selecting a file via the hidden <input type=file> fallback path.
      await page.setInputFiles('#file-input', {
        name: 'diagram.mmd',
        mimeType: 'text/plain',
        buffer: Buffer.from('graph LR\n  Opened --> FromFile'),
      });

      await expect(page.getByTestId('mermaid-input')).toHaveValue(/Opened --> FromFile/);
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      await expect(page.locator('#preview-inner svg')).toBeVisible();
    });
  });

  test.describe('Format Selection', () => {
    test('should offer PNG and SVG formats', async ({ page }) => {
      const options = await page.getByTestId('format-select').locator('option').allTextContents();
      expect(options).toContain('PNG');
      expect(options).toContain('SVG');
    });

    test('should update download button label and disable scale for SVG', async ({ page }) => {
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });

      const downloadBtn = page.getByTestId('download-btn');
      const scaleSelect = page.getByTestId('scale-select');

      await expect(downloadBtn).toContainText('PNG');
      await expect(scaleSelect).toBeEnabled();

      await page.getByTestId('format-select').selectOption('svg');
      await expect(downloadBtn).toContainText('SVG');
      await expect(scaleSelect).toBeDisabled();

      // Switching back restores PNG behaviour.
      await page.getByTestId('format-select').selectOption('png');
      await expect(downloadBtn).toContainText('PNG');
      await expect(scaleSelect).toBeEnabled();
    });
  });

  test.describe('Theme Selection', () => {
    test('should change theme and re-render', async ({ page }) => {
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      
      const themeSelect = page.getByTestId('theme-select');
      await themeSelect.selectOption('dark');
      
      // SVG should still be rendered after theme change
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      await expect(page.locator('#preview-inner svg')).toBeVisible();
    });

    test('should have all theme options', async ({ page }) => {
      const themeSelect = page.getByTestId('theme-select');
      
      const options = await themeSelect.locator('option').allTextContents();
      expect(options).toContain('Default');
      expect(options).toContain('Dark');
      expect(options).toContain('Forest');
      expect(options).toContain('Neutral');
    });
  });

  test.describe('Scale Selection', () => {
    test('should show output size info', async ({ page }) => {
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      
      const sizeInfo = page.getByTestId('size-info');
      await expect(sizeInfo).toContainText('Output size:');
    });

    test('should update size info when scale changes', async ({ page }) => {
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      
      const sizeInfo = page.getByTestId('size-info');
      const initialSize = await sizeInfo.textContent();
      
      await page.getByTestId('scale-select').selectOption('4');
      
      // Size should be larger
      const newSize = await sizeInfo.textContent();
      expect(newSize).not.toBe(initialSize);
    });
  });

  test.describe('Zoom Controls', () => {
    test('should zoom in when clicking zoom in button', async ({ page }) => {
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      
      const zoomLevel = page.getByTestId('zoom-level');
      await expect(zoomLevel).toContainText('100%');
      
      await page.getByTestId('zoom-in').click();
      
      await expect(zoomLevel).toContainText('125%');
    });

    test('should zoom out when clicking zoom out button', async ({ page }) => {
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      
      const zoomLevel = page.getByTestId('zoom-level');
      await expect(zoomLevel).toContainText('100%');
      
      await page.getByTestId('zoom-out').click();
      
      await expect(zoomLevel).toContainText('75%');
    });

    test('should reset zoom when clicking reset button', async ({ page }) => {
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      
      // Zoom in first
      await page.getByTestId('zoom-in').click();
      await page.getByTestId('zoom-in').click();
      
      const zoomLevel = page.getByTestId('zoom-level');
      await expect(zoomLevel).toContainText('150%');
      
      // Reset
      await page.locator('#zoom-reset').click();
      
      await expect(zoomLevel).toContainText('100%');
    });
  });

  test.describe('Auto-render on Paste', () => {
    test('should render after pasting new code', async ({ page }) => {
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      
      const input = page.getByTestId('mermaid-input');
      await input.clear();
      
      // Simulate paste
      await input.focus();
      await page.evaluate(() => {
        const input = document.querySelector('[data-testid="mermaid-input"]') as HTMLTextAreaElement;
        input.value = 'graph TD\n    X[Pasted] --> Y[Content]';
        input.dispatchEvent(new Event('paste', { bubbles: true }));
      });
      
      // Wait for re-render
      await page.waitForTimeout(200);
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      
      await expect(page.locator('#preview-inner svg')).toBeVisible();
    });
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    
    await page.goto('/mermaid-to-image.html');
    
    // All main elements should be visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('mermaid-input')).toBeVisible();
    await expect(page.getByTestId('render-btn')).toBeVisible();
    await expect(page.getByTestId('download-btn')).toBeVisible();
    await expect(page.getByTestId('preview')).toBeVisible();
    
    // Buttons should be touch-friendly (at least 44px)
    const renderBtn = page.getByTestId('render-btn');
    const box = await renderBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('should hide drop zone on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    
    await page.goto('/mermaid-to-image.html');
    
    const dropZone = page.locator('#drop-zone');
    await expect(dropZone).not.toBeVisible();
  });
});

test.describe('Download Functionality', () => {
  test('should generate PNG and trigger download process on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-only test');
    
    await page.goto('/mermaid-to-image.html');
    await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
    
    // Verify download button is enabled
    await expect(page.getByTestId('download-btn')).toBeEnabled();
    
    // Monitor for any errors during download
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    
    // Click download - for data URL downloads, we verify the process completes without error
    await page.getByTestId('download-btn').click();
    
    // Wait a moment for download process to complete
    await page.waitForTimeout(1000);
    
    // Verify no errors occurred
    expect(errors).toHaveLength(0);
    
    // Modal should NOT appear on desktop (since checkIsMobile() returns false)
    const modal = page.getByTestId('mobile-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should generate SVG and trigger download process on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-only test');

    await page.goto('/mermaid-to-image.html');
    await page.waitForSelector('#preview-inner svg', { timeout: 10000 });

    await page.getByTestId('format-select').selectOption('svg');
    await expect(page.getByTestId('download-btn')).toContainText('SVG');

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.getByTestId('download-btn').click();
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
    await expect(page.getByTestId('mobile-modal')).not.toBeVisible();
  });

  test('should show mobile modal on download (mobile)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    
    await page.goto('/mermaid-to-image.html');
    await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
    
    // Click download
    await page.getByTestId('download-btn').click();
    
    // Modal should appear
    const modal = page.getByTestId('mobile-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Modal image should be present
    await expect(page.locator('#modal-image')).toHaveAttribute('src', /^data:image\/png/);
  });

  test('should close modal when clicking close button (mobile)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    
    await page.goto('/mermaid-to-image.html');
    await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
    
    await page.getByTestId('download-btn').click();
    
    const modal = page.getByTestId('mobile-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });
    
    // Close modal
    await page.locator('#modal-close').click();
    
    await expect(modal).not.toBeVisible();
  });

  test('should open image in new tab when clicking open button (mobile)', async ({ page, context, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    
    await page.goto('/mermaid-to-image.html');
    await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
    
    await page.getByTestId('download-btn').click();
    
    await page.waitForSelector('#mobile-modal.show', { timeout: 10000 });
    
    // Listen for new page
    const pagePromise = context.waitForEvent('page');
    
    await page.locator('#open-btn').click();
    
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    
    // New page should have the image
    await expect(newPage.locator('img')).toBeVisible();
  });
});

test.describe('Background Color Options', () => {
  test('should have background color options', async ({ page }) => {
    await page.goto('/mermaid-to-image.html');
    
    const bgSelect = page.getByTestId('bg-select');
    const options = await bgSelect.locator('option').allTextContents();
    
    expect(options).toContain('White');
    expect(options).toContain('Transparent');
    expect(options).toContain('Light Gray');
  });
});

test.describe('Diagram Types', () => {
  const diagramTypes = [
    {
      name: 'Flowchart',
      code: 'graph TD\n    A[Start] --> B[End]'
    },
    {
      name: 'Sequence Diagram',
      code: 'sequenceDiagram\n    Alice->>Bob: Hello'
    },
    {
      name: 'Class Diagram',
      code: 'classDiagram\n    Animal <|-- Duck'
    },
    {
      name: 'State Diagram',
      code: 'stateDiagram-v2\n    [*] --> Still'
    },
    {
      name: 'Pie Chart',
      code: 'pie title Test\n    "A" : 30\n    "B" : 70'
    }
  ];

  for (const diagram of diagramTypes) {
    test(`should render ${diagram.name}`, async ({ page }) => {
      await page.goto('/mermaid-to-image.html');
      
      const input = page.getByTestId('mermaid-input');
      await input.clear();
      await input.fill(diagram.code);
      
      await page.getByTestId('render-btn').click();
      
      await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
      await expect(page.locator('#preview-inner svg')).toBeVisible();
      await expect(page.getByTestId('download-btn')).toBeEnabled();
    });
  }
});
