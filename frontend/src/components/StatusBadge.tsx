export function StatusBadge({ status }: { status: "APROVADO" | "REJEITADO" | "PENDENTE" }) {
  const colors = {
    APROVADO: "bg-green-100 text-green-800",
    REJEITADO: "bg-red-100 text-red-800",
    PENDENTE: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${colors[status]}`} data-testid="status-badge">
      {status}
    </span>
  );
}
