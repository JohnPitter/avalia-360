/**
 * Domain Entity: Response
 *
 * Representa uma resposta de avaliação 360°
 */

export interface Ratings {
  question_1: number;
  question_2: number;
  question_3: number;
  question_4: number;
  question_5: number;
}

export interface Comments {
  positive?: string;
  improvement?: string;
}

export class Response {
  constructor(
    public readonly id: string,
    public readonly evaluationId: string,
    public readonly evaluatorId: string,
    public readonly evaluatedId: string,
    public readonly ratings: Ratings,
    public readonly comments: Comments,
    public readonly createdAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Response ID is required');
    }

    if (!this.evaluationId || this.evaluationId.trim().length === 0) {
      throw new Error('Evaluation ID is required');
    }

    if (!this.evaluatorId || this.evaluatorId.trim().length === 0) {
      throw new Error('Evaluator ID is required');
    }

    if (!this.evaluatedId || this.evaluatedId.trim().length === 0) {
      throw new Error('Evaluated ID is required');
    }

    if (this.evaluatorId === this.evaluatedId) {
      throw new Error('Cannot evaluate yourself');
    }

    this.validateRatings();
  }

  private validateRatings(): void {
    const { question_1, question_2, question_3, question_4, question_5 } = this.ratings;

    const allRatings = [question_1, question_2, question_3, question_4, question_5];

    for (const rating of allRatings) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('All ratings must be integers between 1 and 5');
      }
    }
  }

  public getAverageRating(): number {
    const { question_1, question_2, question_3, question_4, question_5 } = this.ratings;
    return (question_1 + question_2 + question_3 + question_4 + question_5) / 5;
  }

  public hasPositiveComment(): boolean {
    return !!this.comments.positive && this.comments.positive.trim().length > 0;
  }

  public hasImprovementComment(): boolean {
    return !!this.comments.improvement && this.comments.improvement.trim().length > 0;
  }
}
