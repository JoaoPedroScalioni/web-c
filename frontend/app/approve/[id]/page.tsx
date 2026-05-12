"use client";

import { usePostDetail, useUpdatePostStatus } from "../../../src/adapters/post-service";
import PinCanvas from "../../../src/components/PinCanvas";
import { Check, X, Link, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export default function ApprovePage({ params }: { params: { id: string } }) {
  const { data: post, isLoading, isError } = usePostDetail(params.id);
  const { mutate: updateStatus, isPending } = useUpdatePostStatus();
  
  // Cliente (Guest) Session Gerenciamento
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    let storedId = localStorage.getItem("elevva_guest_id");
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem("elevva_guest_id", storedId);
    }
    setClientId(storedId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-zinc-500 h-12 w-12" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 p-8">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md text-center shadow-2xl">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Mídia não encontrada</h2>
          <p className="text-zinc-400">O link pode ter expirado ou estar incorreto. Solicite um novo Magic Link ao seu gestor da Elevva.</p>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    if (!clientId) return;
    updateStatus({
      postId: post.id,
      request: { status: "APROVADO", client_id: clientId }
    });
  };

  const handleReject = () => {
    if (!clientId) return;
    updateStatus({
      postId: post.id,
      request: { status: "REJEITADO", client_id: clientId }
    });
  };

  const isApproved = post.status === "APROVADO";
  const isRejected = post.status === "REJEITADO";

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      {/* Esquerda: Canvas / Mídia */}
      <div className="flex-1 flex flex-col relative border-r border-zinc-800">
        <header className="p-6 absolute top-0 left-0 w-full z-10 flex justify-between items-center pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="font-black text-xl">E</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight drop-shadow-md">Elevva Studio</h1>
              <p className="text-xs text-zinc-300 drop-shadow-md">Revisão Criativa</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 pt-24 md:p-12 relative h-full">
          {/* Reutilizando o PinCanvas em Modo Escuro/Premium */}
          <div className="w-full max-w-4xl h-full flex items-center justify-center relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/50">
            <PinCanvas 
              postId={post.id} 
              mediaUrl={post.media_url} 
              existingComments={post.comments} 
            />
          </div>
        </div>
      </div>

      {/* Direita: Painel de Controle e Feedback */}
      <div className="w-full md:w-[400px] bg-zinc-900 flex flex-col h-full md:h-screen sticky top-0 overflow-y-auto custom-scrollbar">
        <div className="p-8 flex-1 flex flex-col">
          
          <div className="mb-8">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border ${
              isApproved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
              isRejected ? "bg-red-500/10 text-red-400 border-red-500/20" : 
              "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                isApproved ? "bg-emerald-500" : isRejected ? "bg-red-500" : "bg-amber-500"
              }`}></span>
              {post.status.replace("_", " ")}
            </span>
            
            <h2 className="text-3xl font-bold tracking-tight mb-3">Revisão de Peça</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Analise o material ao lado. Para solicitar alterações precisas, <strong className="text-indigo-400">clique diretamente na imagem ou vídeo</strong> para fixar um Pin de feedback.
            </p>
          </div>

          {/* Lista de Pins */}
          <div className="flex-1 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-100">Feedbacks Apontados</h3>
              <span className="bg-zinc-800 text-zinc-300 text-xs py-1 px-2.5 rounded-full font-bold">
                {post.comments.length}
              </span>
            </div>
            
            {post.comments.length > 0 ? (
              <ul className="space-y-3">
                {post.comments.map(c => (
                  <li key={c.id} className="text-sm bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 text-zinc-300 shadow-inner">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-indigo-400 text-xs">Pin #{c.id.split('-')[0]}</span>
                    </div>
                    <p className="leading-relaxed">{c.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 border border-dashed border-zinc-800 rounded-xl text-center">
                <p className="text-sm text-zinc-500">Nenhum ajuste solicitado ainda.</p>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="space-y-4 mt-auto pt-8 border-t border-zinc-800">
            {isPending ? (
              <div className="w-full py-4 rounded-xl flex justify-center items-center bg-zinc-800 text-zinc-400 border border-zinc-700">
                <Loader2 className="animate-spin h-5 w-5" />
              </div>
            ) : (
              <>
                {!isApproved && (
                  <button 
                    onClick={handleApprove}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(5,150,105,0.3)] hover:shadow-[0_0_25px_rgba(5,150,105,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Check size={20} strokeWidth={3} />
                    Aprovar Arte / Vídeo
                  </button>
                )}

                {!isRejected && (
                  <button 
                    onClick={handleReject}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-transparent hover:bg-red-500/10 text-red-400 border-2 border-red-500/20 hover:border-red-500/50 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <X size={20} strokeWidth={3} />
                    Solicitar Ajustes
                  </button>
                )}
                
                {isApproved && (
                  <div className="w-full py-4 text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold">
                    Material Aprovado! 🎉
                  </div>
                )}
              </>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
