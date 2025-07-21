// app/layout.tsx
// Este é o layout raiz da sua aplicação Next.js.
// Ele envolve todas as páginas e define elementos globais como HTML, Body e fontes.

import type { Metadata } from "next";
import { Inter } from 'next/font/google';

// A LINHA MAIS IMPORTANTE: Importa os estilos globais, incluindo o Tailwind CSS.
import './globals.css';

// Configura a fonte Inter.
const inter = Inter({ subsets: ['latin'] });

// Define metadados da aplicação, como título e descrição.
export const metadata: Metadata = {
  title: 'Meu Sistema Financeiro',
  description: 'Sistema de gestão financeira simples para sua empresa.',
};

// O componente RootLayout define a estrutura HTML básica de todas as páginas.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      {/* Aplica a classe da fonte e outros estilos globais ao body. */}
      <body className={inter.className}>
        {children} {/* Renderiza o conteúdo da página atual */}
      </body>
    </html>
  );
}
