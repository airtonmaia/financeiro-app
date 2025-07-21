// app/dashboard/financeiro/fluxo-de-caixa/page.tsx
// Página para visualizar o fluxo de caixa e gerenciar transações.

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Transacao, type Client, type Project } from '@/types';
import { Plus, ArrowUp, ArrowDown, MoreHorizontal, Check, Search } from 'lucide-react';

// --- COMPONENTES ---

function StatCard({ title, value, isPositive }: { title: string; value: string; isPositive?: boolean; }) {
    const colorClass = isPositive === true ? 'text-success-text' : isPositive === false ? 'text-danger-text' : 'text-dark-text dark:text-light-text';
    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-5 rounded-xl shadow-card">
            <p className="text-gray-text text-sm">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
        </div>
    );
}

function TransactionListItem({ t, onStatusChange }: { t: Transacao; onStatusChange: (id: string, newStatus: 'Pago' | 'Pendente') => void; }) {
    const isIncome = t.tipo === 'Receita';
    const isPaid = t.status === 'Pago';

    return (
        <div className="border-b border-light-tertiary dark:border-dark-tertiary last:border-b-0">
            {/* Layout para Desktop */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 items-center py-4 px-5 hover:bg-gray-50 dark:hover:bg-dark-tertiary/50 transition-colors text-sm">
                <div className="col-span-4 flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                        {isIncome ? <ArrowUp className="w-4 h-4 text-success-text" /> : <ArrowDown className="w-4 h-4 text-danger-text" />}
                    </div>
                    <div>
                        <p className="font-semibold text-dark-text dark:text-light-text">{t.descricao}</p>
                        <p className="text-xs text-gray-text dark:text-gray-400">
                            {t.projetos?.descricao || 'Geral'}
                        </p>
                    </div>
                </div>
                <div className="col-span-2 text-gray-text dark:text-gray-400">{t.categoria}</div>
                <div className="col-span-2 text-gray-text dark:text-gray-400">{new Date(t.data).toLocaleDateString()}</div>
                <div className="col-span-2">
                    <button
                      onClick={() => onStatusChange(t.id, isPaid ? 'Pendente' : 'Pago')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${isPaid ? 'bg-brand-green' : 'bg-gray-300 dark:bg-dark-tertiary'}`}
                      title={`Marcar como ${isPaid ? 'Pendente' : 'Pago'}`}
                    >
                      <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isPaid ? 'translate-x-6' : ''}`}>
                        {isPaid && <Check className="w-3 h-3 text-brand-green translate-x-0.5 translate-y-0.5" />}
                      </span>
                    </button>
                </div>
                <div className={`col-span-1 font-semibold ${isIncome ? 'text-success-text' : 'text-danger-text'}`}>
                    {isIncome ? '+' : '-'} R$ {t.valor.toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-end">
                    <button className="p-2 text-gray-text hover:bg-gray-200 dark:hover:bg-dark-tertiary rounded-full">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function TransactionModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (data: Omit<Transacao, 'id' | 'projetos' | 'clientes'>) => void; }) { /* ...código anterior... */ }

// --- PÁGINA PRINCIPAL ---
export default function CashFlowPage() {
    const [transactions, setTransactions] = useState<Transacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const supabase = createSupabaseBrowserClient();

    // Estados para os filtros
    const [activeTab, setActiveTab] = useState<'Todas' | 'Entradas' | 'Saídas'>('Todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('transacoes').select('*, projetos(descricao), clientes(nome)').order('data', { ascending: false });
        if (data) setTransactions(data as Transacao[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Lógica de filtragem
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tabFilter = activeTab === 'Todas' || (activeTab === 'Entradas' && t.tipo === 'Receita') || (activeTab === 'Saídas' && t.tipo === 'Despesa');
            const searchFilter = t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
            const monthFilter = !selectedMonth || t.data.startsWith(selectedMonth);
            return tabFilter && searchFilter && monthFilter;
        });
    }, [transactions, activeTab, searchTerm, selectedMonth]);
    
    const handleSaveTransaction = async (transactionData: Omit<Transacao, 'id' | 'projetos' | 'clientes'>) => { /* ...código anterior... */ };
    const handleStatusChange = async (id: string, newStatus: 'Pago' | 'Pendente') => { /* ...código anterior... */ };

    // Cálculos para os cards (agora baseados nos dados filtrados)
    const totalReceita = filteredTransactions.filter(t => t.tipo === 'Receita').reduce((sum, t) => sum + t.valor, 0);
    const totalDespesa = filteredTransactions.filter(t => t.tipo === 'Despesa').reduce((sum, t) => sum + t.valor, 0);
    const saldoAtual = totalReceita - totalDespesa;
    const aReceber = filteredTransactions.filter(t => t.tipo === 'Receita' && t.status === 'Pendente').reduce((sum, t) => sum + t.valor, 0);
    const aPagar = filteredTransactions.filter(t => t.tipo === 'Despesa' && t.status === 'Pendente').reduce((sum, t) => sum + t.valor, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-2xl font-bold">Fluxo de Caixa</h1><p className="text-sm text-gray-text">Controle suas receitas, despesas e fluxo de caixa.</p></div>
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Transação</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Receita (Filtro)" value={`R$ ${totalReceita.toFixed(2)}`} isPositive={true} />
                <StatCard title="Despesa (Filtro)" value={`R$ ${totalDespesa.toFixed(2)}`} isPositive={false} />
                <StatCard title="Saldo (Filtro)" value={`R$ ${saldoAtual.toFixed(2)}`} />
                <StatCard title="A Receber (Filtro)" value={`R$ ${aReceber.toFixed(2)}`} />
                <StatCard title="A Pagar (Filtro)" value={`R$ ${aPagar.toFixed(2)}`} />
            </div>

            <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-card">
                 <div className="p-5 flex flex-wrap gap-4 justify-between items-center border-b border-light-tertiary dark:border-dark-tertiary">
                    {/* Filtro de Abas */}
                    <div className="bg-gray-100 dark:bg-dark-tertiary p-1 rounded-lg flex items-center">
                        <button onClick={() => setActiveTab('Todas')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'Todas' ? 'bg-white dark:bg-dark-secondary shadow' : 'text-gray-text'}`}>Todas</button>
                        <button onClick={() => setActiveTab('Entradas')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'Entradas' ? 'bg-white dark:bg-dark-secondary shadow' : 'text-gray-text'}`}>Entradas</button>
                        <button onClick={() => setActiveTab('Saídas')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'Saídas' ? 'bg-white dark:bg-dark-secondary shadow' : 'text-gray-text'}`}>Saídas</button>
                    </div>
                    {/* Outros Filtros */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-100 dark:bg-dark-tertiary rounded-lg pl-9 pr-3 py-2 text-sm w-48" />
                        </div>
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-gray-100 dark:bg-dark-tertiary rounded-lg px-3 py-2 text-sm" />
                    </div>
                </div>
                {/* Cabeçalho da Tabela */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 border-b border-light-tertiary dark:border-dark-tertiary bg-gray-50 dark:bg-dark-tertiary/50 text-xs font-bold text-gray-text uppercase tracking-wider">
                    <h4 className="col-span-4">Descrição</h4>
                    <h4 className="col-span-2">Categoria</h4>
                    <h4 className="col-span-2">Data</h4>
                    <h4 className="col-span-2">Status</h4>
                    <h4 className="col-span-1">Valor</h4>
                    <h4 className="col-span-1 text-right">Ações</h4>
                </div>
                <div>
                    {loading ? (
                        <p className="p-5 text-center text-gray-text">A carregar transações...</p>
                    ) : (
                        filteredTransactions.map(t => <TransactionListItem key={t.id} t={t} onStatusChange={handleStatusChange} />)
                    )}
                </div>
            </div>

            <TransactionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTransaction}
            />
        </div>
    );
}

// O código dos componentes TransactionModal, TransactionListItem e StatCard
// foi omitido por brevidade, mas deve permanecer no seu ficheiro.
// A lógica dentro de fetchTransactions, handleSaveTransaction e handleStatusChange
// também foi omitida, mas deve permanecer.
