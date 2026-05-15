"use client";

import React, { useState } from "react";
import { useAddComment } from "../adapters/post-service";
import { components } from "../types/api";
import { Loader2, Send } from "lucide-react";

type CommentResponse = components["schemas"]["CommentResponse"];

interface CommentSectionProps {
  postId: string;
  existingComments: CommentResponse[];
  theme?: "light" | "dark";
}

export default function CommentSection({ postId, existingComments, theme = "light" }: CommentSectionProps) {
  const [commentText, setCommentText] = useState("");
  const addCommentMutation = useAddComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addCommentMutation.mutate(
      {
        postId,
        comment: {
          user_id: "00000000-0000-0000-0000-000000000001", // Mocked user
          content: commentText.trim(),
          // coord_x e coord_y omitidos conforme nova refatoração
        },
      },
      {
        onSuccess: () => setCommentText(""),
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {existingComments.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-semibold text-sm ${theme === "dark" ? "text-zinc-100" : "text-zinc-900"}`}>Feedbacks Atuais</h4>
            <span className={`text-xs py-0.5 px-2 rounded-full font-medium ${theme === "dark" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
              {existingComments.length}
            </span>
          </div>
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {existingComments.map((c) => {
              const shortId = c.id.split("-")[0];
              const avatarLetter = shortId.charAt(0).toUpperCase();
              
              return (
              <li key={c.id} className={`text-xs p-4 rounded-xl border shadow-sm flex items-start gap-3 transition-all ${theme === "dark" ? "bg-zinc-800/60 backdrop-blur-md border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/80" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}>
                <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full font-bold shadow-sm ${theme === "dark" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                  {avatarLetter}
                </div>
                <div className="flex-1 mt-0.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`}>Gestor</span>
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>#{shortId}</span>
                  </div>
                  <span className="break-words leading-relaxed block">{c.content}</span>
                </div>
              </li>
            )})}
          </ul>
        </div>
      ) : (
        <div className={`mb-6 p-4 border rounded-lg text-center ${theme === "dark" ? "bg-zinc-800/20 border-dashed border-zinc-800" : "bg-zinc-50 border-zinc-100"}`}>
          <p className="text-sm text-zinc-400">Nenhum feedback apontado ainda.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-auto">
        <label className={`block text-xs font-semibold mb-2 ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Adicionar Feedback</label>
        <div className="relative">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Descreva o que precisa ser ajustado..."
            className={`w-full text-sm border rounded-lg p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-24 ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" : "bg-white border-zinc-200 text-zinc-900"}`}
            disabled={addCommentMutation.isPending}
          />
          <button
            type="submit"
            disabled={addCommentMutation.isPending || !commentText.trim()}
            className="absolute bottom-3 right-3 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {addCommentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
}
