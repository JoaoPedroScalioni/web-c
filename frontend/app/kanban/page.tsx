"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePendingPosts } from "../../src/adapters/post-service";
import MediaViewer from "../../src/components/MediaViewer";
import CommentSection from "../../src/components/CommentSection";
import UploadManager from "../../src/components/UploadManager";
import { Check, X, MessageSquareWarning, Link as LinkIcon, CheckCircle2, FolderOpen, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function KanbanPage() {
  const { data: pendingPosts, isLoading, isError } = usePendingPosts();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdatePostStatus();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actingPostId, setActingPostId] = useState<string | null>(null);

  const handleUpdateStatus = (postId: string, status: "APROVADO" | "REJEITADO") => {
    setActingPostId(postId);
    updateStatus(
      { postId, request: { status } },
      { onSettled: () => setActingPostId(null) }
    );
  };

  const copyMagicLink = (id: string) => {
    const url = `${window.location.origin}/approve/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 border-b border-zinc-200 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Fluxo de Aprovação</h1>
          <p className="text-zinc-500 mt-2">Analise as mídias, adicione pins de correção e decida o status da campanha.</p>
        </div>
        
        <div className="w-full xl:w-auto flex items-center gap-4">
          <Link href="/dashboard" className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-semibold transition-all border border-zinc-200">
            <FolderOpen size={18} />
            Ver Galeria do Cliente
          </Link>
          <UploadManager 
            calendarId="123e4567-e89b-12d3-a456-426614174000" // Mockado para Demo
            onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ["pendingPosts"] })}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {pendingPosts?.map((post) => (
          <div key={post.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col lg:flex-row transition-all hover:shadow-md">
            
            {/* Seção da Mídia com o Canvas Interativo */}
            <div className="flex-1 p-6 bg-zinc-100/50 border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col items-center justify-center relative min-h-[400px]">
              <MediaViewer mediaUrl={post.media_url} />
            </div>

            {/* Seção de Controles e Decisão */}
            <div className="w-full lg:w-[400px] p-8 flex flex-col">
              <div className="flex-1">
                <div className="mb-6 flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                    {post.status.replace("_", " ").toUpperCase()}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">ID: {post.id.split('-')[0]}</span>
                </div>
                
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Revisão Criativa</h3>
                <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                  Utilize o campo de comentários abaixo para descrever com precisão os ajustes necessários para a equipe de edição.
                </p>
                
                <CommentSection postId={post.id} existingComments={post.comments} />
              </div>

              <div className="space-y-3 pt-6 border-t border-zinc-100 mt-auto">
                <button 
                  onClick={() => copyMagicLink(post.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold transition-all border border-indigo-200"
                >
                  {copiedId === post.id ? (
                    <>
                      <CheckCircle2 size={18} />
                      Link Copiado!
                    </>
                  ) : (
                    <>
                      <LinkIcon size={18} />
                      Copiar Magic Link
                    </>
                  )}
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUpdateStatus(post.id, "APROVADO")}
                    disabled={isUpdatingStatus}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isUpdatingStatus && actingPostId === post.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Aprovar Internamente
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(post.id, "REJEITADO")}
                    disabled={isUpdatingStatus}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-lg font-medium transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isUpdatingStatus && actingPostId === post.id ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                    Rejeitar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {pendingPosts?.length === 0 && (
          <div className="text-center py-32 bg-white rounded-xl border border-dashed border-zinc-300">
            <Check className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900">Tudo limpo por aqui</h3>
            <p className="mt-1 text-sm text-zinc-500">Nenhum post aguardando aprovação no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
