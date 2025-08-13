// app/dashboard/financeiro/fluxo-de-caixa/page.tsx
// Página para visualizar o fluxo de caixa e gerenciar transações.

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Transacao, type Client, type Project } from '@/types';
import { Plus, ArrowUp, ArrowDown, MoreHorizontal, Check, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

// Definindo o tipo para as categorias aqui para simplicidade
type Categoria = { id: string; nome: string; tipo: string; };

// --- HELPERS ---
const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

// --- COMPONENTES ---

function StatCard({ title, value, isPositive }: { title: string; value: string; isPositive?: boolean; }) {
    const colorClass = isPositive === true ? 'text-success' : isPositive === false ? 'text-destructive' : 'text-foreground';
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
            </CardContent>
        </Card>
    );
}

function TransactionModal({ isOpen, onClose, onSave, transactionToEdit }: { isOpen: boolean; onClose: () => void; onSave: () => void; transactionToEdit: Transacao | null; }) {
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
        if (transactionToEdit) {
            setDescricao(transactionToEdit.descricao); setTipo(transactionToEdit.tipo); setCategoria(transactionToEdit.categoria);
            setValor(transactionToEdit.valor); setData(transactionToEdit.data); setClienteId(transactionToEdit.cliente_id);
            setProjetoId(transactionToEdit.projeto_id); setStatus(transactionToEdit.status); setRecorrente(transactionToEdit.recorrente || false);
            setFrequencia(transactionToEdit.frequencia || 'Mensal');
        } else {
            setDescricao(''); setTipo('Receita'); setCategoria(''); setValor(''); setData(''); setClienteId(null);
            setProjetoId(null); setStatus('Pendente'); setRecorrente(false); setFrequencia('Mensal');
        }
    }, [transactionToEdit, isOpen]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const transactionData = { descricao, tipo, categoria, valor: Number(valor), data, cliente_id, projeto_id, status, recorrente, frequencia };
        if (transactionToEdit) {
            await supabase.from('transacoes').update(transactionData).eq('id', transactionToEdit.id);
        } else {
            await supabase.from('transacoes').insert({ ...transactionData, user_id: user.id });
        }
        onSave();
    };
    
    const currentCategories = tipo === 'Receita' ? incomeCategories : expenseCategories;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-popover text-popover-foreground p-8 rounded-xl shadow-lg w-full max-w-lg">
                <h2 className="text-xl font-bold mb-1">{transactionToEdit ? 'Editar Transação' : 'Adicionar Transação'}</h2>
                <p className="text-sm text-muted-foreground mb-6">Registe uma nova receita ou despesa.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-muted-foreground mb-1">Descrição*</label><Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} required /></div>
                        <div><label className="block text-sm font-medium text-muted-foreground mb-1">Tipo*</label><Select value={tipo} onValueChange={(v) => setTipo(v as any)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Receita">Receita</SelectItem><SelectItem value="Despesa">Despesa</SelectItem></SelectContent></Select></div>
                        <div><label className="block text-sm font-medium text-muted-foreground mb-1">Categoria*</label><Select value={categoria} onValueChange={setCategoria} required><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{currentCategories.map(cat => <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>)}</SelectContent></Select></div>
                        <div><label className="block text-sm font-medium text-muted-foreground mb-1">Valor (R$)*</label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} required /></div>
                        <div><label className="block text-sm font-medium text-muted-foreground mb-1">Data*</label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} required /></div>
                        <div><label className="block text-sm font-medium text-muted-foreground mb-1">Cliente</label><Select value={cliente_id || 'none'} onValueChange={(v) => setClienteId(v === 'none' ? null : v)}><SelectTrigger><SelectValue placeholder="Nenhum"/></SelectTrigger><SelectContent><SelectItem value="none">Nenhum</SelectItem>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select></div>
                        <div><label className="block text-sm font-medium text-muted-foreground mb-1">Projeto</label><Select value={projeto_id || 'none'} onValueChange={(v) => setProjetoId(v === 'none' ? null : v)}><SelectTrigger><SelectValue placeholder="Nenhum"/></SelectTrigger><SelectContent><SelectItem value="none">Nenhum</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.descricao}</SelectItem>)}</SelectContent></Select></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-muted-foreground mb-1">Status*</label><Select value={status} onValueChange={(v) => setStatus(v as any)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Pago">Pago</SelectItem><SelectItem value="Atrasado">Atrasado</SelectItem></SelectContent></Select></div>
                        
                        {tipo === 'Despesa' && (
                            <div className="md:col-span-2 space-y-3 border-t border-border pt-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-muted-foreground">Esta é uma despesa recorrente?</label>
                                    <button type="button" onClick={() => setRecorrente(!recorrente)} className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${recorrente ? 'bg-primary' : 'bg-muted'}`}><span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${recorrente ? 'translate-x-6' : ''}`}>{recorrente && <Check className="w-3 h-3 text-primary" />}</span></button>
                                </div>
                                {recorrente && (
                                    <div><label className="block text-sm font-medium text-muted-foreground mb-1">Frequência*</label><Select value={frequencia} onValueChange={setFrequencia} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Mensal">Mensal</SelectItem><SelectItem value="Bimestral">Bimestral</SelectItem><SelectItem value="Trimestral">Trimestral</SelectItem><SelectItem value="Semestral">Semestral</SelectItem><SelectItem value="Anual">Anual</SelectItem></SelectContent></Select></div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-4 pt-4"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit">{transactionToEdit ? 'Salvar Alterações' : 'Adicionar Transação'}</Button></div>
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
    const [transactionToEdit, setTransactionToEdit] = useState<Transacao | null>(null);
    const supabase = createSupabaseBrowserClient();
    const [activeTab, setActiveTab] = useState<'Todas' | 'Entradas' | 'Saídas'>('Todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('transacoes').select('*, projetos(descricao), clientes(nome)').order('data', { ascending: false });
        if (data) setTransactions(data as Transacao[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tabFilter = activeTab === 'Todas' || (activeTab === 'Entradas' && t.tipo === 'Receita') || (activeTab === 'Saídas' && t.tipo === 'Despesa');
            const searchFilter = t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
            const monthFilter = !selectedMonth || t.data.startsWith(selectedMonth);
            return tabFilter && searchFilter && monthFilter;
        });
    }, [transactions, activeTab, searchTerm, selectedMonth]);

    const handleSaveTransaction = () => { fetchTransactions(); setIsModalOpen(false); setTransactionToEdit(null); };
    const handleEditTransaction = (transaction: Transacao) => { setTransactionToEdit(transaction); setIsModalOpen(true); };
    const handleDeleteTransaction = async (id: string) => { if (window.confirm("Tem certeza?")) { await supabase.from('transacoes').delete().eq('id', id); fetchTransactions(); } };
    const handleStatusChange = async (id: string, newStatus: 'Pago' | 'Pendente') => { setTransactions(transactions.map(t => t.id === id ? { ...t, status: newStatus } : t)); await supabase.from('transacoes').update({ status: newStatus }).eq('id', id); };

    const receitaRecebida = filteredTransactions.filter(t => t.tipo === 'Receita' && t.status === 'Pago').reduce((sum, t) => sum + t.valor, 0);
    const despesaPaga = filteredTransactions.filter(t => t.tipo === 'Despesa' && t.status === 'Pago').reduce((sum, t) => sum + t.valor, 0);
    const saldoAtual = receitaRecebida - despesaPaga;
    const aReceber = filteredTransactions.filter(t => t.tipo === 'Receita' && t.status === 'Pendente').reduce((sum, t) => sum + t.valor, 0);
    const aPagar = filteredTransactions.filter(t => t.tipo === 'Despesa' && t.status === 'Pendente').reduce((sum, t) => sum + t.valor, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-2xl font-bold">Fluxo de Caixa</h1><p className="text-sm text-muted-foreground">Controle suas receitas, despesas e fluxo de caixa.</p></div>
                <Button onClick={() => { setTransactionToEdit(null); setIsModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Nova Transação</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Receita Recebida" value={`R$ ${formatBRL(receitaRecebida)}`} isPositive={true} />
                <StatCard title="Despesa Paga" value={`R$ ${formatBRL(despesaPaga)}`} isPositive={false} />
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-primary-foreground/80">Saldo Atual</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{`R$ ${formatBRL(saldoAtual)}`}</p></CardContent>
                </Card>
                <StatCard title="A Receber" value={`R$ ${formatBRL(aReceber)}`} />
                <StatCard title="A Pagar" value={`R$ ${formatBRL(aPagar)}`} />
            </div>

            <Card>
                <CardHeader className="flex  flex-row  gap-4 justify-between">
                    <ToggleGroup type="single" value={activeTab} onValueChange={(value) => {if(value) setActiveTab(value as any)}}>
                        <ToggleGroupItem value="Todas">Todas</ToggleGroupItem>
                        <ToggleGroupItem value="Entradas">Entradas</ToggleGroupItem>
                        <ToggleGroupItem value="Saídas">Saídas</ToggleGroupItem>
                    </ToggleGroup>
                    <div className="flex items-center gap-4">
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-48" /></div>
                        <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-48" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-2/5">Descrição</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">A carregar transações...</TableCell></TableRow>
                            ) : (
                                filteredTransactions.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{t.descricao}</div>
                                            <div className="text-xs text-muted-foreground">{t.projetos?.descricao || 'Geral'}</div>
                                        </TableCell>
                                        <TableCell>{t.categoria}</TableCell>
                                        <TableCell>{new Date(t.data).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={t.status === 'Pago'}
                                                onCheckedChange={(checked) => handleStatusChange(t.id, checked ? 'Pago' : 'Pendente')}
                                                aria-label="Status do pagamento"
                                            />
                                        </TableCell>
                                        <TableCell className={`text-right font-semibold ${t.tipo === 'Receita' ? 'text-success' : 'text-destructive'}`}>{t.tipo === 'Receita' ? '+' : '-'} R$ {formatBRL(t.valor)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="w-8 h-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleEditTransaction(t)}><Eye className="w-4 h-4 mr-2"/> Ver / Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteTransaction(t.id)} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2"/> Excluir</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <TransactionModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setTransactionToEdit(null); }} onSave={handleSaveTransaction} transactionToEdit={transactionToEdit} />
        </div>
    );
}