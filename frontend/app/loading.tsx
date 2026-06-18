import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-zinc-400 h-10 w-10 mx-auto" />
        <p className="mt-4 text-sm text-zinc-500 font-medium">Carregando Elevva...</p>
      </div>
    </div>
  );
}
