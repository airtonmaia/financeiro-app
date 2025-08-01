// app/dashboard/clients/[id]/page.tsx
// Página para visualizar todos os detalhes de um cliente específico.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Mail, Phone, FileText, Building, Edit, ArrowUpRight, ArrowDownRight, Briefcase, DollarSign } from 'lucide-react';

// --- TIPOS (Podem ser movidos para um ficheiro de tipos no futuro) ---
type Client = {
  id: string;
  nome: string;
  empresa: string | null;
  email_contato: string;
  telefone: string;
  cpf_cnpj: string | null;
  origem: string;
};

// --- COMPONENTES DA PÁGINA ---

// Card de Informação Principal
function ClientInfoCard({ client }: { client: Client | null }) {
    if (!client) return null;
    return (
        <div className="bg-white p-6 rounded-xl shadow-card">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-dark-text">{client.nome}</h2>
                    <p className="text-gray-text">{client.empresa || 'Pessoa Física'}</p>
                </div>
                <Link href={`/dashboard/clients/${client.id}/edit`}>
                    <button className="bg-white hover:bg-gray-50 text-dark-text font-semibold py-2 px-4 rounded-lg border border-light-tertiary flex items-center gap-2">
                        <Edit className="w-4 h-4" /> Editar
                    </button>
                </Link>
            </div>
            <div className="border-t border-light-tertiary mt-4 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-text">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{client.email_contato}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-text">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{client.telefone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-text">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>{client.cpf_cnpj || 'CPF/CNPJ não informado'}</span>
                </div>
            </div>
        </div>
    );
}

// Card de Estatísticas do Cliente
function ClientStatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-card">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                    <Icon className="w-6 h-6 text-gray-text" />
                </div>
                <div>
                    <p className="text-gray-text text-sm">{title}</p>
                    <p className="text-xl font-bold text-dark-text">{value}</p>
                </div>
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function ClientDetailPage() {
    const params = useParams();
    const supabase = createSupabaseBrowserClient();
    
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchClientData = useCallback(async () => {
        const clientId = params.id as string;
        if (!clientId) return;

        setLoading(true);
        setError(null);

        // Busca dados do cliente
        const { data: clientData, error: clientError } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', clientId)
            .single();

        if (clientError) {
            setError("Cliente não encontrado ou erro ao buscar dados.");
            console.error(clientError);
        } else {
            setClient(clientData);
        }

        // TODO: Buscar dados de projetos, transações e notas fiscais aqui

        setLoading(false);
    }, [params.id, supabase]);

    useEffect(() => {
        fetchClientData();
    }, [fetchClientData]);

    if (loading) {
        return <div className="text-center p-10">Carregando dados do cliente...</div>;
    }
    if (error) {
        return <div className="p-5 text-center text-danger-text bg-red-100 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <ClientInfoCard client={client} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ClientStatCard title="Projetos Ativos" value={0} icon={Briefcase} />
                <ClientStatCard title="Total Faturado" value={"R$ 0,00"} icon={DollarSign} />
                <ClientStatCard title="Saldo Devedor" value={"R$ 0,00"} icon={DollarSign} />
            </div>

            {/* Abas de Navegação */}
            <div className="border-b border-light-tertiary">
                <nav className="flex space-x-6">
                    <button onClick={() => setActiveTab('overview')} className={`py-3 px-1 font-semibold ${activeTab === 'overview' ? 'border-b-2 border-brand-green text-dark-text' : 'text-gray-text'}`}>Visão Geral</button>
                    <button onClick={() => setActiveTab('projects')} className={`py-3 px-1 font-semibold ${activeTab === 'projects' ? 'border-b-2 border-brand-green text-dark-text' : 'text-gray-text'}`}>Projetos</button>
                    <button onClick={() => setActiveTab('transactions')} className={`py-3 px-1 font-semibold ${activeTab === 'transactions' ? 'border-b-2 border-brand-green text-dark-text' : 'text-gray-text'}`}>Transações</button>
                    <button onClick={() => setActiveTab('invoices')} className={`py-3 px-1 font-semibold ${activeTab === 'invoices' ? 'border-b-2 border-brand-green text-dark-text' : 'text-gray-text'}`}>Notas Fiscais</button>
                </nav>
            </div>

            {/* Conteúdo das Abas */}
            <div className="bg-white p-6 rounded-xl shadow-card min-h-[200px]">
                {activeTab === 'overview' && <div>Conteúdo da Visão Geral aqui...</div>}
                {activeTab === 'projects' && <div>Lista de Projetos aqui...</div>}
                {activeTab === 'transactions' && <div>Lista de Transações aqui...</div>}
                {activeTab === 'invoices' && <div>Lista de Notas Fiscais aqui...</div>}
            </div>
        </div>
    );
}
