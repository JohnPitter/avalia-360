import { useState } from 'react';
import { isValidTitle } from '@/utils/validation';
import { sanitizeText } from '@/utils/sanitization';

/**
 * Componente de Formulário de Criação de Avaliação
 * Permite definir título e preparar para adicionar membros
 */

interface CreateEvaluationFormProps {
  onSubmit: (data: { title: string }) => void;
  onCancel: () => void;
}

export function CreateEvaluationForm({
  onSubmit,
  onCancel,
}: CreateEvaluationFormProps) {
  const [title, setTitle] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: string[] = [];

    // Sanitiza e valida título
    const sanitizedTitle = sanitizeText(title, 200);

    if (!isValidTitle(sanitizedTitle)) {
      validationErrors.push('Título deve ter entre 1 e 200 caracteres');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSubmit({ title: sanitizedTitle });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Título da Avaliação */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-3">
              Título da Avaliação *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-lg"
                placeholder="Ex: Avaliação de Desempenho Q4 2024"
                required
                maxLength={200}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-600">
                💡 Escolha um título claro e descritivo
              </p>
              <p className={`text-sm font-medium ${title.length > 180 ? 'text-orange-600' : 'text-gray-500'}`}>
                {title.length}/200
              </p>
            </div>
          </div>

          {/* Erros */}
          {errors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <ul className="space-y-1 text-sm text-red-700 flex-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Próximos Passos */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-3">📋 Próximos passos</h3>
                <ol className="space-y-2.5">
                  {[
                    { text: 'Defina o título da avaliação', done: title.length > 0 },
                    { text: 'Adicione os membros da equipe (mínimo 2)', done: false },
                    { text: 'Revise os dados e envie os convites', done: false },
                    { text: 'Acompanhe o progresso no dashboard', done: false },
                  ].map((step, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        step.done ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {step.done ? (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-blue-600 font-bold text-xs">{index + 1}</span>
                        )}
                      </div>
                      <span className={step.done ? 'text-gray-900 font-medium' : 'text-gray-700'}>
                        {step.text}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Dicas */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-3">💡 Dicas para um bom título</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Identifique o período: "Q4 2024", "Semestral 2024", "Anual 2024"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Inclua o time/departamento: "Time de Vendas", "Equipe Produto"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Lembre-se: todos os membros verão este título</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 px-6 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                Continuar
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
