import Link from "next/link";
import { Button } from "@/components/ui/button";
import { columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { createClient } from "@/lib/supabase"
import { Client } from "@/types"
import { Users, Briefcase, DollarSign, PlusCircle, LucideIcon } from "lucide-react"
import React from "react";

// 1. Definição da interface de Props para o Card
interface ClientStatCardProps {
  title: string;
  value: string;
  description: React.ReactNode; // 2. Alterado de string para React.ReactNode
  icon: LucideIcon;
  valueColor: string;
}

// 3. Aplicando os tipos ao componente
const ClientStatCard = ({ title, value, description, icon: Icon, valueColor }: ClientStatCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
    <div className="bg-gray-100 p-3 rounded-lg">
      <Icon className="h-6 w-6 text-gray-600" />
    </div>
  </div>
);

export default async function ClientsPage() {
  const supabase = createClient();
  const { data: clientsData, error } = await supabase.from("clients").select(`
    id,
    nome,
    empresa,
    email_contato,
    telefone,
    origem,
    tipo,
    projetos:projects(count),
    valor_total:projects(valor)
  `);

  const clients: Client[] = clientsData?.map(client => ({
    ...client,
    projetos: client.projetos[0]?.count || 0,
    valor_total: client.valor_total.reduce((acc, p) => acc + p.valor, 0) || 0,
  })) || [];

  if (error && !clientsData) {
    console.error("Error fetching clients:", error);
    // Handle error appropriately
    return <div>Error loading clients.</div>;
  }

  const handleDeleteClient = async (clientId: string) => {
    'use server'
    console.log('delete client', clientId)
    // Lógica para deletar o cliente
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-gray-500">Gerencie seus clientes e veja o desempenho.</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Cliente
          </Button>
        </Link>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ClientStatCard title="Total de Clientes" value={String(clients.length)} description={<span className="text-gray-500">+2 novos este mês</span>} icon={Users} valueColor="text-green-600" />
        <ClientStatCard title="Projetos Ativos" value="6" description={<span className="text-gray-500">Distribuídos entre 3 clientes</span>} icon={Briefcase} valueColor="text-brand-primary" />
        <ClientStatCard title="Valor Total" value="R$ 27.000"  description={<span className="text-gray-500">Em projetos ativos</span>} icon={DollarSign} valueColor="text-green-600" />
      </div>

      <div className="mt-8">
        <DataTable
          columns={columns}
          data={clients}
          meta={{
            deleteClient: handleDeleteClient,
          }}
        />
      </div>
    </div>
  );
}
