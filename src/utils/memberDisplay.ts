/**
 * Utilit

ários para exibição de dados de membros
 * Lida com nomes criptografados de forma segura
 */

import type { TeamMember } from '@/types';

/**
 * Verifica se um nome está criptografado (formato Base64 do CryptoJS)
 *
 * @param name - Nome para verificar
 * @returns true se está criptografado
 */
export function isEncryptedName(name: string): boolean {
  // CryptoJS retorna strings Base64 começando com "U2FsdGVk" (que é "Salted" em Base64)
  return name.startsWith('U2FsdGVk') && name.length > 20;
}

/**
 * Extrai nome de exibição do email
 * Remove domínio e caracteres especiais
 *
 * @param email - Email do membro
 * @returns Nome amigável extraído do email
 *
 * @example
 * ```ts
 * getDisplayNameFromEmail('joao.silva@company.com') // 'joao.silva'
 * getDisplayNameFromEmail('maria_santos@test.com') // 'maria_santos'
 * ```
 */
export function getDisplayNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];

  // Remove caracteres especiais e substitui por espaços
  const cleaned = localPart
    .replace(/[._-]/g, ' ')
    .trim();

  // Capitaliza primeira letra de cada palavra
  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Obtém nome de exibição seguro para um membro
 * Se o nome estiver criptografado, usa o email como fallback
 *
 * @param member - Membro da equipe
 * @returns Nome descriptografado ou nome amigável do email
 */
export function getDisplayName(member: TeamMember): string {
  if (isEncryptedName(member.name)) {
    return getDisplayNameFromEmail(member.email);
  }

  return member.name;
}

/**
 * Processa lista de membros para exibição
 * Substitui nomes criptografados por nomes amigáveis
 *
 * @param members - Lista de membros
 * @returns Lista com nomes de exibição corrigidos
 */
export function prepareMembersForDisplay(members: TeamMember[]): TeamMember[] {
  return members.map((member) => ({
    ...member,
    name: getDisplayName(member),
  }));
}
