import { TicketStatus } from "../value_objects/TicketStatus";

export interface IPostProps {
  id: string;
  calendar_id: string;
  media_url: string;
  status: TicketStatus;
  created_at?: Date;
}

export class Post {
  public readonly id: string;
  public readonly calendarId: string;
  public readonly mediaUrl: string;
  private _status: TicketStatus;
  public readonly createdAt: Date;

  private constructor(props: IPostProps) {
    this.id = props.id;
    this.calendarId = props.calendar_id;
    this.mediaUrl = props.media_url;
    this._status = props.status;
    this.createdAt = props.created_at || new Date();
  }

  public static create(props: IPostProps): Post {
    return new Post(props);
  }

  public get status(): TicketStatus {
    return this._status;
  }

  public changeStatus(newStatus: TicketStatus): void {
    // Regras de negócio de transição iriam aqui
    this._status = newStatus;
  }
}
