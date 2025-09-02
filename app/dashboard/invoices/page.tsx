// app/dashboard/invoices/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Plus, Search, Download, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BasicTable } from '@/components/ui/basic-table';
import { InvoiceFormSheet } from '@/components/InvoiceFormSheet';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Invoice = {
  id: string;
  user_id: string;
  client_id: string;
  data_emissao: string;
  status_emissao: 'Emitido' | 'Pendente';
  valor: number;
  invoice_file_url: string | null;
  tipo_servico: string;
  created_at: string;
  clients?: { nome: string };
  is_recurring?: boolean;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date().toISOString().slice(0, 7)
  );

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('*, clients:clientes(nome)')
      .order('data_emissao', { ascending: false });

    if (error) {
      setError(`Erro ao carregar notas fiscais: ${error.message}`);
      console.error(error);
    } else {
      setInvoices((data ?? []) as Invoice[]);
      setError(null);
    }
    setLoading(false);
  }, [supabase]);

  const handleStatusChange = useCallback(async (invoiceId: string, newStatus: boolean) => {
    const statusText = newStatus ? 'Emitido' : 'Pendente';
    const { error } = await supabase
      .from('notas_fiscais')
      .update({ status_emissao: statusText })
      .eq('id', invoiceId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      alert(`Erro ao atualizar status: ${error.message}`);
    } else {
      setInvoices(prevInvoices =>
        prevInvoices.map(inv =>
          inv.id === invoiceId ? { ...inv, status_emissao: statusText } : inv
        )
      );
    }
  }, [supabase]);

  const handleEditInvoice = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
    setIsSheetOpen(true);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta nota fiscal?")) {
      const { error } = await supabase
        .from('notas_fiscais')
        .delete()
        .eq('id', invoiceId);

      if (error) {
        alert(`Erro ao excluir nota fiscal: ${error.message}`);
      } else {
        fetchInvoices();
      }
    }
  };

  const invoiceColumns: { header: string; accessor?: keyof Invoice; render?: (row: Invoice) => React.ReactNode }[] = [
    {
      header: "Cliente",
      render: (row) => row.clients?.nome || '-',
    },
    {
      header: "Data de Emissão",
      accessor: "data_emissao",
      render: (row) => {
        if (!row.data_emissao) return "-";
        try {
          return format(new Date(row.data_emissao), 'dd/MM/yyyy', { locale: ptBR });
        } catch (e) {
          return String(row.data_emissao);
        }
      }
    },
    {
      header: "Status de Emissão",
      accessor: "status_emissao",
      render: (row) => (
        <Switch
          checked={row.status_emissao === 'Emitido'}
          onCheckedChange={(checked) => handleStatusChange(row.id, checked)}
          aria-label="Mudar status de emissão"
        />
      ),
    },
    {
      header: "Valor",
      accessor: "valor",
      render: (row) => {
        const numericValue = Number(row.valor);
        if (isNaN(numericValue)) return "-";
        return `R$ ${numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },
    {
      header: "Nota Fiscal",
      accessor: "invoice_file_url",
      render: (row) => (
        row.invoice_file_url ? (
          <a href={row.invoice_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
            <Download className="w-4 h-4" /> Baixar
          </a>
        ) : (
          '-'
        )
      ),
    },
    {
      header: "Tipo de Serviço",
      accessor: "tipo_servico",
    },
    {
      header: "Ações",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleEditInvoice(row)}>
              <Eye className="w-4 h-4 mr-2" /> Ver / Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteInvoice(row.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  const handleNewInvoice = () => {
    setInvoiceToEdit(null);
    setIsSheetOpen(true);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (invoice.clients?.nome?.toLowerCase().includes(term) ?? false) ||
      invoice.tipo_servico.toLowerCase().includes(term) ||
      invoice.data_emissao.includes(searchTerm);

    const matchesMonth = !selectedMonth || invoice.data_emissao.startsWith(selectedMonth);
    return matchesSearch && matchesMonth;
  });

  const annualLimit = 81000;
  const issuedValue = invoices.reduce((sum, inv) => sum + (Number(inv.valor) || 0), 0);
  const valueToIssue = Math.max(annualLimit - issuedValue, 0);

  if (error) {
    return (
      <div className="p-5 text-center text-destructive bg-destructive/10 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas notas fiscais e controle seus limites.
          </p>
        </div>
        <Button onClick={handleNewInvoice}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Nota Fiscal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Limite Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {annualLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Emitido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {issuedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor a Emitir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {valueToIssue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row gap-4 justify-between items-center">
          <h2 className="text-xl font-bold">Controle de Emissão de Notas</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="p-5 text-center text-muted-foreground">Carregando notas fiscais...</p>
          ) : (
            <BasicTable<Invoice> columns={invoiceColumns} data={filteredInvoices} />
          )}
        </CardContent>
      </Card>

      <InvoiceFormSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setInvoiceToEdit(null);
        }}
        onSave={() => {
          fetchInvoices();
          setIsSheetOpen(false);
          setInvoiceToEdit(null);
        }}
        invoiceToEdit={invoiceToEdit}
      />
    </div>
  );
}