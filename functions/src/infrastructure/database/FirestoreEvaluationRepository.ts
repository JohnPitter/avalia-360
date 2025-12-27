/**
 * Infrastructure: Firestore Evaluation Repository
 */

import * as admin from 'firebase-admin';
import {Evaluation} from '../../domain/entities/Evaluation';
import {IEvaluationRepository} from '../../domain/repositories/IEvaluationRepository';
import {CryptoService} from '../security/CryptoService';
import {HashService} from '../security/HashService';

export class FirestoreEvaluationRepository implements IEvaluationRepository {
  private collection = admin.firestore().collection('evaluations');

  async save(evaluation: Evaluation): Promise<Evaluation> {
    const key = CryptoService.generateKey(evaluation.managerToken);
    const encryptedTitle = CryptoService.encrypt(evaluation.title, key);
    const encryptedToken = CryptoService.encrypt(evaluation.managerToken, key);
    const emailHash = HashService.hashEmail(evaluation.creatorEmail);

    const docRef = await this.collection.add({
      creator_email: emailHash,
      creator_token: encryptedToken,
      title: encryptedTitle,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      status: evaluation.status,
    });

    return new Evaluation(
      docRef.id,
      evaluation.creatorEmail,
      evaluation.title,
      evaluation.managerToken,
      evaluation.createdAt,
      evaluation.status
    );
  }

  async findById(id: string): Promise<Evaluation | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data()!;

    // Converte created_at para Date de forma segura
    let createdAt = new Date();
    if (data.created_at) {
      if (typeof data.created_at.toDate === 'function') {
        createdAt = data.created_at.toDate();
      } else if (typeof data.created_at === 'number') {
        createdAt = new Date(data.created_at);
      } else if (data.created_at instanceof Date) {
        createdAt = data.created_at;
      }
    }

    return new Evaluation(
      doc.id,
      '', // Email criptografado
      '', // Título criptografado - precisa token para descriptografar
      '',
      createdAt,
      data.status
    );
  }

  async findByCreatorEmail(emailHash: string): Promise<Evaluation[]> {
    const snapshot = await this.collection
      .where('creator_email', '==', emailHash)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      // Converte created_at para Date de forma segura
      let createdAt = new Date();
      if (data.created_at) {
        if (typeof data.created_at.toDate === 'function') {
          createdAt = data.created_at.toDate();
        } else if (typeof data.created_at === 'number') {
          createdAt = new Date(data.created_at);
        } else if (data.created_at instanceof Date) {
          createdAt = data.created_at;
        }
      }

      return new Evaluation(
        doc.id,
        '',
        '',
        '',
        createdAt,
        data.status
      );
    });
  }

  async updateStatus(
    id: string,
    status: 'draft' | 'active' | 'completed'
  ): Promise<void> {
    await this.collection.doc(id).update({status});
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
