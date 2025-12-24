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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            🎉 Avaliação Criada!
          </h2>
          <p className="text-xl text-gray-600 mb-2">{evaluationTitle}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {members.length} {members.length === 1 ? 'membro adicionado' : 'membros adicionados'}
          </div>
        </div>
      </div>

      {/* Manager Token */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl border-2 border-amber-200 p-8 shadow-xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              🔑 Seu Token de Gestor
            </h3>
            <p className="text-amber-800 font-medium">
              ⚠️ IMPORTANTE: Guarde este token com segurança! Você precisará dele para acessar o dashboard e visualizar resultados.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-4 border-2 border-amber-200 shadow-inner">
          <code className="text-base font-mono break-all text-gray-800 leading-relaxed select-all">
            {managerToken}
          </code>
        </div>

        <button
          onClick={() => copyToClipboard(managerToken, 'token')}
          className={`w-full py-4 px-6 font-semibold rounded-xl shadow-lg transition-all duration-200 ${
            copiedToken
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {copiedToken ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Token Copiado!
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar Token
            </span>
          )}
        </button>
      </div>

      {/* Member Codes */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">📧 Códigos dos Membros</h3>
            <p className="text-gray-600 mt-1">
              Envie estes códigos por email para cada membro
            </p>
          </div>
          <button
            onClick={downloadCodes}
            className="hidden sm:flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Baixar Todos
          </button>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {members.map((member, index) => (
            <div
              key={member.id}
              className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-5 border-2 border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Number Badge */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg flex-shrink-0">
                  {index + 1}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate text-lg">
                    {member.name}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{member.email}</p>
                </div>

                {/* Access Code */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="bg-white rounded-xl px-4 py-3 border-2 border-blue-200 shadow-sm">
                    <code className="text-2xl font-bold text-blue-600 font-mono tracking-wider">
                      {member.accessCode}
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(member.accessCode, member.id)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                      copiedCodes.has(member.id)
                        ? 'bg-green-500 text-white scale-110'
                        : 'bg-white border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:scale-110'
                    }`}
                    title="Copiar código"
                  >
                    {copiedCodes.has(member.id) ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Download Button */}
        <button
          onClick={downloadCodes}
          className="sm:hidden w-full mt-4 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Baixar Todos os Códigos
        </button>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📋 Próximos Passos</h3>
            <ol className="space-y-3">
              {[
                { text: 'Salve seu token em local seguro (gerenciador de senhas recomendado)', icon: '🔐' },
                { text: 'Envie os códigos de 6 dígitos para cada membro por email', icon: '📧' },
                { text: 'Instrua os membros a acessarem o portal do colaborador', icon: '👥' },
                { text: `Cada membro deve avaliar todos os outros (${members.length - 1} avaliações cada)`, icon: '⭐' },
                { text: 'Acompanhe o progresso em tempo real no dashboard', icon: '📊' },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-lg">{step.icon}</span>
                  </div>
                  <p className="text-gray-700 pt-1.5">
                    <strong className="text-gray-900">{i + 1}.</strong> {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        <button
          onClick={onContinue}
          className="w-full py-5 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <span className="flex items-center justify-center gap-3">
            <span>Ir para Dashboard</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
