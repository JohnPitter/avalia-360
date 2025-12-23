import { useState, useEffect } from 'react';
import { ResultCard } from './ResultCard';
import { TeamComparisonChart } from '@/components/shared';
import type { Evaluation, TeamMember, ConsolidatedResult } from '@/types';
import { consolidateAllResults } from '@/services/firebase/response.service';

/**
 * Página de Resultados Consolidados
 * Exibe todas as avaliações consolidadas com médias e comentários
 */

interface ResultsPageProps {
  evaluation: Evaluation;
  members: TeamMember[];
  managerToken: string;
  onBack: () => void;
}

type SortOption = 'overall' | 'name' | 'responses';

export function ResultsPage({
  evaluation,
  members,
  managerToken,
  onBack,
}: ResultsPageProps) {
  const [results, setResults] = useState<ConsolidatedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('overall');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const consolidated = await consolidateAllResults(
        evaluation.id,
        members,
        managerToken
      );

      setResults(consolidated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar resultados'
      );
    } finally {
      setLoading(false);
    }
  };

  // Ordena resultados
  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'overall':
        return b.averages.overall - a.averages.overall;
      case 'name':
        return a.member.name.localeCompare(b.member.name);
      case 'responses':
        return b.totalResponses - a.totalResponses;
      default:
        return 0;
    }
  });

  // Estatísticas gerais
  const totalMembers = results.length;
  const overallAverage =
    results.reduce((sum, r) => sum + r.averages.overall, 0) / totalMembers || 0;
  const highestScore = Math.max(...results.map((r) => r.averages.overall), 0);
  const lowestScore = Math.min(...results.map((r) => r.averages.overall), 5);

  const handleExport = () => {
    const content = `Resultados - ${evaluation.title}
Data: ${new Date().toLocaleDateString('pt-BR')}

ESTATÍSTICAS GERAIS:
- Total de Membros Avaliados: ${totalMembers}
- Média Geral da Equipe: ${overallAverage.toFixed(2)}
- Maior Pontuação: ${highestScore.toFixed(2)}
- Menor Pontuação: ${lowestScore.toFixed(2)}

RESULTADOS INDIVIDUAIS:
${sortedResults
  .map(
    (result, index) => `
${index + 1}. ${result.member.name}
   Média Geral: ${result.averages.overall.toFixed(2)}
   - Satisfação: ${result.averages.question_1.toFixed(2)}
   - Proatividade: ${result.averages.question_2.toFixed(2)}
   - Qualidade: ${result.averages.question_3.toFixed(2)}
   - Trabalho em Equipe: ${result.averages.question_4.toFixed(2)}
   Avaliações Recebidas: ${result.totalResponses}

   PONTOS POSITIVOS:
   ${result.comments.positive.map((c, i) => `   ${i + 1}. ${c}`).join('\n   ')}

   PONTOS DE MELHORIA:
   ${result.comments.improvement.map((c, i) => `   ${i + 1}. ${c}`).join('\n   ')}
`
  )
  .join('\n' + '='.repeat(80) + '\n')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados-${evaluation.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Consolidando resultados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="alert-error mb-6">
          <p className="font-semibold">Erro:</p>
          <p>{error}</p>
          <button onClick={onBack} className="mt-4 btn btn-secondary">
            ← Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">
              Resultados Consolidados
            </h1>
            <p className="text-gray-600 mt-1">{evaluation.title}</p>
            <p className="text-sm text-gray-500">
              Gerado em: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
          <button onClick={onBack} className="btn btn-secondary">
            ← Voltar
          </button>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="stat-card bg-primary-50">
            <div className="stat-label">Membros Avaliados</div>
            <div className="stat-value text-primary-600">{totalMembers}</div>
          </div>

          <div className="stat-card bg-blue-50">
            <div className="stat-label">Média Geral</div>
            <div className="stat-value text-blue-600">
              {overallAverage.toFixed(2)}
            </div>
          </div>

          <div className="stat-card bg-green-50">
            <div className="stat-label">Maior Pontuação</div>
            <div className="stat-value text-green-600">
              {highestScore.toFixed(2)}
            </div>
          </div>

          <div className="stat-card bg-orange-50">
            <div className="stat-label">Menor Pontuação</div>
            <div className="stat-value text-orange-600">
              {lowestScore.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Team Comparison Chart */}
        <div className="card mt-6">
          <TeamComparisonChart
            data={sortedResults.map((r) => ({
              name: r.member.name,
              average: r.averages.overall,
              responses: r.totalResponses,
            }))}
          />
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          {/* Ordenação */}
          <div className="flex-1">
            <label className="form-label text-sm">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="form-input"
            >
              <option value="overall">Média Geral (Maior → Menor)</option>
              <option value="name">Nome (A → Z)</option>
              <option value="responses">Avaliações Recebidas</option>
            </select>
          </div>

          {/* Exportar */}
          <div className="flex-1 flex items-end">
            <button onClick={handleExport} className="btn btn-secondary w-full">
              💾 Exportar Resultados (.txt)
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Resultados */}
      {sortedResults.length === 0 ? (
        <div className="card text-center py-12">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-600">Nenhum resultado disponível ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedResults.map((result, index) => (
            <ResultCard
              key={result.member.id}
              result={result}
              rank={sortBy === 'overall' ? index + 1 : undefined}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="card bg-yellow-50 border border-yellow-200">
        <h3 className="font-semibold text-yellow-900 mb-2">
          ⚠️ Confidencialidade dos Resultados
        </h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>
            • Estes resultados são <strong>confidenciais</strong> e devem ser
            compartilhados apenas em contexto de desenvolvimento profissional
          </li>
          <li>
            • As avaliações são <strong>anônimas</strong> - não é possível
            identificar quem avaliou quem
          </li>
          <li>
            • Use os feedbacks de forma <strong>construtiva</strong> para apoiar
            o crescimento da equipe
          </li>
          <li>
            • Recomenda-se realizar sessões individuais de feedback com cada
            membro
          </li>
        </ul>
      </div>
    </div>
  );
}
