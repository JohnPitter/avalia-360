/**
 * Badge Component
 * Pequenos labels para status, categorias, contadores, etc.
 */

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
  className = '',
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-700 border-primary-200',
    success: 'bg-success-100 text-success-700 border-success-200',
    warning: 'bg-warning-100 text-warning-700 border-warning-200',
    error: 'bg-error-100 text-error-700 border-error-200',
    info: 'bg-info-100 text-info-700 border-info-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded';

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${roundedClass}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  size?: BadgeSize;
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pendente',
      variant: 'warning' as BadgeVariant,
    },
    in_progress: {
      label: 'Em Andamento',
      variant: 'info' as BadgeVariant,
    },
    completed: {
      label: 'Concluído',
      variant: 'success' as BadgeVariant,
    },
    failed: {
      label: 'Falhou',
      variant: 'error' as BadgeVariant,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} rounded>
      {config.label}
    </Badge>
  );
}

interface CountBadgeProps {
  count: number;
  variant?: BadgeVariant;
  max?: number;
}

export function CountBadge({ count, variant = 'primary', max = 99 }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count;

  return (
    <Badge variant={variant} size="sm" rounded>
      {displayCount}
    </Badge>
  );
}

interface RatingBadgeProps {
  rating: number;
  size?: BadgeSize;
}

export function RatingBadge({ rating, size = 'md' }: RatingBadgeProps) {
  const getRatingConfig = (value: number) => {
    if (value >= 4.5)
      return { label: 'Excelente', variant: 'success' as BadgeVariant };
    if (value >= 4.0) return { label: 'Bom', variant: 'info' as BadgeVariant };
    if (value >= 3.5)
      return { label: 'Adequado', variant: 'primary' as BadgeVariant };
    if (value >= 3.0)
      return { label: 'Abaixo da Média', variant: 'warning' as BadgeVariant };
    return { label: 'Insatisfatório', variant: 'error' as BadgeVariant };
  };

  const config = getRatingConfig(rating);

  return (
    <Badge variant={config.variant} size={size} rounded>
      {rating.toFixed(1)} - {config.label}
    </Badge>
  );
}
