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
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-600">Consolidando resultados...</p>
          <p className="text-sm text-gray-500 mt-2">Processando {members.length} membros</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-900 text-lg mb-2">Erro ao carregar resultados</p>
              <p className="text-red-700">{error}</p>
              <button
                onClick={onBack}
                className="mt-6 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                ← Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Resultados Consolidados</h1>
                <p className="text-gray-600 mt-1">{evaluation.title}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Gerado em: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Voltar
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Membros Avaliados', value: totalMembers, icon: '👥', color: 'from-blue-600 to-indigo-600' },
            { label: 'Média Geral', value: overallAverage.toFixed(2), icon: '📊', color: 'from-purple-600 to-pink-600' },
            { label: 'Maior Pontuação', value: highestScore.toFixed(2), icon: '🏆', color: 'from-green-600 to-emerald-600' },
            { label: 'Menor Pontuação', value: lowestScore.toFixed(2), icon: '📈', color: 'from-orange-600 to-red-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">{stat.label}</span>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Team Chart */}
        {sortedResults.length > 0 && (
          <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Comparação da Equipe
            </h3>
            <TeamComparisonChart
              data={sortedResults.map((r) => ({
                name: r.member.name,
                average: r.averages.overall,
                responses: r.totalResponses,
              }))}
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="overall">Média Geral (Maior → Menor)</option>
              <option value="name">Nome (A → Z)</option>
              <option value="responses">Avaliações Recebidas</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <button
              onClick={handleExport}
              className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar Resultados (.txt)
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Results List */}
      {sortedResults.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
          <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg text-gray-600">Nenhum resultado disponível ainda</p>
        </div>
      ) : (
        <div className="space-y-6">
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
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-8 border border-amber-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-4">⚠️ Confidencialidade dos Resultados</h3>
            <ul className="space-y-2.5">
              {[
                'Estes resultados são confidenciais e devem ser compartilhados apenas em contexto de desenvolvimento profissional',
                'As avaliações são 100% anônimas - não é possível identificar quem avaliou quem',
                'Use os feedbacks de forma construtiva para apoiar o crescimento da equipe',
                'Recomenda-se realizar sessões individuais de feedback com cada membro'
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
    </div>
  );
}
