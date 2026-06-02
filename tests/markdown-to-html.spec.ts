import { test, expect } from '@playwright/test';

test.describe('Markdown to HTML Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/markdown-to-html.html');
    // Wait for marked.js to load and initial render
    await page.waitForFunction(() => typeof (window as any).renderMarkdown === 'function', { timeout: 10000 });
  });

  test.describe('Page Load', () => {
    test('should load with title and editor visible', async ({ page }) => {
      await expect(page.locator('header h1')).toContainText('Markdown to HTML');
      await expect(page.locator('#editor')).toBeVisible();
    });

    test('should render sample markdown on load', async ({ page }) => {
      // Editor should have sample content
      const editorValue = await page.locator('#editor').inputValue();
      expect(editorValue.length).toBeGreaterThan(0);

      // Preview should show rendered HTML (not empty)
      const previewHTML = await page.locator('#preview').innerHTML();
      expect(previewHTML.length).toBeGreaterThan(0);
    });
  });

  test.describe('Live Preview', () => {
    test('should update preview as user types', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('# Hello World');

      // Preview should contain the rendered h1
      await expect(page.locator('#preview h1')).toHaveText('Hello World');
    });

    test('should render bold and italic text', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('**bold** and *italic*');

      await expect(page.locator('#preview strong')).toHaveText('bold');
      await expect(page.locator('#preview em')).toHaveText('italic');
    });

    test('should render links', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('[GitHub](https://github.com)');

      const link = page.locator('#preview a');
      await expect(link).toHaveText('GitHub');
      await expect(link).toHaveAttribute('href', 'https://github.com');
    });

    test('should render code blocks', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('```\nconsole.log("hello");\n```');

      await expect(page.locator('#preview pre code')).toBeVisible();
      await expect(page.locator('#preview pre code')).toContainText('console.log');
    });

    test('should render lists', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('- Item A\n- Item B\n- Item C');

      const items = page.locator('#preview ul li');
      await expect(items).toHaveCount(3);
    });

    test('should render tables', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |');

      await expect(page.locator('#preview table')).toBeVisible();
      await expect(page.locator('#preview th')).toHaveCount(2);
      await expect(page.locator('#preview td')).toHaveCount(4);
    });

    test('should render blockquotes', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('> This is a quote');

      await expect(page.locator('#preview blockquote')).toBeVisible();
      await expect(page.locator('#preview blockquote')).toContainText('This is a quote');
    });

    test('should show empty preview when editor is cleared', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('');

      const previewText = await page.locator('#preview').innerText();
      expect(previewText.trim()).toBe('');
    });
  });

  test.describe('Table of Contents', () => {
    test('should generate TOC from headings', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('# Title\n## Section One\n## Section Two\n### Subsection');

      // Switch to TOC tab
      await page.locator('[data-view="toc"]').click();
      await expect(page.locator('#toc')).toBeVisible();

      // Should have links for each heading
      const links = page.locator('#toc a');
      await expect(links).toHaveCount(4);
      await expect(links.nth(0)).toHaveText('Title');
      await expect(links.nth(1)).toHaveText('Section One');
      await expect(links.nth(2)).toHaveText('Section Two');
      await expect(links.nth(3)).toHaveText('Subsection');
    });

    test('should show empty message when no headings', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('Just some plain text without headings.');

      await page.locator('[data-view="toc"]').click();
      await expect(page.locator('#toc')).toContainText('No headings found');
    });

    test('TOC links should have anchor hrefs', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('# My Title\n## My Section');

      await page.locator('[data-view="toc"]').click();

      const firstLink = page.locator('#toc a').nth(0);
      const href = await firstLink.getAttribute('href');
      expect(href).toMatch(/^#/);
    });

    test('headings in preview should have matching IDs for anchor links', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('# My Title\n## My Section');

      // Headings in preview should have id attributes
      const h1 = page.locator('#preview h1');
      const h1Id = await h1.getAttribute('id');
      expect(h1Id).toBeTruthy();

      // TOC link href should match heading id
      await page.locator('[data-view="toc"]').click();
      const tocHref = await page.locator('#toc a').nth(0).getAttribute('href');
      expect(tocHref).toBe(`#${h1Id}`);
    });
  });

  test.describe('HTML Source Output', () => {
    test('should show raw HTML when switching to HTML tab', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('# Hello');

      await page.locator('[data-view="html"]').click();
      await expect(page.locator('#htmlOutput')).toBeVisible();

      const htmlText = await page.locator('#htmlOutput').innerText();
      expect(htmlText).toContain('<h1');
      expect(htmlText).toContain('Hello');
      expect(htmlText).toContain('</h1>');
    });

    test('should update HTML source live as user types', async ({ page }) => {
      await page.locator('[data-view="html"]').click();

      const editor = page.locator('#editor');
      await editor.fill('**bold text**');

      const htmlText = await page.locator('#htmlOutput').innerText();
      expect(htmlText).toContain('<strong>');
      expect(htmlText).toContain('bold text');
    });
  });

  test.describe('Copy HTML', () => {
    test('should have a copy HTML button', async ({ page }) => {
      await expect(page.locator('button', { hasText: 'Copy HTML' })).toBeVisible();
    });

    test('should show toast after copying', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      const editor = page.locator('#editor');
      await editor.fill('# Test Copy');

      await page.locator('button', { hasText: 'Copy HTML' }).click();

      await expect(page.locator('#toast')).toHaveClass(/show/, { timeout: 3000 });
    });
  });

  test.describe('Clear Button', () => {
    test('should clear editor and preview', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('# Some content');
      await expect(page.locator('#preview h1')).toBeVisible();

      await page.locator('button', { hasText: 'Clear' }).click();

      const editorValue = await editor.inputValue();
      expect(editorValue).toBe('');

      const previewText = await page.locator('#preview').innerText();
      expect(previewText.trim()).toBe('');
    });
  });

  test.describe('Tab Switching', () => {
    test('should show only one view at a time', async ({ page }) => {
      // Preview visible by default
      await expect(page.locator('#preview')).toBeVisible();
      await expect(page.locator('#toc')).not.toBeVisible();
      await expect(page.locator('#htmlOutput')).not.toBeVisible();

      // Switch to TOC
      await page.locator('[data-view="toc"]').click();
      await expect(page.locator('#preview')).not.toBeVisible();
      await expect(page.locator('#toc')).toBeVisible();
      await expect(page.locator('#htmlOutput')).not.toBeVisible();

      // Switch to HTML
      await page.locator('[data-view="html"]').click();
      await expect(page.locator('#preview')).not.toBeVisible();
      await expect(page.locator('#toc')).not.toBeVisible();
      await expect(page.locator('#htmlOutput')).toBeVisible();

      // Back to Preview
      await page.locator('[data-view="preview"]').click();
      await expect(page.locator('#preview')).toBeVisible();
      await expect(page.locator('#toc')).not.toBeVisible();
      await expect(page.locator('#htmlOutput')).not.toBeVisible();
    });

    test('active tab should be highlighted', async ({ page }) => {
      const previewTab = page.locator('[data-view="preview"]');
      const tocTab = page.locator('[data-view="toc"]');

      await expect(previewTab).toHaveClass(/active/);
      await expect(tocTab).not.toHaveClass(/active/);

      await tocTab.click();
      await expect(tocTab).toHaveClass(/active/);
      await expect(previewTab).not.toHaveClass(/active/);
    });
  });

  test.describe('TOC Navigation & Scroll Sync', () => {
    const fillerParagraphs = Array.from({ length: 40 }, (_, i) => `<p>Filler paragraph ${i + 1} with enough text to take up space in the preview panel and ensure scrolling is required.</p>`).join('\n');
    const mockHTML = `<h1 id="title">Title</h1>\n${fillerParagraphs}\n<h2 id="section-two">Section Two</h2>\n${fillerParagraphs}\n<h2 id="section-three">Section Three</h2>\n${fillerParagraphs}`;

    const fillerLines = Array.from({ length: 40 }, (_, i) => `Filler paragraph ${i + 1} with enough text to take up space in the preview panel and ensure scrolling is required.\n`).join('\n');
    const editorContent = `# Title\n\n${fillerLines}\n## Section Two\n\n${fillerLines}\n## Section Three\n\n${fillerLines}`;

    test.beforeEach(async ({ page }) => {
      // Route must be set before navigation so the initial renderMarkdown call is mocked
      await page.route('https://api.github.com/markdown', route =>
        route.fulfill({ status: 200, contentType: 'text/html', body: mockHTML })
      );
      await page.goto('/markdown-to-html.html');
      await page.waitForFunction(() => typeof (window as any).renderMarkdown === 'function', { timeout: 10000 });
      const editor = page.locator('#editor');
      await editor.fill(editorContent);
      await expect(page.locator('#preview h2')).toHaveCount(2, { timeout: 10000 });
    });

    test('TOC link click scrolls preview to the heading', async ({ page }) => {
      await page.locator('[data-view="toc"]').click();
      await expect(page.locator('#toc')).toBeVisible();
      await page.locator('#toc a', { hasText: 'Section Three' }).click();

      await expect.poll(async () => {
        return page.evaluate(() => {
          const preview = document.getElementById('preview')!;
          const heading = preview.querySelector('#section-three')!;
          if (!heading) return false;
          const previewRect = preview.getBoundingClientRect();
          const headingRect = heading.getBoundingClientRect();
          return headingRect.top >= previewRect.top && headingRect.top <= previewRect.bottom;
        });
      }, { timeout: 3000 }).toBeTruthy();
    });

    test('TOC link click scrolls editor to the heading source line', async ({ page }) => {
      await page.locator('[data-view="toc"]').click();
      await expect(page.locator('#toc')).toBeVisible();
      await page.locator('#toc a', { hasText: 'Section Three' }).click();

      await expect.poll(async () => {
        return page.locator('#editor').evaluate((el: HTMLTextAreaElement) => el.scrollTop);
      }, { timeout: 3000 }).toBeGreaterThan(0);
    });

    test('Reader mode TOC click scrolls reader body to heading', async ({ page }) => {
      await page.locator('button[title="Reader mode"]').click();
      await expect(page.locator('#readerMode')).toHaveClass(/active/);

      await page.locator('#readerToc a', { hasText: 'Section Three' }).click();

      await expect.poll(async () => {
        return page.evaluate(() => {
          const body = document.getElementById('readerBody')!;
          const heading = body.querySelector('#section-three')!;
          if (!heading) return false;
          const bodyRect = body.getBoundingClientRect();
          const headingRect = heading.getBoundingClientRect();
          return headingRect.top >= bodyRect.top && headingRect.top <= bodyRect.bottom;
        });
      }, { timeout: 3000 }).toBeTruthy();
    });

    test('Clicking near bottom of editor scrolls preview down', async ({ page }) => {
      // Ensure preview starts at top
      await page.evaluate(() => document.getElementById('preview')!.scrollTop = 0);

      // Click near the bottom of the editor textarea
      const editor = page.locator('#editor');
      const box = await editor.boundingBox();
      await editor.click({ position: { x: box!.width / 2, y: box!.height - 10 } });

      await expect.poll(async () => {
        return page.evaluate(() => document.getElementById('preview')!.scrollTop);
      }, { timeout: 3000 }).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Responsive', () => {
    test('should stack panels vertically on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test');

      const container = page.locator('.container');
      const panels = container.locator('.panel');

      // Both panels should be visible
      await expect(panels.nth(0)).toBeVisible();
      await expect(panels.nth(1)).toBeVisible();

      // Panels should stack: second panel below first
      const box0 = await panels.nth(0).boundingBox();
      const box1 = await panels.nth(1).boundingBox();
      expect(box1!.y).toBeGreaterThanOrEqual(box0!.y + box0!.height - 1);
    });

    test('should make panels full width on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test');

      const viewport = page.viewportSize()!;
      const panel = page.locator('.panel').nth(0);
      const box = await panel.boundingBox();
      // Panel should be close to full viewport width
      expect(box!.width).toBeGreaterThanOrEqual(viewport.width * 0.95);
    });

    test('should show all toolbar buttons on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test');

      await expect(page.locator('button', { hasText: 'Copy' })).toBeVisible();
      await expect(page.locator('button', { hasText: 'Clear' })).toBeVisible();
    });

    test('should make tabs tappable on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test');

      const tabs = page.locator('.panel-header .tab');
      const count = await tabs.count();
      for (let i = 0; i < count; i++) {
        const box = await tabs.nth(i).boundingBox();
        // Touch targets should be at least 32px tall
        expect(box!.height).toBeGreaterThanOrEqual(32);
      }
    });

    test('should allow switching tabs on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test');

      const editor = page.locator('#editor');
      await editor.fill('# Hello Mobile');

      // Preview should render
      await expect(page.locator('#preview h1')).toHaveText('Hello Mobile');

      // Switch to TOC
      await page.locator('[data-view="toc"]').click();
      await expect(page.locator('#toc')).toBeVisible();
      await expect(page.locator('#preview')).not.toBeVisible();

      // Switch to HTML
      await page.locator('[data-view="html"]').click();
      await expect(page.locator('#htmlOutput')).toBeVisible();
    });

    test('editor should be usable on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-only test');

      const editor = page.locator('#editor');
      await editor.fill('**mobile test**');

      await expect(page.locator('#preview strong')).toHaveText('mobile test');
    });
  });

  test.describe('File Open / Drag-Drop / Sync', () => {
    // Mock the GitHub Markdown API so rendering is deterministic and offline.
    // Echo a minimal HTML rendering of the posted text's first heading + paragraph.
    test.beforeEach(async ({ page }) => {
      await page.route('https://api.github.com/markdown', async route => {
        const body = JSON.parse(route.request().postData() || '{}');
        const text: string = body.text || '';
        const html = text
          .split('\n')
          .map(line => {
            const h = line.match(/^(#{1,6})\s+(.+)/);
            if (h) {
              const level = h[1].length;
              const id = h[2].trim().toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
              return `<h${level} id="${id}">${h[2].trim()}</h${level}>`;
            }
            return line.trim() ? `<p>${line.trim()}</p>` : '';
          })
          .filter(Boolean)
          .join('\n');
        await route.fulfill({ status: 200, contentType: 'text/html', body: html });
      });
      await page.goto('/markdown-to-html.html');
      await page.waitForFunction(() => typeof (window as any).renderMarkdown === 'function', { timeout: 10000 });
    });

    test('should show an Open file button in the toolbar', async ({ page }) => {
      await expect(page.locator('button[title="Open Markdown file"]')).toBeVisible();
    });

    test('should load a file via the fallback file input', async ({ page }) => {
      await page.setInputFiles('#fileInput', {
        name: 'notes.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('# Loaded Heading\n\nSome loaded body text.'),
      });

      // Editor populated with the file contents
      await expect(page.locator('#editor')).toHaveValue(/Loaded Heading/);
      // Preview reflects the rendered file
      await expect(page.locator('#preview h1')).toHaveText('Loaded Heading');
      // File chip shows the filename
      await expect(page.locator('#fileChip')).toContainText('notes.md');
    });

    test('should mark an opened file as read-only', async ({ page }) => {
      await page.setInputFiles('#fileInput', {
        name: 'notes.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('# Read Only File'),
      });

      // A read-only badge should be present on the chip with a clarifying title
      const badge = page.locator('#fileChip .file-readonly');
      await expect(badge).toBeVisible();
      await expect(badge).toHaveAttribute('title', /read-only/i);
    });

    test('editing an opened file is allowed and never detaches/saves the file', async ({ page }) => {
      await page.setInputFiles('#fileInput', {
        name: 'notes.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('# Original'),
      });
      await expect(page.locator('#preview h1')).toHaveText('Original');

      // Editing the editor is allowed and updates the preview...
      await page.locator('#editor').fill('# Edited Locally');
      await expect(page.locator('#preview h1')).toHaveText('Edited Locally');

      // ...while the file stays linked and read-only (edits are not written back).
      await expect(page.locator('#fileChip')).toContainText('notes.md');
      await expect(page.locator('#fileChip .file-readonly')).toBeVisible();
    });

    test('should load a file dropped onto the window', async ({ page }) => {
      // Build a drop DataTransfer carrying a File, then dispatch dragover + drop.
      await page.evaluate(() => {
        const dt = new DataTransfer();
        dt.items.add(new File(['# Dropped Title\n\nDropped paragraph.'], 'dropped.md', { type: 'text/markdown' }));
        (window as any).__dt = dt;
        window.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
      });

      // Drop overlay should be visible during dragover
      await expect(page.locator('#dropOverlay')).toHaveClass(/active/);

      await page.evaluate(() => {
        window.dispatchEvent(new DragEvent('drop', { dataTransfer: (window as any).__dt, bubbles: true, cancelable: true }));
      });

      await expect(page.locator('#editor')).toHaveValue(/Dropped Title/);
      await expect(page.locator('#preview h1')).toHaveText('Dropped Title');
      // Overlay hidden again after drop
      await expect(page.locator('#dropOverlay')).not.toHaveClass(/active/);
    });

    test('should keep Reader Mode in sync with editor changes', async ({ page }) => {
      const editor = page.locator('#editor');
      await editor.fill('# First Version');
      await expect(page.locator('#preview h1')).toHaveText('First Version');

      // Open Reader Mode
      await page.locator('button[title="Reader mode"]').click();
      await expect(page.locator('#readerMode')).toHaveClass(/active/);
      await expect(page.locator('#readerBody h1')).toHaveText('First Version');

      // Change the editor content while Reader Mode is open
      await editor.fill('# Second Version');

      // Reader body should live-update to the new content
      await expect(page.locator('#readerBody h1')).toHaveText('Second Version');
    });

    test('Clear should empty the editor and unlink the file chip', async ({ page }) => {
      await page.setInputFiles('#fileInput', {
        name: 'notes.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('# Linked File'),
      });
      await expect(page.locator('#fileChip')).toBeVisible();

      await page.locator('button[title="Clear"]').click();

      await expect(page.locator('#editor')).toHaveValue('');
      await expect(page.locator('#fileChip')).toBeHidden();
    });
  });
});
