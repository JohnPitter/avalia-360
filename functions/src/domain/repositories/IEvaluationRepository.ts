/**
 * Domain Repository Interface: IEvaluationRepository
 *
 * Define o contrato para operações de persistência de Evaluation
 * Não sabe NADA sobre Firestore ou qualquer tecnologia específica
 */

import {Evaluation} from '../entities/Evaluation';

export interface IEvaluationRepository {
  /**
   * Salvar uma nova avaliação
   */
  save(evaluation: Evaluation): Promise<Evaluation>;

  /**
   * Buscar avaliação por ID
   */
  findById(id: string): Promise<Evaluation | null>;

  /**
   * Buscar avaliações por email do criador
   */
  findByCreatorEmail(emailHash: string): Promise<Evaluation[]>;

  /**
   * Atualizar status da avaliação
   */
  updateStatus(id: string, status: 'draft' | 'active' | 'completed'): Promise<void>;

  /**
   * Deletar avaliação
   */
  delete(id: string): Promise<void>;
}
