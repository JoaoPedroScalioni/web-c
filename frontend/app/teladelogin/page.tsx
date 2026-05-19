"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  // Mockamos as credenciais iniciais para a apresentação da banca (UX rápida)
  const [email, setEmail] = useState("admin@elevva.com");
  const [password, setPassword] = useState("secret123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error("Credenciais inválidas. Verifique seu e-mail corporativo ou senha.");
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      router.push("/kanban"); // Redireciona para o fluxo de trabalho
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 relative overflow-hidden">
      {/* Background patterns Premium */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[50%] bg-[#0C0A3E]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[40%] bg-indigo-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-zinc-200 relative z-10 mx-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2 mb-2">
            <span className="text-[#0C0A3E]">ELEVVA</span>
          </h1>
          <p className="text-zinc-500 font-medium">Acesso Restrito - Equipe B2B</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-sm font-bold text-[#0C0A3E]">E-mail Corporativo</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C0A3E]/20 focus:border-[#0C0A3E] transition-all font-medium text-zinc-800"
              placeholder="seu.nome@elevva.com"
            />
          </div>

          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-[#0C0A3E]">Senha</label>
              <a href="#" className="text-xs text-zinc-400 hover:text-[#0C0A3E] font-medium transition-colors">Esqueceu?</a>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C0A3E]/20 focus:border-[#0C0A3E] transition-all font-medium text-zinc-800 tracking-widest"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 mt-4 bg-[#0C0A3E] hover:bg-[#1a1766] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(12,10,62,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Acessar Plataforma"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-400">
          <p>© 2024 Elevva Marketing. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
