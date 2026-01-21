'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface MonthlyData {
  name: string;
  Receita: number;
  Despesa: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface DashboardChartsProps {
  monthlyChartData: MonthlyData[];
  spendingByCategory: CategoryData[];
  totalDespesas: number;
}

export function DashboardCharts({ monthlyChartData, spendingByCategory, totalDespesas }: DashboardChartsProps) {
  const areaChartConfig = {
    Receita: { label: "Receita", color: "hsl(var(--chart-2))" },
    Despesa: { label: "Despesa", color: "hsl(var(--chart-5))" }
  } satisfies ChartConfig;

  const pieChartConfig = {
    value: { label: "Value" },
    ...spendingByCategory.reduce((acc, cur) => {
        const colors = ['#5aa9e6', '#7fc8f8', '#ffe45e', '#b48bfa', '#491d95' , '#ff6392', '#f1e9fe', '#ffb6c1', '#ff8c00', '#ffa500', '#90ee90', '#add8e6'];
        const colorIndex = Object.keys(acc).length -1;
        acc[cur.name] = { label: cur.name, color: colors[colorIndex % colors.length] };
        return acc;
    }, {})
  } satisfies ChartConfig;

  return (
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
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
