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
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 rounded-2xl shadow-2xl mb-12">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative px-8 py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl mb-8 border border-white/20 shadow-lg">
              <svg
                className="w-14 h-14 text-white"
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

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Bem-vindo ao Avalia 360°
            </h2>

            <p className="text-xl text-primary-100 mb-10 leading-relaxed">
              Sistema moderno e seguro para avaliações 360 graus de equipes.
              <br />
              Todos avaliam todos para uma visão completa do desempenho.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="group relative px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
                onClick={() => navigate('/gestor')}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Criar Nova Avaliação
                </span>
              </button>
              <button
                className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                onClick={() => navigate('/colaborador')}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Acessar com Código
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div
          className="group card p-8 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary-200"
          onClick={() => navigate('/gestor')}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                Para Gestores
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Crie avaliações personalizadas, convide sua equipe e acompanhe resultados em tempo real com dashboards interativos.
              </p>
            </div>
          </div>
        </div>

        <div
          className="group card p-8 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-200"
          onClick={() => navigate('/colaborador')}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                Para Colaboradores
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Avalie seus colegas de forma anônima e contribua para o desenvolvimento da equipe com feedback construtivo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card p-6 text-center border-l-4 border-primary-600">
          <div className="text-4xl font-bold text-primary-600 mb-2">100%</div>
          <div className="text-sm font-medium text-gray-700">Seguro</div>
          <div className="text-xs text-gray-500 mt-1">Criptografia AES-256</div>
        </div>
        <div className="card p-6 text-center border-l-4 border-purple-600">
          <div className="text-4xl font-bold text-purple-600 mb-2">360°</div>
          <div className="text-sm font-medium text-gray-700">Avaliação Completa</div>
          <div className="text-xs text-gray-500 mt-1">Todos avaliam todos</div>
        </div>
        <div className="card p-6 text-center border-l-4 border-green-600">
          <div className="text-4xl font-bold text-green-600 mb-2">Grátis</div>
          <div className="text-sm font-medium text-gray-700">100% Gratuito</div>
          <div className="text-xs text-gray-500 mt-1">Sem custos ocultos</div>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Dados Criptografados</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Criptografia AES-256 para total segurança e privacidade dos dados sensíveis.
          </p>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Resultados em Tempo Real</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Acompanhe o progresso e veja resultados consolidados quando completar.
          </p>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Convites Automáticos</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Emails enviados automaticamente para todos os membros da equipe.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
