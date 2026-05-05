"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePendingPosts } from "../../src/adapters/post-service";
import PinCanvas from "../../src/components/PinCanvas";
import UploadManager from "../../src/components/UploadManager";

export default function KanbanPage() {
  const { data: pendingPosts, isLoading, isError } = usePendingPosts();
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-red-500">Erro ao carregar os posts pendentes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Fluxo de Aprovação</h1>
          <p className="text-gray-500 mt-1">Analise as mídias e decida o status do post.</p>
        </div>
        
        {/* Upload Manager Injetado */}
        <div className="w-full md:w-auto">
          <UploadManager 
            calendarId="123e4567-e89b-12d3-a456-426614174000" // Mockado para Demo
            onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ["pendingPosts"] })}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {pendingPosts?.map((post) => (
          <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
            {/* Seção da Mídia com o Canvas Interativo */}
            <div className="flex-1 p-6 bg-gray-50 border-r border-gray-200 flex flex-col items-center justify-center">
              <PinCanvas 
                postId={post.id} 
                mediaUrl={post.media_url} 
                existingComments={post.comments} 
              />
            </div>

            {/* Seção de Controles e Decisão */}
            <div className="w-full md:w-96 p-8 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold tracking-wide">
                    {post.status.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ação Requerida</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Revise o vídeo ao lado. Se encontrar algum problema, clique no vídeo para adicionar um pin visual.
                </p>
                
                {post.comments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 text-sm mb-2">Feedbacks Atuais ({post.comments.length})</h4>
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                      {post.comments.map(c => (
                        <li key={c.id} className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                          {c.content}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-sm">
                  ✓ Aprovar Post
                </button>
                <button className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-colors shadow-sm">
                  ✕ Rejeitar
                </button>
              </div>
            </div>
          </div>
        ))}

        {pendingPosts?.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            Nenhum post aguardando aprovação no momento.
          </div>
        )}
      </div>
    </div>
  );
}
