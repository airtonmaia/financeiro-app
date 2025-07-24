// app/layout.tsx

import type { Metadata } from "next";
// CORREÇÃO: Importando a nova fonte 'Source_Sans_3' (nome atual da Source Sans Pro)
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

// CORREÇÃO: Configurando a nova fonte
const sourceSans = Source_Sans_3({ 
  subsets: ["latin"],
  variable: '--font-source-sans', // Criando uma variável CSS para a fonte
});

export const metadata: Metadata = {
  title: "Financeiro PRO",
  description: "Sistema de gestão financeira.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      {/* CORREÇÃO: Aplicando a variável da fonte ao body */}
      <body className={`${sourceSans.variable} font-sans`}>{children}</body>
    </html>
  );
}
