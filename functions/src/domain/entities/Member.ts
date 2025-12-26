/**
 * Domain Entity: Member
 *
 * Representa um membro da equipe em uma avaliação 360°
 */

export class Member {
  constructor(
    public readonly id: string,
    public readonly evaluationId: string,
    public readonly name: string,
    public readonly email: string,
    public readonly accessCode: string,
    public completedEvaluations: number,
    public readonly totalEvaluations: number,
    public lastAccessDate?: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Member ID is required');
    }

    if (!this.evaluationId || this.evaluationId.trim().length === 0) {
      throw new Error('Evaluation ID is required');
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Member name is required');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error('Valid email is required');
    }

    if (!this.accessCode || !this.isValidAccessCode(this.accessCode)) {
      throw new Error('Valid 6-digit access code is required');
    }

    if (this.completedEvaluations < 0) {
      throw new Error('Completed evaluations cannot be negative');
    }

    if (this.totalEvaluations < 0) {
      throw new Error('Total evaluations cannot be negative');
    }

    if (this.completedEvaluations > this.totalEvaluations) {
      throw new Error('Completed evaluations cannot exceed total evaluations');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidAccessCode(code: string): boolean {
    return /^\d{6}$/.test(code);
  }

  public incrementCompletedEvaluations(): void {
    if (this.completedEvaluations >= this.totalEvaluations) {
      throw new Error('All evaluations already completed');
    }
    this.completedEvaluations++;
  }

  public updateLastAccess(): void {
    this.lastAccessDate = new Date();
  }

  public hasCompletedAll(): boolean {
    return this.completedEvaluations === this.totalEvaluations;
  }

  public getProgressPercentage(): number {
    if (this.totalEvaluations === 0) return 0;
    return Math.round((this.completedEvaluations / this.totalEvaluations) * 100);
  }
}
