"use client";

import { AlertCircle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 p-8">
      <div className="bg-white border border-red-200 p-8 rounded-2xl max-w-md text-center shadow-sm">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Algo deu errado</h2>
        <p className="text-zinc-500 mb-6">Ocorreu um erro inesperado. Tente novamente.</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
