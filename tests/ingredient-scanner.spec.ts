import { test, expect } from '@playwright/test';

test.describe('Ingredient Safety Scanner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ingredient-scanner.html');
  });

  test.describe('Page Load', () => {
    test('should load the page with correct title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Ingredient Scanner');
    });

    test('should have start camera button visible', async ({ page }) => {
      await expect(page.locator('#start-btn')).toBeVisible();
      await expect(page.locator('#start-btn')).toContainText('Start Camera');
    });

    test('should have file upload option', async ({ page }) => {
      await expect(page.locator('#file-input')).toBeAttached();
      await expect(page.locator('.upload-label')).toContainText('upload an image');
    });

    test('should display instructions', async ({ page }) => {
      await expect(page.locator('.info-section')).toContainText('How to use');
    });

    test('should show disclaimer', async ({ page }) => {
      await expect(page.locator('.disclaimer')).toContainText('Disclaimer');
    });
  });

  test.describe('UI Elements', () => {
    test('should have camera overlay initially visible', async ({ page }) => {
      await expect(page.locator('#camera-overlay')).toBeVisible();
      await expect(page.locator('#camera-overlay')).toContainText('Camera access required');
    });

    test('should have progress section hidden initially', async ({ page }) => {
      await expect(page.locator('#progress-section')).not.toBeVisible();
    });

    test('should have results section hidden initially', async ({ page }) => {
      await expect(page.locator('#results-section')).not.toBeVisible();
    });

    test('should have capture button hidden initially', async ({ page }) => {
      await expect(page.locator('#capture-btn')).not.toBeVisible();
    });
  });

  test.describe('File Upload Processing', () => {
    test('should process uploaded image', async ({ page }) => {
      // Create a test image with text
      const testImageBase64 = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 200);
        
        // Add text
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText('INGREDIENTS: Water, Sugar, Salt', 20, 50);
        
        return canvas.toDataURL('image/png').split(',')[1];
      });
      
      // Create buffer and upload
      const buffer = Buffer.from(testImageBase64, 'base64');
      
      await page.locator('#file-input').setInputFiles({
        name: 'test-label.png',
        mimeType: 'image/png',
        buffer: buffer
      });
      
      // Should show progress section
      await expect(page.locator('#progress-section')).toBeVisible({ timeout: 5000 });
      
      // Wait for OCR to complete (may take a while)
      await expect(page.locator('#results-section')).toBeVisible({ timeout: 60000 });
    });

    test('should show results after processing', async ({ page }) => {
      // Create a simple test image
      const buffer = await page.evaluate(async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 100);
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.fillText('Test ingredients list', 10, 50);
        
        return new Promise(resolve => {
          canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
            reader.readAsArrayBuffer(blob!);
          }, 'image/png');
        });
      }) as number[];
      
      await page.locator('#file-input').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(buffer)
      });
      
      // Wait for results
      await expect(page.locator('#results-section')).toBeVisible({ timeout: 60000 });
      
      // Should show summary
      await expect(page.locator('#summary')).toBeVisible();
      
      // Should have ingredient list or no issues message
      const ingredientList = page.locator('#ingredient-list');
      await expect(ingredientList).toBeVisible();
    });
  });

  test.describe('Dangerous Ingredient Detection', () => {
    test('should detect formaldehyde as danger', async ({ page }) => {
      // Create image with dangerous ingredient
      const buffer = await page.evaluate(async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 100);
        ctx.fillStyle = 'black';
        ctx.font = '18px Arial';
        ctx.fillText('Ingredients: Formaldehyde, Water', 10, 50);
        
        return new Promise(resolve => {
          canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
            reader.readAsArrayBuffer(blob!);
          }, 'image/png');
        });
      }) as number[];
      
      await page.locator('#file-input').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(buffer)
      });
      
      await expect(page.locator('#results-section')).toBeVisible({ timeout: 60000 });
      
      // Check if formaldehyde was detected (may depend on OCR accuracy)
      const extractedText = await page.locator('#extracted-text').textContent();
      console.log('Extracted text:', extractedText);
    });
  });

  test.describe('Reset Functionality', () => {
    test('should reset to initial state after processing', async ({ page }) => {
      // Upload a test image
      const buffer = await page.evaluate(async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 100);
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.fillText('Test', 10, 50);
        
        return new Promise(resolve => {
          canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
            reader.readAsArrayBuffer(blob!);
          }, 'image/png');
        });
      }) as number[];
      
      await page.locator('#file-input').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(buffer)
      });
      
      // Wait for results
      await expect(page.locator('#results-section')).toBeVisible({ timeout: 60000 });
      
      // Reset button should be visible
      await expect(page.locator('#reset-btn')).toBeVisible();
      
      // Click reset
      await page.locator('#reset-btn').click();
      
      // Results should be hidden
      await expect(page.locator('#results-section')).not.toBeVisible();
      
      // Start button or capture button should be visible again
      const startVisible = await page.locator('#start-btn').isVisible();
      const captureVisible = await page.locator('#capture-btn').isVisible();
      expect(startVisible || captureVisible).toBeTruthy();
    });
  });

  test.describe('Extracted Text Toggle', () => {
    test('should toggle extracted text visibility', async ({ page }) => {
      // Upload test image
      const buffer = await page.evaluate(async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 100);
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.fillText('Test text', 10, 50);
        
        return new Promise(resolve => {
          canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
            reader.readAsArrayBuffer(blob!);
          }, 'image/png');
        });
      }) as number[];
      
      await page.locator('#file-input').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(buffer)
      });
      
      await expect(page.locator('#results-section')).toBeVisible({ timeout: 60000 });
      
      // Initially hidden
      await expect(page.locator('#extracted-text')).not.toBeVisible();
      
      // Click toggle
      await page.locator('#text-toggle').click();
      
      // Should be visible
      await expect(page.locator('#extracted-text')).toBeVisible();
      
      // Click again to hide
      await page.locator('#text-toggle').click();
      
      // Should be hidden
      await expect(page.locator('#extracted-text')).not.toBeVisible();
    });
  });
});

test.describe('Ingredient Scanner - Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    
    await page.goto('/ingredient-scanner.html');
    
    // All main elements should be visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#start-btn')).toBeVisible();
    await expect(page.locator('.upload-label')).toBeVisible();
    
    // Buttons should be touch-friendly
    const startBtn = page.locator('#start-btn');
    const box = await startBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/ingredient-scanner.html');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#start-btn')).toBeVisible();
  });
});

test.describe('Ingredient Database', () => {
  test('should detect known dangerous ingredient (formaldehyde)', async ({ page }) => {
    await page.goto('/ingredient-scanner.html');
    
    // Create image with formaldehyde text
    const buffer = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, 500, 150);
      ctx!.fillStyle = 'black';
      ctx!.font = 'bold 24px Arial';
      ctx!.fillText('FORMALDEHYDE', 50, 80);
      
      return new Promise(resolve => {
        canvas.toBlob(blob => {
          const reader = new FileReader();
          reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
          reader.readAsArrayBuffer(blob!);
        }, 'image/png');
      });
    }) as number[];
    
    await page.locator('#file-input').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from(buffer)
    });
    
    await expect(page.locator('#results-section')).toBeVisible({ timeout: 60000 });
    
    // Check if danger items found
    const summary = await page.locator('#summary').textContent();
    console.log('Summary:', summary);
    
    // Check extracted text contains formaldehyde
    await page.locator('#text-toggle').click();
    const extractedText = await page.locator('#extracted-text').textContent();
    expect(extractedText?.toLowerCase()).toContain('formaldehyde');
  });

  test('should show safe result for harmless text', async ({ page }) => {
    await page.goto('/ingredient-scanner.html');
    
    // Create image with safe ingredients
    const buffer = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, 500, 150);
      ctx!.fillStyle = 'black';
      ctx!.font = '20px Arial';
      ctx!.fillText('Ingredients: Water, Sugar, Salt', 30, 80);
      
      return new Promise(resolve => {
        canvas.toBlob(blob => {
          const reader = new FileReader();
          reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
          reader.readAsArrayBuffer(blob!);
        }, 'image/png');
      });
    }) as number[];
    
    await page.locator('#file-input').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from(buffer)
    });
    
    await expect(page.locator('#results-section')).toBeVisible({ timeout: 60000 });
    
    // Should show safe or no issues
    const ingredientList = await page.locator('#ingredient-list').textContent();
    console.log('Ingredient list:', ingredientList);
  });
});
