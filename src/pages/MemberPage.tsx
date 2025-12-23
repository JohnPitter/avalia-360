import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout';
import {
  MemberLogin,
  MembersList,
  EvaluationFormComponent,
} from '@/components/colaborador';
import {
  validateAccessCode,
  updateLastAccess,
  incrementCompletedEvaluations,
} from '@/services/firebase';
import { createResponse, getPendingEvaluations } from '@/services/firebase/response.service';
import {
  createMemberSession,
  getSession,
  clearSession,
} from '@/utils/session';
import type { TeamMember, Evaluation, EvaluationFormData } from '@/types';

/**
 * Página Principal do Colaborador
 * Gerencia todo o fluxo de avaliação
 */

type Step = 'login' | 'member-list' | 'evaluation';

export function MemberPage() {
  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dados da sessão
  const [evaluationId, setEvaluationId] = useState('');
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [managerToken] = useState(''); // TODO: Obter do Firebase

  // Dados da avaliação
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [evaluatedMemberIds, setEvaluatedMemberIds] = useState<string[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Verifica sessão existente ao carregar
  useEffect(() => {
    const session = getSession();

    if (session && session.type === 'member') {
      loadMemberData(session.evaluationId, session.userId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadMemberData = async (evalId: string, _memberId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Busca dados da avaliação (precisamos do token para descriptografar)
      // TODO: Armazenar manager token na sessão ou buscar de outra forma
      // Por enquanto, vamos assumir que conseguimos os dados básicos

      setEvaluationId(evalId);

      // Busca todos os membros
      // Note: Precisamos do manager token para descriptografar os nomes
      // Isso é um desafio de arquitetura que precisamos resolver

      setStep('member-list');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar dados'
      );
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (accessCode: string) => {
    setLoading(true);
    setError(null);

    try {
      // Valida código de acesso
      // Precisamos buscar em todas as avaliações ativas
      // Por simplicidade, vamos assumir que temos um evaluationId

      // TODO: Implementar busca de avaliação por código de acesso
      // Por enquanto, vamos usar um ID fixo para desenvolvimento

      const tempEvaluationId = 'temp-eval-id';

      const member = await validateAccessCode(tempEvaluationId, accessCode);

      if (!member) {
        throw new Error('Código de acesso inválido');
      }

      setCurrentMember(member);
      setEvaluationId(tempEvaluationId);

      // Atualiza último acesso
      await updateLastAccess(member.id);

      // Cria sessão
      createMemberSession(tempEvaluationId, member.id, accessCode);

      // Carrega membros e avaliação
      await loadEvaluationData(tempEvaluationId, member.id);

      setStep('member-list');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao fazer login'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluationData = async (evalId: string, memberId: string) => {
    try {
      // Carrega todos os membros
      // Note: Isso requer o manager token para descriptografar nomes
      // Precisamos de uma solução para isso

      const membersList: TeamMember[] = []; // TODO: Implementar
      setAllMembers(membersList);

      // Carrega avaliações já feitas
      const pending = await getPendingEvaluations(
        evalId,
        memberId,
        membersList
      );

      // Calcula quais já foram avaliados
      const allMemberIds = membersList
        .filter((m) => m.id !== memberId)
        .map((m) => m.id);
      const evaluated = allMemberIds.filter((id) => !pending.includes(id));

      setEvaluatedMemberIds(evaluated);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setStep('evaluation');
  };

  const handleSubmitEvaluation = async (data: EvaluationFormData) => {
    if (!currentMember || !selectedMemberId) {
      setError('Dados inválidos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Cria resposta
      await createResponse(
        {
          evaluationId,
          evaluatorId: currentMember.id,
          evaluatedId: selectedMemberId,
          ...data,
        },
        managerToken // TODO: Obter manager token
      );

      // Incrementa contador
      await incrementCompletedEvaluations(currentMember.id);

      // Atualiza lista de avaliados
      setEvaluatedMemberIds((prev) => [...prev, selectedMemberId]);

      // Volta para lista
      setSelectedMemberId(null);
      setStep('member-list');

      // Recarrega dados
      await loadEvaluationData(evaluationId, currentMember.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao enviar avaliação'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEvaluation = () => {
    setSelectedMemberId(null);
    setStep('member-list');
  };

  const handleLogout = () => {
    clearSession();
    setStep('login');
    setCurrentMember(null);
    setEvaluationId('');
    setEvaluation(null);
    setAllMembers([]);
    setEvaluatedMemberIds([]);
    setSelectedMemberId(null);
    setError(null);
  };

  if (loading) {
    return (
      <PageLayout variant="member" showHeader={false}>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl border border-gray-100 animate-fade-in">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 animate-spin border-4 border-emerald-600 border-t-transparent rounded-full" />
                <div className="absolute inset-3 animate-spin border-4 border-emerald-300 border-t-transparent rounded-full" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Carregando</h3>
              <p className="text-gray-600">Preparando suas avaliações...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const selectedMember = allMembers.find((m) => m.id === selectedMemberId);

  const getStepTitle = () => {
    if (step === 'member-list') return 'Minhas Avaliações';
    if (step === 'evaluation' && selectedMember) return `Avaliar ${selectedMember.name}`;
    return 'Portal do Colaborador';
  };

  return (
    <PageLayout variant="member" showBackButton={step === 'evaluation'}>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        {step !== 'login' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{getStepTitle()}</h2>
                <p className="text-gray-600 mt-1">
                  {step === 'member-list' && 'Selecione um colega para avaliar'}
                  {step === 'evaluation' && 'Preencha a avaliação com honestidade e construtividade'}
                </p>
              </div>
              {currentMember && (
                <div className="hidden lg:flex items-center space-x-3 bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Colaborador</p>
                    <p className="text-sm font-semibold text-gray-900">{currentMember.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            {step === 'member-list' && allMembers.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Seu Progresso</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {evaluatedMemberIds.length}/{allMembers.filter(m => m.id !== currentMember?.id).length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${(evaluatedMemberIds.length / Math.max(allMembers.filter(m => m.id !== currentMember?.id).length, 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 animate-slide-up">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold text-red-900">Ops! Algo deu errado</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-4 px-4 py-2 bg-white text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors shadow-sm border border-red-200"
                  >
                    Entendi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="animate-fade-in">
          {step === 'login' && <MemberLogin onLogin={handleLogin} />}

          {step === 'member-list' && currentMember && (
            <MembersList
              evaluationTitle={evaluation?.title || 'Avaliação 360°'}
              currentMember={currentMember}
              allMembers={allMembers}
              evaluatedMemberIds={evaluatedMemberIds}
              onSelectMember={handleSelectMember}
              onLogout={handleLogout}
            />
          )}

          {step === 'evaluation' && selectedMember && currentMember && (
            <EvaluationFormComponent
              evaluationId={evaluationId}
              evaluatorId={currentMember.id}
              evaluatedMember={selectedMember}
              onSubmit={handleSubmitEvaluation}
              onCancel={handleCancelEvaluation}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
