"use client";

import React, { useState, useRef, useEffect } from "react";
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
  
  const mediaRef = useRef<HTMLImageElement>(null);
  const [mediaBounds, setMediaBounds] = useState({ width: 0, height: 0, left: 0, top: 0 });

  // Calcula as dimensões reais da mídia, ignorando as barras do object-contain
  const calculateBounds = () => {
    if (!mediaRef.current) return;
    const img = mediaRef.current;
    
    // Precisamos garantir que a imagem já carregou para ter o naturalWidth
    if (!img.naturalWidth || !img.naturalHeight) return;

    const rect = img.getBoundingClientRect();
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const ratioX = rect.width / naturalWidth;
    const ratioY = rect.height / naturalHeight;
    const scaleFactor = Math.min(ratioX, ratioY);

    const contentWidth = naturalWidth * scaleFactor;
    const contentHeight = naturalHeight * scaleFactor;
    
    const offsetX = (rect.width - contentWidth) / 2;
    const offsetY = (rect.height - contentHeight) / 2;

    setMediaBounds({
      width: contentWidth,
      height: contentHeight,
      left: offsetX,
      top: offsetY
    });
  };

  // Recalcula as dimensões quando a imagem carrega ou a janela muda de tamanho
  useEffect(() => {
    const imgElement = mediaRef.current;
    if (!imgElement) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateBounds();
    });

    resizeObserver.observe(imgElement);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaRef.current) return;
    
    const rect = mediaRef.current.getBoundingClientRect();
    
    // Normalizar o clique relativo à mídia de fato (descontando as barras)
    const clickXRelative = e.clientX - rect.left - mediaBounds.left;
    const clickYRelative = e.clientY - rect.top - mediaBounds.top;

    // Validação Sniper Extra: Bloqueia cliques fora da área útil (nas barras pretas)
    if (
      clickXRelative < 0 || 
      clickXRelative > mediaBounds.width || 
      clickYRelative < 0 || 
      clickYRelative > mediaBounds.height
    ) {
      // Clicou nas bordas/letterbox do object-contain, ignorar
      return;
    }

    // Calcular as coordenadas percentuais (0.0 a 100.0) puras da mídia
    const xPercent = Number(((clickXRelative / mediaBounds.width) * 100).toFixed(2));
    const yPercent = Number(((clickYRelative / mediaBounds.height) * 100).toFixed(2));

    const content = window.prompt("Digite seu feedback visual para este ponto:");
    
    if (content) {
      setIsAdding(true);
      addCommentMutation.mutate(
        {
          postId,
          comment: {
            user_id: "00000000-0000-0000-0000-000000000001",
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
    <div className="relative inline-block border border-gray-300 rounded-lg overflow-hidden shadow-lg bg-black">
      {/* Wrapper do media */}
      <div 
        className="relative cursor-crosshair flex items-center justify-center" 
        onClick={handleCanvasClick}
      >
        <img 
          ref={mediaRef}
          src={mediaUrl} 
          alt="Post Media" 
          onLoad={calculateBounds}
          className="max-w-3xl max-h-[70vh] object-contain select-none"
          draggable={false}
        />

        {/* Container overlay perfeito sobre a mídia real para os Pins */}
        {mediaBounds.width > 0 && (
          <div 
            className="absolute pointer-events-none"
            style={{
              width: mediaBounds.width,
              height: mediaBounds.height,
              left: mediaBounds.left,
              top: mediaBounds.top
            }}
          >
            {existingComments.map((comment) => (
              <div
                key={comment.id}
                className="absolute flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md transition-transform pointer-events-auto cursor-pointer group hover:scale-125 hover:z-30"
                style={{ left: `${comment.coord_x}%`, top: `${comment.coord_y}%` }}
              >
                <span>!</span>
                {/* Tooltip */}
                <div className="absolute hidden group-hover:block bottom-full mb-2 bg-black/90 text-white text-xs p-2 rounded whitespace-nowrap z-50">
                  {comment.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading State visual overlay */}
        {isAdding && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-50">
            <span className="text-white font-bold bg-black/60 px-4 py-2 rounded animate-pulse">Salvando Pin...</span>
          </div>
        )}
      </div>
    </div>
  );
}
