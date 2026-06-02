import { IPostRepository } from "../../domain/repositories/IPostRepository";
import { Post } from "../../domain/entities/Post";
import { TicketStatus } from "../../domain/value_objects/TicketStatus";
import { HttpClient } from "../http/HttpClient";

export class ApiPostRepository implements IPostRepository {
  constructor(private readonly httpClient: HttpClient) { }

  public async getById(id: string): Promise<Post | null> {
    const { data } = await this.httpClient.get<any>(`/posts/${id}`);
    return Post.create({
      id: data.id,
      calendar_id: data.calendar_id,
      media_url: data.media_url,
      status: TicketStatus.create(data.status),
      created_at: new Date(data.created_at)
    });
  }

  public async getAllPending(): Promise<Post[]> {
    const { data } = await this.httpClient.get<any[]>("/posts");
    return data.map(p => Post.create({
      id: p.id,
      calendar_id: p.calendar_id,
      media_url: p.media_url,
      status: TicketStatus.create(p.status),
      created_at: new Date(p.created_at)
    }));
  }

  public async updateStatus(id: string, status: TicketStatus): Promise<Post> {
    const { data } = await this.httpClient.patch<any>(`/posts/${id}/status`, {
      status: status.getValue()
    });
    return Post.create({
      id: data.id,
      calendar_id: data.calendar_id,
      media_url: data.media_url,
      status: TicketStatus.create(data.status),
      created_at: new Date(data.created_at)
    });
  }
}
