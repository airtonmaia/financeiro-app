// app/dashboard/page.tsx
// Página principal do dashboard, com dados dinâmicos do banco de dados.

'use client'; 

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Briefcase } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from 'next-themes';
import { type Transacao, type Project } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- COMPONENTES ---
function ProjectItem({ project }: { project: Project & { clientes: { nome: string } | null } }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-muted">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="font-semibold text-foreground">{project.descricao}</p>
                    <p className="text-sm text-muted-foreground">{project.clientes?.nome || 'Sem cliente'}</p>
                </div>
            </div>
            <Badge variant="outline">{project.status_entrega}</Badge>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function DashboardPage() {
  const { theme } = useTheme();
  const supabase = createSupabaseBrowserClient();

  const [stats, setStats] = useState({ saldo: 0, receitas: 0, despesas: 0, projetosAtivos: 0 });
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<(Project & { clientes: { nome: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const areaChartConfig = {
    Receita: { label: "Receita", color: "hsl(var(--chart-2))" },
    Despesa: { label: "Despesa", color: "hsl(var(--chart-5))" }
  } satisfies ChartConfig;

  const pieChartConfig = {
    value: { label: "Value" },
    ...spendingByCategory.reduce((acc, cur, index) => {
        const colors = ['#5aa9e6', '#7fc8f8', '#ffe45e', '#b48bfa', '#491d95' , '#ff6392', '#f1e9fe', '#ffb6c1', '#ff8c00', '#ffa500', '#90ee90', '#add8e6'];
        acc[cur.name] = { label: cur.name, color: colors[index % colors.length] };
        return acc;
    }, {})
  } satisfies ChartConfig;

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const transactionsPromise = supabase.from('transacoes').select('*');
    const projectsPromise = supabase.from('projetos').select('status_entrega');
    const recentProjectsPromise = supabase.from('projetos').select('*, clientes(nome)').order('created_at', { ascending: false }).limit(5);

    const [{ data: transactionsData, error: transError }, { data: projectsData, error: projError }, { data: recentProjectsData, error: recentProjError }] = await Promise.all([transactionsPromise, projectsPromise, recentProjectsPromise]);

    if (transError || projError || recentProjError) {
        console.error("Error fetching data:", transError || projError || recentProjError);
        setLoading(false);
        return;
    }

    const receitas = transactionsData.filter(t => t.tipo === 'Receita' && t.status === 'Pago').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transactionsData.filter(t => t.tipo === 'Despesa' && t.status === 'Pago').reduce((sum, t) => sum + t.valor, 0);
    const saldo = receitas - despesas;
    const projetosAtivos = projectsData.filter(p => p.status_entrega !== 'Concluído' && p.status_entrega !== 'Cancelado').length;
    setStats({ saldo, receitas, despesas, projetosAtivos });

    const monthlyMap = new Map<string, { Receita: number, Despesa: number }>();
    transactionsData.filter(t => t.status === 'Pago').forEach(t => {
        const monthKey = t.data.slice(0, 7);
        const monthData = monthlyMap.get(monthKey) || { Receita: 0, Despesa: 0 };
        if (t.tipo === 'Receita') monthData.Receita += t.valor; else monthData.Despesa += t.valor;
        monthlyMap.set(monthKey, monthData);
    });
    const sortedMonthKeys = Array.from(monthlyMap.keys()).sort();
    const chartData = sortedMonthKeys.map(monthKey => {
      const date = new Date(`${monthKey}-02`);
      return { name: date.toLocaleString('pt-BR', { month: 'short' }).replace('.','').toUpperCase(), ...monthlyMap.get(monthKey) };
    });
    setMonthlyChartData(chartData);

    const categoryMap = new Map<string, number>();
    transactionsData.filter(t => t.tipo === 'Despesa' && t.status === 'Pago').forEach(t => {
        const category = t.categoria || 'Outros';
        categoryMap.set(category, (categoryMap.get(category) || 0) + t.valor);
    });
    const spendingChartData = Array.from(categoryMap, ([name, value]) => ({ name, value }));
    setSpendingByCategory(spendingChartData);

    setRecentProjects(recentProjectsData as any);

    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) {
      return <div className="text-center p-10">Carregando dados do dashboard...</div>
  }

  const totalDespesas = stats.despesas;

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-primary text-primary-foreground"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-primary-foreground/80">Saldo Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatBRL(stats.saldo)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Receitas (Mês)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-foreground">{formatBRL(stats.receitas)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Despesas (Mês)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-foreground">{formatBRL(stats.despesas)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Projetos Ativos</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold text-primary mt-2">{stats.projetosAtivos}</p></CardContent></Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Receitas e Despesas Mensais</CardTitle></CardHeader>
            <CardContent>
                <ChartContainer config={areaChartConfig} className="h-72 aspect-auto">
                    <AreaChart accessibilityLayer data={monthlyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => formatBRL(value as number)} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(value, name) => `${name}: ${formatBRL(value as number)}`} />} />
                        <Area dataKey="Receita" type="natural" fill="var(--color-Receita)" fillOpacity={0.4} stroke="var(--color-Receita)" />
                        <Area dataKey="Despesa" type="natural" fill="var(--color-Despesa)" fillOpacity={0.4} stroke="var(--color-Despesa)" />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Distribuição de Gastos</CardTitle></CardHeader>
            <CardContent className="h-72 flex items-center justify-center">
                <ChartContainer config={pieChartConfig} className="mx-auto aspect-square h-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={spendingByCategory} dataKey="value" nameKey="name" innerRadius={70} strokeWidth={5}>
                            {spendingByCategory.map((entry) => (
                                <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-lg font-bold">
                                                    {formatBRL(totalDespesas)}
                                                </tspan>
                                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                                                    Total Despesas
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                        {/* <ChartLegend content={<ChartLegendContent nameKey="name" />} /> */}
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

      {/* Projetos Recentes */}
      <Card>
        <CardHeader><CardTitle>Projetos Recentes</CardTitle></CardHeader>
        <CardContent>
            {recentProjects.map((project) => (
                <ProjectItem key={project.id} project={project} />
            ))}
        </CardContent>
      </Card>
    </div>
  );
}