/**
 * EmailJS Mock Service - Para Testes E2E
 *
 * Simula envio de emails sem fazer chamadas reais à API
 * Útil para:
 * - Testes E2E com Playwright
 * - Desenvolvimento local
 * - Ambientes onde EmailJS não está configurado
 */

import { logger } from '../observability/logger';
import type { EmailData, EmailResult } from './emailjs.service';

/**
 * Store de emails enviados (para validação em testes)
 */
export const sentEmails: EmailData[] = [];

/**
 * Limpa histórico de emails enviados
 */
export function clearSentEmails(): void {
  sentEmails.length = 0;
}

/**
 * Mock: Simula envio de email
 * Armazena no array para validação
 *
 * @param emailData - Dados do email
 * @returns Resultado simulado (sempre sucesso)
 */
export async function mockSendInviteEmail(
  emailData: EmailData
): Promise<EmailResult> {
  logger.info('[MOCK] Sending invite email', {
    component: 'EmailServiceMock',
    to: emailData.to_email,
    evaluation: emailData.evaluation_title,
  });

  // Simula delay de rede (100-300ms)
  const delay = Math.random() * 200 + 100;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Armazena para validação
  sentEmails.push(emailData);

  // Simula falha aleatória (5% de chance)
  const shouldFail = Math.random() < 0.05;

  if (shouldFail) {
    logger.warn('[MOCK] Simulated email failure', {
      component: 'EmailServiceMock',
      to: emailData.to_email,
    });

    return {
      success: false,
      error: 'Simulated network error',
    };
  }

  const messageId = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  logger.info('[MOCK] Invite email sent successfully', {
    component: 'EmailServiceMock',
    to: emailData.to_email,
    messageId,
  });

  return {
    success: true,
    messageId,
  };
}

/**
 * Mock: Envia emails para múltiplos colaboradores
 *
 * @param members - Lista de membros
 * @param evaluationTitle - Título da avaliação
 * @param managerName - Nome do gestor
 * @returns Resultados simulados
 */
export async function mockSendBulkInviteEmails(
  members: Array<{ name: string; email: string; accessCode: string }>,
  evaluationTitle: string,
  managerName: string
): Promise<EmailResult[]> {
  logger.info('[MOCK] Sending bulk invite emails', {
    component: 'EmailServiceMock',
    count: members.length,
    evaluation: evaluationTitle,
  });

  const baseUrl = window.location.origin;
  const results: EmailResult[] = [];

  for (const member of members) {
    const emailData: EmailData = {
      to_name: member.name,
      to_email: member.email,
      access_code: member.accessCode,
      evaluation_title: evaluationTitle,
      manager_name: managerName,
      evaluation_url: `${baseUrl}/?role=member`,
    };

    const result = await mockSendInviteEmail(emailData);
    results.push(result);

    // Pequeno delay entre emails
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  logger.info('[MOCK] Bulk invite emails completed', {
    component: 'EmailServiceMock',
    total: members.length,
    successful,
    failed,
  });

  return results;
}

/**
 * Obtém email enviado por código de acesso
 * Útil para validação em testes
 *
 * @param accessCode - Código de acesso
 * @returns Dados do email ou null
 */
export function getSentEmailByAccessCode(
  accessCode: string
): EmailData | null {
  return sentEmails.find((email) => email.access_code === accessCode) || null;
}

/**
 * Obtém todos os emails enviados para uma avaliação
 *
 * @param evaluationTitle - Título da avaliação
 * @returns Lista de emails
 */
export function getSentEmailsByEvaluation(
  evaluationTitle: string
): EmailData[] {
  return sentEmails.filter(
    (email) => email.evaluation_title === evaluationTitle
  );
}

/**
 * Valida que email foi enviado com dados corretos
 * Útil em assertions de testes E2E
 *
 * @param accessCode - Código de acesso esperado
 * @param expectedData - Dados esperados parciais
 * @returns true se encontrou e bate
 */
export function validateEmailWasSent(
  accessCode: string,
  expectedData: Partial<EmailData>
): boolean {
  const email = getSentEmailByAccessCode(accessCode);

  if (!email) {
    logger.warn('[MOCK] Email not found for access code', {
      component: 'EmailServiceMock',
      accessCode,
    });
    return false;
  }

  // Valida campos esperados
  for (const [key, value] of Object.entries(expectedData)) {
    if (email[key as keyof EmailData] !== value) {
      logger.warn('[MOCK] Email field mismatch', {
        component: 'EmailServiceMock',
        field: key,
        expected: value,
        actual: email[key as keyof EmailData],
      });
      return false;
    }
  }

  return true;
}
