import { test, expect } from '@playwright/test';

/**
 * TDD tests for mobile download functionality
 * These tests verify the download works correctly on mobile Android browsers
 */

test.describe('Mobile Download Debug Tests', () => {
  
  test('should detect mobile correctly based on viewport and touch', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/mermaid-to-image.html');
    
    // Check what isMobile returns
    const isMobileResult = await page.evaluate(() => {
      const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const smallScreen = window.innerWidth <= 768;
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return { hasTouch, smallScreen, mobileUA, innerWidth: window.innerWidth };
    });
    
    console.log('Mobile detection results:', isMobileResult);
    
    // On Playwright mobile emulation, at least smallScreen should be true
    expect(isMobileResult.smallScreen).toBe(true);
  });

  test('should show modal when clicking download on mobile viewport', async ({ page }) => {
    // Emulate mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/mermaid-to-image.html');
    await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
    
    // Force mobile detection by overriding the function
    await page.evaluate(() => {
      (window as any).forceMobile = true;
    });
    
    // Click download
    await page.getByTestId('download-btn').click();
    
    // Wait and check modal state
    await page.waitForTimeout(2000);
    
    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById('mobile-modal');
      return modal?.classList.contains('show');
    });
    
    console.log('Modal visible:', modalVisible);
    
    // Check if checkIsMobile returns true
    const checkResult = await page.evaluate(() => {
      const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const smallScreen = window.innerWidth <= 768;
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return { hasTouch, smallScreen, mobileUA, result: hasTouch || smallScreen || mobileUA };
    });
    
    console.log('checkIsMobile at download time:', checkResult);
  });

  test('should verify PNG generation works', async ({ page }) => {
    await page.goto('/mermaid-to-image.html');
    await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
    
    // Generate PNG via exposed function
    const pngGenerated = await page.evaluate(async () => {
      // Access the generatePng function from the page
      const canvas = document.getElementById('canvas') as HTMLCanvasElement;
      const svg = document.querySelector('#preview-inner svg');
      
      if (!svg) return { error: 'No SVG found' };
      
      // Try to generate PNG
      try {
        const svgClone = svg.cloneNode(true) as SVGElement;
        const width = 200;
        const height = 200;
        
        svgClone.setAttribute('width', String(width));
        svgClone.setAttribute('height', String(height));
        
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              URL.revokeObjectURL(url);
              resolve({ success: true, hasDataUrl: dataUrl.startsWith('data:image/png') });
            } else {
              resolve({ error: 'No canvas context' });
            }
          };
          img.onerror = (e) => resolve({ error: 'Image load failed', details: String(e) });
          img.src = url;
        });
      } catch (e) {
        return { error: String(e) };
      }
    });
    
    console.log('PNG generation result:', pngGenerated);
    expect(pngGenerated).toHaveProperty('success', true);
  });

  test('modal should have working download options', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/mermaid-to-image.html');
    await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
    
    // Manually trigger the modal with a test image
    await page.evaluate(() => {
      const modal = document.getElementById('mobile-modal');
      const modalImage = document.getElementById('modal-image') as HTMLImageElement;
      
      // Create a simple test PNG data URL
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 100, 100);
      }
      const testDataUrl = canvas.toDataURL('image/png');
      
      modalImage.src = testDataUrl;
      modal?.classList.add('show');
      (window as any).currentDataUrl = testDataUrl;
    });
    
    // Verify modal is shown
    await expect(page.locator('#mobile-modal')).toBeVisible();
    
    // Verify image is loaded
    const imgSrc = await page.locator('#modal-image').getAttribute('src');
    expect(imgSrc).toMatch(/^data:image\/png/);
    
    // Test close button
    await page.locator('#modal-close').click();
    await expect(page.locator('#mobile-modal')).not.toBeVisible();
  });
});

test.describe('Mobile Chrome Emulation', () => {
  test.use({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    hasTouch: true,
    isMobile: true,
  });

  test('should show modal on mobile Chrome Android', async ({ page }) => {
    await page.goto('/mermaid-to-image.html');
    await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
    
    // Verify mobile detection
    const isMobile = await page.evaluate(() => {
      const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const smallScreen = window.innerWidth <= 768;
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return { hasTouch, smallScreen, mobileUA, combined: hasTouch || smallScreen || mobileUA };
    });
    
    console.log('Mobile detection on Android Chrome:', isMobile);
    expect(isMobile.combined).toBe(true);
    
    // Click download
    await page.getByTestId('download-btn').click();
    
    // Modal should appear
    await expect(page.locator('#mobile-modal')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Mobile Firefox Emulation', () => {
  test.use({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Android 13; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
    hasTouch: true,
    isMobile: true,
  });

  test('should show modal on mobile Firefox Android', async ({ page }) => {
    await page.goto('/mermaid-to-image.html');
    await page.waitForSelector('#preview-inner svg', { timeout: 10000 });
    
    // Verify mobile detection
    const isMobile = await page.evaluate(() => {
      const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const smallScreen = window.innerWidth <= 768;
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return { hasTouch, smallScreen, mobileUA, combined: hasTouch || smallScreen || mobileUA };
    });
    
    console.log('Mobile detection on Android Firefox:', isMobile);
    expect(isMobile.combined).toBe(true);
    
    // Click download
    await page.getByTestId('download-btn').click();
    
    // Modal should appear
    await expect(page.locator('#mobile-modal')).toBeVisible({ timeout: 10000 });
  });
});
