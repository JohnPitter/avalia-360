import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../LanguageSwitcher';

interface PageLayoutProps {
  children: ReactNode;
  variant?: 'home' | 'manager' | 'member';
  showHeader?: boolean;
  showBackButton?: boolean;
}

export function PageLayout({
  children,
  variant = 'home',
  showHeader = true,
  showBackButton = false
}: PageLayoutProps) {
  const navigate = useNavigate();

  const gradients = {
    home: 'from-indigo-500 via-purple-500 to-pink-500',
    manager: 'from-blue-600 via-indigo-600 to-purple-600',
    member: 'from-emerald-500 via-teal-500 to-cyan-500',
  };

  const bgPatterns = {
    home: 'from-indigo-50/50 via-purple-50/30 to-pink-50/50',
    manager: 'from-blue-50/50 via-indigo-50/30 to-purple-50/50',
    member: 'from-emerald-50/50 via-teal-50/30 to-cyan-50/50',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${bgPatterns[variant]}`} />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      {showHeader && (
        <header className="relative">
          <div className={`bg-gradient-to-r ${gradients[variant]} shadow-xl`}>
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {showBackButton && (
                    <button
                      onClick={() => navigate(-1)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
                  >
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                      <span className="text-white font-bold text-xl">360</span>
                    </div>
                    <div className="hidden sm:block">
                      <h1 className="text-2xl font-bold text-white">Avalia 360°</h1>
                      <p className="text-xs text-white/80">Avaliações Empresariais</p>
                    </div>
                  </button>
                </div>

                {/* Language Switcher */}
                <div>
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
}
