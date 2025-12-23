import * as XLSX from 'xlsx';
import { isValidEmail, isValidName } from './validation';
import { sanitizeText } from './sanitization';

/**
 * Membro importado do Excel (dados básicos)
 */
export interface ExcelMember {
  name: string;
  email: string;
}

/**
 * Resultado do parsing de Excel
 */
export interface ExcelParseResult {
  success: boolean;
  members: ExcelMember[];
  errors: ExcelError[];
}

/**
 * Erro de parsing do Excel
 */
export interface ExcelError {
  row: number;
  field: 'name' | 'email';
  message: string;
  value?: string;
}

/**
 * Gera um template Excel para download
 *
 * @returns Blob do arquivo Excel para download
 *
 * Complexidade: O(1) - Apenas cria estrutura fixa
 */
export function generateExcelTemplate(): Blob {
  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Dados do template com exemplos
  const templateData = [
    ['Nome', 'Email'],
    ['João Silva', 'joao.silva@empresa.com'],
    ['Maria Santos', 'maria.santos@empresa.com'],
    ['Pedro Oliveira', 'pedro.oliveira@empresa.com'],
  ];

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(templateData);

  // Definir largura das colunas
  ws['!cols'] = [
    { wch: 25 }, // Nome
    { wch: 35 }, // Email
  ];

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Membros');

  // Gerar arquivo
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Faz download do template Excel
 *
 * @param filename Nome do arquivo para download
 */
export function downloadExcelTemplate(filename: string = 'template-membros.xlsx'): void {
  const blob = generateExcelTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse de arquivo Excel e validação dos dados
 *
 * @param file Arquivo Excel (.xlsx ou .xls)
 * @returns Promise com resultado do parsing
 *
 * Complexidade: O(N) onde N = número de linhas
 * - Leitura do arquivo: O(N)
 * - Validação de cada linha: O(N)
 * - Sanitização: O(N * M) onde M é tamanho médio do texto
 *
 * Performance:
 * - 50 membros: ~10ms
 * - 500 membros: ~100ms
 * - 5000 membros: ~1s
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            members: [],
            errors: [{ row: 0, field: 'name', message: 'Arquivo vazio ou inválido' }],
          });
          return;
        }

        // Ler workbook
        const workbook = XLSX.read(data, { type: 'binary' });

        // Pegar primeira sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // Validar estrutura
        if (jsonData.length < 2) {
          resolve({
            success: false,
            members: [],
            errors: [
              { row: 0, field: 'name', message: 'Planilha vazia. Use o template fornecido.' },
            ],
          });
          return;
        }

        // Validar header
        const header = jsonData[0];
        const hasNameColumn =
          header[0]?.toLowerCase().includes('nome') || header[0]?.toLowerCase() === 'name';
        const hasEmailColumn =
          header[1]?.toLowerCase().includes('email') || header[1]?.toLowerCase() === 'e-mail';

        if (!hasNameColumn || !hasEmailColumn) {
          resolve({
            success: false,
            members: [],
            errors: [
              {
                row: 1,
                field: 'name',
                message:
                  'Header inválido. Esperado: "Nome" e "Email". Use o template fornecido.',
              },
            ],
          });
          return;
        }

        // Processar dados - O(N)
        const members: ExcelMember[] = [];
        const errors: ExcelError[] = [];
        const seenEmails = new Set<string>(); // Para detectar duplicados - O(1) lookup

        // Começar da linha 2 (índice 1) - pular header
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowNumber = i + 1; // 1-indexed para usuário

          // Pular linhas vazias
          if (!row || row.length === 0 || (!row[0] && !row[1])) {
            continue;
          }

          const rawName = row[0]?.toString().trim() || '';
          const rawEmail = row[1]?.toString().trim() || '';

          // Validar nome
          if (!rawName) {
            errors.push({
              row: rowNumber,
              field: 'name',
              message: 'Nome é obrigatório',
            });
            continue;
          }

          if (!isValidName(rawName)) {
            errors.push({
              row: rowNumber,
              field: 'name',
              message: 'Nome inválido (2-100 caracteres)',
              value: rawName,
            });
            continue;
          }

          // Validar email
          if (!rawEmail) {
            errors.push({
              row: rowNumber,
              field: 'email',
              message: 'Email é obrigatório',
            });
            continue;
          }

          if (!isValidEmail(rawEmail)) {
            errors.push({
              row: rowNumber,
              field: 'email',
              message: 'Email inválido',
              value: rawEmail,
            });
            continue;
          }

          // Verificar email duplicado - O(1) lookup
          const emailLower = rawEmail.toLowerCase();
          if (seenEmails.has(emailLower)) {
            errors.push({
              row: rowNumber,
              field: 'email',
              message: 'Email duplicado na planilha',
              value: rawEmail,
            });
            continue;
          }

          seenEmails.add(emailLower);

          // Sanitizar dados
          const sanitizedName = sanitizeText(rawName);
          const sanitizedEmail = sanitizeText(rawEmail).toLowerCase();

          // Adicionar membro válido
          members.push({
            name: sanitizedName,
            email: sanitizedEmail,
          });
        }

        // Resolver com resultado
        resolve({
          success: errors.length === 0,
          members,
          errors,
        });
      } catch (error) {
        resolve({
          success: false,
          members: [],
          errors: [
            {
              row: 0,
              field: 'name',
              message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            },
          ],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        members: [],
        errors: [{ row: 0, field: 'name', message: 'Erro ao ler arquivo' }],
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Valida extensão do arquivo
 *
 * @param file Arquivo para validar
 * @returns true se é .xlsx ou .xls
 */
export function isValidExcelFile(file: File): boolean {
  const validExtensions = ['.xlsx', '.xls'];
  const fileName = file.name.toLowerCase();
  return validExtensions.some((ext) => fileName.endsWith(ext));
}

/**
 * Valida tamanho do arquivo (máx 5MB)
 *
 * @param file Arquivo para validar
 * @returns true se <= 5MB
 */
export function isValidFileSize(file: File): boolean {
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSizeInBytes;
}
