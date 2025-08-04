"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

export type Client = {
  id: string;
  nome: string;
  empresa: string | null;
  email_contato: string;
  telefone: string;
  origem: string;
  tipo: string;
  projetos: number;
  valor_total: number;
};

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "nome",
    header: "Nome",
    cell: ({ row }) => (
      <div>
        <div className="font-semibold">{row.original.nome}</div>
        {row.original.empresa && (
          <div className="text-xs text-muted-foreground text-gray-500">{row.original.empresa}</div>
        )}
      </div>
    ),
  },
  {
    id: "contato",
    header: "Contato",
    cell: ({ row }) => (
      <div>
        <div>{row.original.email_contato}</div>
        <div className="text-xs text-muted-foreground">{row.original.telefone}</div>
      </div>
    ),
  },
  {
    accessorKey: "origem",
    header: "Origem",
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => (
      <span className="font-bold">{row.original.tipo}</span>
    ),
  },
  {
    accessorKey: "projetos",
    header: "Projetos",
    cell: ({ row }) => row.original.projetos,
  },
  {
    accessorKey: "valor_total",
    header: "Valor Total",
    cell: ({ row }) => {
      const valor = typeof row.original.valor_total === "number" ? row.original.valor_total : 0;
      return (
        <span className={valor >= 10000 ? "font-bold" : "font-bold text-brand-primary"}>
          {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      );
    },
  },
  {
    id: "acoes",
    header: "Ações",
    // A correção foi feita aqui:
    // A função 'cell' agora recebe '{ row, table }' para ter acesso à instância da tabela.
    cell: ({ row, table }) => (
      <div className="flex gap-2 text-sm">
        <Link href={`/dashboard/clients/${row.original.id}/edit`} className="hover:underline">ver</Link>
        <span>|</span>
        <Link href={`/dashboard/clients/${row.original.id}/edit`} className="hover:underline">editar</Link>
        <span>|</span>
        <button
          className="text-destructive hover:underline"
          // Agora usamos 'table' diretamente, que foi recebido nos parâmetros da célula.
          onClick={() => table.options.meta?.deleteClient(row.original.id)}
        >
          excluir
        </button>
      </div>
    ),
  },
];
