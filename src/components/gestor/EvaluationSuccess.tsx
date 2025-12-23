import { useState } from 'react';
import type { MemberWithAccessCode } from '@/services/firebase';

/**
 * Componente de Sucesso na Criação de Avaliação
 * Exibe token do gestor e códigos de acesso dos membros
 */

interface EvaluationSuccessProps {
  evaluationId: string;
  evaluationTitle: string;
  managerToken: string;
  members: MemberWithAccessCode[];
  onContinue: () => void;
}

export function EvaluationSuccess({
  evaluationId,
  evaluationTitle,
  managerToken,
  members,
  onContinue,
}: EvaluationSuccessProps) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, type: 'token' | string) => {
    try {
      await navigator.clipboard.writeText(text);

      if (type === 'token') {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      } else {
        setCopiedCodes(new Set([...copiedCodes, type]));
        setTimeout(() => {
          setCopiedCodes((prev) => {
            const next = new Set(prev);
            next.delete(type);
            return next;
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const downloadCodes = () => {
    const content = `Avaliação 360°: ${evaluationTitle}
ID da Avaliação: ${evaluationId}

TOKEN DO GESTOR (GUARDE COM SEGURANÇA):
${managerToken}

CÓDIGOS DE ACESSO DOS MEMBROS:
${members
  .map((m, i) => `${i + 1}. ${m.name} (${m.email}): ${m.accessCode}`)
  .join('\n')}

⚠️ IMPORTANTE:
- Guarde o token do gestor para acessar o dashboard
- Envie os códigos de 6 dígitos para cada membro por email
- Os códigos são válidos por 7 dias
- As avaliações são anônimas e criptografadas

Gerado em: ${new Date().toLocaleString('pt-BR')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avaliacao-360-codigos-${evaluationId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card max-w-4xl mx-auto">
      {/* Header de Sucesso */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-900">
          Avaliação Criada com Sucesso!
        </h2>
        <p className="text-gray-600 mt-2">{evaluationTitle}</p>
      </div>

      {/* Token do Gestor */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3 mb-3">
          <svg
            className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900 text-lg">
              Seu Token de Acesso (Gestor)
            </h3>
            <p className="text-yellow-800 text-sm mt-1">
              ⚠️ IMPORTANTE: Guarde este token em local seguro! Você precisará
              dele para acessar o dashboard e os resultados.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-3">
          <code className="text-sm font-mono break-all text-gray-800">
            {managerToken}
          </code>
        </div>

        <button
          onClick={() => copyToClipboard(managerToken, 'token')}
          className="btn btn-secondary w-full"
        >
          {copiedToken ? '✓ Copiado!' : '📋 Copiar Token'}
        </button>
      </div>

      {/* Códigos de Acesso dos Membros */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">
            Códigos de Acesso dos Membros
          </h3>
          <span className="text-sm text-gray-600">
            {members.length} {members.length === 1 ? 'membro' : 'membros'}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Envie estes códigos por email para cada membro da equipe:
        </p>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {member.name}
                </p>
                <p className="text-sm text-gray-600 truncate">{member.email}</p>
              </div>

              <div className="flex items-center gap-3">
                <code className="text-xl font-bold text-primary-600 font-mono">
                  {member.accessCode}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(member.accessCode, member.id)
                  }
                  className="btn-icon"
                  title="Copiar código"
                >
                  {copiedCodes.has(member.id) ? '✓' : '📋'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={downloadCodes} className="btn btn-secondary flex-1">
          💾 Baixar Todos os Códigos
        </button>
        <button onClick={onContinue} className="btn btn-primary flex-1">
          Ir para Dashboard →
        </button>
      </div>

      {/* Instruções */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          📧 Próximos passos:
        </h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>
            <strong>Salve seu token</strong> em local seguro (recomendamos um
            gerenciador de senhas)
          </li>
          <li>
            <strong>Envie os códigos</strong> de 6 dígitos para cada membro por
            email
          </li>
          <li>
            Instrua os membros a acessar{' '}
            <strong>avalia360.app/colaborador</strong>
          </li>
          <li>
            Cada membro deverá avaliar <strong>todos os outros</strong> (
            {members.length - 1} avaliações cada)
          </li>
          <li>
            Acompanhe o progresso no <strong>dashboard</strong> usando seu token
          </li>
        </ol>
      </div>
    </div>
  );
}
