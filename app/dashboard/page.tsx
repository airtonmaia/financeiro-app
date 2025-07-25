// app/dashboard/page.tsx
// Página principal do dashboard, com o novo sistema de cores.

'use client'; 

import { ArrowUpRight, ArrowDownRight, DollarSign, Users, Briefcase, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

// --- TIPOS E DADOS DE EXEMPLO ---
type RecentTransaction = {
    type: 'income' | 'expense';
    description: string;
    date: string;
    amount: number;
    status: 'Pago' | 'Pendente';
};

const monthlyRevenueData = [ { name: 'Jan', Receita: 1600 }, { name: 'Fev', Receita: 1800 }, { name: 'Mar', Receita: 2200 }, { name: 'Abr', Receita: 2500 }, { name: 'Mai', Receita: 3200 }, { name: 'Jun', Receita: 3000 }, ];
const spendingData = [ { name: 'Design', value: 40 }, { name: 'Development', value: 35 }, { name: 'Marketing', value: 15 }, { name: 'Others', value: 10 }, ];
const COLORS = ['hsl(var(--success))', 'hsl(var(--primary))', '#FFC107', '#6C757D'];

const recentTransactions: RecentTransaction[] = [
    { type: 'income', description: 'Projeto Website - Cliente ABC', date: '2 dias atrás', amount: 2500, status: 'Pago' },
    { type: 'expense', description: 'Hospedagem AWS', date: '3 dias atrás', amount: 150, status: 'Pago' },
    { type: 'income', description: 'Design Logo - Cliente XYZ', date: '5 dias atrás', amount: 800, status: 'Pendente' },
    { type: 'expense', description: 'Adobe Creative Suite', date: '1 semana atrás', amount: 89, status: 'Pago' },
];

// --- COMPONENTES ---
function ProgressBar({ value, className }: { value: number, className: string }) {
    return (
        <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div className={className + " h-2 rounded-full"} style={{ width: `${value}%` }}></div>
        </div>
    );
}

function TransactionItem({ type, description, date, amount, status }: RecentTransaction) {
    const isIncome = type === 'income';
    const statusClasses = {
        'Pago': 'bg-success/10 text-success',
        'Pendente': 'bg-warning/10 text-warning',
    };
    return (
        <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${isIncome ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    {isIncome ? <ArrowUp className="w-5 h-5 text-success" /> : <ArrowDown className="w-5 h-5 text-destructive" />}
                </div>
                <div>
                    <p className="font-semibold text-foreground">{description}</p>
                    <p className="text-sm text-muted-foreground">{date}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold ${isIncome ? 'text-success' : 'text-destructive'}`}>
                    {isIncome ? '+' : '-'} R$ {amount.toFixed(2)}
                </p>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 inline-block ${statusClasses[status]}`}>
                    {status}
                </span>
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-success text-white p-5 rounded-lg shadow-card">
            <p className="font-medium">Saldo Total</p>
            <p className="text-3xl font-bold mt-2">R$ 20.670</p>
            <p className="text-xs mt-3 opacity-80">+2.4% desde o mês passado</p>
            <button className="bg-white/30 hover:bg-white/40 text-white font-semibold py-2 px-4 rounded-lg mt-4 w-full">
              + Depositar
            </button>
        </div>
        <div className="bg-card p-5 rounded-lg shadow-card border">
            <p className="text-muted-foreground">Receitas</p>
            <p className="text-2xl font-bold text-card-foreground mt-1">R$ 12.540</p>
            <ProgressBar value={75} className="bg-success" />
            <p className="text-xs text-muted-foreground mt-2">75% da meta mensal</p>
        </div>
        <div className="bg-card p-5 rounded-lg shadow-card border">
            <p className="text-muted-foreground">Despesas</p>
            <p className="text-2xl font-bold text-card-foreground mt-1">R$ 4.230</p>
            <ProgressBar value={50} className="bg-destructive" />
            <p className="text-xs text-muted-foreground mt-2">50% do orçamento</p>
        </div>
        <div className="bg-card p-5 rounded-lg shadow-card border">
            <p className="text-muted-foreground">Projetos Ativos</p>
            <p className="text-4xl font-bold text-card-foreground mt-2">8</p>
            <p className="text-xs text-muted-foreground mt-2">3 entregues esta semana</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-5 rounded-lg shadow-card border">
            <h3 className="font-bold text-card-foreground mb-4">Receitas Mensais</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyRevenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Line type="monotone" dataKey="Receita" stroke="hsl(var(--success))" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-card p-5 rounded-lg shadow-card border">
            <h3 className="font-bold text-card-foreground mb-4">Distribuição de Gastos</h3>
            <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={spendingData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                            {spendingData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> )}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-card p-5 rounded-lg shadow-card border">
        <h3 className="font-bold text-card-foreground mb-2">Transações Recentes</h3>
        <div>
            {recentTransactions.map((transaction, index) => (
                <TransactionItem key={index} {...transaction} />
            ))}
        </div>
      </div>
    </div>
  );
}
