import { IPostRepository } from "../domain/repositories/IPostRepository";
import { TicketStatus } from "../domain/value_objects/TicketStatus";
import { Post } from "../domain/entities/Post";

export class ApprovePostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  public async execute(postId: string): Promise<Post> {
    // Regra de negócio: Apenas instanciar o VO estrito para forçar validação
    const approvedStatus = TicketStatus.create('APROVADO');
    
    // Delega para o repositório
    return await this.postRepository.updateStatus(postId, approvedStatus);
  }
}
