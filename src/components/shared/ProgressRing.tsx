/**
 * Componente de Anel de Progresso (Progress Ring)
 * Círculo animado que mostra percentual de conclusão
 */

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  color?: 'primary' | 'green' | 'amber' | 'red';
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  label,
  color = 'primary',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Cores baseadas no prop
  const colorMap = {
    primary: {
      stroke: '#2563eb',
      text: 'text-primary-600',
    },
    green: {
      stroke: '#10b981',
      text: 'text-green-600',
    },
    amber: {
      stroke: '#f59e0b',
      text: 'text-amber-600',
    },
    red: {
      stroke: '#ef4444',
      text: 'text-red-600',
    },
  };

  const colors = colorMap[color];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Percentage Text */}
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${colors.text}`}>
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      {/* Label */}
      {label && (
        <p className="mt-2 text-sm font-medium text-gray-700 text-center">
          {label}
        </p>
      )}
    </div>
  );
}
