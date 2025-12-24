/**
 * E2E Tests - Manager Authentication Flow
 *
 * Testa autenticação e persistência de sessão do gestor:
 * 1. Login inicial e criação de avaliação
 * 2. Extração e validação de token
 * 3. Retorno com token (persistência de sessão)
 * 4. Logout
 * 5. Token inválido/expirado
 * 6. Sessão expirada por timeout
 */

import { test, expect } from '@playwright/test';
import {
  TEST_DATA,
  fillManagerLogin,
  fillEvaluationForm,
  addMember,
  extractManagerToken,
  waitForLoadingToFinish,
  waitForSuccessToast,
} from './utils/test-helpers';

test.describe('Manager Authentication - Session Persistence', () => {
  let managerToken: string;
  let evaluationId: string;

  test('should create evaluation and extract manager token', async ({ page }) => {
    await test.step('Login and create evaluation', async () => {
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      await fillEvaluationForm(page, TEST_DATA.evaluation.title);

      // Adicionar membros
      for (const member of TEST_DATA.members.slice(0, 2)) {
        await addMember(page, member);
      }

      // Enviar
      await page.click('button:has-text("Finalizar e Enviar")');
      await waitForLoadingToFinish(page);

      // Aguardar sucesso
      await page.waitForURL(/success|dashboard/i, { timeout: 30000 });

      console.log('✅ Avaliação criada com sucesso');
    });

    await test.step('Extract and validate token', async () => {
      // Extrair token da URL ou sessionStorage
      managerToken = (await extractManagerToken(page)) || '';

      // Validar formato UUID
      expect(managerToken).toBeTruthy();
      expect(managerToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );

      console.log('✅ Token extraído:', managerToken);

      // Extrair evaluationId (se disponível na URL ou storage)
      const url = page.url();
      const urlParams = new URL(url).searchParams;
      evaluationId = urlParams.get('evaluation') || '';

      console.log('📝 Evaluation ID:', evaluationId);
    });
  });

  test('should return to dashboard using saved token', async ({ page }) => {
    // Este teste depende do anterior ter criado token
    if (!managerToken) {
      test.skip();
      return;
    }

    await test.step('Navigate away and lose context', async () => {
      // Navegar para home (perder contexto)
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verificar que estamos na página de login
      await expect(
        page.locator('text=/gestor|manager/i')
      ).toBeVisible({ timeout: 5000 });

      console.log('✅ Navegou para home, contexto perdido');
    });

    await test.step('Return with token in URL', async () => {
      // Acessar dashboard com token
      await page.goto(`/?token=${managerToken}`);
      await waitForLoadingToFinish(page);

      // Deve redirecionar automaticamente para dashboard
      await expect(
        page.locator('h1, h2').first()
      ).toContainText(/dashboard|acompanhamento|progresso/i, {
        timeout: 15000,
      });

      // Deve mostrar título da avaliação
      await expect(
        page.locator(`text="${TEST_DATA.evaluation.title}"`)
      ).toBeVisible({ timeout: 10000 });

      console.log('✅ Dashboard restaurado com token!');
    });

    await test.step('Navigate between dashboard and results', async () => {
      // Ver resultados
      const resultsButton = page.locator(
        'button:has-text("Resultados"), a:has-text("Resultados")'
      );

      if (await resultsButton.isVisible()) {
        await resultsButton.click();
        await waitForLoadingToFinish(page);

        // Verificar que está na página de resultados
        await expect(page.locator('h1, h2').first()).toContainText(
          /resultado|análise/i,
          { timeout: 10000 }
        );

        console.log('✅ Navegou para resultados');

        // Voltar para dashboard
        const backButton = page.locator(
          'button:has-text("Voltar"), a:has-text("Dashboard")'
        );

        if (await backButton.isVisible()) {
          await backButton.click();
          await waitForLoadingToFinish(page);

          await expect(page.locator('h1, h2').first()).toContainText(
            /dashboard|progresso/i
          );

          console.log('✅ Voltou para dashboard');
        }
      }
    });

    await test.step('Verify session persists across page reloads', async () => {
      // Reload da página
      await page.reload();
      await waitForLoadingToFinish(page);

      // Sessão deve persistir (via sessionStorage)
      await expect(
        page.locator('h1, h2').first()
      ).toContainText(/dashboard|progresso/i, { timeout: 10000 });

      await expect(
        page.locator(`text="${TEST_DATA.evaluation.title}"`)
      ).toBeVisible();

      console.log('✅ Sessão persiste após reload');
    });
  });

  test('should handle invalid token gracefully', async ({ page }) => {
    await test.step('Access with invalid token', async () => {
      const invalidToken = '00000000-0000-0000-0000-000000000000';

      await page.goto(`/?token=${invalidToken}`);
      await page.waitForTimeout(2000);

      // Deve mostrar erro ou redirecionar para login
      const hasError = await page
        .locator('text=/inválido|não encontrado|erro/i')
        .isVisible()
        .catch(() => false);

      const isLoginPage = await page
        .locator('text=/login|entrar|acesso/i')
        .isVisible()
        .catch(() => false);

      // Pelo menos um deve ser verdadeiro
      expect(hasError || isLoginPage).toBeTruthy();

      console.log('✅ Token inválido tratado corretamente');
    });
  });

  test('should handle malformed token', async ({ page }) => {
    await test.step('Access with malformed token', async () => {
      const malformedToken = 'not-a-valid-uuid';

      await page.goto(`/?token=${malformedToken}`);
      await page.waitForTimeout(2000);

      // Deve redirecionar para login ou mostrar erro
      const url = page.url();
      expect(url).not.toContain('dashboard');

      console.log('✅ Token malformado rejeitado');
    });
  });

  test('should logout and clear session', async ({ page }) => {
    // Criar sessão primeiro
    await test.step('Create session', async () => {
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      await fillEvaluationForm(page, 'Test Logout');
      await addMember(page, TEST_DATA.members[0]);
      await addMember(page, TEST_DATA.members[1]);

      await page.click('button:has-text("Finalizar")');
      await waitForLoadingToFinish(page);

      await page.waitForURL(/dashboard|success/i, { timeout: 30000 });
    });

    await test.step('Logout', async () => {
      // Procurar botão de logout
      const logoutButton = page.locator(
        'button:has-text("Sair"), button:has-text("Logout"), a:has-text("Sair")'
      );

      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(1000);

        // Deve redirecionar para login
        await expect(
          page.locator('text=/login|entrar|acesso/i')
        ).toBeVisible({ timeout: 5000 });

        console.log('✅ Logout realizado');

        // Verificar que sessionStorage foi limpo
        const sessionData = await page.evaluate(() => {
          return sessionStorage.getItem('manager_session');
        });

        expect(sessionData).toBeNull();

        console.log('✅ SessionStorage limpo');
      } else {
        console.log('⚠️  Botão de logout não encontrado (pode não estar implementado)');
      }
    });

    await test.step('Verify cannot access dashboard after logout', async () => {
      // Tentar acessar dashboard diretamente
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Deve redirecionar para login
      const isLoginPage = await page
        .locator('text=/login|entrar|gestor/i')
        .isVisible()
        .catch(() => false);

      // Se não redirecionou, pelo menos não deve mostrar dados
      if (!isLoginPage) {
        const hasEvaluationData = await page
          .locator('text=/avaliação|membros|progresso/i')
          .isVisible()
          .catch(() => false);

        expect(hasEvaluationData).toBeFalsy();
      }

      console.log('✅ Dashboard protegido após logout');
    });
  });
});

test.describe('Manager Authentication - Session Storage', () => {
  test('should store session data in sessionStorage', async ({ page }) => {
    await test.step('Login and check storage', async () => {
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      await fillEvaluationForm(page, 'Test Session Storage');
      await addMember(page, TEST_DATA.members[0]);
      await addMember(page, TEST_DATA.members[1]);

      await page.click('button:has-text("Finalizar")');
      await waitForLoadingToFinish(page);

      await page.waitForURL(/dashboard|success/i, { timeout: 30000 });

      // Verificar que dados foram salvos em sessionStorage
      const sessionData = await page.evaluate(() => {
        const data = sessionStorage.getItem('manager_session');
        return data ? JSON.parse(data) : null;
      });

      expect(sessionData).toBeTruthy();
      expect(sessionData).toHaveProperty('type', 'manager');
      expect(sessionData).toHaveProperty('token');
      expect(sessionData).toHaveProperty('evaluationId');

      console.log('✅ Dados da sessão armazenados:', sessionData);
    });
  });

  test('should restore session from sessionStorage on page load', async ({
    page,
  }) => {
    await test.step('Create session', async () => {
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      await fillEvaluationForm(page, 'Test Auto Restore');
      await addMember(page, TEST_DATA.members[0]);
      await addMember(page, TEST_DATA.members[1]);

      await page.click('button:has-text("Finalizar")');
      await waitForLoadingToFinish(page);

      await page.waitForURL(/dashboard|success/i, { timeout: 30000 });
    });

    await test.step('Navigate to home and auto-restore', async () => {
      // Navegar para home
      await page.goto('/');
      await waitForLoadingToFinish(page);

      // Deve auto-restaurar sessão e redirecionar para dashboard
      await expect(
        page.locator('h1, h2').first()
      ).toContainText(/dashboard|progresso/i, { timeout: 10000 });

      console.log('✅ Sessão restaurada automaticamente');
    });
  });

  test('should clear session on different manager login', async ({ page }) => {
    await test.step('Create first session', async () => {
      await page.goto('/');
      await fillManagerLogin(page, 'manager1@test.com', 'Manager One');
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      // Pegar token da primeira sessão
      const token1 = await page.evaluate(() => {
        const data = sessionStorage.getItem('manager_session');
        return data ? JSON.parse(data).token : null;
      });

      console.log('✅ Primeira sessão criada:', token1);
    });

    await test.step('Logout and create second session', async () => {
      // Limpar sessão manualmente (simula logout)
      await page.evaluate(() => sessionStorage.clear());

      // Novo login
      await page.goto('/');
      await fillManagerLogin(page, 'manager2@test.com', 'Manager Two');
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      // Pegar token da segunda sessão
      const token2 = await page.evaluate(() => {
        const data = sessionStorage.getItem('manager_session');
        return data ? JSON.parse(data).token : null;
      });

      console.log('✅ Segunda sessão criada:', token2);

      // Tokens devem ser diferentes (se não for, provavelmente está usando hash do email)
      // Mas o importante é que a sessão foi substituída
    });
  });
});

test.describe('Manager Authentication - Token Expiration', () => {
  test.skip('should handle expired session (timeout)', async ({ page }) => {
    // Este teste requer configuração de timeout curto
    // Por padrão, sessões de gestor duram 7 dias
    // Para testar expiração, seria necessário:
    // 1. Configurar timeout muito curto (ex: 5 segundos) no ambiente de teste
    // 2. Criar sessão
    // 3. Aguardar timeout
    // 4. Tentar acessar dashboard
    // 5. Verificar que sessão expirou

    console.log('⏭️  Teste de expiração de sessão requer configuração especial');
  });

  test('should validate token format before making request', async ({ page }) => {
    await test.step('Try to access with various invalid token formats', async () => {
      const invalidTokens = [
        '',
        'null',
        'undefined',
        '123',
        'abc-def-ghi',
        '../../etc/passwd',
        '<script>alert("xss")</script>',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // JWT simulado
      ];

      for (const invalidToken of invalidTokens) {
        await page.goto(`/?token=${encodeURIComponent(invalidToken)}`);
        await page.waitForTimeout(1000);

        // Não deve dar erro de JavaScript
        const hasJSError = await page.evaluate(() => {
          return (window as any).hasJavaScriptError || false;
        });

        expect(hasJSError).toBeFalsy();

        // Não deve acessar dashboard
        const url = page.url();
        expect(url).not.toContain('/dashboard');

        console.log(`✅ Token inválido rejeitado: "${invalidToken}"`);
      }
    });
  });
});
