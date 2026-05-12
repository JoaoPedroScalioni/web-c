"use client";

import { usePendingPosts } from "../../src/adapters/post-service";
import Link from "next/link";
import { Loader2, FolderOpen, Clock, CheckCircle2, AlertTriangle, PlayCircle } from "lucide-react";

export default function DashboardGalleryPage() {
  const { data: posts, isLoading, isError } = usePendingPosts();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400 h-10 w-10" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 p-8">
        <div className="bg-white border border-red-200 p-8 rounded-2xl max-w-md text-center shadow-sm">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Erro ao carregar galeria</h2>
          <p className="text-zinc-500">Não foi possível carregar os materiais. Verifique se o backend está online.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
            <FolderOpen className="text-indigo-600" size={32} />
            Galeria do Cliente
          </h1>
          <p className="text-zinc-500 mt-2 text-lg">Selecione um material abaixo para revisar ou aprovar.</p>
        </header>

        {posts?.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-16 text-center">
            <FolderOpen className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-900">Nenhuma mídia encontrada</h3>
            <p className="text-zinc-500 mt-2">A agência ainda não disponibilizou nenhum material para revisão.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts?.map((post) => {
              const isVideo = post.media_url.endsWith(".mp4") || post.media_url.endsWith(".webm");
              
              let statusColor = "bg-amber-100 text-amber-800 border-amber-200";
              let StatusIcon = Clock;
              
              if (post.status === "APROVADO") {
                statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                StatusIcon = CheckCircle2;
              } else if (post.status === "REJEITADO") {
                statusColor = "bg-red-100 text-red-800 border-red-200";
                StatusIcon = AlertTriangle;
              }

              return (
                <Link href={`/approve/${post.id}`} key={post.id} className="group block">
                  <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                    
                    {/* Thumbnail Area */}
                    <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                      {isVideo ? (
                        <>
                          <video 
                            src={post.media_url} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <PlayCircle className="text-white/70 w-12 h-12 group-hover:scale-110 transition-transform" />
                          </div>
                        </>
                      ) : (
                        <img 
                          src={post.media_url} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${statusColor}`}>
                          <StatusIcon size={12} strokeWidth={3} />
                          {post.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Info Area */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-zinc-400">ID: {post.id.split('-')[0]}</span>
                        {post.comments.length > 0 && (
                          <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            {post.comments.length} Pins
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-zinc-900 truncate">Peça Criativa</h3>
                      <p className="text-sm text-zinc-500 mt-1">Clique para abrir o estúdio de revisão</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
