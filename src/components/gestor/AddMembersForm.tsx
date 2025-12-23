import { useState, useRef } from 'react';
import { validateTeamMembers } from '@/utils/validation';
import { sanitizeText, sanitizeEmail } from '@/utils/sanitization';
import {
  downloadExcelTemplate,
  parseExcelFile,
  isValidExcelFile,
  isValidFileSize,
  type ExcelError,
} from '@/utils/excel';
import type { MemberData } from '@/services/firebase';

/**
 * Componente para Adicionar Membros da Equipe
 * Permite adicionar membros manualmente ou importar de Excel
 */

interface AddMembersFormProps {
  evaluationTitle: string;
  onSubmit: (members: MemberData[]) => void;
  onBack: () => void;
}

interface MemberInput {
  name: string;
  email: string;
}

export function AddMembersForm({
  evaluationTitle,
  onSubmit,
  onBack,
}: AddMembersFormProps) {
  const [members, setMembers] = useState<MemberInput[]>([
    { name: '', email: '' },
    { name: '', email: '' },
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const [excelErrors, setExcelErrors] = useState<ExcelError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMember = () => {
    setMembers([...members, { name: '', email: '' }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 2) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filtra membros vazios
    const filledMembers = members.filter(
      (m) => m.name.trim() || m.email.trim()
    );

    // Sanitiza dados
    const sanitizedMembers = filledMembers.map((m) => ({
      name: sanitizeText(m.name, 100),
      email: sanitizeEmail(m.email),
    }));

    // Valida
    const validation = validateTeamMembers(sanitizedMembers);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    onSubmit(sanitizedMembers);
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate('template-avaliacao-360.xlsx');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limpar erros anteriores
    setErrors([]);
    setExcelErrors([]);

    // Validar extensão
    if (!isValidExcelFile(file)) {
      setErrors(['Formato inválido. Use arquivos .xlsx ou .xls']);
      return;
    }

    // Validar tamanho
    if (!isValidFileSize(file)) {
      setErrors(['Arquivo muito grande. Tamanho máximo: 5MB']);
      return;
    }

    // Fazer parse
    setIsUploading(true);
    try {
      const result = await parseExcelFile(file);

      if (!result.success) {
        setExcelErrors(result.errors);
        return;
      }

      if (result.members.length === 0) {
        setErrors(['Nenhum membro válido encontrado na planilha']);
        return;
      }

      // Substituir membros existentes pelos importados
      setMembers(
        result.members.map((m) => ({
          name: m.name,
          email: m.email,
        }))
      );

      // Feedback de sucesso
      setErrors([]);
      setExcelErrors([]);
    } catch (error) {
      setErrors([
        `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      ]);
    } finally {
      setIsUploading(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="card max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-900">
          Adicionar Membros da Equipe
        </h2>
        <p className="text-gray-600 mt-2">
          Avaliação: <span className="font-semibold">{evaluationTitle}</span>
        </p>
      </div>

      {/* Botões de Excel */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Download Template */}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Baixar Template Excel
          </button>

          {/* Upload Excel */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleImportClick}
            disabled={isUploading}
            className="btn btn-primary flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {isUploading ? 'Processando...' : 'Importar do Excel'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          💡 Baixe o template, preencha e importe. Ou adicione os membros manualmente abaixo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lista de Membros */}
        <div className="space-y-4">
          {members.map((member, index) => (
            <div
              key={index}
              className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                {index + 1}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="form-group">
                  <label
                    htmlFor={`name-${index}`}
                    className="form-label text-sm"
                  >
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id={`name-${index}`}
                    value={member.name}
                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                    className="form-input"
                    placeholder="João Silva"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label
                    htmlFor={`email-${index}`}
                    className="form-label text-sm"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id={`email-${index}`}
                    value={member.email}
                    onChange={(e) =>
                      updateMember(index, 'email', e.target.value)
                    }
                    className="form-input"
                    placeholder="joao@empresa.com"
                    required
                  />
                </div>
              </div>

              {/* Botão Remover */}
              {members.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="flex-shrink-0 text-red-600 hover:text-red-700 p-2"
                  title="Remover membro"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Botão Adicionar Mais */}
        <button
          type="button"
          onClick={addMember}
          className="btn btn-secondary w-full"
        >
          + Adicionar Mais Membros
        </button>

        {/* Contador */}
        <div className="text-center text-sm text-gray-600">
          {members.length} {members.length === 1 ? 'membro' : 'membros'}{' '}
          adicionado{members.length === 1 ? '' : 's'} (mínimo: 2)
        </div>

        {/* Erros de Validação */}
        {errors.length > 0 && (
          <div className="alert-error">
            <p className="font-semibold mb-2">❌ Erros encontrados:</p>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Erros de Excel */}
        {excelErrors.length > 0 && (
          <div className="alert-error">
            <p className="font-semibold mb-2">❌ Erros no arquivo Excel:</p>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-100 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left">Linha</th>
                    <th className="px-2 py-1 text-left">Campo</th>
                    <th className="px-2 py-1 text-left">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {excelErrors.map((error, index) => (
                    <tr key={index} className="border-t border-red-200">
                      <td className="px-2 py-1">{error.row}</td>
                      <td className="px-2 py-1 capitalize">{error.field}</td>
                      <td className="px-2 py-1">
                        {error.message}
                        {error.value && (
                          <span className="text-red-600 font-mono ml-1">
                            ({error.value})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-2">
              Corrija os erros no arquivo Excel e importe novamente.
            </p>
          </div>
        )}

        {/* Informações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ Como funciona:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Cada membro receberá um <strong>código de 6 dígitos</strong> por
              email
            </li>
            <li>
              • Cada membro avaliará <strong>todos os outros</strong> membros (N-1
              avaliações)
            </li>
            <li>• As avaliações são <strong>anônimas e criptografadas</strong></li>
            <li>
              • Você poderá acompanhar o progresso no{' '}
              <strong>dashboard</strong>
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="btn btn-secondary flex-1"
          >
            ← Voltar
          </button>
          <button type="submit" className="btn btn-primary flex-1">
            Finalizar e Enviar Convites
          </button>
        </div>
      </form>
    </div>
  );
}
