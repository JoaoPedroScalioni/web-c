"use client";

import { usePendingPosts, useUpdatePostStatus, fetchPendingAdmins, approveAdmin, rejectAdmin, useClients } from "../../src/adapters/post-service";
import MediaViewer from "../../src/components/MediaViewer";
import CommentSection from "../../src/components/CommentSection";
import { Loader2, FolderOpen, CheckCircle2, AlertTriangle, PlayCircle, LogOut, LayoutDashboard, ChevronRight, MessageSquare, AlertCircle, Shield, UserCheck, UserX, Users } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TabType = "revisao" | "postados" | "admins";

interface PendingAdmin {
  id: string;
  name: string;
  email: string;
  created_at: string | null;
}

export default function AdminPage() {
  const [selectedClientId, setSelectedClientId] = useState<string>("ALL");
  const { data: posts, isLoading, isError } = usePendingPosts(selectedClientId === "ALL" ? undefined : selectedClientId);
  const { data: clients } = useClients();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdatePostStatus();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("revisao");
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState("");
  const [actingAdminId, setActingAdminId] = useState<string | null>(null);
  const router = useRouter();

  const loadPendingAdmins = useCallback(async () => {
    setAdminsLoading(true);
    setAdminsError("");
    try {
      const data = await fetchPendingAdmins();
      setPendingAdmins(data);
    } catch (err: any) {
      setAdminsError(err.message || "Erro ao carregar administradores pendentes.");
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "admins") {
      loadPendingAdmins();
    }
  }, [activeTab, loadPendingAdmins]);

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
          <p className="text-zinc-400">Nao foi possivel carregar os posts do painel de administracao. Verifique se o backend esta online.</p>
        </div>
      </div>
    );
  }

  const revisaoPosts = posts?.filter(p => p.status !== "POSTADO") || [];
  const postadosPosts = posts?.filter(p => p.status === "POSTADO") || [];
  const displayedPosts = activeTab === "revisao" ? revisaoPosts : postadosPosts;

  const selectedPost = posts?.find(p => p.id === selectedPostId);

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

  const handleApproveAdmin = async (userId: string) => {
    setActingAdminId(userId);
    try {
      await approveAdmin(userId);
      setPendingAdmins(prev => prev.filter(a => a.id !== userId));
    } catch (err: any) {
      setAdminsError(err.message || "Erro ao aprovar administrador.");
    } finally {
      setActingAdminId(null);
    }
  };

  const handleRejectAdmin = async (userId: string) => {
    setActingAdminId(userId);
    try {
      await rejectAdmin(userId);
      setPendingAdmins(prev => prev.filter(a => a.id !== userId));
    } catch (err: any) {
      setAdminsError(err.message || "Erro ao rejeitar administrador.");
    } finally {
      setActingAdminId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/teladelogin";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
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

        {/* Left Sidebar */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6 shrink-0">

          {/* Quick stats dashboard */}
          {activeTab !== "admins" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-md">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Aprovados</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-emerald-400">{totalApproved}</span>
                  <span className="text-xs text-zinc-500">midias</span>
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-md">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ajustes</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-red-400">{totalRejected}</span>
                  <span className="text-xs text-zinc-500">midias</span>
                </div>
              </div>
            </div>
          )}

          {/* Client Filter */}
          {activeTab !== "admins" && clients && clients.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-md">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Filtrar por Cliente</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              >
                <option value="ALL">Todos os Clientes</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          )}

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
              Em Revisao
            </button>
            <button
              onClick={() => { setActiveTab("postados"); setSelectedPostId(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "postados"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              Ja Postados
            </button>
            <button
              onClick={() => { setActiveTab("admins"); setSelectedPostId(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === "admins"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <Shield size={12} />
              Admins
            </button>
          </div>

          {/* List Content */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex-1 flex flex-col min-h-[400px] shadow-lg">
            {activeTab === "admins" ? (
              <>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                  <Users size={14} />
                  Administradores Pendentes
                </h3>

                {adminsError && (
                  <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded-xl text-xs font-medium border border-red-800/50 text-center">
                    {adminsError}
                  </div>
                )}

                {adminsLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-zinc-500 h-8 w-8" />
                  </div>
                ) : pendingAdmins.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                    <Shield size={40} className="opacity-20 mb-3" />
                    <p className="text-sm font-medium">Nenhum administrador pendente.</p>
                    <p className="text-xs opacity-60 mt-1">Todos os administradores ja foram aprovados.</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                    {pendingAdmins.map((admin) => (
                      <div
                        key={admin.id}
                        className="w-full text-left p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-amber-600/20 border border-amber-600/30 flex items-center justify-center shrink-0">
                            <Shield size={16} className="text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-zinc-100 truncate">{admin.name}</h4>
                            <p className="text-xs text-zinc-500 truncate">{admin.email}</p>
                            {admin.created_at && (
                              <p className="text-[10px] text-zinc-600 mt-0.5">
                                Solicitado em: {new Date(admin.created_at).toLocaleString("pt-BR")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveAdmin(admin.id)}
                            disabled={actingAdminId === admin.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50"
                          >
                            {actingAdminId === admin.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleRejectAdmin(admin.id)}
                            disabled={actingAdminId === admin.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50"
                          >
                            {actingAdminId === admin.id ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 px-2">
                  {activeTab === "revisao" ? "Historico de Decisoes" : "Galeria de Postados"}
                </h3>

                {displayedPosts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                    <FolderOpen size={40} className="opacity-20 mb-3" />
                    <p className="text-sm font-medium">Nenhuma midia encontrada nesta aba.</p>
                    <p className="text-xs opacity-60 mt-1">Navegue pelas abas acima para alterar a visualizacao.</p>
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

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-mono text-zinc-500 uppercase">ID: {post.id.split('-')[0]}</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                                isApproved ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}>
                                {post.status}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs truncate">Midia Criativa</h4>
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
              </>
            )}
          </div>
        </div>

        {/* Right Details Panel */}
        {activeTab !== "admins" ? (
          <div className="flex-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-[500px]">
            {selectedPost ? (
              <div className="flex-1 flex flex-col lg:flex-row min-h-0">

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

                <div className="w-full lg:w-[400px] p-6 flex flex-col shrink-0">
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-zinc-800 mb-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-zinc-100 mb-1">Anotacoes & Feedbacks</h3>
                      <p className="text-zinc-500 text-xs pr-2">Instrucoes deixadas pelo cliente para a edicao.</p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      {selectedPost.status !== "POSTADO" && (
                        <button
                          onClick={() => handleUpdateToPosted(selectedPost.id)}
                          disabled={isUpdatingStatus}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] disabled:opacity-50"
                        >
                          {isUpdatingStatus ? <Loader2 size={14} className="animate-spin" /> : "Marcar como Postado"}
                        </button>
                      )}
                      {selectedPost.status === "POSTADO" && (
                        <div className="bg-zinc-800/50 border border-zinc-700 text-indigo-400 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm">
                          <CheckCircle2 size={14} /> Midia Postada
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
                <h3 className="text-lg font-bold text-zinc-300">Selecione uma Midia</h3>
                <p className="text-sm max-w-sm mt-1">Escolha uma publicacao da lista a esquerda para analisar as marcacoes e os feedbacks deixados pelo cliente.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-[500px]">
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-zinc-500">
              <Shield size={64} className="opacity-10 mb-4" />
              <h3 className="text-lg font-bold text-zinc-300">Aprovacao de Administradores</h3>
              <p className="text-sm max-w-sm mt-1">
                Gerencie as solicitacoes de novas contas de administrador. 
                Apenas usuarios com email @elevva.com podem solicitar acesso de admin, 
                e precisam ser aprovados por um administrador ja existente.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
