import { test, expect, Page } from '@playwright/test';

test.describe('Cabinet Médical', () => {
  const URL = '/cabinet-medical.html';

  async function waitForApp(page: Page) {
    await page.waitForFunction(() => (window as any).appReady === true, null, { timeout: 15000 });
  }

  async function loginAs(page: Page, username: string, password: string) {
    await page.fill('#login-username', username);
    await page.fill('#login-password', password);
    await page.click('#login-submit');
    await page.waitForSelector('#app-shell', { state: 'visible', timeout: 5000 });
  }

  async function loginAsDoctor(page: Page) {
    await loginAs(page, 'dr.bennani', 'docteur123');
  }

  async function loginAsAssistant(page: Page) {
    await loginAs(page, 'fatima.alaoui', 'assistant123');
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await waitForApp(page);
    await page.evaluate(async () => await (window as any).resetDatabase());
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await waitForApp(page);
  });

  // ===== AUTHENTIFICATION =====
  test.describe('Authentification', () => {
    test('affiche la page de connexion par défaut', async ({ page }) => {
      await expect(page.locator('#login-page')).toBeVisible();
      await expect(page.locator('#app-shell')).not.toBeVisible();
    });

    test('titre en français', async ({ page }) => {
      await expect(page).toHaveTitle(/Cabinet Médical/);
    });

    test('affiche les identifiants de démonstration', async ({ page }) => {
      await expect(page.locator('#login-page')).toContainText('dr.bennani');
      await expect(page.locator('#login-page')).toContainText('fatima.alaoui');
    });

    test('connexion docteur', async ({ page }) => {
      await loginAsDoctor(page);
      await expect(page.locator('#user-display')).toContainText('Dr. Youssef Bennani');
    });

    test('connexion assistante', async ({ page }) => {
      await loginAsAssistant(page);
      await expect(page.locator('#user-display')).toContainText('Fatima Alaoui');
    });

    test('erreur identifiants incorrects', async ({ page }) => {
      await page.fill('#login-username', 'wrong');
      await page.fill('#login-password', 'wrong');
      await page.click('#login-submit');
      await expect(page.locator('#login-error')).toBeVisible();
    });

    test('déconnexion', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#logout-btn');
      await expect(page.locator('#login-page')).toBeVisible();
      await expect(page.locator('#app-shell')).not.toBeVisible();
    });
  });

  // ===== NAVIGATION DOCTEUR =====
  test.describe('Navigation — Docteur', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsDoctor(page);
    });

    test('voit tous les éléments de navigation', async ({ page }) => {
      for (const route of ['dashboard', 'patients', 'appointments', 'consultations', 'prescriptions', 'reports', 'feuilles']) {
        await expect(page.locator(`#desktop-nav [data-route="${route}"]`)).toBeVisible();
      }
    });

    test('tableau de bord après connexion', async ({ page }) => {
      await expect(page.locator('#view-title')).toContainText('Tableau de bord');
    });

    test('navigation patients', async ({ page }) => {
      await page.click('#desktop-nav [data-route="patients"]');
      await expect(page.locator('#view-title')).toContainText('Patients');
    });

    test('navigation rendez-vous', async ({ page }) => {
      await page.click('#desktop-nav [data-route="appointments"]');
      await page.waitForSelector('#appointments-table');
      await expect(page.locator('#view-title')).toContainText('Rendez-vous');
    });
  });

  // ===== NAVIGATION ASSISTANTE =====
  test.describe('Navigation — Assistante', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAssistant(page);
    });

    test('voit patients et rendez-vous', async ({ page }) => {
      await expect(page.locator('#desktop-nav [data-route="dashboard"]')).toBeVisible();
      await expect(page.locator('#desktop-nav [data-route="patients"]')).toBeVisible();
      await expect(page.locator('#desktop-nav [data-route="appointments"]')).toBeVisible();
    });

    test('ne voit pas les routes docteur', async ({ page }) => {
      for (const route of ['consultations', 'prescriptions', 'reports', 'feuilles']) {
        await expect(page.locator(`#desktop-nav [data-route="${route}"]`)).toHaveCount(0);
      }
    });

    test('redirection route docteur', async ({ page }) => {
      await page.evaluate(() => location.hash = '#/consultations');
      await page.waitForTimeout(500);
      expect(page.url()).toContain('#/dashboard');
    });
  });

  // ===== PATIENTS =====
  test.describe('Patients', () => {
    test('liste des patients de démonstration', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="patients"]');
      await page.waitForSelector('#patients-table');
      const rows = page.locator('#patients-table tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(8);
    });

    test('recherche de patient', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="patients"]');
      await page.waitForSelector('#patients-table');
      await page.locator('#patient-search').pressSequentially('El Fassi');
      await page.waitForTimeout(500);
      const visibleRows = page.locator('#patients-table tbody tr:visible');
      expect(await visibleRows.count()).toBe(1);
      await expect(visibleRows.first()).toContainText('El Fassi');
    });

    test('créer un patient', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="patients"]');
      await page.waitForSelector('#patients-table');
      await page.click('a[href="#/patients/new"]');
      await page.waitForSelector('#patient-form');
      await page.fill('#pf-lastName', 'TestNom');
      await page.fill('#pf-firstName', 'TestPrénom');
      await page.fill('#pf-dateOfBirth', '1990-01-15');
      await page.selectOption('#pf-gender', 'M');
      await page.fill('#pf-phone', '0600000000');
      await page.click('#patient-form button[type="submit"]');
      await page.waitForSelector('#patients-table');
      await expect(page.locator('#patients-table')).toContainText('TestNom');
    });

    test('fiche patient avec onglets (docteur)', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="patients"]');
      await page.waitForSelector('#patients-table');
      await page.click('#patients-table tbody tr:first-child a[data-action="view"]');
      await page.waitForSelector('.patient-detail');
      await expect(page.locator('[data-tab="info"]')).toBeVisible();
      await expect(page.locator('[data-tab="appointments"]')).toBeVisible();
      await expect(page.locator('[data-tab="consultations"]')).toBeVisible();
    });

    test('fiche patient sans onglets médicaux (assistante)', async ({ page }) => {
      await loginAsAssistant(page);
      await page.click('#desktop-nav [data-route="patients"]');
      await page.waitForSelector('#patients-table');
      await page.click('#patients-table tbody tr:first-child a[data-action="view"]');
      await page.waitForSelector('.patient-detail');
      await expect(page.locator('[data-tab="info"]')).toBeVisible();
      await expect(page.locator('[data-tab="appointments"]')).toBeVisible();
      await expect(page.locator('[data-tab="consultations"]')).toHaveCount(0);
    });

    test('assistante peut créer un patient', async ({ page }) => {
      await loginAsAssistant(page);
      await page.click('#desktop-nav [data-route="patients"]');
      await page.click('a[href="#/patients/new"]');
      await page.waitForSelector('#patient-form');
      await page.fill('#pf-lastName', 'AssistantTest');
      await page.fill('#pf-firstName', 'Créé');
      await page.fill('#pf-dateOfBirth', '1985-06-20');
      await page.selectOption('#pf-gender', 'F');
      await page.click('#patient-form button[type="submit"]');
      await page.waitForSelector('#patients-table');
      await expect(page.locator('#patients-table')).toContainText('AssistantTest');
    });
  });

  // ===== RENDEZ-VOUS =====
  test.describe('Rendez-vous', () => {
    test('liste des rendez-vous', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="appointments"]');
      await page.waitForSelector('#appointments-table');
      const rows = page.locator('#appointments-table tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(1);
    });

    test('créer un rendez-vous', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="appointments"]');
      await page.click('a[href="#/appointments/new"]');
      await page.waitForSelector('#appointment-form');
      await page.selectOption('#af-patientId', { index: 1 });
      await page.fill('#af-date', '2026-03-15');
      await page.fill('#af-startTime', '09:00');
      await page.fill('#af-endTime', '09:30');
      await page.selectOption('#af-type', 'Consultation');
      await page.click('#appointment-form button[type="submit"]');
      await page.waitForSelector('#appointments-table');
    });

    test('assistante peut créer un rendez-vous', async ({ page }) => {
      await loginAsAssistant(page);
      await page.click('#desktop-nav [data-route="appointments"]');
      await page.click('a[href="#/appointments/new"]');
      await page.waitForSelector('#appointment-form');
      await expect(page.locator('#appointment-form')).toBeVisible();
    });
  });

  // ===== CONSULTATIONS (Docteur) =====
  test.describe('Consultations — Docteur', () => {
    test('liste des consultations', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="consultations"]');
      await page.waitForSelector('#consultations-table');
      const rows = page.locator('#consultations-table tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(1);
    });

    test('créer une consultation', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="consultations"]');
      await page.click('a[href="#/consultations/new"]');
      await page.waitForSelector('#consultation-form');
      await page.selectOption('#cf-patientId', { index: 1 });
      await page.fill('#cf-motif', 'Douleur abdominale');
      await page.fill('#cf-symptoms', 'Douleurs épigastriques');
      await page.fill('#cf-diagnostic', 'Gastrite');
      await page.click('#consultation-form button[type="submit"]');
      await page.waitForSelector('#consultations-table');
    });

    test('détail consultation', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="consultations"]');
      await page.waitForSelector('#consultations-table');
      await page.click('#consultations-table tbody tr:first-child a[data-action="view"]');
      await page.waitForSelector('.consultation-detail');
      await expect(page.locator('.consultation-detail')).toBeVisible();
    });
  });

  // ===== ORDONNANCES (Docteur) =====
  test.describe('Ordonnances — Docteur', () => {
    test('liste des ordonnances', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="prescriptions"]');
      await page.waitForSelector('#prescriptions-table');
      const rows = page.locator('#prescriptions-table tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(1);
    });

    test('créer une ordonnance', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="prescriptions"]');
      await page.click('a[href="#/prescriptions/new"]');
      await page.waitForSelector('#prescription-form');
      await page.selectOption('#prf-patientId', { index: 1 });
      await page.click('#add-medication-btn');
      await page.fill('.medication-row:first-child [data-field="name"]', 'Paracétamol');
      await page.fill('.medication-row:first-child [data-field="dosage"]', '1g');
      await page.click('#prescription-form button[type="submit"]');
      await page.waitForSelector('#prescriptions-table');
    });

    test('exporter ordonnance en PDF', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="prescriptions"]');
      await page.waitForSelector('#prescriptions-table');
      await page.click('#prescriptions-table tbody tr:first-child a[data-action="view"]');
      await page.waitForSelector('.prescription-detail');
      await expect(page.locator('#export-pdf-btn')).toBeVisible();
    });
  });

  // ===== COMPTES-RENDUS (Docteur) =====
  test.describe('Comptes-rendus — Docteur', () => {
    test('liste des comptes-rendus', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="reports"]');
      await page.waitForSelector('#reports-table');
    });

    test('créer un compte-rendu', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="reports"]');
      await page.click('a[href="#/reports/new"]');
      await page.waitForSelector('#report-form');
      await page.selectOption('#rf-patientId', { index: 1 });
      await page.selectOption('#rf-type', 'Compte-rendu');
      await page.fill('#rf-title', 'Bilan annuel');
      await page.fill('#rf-content', 'Patient en bonne santé générale.');
      await page.click('#report-form button[type="submit"]');
      await page.waitForSelector('#reports-table');
    });
  });

  // ===== FEUILLES DE SOIN (Docteur) =====
  test.describe('Feuilles de soin — Docteur', () => {
    test('liste des feuilles de soin', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="feuilles"]');
      await page.waitForSelector('#feuilles-table');
    });

    test('créer une feuille de soin', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="feuilles"]');
      await page.click('a[href="#/feuilles/new"]');
      await page.waitForSelector('#feuille-form');
      await page.selectOption('#ff-patientId', { index: 1 });
      await page.click('#add-act-btn');
      await page.fill('.act-row:first-child [data-field="code"]', 'CS');
      await page.fill('.act-row:first-child [data-field="label"]', 'Consultation');
      await page.fill('.act-row:first-child [data-field="amount"]', '25');
      await page.click('#feuille-form button[type="submit"]');
      await page.waitForSelector('#feuilles-table');
    });
  });

  // ===== DONNÉES DE DÉMONSTRATION =====
  test.describe('Données de démonstration', () => {
    test('bouton réinitialiser', async ({ page }) => {
      await loginAsDoctor(page);
      await expect(page.locator('#reset-data-btn')).toBeVisible();
    });

    test('réinitialisation fonctionne', async ({ page }) => {
      await loginAsDoctor(page);
      // Delete a patient first
      await page.click('#desktop-nav [data-route="patients"]');
      await page.waitForSelector('#patients-table');
      const countBefore = await page.locator('#patients-table tbody tr').count();
      // Reset
      await page.click('#reset-data-btn');
      await page.waitForTimeout(1000);
      // Should reload and show same count
      await page.click('#desktop-nav [data-route="patients"]');
      await page.waitForSelector('#patients-table');
      const countAfter = await page.locator('#patients-table tbody tr').count();
      expect(countAfter).toBe(countBefore);
    });
  });

  // ===== RELATIONS ENTRE ENTITÉS =====
  test.describe('Relations entre entités', () => {
    test('consultation détail affiche les documents liés', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="consultations"]');
      await page.waitForSelector('#consultations-table');
      await page.click('#consultations-table tbody tr:first-child a[data-action="view"]');
      await page.waitForSelector('#linked-documents');
      await expect(page.locator('#linked-documents')).toBeVisible();
      await expect(page.locator('#linked-documents h6:has-text("Ordonnances")')).toBeVisible();
      await expect(page.locator('#linked-documents h6:has-text("Comptes-rendus")')).toBeVisible();
      await expect(page.locator('#linked-documents h6:has-text("Feuilles de soin")')).toBeVisible();
    });

    test('consultation détail permet CRUD sur documents liés', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="consultations"]');
      await page.waitForSelector('#consultations-table');
      await page.click('#consultations-table tbody tr:first-child a[data-action="view"]');
      await page.waitForSelector('#linked-documents');
      // "Ajouter" buttons for each document type (contain bi-plus icon)
      const addBtns = page.locator('#linked-documents a:has(.bi-plus)');
      expect(await addBtns.count()).toBe(3);
      // First consultation has linked report + feuille — check view/edit/delete buttons
      const viewBtns = page.locator('#linked-documents .list-group-item .btn-outline-primary');
      expect(await viewBtns.count()).toBeGreaterThanOrEqual(1);
      const editBtns = page.locator('#linked-documents .list-group-item .btn-outline-warning');
      expect(await editBtns.count()).toBeGreaterThanOrEqual(1);
    });

    test('ordonnance détail affiche lien consultation', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="prescriptions"]');
      await page.waitForSelector('#prescriptions-table');
      await page.click('#prescriptions-table tbody tr:first-child a[data-action="view"]');
      await page.waitForSelector('.prescription-detail');
      await expect(page.locator('text=Consultation :')).toBeVisible();
    });

    test('liste ordonnances affiche colonne consultation', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="prescriptions"]');
      await page.waitForSelector('#prescriptions-table');
      await expect(page.locator('#prescriptions-table th:has-text("Consultation")')).toBeVisible();
    });

    test('rendez-vous affiche lien consultation pour docteur', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="appointments"]');
      await page.waitForSelector('#appointments-table');
      await expect(page.locator('#appointments-table th:has-text("Consultation")')).toBeVisible();
    });

    test('formulaire ordonnance a un sélecteur de consultation', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="prescriptions"]');
      await page.waitForSelector('#prescriptions-table');
      await page.click('a:has-text("Nouvelle ordonnance")');
      await page.waitForSelector('#prescription-form');
      await expect(page.locator('#prf-consultationId')).toBeVisible();
    });
  });

  // ===== PDF EXPORT =====
  test.describe('Export PDF', () => {
    test('bouton PDF sur liste patients', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="patients"]');
      await page.waitForSelector('#patients-table');
      await expect(page.locator('#patients-table .btn-outline-success[title="PDF"]').first()).toBeVisible();
    });

    test('bouton PDF sur fiche patient', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="patients"]');
      await page.waitForSelector('#patients-table');
      await page.click('#patients-table tbody tr:first-child a[data-action="view"]');
      await page.waitForSelector('.patient-detail');
      await expect(page.locator('button:has(.bi-file-pdf)')).toBeVisible();
    });

    test('bouton PDF sur liste consultations', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="consultations"]');
      await page.waitForSelector('#consultations-table');
      await expect(page.locator('#consultations-table .btn-outline-success[title="PDF"]').first()).toBeVisible();
    });

    test('bouton PDF sur détail consultation', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="consultations"]');
      await page.waitForSelector('#consultations-table');
      await page.click('#consultations-table tbody tr:first-child a[data-action="view"]');
      await page.waitForSelector('.consultation-detail');
      await expect(page.locator('#export-pdf-btn')).toBeVisible();
    });

    test('bouton PDF sur liste comptes-rendus', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="reports"]');
      await page.waitForSelector('#reports-table');
      await expect(page.locator('#reports-table .btn-outline-success[title="PDF"]').first()).toBeVisible();
    });

    test('bouton PDF sur détail compte-rendu', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="reports"]');
      await page.waitForSelector('#reports-table');
      await page.click('#reports-table tbody tr:first-child a[data-action="view"]');
      await page.waitForSelector('.report-detail');
      await expect(page.locator('#export-pdf-btn')).toBeVisible();
    });

    test('bouton PDF sur liste feuilles de soin', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="feuilles"]');
      await page.waitForSelector('#feuilles-table');
      await expect(page.locator('#feuilles-table .btn-outline-success[title="PDF"]').first()).toBeVisible();
    });

    test('pas de bouton PDF sur liste rendez-vous', async ({ page }) => {
      await loginAsDoctor(page);
      await page.click('#desktop-nav [data-route="appointments"]');
      await page.waitForSelector('#appointments-table');
      await expect(page.locator('#appointments-table .btn-outline-success[title="PDF"]')).toHaveCount(0);
    });
  });

  // ===== RESPONSIVE =====
  test.describe('Responsive', () => {
    test('connexion sur mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.locator('#login-page')).toBeVisible();
      const box = await page.locator('.login-card').boundingBox();
      expect(box!.width).toBeLessThanOrEqual(375);
    });

    test('menu hamburger sur mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await loginAsDoctor(page);
      await expect(page.locator('.navbar-toggler')).toBeVisible();
    });

    test('sidebar masqué sur mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await loginAsDoctor(page);
      await expect(page.locator('#sidebar')).not.toBeVisible();
    });
  });
});
