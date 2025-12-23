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
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const selectedMember = allMembers.find((m) => m.id === selectedMemberId);

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="alert-error mb-6 max-w-4xl mx-auto">
          <p className="font-semibold">Erro:</p>
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 btn btn-secondary btn-sm"
          >
            Fechar
          </button>
        </div>
      )}

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
  );
}
