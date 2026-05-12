import QueryProvider from "../src/providers/QueryProvider";
import "./globals.css";
import { LayoutDashboard, FileVideo, Settings, LogOut } from "lucide-react";

export const metadata = {
  title: "Elevva Marketing B2B",
  description: "B2B Video Marketing Approval Workflow",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="bg-zinc-50">
      <body className="flex h-screen overflow-hidden text-zinc-900 font-sans antialiased">
        <QueryProvider>
          {/* Sidebar B2B */}
          <aside className="w-64 bg-zinc-900 text-zinc-300 flex flex-col shrink-0">
            <div className="h-16 flex items-center px-6 font-bold text-white text-xl tracking-tight border-b border-zinc-800">
              ELEVVA
            </div>
            
            <nav className="flex-1 py-6 px-3 space-y-1">
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-800 hover:text-white transition-colors">
                <LayoutDashboard size={20} />
                <span className="font-medium text-sm">Dashboard</span>
              </a>
              <a href="/kanban" className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-zinc-800 text-white transition-colors">
                <FileVideo size={20} />
                <span className="font-medium text-sm">Fluxo de Aprovação</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-800 hover:text-white transition-colors">
                <Settings size={20} />
                <span className="font-medium text-sm">Configurações</span>
              </a>
            </nav>

            <div className="p-4 border-t border-zinc-800">
              <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium">
                <LogOut size={20} />
                Sair
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-zinc-50 relative">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
