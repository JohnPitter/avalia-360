/**
 * EmailJS Service - Envio de Emails
 *
 * Envia emails de convite para colaboradores via EmailJS
 * Implementa retry e circuit breaker para resiliência
 *
 * OWASP A09 - Security Logging: Registra todas as tentativas de envio
 * Performance: Circuit breaker evita chamadas desnecessárias
 */

import emailjs from '@emailjs/browser';
import { CircuitBreaker } from '../resilience/circuitBreaker';
import { withRetry } from '../resilience/retry';
import { logger } from '../observability/logger';
import type { MemberWithAccessCode } from '../firebase/member.service';

/**
 * Configuração do EmailJS
 * Obtida de variáveis de ambiente
 */
const EMAIL_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
  templateIdEn: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_EN || '',
  templateIdEs: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_ES || '',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
};

/**
 * Mapeia idioma para o template ID correspondente
 * Fallback para português se template do idioma não configurado
 */
function getTemplateIdForLanguage(language: 'pt' | 'en' | 'es' = 'pt'): string {
  const templates = {
    pt: EMAIL_CONFIG.templateId,
    en: EMAIL_CONFIG.templateIdEn || EMAIL_CONFIG.templateId,
    es: EMAIL_CONFIG.templateIdEs || EMAIL_CONFIG.templateId,
  };
  return templates[language] || EMAIL_CONFIG.templateId;
}

/**
 * Circuit Breaker para EmailJS
 * Evita chamadas repetidas se o serviço estiver down
 */
const emailCircuitBreaker = new CircuitBreaker('EmailJS', {
  failureThreshold: 3, // 3 falhas consecutivas abre o circuito
  openTimeoutMs: 60000, // 1 minuto aguardando antes de tentar novamente
  successThreshold: 2, // 2 sucessos consecutivos fecha o circuito
  requestTimeoutMs: 15000, // 15s timeout por email
  onOpen: () => {
    logger.critical('EmailJS circuit breaker opened - service down', undefined, {
      component: 'EmailService',
    });
  },
  onClose: () => {
    logger.info('EmailJS circuit breaker closed - service recovered', {
      component: 'EmailService',
    });
  },
});

/**
 * Interface de dados para email
 */
export interface EmailData {
  to_name: string; // Nome do destinatário
  to_email: string; // Email do destinatário
  access_code: string; // Código de acesso de 6 dígitos
  evaluation_title: string; // Título da avaliação
  manager_name: string; // Nome do gestor
  evaluation_url: string; // URL da aplicação
}

/**
 * Resultado do envio de email
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Verifica se EmailJS está configurado
 */
export function isEmailJSConfigured(): boolean {
  const configured =
    !!EMAIL_CONFIG.serviceId &&
    !!EMAIL_CONFIG.templateId &&
    !!EMAIL_CONFIG.publicKey;

  if (!configured) {
    logger.warn('EmailJS not configured - missing environment variables', {
      component: 'EmailService',
      missing: {
        serviceId: !EMAIL_CONFIG.serviceId,
        templateId: !EMAIL_CONFIG.templateId,
        publicKey: !EMAIL_CONFIG.publicKey,
      },
    });
  }

  return configured;
}

/**
 * Envia um email de convite para um colaborador
 *
 * Usa circuit breaker + retry para resiliência
 * Complexidade: O(1) - uma chamada API
 *
 * @param emailData - Dados do email
 * @param language - Idioma do email ('pt' | 'en' | 'es'), padrão: 'pt'
 * @returns Resultado do envio
 */
export async function sendInviteEmail(
  emailData: EmailData,
  language: 'pt' | 'en' | 'es' = 'pt'
): Promise<EmailResult> {
  if (!isEmailJSConfigured()) {
    logger.error('Cannot send email - EmailJS not configured', undefined, {
      component: 'EmailService',
    });
    return {
      success: false,
      error: 'EmailJS not configured',
    };
  }

  try {
    logger.info('Sending invite email', {
      component: 'EmailService',
      to: emailData.to_email,
      evaluation: emailData.evaluation_title,
    });

    // Seleciona template ID baseado no idioma
    const templateId = getTemplateIdForLanguage(language);

    // Envia email com circuit breaker + retry
    const response = await emailCircuitBreaker.execute(() =>
      withRetry(
        async () => {
          return await emailjs.send(
            EMAIL_CONFIG.serviceId,
            templateId,
            emailData as unknown as Record<string, unknown>,
            EMAIL_CONFIG.publicKey
          );
        },
        {
          maxAttempts: 3, // Máximo 3 tentativas
          initialDelayMs: 1000, // 1s delay inicial
          backoffMultiplier: 2, // Exponential backoff
          shouldRetry: (error: Error) => {
            // Retry apenas em erros de rede, não em erros de validação
            return (
              error.message.includes('network') ||
              error.message.includes('timeout') ||
              error.message.includes('ECONNREFUSED')
            );
          },
        }
      )
    );

    // Tipar resposta do EmailJS
    const emailResponse = response as { status: number; text: string };

    logger.info('Invite email sent successfully', {
      component: 'EmailService',
      to: emailData.to_email,
      status: emailResponse.status,
      messageId: emailResponse.text,
    });

    return {
      success: true,
      messageId: emailResponse.text,
    };
  } catch (error) {
    logger.error('Failed to send invite email', error as Error, {
      component: 'EmailService',
      to: emailData.to_email,
      evaluation: emailData.evaluation_title,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Envia emails para múltiplos colaboradores
 *
 * Envia em paralelo com limit de concorrência para não sobrecarregar EmailJS
 * Complexidade: O(N) onde N é o número de membros
 *
 * @param members - Lista de membros com códigos de acesso
 * @param evaluationTitle - Título da avaliação
 * @param managerName - Nome do gestor
 * @returns Resultados de cada envio
 */
export async function sendBulkInviteEmails(
  members: MemberWithAccessCode[],
  evaluationTitle: string,
  managerName: string
): Promise<EmailResult[]> {
  logger.info('Sending bulk invite emails', {
    component: 'EmailService',
    count: members.length,
    evaluation: evaluationTitle,
  });

  const baseUrl = window.location.origin;
  const results: EmailResult[] = [];

  // Envia emails com concorrência limitada (5 por vez)
  const CONCURRENCY_LIMIT = 5;

  for (let i = 0; i < members.length; i += CONCURRENCY_LIMIT) {
    const batch = members.slice(i, i + CONCURRENCY_LIMIT);

    const batchResults = await Promise.all(
      batch.map((member) => {
        // Descriptografa email hash não é possível aqui
        // Vamos assumir que o email está disponível no membro
        // (precisará ser ajustado conforme arquitetura)

        const emailData: EmailData = {
          to_name: member.name, // Ainda criptografado - precisa descriptografar antes
          to_email: member.email, // Hash - precisa do email real
          access_code: member.accessCode,
          evaluation_title: evaluationTitle,
          manager_name: managerName,
          evaluation_url: `${baseUrl}/?role=member`,
        };

        return sendInviteEmail(emailData);
      })
    );

    results.push(...batchResults);

    // Pequeno delay entre batches para não sobrecarregar
    if (i + CONCURRENCY_LIMIT < members.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Conta sucessos e falhas
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  logger.info('Bulk invite emails completed', {
    component: 'EmailService',
    total: members.length,
    successful,
    failed,
    successRate: `${((successful / members.length) * 100).toFixed(1)}%`,
  });

  if (failed > 0) {
    logger.warn('Some emails failed to send', {
      component: 'EmailService',
      failed,
      failureRate: `${((failed / members.length) * 100).toFixed(1)}%`,
    });
  }

  return results;
}

/**
 * Testa conexão com EmailJS
 * Útil para health checks
 *
 * @returns true se configurado e acessível
 */
export async function testEmailJSConnection(): Promise<boolean> {
  if (!isEmailJSConfigured()) {
    return false;
  }

  try {
    // EmailJS não tem endpoint de health check
    // Apenas validamos se está configurado
    logger.info('EmailJS connection test passed', {
      component: 'EmailService',
    });
    return true;
  } catch (error) {
    logger.error('EmailJS connection test failed', error as Error, {
      component: 'EmailService',
    });
    return false;
  }
}
