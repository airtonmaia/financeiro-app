// app/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts } from '@/components/DashboardCharts';
import { type Project } from '@/types';

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
export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  const transactionsPromise = supabase.from('transacoes').select('*');
  const projectsPromise = supabase.from('projetos').select('status_entrega');
  const recentProjectsPromise = supabase.from('projetos').select('*, clientes(nome)').order('created_at', { ascending: false }).limit(5);

  const [{ data: transactionsData, error: transError }, { data: projectsData, error: projError }, { data: recentProjectsData, error: recentProjError }] = await Promise.all([transactionsPromise, projectsPromise, recentProjectsPromise]);

  if (transError || projError || recentProjError) {
      console.error("Error fetching data:", transError || projError || recentProjError);
      return <div>Error loading data.</div>
  }

  const receitas = transactionsData.filter(t => t.tipo === 'Receita' && t.status === 'Pago').reduce((sum, t) => sum + t.valor, 0);
  const despesas = transactionsData.filter(t => t.tipo === 'Despesa' && t.status === 'Pago').reduce((sum, t) => sum + t.valor, 0);
  const saldo = receitas - despesas;
  const projetosAtivos = projectsData.filter(p => p.status_entrega !== 'Concluído' && p.status_entrega !== 'Cancelado').length;
  
  const stats = { saldo, receitas, despesas, projetosAtivos };

  const monthlyMap = new Map<string, { Receita: number, Despesa: number }>();
  transactionsData.filter(t => t.status === 'Pago').forEach(t => {
      const monthKey = t.data.slice(0, 7);
      const monthData = monthlyMap.get(monthKey) || { Receita: 0, Despesa: 0 };
      if (t.tipo === 'Receita') monthData.Receita += t.valor; else monthData.Despesa += t.valor;
      monthlyMap.set(monthKey, monthData);
  });
  const sortedMonthKeys = Array.from(monthlyMap.keys()).sort();
  const monthlyChartData = sortedMonthKeys.map(monthKey => {
    const date = new Date(`${monthKey}-02`);
    return { name: date.toLocaleString('pt-BR', { month: 'short' }).replace('.','').toUpperCase(), ...monthlyMap.get(monthKey) };
  });

  const categoryMap = new Map<string, number>();
  transactionsData.filter(t => t.tipo === 'Despesa' && t.status === 'Pago').forEach(t => {
      const category = t.categoria || 'Outros';
      categoryMap.set(category, (categoryMap.get(category) || 0) + t.valor);
  });
  const spendingByCategory = Array.from(categoryMap, ([name, value]) => ({ name, value }));

  const recentProjects = recentProjectsData as Project[];

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
      <DashboardCharts monthlyChartData={monthlyChartData} spendingByCategory={spendingByCategory} totalDespesas={stats.despesas} />

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