/**
 * Adaptador de Infraestrutura: Browser Storage
 * Isola a dependência direta da API do navegador (localStorage) da camada de Apresentação (UI).
 * Isso permite tipagem estrita, fallback seguro e facilita a criação de Mocks nos testes (Clean Architecture).
 */

export interface ClientSettings {
  companyName: string;
  brandColor: string;
  notificationEmail: string;
  dailySummary: boolean;
  newUploadAlert: boolean;
}

const SETTINGS_KEY = "client_settings";

export const getClientSettings = (): ClientSettings | null => {
  if (typeof window === "undefined") return null;
  try {
    const rawData = localStorage.getItem(SETTINGS_KEY);
    return rawData ? JSON.parse(rawData) : null;
  } catch (error) {
    console.error("Falha ao recuperar configurações do browser", error);
    return null;
  }
};

export const saveClientSettings = (settings: ClientSettings): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Falha ao salvar configurações no browser", error);
  }
};
