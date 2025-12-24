/**
 * Componente de Upload de Excel
 * Permite importar membros da equipe via arquivo Excel
 *
 * Funcionalidades:
 * - Upload de arquivo .xlsx/.xls
 * - Download de template
 * - Validação e preview dos dados
 * - Feedback visual de erros/avisos
 */

import { useState, useRef } from 'react';
import { parseExcelFile, type ExcelParseResult } from '@/utils/excelParser';
import {
  downloadExcelTemplate,
  downloadEmptyExcelTemplate,
} from '@/utils/excelTemplate';
import type { MemberData } from '@/services/firebase';

interface ExcelUploadProps {
  onMembersImported: (members: MemberData[]) => void;
  maxMembers?: number;
  disabled?: boolean;
}

export function ExcelUpload({
  onMembersImported,
  maxMembers = 100,
  disabled = false,
}: ExcelUploadProps) {
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setLoading(true);
    setParseResult(null);

    try {
      const result = await parseExcelFile(file, {
        maxMembers,
        allowDuplicateEmails: false,
        strictValidation: true,
      });

      setParseResult(result);

      if (result.success && result.members.length > 0) {
        onMembersImported(result.members);
      }
    } catch (error) {
      setParseResult({
        success: false,
        members: [],
        errors: [
          error instanceof Error
            ? error.message
            : 'Erro ao processar arquivo',
        ],
        warnings: [],
        totalRows: 0,
        validRows: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || loading) return;

    const file = e.dataTransfer.files?.[0] || null;
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !loading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleClickUpload = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Botões de Download Template */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={downloadExcelTemplate}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Baixar Template (com exemplos)
        </button>

        <button
          type="button"
          onClick={downloadEmptyExcelTemplate}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Baixar Template Vazio
        </button>
      </div>

      {/* Área de Upload */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClickUpload}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
          }
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleInputChange}
          disabled={disabled || loading}
          className="hidden"
        />

        <div className="space-y-3">
          {loading ? (
            <>
              <svg className="mx-auto h-12 w-12 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Processando arquivo...
              </p>
            </>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-base font-medium text-gray-900">
                  {dragActive
                    ? 'Solte o arquivo aqui'
                    : 'Clique ou arraste o arquivo Excel'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Formatos suportados: .xlsx, .xls (máx 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Resultado do Parse */}
      {parseResult && (
        <div className="space-y-3">
          {/* Resumo */}
          {parseResult.totalRows > 0 && (
            <div className={`rounded-xl p-4 ${
              parseResult.success
                ? 'bg-green-50 border-2 border-green-200'
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {parseResult.success ? (
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${
                    parseResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {parseResult.success
                      ? `✅ ${parseResult.validRows} membro(s) importado(s) com sucesso!`
                      : `❌ Erro ao importar membros`
                    }
                  </p>
                  <p className={`text-sm mt-1 ${
                    parseResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Total de linhas: {parseResult.totalRows} |
                    Válidas: {parseResult.validRows} |
                    Erros: {parseResult.errors.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Erros */}
          {parseResult.errors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="font-semibold text-red-900 mb-2">❌ Erros encontrados:</p>
              <ul className="space-y-1 text-sm text-red-700">
                {parseResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Avisos */}
          {parseResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="font-semibold text-yellow-900 mb-2">⚠️ Avisos:</p>
              <ul className="space-y-1 text-sm text-yellow-700">
                {parseResult.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview dos Membros */}
          {parseResult.success && parseResult.members.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="font-semibold text-blue-900 mb-3">
                📋 Preview dos membros importados:
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {parseResult.members.map((member, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
