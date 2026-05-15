import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Limpa o DOM simulado após cada teste para garantir isolamento
afterEach(() => {
  cleanup();
});
