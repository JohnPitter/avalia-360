/**
 * Domain Repository Interface: IResponseRepository
 *
 * Define o contrato para operações de persistência de Response
 */

import {Response} from '../entities/Response';

export interface IResponseRepository {
  /**
   * Salvar uma nova resposta
   */
  save(response: Response): Promise<Response>;

  /**
   * Buscar resposta por ID
   */
  findById(id: string): Promise<Response | null>;

  /**
   * Buscar todas as respostas de uma avaliação
   */
  findByEvaluationId(evaluationId: string): Promise<Response[]>;

  /**
   * Buscar respostas de um avaliador específico
   */
  findByEvaluatorId(evaluationId: string, evaluatorId: string): Promise<Response[]>;

  /**
   * Buscar respostas para um avaliado específico
   */
  findByEvaluatedId(evaluationId: string, evaluatedId: string): Promise<Response[]>;

  /**
   * Contar total de respostas de uma avaliação
   */
  countByEvaluationId(evaluationId: string): Promise<number>;

  /**
   * Verificar se já existe resposta de um avaliador para um avaliado
   */
  exists(evaluationId: string, evaluatorId: string, evaluatedId: string): Promise<boolean>;
}
