import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/**
 * Gráfico de Barras para comparar desempenho da equipe
 * Mostra média geral de cada membro em ordem decrescente
 */

interface TeamMemberData {
  name: string;
  average: number;
  responses: number;
}

interface TeamComparisonChartProps {
  data: TeamMemberData[];
}

export function TeamComparisonChart({ data }: TeamComparisonChartProps) {
  const { t } = useTranslation();

  // Ordenar por média decrescente
  const sortedData = [...data].sort((a, b) => b.average - a.average);

  // Cores baseadas na performance
  const getColor = (average: number): string => {
    if (average >= 4.5) return '#10b981'; // green-500 - Excelente
    if (average >= 4.0) return '#3b82f6'; // blue-500 - Bom
    if (average >= 3.5) return '#8b5cf6'; // purple-500 - Adequado
    if (average >= 3.0) return '#f59e0b'; // amber-500 - Abaixo da Média
    return '#ef4444'; // red-500 - Insatisfatório
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        {t('shared.teamComparisonChart.title')}
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#374151', fontSize: 11 }}
            interval={0}
          />
          <YAxis
            domain={[0, 5]}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            label={{
              value: t('shared.teamComparisonChart.averageLabel'),
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#374151', fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.75rem',
            }}
            formatter={(value: number, _name: string, props: any) => [
              <>
                <div>{t('shared.teamComparisonChart.tooltipAverage', { value: (value as number).toFixed(2) })}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {t('shared.teamComparisonChart.tooltipResponses', { responses: props.payload.responses })}
                </div>
              </>,
              '',
            ]}
            labelFormatter={(name) => `${name}`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '1rem' }}
            formatter={() => t('shared.teamComparisonChart.legend')}
          />
          <Bar dataKey="average" radius={[8, 8, 0, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.average)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-gray-700">≥ 4.5 {t('shared.teamComparisonChart.ratings.excellent')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span className="text-gray-700">≥ 4.0 {t('shared.teamComparisonChart.ratings.good')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500"></div>
          <span className="text-gray-700">≥ 3.5 {t('shared.teamComparisonChart.ratings.adequate')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span className="text-gray-700">≥ 3.0 {t('shared.teamComparisonChart.ratings.belowAverage')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-gray-700">&lt; 3.0 {t('shared.teamComparisonChart.ratings.unsatisfactory')}</span>
        </div>
      </div>
    </div>
  );
}
