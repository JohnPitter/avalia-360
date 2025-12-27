import { useTranslation } from 'react-i18next';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

/**
 * Gráfico de Radar para visualizar desempenho individual
 * Mostra as 4 dimensões de avaliação em formato radar
 */

interface PerformanceRadarChartProps {
  data: {
    question_1: number;
    question_2: number;
    question_3: number;
    question_4: number;
  };
  memberName: string;
}

export function PerformanceRadarChart({ data, memberName }: PerformanceRadarChartProps) {
  const { t } = useTranslation();

  // Transformar dados para formato do Recharts
  const chartData = [
    {
      dimension: t('shared.performanceRadarChart.axes.satisfaction'),
      value: data.question_1,
      fullMark: 5,
    },
    {
      dimension: t('shared.performanceRadarChart.axes.proactivity'),
      value: data.question_2,
      fullMark: 5,
    },
    {
      dimension: t('shared.performanceRadarChart.axes.quality'),
      value: data.question_3,
      fullMark: 5,
    },
    {
      dimension: t('shared.performanceRadarChart.axes.teamwork'),
      value: data.question_4,
      fullMark: 5,
    },
  ];

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        {t('shared.performanceRadarChart.title', { memberName })}
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#374151', fontSize: 12 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name={memberName}
            dataKey="value"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.5rem',
            }}
            formatter={(value: number) => [value.toFixed(2), t('shared.performanceRadarChart.average')]}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '1rem',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>{t('shared.performanceRadarChart.scale')}</p>
      </div>
    </div>
  );
}
