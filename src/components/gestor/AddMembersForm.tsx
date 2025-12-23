import { useState } from 'react';
import { validateTeamMembers } from '@/utils/validation';
import { sanitizeText, sanitizeEmail } from '@/utils/sanitization';
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

  const handleImportExcel = () => {
    // TODO: Implementar import de Excel
    alert('Funcionalidade de import Excel será implementada em breve!');
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

      {/* Botão de Import Excel */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleImportExcel}
          className="btn btn-secondary w-full sm:w-auto"
        >
          📊 Importar do Excel
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Ou adicione os membros manualmente abaixo
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

        {/* Erros */}
        {errors.length > 0 && (
          <div className="alert-error">
            <p className="font-semibold mb-2">Erros encontrados:</p>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
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
