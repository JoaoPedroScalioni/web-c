import { components } from "../types/api";

const API_URL = "http://localhost:8000";

export type HTTPValidationErrorDetail = components["schemas"]["HTTPValidationError"]["detail"];

/**
 * Classe de erro customizada que embute os detalhes de validação (ex: 422 Unprocessable Entity)
 * permitindo que a UI mostre mensagens exatas do Pydantic.
 */
export class ApiError extends Error {
  public status: number;
  public details?: HTTPValidationErrorDetail;

  constructor(status: number, message: string, details?: HTTPValidationErrorDetail) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Base Fetcher para a API do Elevva.
 * Lança um ApiError em caso de falha, para que o TanStack Query possa capturar.
 */
export async function fetchClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorDetails: HTTPValidationErrorDetail | undefined = undefined;
    try {
      const errorBody = await response.json();
      // O FastAPI retorna os detalhes de erro no campo "detail"
      if (response.status === 422 && errorBody.detail) {
        errorDetails = errorBody.detail;
      } else if (errorBody.detail && typeof errorBody.detail === "string") {
        // Erro 400 ou 404 comum onde o detail é uma string
        throw new ApiError(response.status, errorBody.detail);
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
      // Caso a resposta não seja JSON válido
    }
    
    throw new ApiError(response.status, `Erro na requisição: ${response.statusText}`, errorDetails);
  }

  // Endpoints que retornam 204 No Content não devem dar throw ao fazer json()
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
