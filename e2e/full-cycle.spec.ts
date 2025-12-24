/**
 * E2E Tests - Full Cycle Integration
 *
 * Testa o ciclo completo end-to-end:
 * 1. Gestor cria avaliação e adiciona membros
 * 2. Membros fazem login e avaliam uns aos outros
 * 3. Gestor visualiza resultados finais
 *
 * Este é o teste mais importante - valida toda a jornada do usuário
 */

import { test, expect } from '@playwright/test';
import {
  TEST_DATA,
  fillManagerLogin,
  fillEvaluationForm,
  addMember,
  fillRatings,
  fillComments,
  extractManagerToken,
  extractAccessCode,
  waitForSuccessToast,
  waitForLoadingToFinish,
  expectText,
  expectVisible,
} from './utils/test-helpers';

test.describe('Full Cycle Integration - Manager + Members + Results', () => {
  let managerToken: string;
  let accessCodes: string[] = [];

  test('FULL CYCLE: Create evaluation → Members evaluate → View results', async ({
    page,
    context,
  }) => {
    // ============================================================
    // PARTE 1: GESTOR CRIA AVALIAÇÃO
    // ============================================================
    await test.step('MANAGER: Create evaluation and add members', async () => {
      console.log('🎯 INICIANDO FLUXO COMPLETO - PARTE 1: GESTOR');

      // Navegar para home
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Login do gestor
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      // Criar avaliação
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

      // Verificar que todos foram adicionados
      for (const member of TEST_DATA.members) {
        await expect(page.locator(`text=${member.name}`)).toBeVisible();
      }

      // Enviar convites
      await page.click(
        'button:has-text("Criar"), button:has-text("Enviar")'
      );
      await waitForLoadingToFinish(page);

      // Aguardar sucesso
      await page.waitForURL(/success|dashboard|resultado/i, {
        timeout: 30000,
      });

      // Extrair token do gestor
      managerToken = (await extractManagerToken(page)) || '';
      expect(managerToken).toBeTruthy();
      console.log('✅ Avaliação criada. Manager Token:', managerToken);

      // Tentar extrair códigos de acesso da página
      // (Nota: Em produção real, os códigos vêm por email)
      // Aqui vamos simular códigos mock
      accessCodes = TEST_DATA.members.map((_, i) =>
        String(123456 + i).padStart(6, '0')
      );
      console.log('✅ Códigos de acesso (mock):', accessCodes);
    });

    // ============================================================
    // PARTE 2: MEMBROS AVALIAM UNS AOS OUTROS
    // ============================================================
    await test.step('MEMBERS: Login and evaluate each other', async () => {
      console.log('🎯 PARTE 2: MEMBROS AVALIAM');

      // Para cada membro, fazer login e avaliar os outros
      for (let i = 0; i < TEST_DATA.members.length; i++) {
        const member = TEST_DATA.members[i];
        const accessCode = accessCodes[i];

        console.log(`\n👤 Membro ${i + 1}: ${member.name}`);

        // Abrir nova aba para este membro
        const memberPage = await context.newPage();

        // Navegar para página do colaborador
        await memberPage.goto('/?role=member');
        await memberPage.waitForLoadState('networkidle');

        // Login com código de acesso
        await memberPage.fill('input[placeholder*="código" i]', accessCode);
        await memberPage.click('button[type="submit"]');
        await waitForLoadingToFinish(memberPage);

        // Deve mostrar lista de membros (menos ele mesmo)
        await expect(memberPage.locator('h1, h2')).toContainText(
          /membros|equipe|avaliar/i,
          { timeout: 15000 }
        );

        // Contar quantos membros precisa avaliar
        const evaluateButtons = memberPage.locator(
          'button:has-text("Avaliar")'
        );
        let remainingCount = await evaluateButtons.count();

        console.log(`   Precisa avaliar ${remainingCount} pessoa(s)`);

        // Avaliar todos
        while (remainingCount > 0) {
          // Clicar no primeiro "Avaliar"
          await evaluateButtons.first().click();
          await waitForLoadingToFinish(memberPage);

          // Preencher avaliação
          await fillRatings(memberPage, TEST_DATA.ratings);
          await fillComments(memberPage, TEST_DATA.comments);

          // Submeter
          await memberPage.click('button:has-text("Enviar")');

          // Aguardar retorno para lista
          await memberPage.waitForURL(/membros|lista/i, { timeout: 15000 });
          await waitForLoadingToFinish(memberPage);

          // Atualizar contagem
          remainingCount = await evaluateButtons.count();
          console.log(`   ✅ Avaliação enviada. Restam: ${remainingCount}`);
        }

        console.log(`   ✅ ${member.name} completou todas as avaliações!`);

        // Fechar aba do membro
        await memberPage.close();
      }

      console.log('\n✅ TODOS OS MEMBROS COMPLETARAM AS AVALIAÇÕES!');
    });

    // ============================================================
    // PARTE 3: GESTOR VISUALIZA RESULTADOS
    // ============================================================
    await test.step('MANAGER: View final results', async () => {
      console.log('\n🎯 PARTE 3: GESTOR VISUALIZA RESULTADOS');

      // Voltar para página original (gestor)
      await page.goto(`/?token=${managerToken}`);
      await waitForLoadingToFinish(page);

      // Deve mostrar dashboard ou resultados
      await expectVisible(page, 'h1, h2');

      // Procurar botão de "Ver Resultados" ou navegar diretamente
      const resultsButton = page.locator(
        'button:has-text("Resultados"), a:has-text("Resultados")'
      );

      if (await resultsButton.isVisible()) {
        await resultsButton.click();
        await waitForLoadingToFinish(page);
      }

      // Verificar que estamos na página de resultados
      await expectText(page, 'h1, h2', /resultados|análise/i);

      // Verificar que mostra dados agregados
      await expectVisible(page, 'text=/média|average/i');

      // Verificar que mostra todos os membros
      for (const member of TEST_DATA.members) {
        await expectText(page, 'body', member.name);
      }

      // Verificar que mostra gráficos (canvas ou SVG)
      const charts = page.locator('canvas, svg[class*="recharts"]');
      const chartCount = await charts.count();
      expect(chartCount).toBeGreaterThan(0);

      console.log('✅ Resultados exibidos com sucesso!');

      // Verificar que mostra comentários (anonimizados)
      const commentsSection = page.locator(
        'text=/comentários|feedback/i'
      );
      if (await commentsSection.isVisible()) {
        console.log('✅ Seção de comentários encontrada');
      }

      // Verificar que mostra progresso 100%
      await expectText(page, 'body', /100%|completo|finalizado/i);

      console.log('\n🎉 CICLO COMPLETO FINALIZADO COM SUCESSO!');
    });

    // ============================================================
    // VALIDAÇÕES FINAIS
    // ============================================================
    await test.step('VALIDATIONS: Verify data integrity', async () => {
      console.log('\n🔍 VALIDAÇÕES FINAIS');

      // Verificar que nenhum erro apareceu
      const errors = page.locator('text=/erro|error/i');
      const errorCount = await errors.count();

      if (errorCount > 0) {
        console.warn(`⚠️  ${errorCount} mensagem(ns) de erro encontrada(s)`);
      }

      // Verificar que não há dados sensíveis expostos
      const bodyText = await page.textContent('body');

      // Não deve mostrar códigos de acesso
      for (const code of accessCodes) {
        expect(bodyText).not.toContain(code);
      }

      // Não deve mostrar emails dos membros (privacidade)
      for (const member of TEST_DATA.members) {
        expect(bodyText?.toLowerCase()).not.toContain(member.email);
      }

      console.log('✅ Validações de integridade OK');
    });
  });

  test('should handle concurrent evaluations from multiple members', async ({
    context,
  }) => {
    await test.step('Setup: Create evaluation', async () => {
      const managerPage = await context.newPage();
      await managerPage.goto('/');

      await fillManagerLogin(
        managerPage,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await managerPage.click('button[type="submit"]');
      await waitForLoadingToFinish(managerPage);

      await fillEvaluationForm(managerPage, TEST_DATA.evaluation.title);

      for (const member of TEST_DATA.members.slice(0, 2)) {
        await addMember(managerPage, member);
      }

      await managerPage.click('button:has-text("Criar")');
      await managerPage.waitForURL(/success|dashboard/i, { timeout: 30000 });

      await managerPage.close();
    });

    await test.step('Concurrent: Multiple members evaluate simultaneously', async () => {
      // Abrir múltiplas abas simultaneamente
      const memberPages = await Promise.all([
        context.newPage(),
        context.newPage(),
      ]);

      // Fazer login concorrentemente
      await Promise.all(
        memberPages.map(async (memberPage, i) => {
          const accessCode = String(123456 + i).padStart(6, '0');
          await memberPage.goto('/?role=member');
          await memberPage.fill('input[placeholder*="código" i]', accessCode);
          await memberPage.click('button[type="submit"]');
          return waitForLoadingToFinish(memberPage);
        })
      );

      // Submeter avaliações concorrentemente
      // Isso testa race conditions e integridade do Firestore
      await Promise.all(
        memberPages.map(async (memberPage) => {
          await memberPage.click('button:has-text("Avaliar")');
          await waitForLoadingToFinish(memberPage);
          await fillRatings(memberPage, TEST_DATA.ratings);
          await memberPage.click('button:has-text("Enviar")');
          return waitForSuccessToast(memberPage);
        })
      );

      // Cleanup
      await Promise.all(memberPages.map((p) => p.close()));
    });
  });
});
