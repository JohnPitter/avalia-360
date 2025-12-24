/**
 * Utilitário para processar arquivo Excel
 * Faz parsing, validação e sanitização dos dados
 *
 * Segurança:
 * - Valida estrutura do arquivo
 * - Sanitiza inputs contra XSS
 * - Valida formato de emails
 * - Remove duplicatas
 * - Limita quantidade de membros
 */

import * as XLSX from 'xlsx';
import { isValidEmail, isValidName } from './validation';
import { sanitizeText } from './sanitization';
import type { MemberData } from '@/services/firebase';

/**
 * Resultado do parsing do Excel
 */
export interface ExcelParseResult {
  success: boolean;
  members: MemberData[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

/**
 * Configurações de parsing
 */
export interface ExcelParseOptions {
  maxMembers?: number;
  allowDuplicateEmails?: boolean;
  strictValidation?: boolean;
}

/**
 * Estrutura esperada de uma linha do Excel
 */
interface ExcelRow {
  Nome?: string | number;
  Email?: string | number;
  [key: string]: string | number | undefined;
}

/**
 * Parseia arquivo Excel e extrai dados de membros
 *
 * @param file - Arquivo Excel (.xlsx, .xls)
 * @param options - Opções de parsing
 * @returns Resultado com membros válidos e erros
 *
 * @example
 * ```tsx
 * const result = await parseExcelFile(file);
 * if (result.success) {
 *   addMembersToEvaluation(result.members);
 * } else {
 *   showErrors(result.errors);
 * }
 * ```
 */
export async function parseExcelFile(
  file: File,
  options: ExcelParseOptions = {}
): Promise<ExcelParseResult> {
  const {
    maxMembers = 100,
    allowDuplicateEmails = false,
    strictValidation = true,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  const members: MemberData[] = [];

  try {
    // Validar tipo de arquivo
    if (!isValidExcelFile(file)) {
      errors.push(
        'Formato de arquivo inválido. Use arquivos .xlsx ou .xls'
      );
      return {
        success: false,
        members: [],
        errors,
        warnings,
        totalRows: 0,
        validRows: 0,
      };
    }

    // Validar tamanho do arquivo (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('Arquivo muito grande. Tamanho máximo: 5MB');
      return {
        success: false,
        members: [],
        errors,
        warnings,
        totalRows: 0,
        validRows: 0,
      };
    }

    // Ler arquivo
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Validar que tem pelo menos uma aba
    if (workbook.SheetNames.length === 0) {
      errors.push('Arquivo Excel vazio');
      return {
        success: false,
        members: [],
        errors,
        warnings,
        totalRows: 0,
        validRows: 0,
      };
    }

    // Pegar primeira aba
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Converter para JSON
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      errors.push('Planilha vazia. Adicione pelo menos um membro');
      return {
        success: false,
        members: [],
        errors,
        warnings,
        totalRows: 0,
        validRows: 0,
      };
    }

    // Validar headers
    const firstRow = rows[0];
    if (!firstRow.Nome && !firstRow.Email) {
      errors.push(
        'Cabeçalhos inválidos. Use as colunas: Nome | Email'
      );
      return {
        success: false,
        members: [],
        errors,
        warnings,
        totalRows: rows.length,
        validRows: 0,
      };
    }

    // Set para detectar emails duplicados
    const seenEmails = new Set<string>();

    // Processar cada linha
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 porque Excel começa em 1 e tem header

      // Validar que a linha tem dados
      if (!row.Nome || !row.Email) {
        warnings.push(`Linha ${rowNumber}: Nome ou Email vazio - ignorado`);
        continue;
      }

      // Converter para string e sanitizar
      const rawName = String(row.Nome).trim();
      const rawEmail = String(row.Email).trim().toLowerCase();

      const name = sanitizeText(rawName);
      const email = sanitizeText(rawEmail);

      // Validar nome
      if (!isValidName(name)) {
        errors.push(
          `Linha ${rowNumber}: Nome inválido "${rawName}" (mín 2 caracteres, máx 100)`
        );
        continue;
      }

      // Validar email
      if (!isValidEmail(email)) {
        errors.push(`Linha ${rowNumber}: Email inválido "${rawEmail}"`);
        continue;
      }

      // Verificar duplicatas
      if (seenEmails.has(email)) {
        if (!allowDuplicateEmails) {
          errors.push(
            `Linha ${rowNumber}: Email duplicado "${email}"`
          );
          continue;
        } else {
          warnings.push(
            `Linha ${rowNumber}: Email duplicado "${email}" - permitido`
          );
        }
      }

      // Verificar limite de membros
      if (members.length >= maxMembers) {
        warnings.push(
          `Limite de ${maxMembers} membros atingido. Linhas restantes foram ignoradas.`
        );
        break;
      }

      // Adicionar membro válido
      seenEmails.add(email);
      members.push({ name, email });
    }

    // Validações finais
    if (members.length === 0) {
      errors.push('Nenhum membro válido encontrado no arquivo');
    }

    if (strictValidation && members.length < 2) {
      errors.push('Mínimo de 2 membros necessários para criar avaliação 360°');
    }

    return {
      success: members.length > 0 && errors.length === 0,
      members,
      errors,
      warnings,
      totalRows: rows.length,
      validRows: members.length,
    };
  } catch (error) {
    errors.push(
      error instanceof Error
        ? `Erro ao processar arquivo: ${error.message}`
        : 'Erro desconhecido ao processar arquivo'
    );

    return {
      success: false,
      members: [],
      errors,
      warnings,
      totalRows: 0,
      validRows: 0,
    };
  }
}

/**
 * Valida se o arquivo é um Excel válido
 */
function isValidExcelFile(file: File): boolean {
  const validExtensions = ['.xlsx', '.xls'];
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];

  const hasValidExtension = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  const hasValidMimeType = validMimeTypes.includes(file.type);

  return hasValidExtension || hasValidMimeType;
}

/**
 * Valida se um array de membros tem pelo menos o mínimo necessário
 */
export function validateMemberCount(
  members: MemberData[],
  min: number = 2,
  max: number = 100
): { valid: boolean; error?: string } {
  if (members.length < min) {
    return {
      valid: false,
      error: `Mínimo de ${min} membros necessários (você tem ${members.length})`,
    };
  }

  if (members.length > max) {
    return {
      valid: false,
      error: `Máximo de ${max} membros permitidos (você tem ${members.length})`,
    };
  }

  return { valid: true };
}
