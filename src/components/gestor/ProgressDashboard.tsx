import type { Evaluation, TeamMember } from '@/types';

/**
 * Dashboard de Progresso da Avaliação
 * Exibe progresso geral e individual dos membros
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

export function ProgressDashboard({
  evaluation,
  members,
  totalResponses,
  expectedResponses,
  onViewResults,
  onLogout,
}: ProgressDashboardProps) {
  const overallProgress = Math.round(
    (totalResponses / expectedResponses) * 100
  );

  const isComplete = totalResponses >= expectedResponses;

  const getMemberProgress = (member: TeamMember): MemberProgress => {
    const percentage = Math.round(
      (member.completed_evaluations / member.total_evaluations) * 100
    );

    return { member, percentage };
  };

  const memberProgressList = members.map(getMemberProgress);

  const completedMembers = memberProgressList.filter(
    (mp) => mp.percentage === 100
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">
              {evaluation.title}
            </h1>
            <p className="text-gray-600 mt-1">
              ID: <code className="text-sm font-mono">{evaluation.id}</code>
            </p>
            <p className="text-gray-600">
              Criado em:{' '}
              {new Date(evaluation.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <button onClick={onLogout} className="btn btn-secondary">
            Sair
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
              evaluation.status === 'active'
                ? 'bg-green-100 text-green-800'
                : evaluation.status === 'completed'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {evaluation.status === 'active'
              ? '✓ Ativa'
              : evaluation.status === 'completed'
              ? '✓ Completa'
              : '📝 Rascunho'}
          </span>
        </div>
      </div>

      {/* Progresso Geral */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Progresso Geral
        </h2>

        {/* Barra de Progresso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Avaliações Completadas
            </span>
            <span className="text-sm font-bold text-primary-600">
              {overallProgress}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {totalResponses} de {expectedResponses} avaliações recebidas
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="stat-label">Total de Membros</div>
            <div className="stat-value">{members.length}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Membros que Completaram</div>
            <div className="stat-value text-green-600">
              {completedMembers}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Membros Pendentes</div>
            <div className="stat-value text-orange-600">
              {members.length - completedMembers}
            </div>
          </div>
        </div>

        {/* Botão Ver Resultados */}
        {isComplete && (
          <div className="mt-6">
            <button onClick={onViewResults} className="btn btn-primary w-full">
              🎉 Ver Resultados Consolidados
            </button>
          </div>
        )}
      </div>

      {/* Progresso Individual */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Progresso Individual
        </h2>

        <div className="space-y-4">
          {memberProgressList.map(({ member, percentage }) => (
            <div
              key={member.id}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">
                    {member.completed_evaluations} de {member.total_evaluations}{' '}
                    avaliações completadas
                  </p>
                  {member.last_access_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Último acesso:{' '}
                      {new Date(member.last_access_date).toLocaleString(
                        'pt-BR'
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg font-bold ${
                      percentage === 100
                        ? 'text-green-600'
                        : percentage > 50
                        ? 'text-yellow-600'
                        : 'text-orange-600'
                    }`}
                  >
                    {percentage}%
                  </span>

                  {percentage === 100 && (
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
                  )}
                </div>
              </div>

              {/* Barra de Progresso Individual */}
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${
                    percentage === 100
                      ? 'bg-green-500'
                      : percentage > 50
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dicas */}
      {!isComplete && (
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">
            💡 Dicas para aumentar a participação:
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              • Envie lembretes por email para os membros que ainda não
              completaram
            </li>
            <li>
              • Reforce a importância da avaliação 360° para o desenvolvimento
              da equipe
            </li>
            <li>
              • Lembre que as avaliações são <strong>anônimas</strong> e{' '}
              <strong>confidenciais</strong>
            </li>
            <li>
              • Defina um prazo claro para conclusão das avaliações
            </li>
            <li>
              • Disponibilize um canal para tirar dúvidas sobre o processo
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
