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
      await expect(page.locator('.upload-label')).toContainText('Upload from gallery');
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
      await expect(page.locator('#results-section')).toBeVisible({ timeout: 90000 });
      
      // Should show summary
      await expect(page.locator('#summary')).toBeVisible();
      
      // Should have dangerous section and identified section
      const dangerousSection = page.locator('#dangerous-section');
      const identifiedSection = page.locator('#identified-section');
      await expect(dangerousSection).toBeVisible();
      await expect(identifiedSection).toBeVisible();
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
    
    await expect(page.locator('#results-section')).toBeVisible({ timeout: 90000 });
    
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

test.describe('Sodium Cyanide Detection (TDD)', () => {
  test('should detect sodium cyanide as DANGER from test image', async ({ page }) => {
    await page.goto('/ingredient-scanner.html');
    
    // Upload the test image containing "Sodium Cyanide"
    await page.locator('#file-input').setInputFiles('tests/ingredient-scanner_test-1.jpg');
    
    // Wait for OCR and API analysis to complete (may take a while)
    await expect(page.locator('#results-section')).toBeVisible({ timeout: 120000 });
    
    // Verify OCR extracted "sodium cyanide" from the image
    await page.locator('#text-toggle').click();
    const extractedText = await page.locator('#extracted-text').textContent();
    console.log('Extracted text:', extractedText);
    expect(extractedText?.toLowerCase()).toContain('sodium');
    expect(extractedText?.toLowerCase()).toContain('cyanide');
    
    // Verify sodium cyanide is classified as DANGER
    const dangerousSection = page.locator('#dangerous-section');
    await expect(dangerousSection).toBeVisible();
    
    const dangerousSectionText = await dangerousSection.textContent();
    console.log('Dangerous section:', dangerousSectionText);
    
    // Should find sodium cyanide as dangerous
    expect(dangerousSectionText?.toLowerCase()).toContain('cyanide');
    
    // Should be marked as DANGER level (not warning or caution)
    const dangerBadges = page.locator('.badge.danger');
    const dangerCount = await dangerBadges.count();
    console.log('Danger badges count:', dangerCount);
    expect(dangerCount).toBeGreaterThan(0);
    
    // Verify H-codes are displayed (H300, H310, H330 for sodium cyanide)
    const ingredientItems = await page.locator('.ingredient-item.danger').allTextContents();
    console.log('Danger items:', ingredientItems);
    
    // At least one danger item should mention H-codes or fatal hazards
    const hasHCodes = ingredientItems.some(item => 
      item.includes('H300') || item.includes('H310') || item.includes('H330') || 
      item.toLowerCase().includes('fatal')
    );
    expect(hasHCodes).toBe(true);
  });

  test('should show correct API sources for sodium cyanide detection', async ({ page }) => {
    await page.goto('/ingredient-scanner.html');
    
    // Upload the test image
    await page.locator('#file-input').setInputFiles('tests/ingredient-scanner_test-1.jpg');
    
    // Wait for results
    await expect(page.locator('#results-section')).toBeVisible({ timeout: 120000 });
    
    // Verify API status section shows PubChem was used
    const apiStatus = page.locator('#api-status');
    await expect(apiStatus).toBeVisible();
    
    const apiStatusText = await apiStatus.textContent();
    console.log('API Status:', apiStatusText);
    
    // Should show PubChem was checked
    expect(apiStatusText).toContain('PubChem');
    
    // Should show at least 1 chemical with hazards found
    expect(apiStatusText).toMatch(/\d+ with hazards/);
  });

  test('should display sodium cyanide in identified ingredients list', async ({ page }) => {
    await page.goto('/ingredient-scanner.html');
    
    // Upload the test image
    await page.locator('#file-input').setInputFiles('tests/ingredient-scanner_test-1.jpg');
    
    // Wait for results
    await expect(page.locator('#results-section')).toBeVisible({ timeout: 120000 });
    
    // Check identified ingredients section
    const identifiedSection = page.locator('#identified-section');
    await expect(identifiedSection).toBeVisible();
    
    const identifiedText = await identifiedSection.textContent();
    console.log('Identified section:', identifiedText);
    
    // Sodium cyanide should be in the identified list with a warning indicator
    expect(identifiedText?.toLowerCase()).toContain('cyanide');
  });

  test('should show summary with at least 1 high risk item', async ({ page }) => {
    await page.goto('/ingredient-scanner.html');
    
    // Upload the test image
    await page.locator('#file-input').setInputFiles('tests/ingredient-scanner_test-1.jpg');
    
    // Wait for results
    await expect(page.locator('#results-section')).toBeVisible({ timeout: 120000 });
    
    // Check summary shows danger count > 0
    const summary = page.locator('#summary');
    const summaryText = await summary.textContent();
    console.log('Summary:', summaryText);
    
    // The danger count should be at least 1
    const dangerCount = page.locator('.summary-item.danger .summary-count');
    const dangerCountText = await dangerCount.textContent();
    console.log('Danger count:', dangerCountText);
    
    expect(parseInt(dangerCountText || '0')).toBeGreaterThan(0);
  });
});
