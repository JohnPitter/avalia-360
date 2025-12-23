import { useState } from 'react';
import { isValidTitle } from '@/utils/validation';
import { sanitizeText } from '@/utils/sanitization';

/**
 * Componente de Formulário de Criação de Avaliação
 * Permite definir título e preparar para adicionar membros
 */

interface CreateEvaluationFormProps {
  managerEmail: string;
  onSubmit: (data: { title: string }) => void;
  onCancel: () => void;
}

export function CreateEvaluationForm({
  managerEmail,
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
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-900">
          Nova Avaliação 360°
        </h2>
        <p className="text-gray-600 mt-2">
          Gestor: <span className="font-semibold">{managerEmail}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título da Avaliação */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Título da Avaliação *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="Ex: Avaliação de Desempenho Q4 2024"
            required
            maxLength={200}
            autoFocus
          />
          <p className="form-help">
            Escolha um título descritivo para identificar esta avaliação
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {title.length}/200 caracteres
          </p>
        </div>

        {/* Informações sobre o processo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            📋 Próximos passos:
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Defina o título da avaliação</li>
            <li>Adicione os membros da equipe (mínimo 2)</li>
            <li>Revise os dados e envie os convites</li>
            <li>Acompanhe o progresso no dashboard</li>
          </ol>
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

        {/* Botões */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary flex-1">
            Continuar →
          </button>
        </div>
      </form>

      {/* Dicas */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Dicas:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            • Use títulos que identifiquem o período ou objetivo (ex: "Q4 2024",
            "Anual 2024")
          </li>
          <li>
            • Você pode incluir o nome do time ou departamento (ex: "Time de
            Vendas")
          </li>
          <li>• O título será visível para todos os membros da avaliação</li>
        </ul>
      </div>
    </div>
  );
}
