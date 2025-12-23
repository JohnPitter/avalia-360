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
  },
  {
    id: 'question_2',
    text: 'Como você avalia a proatividade e iniciativa deste colaborador?',
    description: 'Considere tomada de decisão, antecipação de problemas e busca por soluções',
  },
  {
    id: 'question_3',
    text: 'Como você avalia a qualidade do trabalho entregue?',
    description: 'Considere atenção aos detalhes, cumprimento de prazos e resultado final',
  },
  {
    id: 'question_4',
    text: 'Como você avalia o trabalho em equipe deste colaborador?',
    description: 'Considere colaboração, suporte aos colegas e contribuição para o time',
  },
];

const RATING_LABELS = ['Insatisfatório', 'Abaixo da Média', 'Adequado', 'Bom', 'Excelente'];

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
          // Restaurar dados do rascunho
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
    // Não salvar se não houver dados
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

  // Debounced auto-save - salva após 3 segundos de inatividade
  useEffect(() => {
    if (isLoadingDraft) return;

    const timeout = setTimeout(() => {
      saveFormDraft();
    }, 3000); // 3 segundos

    return () => clearTimeout(timeout);
  }, [ratings, positivePoints, improvementPoints, isLoadingDraft, saveFormDraft]);

  const handleRatingChange = (questionId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [questionId]: rating }));
    setDraftStatus('idle'); // Reset status quando usuário faz mudança
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitiza comentários
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

    // Valida
    const validation = validateEvaluationForm(formData);

    if (!validation.valid) {
      setErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);

    // Deletar rascunho após submissão bem-sucedida
    try {
      await deleteDraft(evaluatorId, evaluatedMember.id);
    } catch (error) {
      console.error('Erro ao deletar rascunho:', error);
    }

    onSubmit(formData);
  };

  const allRatingsSelected = Object.values(ratings).every((r) => r > 0);

  // Formatar última data de salvamento
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
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Carregando avaliação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary-900 mb-2">
                Avaliando: {evaluatedMember.name}
              </h1>
              <p className="text-gray-600">
                Suas respostas são anônimas e confidenciais
              </p>
            </div>

            {/* Draft Status Indicator */}
            <div className="ml-4">
              {draftStatus === 'saving' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>Salvando...</span>
                </div>
              )}
              {draftStatus === 'saved' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Salvo {formatLastSaved()}</span>
                </div>
              )}
              {draftStatus === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Erro ao salvar</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Erros */}
        {errors.length > 0 && (
          <div className="alert-error">
            <p className="font-semibold mb-2">Corrija os seguintes erros:</p>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Perguntas com Rating */}
        {QUESTIONS.map((question, qIndex) => {
          const questionKey = question.id as keyof typeof ratings;
          const currentRating = ratings[questionKey];

          return (
            <div key={question.id} className="card">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {qIndex + 1}. {question.text}
                </h3>
                <p className="text-sm text-gray-600">{question.description}</p>
              </div>

              {/* Rating Stars */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingChange(questionKey, rating)}
                      className={`rating-button ${
                        currentRating === rating
                          ? 'rating-button-selected'
                          : ''
                      }`}
                    >
                      <span className="text-2xl">{rating}</span>
                      <span className="text-xs mt-1">
                        {RATING_LABELS[rating - 1]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Selected Rating Display */}
                {currentRating > 0 && (
                  <div className="text-center sm:text-left">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-semibold">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Selecionado: {currentRating} - {RATING_LABELS[currentRating - 1]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Comentários */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 text-lg mb-4">
            Comentários Qualitativos
          </h3>

          {/* Pontos Positivos */}
          <div className="form-group mb-6">
            <label htmlFor="positivePoints" className="form-label">
              Pontos Positivos *
            </label>
            <textarea
              id="positivePoints"
              value={positivePoints}
              onChange={(e) => setPositivePoints(e.target.value)}
              className="form-input"
              rows={4}
              maxLength={500}
              placeholder="Descreva os pontos fortes e qualidades deste colaborador..."
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              {positivePoints.length}/500 caracteres
            </p>
          </div>

          {/* Pontos de Melhoria */}
          <div className="form-group">
            <label htmlFor="improvementPoints" className="form-label">
              Pontos de Melhoria *
            </label>
            <textarea
              id="improvementPoints"
              value={improvementPoints}
              onChange={(e) => setImprovementPoints(e.target.value)}
              className="form-input"
              rows={4}
              maxLength={500}
              placeholder="Descreva sugestões construtivas para desenvolvimento..."
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              {improvementPoints.length}/500 caracteres
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="card">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary flex-1"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={!allRatingsSelected || !positivePoints.trim() || !improvementPoints.trim()}
            >
              Enviar Avaliação →
            </button>
          </div>

          {!allRatingsSelected && (
            <p className="text-sm text-orange-600 text-center mt-4">
              ⚠️ Selecione uma avaliação para todas as 4 perguntas
            </p>
          )}
        </div>

        {/* Dicas */}
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">
            💡 Dicas para uma boa avaliação:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Seja <strong>honesto</strong> e <strong>construtivo</strong></li>
            <li>• Use <strong>exemplos concretos</strong> quando possível</li>
            <li>• Foque em <strong>comportamentos</strong>, não em personalidade</li>
            <li>• Lembre-se: o objetivo é o <strong>desenvolvimento</strong> da equipe</li>
            <li>• Suas respostas são <strong>anônimas</strong> - seja sincero!</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
