import { useState, useEffect, useCallback } from 'react';
import { validateEvaluationForm } from '@/utils/validation';
import { sanitizeText } from '@/utils/sanitization';
import { saveDraft, loadDraft, deleteDraft } from '@/services/draft';
import type { EvaluationFormData, TeamMember } from '@/types';

/**
 * Componente de Formulário de Avaliação
 * 4 perguntas com rating 1-5 + comentários
 */

interface EvaluationFormComponentProps {
  evaluationId: string;
  evaluatorId: string;
  evaluatedMember: TeamMember;
  onSubmit: (data: EvaluationFormData) => void;
  onCancel: () => void;
}

const QUESTIONS = [
  {
    id: 'question_1',
    text: 'Como você avalia a satisfação em trabalhar com este colaborador?',
    description: 'Considere comunicação, colaboração e ambiente de trabalho',
    icon: '💬',
  },
  {
    id: 'question_2',
    text: 'Como você avalia a proatividade e iniciativa deste colaborador?',
    description: 'Considere tomada de decisão, antecipação de problemas e busca por soluções',
    icon: '🚀',
  },
  {
    id: 'question_3',
    text: 'Como você avalia a qualidade do trabalho entregue?',
    description: 'Considere atenção aos detalhes, cumprimento de prazos e resultado final',
    icon: '⭐',
  },
  {
    id: 'question_4',
    text: 'Como você avalia o trabalho em equipe deste colaborador?',
    description: 'Considere colaboração, suporte aos colegas e contribuição para o time',
    icon: '🤝',
  },
];

const RATING_LABELS = [
  { label: 'Insatisfatório', color: 'from-red-500 to-orange-500' },
  { label: 'Abaixo da Média', color: 'from-orange-500 to-yellow-500' },
  { label: 'Adequado', color: 'from-yellow-500 to-green-500' },
  { label: 'Bom', color: 'from-green-500 to-emerald-500' },
  { label: 'Excelente', color: 'from-emerald-500 to-teal-500' },
];

export function EvaluationFormComponent({
  evaluationId,
  evaluatorId,
  evaluatedMember,
  onSubmit,
  onCancel,
}: EvaluationFormComponentProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    question_1: 0,
    question_2: 0,
    question_3: 0,
    question_4: 0,
  });

  const [positivePoints, setPositivePoints] = useState('');
  const [improvementPoints, setImprovementPoints] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);

  // Carregar rascunho ao montar componente
  useEffect(() => {
    const loadSavedDraft = async () => {
      try {
        const draft = await loadDraft(evaluatorId, evaluatedMember.id);
        if (draft) {
          setRatings({
            question_1: draft.formData.question_1,
            question_2: draft.formData.question_2,
            question_3: draft.formData.question_3,
            question_4: draft.formData.question_4,
          });
          setPositivePoints(draft.formData.positive_points);
          setImprovementPoints(draft.formData.improvement_points);
          setLastSaved(new Date(draft.savedAt));
          setDraftStatus('saved');
        }
      } catch (error) {
        console.error('Erro ao carregar rascunho:', error);
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadSavedDraft();
  }, [evaluatorId, evaluatedMember.id]);

  // Salvar rascunho automaticamente
  const saveFormDraft = useCallback(async () => {
    const hasData =
      Object.values(ratings).some((r) => r > 0) ||
      positivePoints.trim() ||
      improvementPoints.trim();

    if (!hasData) return;

    setDraftStatus('saving');
    try {
      const formData: EvaluationFormData = {
        question_1: ratings.question_1,
        question_2: ratings.question_2,
        question_3: ratings.question_3,
        question_4: ratings.question_4,
        positive_points: positivePoints,
        improvement_points: improvementPoints,
      };

      await saveDraft(evaluationId, evaluatorId, evaluatedMember.id, formData);
      setLastSaved(new Date());
      setDraftStatus('saved');
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      setDraftStatus('error');
    }
  }, [evaluationId, evaluatorId, evaluatedMember.id, ratings, positivePoints, improvementPoints]);

  // Debounced auto-save
  useEffect(() => {
    if (isLoadingDraft) return;

    const timeout = setTimeout(() => {
      saveFormDraft();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [ratings, positivePoints, improvementPoints, isLoadingDraft, saveFormDraft]);

  const handleRatingChange = (questionId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [questionId]: rating }));
    setDraftStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedPositive = sanitizeText(positivePoints, 500);
    const sanitizedImprovement = sanitizeText(improvementPoints, 500);

    const formData: EvaluationFormData = {
      question_1: ratings.question_1,
      question_2: ratings.question_2,
      question_3: ratings.question_3,
      question_4: ratings.question_4,
      positive_points: sanitizedPositive,
      improvement_points: sanitizedImprovement,
    };

    const validation = validateEvaluationForm(formData);

    if (!validation.valid) {
      setErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);

    try {
      await deleteDraft(evaluatorId, evaluatedMember.id);
    } catch (error) {
      console.error('Erro ao deletar rascunho:', error);
    }

    onSubmit(formData);
  };

  const allRatingsSelected = Object.values(ratings).every((r) => r > 0);
  const completedQuestions = Object.values(ratings).filter((r) => r > 0).length;

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return 'agora há pouco';
    if (minutes === 1) return 'há 1 minuto';
    if (minutes < 60) return `há ${minutes} minutos`;

    return lastSaved.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoadingDraft) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-600">Carregando avaliação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {evaluatedMember.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Avaliando: {evaluatedMember.name}
                </h1>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Suas respostas são 100% anônimas e criptografadas
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mt-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Progresso da Avaliação</span>
                <span className="text-sm font-bold text-emerald-600">{completedQuestions}/4 perguntas</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${(completedQuestions / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Draft Status */}
          <div className="flex items-center gap-4">
            {draftStatus === 'saving' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                <span className="text-sm text-gray-700">Salvando...</span>
              </div>
            )}
            {draftStatus === 'saved' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-xl">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-700">Salvo {formatLastSaved()}</span>
              </div>
            )}
            {draftStatus === 'error' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-xl">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">Erro ao salvar</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-2">Corrija os seguintes erros:</p>
              <ul className="space-y-1 text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Questions */}
        {QUESTIONS.map((question, qIndex) => {
          const questionKey = question.id as keyof typeof ratings;
          const currentRating = ratings[questionKey];

          return (
            <div key={question.id} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-2xl">{question.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {qIndex + 1}. {question.text}
                  </h3>
                  <p className="text-sm text-gray-600">{question.description}</p>
                </div>
              </div>

              {/* Rating Buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const isSelected = currentRating === rating;
                    const ratingData = RATING_LABELS[rating - 1];

                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingChange(questionKey, rating)}
                        className={`relative group p-4 rounded-2xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-emerald-400 bg-gradient-to-br ' + ratingData.color + ' shadow-lg scale-105'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-105'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`text-3xl font-bold mb-2 ${
                            isSelected ? 'text-white' : 'text-gray-700'
                          }`}>
                            {rating}
                          </div>
                          <div className={`text-xs font-semibold leading-tight ${
                            isSelected ? 'text-white' : 'text-gray-600'
                          }`}>
                            {ratingData.label}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {currentRating > 0 && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold text-emerald-700">
                        Selecionado: {currentRating} - {RATING_LABELS[currentRating - 1].label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Comments */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Comentários Qualitativos</h3>
          </div>

          <div className="space-y-6">
            {/* Positive Points */}
            <div>
              <label htmlFor="positivePoints" className="block text-sm font-bold text-gray-900 mb-3">
                💚 Pontos Positivos *
              </label>
              <textarea
                id="positivePoints"
                value={positivePoints}
                onChange={(e) => setPositivePoints(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none resize-none"
                rows={5}
                maxLength={500}
                placeholder="Descreva os pontos fortes, qualidades e contribuições positivas deste colaborador. Seja específico e use exemplos concretos quando possível..."
                required
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-600">
                  Mínimo recomendado: 50 caracteres
                </p>
                <p className={`text-sm font-semibold ${
                  positivePoints.length > 450 ? 'text-orange-600' : 'text-gray-600'
                }`}>
                  {positivePoints.length}/500
                </p>
              </div>
            </div>

            {/* Improvement Points */}
            <div>
              <label htmlFor="improvementPoints" className="block text-sm font-bold text-gray-900 mb-3">
                💡 Pontos de Melhoria *
              </label>
              <textarea
                id="improvementPoints"
                value={improvementPoints}
                onChange={(e) => setImprovementPoints(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                rows={5}
                maxLength={500}
                placeholder="Descreva sugestões construtivas para desenvolvimento profissional. Seja respeitoso e focado em comportamentos, não em personalidade..."
                required
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-600">
                  Mínimo recomendado: 50 caracteres
                </p>
                <p className={`text-sm font-semibold ${
                  improvementPoints.length > 450 ? 'text-orange-600' : 'text-gray-600'
                }`}>
                  {improvementPoints.length}/500
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 px-6 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Voltar
              </span>
            </button>
            <button
              type="submit"
              disabled={!allRatingsSelected || !positivePoints.trim() || !improvementPoints.trim()}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="flex items-center justify-center gap-2">
                Enviar Avaliação
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </button>
          </div>

          {!allRatingsSelected && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-sm text-orange-700 text-center font-semibold">
                ⚠️ Selecione uma avaliação para todas as 4 perguntas
              </p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Dicas para uma boa avaliação</h3>
              <ul className="space-y-2.5">
                {[
                  'Seja honesto e construtivo nas suas respostas',
                  'Use exemplos concretos quando possível',
                  'Foque em comportamentos, não em personalidade',
                  'Lembre-se: o objetivo é o desenvolvimento da equipe',
                  'Suas respostas são 100% anônimas - seja sincero!'
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
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
      </form>
    </div>
  );
}
