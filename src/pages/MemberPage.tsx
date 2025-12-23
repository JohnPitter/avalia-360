import { useState, useEffect } from 'react';
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <div className="card p-12 text-center animate-fade-in">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 animate-spin border-4 border-green-600 border-t-transparent rounded-full" />
                <div className="absolute inset-3 animate-spin border-4 border-green-300 border-t-transparent rounded-full" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
              </div>
              <p className="text-lg font-medium text-gray-700">Carregando...</p>
              <p className="text-sm text-gray-500 mt-2">Preparando suas avaliações</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedMember = allMembers.find((m) => m.id === selectedMemberId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Portal do Colaborador</h1>
                <p className="text-green-100 mt-1">Avalie seus colegas de equipe</p>
              </div>
            </div>
            {currentMember && (
              <div className="hidden md:flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">{currentMember.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      {step !== 'login' && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span className="text-gray-500">/</span>
              <span className="text-gray-700 font-medium">
                {step === 'member-list' && 'Minhas Avaliações'}
                {step === 'evaluation' && 'Avaliar Colega'}
              </span>
              {step === 'evaluation' && selectedMember && (
                <>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-600">{selectedMember.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 animate-slide-up">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-medium">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-red-800">Erro</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 btn-secondary btn-sm"
                  >
                    Fechar
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
    </div>
  );
}
