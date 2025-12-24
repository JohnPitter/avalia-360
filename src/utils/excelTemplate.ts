/**
 * Utilitário para gerar template Excel
 * Permite que o gestor baixe um template pré-formatado
 * para preencher os dados da equipe
 */

import * as XLSX from 'xlsx';

/**
 * Interface para dados de membro no Excel
 */
export interface ExcelMemberRow {
  Nome: string;
  Email: string;
}

/**
 * Gera e baixa template Excel para adicionar membros
 *
 * Template gerado:
 * | Nome          | Email                |
 * |---------------|----------------------|
 * | João Silva    | joao.silva@email.com |
 * | Maria Santos  | maria@email.com      |
 *
 * @example
 * ```tsx
 * <button onClick={downloadExcelTemplate}>
 *   Baixar Template Excel
 * </button>
 * ```
 */
export function downloadExcelTemplate(): void {
  // Dados de exemplo para orientar o usuário
  const exampleData: ExcelMemberRow[] = [
    { Nome: 'João Silva', Email: 'joao.silva@example.com' },
    { Nome: 'Maria Santos', Email: 'maria.santos@example.com' },
    { Nome: 'Pedro Oliveira', Email: 'pedro.oliveira@example.com' },
  ];

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Criar worksheet com dados de exemplo
  const ws = XLSX.utils.json_to_sheet(exampleData);

  // Definir largura das colunas
  ws['!cols'] = [
    { wch: 25 }, // Coluna Nome
    { wch: 35 }, // Coluna Email
  ];

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Membros da Equipe');

  // Gerar buffer do arquivo
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  // Criar blob e fazer download
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-membros-avaliacao-360.xlsx';
  link.click();

  // Limpar URL temporária
  URL.revokeObjectURL(url);
}

/**
 * Gera template Excel vazio (sem dados de exemplo)
 * Útil para usuários que preferem começar do zero
 */
export function downloadEmptyExcelTemplate(): void {
  // Criar workbook vazio
  const wb = XLSX.utils.book_new();

  // Criar worksheet apenas com headers
  const ws = XLSX.utils.aoa_to_sheet([['Nome', 'Email']]);

  // Definir largura das colunas
  ws['!cols'] = [
    { wch: 25 }, // Coluna Nome
    { wch: 35 }, // Coluna Email
  ];

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Membros da Equipe');

  // Gerar e baixar
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-membros-vazio.xlsx';
  link.click();

  URL.revokeObjectURL(url);
}
