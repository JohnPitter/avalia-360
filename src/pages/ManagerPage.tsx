import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout';
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
  getManagerEvaluationByToken,
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
          throw new Error('Token é obrigatório para acessar avaliação existente');
        }

        setManagerToken(token);

        // Buscar avaliação usando email + token
        const evaluation = await getManagerEvaluationByToken(email, token);

        if (!evaluation) {
          throw new Error(
            'Nenhuma avaliação encontrada com este email e token. Verifique se os dados estão corretos.'
          );
        }

        // Avaliação encontrada! Carregar dashboard
        setEvaluationId(evaluation.id);

        // Criar sessão
        createManagerSession(evaluation.id, 'manager-id', token);

        // Carregar dashboard
        await loadDashboard(evaluation.id, token);
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
      <PageLayout variant="manager" showHeader={false}>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl border border-gray-100 animate-fade-in">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 animate-spin border-4 border-blue-600 border-t-transparent rounded-full" />
                <div className="absolute inset-3 animate-spin border-4 border-blue-300 border-t-transparent rounded-full" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Carregando</h3>
              <p className="text-gray-600">Preparando seu ambiente...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const getStepTitle = () => {
    switch (step) {
      case 'create-evaluation': return 'Criar Avaliação';
      case 'add-members': return 'Adicionar Membros';
      case 'success': return 'Avaliação Criada';
      case 'dashboard': return 'Dashboard';
      case 'results': return 'Resultados';
      default: return 'Portal do Gestor';
    }
  };

  return (
    <PageLayout variant="manager" showBackButton={step !== 'login'}>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        {step !== 'login' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{getStepTitle()}</h2>
                <p className="text-gray-600 mt-1">
                  {step === 'create-evaluation' && 'Configure sua nova avaliação 360°'}
                  {step === 'add-members' && 'Adicione os membros da sua equipe'}
                  {step === 'success' && 'Sua avaliação foi criada com sucesso'}
                  {step === 'dashboard' && 'Acompanhe o progresso das avaliações'}
                  {step === 'results' && 'Visualize os resultados consolidados'}
                </p>
              </div>
              {managerEmail && (
                <div className="hidden lg:flex items-center space-x-3 bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gestor</p>
                    <p className="text-sm font-semibold text-gray-900">{managerEmail}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Steps */}
            {(step === 'create-evaluation' || step === 'add-members' || step === 'success') && (
              <div className="flex items-center space-x-2 mb-6">
                <div className={`flex items-center ${step === 'create-evaluation' ? 'text-blue-600' : 'text-green-600'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'create-evaluation' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {step === 'create-evaluation' ? '1' : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </div>
                  <span className="ml-2 text-sm font-medium">Criar</span>
                </div>
                <div className={`w-12 h-0.5 ${step === 'create-evaluation' ? 'bg-gray-300' : 'bg-green-600'}`} />
                <div className={`flex items-center ${step === 'add-members' ? 'text-blue-600' : step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'add-members' ? 'bg-blue-100' : step === 'success' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {step === 'add-members' ? '2' : step === 'success' ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : '2'}
                  </div>
                  <span className="ml-2 text-sm font-medium">Membros</span>
                </div>
                <div className={`w-12 h-0.5 ${step === 'success' ? 'bg-green-600' : 'bg-gray-300'}`} />
                <div className={`flex items-center ${step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'success' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {step === 'success' ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : '3'}
                  </div>
                  <span className="ml-2 text-sm font-medium">Concluir</span>
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
          {step === 'login' && <ManagerLogin onLogin={handleLogin} />}

          {step === 'create-evaluation' && (
            <CreateEvaluationForm
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
    </PageLayout>
  );
}
