import { useState } from 'react';
import type { ConsolidatedResult } from '@/types';

/**
 * Card de Resultado Individual
 * Exibe médias e comentários de um membro avaliado
 */

interface ResultCardProps {
  result: ConsolidatedResult;
  rank?: number;
}

export function ResultCard({ result, rank }: ResultCardProps) {
  const [showComments, setShowComments] = useState(false);

  const { member, averages, comments, totalResponses } = result;

  // Determina cor baseada na média geral
  const getRatingColor = (average: number) => {
    if (average >= 4.5) return 'text-green-600';
    if (average >= 3.5) return 'text-blue-600';
    if (average >= 2.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getRatingBgColor = (average: number) => {
    if (average >= 4.5) return 'bg-green-100';
    if (average >= 3.5) return 'bg-blue-100';
    if (average >= 2.5) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  const getRatingLabel = (average: number) => {
    if (average >= 4.5) return 'Excelente';
    if (average >= 3.5) return 'Bom';
    if (average >= 2.5) return 'Adequado';
    if (average >= 1.5) return 'Abaixo da Média';
    return 'Insatisfatório';
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {rank && (
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-700">#{rank}</span>
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-600">
              {totalResponses} {totalResponses === 1 ? 'avaliação' : 'avaliações'} recebida
              {totalResponses === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Média Geral */}
        <div className="text-right">
          <div
            className={`text-4xl font-bold ${getRatingColor(averages.overall)}`}
          >
            {averages.overall.toFixed(2)}
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRatingBgColor(averages.overall)} ${getRatingColor(averages.overall)}`}>
            {getRatingLabel(averages.overall)}
          </div>
        </div>
      </div>

      {/* Médias por Pergunta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-label">Satisfação</div>
          <div className={`stat-value text-2xl ${getRatingColor(averages.question_1)}`}>
            {averages.question_1.toFixed(1)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-full rounded-full ${
                averages.question_1 >= 4
                  ? 'bg-green-500'
                  : averages.question_1 >= 3
                  ? 'bg-blue-500'
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${(averages.question_1 / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Proatividade</div>
          <div className={`stat-value text-2xl ${getRatingColor(averages.question_2)}`}>
            {averages.question_2.toFixed(1)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-full rounded-full ${
                averages.question_2 >= 4
                  ? 'bg-green-500'
                  : averages.question_2 >= 3
                  ? 'bg-blue-500'
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${(averages.question_2 / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Qualidade</div>
          <div className={`stat-value text-2xl ${getRatingColor(averages.question_3)}`}>
            {averages.question_3.toFixed(1)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-full rounded-full ${
                averages.question_3 >= 4
                  ? 'bg-green-500'
                  : averages.question_3 >= 3
                  ? 'bg-blue-500'
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${(averages.question_3 / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Trabalho em Equipe</div>
          <div className={`stat-value text-2xl ${getRatingColor(averages.question_4)}`}>
            {averages.question_4.toFixed(1)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-full rounded-full ${
                averages.question_4 >= 4
                  ? 'bg-green-500'
                  : averages.question_4 >= 3
                  ? 'bg-blue-500'
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${(averages.question_4 / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Botão Ver Comentários */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="btn btn-secondary w-full mb-4"
      >
        {showComments ? '▲ Ocultar Comentários' : '▼ Ver Comentários'}
        {' '}
        ({comments.positive.length})
      </button>

      {/* Comentários (Expandível) */}
      {showComments && (
        <div className="space-y-4 animate-slide-up">
          {/* Pontos Positivos */}
          <div>
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Pontos Positivos ({comments.positive.length})
            </h4>
            <div className="space-y-2">
              {comments.positive.map((comment, index) => (
                <div
                  key={index}
                  className="bg-green-50 border-l-4 border-green-500 p-3 rounded"
                >
                  <p className="text-sm text-gray-800">{comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pontos de Melhoria */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Pontos de Melhoria ({comments.improvement.length})
            </h4>
            <div className="space-y-2">
              {comments.improvement.map((comment, index) => (
                <div
                  key={index}
                  className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded"
                >
                  <p className="text-sm text-gray-800">{comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
