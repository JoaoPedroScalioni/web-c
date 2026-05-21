import { ValidationError } from "../errors/DomainError";

export type AllowedStatuses = 'PENDING_UPLOAD' | 'CRIADO' | 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'REJEITADO' | 'POSTADO';

export class TicketStatus {
  private readonly value: AllowedStatuses;

  private constructor(value: AllowedStatuses) {
    this.value = value;
  }

  public static create(status: string): TicketStatus {
    const allowed: AllowedStatuses[] = [
      'PENDING_UPLOAD', 'CRIADO', 'AGUARDANDO_APROVACAO', 
      'APROVADO', 'REJEITADO', 'POSTADO'
    ];
    
    if (!allowed.includes(status as AllowedStatuses)) {
      throw new ValidationError(`Status inválido: ${status}`);
    }
    return new TicketStatus(status as AllowedStatuses);
  }

  public getValue(): AllowedStatuses {
    return this.value;
  }
}
