import { Email } from "../value_objects/Email";

export interface IUserProps {
  id: string;
  name: string;
  email: Email;
  role: "AGENCY" | "CLIENT";
}

export class User {
  public readonly id: string;
  public readonly name: string;
  public readonly email: Email;
  public readonly role: string;

  private constructor(props: IUserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.role = props.role;
  }

  public static create(props: IUserProps): User {
    // Validações de criação do Usuário
    return new User(props);
  }
}
