// app/dashboard/settings/customization/page.tsx
// Página para gerenciar categorias e status dinâmicos.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Plus, Trash2, Tag, ArrowUp, ArrowDown, HandCoins, Palette } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- TIPOS ---
type Categoria = {
    id: string;
    nome: string;
    tipo: 'projeto' | 'receita' | 'despesa' | 'emprestimo';
};

type ProjectStatus = {
    id: string;
    name: string;
    color: string;
    is_default: boolean;
};

// --- COMPONENTES REUTILIZÁVEIS ---
function CategoryManager({ title, icon: Icon, categoryType, initialCategories }: { title: string; icon: React.ElementType; categoryType: Categoria['tipo']; initialCategories: Categoria[]; }) {
    const supabase = createSupabaseBrowserClient();
    const [categories, setCategories] = useState(initialCategories);
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('categorias')
            .insert({ nome: newCategoryName, tipo: categoryType, user_id: user.id })
            .select()
            .single();
        
        if (data) {
            setCategories([...categories, data]);
            setNewCategoryName('');
        }
    };
    
    const handleDeleteCategory = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
            await supabase.from('categorias').delete().eq('id', id);
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-card">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Icon className="w-5 h-5" /> {title}</h3>
            <div className="space-y-2 mb-4">
                {categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center bg-muted p-2 rounded-lg">
                        <span className="text-sm text-muted-foreground">{cat.nome}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="w-8 h-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2">
                <Input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nova categoria..." className="flex-1" />
                <Button type="submit" size="icon"><Plus className="w-5 h-5" /></Button>
            </form>
        </div>
    );
}

function StatusManager({ initialStatuses }: { initialStatuses: ProjectStatus[] }) {
    const supabase = createSupabaseBrowserClient();
    const [statuses, setStatuses] = useState(initialStatuses);
    const [newStatusName, setNewStatusName] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('#808080');

    const handleUpdateStatus = async (id: string, field: 'name' | 'color', value: string) => {
        const updatedStatuses = statuses.map(s => s.id === id ? { ...s, [field]: value } : s);
        setStatuses(updatedStatuses);
        await supabase.from('project_statuses').update({ [field]: value }).eq('id', id);
    };

    const handleAddStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStatusName.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('project_statuses')
            .insert({ name: newStatusName, color: newStatusColor, user_id: user.id })
            .select()
            .single();
        
        if (data) {
            setStatuses([...statuses, data]);
            setNewStatusName('');
            setNewStatusColor('#808080');
        }
    };
    
    const handleDeleteStatus = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este status?")) {
            await supabase.from('project_statuses').delete().eq('id', id);
            setStatuses(statuses.filter(s => s.id !== id));
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-card">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Palette className="w-5 h-5" /> Status de Projetos</h3>
            <div className="space-y-2 mb-4">
                {statuses.map(status => (
                    <div key={status.id} className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                        <Input type="color" value={status.color} onChange={(e) => handleUpdateStatus(status.id, 'color', e.target.value)} className="w-10 h-10 p-1" />
                        <Input type="text" value={status.name} onBlur={(e) => handleUpdateStatus(status.id, 'name', e.target.value)} onChange={(e) => setStatuses(statuses.map(s => s.id === status.id ? { ...s, name: e.target.value } : s))} className="flex-1 bg-transparent text-sm" />
                        {!status.is_default && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteStatus(status.id)} className="w-8 h-8 text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddStatus} className="flex gap-2">
                <Input type="color" value={newStatusColor} onChange={(e) => setNewStatusColor(e.target.value)} className="w-12 h-12 p-1" />
                <Input type="text" value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="Novo status..." className="flex-1" />
                <Button type="submit" size="icon"><Plus className="w-5 h-5" /></Button>
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
    const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: categoriesData } = await supabase.from('categorias').select('*');
            if (categoriesData) {
                setProjectCategories(categoriesData.filter(c => c.tipo === 'projeto'));
                setIncomeCategories(categoriesData.filter(c => c.tipo === 'receita'));
                setExpenseCategories(categoriesData.filter(c => c.tipo === 'despesa'));
                setLoanCategories(categoriesData.filter(c => c.tipo === 'emprestimo'));
            }
            
            const { data: statusesData } = await supabase.from('project_statuses').select('*').order('display_order');
            if (statusesData) setProjectStatuses(statusesData);

            setLoading(false);
        };
        fetchData();
    }, [supabase]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Personalização</h1>
                    <p className="text-sm text-muted-foreground">Gerencie as categorias e status usados em todo o sistema.</p>
                </div>
                 <Button><Plus className="w-4 h-4 mr-2" /> Nova Categoria</Button>
            </div>

            {loading ? (
                <p className="text-center p-10 text-muted-foreground">A carregar...</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2">
                        <StatusManager initialStatuses={projectStatuses} />
                    </div>
                    <CategoryManager title="Categorias de Projeto" icon={Tag} categoryType="projeto" initialCategories={projectCategories} />
                    <CategoryManager title="Categorias de Receita" icon={ArrowUp} categoryType="receita" initialCategories={incomeCategories} />
                    <CategoryManager title="Categorias de Despesa" icon={ArrowDown} categoryType="despesa" initialCategories={expenseCategories} />
                    <CategoryManager title="Categorias de Empréstimo" icon={HandCoins} categoryType="emprestimo" initialCategories={loanCategories} />
                </div>
            )}
        </div>
    );
}