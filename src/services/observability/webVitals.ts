/**
 * Web Vitals Monitoring
 * Monitora Core Web Vitals (LCP, FID, CLS) e outras métricas de performance
 *
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): Tempo até maior elemento visível
 * - FID (First Input Delay): Tempo até primeira interação
 * - CLS (Cumulative Layout Shift): Estabilidade visual
 *
 * Outras métricas:
 * - TTFB (Time to First Byte): Tempo até primeiro byte
 * - FCP (First Contentful Paint): Tempo até primeiro conteúdo
 * - INP (Interaction to Next Paint): Responsividade de interações
 */

import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import { logger } from './logger';

export interface WebVitalsReport {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Thresholds para rating (baseado em Google)
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },      // ms
  FID: { good: 100, poor: 300 },        // ms
  CLS: { good: 0.1, poor: 0.25 },       // score
  TTFB: { good: 800, poor: 1800 },      // ms
  FCP: { good: 1800, poor: 3000 },      // ms
  INP: { good: 200, poor: 500 },        // ms
};

/**
 * Determina rating baseado nos thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Processa métrica e envia para logging
 */
function handleMetric(metric: Metric): void {
  const report: WebVitalsReport = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  };

  // Log com contexto apropriado
  const logLevel = report.rating === 'poor' ? 'warn' : 'info';
  const message = `Web Vital: ${report.name} = ${report.value.toFixed(2)} (${report.rating})`;

  if (logLevel === 'warn') {
    logger.warn(message, {
      component: 'WebVitals',
      metric: report.name,
      value: report.value,
      rating: report.rating,
      delta: report.delta,
    });
  } else {
    logger.info(message, {
      component: 'WebVitals',
      metric: report.name,
      value: report.value,
      rating: report.rating,
      delta: report.delta,
    });
  }

  // Enviar para analytics (opcional)
  sendToAnalytics(report);
}

/**
 * Envia métricas para analytics (Google Analytics, Firebase, etc)
 */
function sendToAnalytics(report: WebVitalsReport): void {
  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', report.name, {
      event_category: 'Web Vitals',
      value: Math.round(report.value),
      event_label: report.id,
      non_interaction: true,
      metric_rating: report.rating,
    });
  }

  // Firebase Analytics
  if (typeof window !== 'undefined' && (window as any).firebase?.analytics) {
    (window as any).firebase.analytics().logEvent('web_vital', {
      metric_name: report.name,
      metric_value: report.value,
      metric_rating: report.rating,
      metric_id: report.id,
    });
  }

  // Custom analytics endpoint (se necessário)
  // fetch('/api/analytics/web-vitals', {
  //   method: 'POST',
  //   body: JSON.stringify(report),
  // });
}

/**
 * Inicializa monitoramento de Web Vitals
 * Deve ser chamado no ponto de entrada da aplicação (main.tsx ou App.tsx)
 */
export function initWebVitals(): void {
  // Só monitora em produção
  if (import.meta.env.DEV) {
    logger.debug('Web Vitals monitoring disabled in development');
    return;
  }

  logger.info('Initializing Web Vitals monitoring', {
    component: 'WebVitals',
  });

  try {
    // Core Web Vitals
    onLCP(handleMetric);
    onFID(handleMetric);
    onCLS(handleMetric);

    // Outras métricas importantes
    onTTFB(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric);

    logger.info('Web Vitals monitoring initialized successfully', {
      component: 'WebVitals',
      metrics: ['LCP', 'FID', 'CLS', 'TTFB', 'FCP', 'INP'],
    });
  } catch (error) {
    logger.error('Failed to initialize Web Vitals monitoring', error as Error, {
      component: 'WebVitals',
    });
  }
}

/**
 * Obtém métricas de performance adicionais
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Timing de navegação
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart || 0,
    tcp: navigation?.connectEnd - navigation?.connectStart || 0,
    ttfb: navigation?.responseStart - navigation?.requestStart || 0,
    download: navigation?.responseEnd - navigation?.responseStart || 0,
    domInteractive: navigation?.domInteractive - navigation?.fetchStart || 0,
    domComplete: navigation?.domComplete - navigation?.fetchStart || 0,
    loadComplete: navigation?.loadEventEnd - navigation?.fetchStart || 0,

    // Paint timing
    fcp: paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0,

    // Recursos
    resourceCount: performance.getEntriesByType('resource').length,

    // Memória (se disponível)
    memory: (performance as any).memory
      ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        }
      : null,
  };
}

/**
 * Log de métricas de performance ao carregar página
 */
export function logPerformanceMetrics(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const metrics = getPerformanceMetrics();

      if (metrics) {
        logger.info('Page load performance metrics', {
          component: 'Performance',
          ...metrics,
        });

        // Alertar se performance está ruim
        if (metrics.loadComplete > 5000) {
          logger.warn('Slow page load detected', {
            component: 'Performance',
            loadComplete: metrics.loadComplete,
          });
        }

        if (metrics.memory && metrics.memory.usedJSHeapSize > 50 * 1024 * 1024) {
          logger.warn('High memory usage detected', {
            component: 'Performance',
            usedJSHeapSize: metrics.memory.usedJSHeapSize,
          });
        }
      }
    }, 0);
  });
}

/**
 * Monitor de performance de recursos (scripts, images, etc)
 */
export function monitorResourcePerformance(): void {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;

        // Alertar recursos lentos (>1s)
        if (resource.duration > 1000) {
          logger.warn('Slow resource detected', {
            component: 'Performance',
            resource: resource.name,
            duration: resource.duration,
            size: resource.transferSize,
            type: resource.initiatorType,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    logger.debug('Resource performance monitoring initialized', {
      component: 'Performance',
    });
  } catch (error) {
    logger.error('Failed to initialize resource monitoring', error as Error, {
      component: 'Performance',
    });
  }
}

/**
 * Inicializa todo o monitoramento de performance
 */
export function initPerformanceMonitoring(): void {
  initWebVitals();
  logPerformanceMetrics();
  monitorResourcePerformance();

  logger.info('Performance monitoring fully initialized', {
    component: 'Performance',
  });
}
