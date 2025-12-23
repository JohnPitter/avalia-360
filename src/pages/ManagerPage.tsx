import { useState, useEffect } from 'react';
import {
  ManagerLogin,
  CreateEvaluationForm,
  AddMembersForm,
  EvaluationSuccess,
  ProgressDashboard,
} from '@/components/gestor';
import {
  createEvaluation,
  addMembers,
  getEvaluation,
  getMembers,
  activateEvaluation,
  countResponses,
  type MemberData,
  type MemberWithAccessCode,
} from '@/services/firebase';
import {
  createManagerSession,
  getSession,
  clearSession,
} from '@/utils/session';
import type { Evaluation, TeamMember } from '@/types';

/**
 * Página Principal do Gestor
 * Gerencia todo o fluxo de criação e acompanhamento de avaliações
 */

type Step =
  | 'login'
  | 'create-evaluation'
  | 'add-members'
  | 'success'
  | 'dashboard';

export function ManagerPage() {
  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dados do fluxo
  const [managerEmail, setManagerEmail] = useState('');
  const [managerToken, setManagerToken] = useState('');
  const [evaluationId, setEvaluationId] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [evaluationTitle, setEvaluationTitle] = useState('');
  const [membersWithCodes, setMembersWithCodes] = useState<
    MemberWithAccessCode[]
  >([]);

  // Dados do dashboard
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);

  // Verifica sessão existente ao carregar
  useEffect(() => {
    const session = getSession();

    if (session && session.type === 'manager') {
      setManagerEmail('session-email'); // TODO: Salvar email na sessão
      setManagerToken(session.token);
      setEvaluationId(session.evaluationId);
      loadDashboard(session.evaluationId, session.token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadDashboard = async (evalId: string, token: string) => {
    try {
      setLoading(true);
      setError(null);

      // Carrega avaliação
      const evaluationData = await getEvaluation(evalId, token);
      if (!evaluationData) {
        throw new Error('Avaliação não encontrada');
      }
      setEvaluation(evaluationData);

      // Carrega membros
      const membersList = await getMembers(evalId, token);
      setMembers(membersList);

      // Conta respostas
      const responseCount = await countResponses(evalId);
      setTotalResponses(responseCount);

      setStep('dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar dashboard'
      );
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (
    email: string,
    mode: 'create' | 'access',
    token?: string
  ) => {
    setLoading(true);
    setError(null);
    setManagerEmail(email);

    try {
      if (mode === 'create') {
        // Modo criação: vai para próximo passo
        setStep('create-evaluation');
      } else {
        // Modo acesso: carrega avaliação existente
        if (!token) {
          throw new Error('Token é obrigatório');
        }

        setManagerToken(token);

        // TODO: Buscar avaliações do criador e permitir selecionar
        // Por enquanto, vamos assumir que o token é de uma avaliação específica
        // Precisaríamos do evaluationId aqui

        setError('Implementar busca de avaliações por email + token');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao fazer login'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvaluation = async (data: { title: string }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createEvaluation({
        creatorEmail: managerEmail,
        title: data.title,
      });

      setEvaluationId(result.evaluation.id);
      setManagerToken(result.managerToken);
      setEvaluationTitle(data.title);

      // Cria sessão
      createManagerSession(
        result.evaluation.id,
        'manager-id', // TODO: Usar ID real do gestor
        result.managerToken
      );

      setStep('add-members');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao criar avaliação'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async (membersList: MemberData[]) => {
    setLoading(true);
    setError(null);

    try {
      const result = await addMembers(
        evaluationId,
        membersList,
        managerToken
      );

      setMembersWithCodes(result);

      // Ativa a avaliação
      await activateEvaluation(evaluationId);

      setStep('success');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao adicionar membros'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    loadDashboard(evaluationId, managerToken);
  };

  const handleViewResults = () => {
    // TODO: Implementar visualização de resultados
    alert('Visualização de resultados será implementada em breve!');
  };

  const handleLogout = () => {
    clearSession();
    setStep('login');
    setManagerEmail('');
    setManagerToken('');
    setEvaluationId('');
    setEvaluation(null);
    setEvaluationTitle('');
    setMembersWithCodes([]);
    setMembers([]);
    setTotalResponses(0);
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

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="alert-error mb-6">
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

      {step === 'login' && <ManagerLogin onLogin={handleLogin} />}

      {step === 'create-evaluation' && (
        <CreateEvaluationForm
          managerEmail={managerEmail}
          onSubmit={handleCreateEvaluation}
          onCancel={handleLogout}
        />
      )}

      {step === 'add-members' && (
        <AddMembersForm
          evaluationTitle={evaluationTitle}
          onSubmit={handleAddMembers}
          onBack={() => setStep('create-evaluation')}
        />
      )}

      {step === 'success' && (
        <EvaluationSuccess
          evaluationId={evaluationId}
          evaluationTitle={evaluationTitle}
          managerToken={managerToken}
          members={membersWithCodes}
          onContinue={handleContinueToDashboard}
        />
      )}

      {step === 'dashboard' && evaluation && (
        <ProgressDashboard
          evaluation={evaluation}
          members={members}
          totalResponses={totalResponses}
          expectedResponses={members.length * (members.length - 1)}
          onViewResults={handleViewResults}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
