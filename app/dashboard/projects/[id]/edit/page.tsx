// app/dashboard/projects/[id]/edit/page.tsx
// Página para editar um projeto existente.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Client, type Project } from '@/types';
import { Editor } from '@/components/editor';

// Definindo o tipo para as categorias aqui para simplicidade
type Categoria = { id: string; nome: string; tipo: string; };

export default function EditProjectPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createSupabaseBrowserClient();
    const projectId = params.id as string;

    // --- ESTADOS DO FORMULÁRIO ---
    const [clients, setClients] = useState<Client[]>([]);
    const [projectCategories, setProjectCategories] = useState<Categoria[]>([]);
    
    // Dados do Projeto
    const [nome_projeto, setNomeProjeto] = useState('');
    const [cliente_id, setClienteId] = useState('');
    const [tipo_projeto, setTipoProjeto] = useState('');
    const [data_entrega, setDataEntrega] = useState('');
    const [status_entrega, setStatusEntrega] = useState('A fazer');
    const [descricao, setDescricao] = useState(''); // Corrigido para string

    // Dados Financeiros
    const [valor_total, setValorTotal] = useState<number | ''>('');
    const [forma_pagamento, setFormaPagamento] = useState('À Vista');
    const [entrada_recebida, setEntradaRecebida] = useState(false);
    const [assinatura, setAssinatura] = useState(false);

    // Dados de Parcelas (condicionais)
    const [parcela1_valor, setParcela1Valor] = useState<number | ''>('');
    const [parcela1_data, setParcela1Data] = useState('');
    const [parcela2_data, setParcela2Data] = useState('');
    const [numero_parcelas, setNumeroParcelas] = useState<number | ''>(2);
    const [data_primeira_parcela, setDataPrimeiraParcela] = useState('');
    
    // UI Feedback
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- LÓGICA ---

    const fetchProjectData = useCallback(async () => {
        const { data: clientsData } = await supabase.from('clientes').select('id, nome');
        if (clientsData) setClients(clientsData as Client[]);

        const { data: categoriesData } = await supabase.from('categorias').select('*').eq('tipo', 'projeto');
        if (categoriesData) setProjectCategories(categoriesData);

        const { data: projectData, error: projectError } = await supabase
            .from('projetos')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projectError) {
            setError('Não foi possível carregar os dados do projeto.');
            setLoading(false);
            return;
        }

        if (projectData) {
            setNomeProjeto(projectData.nome_projeto || '');
            setClienteId(projectData.cliente_id || '');
            setTipoProjeto(projectData.tipo_projeto || '');
            setDataEntrega(projectData.data_entrega || '');
            setStatusEntrega(projectData.status_entrega || 'A fazer');
            setDescricao(projectData.observacao || ''); // Corrigido
            setValorTotal(projectData.valor_total || '');
            setAssinatura(projectData.assinatura || false);
            
            const paymentDetails = projectData.detalhes_pagamento;
            if (paymentDetails) {
                setFormaPagamento(paymentDetails.tipo || 'À Vista');
            }
        }
        setLoading(false);
    }, [projectId, supabase]);

    useEffect(() => {
        fetchProjectData();
    }, [fetchProjectData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const parcelas = [];
        if (forma_pagamento === 'À Vista' && valor_total) {
            parcelas.push({ valor: valor_total, data: parcela1_data, pago: entrada_recebida });
        } // ... (restante da lógica de parcelas)

        const detalhes_pagamento = {
            tipo: forma_pagamento,
            parcelas: parcelas,
        };
        
        const status_pagamento = entrada_recebida ? 'Parcialmente pago' : 'Pendente';

        const { error: updateError } = await supabase
            .from('projetos')
            .update({
                nome_projeto,
                cliente_id,
                tipo_projeto,
                data_entrega,
                status_entrega,
                observacao: descricao, // Corrigido
                valor_total,
                assinatura,
                detalhes_pagamento,
                status_pagamento,
            })
            .eq('id', projectId);

        if (updateError) {
            setError(`Erro ao atualizar o projeto: ${updateError.message}`);
            setLoading(false);
        } else {
            router.push('/dashboard/projects');
            router.refresh();
        }
    };

    if (loading) {
        return <div className="p-10 text-center">A carregar dados do projeto...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-card">
                <h1 className="text-2xl font-bold text-dark-text mb-8">Editar Projeto</h1>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold border-b border-light-tertiary pb-2">Detalhes do Projeto</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="nome_projeto" className="block text-sm font-medium text-gray-text mb-1">Nome do Projeto*</label>
                                <input type="text" id="nome_projeto" value={nome_projeto} onChange={(e) => setNomeProjeto(e.target.value)} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
                            </div>
                            <div>
                                <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-text mb-1">Cliente*</label>
                                <select id="cliente_id" value={cliente_id} onChange={(e) => setClienteId(e.target.value)} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green">
                                    <option value="" disabled>Selecione um cliente</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="tipo_projeto" className="block text-sm font-medium text-gray-text mb-1">Tipo de Projeto*</label>
                                <select id="tipo_projeto" value={tipo_projeto} onChange={(e) => setTipoProjeto(e.target.value)} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg">
                                    <option value="" disabled>Selecione um tipo</option>
                                    {projectCategories.map(cat => (
                                        <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="data_entrega" className="block text-sm font-medium text-gray-text mb-1">Previsão de Entrega*</label>
                                <input type="date" id="data_entrega" value={data_entrega} onChange={(e) => setDataEntrega(e.target.value)} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="status_entrega" className="block text-sm font-medium text-gray-text mb-1">Status*</label>
                                <select id="status_entrega" value={status_entrega} onChange={(e) => setStatusEntrega(e.target.value)} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg">
                                    <option>A fazer</option>
                                    <option>Em andamento</option>
                                    <option>Finalizado</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="descricao" className="block text-sm font-medium text-gray-text mb-1">Descrição do Projeto</label>
                            <Editor
                                value={descricao}
                                onChange={setDescricao}
                                placeholder="Descreva os detalhes do projeto..."
                            />
                        </div>
                    </div>

                    {/* Seção de Pagamento e Opções Finais aqui... */}

                    {error && <p className="text-sm text-danger-text mt-4">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                         <button type="button" onClick={() => router.back()} className="bg-white hover:bg-light-tertiary text-dark-text font-semibold py-2 px-6 rounded-lg border border-light-tertiary">
                            Cancelar
                         </button>
                         <button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-600/90 text-white font-semibold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
}