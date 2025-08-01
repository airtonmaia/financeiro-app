// app/dashboard/financeiro/bancos/page.tsx
// Página para gerenciar contas bancárias.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Plus, Landmark, Trash2, Edit } from 'lucide-react';

// --- TIPOS ---
type Banco = {
    id: string;
    nome_banco: string;
    tipo_conta: string | null;
    saldo_inicial: number;
};

// --- COMPONENTES ---

// Modal para Adicionar/Editar Conta Bancária
function BankModal({ isOpen, onClose, onSave, bankToEdit }: { isOpen: boolean; onClose: () => void; onSave: (bank: Omit<Banco, 'id'>) => void; bankToEdit?: Banco | null; }) {
    const [nome_banco, setNomeBanco] = useState('');
    const [tipo_conta, setTipoConta] = useState('Conta Corrente');
    const [saldo_inicial, setSaldoInicial] = useState<number | ''>('');

    useEffect(() => {
        if (bankToEdit) {
            setNomeBanco(bankToEdit.nome_banco);
            setTipoConta(bankToEdit.tipo_conta || 'Conta Corrente');
            setSaldoInicial(bankToEdit.saldo_inicial);
        } else {
            setNomeBanco('');
            setTipoConta('Conta Corrente');
            setSaldoInicial('');
        }
    }, [bankToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ nome_banco, tipo_conta, saldo_inicial: Number(saldo_inicial) });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-card dark:bg-dark-secondary p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-6">{bankToEdit ? 'Editar Conta' : 'Adicionar Nova Conta'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nome_banco" className="block text-sm font-medium text-gray-text mb-1">Nome do Banco*</label>
                        <input type="text" id="nome_banco" value={nome_banco} onChange={(e) => setNomeBanco(e.target.value)} required className="w-full p-3 bg-gray-50 dark:bg-dark-tertiary border border-light-tertiary dark:border-dark-tertiary rounded-lg" />
                    </div>
                    <div>
                        <label htmlFor="tipo_conta" className="block text-sm font-medium text-gray-text mb-1">Tipo de Conta</label>
                        <select id="tipo_conta" value={tipo_conta} onChange={(e) => setTipoConta(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-dark-tertiary border border-light-tertiary dark:border-dark-tertiary rounded-lg">
                            <option>Conta Corrente</option>
                            <option>Conta Poupança</option>
                            <option>Investimento</option>
                            <option>Outro</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="saldo_inicial" className="block text-sm font-medium text-gray-text mb-1">Saldo Inicial (R$)*</label>
                        <input type="number" step="0.01" id="saldo_inicial" value={saldo_inicial} onChange={(e) => setSaldoInicial(Number(e.target.value))} required className="w-full p-3 bg-gray-50 dark:bg-dark-tertiary border border-light-tertiary dark:border-dark-tertiary rounded-lg" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-dark-tertiary font-semibold py-2 px-6 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-violet-600 text-white font-semibold py-2 px-6 rounded-lg">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- PÁGINA PRINCIPAL ---
export default function BanksPage() {
    const [banks, setBanks] = useState<Banco[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const supabase = createSupabaseBrowserClient();

    const fetchBanks = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('bancos').select('*').order('created_at');
        if (data) setBanks(data as Banco[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchBanks();
    }, [fetchBanks]);

    const handleSaveBank = async (bankData: Omit<Banco, 'id'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('bancos').insert({ ...bankData, user_id: user.id });
        if (!error) {
            fetchBanks();
            setIsModalOpen(false);
        } else {
            alert("Erro ao salvar: " + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Contas Bancárias</h1>
                    <p className="text-sm text-gray-text">Gerencie suas contas e saldos iniciais.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-violet-600 hover:bg-violet-600/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Adicionar Conta
                </button>
            </div>

            {loading ? (
                <p>A carregar contas...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banks.map(bank => (
                        <div key={bank.id} className="bg-card dark:bg-dark-secondary p-5 rounded-xl shadow-card space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-100 dark:bg-dark-tertiary rounded-lg">
                                    <Landmark className="w-6 h-6 text-gray-text" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{bank.nome_banco}</h3>
                                    <p className="text-sm text-gray-text">{bank.tipo_conta}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-text">Saldo Inicial</p>
                                <p className="text-2xl font-bold">R$ {bank.saldo_inicial.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <BankModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveBank}
            />
        </div>
    );
}
