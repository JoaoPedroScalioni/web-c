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
  const [hasError, setHasError] = useState(false);
  const addCommentMutation = useAddComment();
  
  const mediaRef = useRef<HTMLImageElement>(null);
  const [mediaBounds, setMediaBounds] = useState({ width: 0, height: 0, left: 0, top: 0 });

  const calculateBounds = () => {
    if (!mediaRef.current || hasError) return;
    const img = mediaRef.current;
    
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

  useEffect(() => {
    const imgElement = mediaRef.current;
    if (!imgElement || hasError) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateBounds();
    });

    resizeObserver.observe(imgElement);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [hasError]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaRef.current || hasError) return;
    
    const rect = mediaRef.current.getBoundingClientRect();
    
    const clickXRelative = e.clientX - rect.left - mediaBounds.left;
    const clickYRelative = e.clientY - rect.top - mediaBounds.top;

    if (
      clickXRelative < 0 || 
      clickXRelative > mediaBounds.width || 
      clickYRelative < 0 || 
      clickYRelative > mediaBounds.height
    ) {
      return;
    }

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

  return (
    <div className="relative inline-block border border-zinc-800 rounded-xl overflow-hidden shadow-2xl bg-zinc-950 w-full h-full flex items-center justify-center min-h-[300px]">
      <div 
        className="relative cursor-crosshair flex items-center justify-center w-full h-full" 
        onClick={handleCanvasClick}
      >
        <img 
          ref={mediaRef}
          src={mediaUrl} 
          alt="Post Media" 
          onLoad={calculateBounds}
          onError={() => setHasError(true)}
          className="max-w-full max-h-[70vh] object-contain select-none"
          draggable={false}
        />

        {mediaBounds.width > 0 && !hasError && (
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
                className="absolute flex items-center justify-center w-7 h-7 bg-indigo-600 text-white text-xs font-bold rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg transition-transform pointer-events-auto cursor-pointer group hover:scale-125 hover:z-30 border-2 border-white"
                style={{ left: `${comment.coord_x}%`, top: `${comment.coord_y}%` }}
              >
                <span>!</span>
                <div className="absolute hidden group-hover:block bottom-full mb-3 bg-zinc-900 text-white text-xs p-2.5 rounded-md whitespace-nowrap z-50 shadow-xl border border-zinc-700">
                  {comment.content}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-zinc-900"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAdding && (
          <div className="absolute inset-0 bg-zinc-950/50 flex items-center justify-center backdrop-blur-sm z-50">
            <span className="text-white font-medium bg-zinc-900 px-5 py-2.5 rounded-lg shadow-xl animate-pulse border border-zinc-800 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Salvando Pin...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
