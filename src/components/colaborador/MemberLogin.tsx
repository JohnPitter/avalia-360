import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isValidAccessCode } from '@/utils/validation';
import { sanitizeNumeric } from '@/utils/sanitization';

/**
 * Componente de Login do Colaborador
 * Permite acesso via código de 6 dígitos
 */

interface MemberLoginProps {
  onLogin: (accessCode: string) => void;
  error?: string | null;
  loading?: boolean;
}

export function MemberLogin({ onLogin, error, loading }: MemberLoginProps) {
  const { t } = useTranslation();
  const [accessCode, setAccessCode] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleInputChange = (value: string) => {
    // Sanitiza para apenas números
    const sanitized = sanitizeNumeric(value).slice(0, 6);
    setAccessCode(sanitized);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: string[] = [];

    if (!isValidAccessCode(accessCode)) {
      validationErrors.push(t('member.login.errors.invalidCode'));
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onLogin(accessCode);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('member.login.welcome')}
          </h2>
          <p className="text-gray-600">
            {t('member.login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código de Acesso */}
          <div>
            <label htmlFor="accessCode" className="block text-sm font-semibold text-gray-900 mb-4 text-center">
              {t('member.login.codeLabel')}
            </label>

            {/* Input Oculto para acessibilidade */}
            <input
              type="text"
              id="accessCode"
              value={accessCode}
              onChange={(e) => handleInputChange(e.target.value)}
              className="sr-only"
              maxLength={6}
              autoFocus
              autoComplete="off"
              inputMode="numeric"
              pattern="[0-9]*"
            />

            {/* Indicador Visual Moderno */}
            <div className="flex justify-center gap-3 mb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => document.getElementById('accessCode')?.focus()}
                  className={`w-14 h-16 border-2 rounded-2xl flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-200 ${
                    i < accessCode.length
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 scale-105 shadow-md'
                      : 'border-gray-300 bg-white text-gray-400 hover:border-emerald-300'
                  }`}
                >
                  {accessCode[i] || '·'}
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600 text-center">
              {t('member.login.codeHint')}
            </p>
          </div>

          {/* Erros */}
          {(errors.length > 0 || error) && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <ul className="space-y-1 text-sm text-red-700 flex-1">
                  {error && <li>• {error}</li>}
                  {errors.map((err, index) => (
                    <li key={index}>• {err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            className={`w-full py-4 font-semibold rounded-xl shadow-lg transition-all duration-200 ${
              accessCode.length === 6 && !loading
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={accessCode.length !== 6 || loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('member.login.verifying')}
              </span>
            ) : accessCode.length === 6 ? (
              t('member.login.buttonAccess')
            ) : (
              t('member.login.buttonIncomplete', { count: accessCode.length })
            )}
          </button>
        </form>
      </div>

      {/* Cards Informativos */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Instruções */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-3">{t('member.login.info.title')}</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('member.login.info.tip1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span dangerouslySetInnerHTML={{ __html: t('member.login.info.tip2') }} />
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('member.login.info.tip3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Privacidade */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-3">{t('member.login.security.title')}</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span dangerouslySetInnerHTML={{ __html: t('member.login.security.tip1') }} />
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span dangerouslySetInnerHTML={{ __html: t('member.login.security.tip2') }} />
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('member.login.security.tip3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
