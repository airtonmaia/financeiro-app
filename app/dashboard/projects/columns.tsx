// app/dashboard/projects/columns.tsx
"use client"

import { ColumnDef, RowData } from "@tanstack/react-table"
import Link from "next/link"
import { Project } from "@/types"

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    deleteItem: (itemId: string) => void; // Generalizando para deleteItem
  }
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "descricao",
    header: "Projeto",
    cell: ({ row }) => (
      <div className="font-semibold">{row.original.descricao}</div>
    ),
  },
  {
    accessorKey: "clientes.nome",
    header: "Cliente",
    cell: ({ row }) => (
      <div>
        {row.original.clientes ? row.original.clientes.nome : "N/A"}
      </div>
    ),
  },
  {
    accessorKey: "status_entrega",
    header: "Status",
  },
  {
    accessorKey: "data_entrega",
    header: "Data de Entrega",
    cell: ({ row }) => {
      const date = new Date(row.original.data_entrega);
      return date.toLocaleDateString('pt-BR');
    },
  },
  {
    accessorKey: "valor_total",
    header: "Valor",
    cell: ({ row }) => {
      const valor = typeof row.original.valor_total === "number" ? row.original.valor_total : 0;
      return (
        <span className="font-bold">
          {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      );
    },
  },
  {
    id: "acoes",
    header: "Ações",
    cell: ({ row, table }) => (
      <div className="flex gap-2 text-sm">
        <Link href={`/dashboard/projects/${row.original.id}`} className="hover:underline">ver</Link>
        <span>|</span>
        <Link href={`/dashboard/projects/${row.original.id}/edit`} className="hover:underline">editar</Link>
        <span>|</span>
        <button
          className="text-destructive hover:underline"
          onClick={() => table.options.meta?.deleteItem(row.original.id)}
        >
          excluir
        </button>
      </div>
    ),
  },
];
