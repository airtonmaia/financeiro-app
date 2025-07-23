// app/dashboard/settings/customization/page.tsx
// Página para gerenciar categorias dinâmicas.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Plus, Trash2, Tag, ArrowUp, ArrowDown, HandCoins } from 'lucide-react';

// --- TIPOS ---
type Categoria = {
    id: string;
    nome: string;
    tipo: 'projeto' | 'receita' | 'despesa' | 'emprestimo';
};

// --- COMPONENTE REUTILIZÁVEL ---
function CategoryManager({ title, icon: Icon, categoryType, initialCategories }: { title: string; icon: React.ElementType; categoryType: Categoria['tipo']; initialCategories: Categoria[]; }) {
    const supabase = createSupabaseBrowserClient();
    const [categories, setCategories] = useState(initialCategories);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('categorias')
            .insert({ nome: newCategoryName, tipo: categoryType, user_id: user.id })
            .select()
            .single();
        
        if (data) {
            setCategories([...categories, data]);
            setNewCategoryName('');
        }
        if (error) {
            alert("Erro ao adicionar categoria: " + error.message);
        }
        setLoading(false);
    };
    
    const handleDeleteCategory = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
            const { error } = await supabase.from('categorias').delete().eq('id', id);
            if (error) {
                alert("Erro ao excluir categoria: " + error.message);
            } else {
                setCategories(categories.filter(c => c.id !== id));
            }
        }
    };

    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-6 rounded-xl shadow-card">
            <h3 className="font-bold text-dark-text dark:text-light-text mb-4 flex items-center gap-2"><Icon className="w-5 h-5" /> {title}</h3>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {categories.length > 0 ? categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center bg-gray-50 dark:bg-dark-tertiary p-2 rounded-lg">
                        <span className="text-sm">{cat.nome}</span>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-text hover:text-danger-text p-1">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )) : (
                    <p className="text-sm text-gray-text text-center py-4">Nenhuma categoria cadastrada.</p>
                )}
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2">
                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nova categoria..." className="flex-1 p-2 bg-gray-50 dark:bg-dark-tertiary border border-light-tertiary dark:border-dark-tertiary rounded-lg" />
                <button type="submit" disabled={loading} className="bg-brand-green text-white font-semibold p-2 rounded-lg disabled:bg-gray-400">
                    <Plus className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}


// --- PÁGINA PRINCIPAL ---
export default function CustomizationPage() {
    const [projectCategories, setProjectCategories] = useState<Categoria[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<Categoria[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<Categoria[]>([]);
    const [loanCategories, setLoanCategories] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('categorias').select('*');
            if (data) {
                setProjectCategories(data.filter(c => c.tipo === 'projeto'));
                setIncomeCategories(data.filter(c => c.tipo === 'receita'));
                setExpenseCategories(data.filter(c => c.tipo === 'despesa'));
                setLoanCategories(data.filter(c => c.tipo === 'emprestimo'));
            }
            setLoading(false);
        };
        fetchCategories();
    }, [supabase]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Personalização</h1>
                <p className="text-sm text-gray-text">Gerencie as categorias usadas em todo o sistema.</p>
            </div>

            {loading ? (
                <p className="text-center p-10">A carregar categorias...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CategoryManager title="Categorias de Projeto" icon={Tag} categoryType="projeto" initialCategories={projectCategories} />
                    <CategoryManager title="Categorias de Receita" icon={ArrowUp} categoryType="receita" initialCategories={incomeCategories} />
                    <CategoryManager title="Categorias de Despesa" icon={ArrowDown} categoryType="despesa" initialCategories={expenseCategories} />
                    <CategoryManager title="Categorias de Empréstimo" icon={HandCoins} categoryType="emprestimo" initialCategories={loanCategories} />
                </div>
            )}
        </div>
    );
}
