"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePendingPosts, useUpdatePostStatus, useDeletePost } from "../../src/adapters/post-service";
import MediaViewer from "../../src/components/MediaViewer";
import CommentSection from "../../src/components/CommentSection";
import UploadManager from "../../src/components/UploadManager";
import { Check, X, MessageSquareWarning, Link as LinkIcon, CheckCircle2, FolderOpen, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const BRAND_NAVY = "#0C0A3E";

export default function KanbanPage() {
  const { data: pendingPosts, isLoading, isError } = usePendingPosts();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdatePostStatus();
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actingPostId, setActingPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"kanban" | "postados">("kanban");

  const revisaoPosts = pendingPosts?.filter(p => p.status !== "POSTADO") || [];
  const postadosPosts = pendingPosts?.filter(p => p.status === "POSTADO") || [];
  const displayedPosts = activeTab === "kanban" ? revisaoPosts : postadosPosts;

  const handleUpdateStatus = (postId: string, status: "APROVADO" | "REJEITADO") => {
    setActingPostId(postId);
    updateStatus(
      { postId, request: { status } },
      { onSettled: () => setActingPostId(null) }
    );
  };

  const handleDelete = (postId: string) => {
    if (confirm("Tem certeza que deseja excluir esta mídia permanentemente?")) {
      setActingPostId(postId);
      deletePost(postId, { onSettled: () => setActingPostId(null) });
    }
  };

  const copyMagicLink = (id: string) => {
    // Magic link removido conforme solicitado
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-zinc-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-zinc-200 rounded animate-pulse"></div>
          </div>
          <div className="h-64 w-full md:w-[500px] bg-zinc-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="space-y-12">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row min-h-[400px]">
              <div className="flex-1 bg-zinc-100 animate-pulse rounded-l-xl"></div>
              <div className="w-full md:w-96 p-8 space-y-4">
                <div className="h-6 w-24 bg-zinc-200 rounded animate-pulse"></div>
                <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse"></div>
                <div className="h-20 w-full bg-zinc-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center max-w-md">
          <MessageSquareWarning size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-bold mb-2">Erro de Conexão</h2>
          <p className="text-sm">Não foi possível carregar o fluxo de aprovação. Verifique se a API está online.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <header className="px-6 md:px-12 py-8 mb-10 bg-white border-b border-zinc-200 shadow-sm relative">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="text-[#0C0A3E]">ELEVVA</span>
              <span className="font-light text-zinc-400 text-2xl">MARKETING</span>
            </h1>
            <p className="text-zinc-500 mt-2 font-medium">Dashboard Gestão de Aprovações B2B</p>
          </div>
          
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link href="/dashboard" className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-[#0C0A3E] rounded-xl font-bold transition-all border border-zinc-200 shadow-sm">
              <FolderOpen size={18} />
              Meu Dashboard
            </Link>
            <div className="w-full sm:w-auto">
              <UploadManager 
                calendarId="123e4567-e89b-12d3-a456-426614174000" // Mockado para Demo
                onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ["pendingPosts"] })}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 md:px-12 pb-6 max-w-7xl mx-auto flex gap-4">
        <button
          onClick={() => setActiveTab("kanban")}
          className={`px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
            activeTab === "kanban"
              ? "bg-[#0C0A3E] text-white"
              : "bg-white text-zinc-500 hover:bg-zinc-50 border border-zinc-200"
          }`}
        >
          Para Aprovação
        </button>
        <button
          onClick={() => setActiveTab("postados")}
          className={`px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${
            activeTab === "postados"
              ? "bg-indigo-600 text-white"
              : "bg-white text-zinc-500 hover:bg-zinc-50 border border-zinc-200"
          }`}
        >
          <CheckCircle2 size={18} />
          Já Postados
        </button>
      </div>

      <div className="px-6 md:px-12 pb-12 max-w-7xl mx-auto grid grid-cols-1 gap-12">
        {displayedPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col lg:flex-row transition-all hover:shadow-md">
            
            {/* Seção da Mídia com o Canvas Interativo */}
            <div className="flex-1 p-6 bg-zinc-100/50 border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col items-center justify-center relative min-h-[400px]">
              <MediaViewer mediaUrl={post.media_url} />
            </div>

            {/* Seção de Controles e Decisão */}
            <div className="w-full lg:w-[450px] p-8 flex flex-col bg-white">
              <div className="mb-8 flex items-center justify-between pb-4 border-b border-zinc-100">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    post.status === "POSTADO" ? "bg-blue-100 text-blue-800 border-blue-200" :
                    post.status === "APROVADO" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                    post.status === "REJEITADO" ? "bg-red-100 text-red-800 border-red-200" :
                    post.status === "CRIADO" ? "bg-indigo-100 text-indigo-800 border-indigo-200" :
                    "bg-amber-100 text-amber-800 border-amber-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      post.status === "POSTADO" ? "bg-blue-500" :
                      post.status === "APROVADO" ? "bg-emerald-500" :
                      post.status === "REJEITADO" ? "bg-red-500" :
                      post.status === "CRIADO" ? "bg-indigo-500" :
                      "bg-amber-500"
                    }`}></span>
                    {post.status.replace("_", " ").toUpperCase()}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 font-medium">ID: {post.id.split('-')[0]}</span>
                    <button 
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting && actingPostId === post.id}
                      className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50 disabled:opacity-50"
                      title="Excluir Arte Permanentemente"
                    >
                      {isDeleting && actingPostId === post.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-[#0C0A3E] mb-2">Revisão Criativa</h3>
                <p className="text-sm text-zinc-500 mb-8 leading-relaxed font-medium">
                  Deixe seu feedback detalhado para o editor de vídeo. Estes comentários definirão a próxima etapa de produção.
                </p>
                
              <div className="flex-1 flex flex-col min-h-0 mb-8 pb-8 border-b border-zinc-100">
                <CommentSection postId={post.id} existingComments={post.comments} />
              </div>

              <div className="mt-auto">
                {post.status === "AGUARDANDO_APROVACAO" ? (
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => handleUpdateStatus(post.id, "APROVADO")}
                      disabled={isUpdatingStatus}
                      className="relative w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#0C0A3E] to-[#1a1766] hover:from-[#131057] hover:to-[#221f80] text-white rounded-xl font-extrabold tracking-wide transition-all shadow-[0_8px_20px_-6px_rgba(12,10,62,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(12,10,62,0.6)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                    >
                      {/* Brilho animado passando pelo botão */}
                      <div className="absolute inset-0 -translate-x-full hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
                      
                      {isUpdatingStatus && actingPostId === post.id ? <Loader2 size={22} className="animate-spin text-white" /> : <Check size={22} strokeWidth={3} className="text-emerald-400" />}
                      <span>Aprovar Publicação</span>
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(post.id, "REJEITADO")}
                      disabled={isUpdatingStatus}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-transparent hover:bg-red-50/50 text-[#0C0A3E] border-2 border-zinc-200 hover:border-red-200 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isUpdatingStatus && actingPostId === post.id ? <Loader2 size={20} className="animate-spin text-red-400" /> : <X size={20} className="text-red-500" />}
                      <span>Reprovar Publicação</span>
                    </button>
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-all ${
                    post.status === "POSTADO" 
                      ? "bg-blue-50 border-blue-200"
                      : post.status === "APROVADO" 
                        ? "bg-emerald-50 border-emerald-200" 
                        : "bg-red-50 border-red-200"
                  }`}>
                    {post.status === "POSTADO" 
                      ? <CheckCircle2 size={32} className="text-blue-500 mb-2" />
                      : post.status === "APROVADO" 
                        ? <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                        : <X size={32} className="text-red-500 mb-2" />
                    }
                    <p className={`text-sm font-bold ${
                      post.status === "POSTADO" ? "text-blue-800" : 
                      post.status === "APROVADO" ? "text-emerald-800" : "text-red-800"
                    }`}>
                      {post.status === "POSTADO" ? "Publicado nas Redes! 🚀" : 
                       post.status === "APROVADO" ? "Mídia Aprovada!" : "Mídia Rejeitada"}
                    </p>
                    <p className={`text-xs mt-1 ${
                      post.status === "POSTADO" ? "text-blue-600" : 
                      post.status === "APROVADO" ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {post.status === "POSTADO" ? "O material já está no ar." : "A agência já foi notificada."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {displayedPosts.length === 0 && (
          <div className="text-center py-32 bg-white rounded-xl border border-dashed border-zinc-300">
            <Check className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900">Tudo limpo por aqui</h3>
            <p className="mt-1 text-sm text-zinc-500">Nenhum post nesta seção no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
