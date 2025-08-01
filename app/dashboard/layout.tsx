// app/dashboard/layout.tsx
// Layout principal para a área autenticada, agora com suporte a dark mode.

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ADIÇÃO: Classes dark:* para alterar o fundo e o texto no dark mode
    <div className="flex h-screen bg-light-primary text-dark-text font-sans dark:bg-dark-primary dark:text-light-text ">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
