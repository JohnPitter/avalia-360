/**
 * Infrastructure: Firestore Member Repository
 */

import * as admin from 'firebase-admin';
import {Member} from '../../domain/entities/Member';
import {IMemberRepository} from '../../domain/repositories/IMemberRepository';
import {HashService} from '../security/HashService';

export class FirestoreMemberRepository implements IMemberRepository {
  private collection = admin.firestore().collection('team_members');

  async save(member: Member): Promise<Member> {
    const docRef = await this.collection.add(this.toFirestore(member));
    return new Member(
      docRef.id,
      member.evaluationId,
      member.name,
      member.email,
      member.accessCode,
      member.completedEvaluations,
      member.totalEvaluations,
      member.lastAccessDate
    );
  }

  async saveMany(members: Member[]): Promise<Member[]> {
    const saved: Member[] = [];
    for (const member of members) {
      saved.push(await this.save(member));
    }
    return saved;
  }

  async findById(id: string): Promise<Member | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.fromFirestore(doc.id, doc.data()!);
  }

  async findByAccessCode(accessCodeHash: string): Promise<Member | null> {
    const snapshot = await this.collection
      .where('access_code', '==', accessCodeHash)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.fromFirestore(doc.id, doc.data());
  }

  async findByEvaluationId(evaluationId: string): Promise<Member[]> {
    const snapshot = await this.collection
      .where('evaluation_id', '==', evaluationId)
      .get();

    return snapshot.docs.map((doc) => this.fromFirestore(doc.id, doc.data()));
  }

  async updateLastAccess(id: string, date: Date): Promise<void> {
    await this.collection.doc(id).update({
      last_access_date: admin.firestore.Timestamp.fromDate(date),
    });
  }

  async incrementCompleted(id: string): Promise<void> {
    await this.collection.doc(id).update({
      completed_evaluations: admin.firestore.FieldValue.increment(1),
    });
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  private toFirestore(member: Member): any {
    return {
      evaluation_id: member.evaluationId,
      name: member.name,
      email: member.email,
      email_hash: HashService.hashEmail(member.email),
      access_code: HashService.hashAccessCode(member.accessCode),
      completed_evaluations: member.completedEvaluations,
      total_evaluations: member.totalEvaluations,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      last_access_date: member.lastAccessDate ?
        admin.firestore.Timestamp.fromDate(member.lastAccessDate) :
        null,
    };
  }

  private fromFirestore(id: string, data: any): Member {
    // Converte last_access_date para Date de forma segura
    let lastAccessDate: Date | undefined = undefined;
    if (data.last_access_date) {
      if (typeof data.last_access_date.toDate === 'function') {
        // Firestore Timestamp
        lastAccessDate = data.last_access_date.toDate();
      } else if (typeof data.last_access_date === 'number') {
        // Unix timestamp em milissegundos
        lastAccessDate = new Date(data.last_access_date);
      } else if (data.last_access_date instanceof Date) {
        // Já é Date
        lastAccessDate = data.last_access_date;
      }
    }

    return new Member(
      id,
      data.evaluation_id,
      data.name,
      data.email,
      '', // access_code hasheado não retorna
      data.completed_evaluations || 0,
      data.total_evaluations || 0,
      lastAccessDate
    );
  }
}
