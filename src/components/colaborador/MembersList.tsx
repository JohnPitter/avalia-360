import type { TeamMember } from '@/types';

/**
 * Componente de Lista de Membros para Avaliar
 * Exibe progresso e permite selecionar membro para avaliar
 */

interface MembersListProps {
  evaluationTitle: string;
  currentMember: TeamMember;
  allMembers: TeamMember[];
  evaluatedMemberIds: string[];
  onSelectMember: (memberId: string) => void;
  onLogout: () => void;
}

export function MembersList({
  evaluationTitle,
  currentMember,
  allMembers,
  evaluatedMemberIds,
  onSelectMember,
  onLogout,
}: MembersListProps) {
  // Filtra para não avaliar a si mesmo
  const membersToEvaluate = allMembers.filter(
    (m) => m.id !== currentMember.id
  );

  const remainingMembers = membersToEvaluate.filter(
    (m) => !evaluatedMemberIds.includes(m.id)
  );

  const isComplete = remainingMembers.length === 0;
  const progress = Math.round(
    (evaluatedMemberIds.length / membersToEvaluate.length) * 100
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">
              {evaluationTitle}
            </h1>
            <p className="text-gray-600 mt-1">
              Olá, <span className="font-semibold">{currentMember.name}</span>
            </p>
          </div>
          <button onClick={onLogout} className="btn btn-secondary btn-sm">
            Sair
          </button>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Seu Progresso
            </span>
            <span className="text-sm font-bold text-primary-600">
              {progress}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {evaluatedMemberIds.length} de {membersToEvaluate.length} avaliações
            completadas
          </p>
        </div>

        {/* Mensagem de Conclusão */}
        {isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
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
              <div>
                <h3 className="font-bold text-green-900 text-lg">
                  Parabéns! Você completou todas as avaliações! 🎉
                </h3>
                <p className="text-green-800 text-sm mt-1">
                  Suas respostas foram salvas com sucesso. Obrigado pela
                  participação!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Membros */}
      {!isComplete && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Selecione quem avaliar
          </h2>

          <div className="space-y-3">
            {membersToEvaluate.map((member) => {
              const isEvaluated = evaluatedMemberIds.includes(member.id);

              return (
                <button
                  key={member.id}
                  onClick={() => !isEvaluated && onSelectMember(member.id)}
                  disabled={isEvaluated}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isEvaluated
                      ? 'border-green-300 bg-green-50 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-primary-500 hover:bg-primary-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          isEvaluated
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {member.name}
                        </h3>
                        {isEvaluated && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ Avaliação concluída
                          </p>
                        )}
                      </div>
                    </div>

                    {isEvaluated ? (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-green-600"
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
                    ) : (
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Instruções */}
      {!isComplete && (
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">
            💡 Como funciona:
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              • Você precisa avaliar <strong>todos os membros</strong> da lista
            </li>
            <li>
              • Cada avaliação tem <strong>4 perguntas</strong> e espaço para
              comentários
            </li>
            <li>
              • Suas respostas são <strong>100% anônimas</strong> e
              criptografadas
            </li>
            <li>
              • Seja sincero e construtivo nos feedbacks
            </li>
            <li>
              • Você pode pausar e voltar depois usando o mesmo código
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
