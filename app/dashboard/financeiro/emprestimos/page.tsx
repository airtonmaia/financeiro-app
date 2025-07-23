// app/dashboard/financeiro/emprestimos/page.tsx
// Página para gerenciar empréstimos e financiamentos.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Plus, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

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
};
const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- COMPONENTES ---

function StatCard({ title, value, colorClass }: { title: string; value: string; colorClass?: string; }) { /* ...código anterior... */ }
function LoanListItem({ loan }: { loan: EmprestimoDetalhado }) { /* ...código anterior... */ }

// Modal para Adicionar Empréstimo
function LoanModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: () => void; }) {
    const supabase = createSupabaseBrowserClient();
    
    const [titulo, setTitulo] = useState(''); // NOVO
    const [tipo_emprestimo, setTipoEmprestimo] = useState(''); // Alterado de 'nome'
    const [instituicao, setInstituicao] = useState('');
    const [valor_original_str, setValorOriginalStr] = useState('');
    const [taxa_juros, setTaxaJuros] = useState<number | ''>('');
    const [numero_parcelas, setNumeroParcelas] = useState<number | ''>('');
    const [data_contratacao, setDataContratacao] = useState('');
    const [parcelas_pagas, setParcelasPagas] = useState<number | ''>(0);
    const [calculationMode, setCalculationMode] = useState<'auto' | 'fixed'>('auto');
    const [valor_parcela_fixo_str, setValorParcelaFixoStr] = useState('');
    const [loading, setLoading] = useState(false);
    const [loanCategories, setLoanCategories] = useState<Categoria[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categorias').select('id, nome').eq('tipo', 'emprestimo');
            if (data) setLoanCategories(data);
        };
        if (isOpen) fetchCategories();
    }, [isOpen, supabase]);

    useEffect(() => {
        if (tipo_emprestimo === 'Financiamento Veículo') {
            setCalculationMode('fixed');
        } else {
            setCalculationMode('auto');
        }
    }, [tipo_emprestimo]);

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
                titulo: titulo || tipo_emprestimo, // Usa o título, ou o tipo como fallback
                tipo_emprestimo,
                instituicao,
                valor_original: valor_total_calculado,
                taxa_juros: Number(taxa_juros),
                numero_parcelas: Number(numero_parcelas),
                data_contratacao,
            })
            .select()
            .single();

        // ... (resto da lógica de salvar parcelas)
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-xl shadow-lg w-full max-w-lg">
                <h2 className="text-xl font-bold mb-1">Cadastrar Novo Empréstimo</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tipo_emprestimo" className="block text-sm font-medium text-gray-text mb-1">Tipo de Empréstimo*</label>
                            <select id="tipo_emprestimo" value={tipo_emprestimo} onChange={(e) => setTipoEmprestimo(e.target.value)} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg">
                                <option value="" disabled>Selecione o tipo</option>
                                <option>Financiamento Veículo</option> {/* Opção Fixa */}
                                {loanCategories.map(cat => (
                                    <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="titulo" className="block text-sm font-medium text-gray-text mb-1">Título (opcional)</label>
                            <input type="text" id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Carro da Empresa" className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg" />
                        </div>
                        {/* ... (resto do formulário) ... */}
                    </div>
                    {/* ... (botões) ... */}
                </form>
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function LoansPage() {
    // ... (código da página principal permanece o mesmo)
}

// O código dos componentes StatCard, LoanListItem e da página principal foi omitido por brevidade,
// mas deve permanecer no seu ficheiro. As alterações principais estão no componente LoanModal.
