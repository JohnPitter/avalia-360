/**
 * Playwright Custom Fixtures
 *
 * Fixtures customizados para testes E2E do Avalia 360°
 */

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { cleanupTestData, waitForPageLoad } from '../utils/test-helpers';

/**
 * Tipos customizados
 */
type CustomFixtures = {
  managerPage: Page;
  memberPage: Page;
  cleanDatabase: void;
};

/**
 * Fixture: Página do Gestor (com cleanup automático)
 */
const managerPage = async ({ page }: { page: Page }, use: (page: Page) => Promise<void>) => {
  // Setup: navegar para página do gestor
  await page.goto('/');
  await waitForPageLoad(page);

  // Cleanup antes de usar
  await cleanupTestData(page);

  // Passar página para o teste
  await use(page);

  // Teardown: cleanup após teste
  await cleanupTestData(page);
};

/**
 * Fixture: Página do Colaborador (com cleanup automático)
 */
const memberPage = async ({ page }: { page: Page }, use: (page: Page) => Promise<void>) => {
  // Setup: navegar para página do colaborador
  await page.goto('/?role=member');
  await waitForPageLoad(page);

  // Cleanup antes de usar
  await cleanupTestData(page);

  // Passar página para o teste
  await use(page);

  // Teardown: cleanup após teste
  await cleanupTestData(page);
};

/**
 * Fixture: Cleanup do banco de dados
 */
const cleanDatabase = async ({ page }: { page: Page }, use: () => Promise<void>) => {
  // Setup: limpar antes
  await cleanupTestData(page);

  // Executar teste
  await use();

  // Teardown: limpar depois
  await cleanupTestData(page);
};

/**
 * Exportar test e expect customizados
 */
export const test = base.extend<CustomFixtures>({
  managerPage,
  memberPage,
  cleanDatabase,
});

export { expect };
