// app/layout.tsx

import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const sourceSans = Source_Sans_3({ 
  subsets: ["latin"],
  variable: '--font-source-sans', 
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
    <html lang="pt-br" suppressHydrationWarning>
      <body className={`${sourceSans.variable} font-sans`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}