import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ManagerPage } from './pages/ManagerPage';
import { MemberPage } from './pages/MemberPage';
// Force Firebase initialization on app load
import './services/firebase/config';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">360</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Avalia 360°
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gestor" element={<ManagerPage />} />
            <Route path="/colaborador" element={<MemberPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-500">
              © 2024 Avalia 360°. Sistema de Avaliações Empresariais.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

// Home Page Component
function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      <div className="card p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Bem-vindo ao Avalia 360°
          </h2>

          <p className="text-lg text-gray-600 mb-8">
            Sistema moderno e seguro para avaliações 360 graus de equipes.
            <br />
            Todos avaliam todos para uma visão completa do desempenho.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-6 text-left hover:shadow-medium transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">👔</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Para Gestores
                </h3>
                <p className="text-sm text-gray-600">
                  Crie avaliações, convide sua equipe e acompanhe resultados em tempo real.
                </p>
              </div>

              <div className="card p-6 text-left hover:shadow-medium transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Para Colaboradores
                </h3>
                <p className="text-sm text-gray-600">
                  Avalie seus colegas de forma anônima e contribua para o desenvolvimento da equipe.
                </p>
              </div>
            </div>

            <div className="pt-6 flex gap-4 justify-center">
              <button
                className="btn-primary"
                onClick={() => navigate('/gestor')}
              >
                Criar Nova Avaliação
              </button>
              <button
                className="btn-outline"
                onClick={() => navigate('/colaborador')}
              >
                Acessar com Código
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600">100%</div>
                <div className="text-xs text-gray-500">Seguro</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600">360°</div>
                <div className="text-xs text-gray-500">Avaliação Completa</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600">0$</div>
                <div className="text-xs text-gray-500">Totalmente Gratuito</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="font-semibold text-gray-900 mb-2">Dados Criptografados</h3>
          <p className="text-sm text-gray-600">
            Criptografia AES-256 para total segurança e privacidade dos dados.
          </p>
        </div>

        <div className="card p-6">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-semibold text-gray-900 mb-2">Resultados em Tempo Real</h3>
          <p className="text-sm text-gray-600">
            Acompanhe o progresso e veja resultados consolidados quando completar.
          </p>
        </div>

        <div className="card p-6">
          <div className="text-3xl mb-3">📧</div>
          <h3 className="font-semibold text-gray-900 mb-2">Convites Automáticos</h3>
          <p className="text-sm text-gray-600">
            Emails enviados automaticamente para todos os membros da equipe.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
