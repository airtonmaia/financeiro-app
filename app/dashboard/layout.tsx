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
     


<div className="flex flex-1 flex-col gap-4 p-4">
  {children}
</div>

        </SidebarInset>
      
    </SidebarProvider>
  );
}

