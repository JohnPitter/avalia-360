/**
 * Domain Repository Interface: IMemberRepository
 *
 * Define o contrato para operações de persistência de Member
 */

import {Member} from '../entities/Member';

export interface IMemberRepository {
  /**
   * Salvar um novo membro
   */
  save(member: Member): Promise<Member>;

  /**
   * Salvar múltiplos membros (batch)
   */
  saveMany(members: Member[]): Promise<Member[]>;

  /**
   * Buscar membro por ID
   */
  findById(id: string): Promise<Member | null>;

  /**
   * Buscar membro por código de acesso (hash)
   */
  findByAccessCode(accessCodeHash: string): Promise<Member | null>;

  /**
   * Buscar todos os membros de uma avaliação
   */
  findByEvaluationId(evaluationId: string): Promise<Member[]>;

  /**
   * Atualizar último acesso do membro
   */
  updateLastAccess(id: string, date: Date): Promise<void>;

  /**
   * Incrementar avaliações completadas
   */
  incrementCompleted(id: string): Promise<void>;

  /**
   * Deletar membro
   */
  delete(id: string): Promise<void>;
}
