"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileVideo, Settings, LogOut } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/teladelogin");
  };

  // Rotas públicas ou externas que NÃO devem ter o menu lateral B2B
  if (
    pathname === "/teladelogin" || 
    pathname === "/" || 
    pathname?.startsWith("/approve") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <aside className="w-64 bg-[#0C0A3E] text-zinc-300 flex flex-col shrink-0 shadow-xl z-50">
      <div className="h-[90px] flex items-center px-8 font-extrabold text-white text-2xl tracking-tight border-b border-white/10">
        ELEVVA
      </div>
      
      <nav className="flex-1 py-8 px-4 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 hover:text-white transition-colors">
          <LayoutDashboard size={20} />
          <span className="font-bold text-sm">Dashboard</span>
        </Link>
        <Link href="/kanban" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 hover:text-white transition-colors">
          <FileVideo size={20} />
          <span className="font-bold text-sm">Fluxo de Aprovação</span>
        </Link>
        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 hover:text-white transition-colors">
          <Settings size={20} />
          <span className="font-bold text-sm">Configurações</span>
        </Link>
      </nav>

      <div className="p-6 border-t border-white/10">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors text-sm font-bold">
          <LogOut size={20} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
