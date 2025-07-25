// app/dashboard/financeiro/emprestimos/page.tsx
// Página para gerenciar empréstimos e financiamentos.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Plus, DollarSign, TrendingUp, TrendingDown, Calendar, Trash2 } from 'lucide-react';

// --- TIPOS ---
type Emprestimo = {
    id: string;
    titulo: string | null;
    tipo_emprestimo: string;
    instituicao: string | null;
    valor_original: number;
    taxa_juros: number | null;
    numero_parcelas: number;
    status: string;
};
type Categoria = { id: string; nome: string; };
type EmprestimoDetalhado = Emprestimo & {
    total_pago: number;
    parcelas_pagas: number;
    proxima_parcela_valor: number | null;
    proxima_parcela_vencimento: string | null;
};

// --- FUNÇÕES UTILITÁRIAS ---
const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- COMPONENTES ---

function StatCard({ title, value, colorClass }: { title: string; value: string; colorClass?: string; }) {
    return (
        <div className="bg-card dark:bg-dark-secondary p-5 rounded-xl shadow-card">
            <p className="text-gray-text text-sm">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${colorClass || 'text-dark-text dark:text-light-text'}`}>{value}</p>
        </div>
    );
}

function LoanListItem({ loan, onDelete }: { loan: EmprestimoDetalhado, onDelete: (id: string) => void }) {
    const saldoDevedor = loan.valor_original - loan.total_pago;
    
    return (
        <div className="bg-card dark:bg-dark-secondary p-6 rounded-xl shadow-card space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold">{loan.titulo || loan.tipo_emprestimo}</h3>
                    <p className="text-sm text-gray-text">{loan.instituicao}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className="bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded">{loan.status}</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(saldoDevedor)}</p>
                    <p className="text-sm text-gray-text">Saldo Devedor</p>
                </div>
            </div>
            
            <div>
                <div className="flex justify-between text-xs text-gray-text mb-1">
                    <span>Progresso do pagamento</span>
                    <span>{loan.parcelas_pagas}/{loan.numero_parcelas} parcelas</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-tertiary rounded-full h-2">
                    <div className="bg-brand-green h-2 rounded-full" style={{ width: `${(loan.total_pago / loan.valor_original) * 100}%` }}></div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-light-tertiary dark:border-dark-tertiary pt-4">
                <div>
                    <p className="text-xs text-gray-text">Valor Original</p>
                    <p className="font-semibold">{formatCurrency(loan.valor_original)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-text">Valor Pago</p>
                    <p className="font-semibold">{formatCurrency(loan.total_pago)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-text">Próxima Parcela</p>
                    <p className="font-semibold">{formatCurrency(loan.proxima_parcela_valor)}</p>
                    <p className="text-xs text-gray-text">
                        Venc: {loan.proxima_parcela_vencimento ? new Date(loan.proxima_parcela_vencimento).toLocaleDateString() : 'Quitado'}
                    </p>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <button className="text-sm bg-gray-100 dark:bg-dark-tertiary hover:bg-gray-200 font-semibold py-2 px-4 rounded-lg">Ver Detalhes</button>
                <button className="text-sm bg-brand-green text-white font-semibold py-2 px-4 rounded-lg">Pagar Parcela</button>
                <button onClick={() => onDelete(loan.id)} className="text-sm bg-red-100 text-danger-text hover:bg-red-200 font-semibold p-2 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function LoanModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: () => void; }) {
    const supabase = createSupabaseBrowserClient();
    
    const [titulo, setTitulo] = useState('');
    const [tipo_emprestimo, setTipoEmprestimo] = useState('');
    const [instituicao, setInstituicao] = useState('');
    const [numero_parcelas, setNumeroParcelas] = useState<number | ''>('');
    // AJUSTE: Renomeando campos para maior clareza
    const [proximo_vencimento, setProximoVencimento] = useState('');
    const [proxima_parcela_numero, setProximaParcelaNumero] = useState<number | ''>(1);
    
    const [valor_original_str, setValorOriginalStr] = useState('');
    const [valor_parcela_fixo_str, setValorParcelaFixoStr] = useState('');
    
    const [calculationMode, setCalculationMode] = useState<'auto' | 'fixed'>('auto');
    const [loading, setLoading] = useState(false);
    const [loanCategories, setLoanCategories] = useState<Categoria[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categorias').select('id, nome').eq('tipo', 'emprestimo');
            if (data) setLoanCategories(data);
        };
        if (isOpen) fetchCategories();
    }, [isOpen, supabase]);

    if (!isOpen) return null;
    
    const parseCurrency = (value: string): number => {
        if (!value) return 0;
        return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
    };

    const valor_original_num = parseCurrency(valor_original_str);
    const valor_parcela_fixo_num = parseCurrency(valor_parcela_fixo_str);
    const numero_parcelas_num = Number(numero_parcelas);

    const valor_parcela_calculado = (calculationMode === 'auto' && numero_parcelas_num && valor_original_num) ? (valor_original_num / numero_parcelas_num) : valor_parcela_fixo_num;
    const valor_total_calculado = (calculationMode === 'fixed' && numero_parcelas_num && valor_parcela_fixo_num) ? (valor_parcela_fixo_num * numero_parcelas_num) : valor_original_num;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: emprestimoData, error: emprestimoError } = await supabase
            .from('emprestimos')
            .insert({
                user_id: user.id,
                titulo: titulo || tipo_emprestimo,
                tipo_emprestimo,
                instituicao,
                valor_original: valor_total_calculado,
                taxa_juros: null,
                numero_parcelas: Number(numero_parcelas),
                // AJUSTE: Usando o próximo vencimento para calcular a data de contratação "retroativamente"
                data_contratacao: (() => {
                    const dataVenc = new Date(proximo_vencimento);
                    dataVenc.setMonth(dataVenc.getMonth() - Number(proxima_parcela_numero));
                    return dataVenc.toISOString().split('T')[0];
                })(),
            })
            .select()
            .single();

        if (emprestimoError) {
            alert('Erro ao criar empréstimo: ' + emprestimoError.message);
            setLoading(false);
            return;
        }

        // AJUSTE: Lógica de geração de parcelas corrigida
        const parcelasParaInserir = [];
        const numeroProximaParcela = Number(proxima_parcela_numero) || 1;
        for (let i = 1; i <= Number(numero_parcelas); i++) {
            const dataVencimento = new Date(proximo_vencimento);
            dataVencimento.setMonth(dataVencimento.getMonth() + (i - numeroProximaParcela));
            
            const isPaga = i < numeroProximaParcela;

            parcelasParaInserir.push({
                emprestimo_id: emprestimoData.id,
                user_id: user.id,
                numero_parcela: i,
                valor_parcela: valor_parcela_calculado,
                data_vencimento: dataVencimento.toISOString().split('T')[0],
                status: isPaga ? 'Paga' : 'Pendente',
                data_pagamento: isPaga ? new Date().toISOString().split('T')[0] : null,
            });
        }
        
        const { error: parcelasError } = await supabase.from('parcelas_emprestimo').insert(parcelasParaInserir);

        if (parcelasError) {
            alert('Erro ao gerar parcelas: ' + parcelasError.message);
        } else {
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card dark:bg-dark-secondary p-8 rounded-xl shadow-lg w-full max-w-lg">
                <h2 className="text-xl font-bold mb-1">Cadastrar Novo Empréstimo</h2>
                <p className="text-sm text-gray-text mb-6">Emprestimos, Cartões de crédito e financimantos</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tipo_emprestimo" className="block text-sm font-medium text-gray-text mb-1">Tipo de Empréstimo*</label>
                            <select id="tipo_emprestimo" value={tipo_emprestimo} onChange={(e) => setTipoEmprestimo(e.target.value)} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg">
                                <option value="" disabled>Selecione o tipo</option>
                                {loanCategories.map(cat => (
                                    <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="titulo" className="block text-sm font-medium text-gray-text mb-1">Título (opcional)</label>
                            <input type="text" id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Carro da Empresa" className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg" />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label htmlFor="calculationMode" className="block text-sm font-medium text-gray-text mb-1">Como calcular?*</label>
                            <select id="calculationMode" value={calculationMode} onChange={(e) => setCalculationMode(e.target.value as any)} className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg">
                                <option value="auto">Dividir Valor Total</option>
                                <option value="fixed">Informar Valor da Parcela</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="valor_total" className="block text-sm font-medium text-gray-text mb-1">Valor Total*</label>
                            <input type="text" id="valor_total" value={calculationMode === 'fixed' ? formatCurrency(valor_total_calculado) : valor_original_str} onChange={(e) => setValorOriginalStr(e.target.value)} required readOnly={calculationMode === 'fixed'} className={`w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg ${calculationMode === 'fixed' && 'bg-gray-200 dark:bg-dark-tertiary/50'}`} />
                        </div>
                        <div>
                            <label htmlFor="numero_parcelas" className="block text-sm font-medium text-gray-text mb-1">Número de Parcelas*</label>
                            <input type="number" id="numero_parcelas" value={numero_parcelas} onChange={(e) => setNumeroParcelas(Number(e.target.value))} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="valor_parcela" className="block text-sm font-medium text-gray-text mb-1">Valor da Parcela</label>
                            <input type="text" id="valor_parcela" value={calculationMode === 'auto' ? formatCurrency(valor_parcela_calculado) : valor_parcela_fixo_str} onChange={(e) => setValorParcelaFixoStr(e.target.value)} readOnly={calculationMode === 'auto'} className={`w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg ${calculationMode === 'auto' && 'bg-gray-200 dark:bg-dark-tertiary/50'}`} />
                        </div>
                        <div>
                            <label htmlFor="proxima_parcela_numero" className="block text-sm font-medium text-gray-text mb-1">Número da Próxima Parcela*</label>
                            <input type="number" id="proxima_parcela_numero" value={proxima_parcela_numero} onChange={(e) => setProximaParcelaNumero(Number(e.target.value))} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg" />
                        </div>
                        <div>
                            <label htmlFor="proximo_vencimento" className="block text-sm font-medium text-gray-text mb-1">Próximo Vencimento*</label>
                            <input type="date" id="proximo_vencimento" value={proximo_vencimento} onChange={(e) => setProximoVencimento(e.target.value)} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-dark-tertiary font-semibold py-2 px-6 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="bg-brand-green text-white font-semibold py-2 px-6 rounded-lg">{loading ? 'A guardar...' : 'Cadastrar Empréstimo'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function LoansPage() {
    const [loans, setLoans] = useState<EmprestimoDetalhado[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const supabase = createSupabaseBrowserClient();

    const fetchLoans = useCallback(async () => {
        setLoading(true);
        
        const { data: emprestimosData, error: emprestimosError } = await supabase.from('emprestimos').select('*');
        if (emprestimosError) {
            console.error("Erro ao buscar empréstimos:", emprestimosError);
            setLoading(false);
            return;
        }

        const detailedLoans = await Promise.all(
            emprestimosData.map(async (emprestimo) => {
                const { data: parcelasData, error: parcelasError } = await supabase
                    .from('parcelas_emprestimo')
                    .select('valor_parcela')
                    .eq('emprestimo_id', emprestimo.id)
                    .eq('status', 'Paga');

                const total_pago = parcelasData?.reduce((sum, p) => sum + p.valor_parcela, 0) || 0;
                const parcelas_pagas = parcelasData?.length || 0;

                return { ...emprestimo, total_pago, parcelas_pagas };
            })
        );

        setLoans(detailedLoans as EmprestimoDetalhado[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    const handleDeleteLoan = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este empréstimo? Todas as parcelas e transações associadas serão apagadas permanentemente.")) {
            const { error } = await supabase.from('emprestimos').delete().eq('id', id);
            if (error) {
                alert("Erro ao excluir empréstimo: " + error.message);
            } else {
                fetchLoans();
            }
        }
    };

    const totalEmprestado = loans.reduce((sum, loan) => sum + loan.valor_original, 0);
    const totalPago = loans.reduce((sum, loan) => sum + loan.total_pago, 0);
    const saldoDevedor = totalEmprestado - totalPago;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Empréstimos & Financiamentos</h1>
                    <p className="text-sm text-gray-text">Controle completo dos seus empréstimos e financiamentos ativos.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Novo Empréstimo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Emprestado" value={formatCurrency(totalEmprestado)} />
                <StatCard title="Total Pago" value={formatCurrency(totalPago)} colorClass="text-success-text" />
                <StatCard title="Saldo Devedor" value={formatCurrency(saldoDevedor)} colorClass="text-danger-text" />
                <StatCard title="Contratos Ativos" value={String(loans.length)} />
            </div>

            <div>
                <h2 className="text-lg font-bold mb-4">Seus Empréstimos</h2>
                {loading ? (
                    <p>A carregar empréstimos...</p>
                ) : (
                    <div className="space-y-6">
                        {loans.length > 0 ? loans.map(loan => (
                            <LoanListItem key={loan.id} loan={loan} onDelete={handleDeleteLoan} />
                        )) : <p className="text-gray-text">Nenhum empréstimo cadastrado.</p>}
                    </div>
                )}
            </div>
            
            <LoanModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchLoans}
            />
        </div>
    );
}
