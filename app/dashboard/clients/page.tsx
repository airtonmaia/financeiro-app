// app/dashboard/clients/page.tsx
// Página para listar, gerir e visualizar os clientes a partir do banco de dados.

'use client'; 

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Users, Briefcase, DollarSign, Mail, Phone, Edit, Trash2, Plus, FileText, Building } from 'lucide-react';

// --- TIPOS ---
export type Client = {
  id: string;
  nome: string;
  empresa: string | null;
  email_contato: string;
  telefone: string;
  cpf_cnpj: string | null;
  origem: string;
};

// --- COMPONENTES ---

function ClientStatCard({ title, value, description, icon: Icon }: { title: string; value: string; description: string; icon: React.ElementType; }) {
    return (
        <div className="bg-light-secondary p-5 rounded-xl shadow-card">
            <div className="flex justify-between items-start">
                <p className="text-gray-text font-semibold">{title}</p>
                <Icon className="w-5 h-5 text-gray-text" />
            </div>
            <p className="text-3xl font-bold text-dark-text mt-2">{value}</p>
            <p className="text-xs text-gray-text mt-1">{description}</p>
        </div>
    );
}

// Componente de item da lista, agora formatado com colunas separadas
function ClientListItem({ client, onDelete }: { client: Client, onDelete: (id: string) => void }) {
    return (
        <div className="border-b border-light-tertiary last:border-b-0">
            {/* Layout para Desktop (visível em telas médias e maiores) */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 items-center py-4 px-5 hover:bg-gray-50 transition-colors text-sm">
                <p className="col-span-3 font-bold text-dark-text truncate">{client.nome}</p>
                <p className="col-span-2 text-gray-text truncate">{client.empresa || 'N/A'}</p>
                <p className="col-span-2 text-gray-text truncate">{client.email_contato}</p>
                <p className="col-span-2 text-gray-text truncate">{client.telefone}</p>
                <p className="col-span-2 text-gray-text truncate">{client.cpf_cnpj || 'Não informado'}</p>
                <div className="col-span-1 flex items-center justify-end gap-2">
                    <Link href={`/dashboard/clients/${client.id}/edit`}>
                        <button className="p-2 text-gray-text hover:text-brand-blue hover:bg-blue-100 rounded-full transition-colors" title="Editar Cliente">
                            <Edit className="w-4 h-4" />
                        </button>
                    </Link>
                    <button 
                        onClick={() => onDelete(client.id)}
                        className="p-2 text-gray-text hover:text-danger-text hover:bg-red-100 rounded-full transition-colors"
                        title="Excluir Cliente"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Layout para Mobile (visível apenas em telas pequenas) */}
            <div className="md:hidden p-4 space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-dark-text">{client.nome}</p>
                        {client.empresa && <p className="text-sm text-gray-text">{client.empresa}</p>}
                    </div>
                    <div className="flex items-center gap-2 -mt-1">
                        <Link href={`/dashboard/clients/${client.id}/edit`}>
                            <button className="p-2 text-gray-text hover:text-brand-blue hover:bg-blue-100 rounded-full transition-colors">
                                <Edit className="w-4 h-4" />
                            </button>
                        </Link>
                        <button onClick={() => onDelete(client.id)} className="p-2 text-gray-text hover:text-danger-text hover:bg-red-100 rounded-full transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="text-sm text-gray-text space-y-1 pt-1">
                    <p><span className="font-semibold text-dark-text">Email:</span> {client.email_contato}</p>
                    <p><span className="font-semibold text-dark-text">Telefone:</span> {client.telefone}</p>
                    <p><span className="font-semibold text-dark-text">CPF/CNPJ:</span> {client.cpf_cnpj || 'Não informado'}</p>
                </div>
            </div>
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
            setClients(clients.filter(client => client.id !== id));
        }
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ClientStatCard title="Total de Clientes" value={String(clients.length)} description="+2 novos este mês" icon={Users} />
        <ClientStatCard title="Projetos Ativos" value="6" description="Distribuídos entre 3 clientes" icon={Briefcase} />
        <ClientStatCard title="Valor Total" value="R$ 27.000" description="Em projetos ativos" icon={DollarSign} />
      </div>

      {/* Lista de Clientes */}
      <div className="bg-light-secondary rounded-xl shadow-card overflow-x-auto">
        <div className="p-5 border-b border-light-tertiary flex justify-between items-center">
            <h3 className="font-bold text-dark-text">Lista de Clientes</h3>
            <Link href="/dashboard/clients/new">
                <button className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 whitespace-nowrap">
                    <Plus className="w-4 h-4" /> Novo Cliente
                </button>
            </Link>
        </div>
        
        {/* Cabeçalho da Tabela (visível em desktop) */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 border-b border-light-tertiary bg-gray-50 text-xs font-bold text-gray-text uppercase tracking-wider">
            <h4 className="col-span-3">Nome</h4>
            <h4 className="col-span-2">Empresa</h4>
            <h4 className="col-span-2">Email</h4>
            <h4 className="col-span-2">Telefone</h4>
            <h4 className="col-span-2">CPF/CNPJ</h4>
            <h4 className="col-span-1 text-right">Ações</h4>
        </div>

        <div>
            {loading && <p className="p-5 text-center text-gray-text">Carregando clientes...</p>}
            {error && <p className="p-5 text-center text-danger-text">{error}</p>}
            {!loading && !error && clients.length === 0 && (
                <p className="p-5 text-center text-gray-text">Nenhum cliente cadastrado ainda.</p>
            )}
            {!loading && !error && clients.length > 0 && (
                clients.map((client) => (
                    <ClientListItem key={client.id} client={client} onDelete={handleDeleteClient} />
                ))
            )}
        </div>
      </div>
    </div>
  );
}
