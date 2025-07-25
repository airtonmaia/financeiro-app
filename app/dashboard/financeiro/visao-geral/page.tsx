// app/dashboard/financeiro/visao-geral/page.tsx
// Página com relatórios e métricas financeiras.

'use client';

import { useState, useEffect, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Transacao } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

// --- COMPONENTES DE RELATÓRIO ---

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-card dark:bg-dark-secondary p-6 rounded-xl shadow-card">
            <h3 className="font-bold text-dark-text dark:text-light-text mb-4">{title}</h3>
            {children}
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function FinancialOverviewPage() {
    const [transactions, setTransactions] = useState<Transacao[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const { data, error } = await supabase
                .from('transacoes')
                .select('*')
                .gte('data', sixMonthsAgo.toISOString()); // Busca transações dos últimos 6 meses
            
            if (data) setTransactions(data as Transacao[]);
            setLoading(false);
        };
        fetchTransactions();
    }, [supabase]);

    // Lógica para processar os dados para os gráficos
    const monthlyEvolution = useMemo(() => {
        const months: { [key: string]: { Receitas: number; Despesas: number } } = {};
        transactions.forEach(t => {
            const month = new Date(t.data).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!months[month]) months[month] = { Receitas: 0, Despesas: 0 };
            if (t.tipo === 'Receita') months[month].Receitas += t.valor;
            if (t.tipo === 'Despesa') months[month].Despesas += t.valor;
        });
        return Object.entries(months).map(([name, values]) => ({ name, ...values })).reverse();
    }, [transactions]);

    const topExpenseCategories = useMemo(() => {
        const categories: { [key: string]: number } = {};
        transactions.filter(t => t.tipo === 'Despesa').forEach(t => {
            categories[t.categoria] = (categories[t.categoria] || 0) + t.valor;
        });
        return Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
    }, [transactions]);
    
    // ... (lógica para outros relatórios pode ser adicionada aqui)

    if (loading) {
        return <div className="p-10 text-center">A carregar relatórios...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Visão Geral Financeira</h1>
                <p className="text-sm text-gray-text">Relatórios e métricas sobre a saúde do seu negócio.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Visão Temporal */}
                <ReportCard title="Evolução Mensal (Últimos 6 Meses)">
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyEvolution}>
                                <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF' }} wrapperClassName="dark:!bg-dark-tertiary dark:!border-dark-tertiary" />
                                <Legend />
                                <Bar dataKey="Receitas" fill="#19B884" />
                                <Bar dataKey="Despesas" fill="#DC3545" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ReportCard>

                {/* 2. Quebra por Categoria */}
                <ReportCard title="Top 5 Categorias de Despesa">
                     <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={topExpenseCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                    {topExpenseCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#DC3545', '#FF6384', '#FF9F40', '#FFCD56', '#C9CBCF'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ReportCard>

                {/* 3. Contas a Vencer / Receber */}
                <ReportCard title="Contas a Vencer/Receber (Próximos 7 dias)">
                    <div className="text-center text-gray-text p-10">
                        <Calendar className="mx-auto w-10 h-10 mb-2" />
                        <p>Funcionalidade em breve.</p>
                    </div>
                </ReportCard>

                {/* 6. Métricas de Performance */}
                 <ReportCard title="Métricas de Performance">
                    <div className="text-center text-gray-text p-10">
                        <TrendingUp className="mx-auto w-10 h-10 mb-2" />
                        <p>Funcionalidade em breve.</p>
                    </div>
                </ReportCard>
            </div>
        </div>
    );
}
