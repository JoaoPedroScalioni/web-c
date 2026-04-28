"use client";

import React, { useState } from "react";
import { useAddComment } from "../adapters/post-service";
import { components } from "../types/api";

type CommentResponse = components["schemas"]["CommentResponse"];

interface PinCanvasProps {
  postId: string;
  mediaUrl: string;
  existingComments: CommentResponse[];
}

export default function PinCanvas({ postId, mediaUrl, existingComments }: PinCanvasProps) {
  const [isAdding, setIsAdding] = useState(false);
  const addCommentMutation = useAddComment();

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Pegar o elemento que disparou o evento (a div relativa)
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Calcular X e Y absolutos dentro do container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Converter para porcentagem de 0.0 a 100.0
    const xPercent = Number(((x / rect.width) * 100).toFixed(2));
    const yPercent = Number(((y / rect.height) * 100).toFixed(2));

    // Pedir o texto para o usuário (em uma versão real, abriríamos um modal/popover)
    const content = window.prompt("Digite seu feedback visual para este ponto:");
    
    if (content) {
      setIsAdding(true);
      addCommentMutation.mutate(
        {
          postId,
          comment: {
            user_id: "00000000-0000-0000-0000-000000000001", // Hardcoded para demo
            content,
            coord_x: xPercent,
            coord_y: yPercent,
          },
        },
        {
          onSettled: () => setIsAdding(false),
        }
      );
    }
  };

  return (
    <div className="relative inline-block border border-gray-300 rounded-lg overflow-hidden shadow-lg">
      {/* O elemento clicável sobreposto */}
      <div 
        className="relative cursor-crosshair" 
        onClick={handleCanvasClick}
      >
        <img 
          src={mediaUrl} 
          alt="Post Media" 
          className="max-w-3xl max-h-[70vh] object-contain select-none"
          draggable={false}
        />

        {/* Renderização dos Pins Salvos */}
        {existingComments.map((comment) => (
          <div
            key={comment.id}
            className="absolute flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md hover:scale-110 transition-transform group"
            style={{ left: `${comment.coord_x}%`, top: `${comment.coord_y}%` }}
          >
            <span>!</span>
            {/* Tooltip simples exibindo o conteúdo do comentário */}
            <div className="absolute hidden group-hover:block bottom-full mb-2 bg-black text-white text-xs p-2 rounded whitespace-nowrap z-10">
              {comment.content}
            </div>
          </div>
        ))}

        {/* Loading State visual overlay */}
        {isAdding && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm z-20">
            <span className="text-white font-bold bg-black/60 px-4 py-2 rounded">Salvando Pin...</span>
          </div>
        )}
      </div>
    </div>
  );
}
