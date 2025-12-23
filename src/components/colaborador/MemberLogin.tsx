import { useState } from 'react';
import { isValidAccessCode } from '@/utils/validation';
import { sanitizeNumeric } from '@/utils/sanitization';

/**
 * Componente de Login do Colaborador
 * Permite acesso via código de 6 dígitos
 */

interface MemberLoginProps {
  onLogin: (accessCode: string) => void;
}

export function MemberLogin({ onLogin }: MemberLoginProps) {
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
      validationErrors.push('Código deve ter exatamente 6 dígitos');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onLogin(accessCode);
  };

  return (
    <div className="card max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-primary-900">
          Avaliação 360°
        </h2>
        <p className="text-gray-600 mt-2">Portal do Colaborador</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Código de Acesso */}
        <div className="form-group">
          <label htmlFor="accessCode" className="form-label">
            Código de Acesso
          </label>
          <input
            type="text"
            id="accessCode"
            value={accessCode}
            onChange={(e) => handleInputChange(e.target.value)}
            className="form-input text-center text-2xl font-mono tracking-widest"
            placeholder="000000"
            maxLength={6}
            autoFocus
            autoComplete="off"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <p className="form-help text-center">
            Digite o código de 6 dígitos que você recebeu por email
          </p>

          {/* Indicador Visual */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center text-xl font-bold ${
                  i < accessCode.length
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {accessCode[i] || '·'}
              </div>
            ))}
          </div>
        </div>

        {/* Erros */}
        {errors.length > 0 && (
          <div className="alert-error">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Botão */}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={accessCode.length !== 6}
        >
          Acessar Avaliação
        </button>
      </form>

      {/* Instruções */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">
          📧 Onde está meu código?
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Verifique seu email (pode estar na caixa de spam)</li>
          <li>• O código tem exatamente <strong>6 dígitos</strong></li>
          <li>• Foi enviado pelo gestor da sua equipe</li>
          <li>• Em caso de dúvida, entre em contato com o gestor</li>
        </ul>
      </div>

      {/* Informações sobre Privacidade */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">
          🔒 Privacidade e Segurança
        </h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Suas avaliações são <strong>100% anônimas</strong></li>
          <li>• Os dados são <strong>criptografados</strong></li>
          <li>• O gestor vê apenas médias consolidadas</li>
          <li>• Ninguém saberá quem avaliou quem</li>
        </ul>
      </div>
    </div>
  );
}
