import { ValidationError } from "../errors/DomainError";

export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  // Construtor estático privado para blindar "Primitive Obsession"
  public static create(email: string): Email {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Endereço de e-mail inválido.");
    }
    return new Email(email);
  }

  public getValue(): string {
    return this.value;
  }
}
