import QueryProvider from "../src/providers/QueryProvider";

export const metadata = {
  title: "Elevva Marketing",
  description: "B2B Video Marketing Approval Workflow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
