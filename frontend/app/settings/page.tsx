"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Palette, Bell, Building2, ShieldCheck, Mail, CheckCircle2, Check } from "lucide-react";
import { getClientSettings, saveClientSettings, ClientSettings } from "../../src/infrastructure/storage/BrowserStorageAdapter";

export default function SettingsPage() {
  const [isSaved, setIsSaved] = useState(false);
  const [formData, setFormData] = useState<ClientSettings>({
    companyName: "",
    brandColor: "#0C0A3E",
    notificationEmail: "",
    dailySummary: true,
    newUploadAlert: true,
  });

  // Carrega as configurações locais isolando a infraestrutura
  useEffect(() => {
    const savedConfig = getClientSettings();
    if (savedConfig) {
      setFormData(savedConfig);
    }
  }, []);

  const handleSave = () => {
    saveClientSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Tira o aviso de salvo após 3 segundos
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {/* Header Premium */}
      <header className="px-6 md:px-12 py-8 bg-white border-b border-zinc-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/kanban" className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0C0A3E]">
                Configurações da Conta
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Personalize sua experiência no painel.</p>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#0C0A3E] hover:bg-[#1a175c] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
          >
            {isSaved ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Save size={16} />}
            {isSaved ? "Salvo com sucesso!" : "Salvar Alterações"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto mt-12 px-6 md:px-0 space-y-8">
        
        {/* Bloco 1: Identidade da Marca */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0C0A3E]">Brandbook & Identidade</h2>
              <p className="text-xs text-zinc-500">Defina as diretrizes visuais para a equipe de edição.</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                  <Building2 size={16} className="text-zinc-400" />
                  Nome da Empresa
                </label>
                <input 
                  type="text" 
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  placeholder="Sua Empresa Ltda."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C0A3E]/20 focus:border-[#0C0A3E] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                  Cor Principal da Marca (HEX)
                </label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={formData.brandColor}
                    onChange={(e) => setFormData({...formData, brandColor: e.target.value})}
                    className="h-11 w-14 rounded-lg cursor-pointer bg-zinc-50 border border-zinc-200 p-1"
                  />
                  <input 
                    type="text" 
                    value={formData.brandColor}
                    onChange={(e) => setFormData({...formData, brandColor: e.target.value})}
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0C0A3E]/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 2: Notificações */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0C0A3E]">Preferências de Alertas</h2>
              <p className="text-xs text-zinc-500">Como você deseja ser avisado sobre novas edições.</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-2 max-w-md">
              <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                <Mail size={16} className="text-zinc-400" />
                E-mail para Notificações
              </label>
              <input 
                type="email" 
                value={formData.notificationEmail}
                onChange={(e) => setFormData({...formData, notificationEmail: e.target.value})}
                placeholder="marketing@suaempresa.com"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C0A3E]/20 focus:border-[#0C0A3E] transition-all"
              />
            </div>

            <div className="pt-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.newUploadAlert ? 'bg-[#0C0A3E] border-[#0C0A3E]' : 'bg-white border-zinc-300 group-hover:border-[#0C0A3E]'}`}>
                  {formData.newUploadAlert && <Check className="text-white w-3 h-3" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={formData.newUploadAlert}
                  onChange={(e) => setFormData({...formData, newUploadAlert: e.target.checked})}
                />
                <div>
                  <p className="text-sm font-bold text-zinc-800">Alerta de Nova Mídia</p>
                  <p className="text-xs text-zinc-500">Receber um aviso instantâneo quando a agência enviar algo para aprovação.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.dailySummary ? 'bg-[#0C0A3E] border-[#0C0A3E]' : 'bg-white border-zinc-300 group-hover:border-[#0C0A3E]'}`}>
                  {formData.dailySummary && <Check className="text-white w-3 h-3" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={formData.dailySummary}
                  onChange={(e) => setFormData({...formData, dailySummary: e.target.checked})}
                />
                <div>
                  <p className="text-sm font-bold text-zinc-800">Resumo Diário</p>
                  <p className="text-xs text-zinc-500">Receber um e-mail no fim do dia com o consolidado do que foi aprovado.</p>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Bloco 3: Segurança */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0C0A3E]">Segurança e Acesso</h2>
              <p className="text-xs text-zinc-500">Gerencie sua senha de login da plataforma.</p>
            </div>
          </div>
          
          <div className="p-8">
            <button className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm rounded-xl transition-colors border border-zinc-200">
              Redefinir Senha
            </button>
            <p className="text-xs text-zinc-500 mt-3">Você receberá um link seguro no seu e-mail para cadastrar uma nova senha.</p>
          </div>
        </section>
        
      </main>
    </div>
  );
}
