"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileVideo, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface UploadManagerProps {
  calendarId: string;
  onUploadSuccess?: () => void;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "image/jpeg", "image/png"];

export default function UploadManager({ calendarId, onUploadSuccess }: UploadManagerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`Arquivo muito grande: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB. O limite é 500MB.`);
      return;
    }
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Formato inválido. Use MP4, WebM, JPEG ou PNG.");
      return;
    }
    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("calendar_id", calendarId);
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    xhr.open("POST", `${apiUrl}/posts/upload`, true);

    // INJETANDO O TOKEN JWT PARA PASSAR NA SEGURANÇA B2B
    const token = localStorage.getItem("access_token");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentCompleted = Math.round((event.loaded * 100) / event.total);
        setProgress(percentCompleted);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        if (onUploadSuccess) onUploadSuccess();
        
        setTimeout(() => {
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          setProgress(0);
        }, 2000);
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          setError(`Erro no Upload: ${response.detail || xhr.statusText}`);
        } catch {
          setError(`Falha ao conectar no servidor (CORS ou Off-line)`);
        }
        setProgress(0);
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setError("Falha de rede ou CORS ao tentar o upload local.");
      setProgress(0);
    };

    xhr.send(formData);
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
        <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
          <UploadCloud className="text-zinc-500" size={18} />
          Ingestão de Mídia B2B
        </h3>
        <p className="text-xs text-zinc-500 mt-1">Upload Local de Alta Velocidade (Máx 500MB)</p>
      </div>
      
      <div className="p-6">
        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${isDragOver ? 'border-indigo-500 bg-indigo-50/50' : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100/50'}
            `}
          >
            <input 
              ref={fileInputRef} type="file" className="hidden" 
              accept="video/mp4,video/webm,image/jpeg,image/png"
              onChange={handleFileChange}
            />
            <div className="bg-white p-3 rounded-full shadow-sm mb-3 border border-zinc-100">
              <UploadCloud className="text-zinc-400" size={24} />
            </div>
            <p className="text-sm font-medium text-zinc-700">Clique ou arraste a mídia aqui</p>
            <p className="text-xs text-zinc-400 mt-1">MP4, WebM, PNG, JPG</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 border border-zinc-200 rounded-lg bg-zinc-50">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-md">
                <FileVideo size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!isUploading && progress !== 100 && (
                <button onClick={() => setFile(null)} className="text-zinc-400 hover:text-red-500 text-xs font-medium px-2 py-1">
                  Remover
                </button>
              )}
            </div>

            {progress > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-zinc-600">
                  <span>Enviando para a nuvem...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={isUploading || progress === 100}
              className={`
                w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium text-sm transition-all
                ${progress === 100 
                  ? 'bg-emerald-500 text-white cursor-default' 
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
                }
              `}
            >
              {isUploading ? (
                <><Loader2 size={16} className="animate-spin" /> Processando Bypass...</>
              ) : progress === 100 ? (
                <><CheckCircle2 size={16} /> Upload Concluído</>
              ) : (
                'Iniciar Upload'
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-600 border border-red-100 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
