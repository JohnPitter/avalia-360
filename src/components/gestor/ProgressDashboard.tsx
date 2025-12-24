import { memo, useMemo } from 'react';
import type { Evaluation, TeamMember } from '@/types';

/**
 * Dashboard de Progresso da Avaliação
 * Exibe progresso geral e individual dos membros
 * Otimizado com React.memo e useMemo para cálculos complexos
 */

interface MemberProgress {
  member: TeamMember;
  percentage: number;
}

interface ProgressDashboardProps {
  evaluation: Evaluation;
  members: TeamMember[];
  totalResponses: number;
  expectedResponses: number;
  onViewResults: () => void;
  onLogout: () => void;
}

const ProgressDashboardComponent = ({
  evaluation,
  members,
  totalResponses,
  expectedResponses,
  onViewResults,
  onLogout,
}: ProgressDashboardProps) => {
  // Memoize expensive calculations
  const overallProgress = useMemo(
    () => Math.round((totalResponses / expectedResponses) * 100),
    [totalResponses, expectedResponses]
  );

  const isComplete = useMemo(
    () => totalResponses >= expectedResponses,
    [totalResponses, expectedResponses]
  );

  const memberProgressList = useMemo(() => {
    return members.map((member): MemberProgress => {
      const percentage = Math.round(
        (member.completed_evaluations / member.total_evaluations) * 100
      );
      return { member, percentage };
    });
  }, [members]);

  const completedMembers = useMemo(
    () => memberProgressList.filter((mp) => mp.percentage === 100).length,
    [memberProgressList]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {evaluation.title}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      evaluation.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : evaluation.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      evaluation.status === 'active'
                        ? 'bg-green-500 animate-pulse'
                        : evaluation.status === 'completed'
                        ? 'bg-blue-500'
                        : 'bg-gray-500'
                    }`} />
                    {evaluation.status === 'active'
                      ? 'Ativa'
                      : evaluation.status === 'completed'
                      ? 'Completa'
                      : 'Rascunho'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(evaluation.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-mono mt-2">
              ID: {evaluation.id}
            </p>
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
      </div>

      {/* Progresso Geral */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Progresso Geral</h2>
        </div>

        {/* Progress Ring */}
        <div className="grid md:grid-cols-2 gap-8 mb-6">
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${overallProgress * 5.53} 553`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {overallProgress}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Completo</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total de Membros</div>
                  <div className="text-3xl font-bold text-gray-900">{members.length}</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Completaram</div>
                  <div className="text-3xl font-bold text-green-600">{completedMembers}</div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Pendentes</div>
                  <div className="text-3xl font-bold text-orange-600">{members.length - completedMembers}</div>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Avaliações Recebidas</span>
            <span className="text-sm font-bold text-blue-600">{totalResponses} / {expectedResponses}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* View Results Button */}
        {isComplete && (
          <div className="mt-6">
            <button
              onClick={onViewResults}
              className="w-full py-5 px-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ver Resultados Consolidados
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Progresso Individual */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Progresso Individual</h2>
        </div>

        <div className="space-y-4">
          {memberProgressList.map(({ member, percentage }) => (
            <div
              key={member.id}
              className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-purple-300 transition-all duration-200"
            >
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
                  percentage === 100
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                    : percentage > 50
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                    : 'bg-gradient-to-br from-orange-500 to-red-500'
                }`}>
                  {member.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{member.name}</h3>
                  <p className="text-sm text-gray-600">
                    {member.completed_evaluations} de {member.total_evaluations} avaliações completadas
                  </p>
                  {member.last_access_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Último acesso: {new Date(member.last_access_date).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

                {/* Percentage Badge */}
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${
                    percentage === 100
                      ? 'text-green-600'
                      : percentage > 50
                      ? 'text-yellow-600'
                      : 'text-orange-600'
                  }`}>
                    {percentage}%
                  </div>
                  {percentage === 100 && (
                    <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage === 100
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : percentage > 50
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-orange-500 to-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      {!isComplete && (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-8 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Dicas para aumentar a participação</h3>
              <ul className="space-y-3">
                {[
                  'Envie lembretes por email para os membros que ainda não completaram',
                  'Reforce a importância da avaliação 360° para o desenvolvimento da equipe',
                  'Lembre que as avaliações são anônimas e confidenciais',
                  'Defina um prazo claro para conclusão das avaliações',
                  'Disponibilize um canal para tirar dúvidas sobre o processo'
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 pt-0.5">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const ProgressDashboard = memo(ProgressDashboardComponent);
