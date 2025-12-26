/**
 * Infrastructure: Firestore Response Repository
 */

import * as admin from 'firebase-admin';
import {Response} from '../../domain/entities/Response';
import {IResponseRepository} from '../../domain/repositories/IResponseRepository';

export class FirestoreResponseRepository implements IResponseRepository {
  private collection = admin.firestore().collection('responses');

  async save(response: Response): Promise<Response> {
    const docRef = await this.collection.add({
      evaluation_id: response.evaluationId,
      evaluator_id: response.evaluatorId,
      evaluated_id: response.evaluatedId,
      question_1: response.ratings.question_1,
      question_2: response.ratings.question_2,
      question_3: response.ratings.question_3,
      question_4: response.ratings.question_4,
      question_5: response.ratings.question_5,
      positive_comments: response.comments.positive || '',
      improvement_comments: response.comments.improvement || '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return new Response(
      docRef.id,
      response.evaluationId,
      response.evaluatorId,
      response.evaluatedId,
      response.ratings,
      response.comments,
      response.createdAt
    );
  }

  async findById(id: string): Promise<Response | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.fromFirestore(doc.id, doc.data()!);
  }

  async findByEvaluationId(evaluationId: string): Promise<Response[]> {
    const snapshot = await this.collection
      .where('evaluation_id', '==', evaluationId)
      .get();
    return snapshot.docs.map((doc) => this.fromFirestore(doc.id, doc.data()));
  }

  async findByEvaluatorId(
    evaluationId: string,
    evaluatorId: string
  ): Promise<Response[]> {
    const snapshot = await this.collection
      .where('evaluation_id', '==', evaluationId)
      .where('evaluator_id', '==', evaluatorId)
      .get();
    return snapshot.docs.map((doc) => this.fromFirestore(doc.id, doc.data()));
  }

  async findByEvaluatedId(
    evaluationId: string,
    evaluatedId: string
  ): Promise<Response[]> {
    const snapshot = await this.collection
      .where('evaluation_id', '==', evaluationId)
      .where('evaluated_id', '==', evaluatedId)
      .get();
    return snapshot.docs.map((doc) => this.fromFirestore(doc.id, doc.data()));
  }

  async countByEvaluationId(evaluationId: string): Promise<number> {
    const snapshot = await this.collection
      .where('evaluation_id', '==', evaluationId)
      .get();
    return snapshot.size;
  }

  async exists(
    evaluationId: string,
    evaluatorId: string,
    evaluatedId: string
  ): Promise<boolean> {
    const snapshot = await this.collection
      .where('evaluation_id', '==', evaluationId)
      .where('evaluator_id', '==', evaluatorId)
      .where('evaluated_id', '==', evaluatedId)
      .limit(1)
      .get();
    return !snapshot.empty;
  }

  private fromFirestore(id: string, data: any): Response {
    return new Response(
      id,
      data.evaluation_id,
      data.evaluator_id,
      data.evaluated_id,
      {
        question_1: data.question_1,
        question_2: data.question_2,
        question_3: data.question_3,
        question_4: data.question_4,
        question_5: data.question_5,
      },
      {
        positive: data.positive_comments,
        improvement: data.improvement_comments,
      },
      data.created_at?.toDate() || new Date()
    );
  }
}
