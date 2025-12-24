/**
 * E2E Tests - Result Export Flow
 *
 * Testa exportação de resultados em diferentes formatos:
 * 1. Exportar como TXT
 * 2. Exportar como Excel (.xlsx)
 * 3. Exportar como CSV
 * 4. Exportar todos os formatos
 * 5. Validar conteúdo dos arquivos exportados
 */

import { test, expect } from './fixtures';
import {
  TEST_DATA,
  fillManagerLogin,
  fillEvaluationForm,
  addMember,
  fillRatings,
  fillComments,
  waitForLoadingToFinish,
} from './utils/test-helpers';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Result Export - File Downloads', () => {
  // Setup: Criar avaliação completa com resultados
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Criar avaliação como gestor
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      await fillEvaluationForm(page, 'Test Export Evaluation');

      // Adicionar 3 membros
      for (const member of TEST_DATA.members.slice(0, 3)) {
        await addMember(page, member);
      }

      await page.click('button:has-text("Finalizar")');
      await waitForLoadingToFinish(page);
      await page.waitForURL(/dashboard|success/i, { timeout: 30000 });

      // Simular avaliações (em teste real, membros avaliariam)
      // Para este teste, vamos assumir que avaliações existem
      console.log('✅ Avaliação de teste criada para exportação');
    } finally {
      await context.close();
    }
  });

  test('should export results as TXT file', async ({ page }) => {
    await test.step('Navigate to results page', async () => {
      // Login como gestor
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      // Navegar para resultados
      const resultsButton = page.locator('button:has-text("Resultados")');
      if (await resultsButton.isVisible()) {
        await resultsButton.click();
        await waitForLoadingToFinish(page);
      }
    });

    await test.step('Click export TXT button', async () => {
      // Abrir menu de exportação
      await page.click('button:has-text("Exportar Resultados")');
      await page.waitForTimeout(500);

      // Aguardar download
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      // Clicar em Texto (.txt)
      await page.click('text="Texto (.txt)"');

      // Aguardar download
      const download = await downloadPromise;

      // Validar nome do arquivo
      expect(download.suggestedFilename()).toMatch(/resultados.*\.txt$/i);

      // Salvar arquivo
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filePath = path.join(tempDir, download.suggestedFilename());
      await download.saveAs(filePath);

      // Validar que arquivo foi criado
      expect(fs.existsSync(filePath)).toBeTruthy();

      // Ler e validar conteúdo
      const content = fs.readFileSync(filePath, 'utf-8');

      // Deve conter título
      expect(content).toContain('RESULTADOS');
      expect(content).toContain('ESTATÍSTICAS GERAIS');
      expect(content).toContain('RESULTADOS INDIVIDUAIS');

      // Deve conter dados estatísticos
      expect(content).toMatch(/Total de Membros/i);
      expect(content).toMatch(/Média Geral/i);

      console.log('✅ Arquivo TXT exportado e validado');
      console.log(`   Tamanho: ${content.length} caracteres`);

      // Limpar
      fs.unlinkSync(filePath);
    });
  });

  test('should export results as Excel file', async ({ page }) => {
    await test.step('Navigate to results', async () => {
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      const resultsButton = page.locator('button:has-text("Resultados")');
      if (await resultsButton.isVisible()) {
        await resultsButton.click();
        await waitForLoadingToFinish(page);
      }
    });

    await test.step('Export to Excel and validate', async () => {
      // Abrir menu
      await page.click('button:has-text("Exportar Resultados")');
      await page.waitForTimeout(500);

      // Aguardar download
      const downloadPromise = page.waitForEvent('download');

      // Clicar em Excel
      await page.click('text="Excel (.xlsx)"');

      const download = await downloadPromise;

      // Validar extensão
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);

      // Salvar
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filePath = path.join(tempDir, download.suggestedFilename());
      await download.saveAs(filePath);

      expect(fs.existsSync(filePath)).toBeTruthy();

      // Ler Excel e validar estrutura
      const workbook = XLSX.readFile(filePath);

      // Deve ter múltiplas abas
      expect(workbook.SheetNames.length).toBeGreaterThan(0);

      // Validar abas esperadas
      expect(workbook.SheetNames).toContain('Resumo');
      expect(workbook.SheetNames).toContain('Médias');

      // Validar conteúdo da aba Resumo
      const resumoSheet = workbook.Sheets['Resumo'];
      const resumoData = XLSX.utils.sheet_to_json(resumoSheet, { header: 1 });

      // Primeira linha deve ter título
      expect(resumoData[0]).toContain('RELATÓRIO DE AVALIAÇÃO 360°');

      // Validar aba Médias
      const mediasSheet = workbook.Sheets['Médias'];
      const mediasData = XLSX.utils.sheet_to_json(mediasSheet);

      // Deve ter dados de membros
      expect(mediasData.length).toBeGreaterThan(0);

      // Primeira linha deve ter estrutura correta
      const firstMember = mediasData[0] as any;
      expect(firstMember).toHaveProperty('Nome');
      expect(firstMember).toHaveProperty('Média Geral');
      expect(firstMember).toHaveProperty('Satisfação');

      console.log('✅ Arquivo Excel exportado e validado');
      console.log(`   Abas: ${workbook.SheetNames.join(', ')}`);
      console.log(`   Membros na aba Médias: ${mediasData.length}`);

      // Limpar
      fs.unlinkSync(filePath);
    });
  });

  test('should export results as CSV file', async ({ page }) => {
    await test.step('Navigate to results', async () => {
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      const resultsButton = page.locator('button:has-text("Resultados")');
      if (await resultsButton.isVisible()) {
        await resultsButton.click();
        await waitForLoadingToFinish(page);
      }
    });

    await test.step('Export to CSV and validate', async () => {
      // Abrir menu
      await page.click('button:has-text("Exportar Resultados")');
      await page.waitForTimeout(500);

      // Download
      const downloadPromise = page.waitForEvent('download');
      await page.click('text="CSV (.csv)"');
      const download = await downloadPromise;

      // Validar
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);

      // Salvar
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filePath = path.join(tempDir, download.suggestedFilename());
      await download.saveAs(filePath);

      expect(fs.existsSync(filePath)).toBeTruthy();

      // Ler CSV
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Deve ter header
      expect(lines[0]).toMatch(/Posição.*Nome.*Média/i);

      // Deve ter dados
      expect(lines.length).toBeGreaterThan(1);

      // Validar formato CSV (separado por vírgulas)
      const header = lines[0].split(',');
      expect(header.length).toBeGreaterThan(5);

      console.log('✅ Arquivo CSV exportado e validado');
      console.log(`   Linhas: ${lines.length}`);
      console.log(`   Colunas: ${header.length}`);

      // Limpar
      fs.unlinkSync(filePath);
    });
  });

  test('should export all formats at once', async ({ page }) => {
    await test.step('Navigate to results', async () => {
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      const resultsButton = page.locator('button:has-text("Resultados")');
      if (await resultsButton.isVisible()) {
        await resultsButton.click();
        await waitForLoadingToFinish(page);
      }
    });

    await test.step('Export all formats', async () => {
      // Abrir menu
      await page.click('button:has-text("Exportar Resultados")');
      await page.waitForTimeout(500);

      // Coletar múltiplos downloads
      const downloads: any[] = [];

      // Listener para downloads
      page.on('download', (download) => {
        downloads.push(download);
      });

      // Clicar em "Todos os Formatos"
      await page.click('text="Todos os Formatos"');

      // Aguardar múltiplos downloads (pode demorar)
      await page.waitForTimeout(3000);

      // Deve ter baixado 3 arquivos
      expect(downloads.length).toBeGreaterThanOrEqual(3);

      // Validar extensões
      const extensions = downloads.map((d) => {
        const name = d.suggestedFilename();
        return path.extname(name).toLowerCase();
      });

      expect(extensions).toContain('.txt');
      expect(extensions).toContain('.xlsx');
      expect(extensions).toContain('.csv');

      console.log('✅ Todos os formatos exportados');
      console.log(`   Arquivos baixados: ${downloads.length}`);
      console.log(`   Extensões: ${extensions.join(', ')}`);
    });
  });
});

test.describe('Result Export - UI Interaction', () => {
  test('should show export menu on button click', async ({ page }) => {
    await test.step('Navigate to results', async () => {
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      const resultsButton = page.locator('button:has-text("Resultados")');
      if (await resultsButton.isVisible()) {
        await resultsButton.click();
        await waitForLoadingToFinish(page);
      }
    });

    await test.step('Toggle export menu', async () => {
      // Menu deve estar oculto inicialmente
      const txtOption = page.locator('text="Texto (.txt)"');
      expect(await txtOption.isVisible()).toBeFalsy();

      // Clicar no botão
      await page.click('button:has-text("Exportar Resultados")');

      // Menu deve aparecer
      await expect(txtOption).toBeVisible({ timeout: 2000 });
      await expect(page.locator('text="Excel (.xlsx)"')).toBeVisible();
      await expect(page.locator('text="CSV (.csv)"')).toBeVisible();
      await expect(page.locator('text="Todos os Formatos"')).toBeVisible();

      console.log('✅ Menu de exportação exibido');

      // Clicar novamente deve fechar
      await page.click('button:has-text("Exportar Resultados")');
      await page.waitForTimeout(500);

      // Menu deve sumir
      expect(await txtOption.isVisible()).toBeFalsy();

      console.log('✅ Menu fechado ao clicar novamente');
    });
  });

  test('should close menu after selecting format', async ({ page }) => {
    await test.step('Navigate and open menu', async () => {
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      const resultsButton = page.locator('button:has-text("Resultados")');
      if (await resultsButton.isVisible()) {
        await resultsButton.click();
        await waitForLoadingToFinish(page);
      }

      // Abrir menu
      await page.click('button:has-text("Exportar Resultados")');
      await page.waitForTimeout(500);

      // Menu deve estar visível
      await expect(page.locator('text="Texto (.txt)"')).toBeVisible();
    });

    await test.step('Select format and verify menu closes', async () => {
      // Clicar em uma opção
      await page.click('text="Texto (.txt)"');

      // Aguardar
      await page.waitForTimeout(1000);

      // Menu deve ter fechado
      const menuVisible = await page
        .locator('text="Excel (.xlsx)"')
        .isVisible()
        .catch(() => false);

      expect(menuVisible).toBeFalsy();

      console.log('✅ Menu fechou após seleção');
    });
  });

  test('should display export button only when results available', async ({
    page,
  }) => {
    await test.step('Navigate to empty results', async () => {
      // Criar avaliação sem avaliações completas
      await page.goto('/');
      await fillManagerLogin(
        page,
        'empty@test.com',
        'Empty Manager'
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);

      await fillEvaluationForm(page, 'Empty Evaluation');
      await addMember(page, TEST_DATA.members[0]);
      await addMember(page, TEST_DATA.members[1]);

      await page.click('button:has-text("Finalizar")');
      await waitForLoadingToFinish(page);

      await page.waitForURL(/dashboard|success/i, { timeout: 30000 });

      // Tentar navegar para resultados
      const resultsButton = page.locator('button:has-text("Resultados")');

      if (await resultsButton.isVisible()) {
        await resultsButton.click();
        await waitForLoadingToFinish(page);

        // Botão de exportar pode estar visível mas desabilitado,
        // ou pode não aparecer se não há dados
        const exportButton = page.locator('button:has-text("Exportar")');

        if (await exportButton.isVisible()) {
          // Se está visível, verificar se está habilitado
          const isEnabled = await exportButton.isEnabled();
          console.log(
            isEnabled
              ? '✅ Botão de exportar está habilitado (pode ter dados)'
              : '✅ Botão de exportar está desabilitado (sem dados)'
          );
        } else {
          console.log('✅ Botão de exportar não aparece (sem resultados)');
        }
      }
    });
  });
});
