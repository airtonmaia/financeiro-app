// app/dashboard/financeiro/fluxo-de-caixa/page.tsx
// Página para visualizar o fluxo de caixa e gerenciar transações.

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Transacao, type Client, type Project } from '@/types';
import { Plus, ArrowUp, ArrowDown, MoreHorizontal, Check, Search } from 'lucide-react';

// Definindo o tipo para as categorias aqui para simplicidade
type Categoria = { id: string; nome: string; tipo: string; };

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

function TransactionModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (data: Omit<Transacao, 'id' | 'projetos' | 'clientes'>) => void; }) {
    const supabase = createSupabaseBrowserClient();
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState<'Receita' | 'Despesa'>('Receita');
    const [categoria, setCategoria] = useState('');
    const [valor, setValor] = useState<number | ''>('');
    const [data, setData] = useState('');
    const [cliente_id, setClienteId] = useState<string | null>(null);
    const [projeto_id, setProjetoId] = useState<string | null>(null);
    const [status, setStatus] = useState<'Pago' | 'Pendente' | 'Atrasado'>('Pendente');
    
    const [recorrente, setRecorrente] = useState(false);
    const [frequencia, setFrequencia] = useState('Mensal');

    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<Categoria[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<Categoria[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: clientsData } = await supabase.from('clientes').select('id, nome');
            if (clientsData) setClients(clientsData as Client[]);
            
            const { data: projectsData } = await supabase.from('projetos').select('id, descricao');
            if (projectsData) setProjects(projectsData as Project[]);

            const { data: categoriesData } = await supabase.from('categorias').select('*');
            if (categoriesData) {
                setIncomeCategories(categoriesData.filter(c => c.tipo === 'receita'));
                setExpenseCategories(categoriesData.filter(c => c.tipo === 'despesa'));
            }
        };
        if (isOpen) fetchData();
    }, [supabase, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ descricao, tipo, categoria, valor: Number(valor), data, cliente_id, projeto_id, status, recorrente, frequencia });
    };
    
    const currentCategories = tipo === 'Receita' ? incomeCategories : expenseCategories;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-xl shadow-lg w-full max-w-lg">
                <h2 className="text-xl font-bold mb-1">Adicionar Transação</h2>
                <p className="text-sm text-gray-text mb-6">Registe uma nova receita ou despesa.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><label htmlFor="descricao" className="block text-sm font-medium text-gray-text mb-1">Descrição*</label><input type="text" id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg" /></div>
                        <div><label htmlFor="tipo" className="block text-sm font-medium text-gray-text mb-1">Tipo*</label><select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg"><option>Receita</option><option>Despesa</option></select></div>
                        <div>
                            <label htmlFor="categoria" className="block text-sm font-medium text-gray-text mb-1">Categoria*</label>
                            <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg">
                                <option value="" disabled>Selecione</option>
                                {currentCategories.map(cat => (
                                    <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div><label htmlFor="valor" className="block text-sm font-medium text-gray-text mb-1">Valor (R$)*</label><input type="number" step="0.01" id="valor" value={valor} onChange={(e) => setValor(Number(e.target.value))} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg" /></div>
                        <div><label htmlFor="data" className="block text-sm font-medium text-gray-text mb-1">Data*</label><input type="date" id="data" value={data} onChange={(e) => setData(e.target.value)} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg" /></div>
                        <div><label htmlFor="cliente" className="block text-sm font-medium text-gray-text mb-1">Cliente</label><select id="cliente" value={cliente_id || ''} onChange={(e) => setClienteId(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg"><option value="">Nenhum</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                        <div><label htmlFor="projeto" className="block text-sm font-medium text-gray-text mb-1">Projeto</label><select id="projeto" value={projeto_id || ''} onChange={(e) => setProjetoId(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg"><option value="">Nenhum</option>{projects.map(p => <option key={p.id} value={p.id}>{p.descricao}</option>)}</select></div>
                        <div className="md:col-span-2"><label htmlFor="status" className="block text-sm font-medium text-gray-text mb-1">Status*</label><select id="status" value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg"><option>Pendente</option><option>Pago</option><option>Atrasado</option></select></div>
                        
                        <div className="md:col-span-2 space-y-2 border-t pt-4">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="recorrente" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                                <label htmlFor="recorrente" className="text-sm font-medium text-gray-text">Esta é uma despesa recorrente?</label>
                            </div>
                            {recorrente && (
                                <div>
                                    <label htmlFor="frequencia" className="block text-sm font-medium text-gray-text mb-1">Frequência*</label>
                                    <select id="frequencia" value={frequencia} onChange={(e) => setFrequencia(e.target.value)} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg">
                                        <option>Mensal</option>
                                        <option>Bimestral</option>
                                        <option>Trimestral</option>
                                        <option>Semestral</option>
                                        <option>Anual</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="bg-gray-200 dark:bg-dark-tertiary font-semibold py-2 px-6 rounded-lg">Cancelar</button><button type="submit" className="bg-brand-blue text-white font-semibold py-2 px-6 rounded-lg">Adicionar Transação</button></div>
                </form>
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function CashFlowPage() {
    const [transactions, setTransactions] = useState<Transacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const supabase = createSupabaseBrowserClient();
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

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tabFilter = activeTab === 'Todas' || (activeTab === 'Entradas' && t.tipo === 'Receita') || (activeTab === 'Saídas' && t.tipo === 'Despesa');
            const searchFilter = t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
            const monthFilter = !selectedMonth || t.data.startsWith(selectedMonth);
            return tabFilter && searchFilter && monthFilter;
        });
    }, [transactions, activeTab, searchTerm, selectedMonth]);

    const handleSaveTransaction = async (transactionData: Omit<Transacao, 'id' | 'projetos' | 'clientes'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from('transacoes').insert({ ...transactionData, user_id: user.id });
        if (!error) {
            fetchTransactions();
            setIsModalOpen(false);
        } else {
            alert("Erro ao salvar transação: " + error.message);
        }
    };

    const handleStatusChange = async (id: string, newStatus: 'Pago' | 'Pendente') => {
        setTransactions(transactions.map(t => t.id === id ? { ...t, status: newStatus } : t));
        await supabase.from('transacoes').update({ status: newStatus }).eq('id', id);
    };

    const receitaRecebida = filteredTransactions.filter(t => t.tipo === 'Receita' && t.status === 'Pago').reduce((sum, t) => sum + t.valor, 0);
    const despesaPaga = filteredTransactions.filter(t => t.tipo === 'Despesa' && t.status === 'Pago').reduce((sum, t) => sum + t.valor, 0);
    const saldoAtual = receitaRecebida - despesaPaga;
    const aReceber = filteredTransactions.filter(t => t.tipo === 'Receita' && t.status === 'Pendente').reduce((sum, t) => sum + t.valor, 0);
    const aPagar = filteredTransactions.filter(t => t.tipo === 'Despesa' && t.status === 'Pendente').reduce((sum, t) => sum + t.valor, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-2xl font-bold">Fluxo de Caixa</h1><p className="text-sm text-gray-text">Controle suas receitas, despesas e fluxo de caixa.</p></div>
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Transação</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Receita Recebida" value={`R$ ${receitaRecebida.toFixed(2)}`} isPositive={true} />
                <StatCard title="Despesa Paga" value={`R$ ${despesaPaga.toFixed(2)}`} isPositive={false} />
                <StatCard title="Saldo Atual" value={`R$ ${saldoAtual.toFixed(2)}`} />
                <StatCard title="A Receber" value={`R$ ${aReceber.toFixed(2)}`} />
                <StatCard title="A Pagar" value={`R$ ${aPagar.toFixed(2)}`} />
            </div>

            <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-card">
                 <div className="p-5 flex flex-wrap gap-4 justify-between items-center border-b border-light-tertiary dark:border-dark-tertiary">
                    <div className="bg-gray-100 dark:bg-dark-tertiary p-1 rounded-lg flex items-center">
                        <button onClick={() => setActiveTab('Todas')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'Todas' ? 'bg-white dark:bg-dark-secondary shadow' : 'text-gray-text'}`}>Todas</button>
                        <button onClick={() => setActiveTab('Entradas')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'Entradas' ? 'bg-white dark:bg-dark-secondary shadow' : 'text-gray-text'}`}>Entradas</button>
                        <button onClick={() => setActiveTab('Saídas')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'Saídas' ? 'bg-white dark:bg-dark-secondary shadow' : 'text-gray-text'}`}>Saídas</button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-100 dark:bg-dark-tertiary rounded-lg pl-9 pr-3 py-2 text-sm w-48" />
                        </div>
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-gray-100 dark:bg-dark-tertiary rounded-lg px-3 py-2 text-sm" />
                    </div>
                </div>
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
