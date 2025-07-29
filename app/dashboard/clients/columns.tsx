"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
// Adicione aqui os imports para DropdownMenu se for usar

// Este tipo é importado da sua página principal ou de um ficheiro de tipos
export type Client = {
  id: string;
  nome: string;
  empresa: string | null;
  email_contato: string;
  telefone: string;
  cpf_cnpj: string | null;
  origem: string;
};

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "nome",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "empresa",
    header: "Empresa",
  },
  {
    accessorKey: "email_contato",
    header: "Email",
  },
  {
    accessorKey: "telefone",
    header: "Telefone",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original
 
      return (
        // Aqui pode adicionar um DropdownMenu do Shadcn para as ações
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )
    },
  },
]
