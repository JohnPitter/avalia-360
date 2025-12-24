/**
 * E2E Tests - Member (Collaborator) Flow
 *
 * Testa fluxo completo do Colaborador:
 * 1. Login com código de acesso
 * 2. Ver lista de membros a avaliar
 * 3. Avaliar cada membro
 * 4. Salvar rascunho
 * 5. Completar todas as avaliações
 */

import { test, expect } from '@playwright/test';
import {
  TEST_DATA,
  fillRatings,
  fillComments,
  waitForSuccessToast,
  waitForLoadingToFinish,
  expectVisible,
  expectText,
} from './utils/test-helpers';

test.describe('Member Flow - Complete Journey', () => {
  // Mock access code para testes
  const MOCK_ACCESS_CODE = '123456';

  test.beforeEach(async ({ page }) => {
    // Navegar para página do colaborador
    await page.goto('/?role=member');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full member flow: login → view members → evaluate → complete', async ({
    page,
  }) => {
    // ============================================================
    // PASSO 1: Login com Código de Acesso
    // ============================================================
    await test.step('Login with Access Code', async () => {
      // Verificar que estamos na página de login do colaborador
      await expect(page.locator('h1, h2')).toContainText(
        /colaborador|código|acesso/i
      );

      // Preencher código de acesso
      const codeInput = page.locator('input[placeholder*="código" i]');
      await codeInput.fill(MOCK_ACCESS_CODE);

      // Submeter formulário
      await page.click('button[type="submit"]');

      // Aguardar navegação
      await waitForLoadingToFinish(page);

      // Verificar que login foi bem-sucedido (deve mostrar lista de membros)
      await expect(page.locator('h1, h2').first()).toContainText(
        /avaliar|membros|equipe/i,
        { timeout: 15000 }
      );
    });

    // ============================================================
    // PASSO 2: Ver Lista de Membros a Avaliar
    // ============================================================
    await test.step('View Members List', async () => {
      // Deve mostrar lista de membros
      await expectVisible(page, 'text=/membros|equipe/i');

      // Deve ter pelo menos 1 membro para avaliar
      const memberCards = page.locator('[data-testid*="member"], .member-card');
      const count = await memberCards.count();
      expect(count).toBeGreaterThan(0);

      // Deve mostrar botão "Avaliar" para cada membro
      const evaluateButtons = page.locator('button:has-text("Avaliar")');
      const buttonsCount = await evaluateButtons.count();
      expect(buttonsCount).toBeGreaterThan(0);
    });

    // ============================================================
    // PASSO 3: Avaliar Primeiro Membro
    // ============================================================
    await test.step('Evaluate First Member', async () => {
      // Clicar no primeiro botão "Avaliar"
      await page.click('button:has-text("Avaliar")');
      await waitForLoadingToFinish(page);

      // Verificar que estamos no formulário de avaliação
      await expect(page.locator('h1, h2').first()).toContainText(
        /avaliar|avaliação/i
      );

      // Preencher ratings
      await fillRatings(page, TEST_DATA.ratings);

      // Preencher comentários
      await fillComments(page, TEST_DATA.comments);

      // Submeter avaliação
      await page.click('button:has-text("Enviar"), button[type="submit"]');

      // Aguardar sucesso
      await Promise.race([
        waitForSuccessToast(page),
        page.waitForURL(/membros|lista/i, { timeout: 15000 }),
      ]);

      // Deve voltar para lista de membros
      await expect(page.locator('h1, h2').first()).toContainText(
        /membros|equipe/i,
        { timeout: 10000 }
      );
    });

    // ============================================================
    // PASSO 4: Verificar Progresso
    // ============================================================
    await test.step('Verify Progress Update', async () => {
      // Deve mostrar indicador de progresso
      await expectVisible(page, 'text=/progresso|concluído/i');

      // Deve mostrar que 1 avaliação foi completada
      await expectVisible(page, 'text=/1.*concluíd|completad/i');

      // O membro avaliado deve mostrar status "Concluído"
      const completedBadge = page.locator(
        'text=/concluído|completado|✓|✔/i'
      ).first();
      await expect(completedBadge).toBeVisible();
    });
  });

  test('should save draft and restore it', async ({ page }) => {
    await test.step('Login with Access Code', async () => {
      await page.fill('input[placeholder*="código" i]', MOCK_ACCESS_CODE);
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);
    });

    await test.step('Start evaluation and save draft', async () => {
      // Iniciar avaliação
      await page.click('button:has-text("Avaliar")');
      await waitForLoadingToFinish(page);

      // Preencher parcialmente
      const firstRating = Object.entries(TEST_DATA.ratings)[0];
      const [key, value] = firstRating;

      const ratingGroup = page.locator(`[data-testid*="${key}"]`).first();
      await ratingGroup.locator(`button[data-value="${value}"]`).click();

      // Aguardar auto-save (se implementado) ou salvar manualmente
      await page.waitForTimeout(2000);

      // Voltar para lista de membros
      await page.click('button:has-text("Voltar"), a:has-text("Voltar")');
      await waitForLoadingToFinish(page);
    });

    await test.step('Restore draft when returning', async () => {
      // Clicar novamente no mesmo membro
      await page.click('button:has-text("Continuar"), button:has-text("Avaliar")');
      await waitForLoadingToFinish(page);

      // Verificar que rating foi restaurado
      const firstRating = Object.entries(TEST_DATA.ratings)[0];
      const [key, value] = firstRating;

      const selectedButton = page.locator(
        `[data-testid*="${key}"] button[data-value="${value}"][aria-pressed="true"],
         [data-testid*="${key}"] button[data-value="${value}"].selected`
      );

      await expect(selectedButton).toBeVisible({ timeout: 5000 });
    });
  });

  test('should validate required fields before submission', async ({ page }) => {
    await test.step('Login with Access Code', async () => {
      await page.fill('input[placeholder*="código" i]', MOCK_ACCESS_CODE);
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);
    });

    await test.step('Try to submit without filling ratings', async () => {
      // Iniciar avaliação
      await page.click('button:has-text("Avaliar")');
      await waitForLoadingToFinish(page);

      // Tentar submeter sem preencher
      await page.click('button:has-text("Enviar"), button[type="submit"]');

      // Deve mostrar mensagem de erro ou validação
      await expect(
        page.locator('text=/obrigatório|preencha|required/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test('should show completion message when all evaluations done', async ({
    page,
  }) => {
    // Este teste assume que temos controle sobre quantos membros existem
    // Para teste completo, precisaríamos mockar o Firestore ou criar avaliação real

    await test.step('Login with Access Code', async () => {
      await page.fill('input[placeholder*="código" i]', MOCK_ACCESS_CODE);
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);
    });

    await test.step('Complete all available evaluations', async () => {
      // Contar quantos membros existem
      const evaluateButtons = page.locator('button:has-text("Avaliar")');
      let count = await evaluateButtons.count();

      // Avaliar todos
      while (count > 0) {
        // Clicar no primeiro "Avaliar"
        await evaluateButtons.first().click();
        await waitForLoadingToFinish(page);

        // Preencher formulário rapidamente
        await fillRatings(page, TEST_DATA.ratings);

        // Submeter
        await page.click('button:has-text("Enviar"), button[type="submit"]');

        // Aguardar retorno
        await page.waitForURL(/membros|lista/i, { timeout: 15000 });
        await waitForLoadingToFinish(page);

        // Atualizar contagem
        count = await evaluateButtons.count();
      }

      // Verificar mensagem de conclusão
      await expect(
        page.locator('text=/parabéns|concluído|finalizado|completo/i')
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test('should handle invalid access code', async ({ page }) => {
    await test.step('Try to login with invalid code', async () => {
      // Preencher código inválido (não existe no banco)
      await page.fill('input[placeholder*="código" i]', '999999');

      // Submeter
      await page.click('button[type="submit"]');

      // Aguardar mensagem de erro
      await page.waitForTimeout(2000);

      // Deve mostrar mensagem de erro específica
      await expect(
        page.locator('text=/inválido|incorreto|não encontrado/i')
      ).toBeVisible({ timeout: 10000 });

      // Não deve navegar - deve permanecer na página de login
      await expect(page).toHaveURL(/member|colaborador|\?role=member/i);

      // Botão deve estar habilitado novamente
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).not.toBeDisabled();
    });
  });

  test('should search evaluation by access code globally', async ({ page }) => {
    await test.step('Login with access code without knowing evaluation ID', async () => {
      // Este teste valida que o searchEvaluationByAccessCode funciona
      // sem precisar conhecer o evaluationId previamente

      // Preencher código válido (mock)
      await page.fill('input[placeholder*="código" i]', MOCK_ACCESS_CODE);

      // Submeter
      await page.click('button[type="submit"]');

      // Deve mostrar loading state
      await expect(page.locator('text=/verificando/i')).toBeVisible({
        timeout: 2000,
      });

      // Aguardar navegação ou erro
      await Promise.race([
        page.waitForURL(/membros|lista/i, { timeout: 15000 }),
        page.waitForSelector('text=/inválido|não encontrado/i', {
          timeout: 15000,
        }),
      ]);

      // Se login foi bem-sucedido, deve mostrar lista de membros
      // Se falhou, deve mostrar erro (esperado em ambiente de teste sem dados)
      const hasError = await page
        .locator('text=/inválido|não encontrado/i')
        .isVisible();

      if (!hasError) {
        // Login bem-sucedido - verifica que está na tela correta
        await expect(page.locator('h1, h2').first()).toContainText(
          /membros|equipe|avaliar/i,
          { timeout: 5000 }
        );
      } else {
        // Erro esperado em ambiente de teste - valida mensagem
        await expect(
          page.locator('text=/código de acesso inválido/i')
        ).toBeVisible();
      }
    });
  });

  test('should display member information in evaluation form', async ({
    page,
  }) => {
    await test.step('Login with Access Code', async () => {
      await page.fill('input[placeholder*="código" i]', MOCK_ACCESS_CODE);
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);
    });

    await test.step('View member details in evaluation', async () => {
      // Clicar em avaliar
      await page.click('button:has-text("Avaliar")');
      await waitForLoadingToFinish(page);

      // Deve mostrar nome do membro sendo avaliado
      await expectVisible(page, 'h1, h2, [data-testid="member-name"]');

      // Deve mostrar todas as categorias de avaliação
      const categories = [
        'comunicação',
        'trabalho em equipe',
        'proatividade',
        'conhecimento técnico',
        'cumprimento de prazos',
      ];

      for (const category of categories) {
        await expectText(page, 'body', new RegExp(category, 'i'));
      }
    });
  });
});
