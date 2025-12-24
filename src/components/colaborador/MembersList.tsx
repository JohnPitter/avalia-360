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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {evaluationTitle}
                </h1>
                <p className="text-gray-600 mt-1">
                  Olá, <span className="font-semibold text-emerald-600">{currentMember.name}</span>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </span>
          </button>
        </div>

        {/* Progress Section */}
        <div className="mt-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">Seu Progresso</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {progress}%
              </span>
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-emerald-700">{evaluatedMemberIds.length}</span> de{' '}
            <span className="font-semibold text-gray-700">{membersToEvaluate.length}</span> avaliações completadas
          </p>
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  🎉 Parabéns! Você completou todas as avaliações!
                </h3>
                <p className="text-gray-700">
                  Suas respostas foram salvas com sucesso e estão 100% anônimas e criptografadas. Obrigado pela sua participação sincera!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Members List */}
      {!isComplete && (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Selecione quem avaliar</h2>
          </div>

          <div className="space-y-4">
            {membersToEvaluate.map((member, index) => {
              const isEvaluated = evaluatedMemberIds.includes(member.id);

              return (
                <button
                  key={member.id}
                  onClick={() => !isEvaluated && onSelectMember(member.id)}
                  disabled={isEvaluated}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                    isEvaluated
                      ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 cursor-not-allowed'
                      : 'border-gray-200 bg-gradient-to-br from-gray-50 to-purple-50 hover:border-emerald-400 hover:shadow-lg hover:scale-[1.01] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Number Badge */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0 ${
                      isEvaluated
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                        : 'bg-gradient-to-br from-purple-600 to-pink-600'
                    }`}>
                      {isEvaluated ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xl">{index + 1}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md ${
                      isEvaluated
                        ? 'bg-green-100 text-green-700'
                        : 'bg-white text-gray-700 border-2 border-gray-200'
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {member.name}
                      </h3>
                      {isEvaluated ? (
                        <p className="text-sm font-semibold text-green-600 flex items-center gap-1.5 mt-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Avaliação concluída
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">
                          Clique para avaliar
                        </p>
                      )}
                    </div>

                    {/* Arrow Icon */}
                    {!isEvaluated && (
                      <svg className="w-7 h-7 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isComplete && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Como funciona</h3>
              <ul className="space-y-3">
                {[
                  { text: 'Você precisa avaliar todos os membros da lista', icon: '👥' },
                  { text: 'Cada avaliação tem 4 perguntas e espaço para comentários', icon: '📝' },
                  { text: 'Suas respostas são 100% anônimas e criptografadas', icon: '🔒' },
                  { text: 'Seja sincero e construtivo nos feedbacks', icon: '💬' },
                  { text: 'Você pode pausar e voltar depois usando o mesmo código', icon: '⏸️' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-lg">{item.icon}</span>
                    </div>
                    <p className="text-gray-700 pt-1.5">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
