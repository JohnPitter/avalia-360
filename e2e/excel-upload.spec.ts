/**
 * E2E Tests - Excel Upload Flow
 *
 * Testa funcionalidade de upload de Excel:
 * 1. Download de template Excel
 * 2. Upload de arquivo Excel válido
 * 3. Validação de erros
 * 4. Importação de membros em massa
 */

import { test, expect } from '@playwright/test';
import {
  TEST_DATA,
  fillManagerLogin,
  fillEvaluationForm,
  waitForLoadingToFinish,
} from './utils/test-helpers';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Excel Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
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

    // Preencher título da avaliação
    await fillEvaluationForm(page, TEST_DATA.evaluation.title);

    // Aguardar transição
    await page.waitForTimeout(500);
  });

  test('should download Excel template with examples', async ({ page }) => {
    await test.step('Click download template button', async () => {
      // Interceptar download
      const downloadPromise = page.waitForEvent('download');

      // Clicar no botão de download com exemplos
      await page.click('button:has-text("Baixar Template (com exemplos)")');

      // Aguardar download
      const download = await downloadPromise;

      // Validar nome do arquivo
      expect(download.suggestedFilename()).toContain('template-membros');
      expect(download.suggestedFilename()).toContain('.xlsx');

      // Salvar arquivo temporariamente
      const filePath = path.join(
        __dirname,
        'temp',
        download.suggestedFilename()
      );
      await download.saveAs(filePath);

      // Verificar que arquivo existe
      expect(fs.existsSync(filePath)).toBeTruthy();

      // Ler e validar conteúdo do Excel
      const workbook = XLSX.readFile(filePath);
      expect(workbook.SheetNames.length).toBeGreaterThan(0);

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Deve ter dados de exemplo
      expect(data.length).toBeGreaterThan(0);

      // Primeira linha deve ter Nome e Email
      const firstRow = data[0] as any;
      expect(firstRow).toHaveProperty('Nome');
      expect(firstRow).toHaveProperty('Email');

      console.log('✅ Template Excel baixado e validado:', filePath);

      // Limpar arquivo temporário
      fs.unlinkSync(filePath);
    });
  });

  test('should upload valid Excel file and import members', async ({ page }) => {
    await test.step('Create test Excel file', async () => {
      // Criar arquivo Excel de teste
      const testMembers = [
        { Nome: 'Alice Silva', Email: 'alice@test.com' },
        { Nome: 'Bob Santos', Email: 'bob@test.com' },
        { Nome: 'Carol Oliveira', Email: 'carol@test.com' },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(testMembers);
      XLSX.utils.book_append_sheet(wb, ws, 'Membros');

      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testFilePath = path.join(tempDir, 'test-upload.xlsx');
      XLSX.writeFile(wb, testFilePath);

      expect(fs.existsSync(testFilePath)).toBeTruthy();
      console.log('✅ Arquivo Excel de teste criado:', testFilePath);

      // Upload do arquivo
      const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
      await fileInput.setInputFiles(testFilePath);

      // Aguardar processamento
      await page.waitForTimeout(2000);

      // Verificar mensagem de sucesso
      await expect(
        page.locator('text=/importado.*sucesso|membro.*importado/i')
      ).toBeVisible({ timeout: 10000 });

      // Verificar que membros aparecem na lista
      for (const member of testMembers) {
        await expect(page.locator(`text="${member.Nome}"`)).toBeVisible();
        await expect(page.locator(`text="${member.Email}"`)).toBeVisible();
      }

      // Verificar contador de membros
      await expect(page.locator('text=/3 membros/i')).toBeVisible();

      console.log('✅ Membros importados com sucesso do Excel');

      // Limpar arquivo temporário
      fs.unlinkSync(testFilePath);
    });
  });

  test('should validate Excel file with errors', async ({ page }) => {
    await test.step('Upload Excel with invalid data', async () => {
      // Criar arquivo com dados inválidos
      const invalidMembers = [
        { Nome: 'A', Email: 'invalid-email' }, // Nome muito curto, email inválido
        { Nome: '', Email: 'test@test.com' }, // Nome vazio
        { Nome: 'Valid Name', Email: '' }, // Email vazio
        { Nome: 'Bob Santos', Email: 'bob@test.com' }, // Válido
        { Nome: 'Bob Santos', Email: 'bob@test.com' }, // Duplicado
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(invalidMembers);
      XLSX.utils.book_append_sheet(wb, ws, 'Membros');

      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testFilePath = path.join(tempDir, 'test-invalid.xlsx');
      XLSX.writeFile(wb, testFilePath);

      // Upload do arquivo
      const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
      await fileInput.setInputFiles(testFilePath);

      // Aguardar processamento
      await page.waitForTimeout(2000);

      // Deve mostrar erros
      await expect(
        page.locator('text=/erro|inválido|invalid/i')
      ).toBeVisible({ timeout: 10000 });

      // Verificar que erros específicos aparecem
      const bodyText = await page.textContent('body');
      expect(bodyText).toMatch(/email.*inválido|nome.*inválido|duplicado/i);

      console.log('✅ Erros de validação exibidos corretamente');

      // Limpar
      fs.unlinkSync(testFilePath);
    });
  });

  test('should handle empty Excel file', async ({ page }) => {
    await test.step('Upload empty Excel file', async () => {
      // Criar arquivo vazio (apenas headers)
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['Nome', 'Email']]);
      XLSX.utils.book_append_sheet(wb, ws, 'Membros');

      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testFilePath = path.join(tempDir, 'test-empty.xlsx');
      XLSX.writeFile(wb, testFilePath);

      // Upload
      const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
      await fileInput.setInputFiles(testFilePath);

      // Aguardar
      await page.waitForTimeout(2000);

      // Deve mostrar erro de arquivo vazio
      await expect(
        page.locator('text=/vazio|nenhum membro/i')
      ).toBeVisible({ timeout: 10000 });

      console.log('✅ Erro de arquivo vazio exibido');

      // Limpar
      fs.unlinkSync(testFilePath);
    });
  });

  test('should handle Excel with wrong headers', async ({ page }) => {
    await test.step('Upload Excel with wrong column names', async () => {
      // Criar arquivo com headers errados
      const wrongData = [
        { Name: 'Alice Silva', Mail: 'alice@test.com' },
        { Name: 'Bob Santos', Mail: 'bob@test.com' },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(wrongData);
      XLSX.utils.book_append_sheet(wb, ws, 'Membros');

      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testFilePath = path.join(tempDir, 'test-wrong-headers.xlsx');
      XLSX.writeFile(wb, testFilePath);

      // Upload
      const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
      await fileInput.setInputFiles(testFilePath);

      // Aguardar
      await page.waitForTimeout(2000);

      // Deve mostrar erro de cabeçalhos inválidos
      await expect(
        page.locator('text=/cabeçalho.*inválido|coluna.*incorreta/i')
      ).toBeVisible({ timeout: 10000 });

      console.log('✅ Erro de cabeçalhos inválidos exibido');

      // Limpar
      fs.unlinkSync(testFilePath);
    });
  });

  test('should handle large Excel file (50+ members)', async ({ page }) => {
    await test.step('Upload Excel with many members', async () => {
      // Criar arquivo com 50 membros
      const largeData = [];
      for (let i = 1; i <= 50; i++) {
        largeData.push({
          Nome: `Membro ${i}`,
          Email: `membro${i}@test.com`,
        });
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(largeData);
      XLSX.utils.book_append_sheet(wb, ws, 'Membros');

      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testFilePath = path.join(tempDir, 'test-large.xlsx');
      XLSX.writeFile(wb, testFilePath);

      // Upload
      const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
      await fileInput.setInputFiles(testFilePath);

      // Aguardar processamento (pode demorar)
      await page.waitForTimeout(3000);

      // Verificar que importação foi bem-sucedida
      await expect(
        page.locator('text=/50 membros|50.*importado/i')
      ).toBeVisible({ timeout: 15000 });

      console.log('✅ Arquivo grande (50 membros) processado com sucesso');

      // Limpar
      fs.unlinkSync(testFilePath);
    });
  });

  test('should replace existing members with imported ones', async ({ page }) => {
    await test.step('Add members manually first', async () => {
      // Adicionar membros manualmente
      await page.fill('input[placeholder*="nome" i]', 'Manual User 1');
      await page.fill('input[type="email"]', 'manual1@test.com');

      // Verificar que membro manual está visível
      await expect(page.locator('input[value="Manual User 1"]')).toBeVisible();
    });

    await test.step('Upload Excel and replace', async () => {
      // Criar arquivo Excel
      const excelMembers = [
        { Nome: 'Excel User 1', Email: 'excel1@test.com' },
        { Nome: 'Excel User 2', Email: 'excel2@test.com' },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelMembers);
      XLSX.utils.book_append_sheet(wb, ws, 'Membros');

      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testFilePath = path.join(tempDir, 'test-replace.xlsx');
      XLSX.writeFile(wb, testFilePath);

      // Upload
      const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
      await fileInput.setInputFiles(testFilePath);

      // Aguardar
      await page.waitForTimeout(2000);

      // Verificar que membros do Excel estão presentes
      await expect(page.locator('text="Excel User 1"')).toBeVisible();
      await expect(page.locator('text="Excel User 2"')).toBeVisible();

      // Verificar que membro manual NÃO está mais presente
      const manualUserExists = await page
        .locator('text="Manual User 1"')
        .isVisible()
        .catch(() => false);

      // Membros devem ter sido substituídos
      expect(manualUserExists).toBeFalsy();

      console.log('✅ Membros manuais substituídos por importados');

      // Limpar
      fs.unlinkSync(testFilePath);
    });
  });
});

test.describe('Excel Upload - Full Flow Integration', () => {
  test('should complete full flow: download template → edit → upload → create evaluation', async ({
    page,
  }) => {
    await test.step('Login and start evaluation', async () => {
      await page.goto('/');
      await fillManagerLogin(
        page,
        TEST_DATA.manager.email,
        TEST_DATA.manager.name
      );
      await page.click('button[type="submit"]');
      await waitForLoadingToFinish(page);
      await fillEvaluationForm(page, 'Avaliação via Excel');
    });

    await test.step('Download template', async () => {
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Baixar Template")');
      const download = await downloadPromise;

      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const downloadPath = path.join(tempDir, download.suggestedFilename());
      await download.saveAs(downloadPath);

      console.log('✅ Template baixado:', downloadPath);

      // Editar template (adicionar membros)
      const workbook = XLSX.readFile(downloadPath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Limpar dados de exemplo e adicionar reais
      const newData = [
        { Nome: 'Ana Costa', Email: 'ana.costa@company.com' },
        { Nome: 'Bruno Lima', Email: 'bruno.lima@company.com' },
        { Nome: 'Carla Mendes', Email: 'carla.mendes@company.com' },
      ];

      const newWs = XLSX.utils.json_to_sheet(newData);
      workbook.Sheets[workbook.SheetNames[0]] = newWs;

      const editedPath = path.join(tempDir, 'edited-template.xlsx');
      XLSX.writeFile(workbook, editedPath);

      console.log('✅ Template editado:', editedPath);

      // Upload do arquivo editado
      const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
      await fileInput.setInputFiles(editedPath);

      // Aguardar importação
      await page.waitForTimeout(2000);

      // Verificar sucesso
      await expect(
        page.locator('text=/3 membros|3.*importado/i')
      ).toBeVisible();

      // Limpar
      fs.unlinkSync(downloadPath);
      fs.unlinkSync(editedPath);
    });

    await test.step('Create evaluation and verify', async () => {
      // Submeter avaliação
      await page.click('button:has-text("Finalizar e Enviar")');
      await waitForLoadingToFinish(page);

      // Aguardar sucesso
      await page.waitForURL(/success|dashboard/i, { timeout: 30000 });

      // Deve mostrar que avaliação foi criada
      await expect(
        page.locator('h1, h2').first()
      ).toContainText(/sucesso|dashboard/i, { timeout: 10000 });

      console.log('✅ Avaliação criada com membros do Excel!');
    });
  });
});
