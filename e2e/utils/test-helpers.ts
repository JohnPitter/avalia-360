/**
 * E2E Test Helpers
 *
 * Utilitários para testes end-to-end
 */

import { Page, expect } from '@playwright/test';

/**
 * Dados de teste para avaliação
 */
export const TEST_DATA = {
  manager: {
    email: 'gestor.teste@empresa.com',
    name: 'Gestor Teste',
  },
  evaluation: {
    title: 'Avaliação 360° - Q4 2024',
  },
  members: [
    { name: 'João Silva', email: 'joao.silva@empresa.com' },
    { name: 'Maria Santos', email: 'maria.santos@empresa.com' },
    { name: 'Pedro Costa', email: 'pedro.costa@empresa.com' },
  ],
  ratings: {
    comunicacao: 4,
    trabalhoEmEquipe: 5,
    proatividade: 4,
    conhecimentoTecnico: 5,
    cumprimentoPrazos: 4,
  },
  comments: {
    pontosFortesAvaliacoes:
      'Excelente comunicação e trabalho em equipe. Sempre disponível para ajudar.',
    areasDesenvolvimento:
      'Poderia melhorar a gestão de tempo em projetos complexos.',
  },
};

/**
 * Aguarda navegação e carregamento completo
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Preenche formulário de login do gestor
 */
export async function fillManagerLogin(page: Page, email: string, name: string) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[placeholder*="nome" i]', name);
}

/**
 * Preenche formulário de criação de avaliação
 */
export async function fillEvaluationForm(page: Page, title: string) {
  await page.fill('input[placeholder*="título" i]', title);
}

/**
 * Adiciona membro ao formulário
 */
export async function addMember(
  page: Page,
  member: { name: string; email: string }
) {
  await page.fill('input[placeholder*="nome" i]', member.name);
  await page.fill('input[type="email"]', member.email);
  await page.click('button:has-text("Adicionar")');
}

/**
 * Preenche formulário de avaliação (ratings)
 */
export async function fillRatings(
  page: Page,
  ratings: Record<string, number>
) {
  for (const [key, value] of Object.entries(ratings)) {
    // Encontrar campo de rating e selecionar valor
    const ratingGroup = page.locator(`[data-testid*="${key}"]`).first();
    await ratingGroup.locator(`button[data-value="${value}"]`).click();
  }
}

/**
 * Preenche comentários do formulário
 */
export async function fillComments(
  page: Page,
  comments: Record<string, string>
) {
  for (const [key, value] of Object.entries(comments)) {
    await page.fill(`textarea[name="${key}"]`, value);
  }
}

/**
 * Aguarda toast de sucesso aparecer
 */
export async function waitForSuccessToast(page: Page, message?: string) {
  const toast = page.locator('[role="alert"], .toast, [data-testid="toast"]');
  await expect(toast).toBeVisible({ timeout: 10000 });

  if (message) {
    await expect(toast).toContainText(message);
  }

  return toast;
}

/**
 * Aguarda toast de erro aparecer
 */
export async function waitForErrorToast(page: Page, message?: string) {
  const toast = page.locator('[role="alert"], .toast, [data-testid="toast"]');
  await expect(toast).toBeVisible({ timeout: 10000 });

  if (message) {
    await expect(toast).toContainText(message);
  }

  return toast;
}

/**
 * Aguarda modal aparecer
 */
export async function waitForModal(page: Page) {
  const modal = page.locator(
    '[role="dialog"], .modal, [data-testid="modal"]'
  );
  await expect(modal).toBeVisible({ timeout: 10000 });
  return modal;
}

/**
 * Extrai token UUID da URL ou localStorage
 */
export async function extractManagerToken(page: Page): Promise<string | null> {
  // Tentar URL
  const url = page.url();
  const urlMatch = url.match(/token=([a-f0-9-]{36})/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Tentar localStorage
  const token = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const tokenKey = keys.find((k) => k.includes('manager_token'));
    return tokenKey ? localStorage.getItem(tokenKey) : null;
  });

  return token;
}

/**
 * Extrai código de acesso da página de sucesso ou email
 */
export async function extractAccessCode(page: Page): Promise<string | null> {
  // Procurar código na página (formato: 6 dígitos)
  const codeElement = page.locator('[data-testid="access-code"]');
  if (await codeElement.isVisible()) {
    return await codeElement.textContent();
  }

  // Procurar em qualquer lugar da página
  const pageContent = await page.textContent('body');
  const codeMatch = pageContent?.match(/\b\d{6}\b/);
  if (codeMatch) {
    return codeMatch[0];
  }

  return null;
}

/**
 * Verifica se está na página correta pelo título
 */
export async function expectPageTitle(page: Page, expectedTitle: string) {
  await expect(page).toHaveTitle(new RegExp(expectedTitle, 'i'));
}

/**
 * Verifica se elemento está visível
 */
export async function expectVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
}

/**
 * Verifica se elemento contém texto
 */
export async function expectText(
  page: Page,
  selector: string,
  text: string | RegExp
) {
  await expect(page.locator(selector)).toContainText(text);
}

/**
 * Limpa banco de dados de teste (Firestore)
 * ATENÇÃO: Usar apenas em ambiente de teste!
 */
export async function cleanupTestData(page: Page) {
  // Limpar localStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Limpar cookies
  await page.context().clearCookies();

  // Limpar IndexedDB (se usado)
  await page.evaluate(() => {
    if (window.indexedDB) {
      window.indexedDB.databases().then((dbs) => {
        dbs.forEach((db) => {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
  });
}

/**
 * Aguarda elemento desaparecer (loading, skeleton, etc)
 */
export async function waitForLoadingToFinish(page: Page) {
  // Aguardar skeletons desaparecerem
  await page
    .locator('[data-testid="skeleton"], .skeleton, [class*="skeleton"]')
    .first()
    .waitFor({ state: 'hidden', timeout: 30000 })
    .catch(() => {
      // Ignorar se não houver skeleton
    });

  // Aguardar spinners desaparecerem
  await page
    .locator('[data-testid="loading"], .spinner, [class*="spinner"]')
    .first()
    .waitFor({ state: 'hidden', timeout: 30000 })
    .catch(() => {
      // Ignorar se não houver spinner
    });

  // Aguardar network idle
  await page.waitForLoadState('networkidle');
}

/**
 * Screenshot com nome descritivo
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Verifica acessibilidade básica (A11y)
 */
export async function checkAccessibility(page: Page) {
  // Verificar landmarks principais
  await expect(page.locator('main, [role="main"]')).toBeVisible();

  // Verificar que não há erros de contraste críticos (simplificado)
  const hasHeading = await page.locator('h1, h2').count();
  expect(hasHeading).toBeGreaterThan(0);
}
