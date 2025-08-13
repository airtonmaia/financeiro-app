// app/dashboard/page.tsx
// Página principal do dashboard, com dados dinâmicos do banco de dados.

'use client'; 

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from 'next-themes';
import { type Transacao } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- COMPONENTES ---
function TransactionItem({ transaction }: { transaction: Transacao }) {
    const isIncome = transaction.tipo === 'Receita';
    return (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${isIncome ? 'bg-success/20' : 'bg-destructive/20'}`}>
                    {isIncome ? <ArrowUp className="w-5 h-5 text-success" /> : <ArrowDown className="w-5 h-5 text-destructive" />}
                </div>
                <div>
                    <p className="font-semibold text-foreground">{transaction.descricao}</p>
                    <p className="text-sm text-muted-foreground">{new Date(transaction.data).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold ${isIncome ? 'text-success' : 'text-destructive'}`}>
                    {isIncome ? '+' : '-'} {formatBRL(transaction.valor)}
                </p>
                <Badge variant={transaction.status === 'Pago' ? 'default' : 'secondary'} className={`${transaction.status === 'Pago' ? 'bg-success/20 text-success' : ''}`}>
                    {transaction.status}
                </Badge>
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function DashboardPage() {
  const { theme } = useTheme();
  const supabase = createSupabaseBrowserClient();

  const [stats, setStats] = useState({ saldo: 0, receitas: 0, despesas: 0, projetosAtivos: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);

  const pieChartColors = theme === 'dark' 
    ? ['#4f46e5', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'] 
    : ['#6366f1', '#8b5cf6', '#c084fc', '#f0abfc', '#f9a8d4'];

  const areaChartConfig = {
    Receita: {
      label: "Receita",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const { data: transactionsData, error: transError } = await supabase.from('transacoes').select('*');
    const { data: projectsData, error: projError } = await supabase.from('projetos').select('status_entrega');

    if (transError || projError) {
        console.error("Error fetching data:", transError || projError);
        setLoading(false);
        return;
    }

    const receitas = transactionsData.filter(t => t.tipo === 'Receita' && t.status === 'Pago').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transactionsData.filter(t => t.tipo === 'Despesa' && t.status === 'Pago').reduce((sum, t) => sum + t.valor, 0);
    const saldo = receitas - despesas;
    const projetosAtivos = projectsData.filter(p => p.status_entrega !== 'Concluído' && p.status_entrega !== 'Cancelado').length;
    setStats({ saldo, receitas, despesas, projetosAtivos });

    const monthlyMap = new Map<string, number>();
    transactionsData
      .filter(t => t.tipo === 'Receita' && t.status === 'Pago')
      .forEach(t => {
        const monthKey = t.data.slice(0, 7); // "YYYY-MM"
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + t.valor);
      });
    const sortedMonthKeys = Array.from(monthlyMap.keys()).sort();
    const revenueChartData = sortedMonthKeys.map(monthKey => {
      const date = new Date(`${monthKey}-02`);
      return {
        name: date.toLocaleString('pt-BR', { month: 'short' }).replace('.','').toUpperCase(),
        Receita: monthlyMap.get(monthKey) || 0,
      };
    });
    setMonthlyRevenue(revenueChartData);

    const categoryMap = new Map<string, number>();
    transactionsData.filter(t => t.tipo === 'Despesa' && t.status === 'Pago').forEach(t => {
        const category = t.categoria || 'Outros';
        categoryMap.set(category, (categoryMap.get(category) || 0) + t.valor);
    });
    const spendingChartData = Array.from(categoryMap, ([name, value]) => ({ name, value }));
    setSpendingByCategory(spendingChartData);

    const sortedTransactions = [...transactionsData].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    setRecentTransactions(sortedTransactions.slice(0, 4));

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
      return <div className="text-center p-10">Carregando dados do dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-primary text-primary-foreground">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-primary-foreground/80">Saldo Total</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{formatBRL(stats.saldo)}</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Receitas (Mês)</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{formatBRL(stats.receitas)}</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Despesas (Mês)</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{formatBRL(stats.despesas)}</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Projetos Ativos</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold text-primary mt-2">{stats.projetosAtivos}</p></CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      
        <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Receitas Mensais</CardTitle></CardHeader>
            <CardContent className="h-72">
                <ChartContainer config={areaChartConfig}>
                    <AreaChart accessibilityLayer data={monthlyRevenue} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => formatBRL(value as number)} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(value) => formatBRL(value as number)} />} />
                        <Area dataKey="Receita" type="natural" fill="var(--color-Receita)" fillOpacity={0.4} stroke="var(--color-Receita)" />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
      

      {/* Transações Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Transações Recentes</CardTitle></CardHeader>
        <CardContent>
            {recentTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
        </CardContent>
      </Card>
      <Card>
            <CardHeader><CardTitle>Distribuição de Gastos</CardTitle></CardHeader>
            <CardContent className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <ChartTooltip formatter={(value) => formatBRL(value as number)} contentStyle={{ backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', border: '1px solid hsl(var(--border))' }} />
                        <Pie data={spendingByCategory} dataKey="value" nameKey="name" innerRadius={60}>
                            {spendingByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} /> )}
                        </Pie>
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        </div>
    </div>
  );
}