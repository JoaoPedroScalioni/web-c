/**
 * Encapsulamento Stateless da API Fetch (Clean Architecture)
 * Centraliza tratamento de erros de rede e CORS.
 */

export interface HttpResponse<T> {
  data: T;
  status: number;
}

export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  public async get<T>(path: string): Promise<HttpResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data = await response.json();
    return { data, status: response.status };
  }

  public async patch<T>(path: string, body: any): Promise<HttpResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data = await response.json();
    return { data, status: response.status };
  }
}
