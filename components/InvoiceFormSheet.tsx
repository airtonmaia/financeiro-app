// components/InvoiceFormSheet.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Client } from '@/types';
import { AddClientSheet } from '@/components/AddClientSheet';
import { Plus } from 'lucide-react';

// Definindo o tipo Invoice aqui para consistência
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
  is_recurring?: boolean;
};

interface InvoiceFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  invoiceToEdit?: Invoice | null;
}

export function InvoiceFormSheet({ isOpen, onClose, onSave, invoiceToEdit }: InvoiceFormSheetProps) {
  const supabase = createSupabaseBrowserClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [issueDate, setIssueDate] = useState('');
  const [isIssued, setIsIssued] = useState(false);
  const [value, setValue] = useState<number | ''>('');
  const [serviceType, setServiceType] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isAddClientSheetOpen, setIsAddClientSheetOpen] = useState(false);

  const serviceTypes = [
    'Hospedagem',
    'Social Mídia',
    'Criação de site',
    'Criação de logo',
    'Suporte',
    'Outros',
  ];

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase.from('clientes').select('id, nome');
    if (data) {
      setClients(data as Client[]);
    } else {
      console.error('Error fetching clients:', error);
    }
  }, [supabase]);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      if (invoiceToEdit) {
        setSelectedClient(invoiceToEdit.client_id);
        setIssueDate(invoiceToEdit.data_emissao);
        setIsIssued(invoiceToEdit.status_emissao === 'Emitido');
        setValue(invoiceToEdit.valor);
        setServiceType(invoiceToEdit.tipo_servico);
        setIsRecurring(invoiceToEdit.is_recurring || false);
      } else {
        setSelectedClient('');
        setIssueDate('');
        setIsIssued(false);
        setValue('');
        setServiceType('');
        setInvoiceFile(null);
        setIsRecurring(false);
      }
    }
  }, [isOpen, invoiceToEdit, fetchClients]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setInvoiceFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient || !issueDate || value === '' || !serviceType) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    let invoiceFileUrl: string | null = invoiceToEdit?.invoice_file_url || null;

    if (invoiceFile) {
      const fileExtension = invoiceFile.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuário não autenticado para upload de arquivo.');
        return;
      }
      const filePath = `${user.id}/${Date.now()}.${fileExtension}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, invoiceFile, {
          cacheControl: '3600',
          upsert: !!invoiceToEdit, // Upsert if editing
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        alert(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
        return;
      }
      invoiceFileUrl = uploadData?.path ? supabase.storage.from('invoices').getPublicUrl(uploadData.path).data.publicUrl : null;
    }

    const invoiceData = {
      client_id: selectedClient,
      data_emissao: issueDate,
      status_emissao: isIssued ? 'Emitido' : 'Pendente',
      valor: Number(value),
      tipo_servico: serviceType,
      invoice_file_url: invoiceFileUrl,
      is_recurring: isRecurring,
    };

    if (invoiceToEdit) {
      const { error } = await supabase.from('notas_fiscais').update(invoiceData).eq('id', invoiceToEdit.id);
      if (error) {
        console.error('Error updating invoice:', error);
        alert(`Erro ao atualizar nota fiscal: ${error.message}`);
      } else {
        onSave();
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuário não autenticado para salvar nota fiscal.');
        return;
      }
      const { error } = await supabase.from('notas_fiscais').insert({ ...invoiceData, user_id: user.id });
      if (error) {
        console.error('Error inserting invoice:', error);
        alert(`Erro ao adicionar nota fiscal: ${error.message}`);
      } else {
        onSave();
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{invoiceToEdit ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}</SheetTitle>
          <SheetDescription>
            {invoiceToEdit ? 'Edite os detalhes da nota fiscal.' : 'Preencha os detalhes para adicionar uma nova nota fiscal.'}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="client">Cliente</Label>
            <div className="flex gap-2">
              <Select value={selectedClient} onValueChange={setSelectedClient} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => setIsAddClientSheetOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="issueDate">Data de Emissão</Label>
            <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="status" checked={isIssued} onCheckedChange={setIsIssued} />
            <Label htmlFor="status">Nota Fiscal Emitida</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="recorrencia" checked={isRecurring} onCheckedChange={setIsRecurring} />
            <Label htmlFor="recorrencia">Recorrência</Label>
          </div>

          <div>
            <Label htmlFor="value">Valor (R$)</Label>
            <Input id="value" type="number" step="0.01" value={value} onChange={(e) => setValue(Number(e.target.value))} required />
          </div>

          <div>
            <Label htmlFor="invoiceFile">Nota Fiscal (PDF/Imagem)</Label>
            <Input id="invoiceFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
            {invoiceToEdit?.invoice_file_url && (
              <p className="text-sm text-muted-foreground mt-1">
                Arquivo atual: <a href={invoiceToEdit.invoice_file_url} target="_blank" rel="noopener noreferrer" className="underline">Ver arquivo</a>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="serviceType">Tipo de Serviço</Label>
            <Select value={serviceType} onValueChange={setServiceType} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            {invoiceToEdit ? 'Salvar Alterações' : 'Adicionar Nota Fiscal'}
          </Button>
        </form>
      </SheetContent>
      <AddClientSheet
        isOpen={isAddClientSheetOpen}
        onOpenChange={setIsAddClientSheetOpen}
        onSuccess={() => {
          fetchClients();
          setIsAddClientSheetOpen(false);
        }}
      />
    </Sheet>
  );
}