// app/dashboard/projects/new/page.tsx
// Página com formulário para cadastrar um novo projeto com lógica de pagamento.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Client } from '@/types'; 

export default function NewProjectPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    // --- ESTADOS DO FORMULÁRIO ---
    const [clients, setClients] = useState<Client[]>([]);
    
    // Dados do Projeto
    const [nome_projeto, setNomeProjeto] = useState('');
    const [cliente_id, setClienteId] = useState('');
    const [tipo_projeto, setTipoProjeto] = useState('');
    const [data_entrega, setDataEntrega] = useState('');
    const [status_entrega, setStatusEntrega] = useState('A fazer');
    const [descricao, setDescricao] = useState('');

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- LÓGICA ---

    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase.from('clientes').select('id, nome');
            if (data) {
                setClients(data as Client[]);
            }
        };
        fetchClients();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError("Você precisa estar logado para criar um projeto.");
            setLoading(false);
            return;
        }

        // Lógica para gerar o array de parcelas
        const parcelas = [];
        if (forma_pagamento === 'À Vista' && valor_total) {
            parcelas.push({ valor: valor_total, data: parcela1_data, pago: entrada_recebida });
        } else if (forma_pagamento === '50/50' && parcela1_valor) {
            parcelas.push({ valor: parcela1_valor, data: parcela1_data, pago: entrada_recebida });
            parcelas.push({ valor: (valor_total || 0) - parcela1_valor, data: parcela2_data, pago: false });
        } else if (forma_pagamento === 'Parcelado' && numero_parcelas && valor_total) {
            const valorParcela = valor_total / numero_parcelas;
            for (let i = 0; i < numero_parcelas; i++) {
                const dataParcela = new Date(data_primeira_parcela);
                dataParcela.setMonth(dataParcela.getMonth() + i);
                parcelas.push({ valor: valorParcela, data: dataParcela.toISOString().split('T')[0], pago: i === 0 ? entrada_recebida : false });
            }
        }

        const detalhes_pagamento = {
            tipo: forma_pagamento,
            parcelas: parcelas,
        };
        
        const status_pagamento = entrada_recebida ? (parcelas.every(p => p.pago) ? 'Totalmente pago' : 'Parcialmente pago') : 'Pendente';

        const { error: insertError } = await supabase
            .from('projetos')
            .insert({
                user_id: user.id,
                cliente_id,
                descricao: nome_projeto,
                observacao: descricao,
                data_entrega,
                status_entrega,
                valor_total,
                assinatura,
                tipo_projeto,
                detalhes_pagamento,
                status_pagamento,
            });

        if (insertError) {
            setError(`Erro ao salvar o projeto: ${insertError.message}`);
            setLoading(false);
        } else {
            router.push('/dashboard/projects');
            router.refresh();
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-light-secondary p-8 rounded-xl shadow-card">
                <h1 className="text-2xl font-bold text-dark-text mb-8">Cadastrar Novo Projeto</h1>
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Seção de Detalhes do Projeto */}
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
                                    <option>Criação de Site</option>
                                    <option>Identidade Visual</option>
                                    <option>Suporte Wordpress</option>
                                    <option>Outro</option>
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
                            <textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
                        </div>
                    </div>

                    {/* Seção de Pagamento */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold border-b border-light-tertiary pb-2">Detalhes Financeiros</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                               <label htmlFor="valor_total" className="block text-sm font-medium text-gray-text mb-1">Valor Total do Projeto (R$)*</label>
                               <input type="number" id="valor_total" value={valor_total} onChange={(e) => setValorTotal(Number(e.target.value))} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg" />
                            </div>
                            <div>
                                <label htmlFor="forma_pagamento" className="block text-sm font-medium text-gray-text mb-1">Forma de Pagamento</label>
                                <select id="forma_pagamento" value={forma_pagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg">
                                    <option>À Vista</option>
                                    <option>50/50</option>
                                    <option>Parcelado</option>
                                </select>
                            </div>
                        </div>

                        {/* Campos Condicionais de Pagamento */}
                        {forma_pagamento === 'À Vista' && (
                            <div>
                                <label htmlFor="parcela1_data" className="block text-sm font-medium text-gray-text mb-1">Data do Pagamento*</label>
                                <input type="date" id="parcela1_data" value={parcela1_data} onChange={(e) => setParcela1Data(e.target.value)} required className="w-full md:w-1/2 p-3 bg-gray-50 border rounded-lg" />
                            </div>
                        )}
                        {forma_pagamento === '50/50' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="parcela1_valor" className="block text-sm font-medium text-gray-text mb-1">Valor da 1ª Parcela (50%)*</label>
                                    <input type="number" id="parcela1_valor" value={parcela1_valor} onChange={(e) => setParcela1Valor(Number(e.target.value))} required className="w-full p-3 bg-gray-50 border rounded-lg" />
                                </div>
                                <div>
                                    <label htmlFor="parcela1_data" className="block text-sm font-medium text-gray-text mb-1">Data da 1ª Parcela*</label>
                                    <input type="date" id="parcela1_data" value={parcela1_data} onChange={(e) => setParcela1Data(e.target.value)} required className="w-full p-3 bg-gray-50 border rounded-lg" />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="parcela2_data" className="block text-sm font-medium text-gray-text mb-1">Data Prevista da 2ª Parcela*</label>
                                    <input type="date" id="parcela2_data" value={parcela2_data} onChange={(e) => setParcela2Data(e.target.value)} required className="w-full p-3 bg-gray-50 border rounded-lg" />
                                </div>
                            </div>
                        )}
                        {forma_pagamento === 'Parcelado' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="numero_parcelas" className="block text-sm font-medium text-gray-text mb-1">Número de Parcelas*</label>
                                    <input type="number" id="numero_parcelas" value={numero_parcelas} onChange={(e) => setNumeroParcelas(Number(e.target.value))} required min="2" className="w-full p-3 bg-gray-50 border rounded-lg" />
                                </div>
                                <div>
                                    <label htmlFor="data_primeira_parcela" className="block text-sm font-medium text-gray-text mb-1">Data da 1ª Parcela*</label>
                                    <input type="date" id="data_primeira_parcela" value={data_primeira_parcela} onChange={(e) => setDataPrimeiraParcela(e.target.value)} required className="w-full p-3 bg-gray-50 border rounded-lg" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Opções Finais */}
                    <div className="space-y-4 pt-4 border-t border-light-tertiary">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="entrada_recebida" checked={entrada_recebida} onChange={(e) => setEntradaRecebida(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                            <label htmlFor="entrada_recebida" className="text-sm font-medium text-gray-text">Você recebeu a entrada/primeira parcela?</label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="assinatura" checked={assinatura} onChange={(e) => setAssinatura(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                            <label htmlFor="assinatura" className="text-sm font-medium text-gray-text">Este projeto é uma assinatura recorrente?</label>
                        </div>
                    </div>


                    {error && <p className="text-sm text-danger-text mt-4">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                         <button type="button" onClick={() => router.back()} className="bg-light-secondary hover:bg-light-tertiary text-dark-text font-semibold py-2 px-6 rounded-lg border border-light-tertiary">
                            Cancelar
                         </button>
                         <button type="submit" disabled={loading} className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {loading ? 'Salvando...' : 'Salvar Projeto'}
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
