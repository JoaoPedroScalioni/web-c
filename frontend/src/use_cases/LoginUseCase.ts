import { Email } from "../domain/value_objects/Email";

export interface IAuthRepository {
  authenticate(email: Email, password: string): Promise<{ token: string }>;
}

export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  public async execute(emailStr: string, passwordStr: string): Promise<{ token: string }> {
    // 1. Cria o VO para validar a regra estrutural do e-mail imediatamente
    const email = Email.create(emailStr);
    
    // 2. Aciona o adaptador de infraestrutura
    return await this.authRepository.authenticate(email, passwordStr);
  }
}
