/**
 * Domain Entity: Evaluation
 *
 * Representa uma avaliação 360° no domínio
 * Regras de negócio puras, sem dependências externas
 */

export class Evaluation {
  constructor(
    public readonly id: string,
    public readonly creatorEmail: string,
    public readonly title: string,
    public readonly managerToken: string,
    public readonly createdAt: Date,
    public status: 'draft' | 'active' | 'completed'
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Evaluation ID is required');
    }

    if (!this.creatorEmail || !this.isValidEmail(this.creatorEmail)) {
      throw new Error('Valid creator email is required');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Evaluation title is required');
    }

    if (!this.managerToken || !this.isValidUUID(this.managerToken)) {
      throw new Error('Valid manager token (UUID) is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  public activate(): void {
    if (this.status !== 'draft') {
      throw new Error('Only draft evaluations can be activated');
    }
    this.status = 'active';
  }

  public complete(): void {
    if (this.status !== 'active') {
      throw new Error('Only active evaluations can be completed');
    }
    this.status = 'completed';
  }

  public isDraft(): boolean {
    return this.status === 'draft';
  }

  public isActive(): boolean {
    return this.status === 'active';
  }

  public isCompleted(): boolean {
    return this.status === 'completed';
  }
}
