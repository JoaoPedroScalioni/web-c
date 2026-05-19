import QueryProvider from "../src/providers/QueryProvider";
import "./globals.css";
import Sidebar from "../src/components/Sidebar";

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
          {/* Sidebar Dinâmica B2B */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-zinc-50 relative">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
