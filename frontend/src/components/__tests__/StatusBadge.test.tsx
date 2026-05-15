import { render, screen } from "../../utils/test-utils";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge Component", () => {
  it("renderiza corretamente com status APROVADO", () => {
    render(<StatusBadge status="APROVADO" />);
    
    const badge = screen.getByTestId("status-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("APROVADO");
    expect(badge).toHaveClass("bg-green-100");
  });

  it("renderiza corretamente com status REJEITADO", () => {
    render(<StatusBadge status="REJEITADO" />);
    
    const badge = screen.getByTestId("status-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("REJEITADO");
    expect(badge).toHaveClass("bg-red-100");
  });
});
