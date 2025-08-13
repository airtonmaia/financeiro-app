// app/dashboard/layout.tsx
// Layout principal para a área autenticada, agora com suporte a dark mode.

import Header from '@/components/Header';
import NewSidebar from '@/components/Sidebar';
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider >
        <NewSidebar/>
        <SidebarInset>
          <Header />
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          
        </header>



<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
  {children}
</div>

        </SidebarInset>
      
    </SidebarProvider>
  );
}

