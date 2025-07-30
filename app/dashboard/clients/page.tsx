// app/dashboard/clients/page.tsx
// Página para listar, gerir e visualizar os clientes a partir do banco de dados com DataTable.

'use client'; 

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Users, Briefcase, DollarSign, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { columns, Client } from "./columns";
import { DataTable } from "@/components/ui/data-table";

// --- COMPONENTES ---

function ClientStatCard({ title, value, description, icon: Icon, valueColor }: { title: string; value: string; description: string; icon: React.ElementType; valueColor?: string; }) {
    return (
        <div className="bg-card p-5 rounded-xl shadow-sm border">
            <div className="flex justify-between items-start">
                <p className="text-muted-foreground font-semibold">{title}</p>
                <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className={`text-3xl font-bold mt-2 ${valueColor ?? 'text-foreground'}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        setError(`Erro ao carregar clientes: ${error.message}`);
        console.error(error);
    } else {
        setClients(data as Client[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  const handleDeleteClient = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id);

        if (error) {
            alert(`Erro ao excluir cliente: ${error.message}`);
        } else {
            // Atualiza a lista de clientes após a exclusão
            setClients(clients.filter(client => client.id !== id));
        }
    }
  };

  if (error) {
    return <div className="p-5 text-center text-destructive bg-destructive/10 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ClientStatCard title="Total de Clientes" value={String(clients.length)} description="+2 novos este mês" icon={Users} valueColor="text-green-600" />
        <ClientStatCard title="Projetos Ativos" value="6" description="Distribuídos entre 3 clientes" icon={Briefcase} valueColor="text-brand-primary" />
        <ClientStatCard title="Valor Total" value="R$ 27.000" description="Em projetos ativos" icon={DollarSign} valueColor="text-green-600" />
      </div>

      <div className="bg-card rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Clientes</h2>
            <Button asChild>
              <Link href="/dashboard/clients/new" className="bg-brand-primary text-white">
                <Plus className="w-4 h-4 mr-2 " /> Novo Cliente
              </Link>
            </Button>
        </div>

        {/* Lista de Clientes com DataTable */}
        <div>
            {loading ? (
                 <p className="p-5 text-center text-muted-foreground">Carregando clientes...</p>
            ) : (
                <DataTable 
                  columns={columns} 
                  data={clients} 
                  // Passamos a função de exclusão para a tabela
                  deleteClient={handleDeleteClient} 
                />
            )}
        </div>
      </div>
    </div>
  );
}
