/**
 * E2E Tests - Manager Flow
 *
 * Testa fluxo completo do Gestor:
 * 1. Login
 * 2. Criar avaliação
 * 3. Adicionar membros
 * 4. Enviar convites
 * 5. Acompanhar progresso
 * 6. Ver resultados
 */

import { test, expect } from './fixtures';
import {
  TEST_DATA,
  fillManagerLogin,
  fillEvaluationForm,
  addMember,
  waitForSuccessToast,
  extractManagerToken,
  waitForLoadingToFinish,
  expectVisible,
  expectText,
} from './utils/test-helpers';

test.describe('Manager Flow - Complete Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full manager flow: login → create evaluation → add members → send invites', async ({
    page,
  }) => {
    // ============================================================
    // PASSO 1: Login do Gestor
    // ============================================================
    await test.step('Login as Manager', async () => {
      // Verificar que estamos na página de login
      await expect(page.locator('h1, h2')).toContainText(/gestor|manager/i);

      // Preencher formulário de login
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );

      // Submeter formulário
      await page.click('button[type="submit"]');

      // Aguardar navegação
      await waitForLoadingToFinish(page);

      // Verificar que login foi bem-sucedido (deve mostrar formulário de criação)
      await expect(
        page.locator('h1, h2').first()
      ).toContainText(/criar|nova|avaliação/i, { timeout: 15000 });
    });

    // ============================================================
    // PASSO 2: Criar Avaliação
    // ============================================================
    await test.step('Create Evaluation', async () => {
      // Preencher título da avaliação
      await fillEvaluationForm(page, TEST_DATA.evaluation.title);

      // Verificar que campo foi preenchido
      await expect(page.locator('input[placeholder*="título" i]')).toHaveValue(
        TEST_DATA.evaluation.title
      );
    });

    // ============================================================
    // PASSO 3: Adicionar Membros
    // ============================================================
    await test.step('Add Team Members', async () => {
      // Adicionar cada membro
      for (const member of TEST_DATA.members) {
        // Preencher nome
        const nameInput = page.locator('input[placeholder*="nome" i]').last();
        await nameInput.fill(member.name);

        // Preencher email
        const emailInput = page.locator('input[type="email"]').last();
        await emailInput.fill(member.email);

        // Clicar em "Adicionar Membro"
        const addButton = page.locator('button:has-text("Adicionar")').first();
        await addButton.click();

        // Aguardar membro aparecer na lista
        await expect(page.locator(`text=${member.name}`)).toBeVisible();

        // Aguardar um pouco entre adições
        await page.waitForTimeout(500);
      }

      // Verificar que todos os membros foram adicionados
      for (const member of TEST_DATA.members) {
        await expect(page.locator(`text=${member.name}`)).toBeVisible();
      }

      // Verificar contador de membros
      await expect(
        page.locator('text=/\\d+ membros?/i')
      ).toContainText(String(TEST_DATA.members.length));
    });

    // ============================================================
    // PASSO 4: Enviar Convites
    // ============================================================
    await test.step('Send Evaluation Invites', async () => {
      // Clicar em "Criar Avaliação" ou "Enviar Convites"
      const submitButton = page.locator(
        'button:has-text("Criar"), button:has-text("Enviar")'
      ).first();
      await submitButton.click();

      // Aguardar processamento (pode demorar por causa dos emails)
      await waitForLoadingToFinish(page);

      // Aguardar toast de sucesso ou navegação para página de sucesso
      await Promise.race([
        waitForSuccessToast(page).catch(() => null),
        page.waitForURL(/success|resultado|dashboard/i, { timeout: 30000 }).catch(() => null),
      ]);

      // Verificar que estamos na página de sucesso ou dashboard
      await expect(page.locator('h1, h2').first()).toContainText(
        /sucesso|criada|dashboard|acompanhamento/i,
        { timeout: 15000 }
      );
    });

    // ============================================================
    // PASSO 5: Verificar Dashboard de Acompanhamento
    // ============================================================
    await test.step('View Progress Dashboard', async () => {
      // Deve mostrar título da avaliação
      await expectText(page, 'body', TEST_DATA.evaluation.title);

      // Deve mostrar progresso (0% inicialmente)
      await expectVisible(page, 'text=/progresso|andamento/i');

      // Deve mostrar lista de membros
      for (const member of TEST_DATA.members) {
        await expectText(page, 'body', member.name);
      }

      // Deve mostrar indicador de "Pendente" para cada membro
      const pendingCount = await page
        .locator('text=/pendente|aguardando/i')
        .count();
      expect(pendingCount).toBeGreaterThanOrEqual(TEST_DATA.members.length);
    });

    // ============================================================
    // PASSO 6: Extrair Token do Gestor (para próximos testes)
    // ============================================================
    await test.step('Extract and Verify Manager Token', async () => {
      const token = await extractManagerToken(page);

      // Token deve existir
      expect(token).toBeTruthy();

      // Token deve ser UUID válido
      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );

      console.log('Manager Token:', token);
    });
  });

  test('should validate form fields before submission', async ({ page }) => {
    await test.step('Try to submit without email', async () => {
      // Apenas preencher nome
      await page.fill('input[placeholder*="nome" i]', TEST_DATA.manager.name);

      // Tentar submeter
      await page.click('button[type="submit"]');

      // Deve mostrar erro de validação
      await expect(page.locator('input[type="email"]')).toBeFocused({
        timeout: 5000,
      });
    });
  });

  test('should prevent duplicate members', async ({ page }) => {
    await test.step('Login as Manager', async () => {
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);
    });

    await test.step('Try to add duplicate member', async () => {
      const member = TEST_DATA.members[0];

      // Adicionar membro pela primeira vez
      await page.fill('input[placeholder*="nome" i]', member.name);
      await page.fill('input[type="email"]', member.email);
      await page.click('button:has-text("Adicionar")');

      // Aguardar membro aparecer
      await expect(page.locator(`text=${member.name}`)).toBeVisible();

      // Tentar adicionar novamente
      await page.fill('input[placeholder*="nome" i]', member.name);
      await page.fill('input[type="email"]', member.email);
      await page.click('button:has-text("Adicionar")');

      // Deve mostrar mensagem de erro (duplicado)
      await expect(
        page.locator('text=/duplicado|já existe|já adicionado/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test('should allow removing members before submission', async ({ page }) => {
    await test.step('Login as Manager', async () => {
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);
    });

    await test.step('Add and remove member', async () => {
      const member = TEST_DATA.members[0];

      // Adicionar membro
      await page.fill('input[placeholder*="nome" i]', member.name);
      await page.fill('input[type="email"]', member.email);
      await page.click('button:has-text("Adicionar")');

      // Aguardar membro aparecer
      await expect(page.locator(`text=${member.name}`)).toBeVisible();

      // Encontrar e clicar no botão de remover (X, Remover, Delete, etc)
      const removeButton = page
        .locator(`text=${member.name}`)
        .locator('..')
        .locator('button:has-text("Remover"), button:has-text("X")');
      await removeButton.first().click();

      // Membro deve desaparecer
      await expect(page.locator(`text=${member.name}`)).toBeHidden({
        timeout: 5000,
      });
    });
  });
});
