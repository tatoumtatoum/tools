import { test, expect } from '@playwright/test';

test.describe('Cat Detector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cat-detector.html');
  });

  test.describe('Page Load', () => {
    test('should display title and drop zone', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Cat Detector');
      await expect(page.locator('#dropZone')).toBeVisible();
      await expect(page.locator('#fileInput')).toBeAttached();
    });

    test('should show model loading status', async ({ page }) => {
      const status = page.locator('#status');
      await expect(status).toBeVisible();
      // Should show loading or loaded message
      const text = await status.textContent();
      expect(text!.length).toBeGreaterThan(0);
    });

    test('should eventually load the model', async ({ page }) => {
      const status = page.locator('#status');
      await expect(status).toContainText('loaded', { timeout: 120000 });
    });
  });

  test.describe('Image Upload', () => {
    test.setTimeout(180000);

    test('should show image preview after file upload', async ({ page }) => {
      await expect(page.locator('#status')).toContainText('loaded', { timeout: 120000 });

      await page.locator('#fileInput').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: await createTestImage(page)
      });

      await expect(page.locator('#preview')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#imagePreview')).toHaveAttribute('src', /data:image/, { timeout: 5000 });
    });

    test('should open file picker when drop zone is clicked', async ({ page }) => {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.locator('#dropZone').click();
      const fileChooser = await fileChooserPromise;
      expect(fileChooser).toBeTruthy();
    });

    test('should highlight drop zone on dragover', async ({ page }) => {
      const dropZone = page.locator('#dropZone');

      await dropZone.dispatchEvent('dragover', { bubbles: true });
      await expect(dropZone).toHaveClass(/dragover/);
    });

    test('should remove highlight on dragleave', async ({ page }) => {
      const dropZone = page.locator('#dropZone');

      await dropZone.dispatchEvent('dragover', { bubbles: true });
      await expect(dropZone).toHaveClass(/dragover/);

      await dropZone.dispatchEvent('dragleave', { bubbles: true });
      await expect(dropZone).not.toHaveClass(/dragover/);
    });
  });

  test.describe('Classification', () => {
    test.setTimeout(180000);

    test('should show analyzing state during classification', async ({ page }) => {
      await expect(page.locator('#status')).toContainText('loaded', { timeout: 120000 });

      await page.locator('#fileInput').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: await createTestImage(page)
      });

      // Result should appear (either loading or final)
      await expect(page.locator('#result')).toBeVisible({ timeout: 30000 });
    });

    test('should display predictions panel after classification', async ({ page }) => {
      await expect(page.locator('#status')).toContainText('loaded', { timeout: 120000 });

      await page.locator('#fileInput').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: await createTestImage(page)
      });

      // Wait for predictions panel to appear
      await expect(page.locator('#predictions')).toBeVisible({ timeout: 60000 });
      const items = page.locator('.prediction');
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should show prediction names and confidence values', async ({ page }) => {
      await expect(page.locator('#status')).toContainText('loaded', { timeout: 120000 });

      await page.locator('#fileInput').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: await createTestImage(page)
      });

      await expect(page.locator('#predictions')).toBeVisible({ timeout: 60000 });

      const firstPred = page.locator('.prediction').first();
      await expect(firstPred.locator('.name')).not.toBeEmpty();
      await expect(firstPred.locator('.confidence')).not.toBeEmpty();
    });

    test('should show cat or not-cat result', async ({ page }) => {
      await expect(page.locator('#status')).toContainText('loaded', { timeout: 120000 });

      await page.locator('#fileInput').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: await createTestImage(page)
      });

      const result = page.locator('#result');
      await expect(result).toBeVisible({ timeout: 60000 });

      // Wait for classification to finish (not loading)
      await page.waitForFunction(() => {
        const el = document.getElementById('result');
        return el && !el.classList.contains('loading');
      }, { timeout: 60000 });

      const cls = await result.getAttribute('class');
      expect(cls === 'cat' || cls === 'not-cat').toBe(true);
    });

    test('should display a canvas overlay for bounding boxes', async ({ page }) => {
      await expect(page.locator('#status')).toContainText('loaded', { timeout: 120000 });

      await page.locator('#fileInput').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: await createTestImage(page)
      });

      // Wait for detection to finish
      await page.waitForFunction(() => {
        const el = document.getElementById('result');
        return el && !el.classList.contains('loading');
      }, { timeout: 60000 });

      // Canvas overlay should exist for bounding box drawing
      const canvas = page.locator('#boxCanvas');
      await expect(canvas).toBeAttached();
    });
  });

  test.describe('Mobile Responsive', () => {
    test.setTimeout(180000);
    test('should be usable on mobile viewport', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test');

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('#dropZone')).toBeVisible();
    });

    test('drop zone should be full width on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test');

      const viewport = page.viewportSize()!;
      const dropZone = page.locator('#dropZone');
      const box = await dropZone.boundingBox();
      // Should use most of the viewport width (accounting for body padding)
      expect(box!.width).toBeGreaterThanOrEqual(viewport.width * 0.85);
    });

    test('should display results properly on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test');

      await expect(page.locator('#status')).toContainText('loaded', { timeout: 120000 });

      await page.locator('#fileInput').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: await createTestImage(page)
      });

      await expect(page.locator('#result')).toBeVisible({ timeout: 60000 });
      const resultBox = await page.locator('#result').boundingBox();
      const viewport = page.viewportSize()!;
      expect(resultBox!.width).toBeGreaterThanOrEqual(viewport.width * 0.85);
    });

    test('image preview should fit mobile screen', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test');

      await expect(page.locator('#status')).toContainText('loaded', { timeout: 120000 });

      await page.locator('#fileInput').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: await createTestImage(page)
      });

      await expect(page.locator('#preview')).toBeVisible({ timeout: 30000 });
      const imgBox = await page.locator('#imagePreview').boundingBox();
      const viewport = page.viewportSize()!;
      expect(imgBox!.width).toBeLessThanOrEqual(viewport.width);
    });
  });
});

// Helper: create a small test PNG image via canvas
async function createTestImage(page: any): Promise<Buffer> {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d')!;
    // Draw a colored rectangle
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(0, 0, 224, 224);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(80, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(150, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(base64, 'base64');
}
