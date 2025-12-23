import { useState } from 'react';
import { isValidEmail } from '@/utils/validation';
import { sanitizeEmail } from '@/utils/sanitization';

/**
 * Componente de Login do Gestor
 * Permite ao gestor criar nova avaliação ou acessar existente
 */

interface ManagerLoginProps {
  onLogin: (email: string, mode: 'create' | 'access', token?: string) => void;
}

export function ManagerLogin({ onLogin }: ManagerLoginProps) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [mode, setMode] = useState<'create' | 'access'>('create');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: string[] = [];

    // Valida email
    const sanitizedEmail = sanitizeEmail(email);
    if (!isValidEmail(sanitizedEmail)) {
      validationErrors.push('Email inválido');
    }

    // Se modo "access", valida token
    if (mode === 'access' && !token.trim()) {
      validationErrors.push('Token é obrigatório para acessar avaliação existente');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onLogin(sanitizedEmail, mode, mode === 'access' ? token : undefined);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-primary-900 mb-6">
        Portal do Gestor
      </h2>

      {/* Seletor de Modo */}
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`btn flex-1 ${
            mode === 'create' ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          Criar Nova Avaliação
        </button>
        <button
          type="button"
          onClick={() => setMode('access')}
          className={`btn flex-1 ${
            mode === 'access' ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          Acessar Avaliação Existente
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email do Gestor
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="seu.email@empresa.com"
            required
            autoComplete="email"
          />
          <p className="form-help">
            {mode === 'create'
              ? 'Você receberá um token de acesso por email'
              : 'Use o mesmo email cadastrado na avaliação'}
          </p>
        </div>

        {/* Token (apenas no modo access) */}
        {mode === 'access' && (
          <div className="form-group">
            <label htmlFor="token" className="form-label">
              Token de Acesso
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="form-input font-mono"
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              required
            />
            <p className="form-help">
              Token UUID recebido ao criar a avaliação
            </p>
          </div>
        )}

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

        {/* Botão de Submit */}
        <button type="submit" className="btn btn-primary w-full">
          {mode === 'create' ? 'Criar Nova Avaliação' : 'Acessar Dashboard'}
        </button>
      </form>

      {/* Informações */}
      <div className="mt-6 p-4 bg-primary-50 rounded-lg">
        <h3 className="font-semibold text-primary-900 mb-2">
          {mode === 'create' ? 'Como funciona?' : 'Esqueceu o token?'}
        </h3>
        <ul className="text-sm text-primary-700 space-y-1">
          {mode === 'create' ? (
            <>
              <li>• Informe seu email profissional</li>
              <li>• Crie a avaliação e adicione os membros da equipe</li>
              <li>• Guarde o token UUID para acessar depois</li>
              <li>• Os membros receberão códigos de acesso por email</li>
            </>
          ) : (
            <>
              <li>• O token foi enviado ao criar a avaliação</li>
              <li>• Verifique seu email (pode estar no spam)</li>
              <li>• Formato: xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx</li>
              <li>• Caso não encontre, crie uma nova avaliação</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
