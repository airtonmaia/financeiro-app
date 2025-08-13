// app/dashboard/layout.tsx
// Layout principal para a área autenticada, agora com suporte a dark mode.

import Header from '@/components/Header';
import NewSidebar from '@/components/Sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-light-primary text-dark-text font-sans dark:bg-dark-primary dark:text-light-text ">
        <NewSidebar />
        <SidebarInset>
          <Header />
          <div className="flex-1 p-6 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

