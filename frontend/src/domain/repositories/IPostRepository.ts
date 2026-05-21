import { Post } from "../entities/Post";
import { TicketStatus } from "../value_objects/TicketStatus";

export interface IPostRepository {
  getById(id: string): Promise<Post | null>;
  getAllPending(): Promise<Post[]>;
  updateStatus(id: string, status: TicketStatus): Promise<Post>;
}
