"use client";

import { usePendingPosts, useUpdatePostStatus } from "../../src/adapters/post-service";
import MediaViewer from "../../src/components/MediaViewer";
import CommentSection from "../../src/components/CommentSection";
import { Loader2, FolderOpen, CheckCircle2, AlertTriangle, PlayCircle, LogOut, LayoutDashboard, ChevronRight, MessageSquare, AlertCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { data: posts, isLoading, isError } = usePendingPosts();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdatePostStatus();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"revisao" | "postados">("revisao");
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-zinc-500 h-10 w-10" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 p-8">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md text-center shadow-2xl text-white">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Erro de Conexão</h2>
          <p className="text-zinc-400">Não foi possível carregar os posts do painel de administração. Verifique se o backend está online.</p>
        </div>
      </div>
    );
  }

  // Separação de abas
  const revisaoPosts = posts?.filter(p => p.status !== "POSTADO") || [];
  const postadosPosts = posts?.filter(p => p.status === "POSTADO") || [];
  const displayedPosts = activeTab === "revisao" ? revisaoPosts : postadosPosts;
  
  const selectedPost = posts?.find(p => p.id === selectedPostId);

  // Estatísticas rápidas baseadas no fluxo de revisão
  const totalApproved = revisaoPosts.filter(p => p.status === "APROVADO").length;
  const totalRejected = revisaoPosts.filter(p => 
    p.status === "REJEITADO" || (p.status === "AGUARDANDO_APROVACAO" && p.comments.length > 0)
  ).length;

  const handleUpdateToPosted = (postId: string) => {
    updateStatus({ postId, request: { status: "POSTADO" } }, {
      onSuccess: () => {
        if (activeTab === "revisao" && selectedPostId === postId) {
          setSelectedPostId(null);
        }
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/teladelogin");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header Premium */}
      <header className="px-6 md:px-12 py-6 bg-zinc-900/50 border-b border-zinc-800 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <span className="font-black text-xl">E</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                <span>ELEVVA</span>
                <span className="font-light text-zinc-400">STUDIO</span>
                <span className="text-xs bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold ml-2">ADMIN</span>
              </h1>
              <p className="text-zinc-400 text-xs font-medium">Cockpit do Editor & Ajustes Criativos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/kanban" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold">
              <LayoutDashboard size={16} />
              Ver Kanban Geral
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-700 shadow-md"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8 min-h-0">
        
        {/* Left Sidebar: List of Approved/Rejected posts */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6 shrink-0">
          
          {/* Quick stats dashboard */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-md">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Aprovados</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-400">{totalApproved}</span>
                <span className="text-xs text-zinc-500">mídias</span>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-md">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ajustes</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-red-400">{totalRejected}</span>
                <span className="text-xs text-zinc-500">mídias</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl shadow-md">
            <button
              onClick={() => { setActiveTab("revisao"); setSelectedPostId(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "revisao" 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              Em Revisão
            </button>
            <button
              onClick={() => { setActiveTab("postados"); setSelectedPostId(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "postados" 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              Já Postados
            </button>
          </div>

          {/* List Title */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex-1 flex flex-col min-h-[400px] shadow-lg">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 px-2">
              {activeTab === "revisao" ? "Histórico de Decisões" : "Galeria de Postados"}
            </h3>
            
            {displayedPosts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <FolderOpen size={40} className="opacity-20 mb-3" />
                <p className="text-sm font-medium">Nenhuma mídia encontrada nesta aba.</p>
                <p className="text-xs opacity-60 mt-1">Navegue pelas abas acima para alterar a visualização.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                {displayedPosts.map((post) => {
                  const isSelected = post.id === selectedPostId;
                  const isApproved = post.status === "APROVADO";
                  const isVideo = post.media_url.endsWith(".mp4") || post.media_url.endsWith(".webm");
                  
                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPostId(post.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 relative ${
                        isSelected 
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                          : "bg-zinc-950/40 border-zinc-800/60 hover:bg-zinc-800/40 hover:border-zinc-700 text-zinc-300"
                      }`}
                    >
                      {/* Mini Thumbnail */}
                      <div className="w-14 h-10 rounded bg-zinc-900 shrink-0 overflow-hidden relative border border-zinc-800">
                        {isVideo ? (
                          <video src={post.media_url} className="w-full h-full object-cover opacity-60" />
                        ) : (
                          <img src={post.media_url} alt="" className="w-full h-full object-cover opacity-60" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="text-white/40 w-4 h-4" />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">ID: {post.id.split('-')[0]}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                            isApproved ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {post.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs truncate">Mídia Criativa</h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500">
                          <MessageSquare size={10} />
                          <span>{post.comments.length} feedbacks</span>
                        </div>
                      </div>

                      <ChevronRight size={14} className="text-zinc-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-[500px]">
          {selectedPost ? (
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
              
              {/* Media Player */}
              <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col justify-center items-center bg-zinc-950/40 relative min-h-[300px]">
                <div className="absolute top-4 left-4 z-10">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${
                    selectedPost.status === "POSTADO" 
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : selectedPost.status === "APROVADO" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : selectedPost.status === "REJEITADO"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      selectedPost.status === "POSTADO" ? "bg-blue-500" :
                      selectedPost.status === "APROVADO" ? "bg-emerald-500" : 
                      selectedPost.status === "REJEITADO" ? "bg-red-500" :
                      "bg-amber-500"
                    }`}></span>
                    {selectedPost.status}
                  </span>
                </div>
                
                <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-black/40 flex items-center justify-center">
                  <MediaViewer mediaUrl={selectedPost.media_url} />
                </div>
              </div>

              {/* Feedbacks Panel */}
              <div className="w-full lg:w-[400px] p-6 flex flex-col shrink-0">
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-zinc-800 mb-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-zinc-100 mb-1">Anotações & Feedbacks</h3>
                    <p className="text-zinc-500 text-xs pr-2">Instruções deixadas pelo cliente para a edição.</p>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    {selectedPost.status !== "POSTADO" && (
                      <button 
                        onClick={() => handleUpdateToPosted(selectedPost.id)}
                        disabled={isUpdatingStatus}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] disabled:opacity-50"
                      >
                        {isUpdatingStatus ? <Loader2 size={14} className="animate-spin" /> : "🚀 Marcar como Postado"}
                      </button>
                    )}
                    {selectedPost.status === "POSTADO" && (
                      <div className="bg-zinc-800/50 border border-zinc-700 text-indigo-400 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm">
                        <CheckCircle2 size={14} /> Mídia Postada
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                  <CommentSection postId={selectedPost.id} existingComments={selectedPost.comments} theme="dark" readOnly={true} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-zinc-500">
              <FolderOpen size={64} className="opacity-10 mb-4" />
              <h3 className="text-lg font-bold text-zinc-300">Selecione uma Mídia</h3>
              <p className="text-sm max-w-sm mt-1">Escolha uma publicação da lista à esquerda para analisar as marcações e os feedbacks deixados pelo cliente.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
