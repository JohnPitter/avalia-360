/**
 * Utilitários para exportação de resultados
 * Permite exportar resultados em diferentes formatos
 *
 * Formatos suportados:
 * - TXT (texto simples)
 * - Excel (.xlsx)
 * - CSV
 */

import * as XLSX from 'xlsx';
import type { Evaluation, ConsolidatedResult } from '@/types';

/**
 * Exporta resultados como arquivo de texto (.txt)
 */
export function exportToText(
  evaluation: Evaluation,
  results: ConsolidatedResult[]
): void {
  const sortedResults = [...results].sort(
    (a, b) => b.averages.overall - a.averages.overall
  );

  const totalMembers = results.length;
  const overallAverage =
    results.reduce((sum, r) => sum + r.averages.overall, 0) / totalMembers || 0;
  const highestScore = Math.max(...results.map((r) => r.averages.overall), 0);
  const lowestScore = Math.min(...results.map((r) => r.averages.overall), 5);

  const content = `RESULTADOS - ${evaluation.title}
Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}

${'='.repeat(80)}
ESTATÍSTICAS GERAIS
${'='.repeat(80)}

Total de Membros Avaliados: ${totalMembers}
Média Geral da Equipe: ${overallAverage.toFixed(2)} / 5.00
Maior Pontuação: ${highestScore.toFixed(2)} / 5.00
Menor Pontuação: ${lowestScore.toFixed(2)} / 5.00

${'='.repeat(80)}
RESULTADOS INDIVIDUAIS
${'='.repeat(80)}

${sortedResults
  .map(
    (result, index) => `
${'─'.repeat(80)}
${index + 1}. ${result.member.name.toUpperCase()}
${'─'.repeat(80)}

MÉDIAS POR CATEGORIA:
  • Satisfação:            ${result.averages.question_1.toFixed(2)} / 5.00
  • Proatividade:          ${result.averages.question_2.toFixed(2)} / 5.00
  • Qualidade:             ${result.averages.question_3.toFixed(2)} / 5.00
  • Trabalho em Equipe:    ${result.averages.question_4.toFixed(2)} / 5.00

  ⭐ MÉDIA GERAL: ${result.averages.overall.toFixed(2)} / 5.00

Avaliações Recebidas: ${result.totalResponses}

${result.comments.positive.length > 0 ? `
✅ PONTOS POSITIVOS (${result.comments.positive.length}):
${result.comments.positive.map((c, i) => `   ${i + 1}. ${c}`).join('\n')}
` : ''}
${result.comments.improvement.length > 0 ? `
🔧 PONTOS DE MELHORIA (${result.comments.improvement.length}):
${result.comments.improvement.map((c, i) => `   ${i + 1}. ${c}`).join('\n')}
` : ''}
`
  )
  .join('\n')}

${'='.repeat(80)}
FIM DO RELATÓRIO
${'='.repeat(80)}

Gerado por Sistema de Avaliação 360°
`;

  downloadFile(
    content,
    `resultados-${evaluation.id}-${Date.now()}.txt`,
    'text/plain'
  );
}

/**
 * Exporta resultados como arquivo Excel (.xlsx)
 */
export function exportToExcel(
  evaluation: Evaluation,
  results: ConsolidatedResult[]
): void {
  const sortedResults = [...results].sort(
    (a, b) => b.averages.overall - a.averages.overall
  );

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // ABA 1: Resumo Geral
  const summaryData = [
    ['RELATÓRIO DE AVALIAÇÃO 360°'],
    [''],
    ['Título da Avaliação:', evaluation.title],
    ['Data de Criação:', new Date(evaluation.created_at).toLocaleDateString('pt-BR')],
    ['Data da Exportação:', new Date().toLocaleDateString('pt-BR')],
    [''],
    ['ESTATÍSTICAS GERAIS'],
    ['Total de Membros:', results.length],
    [
      'Média Geral da Equipe:',
      results.reduce((sum, r) => sum + r.averages.overall, 0) / results.length || 0,
    ],
    ['Maior Pontuação:', Math.max(...results.map((r) => r.averages.overall), 0)],
    ['Menor Pontuação:', Math.min(...results.map((r) => r.averages.overall), 5)],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  // ABA 2: Médias por Membro
  const averagesData = sortedResults.map((result) => ({
    'Posição': sortedResults.indexOf(result) + 1,
    'Nome': result.member.name,
    'Média Geral': parseFloat(result.averages.overall.toFixed(2)),
    'Satisfação': parseFloat(result.averages.question_1.toFixed(2)),
    'Proatividade': parseFloat(result.averages.question_2.toFixed(2)),
    'Qualidade': parseFloat(result.averages.question_3.toFixed(2)),
    'Trabalho em Equipe': parseFloat(result.averages.question_4.toFixed(2)),
    'Avaliações Recebidas': result.totalResponses,
  }));

  const wsAverages = XLSX.utils.json_to_sheet(averagesData);
  wsAverages['!cols'] = [
    { wch: 10 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAverages, 'Médias');

  // ABA 3: Comentários Positivos
  const positiveComments: any[] = [];
  sortedResults.forEach((result) => {
    result.comments.positive.forEach((comment) => {
      positiveComments.push({
        'Nome': result.member.name,
        'Comentário Positivo': comment,
      });
    });
  });

  if (positiveComments.length > 0) {
    const wsPositive = XLSX.utils.json_to_sheet(positiveComments);
    wsPositive['!cols'] = [{ wch: 30 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsPositive, 'Pontos Positivos');
  }

  // ABA 4: Pontos de Melhoria
  const improvementComments: any[] = [];
  sortedResults.forEach((result) => {
    result.comments.improvement.forEach((comment) => {
      improvementComments.push({
        'Nome': result.member.name,
        'Ponto de Melhoria': comment,
      });
    });
  });

  if (improvementComments.length > 0) {
    const wsImprovement = XLSX.utils.json_to_sheet(improvementComments);
    wsImprovement['!cols'] = [{ wch: 30 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsImprovement, 'Pontos de Melhoria');
  }

  // Gerar e baixar
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resultados-${evaluation.id}-${Date.now()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta resultados como arquivo CSV
 */
export function exportToCSV(
  evaluation: Evaluation,
  results: ConsolidatedResult[]
): void {
  const sortedResults = [...results].sort(
    (a, b) => b.averages.overall - a.averages.overall
  );

  // Header
  const headers = [
    'Posição',
    'Nome',
    'Média Geral',
    'Satisfação',
    'Proatividade',
    'Qualidade',
    'Trabalho em Equipe',
    'Avaliações Recebidas',
    'Total Comentários Positivos',
    'Total Pontos de Melhoria',
  ];

  // Rows
  const rows = sortedResults.map((result, index) => [
    index + 1,
    `"${result.member.name}"`, // Quote para evitar problemas com vírgulas
    result.averages.overall.toFixed(2),
    result.averages.question_1.toFixed(2),
    result.averages.question_2.toFixed(2),
    result.averages.question_3.toFixed(2),
    result.averages.question_4.toFixed(2),
    result.totalResponses,
    result.comments.positive.length,
    result.comments.improvement.length,
  ]);

  // Gerar CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  downloadFile(
    csvContent,
    `resultados-${evaluation.id}-${Date.now()}.csv`,
    'text/csv'
  );
}

/**
 * Função auxiliar para fazer download de arquivo
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta resultados em todos os formatos de uma vez
 */
export function exportAll(
  evaluation: Evaluation,
  results: ConsolidatedResult[]
): void {
  exportToText(evaluation, results);
  exportToExcel(evaluation, results);
  exportToCSV(evaluation, results);
}
