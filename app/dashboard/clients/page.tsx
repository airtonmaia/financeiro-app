// app/dashboard/clients/page.tsx
// Página para listar, gerir e visualizar os clientes a partir do banco de dados com DataTable.

'use client'; 

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Users, Briefcase, DollarSign, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from "@/components/ui/input";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
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
        <div className="bg-card border p-5 rounded-xl">
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
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          (acc: number, projeto: { id: string; valor_total: number | null }) => {
            const valor = (projeto && typeof projeto.valor_total === 'number') ? projeto.valor_total : 0;
            return acc + valor;
          },
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
            fetchClients();
        }
    }
  };

  // Filtra os clientes com base na busca
  const filteredClients = clients.filter(client => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      (client.nome && client.nome.toLowerCase().includes(searchTerm)) ||
      (client.empresa && client.empresa.toLowerCase().includes(searchTerm)) ||
      (client.email_contato && client.email_contato.toLowerCase().includes(searchTerm))
    );
  });

  // Lógica de Paginação
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            description="Clientes cadastrados" 
            icon={Users} 
            valueColor="text-success-600" 
        />
        <ClientStatCard 
            title="Projetos Ativos" 
            value={String(totalProjetosAtivos)} 
            description="Distribuídos entre os clientes" 
            icon={Briefcase} 
            valueColor="text-primary" 
        />
        <ClientStatCard 
            title="Valor Total" 
            value={valorTotalProjetos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}  
            description="Em projetos ativos" 
            icon={DollarSign} 
            valueColor="text-success-600" 
        />
      </div>

      <div className="bg-card rounded-xl shadow-card">
        <div className="flex justify-between items-center p-6">
            <div className="w-1/3">
              <Input 
                placeholder="Buscar por nome, empresa ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleAddNew}>Cadastrar novo cliente</Button>
        </div>

        <div className="overflow-x-auto">
            {loading ? (
                 <p className="p-5 text-center text-muted-foreground">Carregando clientes...</p>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Origem</TableHead>
                                <TableHead className="text-center">Projetos</TableHead>
                                <TableHead className="text-right">Valor Total</TableHead>
                                <TableHead className="text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedClients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium text-foreground">
                                        <div>{client.nome}</div>
                                        <div className="text-xs text-muted-foreground">{client.empresa}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{client.email_contato}</div>
                                        <div className="text-xs text-muted-foreground">{client.telefone}</div>
                                    </TableCell>
                                    <TableCell>{client.origem}</TableCell>
                                    <TableCell className="text-center">{client.projetos}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {client.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-8 h-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleEdit(client)}>
                                                    <Edit className="w-4 h-4 mr-2"/> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="w-4 h-4 mr-2"/> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-end space-x-2 p-4 border-t border-border">
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