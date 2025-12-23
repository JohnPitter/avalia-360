import { useState, useEffect } from 'react';
import {
  ManagerLogin,
  CreateEvaluationForm,
  AddMembersForm,
  EvaluationSuccess,
  ProgressDashboard,
  ResultsPage,
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
  | 'dashboard'
  | 'results';

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
    setStep('results');
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <div className="card p-12 text-center animate-fade-in">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 animate-spin border-4 border-primary-600 border-t-transparent rounded-full" />
                <div className="absolute inset-3 animate-spin border-4 border-primary-300 border-t-transparent rounded-full" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
              </div>
              <p className="text-lg font-medium text-gray-700">Carregando...</p>
              <p className="text-sm text-gray-500 mt-2">Preparando seu ambiente</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Portal do Gestor</h1>
                <p className="text-primary-100 mt-1">Crie e gerencie avaliações 360°</p>
              </div>
            </div>
            {managerEmail && (
              <div className="hidden md:flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">{managerEmail}</span>
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
                {step === 'create-evaluation' && 'Criar Avaliação'}
                {step === 'add-members' && 'Adicionar Membros'}
                {step === 'success' && 'Sucesso'}
                {step === 'dashboard' && 'Dashboard'}
                {step === 'results' && 'Resultados'}
              </span>
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

          {step === 'results' && evaluation && (
            <ResultsPage
              evaluation={evaluation}
              members={members}
              managerToken={managerToken}
              onBack={() => setStep('dashboard')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
