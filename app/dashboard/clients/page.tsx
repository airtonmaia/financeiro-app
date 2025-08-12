// app/dashboard/clients/page.tsx
// Página para listar, gerir e visualizar os clientes a partir do banco de dados com DataTable.

'use client'; 

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Users, Briefcase, DollarSign, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { type Client } from '@/types';
import { AddClientSheet } from '@/components/AddClientSheet';

// --- TIPOS -- -
// Tipo para o estado do cliente, incluindo dados agregados de projetos
type ClientWithProjects = Client & {
  projetos: number;
  valor_total: number;
};

// --- COMPONENTES ---

function ClientStatCard({ title, value, description, icon: Icon, valueColor }: { title: string; value: string; description: React.ReactNode; icon: React.ElementType; valueColor?: string; }) {
    return (
        <div className="bg-white border p-5 rounded-xl">
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
  const [clients, setClients] = useState<ClientWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para controlar o sheet de Adicionar/Editar Cliente
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*, projetos(id, valor_total)')
      .order('created_at', { ascending: false });

    if (error) {
      setError(`Erro ao carregar clientes: ${error.message}`);
      console.error(error);
    } else {
      const clientsWithProjectData = data.map(client => {
        const projetos = Array.isArray(client.projetos) ? client.projetos : [];
        const totalProjetos = projetos.length;
        const valorTotal = projetos.reduce(
          (acc, projeto) => acc + (projeto.valor_total || 0),
          0
        );
        return {
          ...client,
          projetos: totalProjetos,
          valor_total: valorTotal,
        };
      });
      setClients(clientsWithProjectData);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAddNew = () => {
    setSelectedClient(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsSheetOpen(true);
  };
  
  const handleDeleteClient = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id);

        if (error) {
            alert(`Erro ao excluir cliente: ${error.message}`);
        } else {
            fetchClients(); // Re-fetch para atualizar a lista e os totais
        }
    }
  };

  // Lógica de Paginação
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const paginatedClients = clients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (error) {
    return <div className="p-5 text-center text-destructive bg-destructive/10 rounded-lg">{error}</div>;
  }

  const totalClientes = clients.length;
  const totalProjetosAtivos = clients.reduce((acc, client) => acc + client.projetos, 0);
  const valorTotalProjetos = clients.reduce((acc, client) => acc + client.valor_total, 0);

  return (
    <div className="space-y-6">
      <AddClientSheet 
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        clientToEdit={selectedClient}
        onSuccess={() => {
          fetchClients();
          setIsSheetOpen(false);
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ClientStatCard 
            title="Total de Clientes" 
            value={String(totalClientes)} 
            description={<span className="text-gray-500">Clientes cadastrados</span>} 
            icon={Users} 
            valueColor="text-green-600" 
        />
        <ClientStatCard 
            title="Projetos Ativos" 
            value={String(totalProjetosAtivos)} 
            description={<span className="text-gray-500">Distribuídos entre os clientes</span>} 
            icon={Briefcase} 
            valueColor="text-brand-primary" 
        />
        <ClientStatCard 
            title="Valor Total" 
            value={valorTotalProjetos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}  
            description={<span className="text-gray-500">Em projetos ativos</span>} 
            icon={DollarSign} 
            valueColor="text-green-600" 
        />
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Clientes</h2>
            <Button variant="outline" onClick={handleAddNew}>Cadastrar novo cliente</Button>
        </div>

        <div className="overflow-x-auto">
            {loading ? (
                 <p className="p-5 text-center text-muted-foreground">Carregando clientes...</p>
            ) : (
                <>
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nome</th>
                                <th scope="col" className="px-6 py-3">Contato</th>
                                <th scope="col" className="px-6 py-3">Origem</th>
                                <th scope="col" className="px-6 py-3 text-center">Projetos</th>
                                <th scope="col" className="px-6 py-3 text-right">Valor Total</th>
                                <th scope="col" className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedClients.map((client) => (
                                <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div>{client.nome}</div>
                                        <div className="text-xs text-gray-500">{client.empresa}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>{client.email_contato}</div>
                                        <div className="text-xs text-gray-500">{client.telefone}</div>
                                    </td>
                                    <td className="px-6 py-4">{client.origem}</td>
                                    <td className="px-6 py-4 text-center">{client.projetos}</td>
                                    <td className="px-6 py-4 text-right font-semibold">
                                        {client.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 rounded-full hover:bg-gray-200">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/clients/${client.id}/edit`}><Eye className="w-4 h-4 mr-2"/> Ver</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(client)}>
                                                    <Edit className="w-4 h-4 mr-2"/> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-red-500">
                                                    <Trash2 className="w-4 h-4 mr-2"/> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <span className="text-sm">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Próximo
                        </Button>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
}
