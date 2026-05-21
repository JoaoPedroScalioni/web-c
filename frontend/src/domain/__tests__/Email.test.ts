import { describe, it, expect } from "vitest";
import { Email } from "../value_objects/Email";
import { ValidationError } from "../errors/DomainError";

describe("Domain: Email Value Object", () => {
  it("Deve criar um Email com sucesso se o formato for válido", () => {
    const validEmail = "contato@elevva.com.br";
    const email = Email.create(validEmail);
    expect(email.getValue()).toBe(validEmail);
  });

  it("Deve lançar ValidationError se o formato do Email for inválido (sem @)", () => {
    expect(() => Email.create("contatoelevva.com")).toThrow(ValidationError);
  });

  it("Deve lançar ValidationError se o formato do Email for inválido (vazio)", () => {
    expect(() => Email.create("")).toThrow(ValidationError);
  });
});
