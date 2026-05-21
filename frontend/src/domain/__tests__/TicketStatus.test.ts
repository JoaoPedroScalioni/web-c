import { describe, it, expect } from "vitest";
import { TicketStatus } from "../value_objects/TicketStatus";
import { ValidationError } from "../errors/DomainError";

describe("Domain: TicketStatus Value Object", () => {
  it("Deve criar o status com sucesso quando usar uma opção permitida", () => {
    const status = TicketStatus.create("APROVADO");
    expect(status.getValue()).toBe("APROVADO");
  });

  it("Deve lançar ValidationError quando o status não estiver no radar do Kanban", () => {
    expect(() => TicketStatus.create("STATUS_INEXISTENTE")).toThrow(ValidationError);
  });
});
