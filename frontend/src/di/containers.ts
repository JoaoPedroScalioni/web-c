import { HttpClient } from "../infrastructure/http/HttpClient";
import { ApiPostRepository } from "../infrastructure/repositories/ApiPostRepository";
import { ApprovePostUseCase } from "../use_cases/ApprovePostUseCase";

// Configuração base da API
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 1. Instanciamos os clientes genéricos
export const httpClient = new HttpClient(BASE_URL);

// 2. Instanciamos os repositórios injetando as ferramentas de infraestrutura
export const postRepository = new ApiPostRepository(httpClient);

// 3. Instanciamos os casos de uso injetando os repositórios concretos
// A UI consumirá apenas estas instâncias, sem nunca tocar no "fetch"
export const approvePostUseCase = new ApprovePostUseCase(postRepository);
