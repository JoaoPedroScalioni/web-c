"use client";

import React, { useState } from "react";

interface MediaViewerProps {
  mediaUrl: string;
}

export default function MediaViewer({ mediaUrl }: MediaViewerProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-zinc-100 rounded-xl border border-dashed border-zinc-300">
        <div className="bg-zinc-200 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <p className="text-zinc-600 font-medium">Mídia não encontrada</p>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs text-center break-all">{mediaUrl}</p>
      </div>
    );
  }

  // Verifica se a URL é vídeo ou imagem baseado na extensão (simplificado)
  const isVideo = mediaUrl.toLowerCase().match(/\.(mp4|webm|ogg)$/);

  return (
    <div className="flex items-center justify-center border border-zinc-800 rounded-xl overflow-hidden shadow-2xl bg-zinc-950 w-full h-full min-h-[300px] max-h-[80vh]">
      {isVideo ? (
        <video 
          src={mediaUrl} 
          controls 
          onError={() => setHasError(true)}
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <img 
          src={mediaUrl} 
          alt="Media Content" 
          onError={() => setHasError(true)}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      )}
    </div>
  );
}
