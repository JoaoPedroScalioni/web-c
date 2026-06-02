import { describe, it, expect, vi } from "vitest";
import { ApprovePostUseCase } from "../ApprovePostUseCase";
import { IPostRepository } from "../../domain/repositories/IPostRepository";
import { Post } from "../../domain/entities/Post";
import { TicketStatus } from "../../domain/value_objects/TicketStatus";

// Mock da Camada de Infraestrutura (Repositório)
class MockPostRepository implements IPostRepository {
  public updateStatus = vi.fn();
  public getById = vi.fn();
  public getAllPending = vi.fn();
}

describe("Unit: ApprovePostUseCase", () => {
  it("Deve integrar o Domínio e a Infraestrutura para aprovar um Post", async () => {
    const mockRepo = new MockPostRepository();
    
    // Simula o retorno do banco de dados (Infraestrutura)
    const expectedPost = Post.create({
      id: "123",
      calendar_id: "456",
      media_url: "video.mp4",
      status: TicketStatus.create("APROVADO")
    });
    
    mockRepo.updateStatus.mockResolvedValue(expectedPost);

    // Injeta a dependência no Caso de Uso
    const useCase = new ApprovePostUseCase(mockRepo);
    
    // Executa a ação do usuário
    const result = await useCase.execute("123");

    // Valida se as camadas se comunicaram corretamente
    expect(mockRepo.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateStatus).toHaveBeenCalledWith("123", expect.any(TicketStatus));
    expect(result.status.getValue()).toBe("APROVADO");
  });
});
