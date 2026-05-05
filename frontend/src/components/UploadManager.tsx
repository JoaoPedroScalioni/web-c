"use client";

import React, { useState, useRef } from "react";
import { useUploadIntent } from "../adapters/post-service";
import { ApiError } from "../adapters/api-client";

interface UploadManagerProps {
  calendarId: string; // O ID do calendário/cliente atual
  onUploadSuccess?: () => void;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_TYPES = ["video/mp4", "video/webm", "image/jpeg", "image/png"];

export default function UploadManager({ calendarId, onUploadSuccess }: UploadManagerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIntentMutation = useUploadIntent();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validação Client-Side Espelho (Sniper Secundário)
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(`O arquivo excede o limite de 500MB (Tamanho atual: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB).`);
        return;
      }
      
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        setError("Formato não suportado. Use MP4, WebM, JPEG ou PNG.");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setProgress(10); // Feedback inicial

    try {
      // 1. Solicita a Intenção de Upload ao Backend (Gerando a URL S3 via boto3)
      const intentResponse = await uploadIntentMutation.mutateAsync({
        calendar_id: calendarId,
        filename: file.name,
        content_type: file.type,
        file_size_bytes: file.size,
      });

      setProgress(40);

      // 2. Upload Bypass Direto para o AWS S3
      // A requisição usa PUT pois o generate_presigned_url('put_object') espera este método.
      const s3Response = await fetch(intentResponse.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!s3Response.ok) {
        throw new Error(`Falha no S3 Bypass: ${s3Response.statusText}`);
      }

      setProgress(100);
      
      // Notifica o componente pai (ex: Recarregar Kanban)
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Limpar o form
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (err: any) {
      if (err instanceof ApiError) {
        // Erro 422 capturado do Pydantic no Backend
        setError(`Erro de Validação Backend: ${JSON.stringify(err.details || err.message)}`);
      } else {
        setError(`Falha crítica no upload: ${err.message}`);
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm max-w-md">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Nova Mídia (Bypass S3)</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selecione o Vídeo ou Imagem (Máx 500MB)
          </label>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="video/mp4,video/webm,image/jpeg,image/png"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100
              disabled:opacity-50"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            <strong>Arquivo:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {progress > 0 && progress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {progress === 100 && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
            Upload concluído com sucesso!
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? "Enviando Bypass S3..." : "Iniciar Upload B2B"}
        </button>
      </div>
    </div>
  );
}
