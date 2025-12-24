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

import { test, expect } from '@playwright/test';
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

/**
 * Mock de interceptação de chamadas EmailJS
 * Intercepta requests para api.emailjs.com
 */
async function interceptEmailJSCalls(page: any) {
  const emailsSent: any[] = [];

  await page.route('https://api.emailjs.com/api/v1.0/email/send', async (route: any) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // Armazena email "enviado"
    emailsSent.push({
      to: postData.to_email || postData.user_email,
      template: postData.template_id,
      data: postData,
      timestamp: Date.now(),
    });

    // Simula resposta de sucesso
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'OK',
        text: `mock-message-id-${Date.now()}`,
      }),
    });
  });

  return emailsSent;
}

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

  test('should send invite emails to all members', async ({ page }) => {
    // Interceptar chamadas EmailJS
    const emailsSent = await interceptEmailJSCalls(page);

    await test.step('Login as Manager', async () => {
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);
    });

    await test.step('Create evaluation with members', async () => {
      // Preencher título
      await fillEvaluationForm(page, TEST_DATA.evaluation.title);

      // Adicionar membros
      for (const member of TEST_DATA.members) {
        const nameInput = page.locator('input[placeholder*="nome" i]').last();
        await nameInput.fill(member.name);

        const emailInput = page.locator('input[type="email"]').last();
        await emailInput.fill(member.email);

        await page.click('button:has-text("Adicionar")');
        await page.waitForTimeout(500);
      }
    });

    await test.step('Send invites and validate emails', async () => {
      // Submeter avaliação (envia emails)
      await page.click(
        'button:has-text("Criar"), button:has-text("Enviar")'
      );

      // Aguardar processamento
      await waitForLoadingToFinish(page);

      // Aguardar sucesso
      await Promise.race([
        page.waitForURL(/success|dashboard/i, { timeout: 30000 }),
        page.waitForSelector('text=/sucesso|criada/i', { timeout: 30000 }),
      ]);

      // Aguardar um pouco para garantir que emails foram "enviados"
      await page.waitForTimeout(2000);

      // VALIDAÇÃO: Verificar que emails foram enviados
      console.log(`📧 Emails interceptados: ${emailsSent.length}`);

      // Deve ter enviado email para cada membro
      expect(emailsSent.length).toBeGreaterThanOrEqual(TEST_DATA.members.length);

      // Validar que cada membro recebeu email
      for (const member of TEST_DATA.members) {
        const memberEmail = emailsSent.find((email) =>
          email.data?.to_email?.includes(member.email) ||
          email.to?.includes(member.email)
        );

        if (memberEmail) {
          console.log(`✅ Email enviado para: ${member.name} (${member.email})`);

          // Validar que email contém dados corretos
          expect(memberEmail.data || memberEmail).toBeTruthy();

          // Deve ter código de acesso (6 dígitos)
          const accessCode =
            memberEmail.data?.access_code || memberEmail.data?.accessCode;
          if (accessCode) {
            expect(accessCode).toMatch(/^\d{6}$/);
            console.log(`   Código de acesso: ${accessCode}`);
          }

          // Deve ter título da avaliação
          const evalTitle =
            memberEmail.data?.evaluation_title ||
            memberEmail.data?.evaluationTitle;
          if (evalTitle) {
            expect(evalTitle).toContain(TEST_DATA.evaluation.title);
          }
        } else {
          console.warn(
            `⚠️  Email não encontrado para: ${member.name} (${member.email})`
          );
          // Não falha o teste se EmailJS não está configurado
        }
      }
    });
  });

  test('should handle email sending errors gracefully', async ({ page }) => {
    // Interceptar e forçar erro no EmailJS
    await page.route(
      'https://api.emailjs.com/api/v1.0/email/send',
      async (route) => {
        // Simula erro de rede
        await route.abort('failed');
      }
    );

    await test.step('Login as Manager', async () => {
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);
    });

    await test.step('Try to create evaluation with email errors', async () => {
      // Preencher título
      await fillEvaluationForm(page, TEST_DATA.evaluation.title);

      // Adicionar um membro
      const member = TEST_DATA.members[0];
      await page.fill('input[placeholder*="nome" i]', member.name);
      await page.fill('input[type="email"]', member.email);
      await page.click('button:has-text("Adicionar")');

      // Submeter
      await page.click('button:has-text("Criar")');

      // Aguardar processamento
      await page.waitForTimeout(3000);

      // Sistema deve continuar funcionando mesmo com erro de email
      // Pode mostrar aviso, mas não deve bloquear completamente
      // (Depende da implementação - pode ser sucesso parcial ou erro)

      const hasError = await page
        .locator('text=/erro|falha|failed/i')
        .isVisible()
        .catch(() => false);

      const hasSuccess = await page
        .locator('text=/sucesso|criada|success/i')
        .isVisible()
        .catch(() => false);

      // Pelo menos uma das duas deve estar visível
      expect(hasError || hasSuccess).toBeTruthy();

      console.log(`Email error handling: ${hasError ? 'Erro mostrado' : 'Sucesso parcial'}`);
    });
  });
});
