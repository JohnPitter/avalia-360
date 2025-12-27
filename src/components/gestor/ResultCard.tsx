import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { PerformanceRadarChart } from '@/components/shared';
import type { ConsolidatedResult } from '@/types';

/**
 * Card de Resultado Individual
 * Exibe médias e comentários de um membro avaliado
 * Otimizado com React.memo para evitar re-renders desnecessários
 */

interface ResultCardProps {
  result: ConsolidatedResult;
  rank?: number;
}

const ResultCardComponent = ({ result, rank }: ResultCardProps) => {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);

  const { member, averages, comments, totalResponses } = result;

  // Determina cor e gradiente baseado na média geral
  const getRatingColor = (average: number) => {
    if (average >= 4.5) return 'text-emerald-600';
    if (average >= 3.5) return 'text-blue-600';
    if (average >= 2.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getRatingGradient = (average: number) => {
    if (average >= 4.5) return 'from-emerald-500 to-teal-500';
    if (average >= 3.5) return 'from-blue-500 to-indigo-500';
    if (average >= 2.5) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const getRatingBgColor = (average: number) => {
    if (average >= 4.5) return 'bg-emerald-100';
    if (average >= 3.5) return 'bg-blue-100';
    if (average >= 2.5) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  const getRatingLabel = (average: number) => {
    if (average >= 4.5) return t('manager.results.ratingLabels.excellent');
    if (average >= 3.5) return t('manager.results.ratingLabels.good');
    if (average >= 2.5) return t('manager.results.ratingLabels.adequate');
    if (average >= 1.5) return t('manager.results.ratingLabels.belowAverage');
    return t('manager.results.ratingLabels.unsatisfactory');
  };

  const getBarColor = (average: number) => {
    if (average >= 4) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    if (average >= 3) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (average >= 2) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-orange-500 to-red-500';
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
        <div className="flex items-center gap-4">
          {rank && (
            <div className={`w-16 h-16 bg-gradient-to-br ${getRatingGradient(averages.overall)} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
              <span className="text-2xl font-bold text-white">#{rank}</span>
            </div>
          )}
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-lg flex-shrink-0">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              {totalResponses} {totalResponses === 1 ? t('manager.dashboard.evaluationReceived') : t('manager.dashboard.evaluationsReceived')}
            </p>
          </div>
        </div>

        {/* Overall Score */}
        <div className="text-center lg:text-right">
          <div className={`text-6xl font-bold mb-2 ${getRatingColor(averages.overall)}`}>
            {averages.overall.toFixed(2)}
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${getRatingBgColor(averages.overall)} ${getRatingColor(averages.overall)}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {getRatingLabel(averages.overall)}
          </div>
        </div>
      </div>

      {/* Question Averages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('manager.results.questions.satisfaction'), key: 'question_1', icon: '💬' },
          { label: t('manager.results.questions.proactivity'), key: 'question_2', icon: '🚀' },
          { label: t('manager.results.questions.quality'), key: 'question_3', icon: '⭐' },
          { label: t('manager.results.questions.teamwork'), key: 'question_4', icon: '🤝' },
        ].map((q) => {
          const avg = averages[q.key as keyof typeof averages] as number;
          return (
            <div key={q.key} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{q.icon}</span>
                <div className="text-xs font-semibold text-gray-700">{q.label}</div>
              </div>
              <div className={`text-3xl font-bold ${getRatingColor(avg)} mb-3`}>
                {avg.toFixed(1)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getBarColor(avg)} rounded-full transition-all duration-1000`}
                  style={{ width: `${(avg / 5) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Radar Chart */}
      <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {t('manager.results.performanceOverview')}
        </h4>
        <PerformanceRadarChart
          data={{
            question_1: averages.question_1,
            question_2: averages.question_2,
            question_3: averages.question_3,
            question_4: averages.question_4,
          }}
          memberName={member.name}
        />
      </div>

      {/* Comments Toggle Button */}
      <button
        onClick={() => setShowComments(!showComments)}
        className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 ${
          showComments
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
            : 'bg-white border-2 border-purple-300 text-purple-700 hover:bg-purple-50'
        }`}
      >
        <svg className={`w-5 h-5 transition-transform duration-200 ${showComments ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {showComments ? t('manager.results.hideComments') : t('manager.results.showComments')}
        <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
          {comments.positive.length + comments.improvement.length}
        </span>
      </button>

      {/* Comments (Expandible) */}
      {showComments && (
        <div className="space-y-6 mt-6 animate-slide-up">
          {/* Positive Points */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900">
                {t('manager.results.positivePoints')}
                <span className="ml-2 text-sm text-gray-600">({comments.positive.length})</span>
              </h4>
            </div>
            <div className="space-y-3">
              {comments.positive.map((comment, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-700">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Points */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900">
                {t('manager.results.improvementPoints')}
                <span className="ml-2 text-sm text-gray-600">({comments.improvement.length})</span>
              </h4>
            </div>
            <div className="space-y-3">
              {comments.improvement.map((comment, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-700">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const ResultCard = memo(ResultCardComponent);
