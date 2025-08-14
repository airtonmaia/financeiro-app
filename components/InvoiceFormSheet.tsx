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
import { type Client } from '@/types'; // Assuming Client type is defined here
import { AddClientSheet } from '@/components/AddClientSheet'; // Import AddClientSheet
import { Plus } from 'lucide-react'; // Import Plus icon

// For Combobox (Client selection) - will need to implement this
// For File input (Invoice file) - will need to implement this

interface InvoiceFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  invoiceToEdit?: any; // TODO: Define Invoice type for editing
}

export function InvoiceFormSheet({ isOpen, onClose, onSave, invoiceToEdit }: InvoiceFormSheetProps) {
  const supabase = createSupabaseBrowserClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [issueDate, setIssueDate] = useState('');
  const [isIssued, setIsIssued] = useState(false); // Corresponds to Status de emissão
  const [value, setValue] = useState<number | ''>('');
  const [serviceType, setServiceType] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null); // For file upload
  const [isRecurring, setIsRecurring] = useState(false); // New state for recurrence
  const [isAddClientSheetOpen, setIsAddClientSheetOpen] = useState(false); // New state for AddClientSheet

  const serviceTypes = [
    'Hospedagem',
    'Social Mídia',
    'Criação de site',
    'Criação de logo',
    'Suporte',
    'Outros',
  ];

  // Fetch clients for the combobox
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
      // Populate form if editing an existing invoice
      if (invoiceToEdit) {
        setSelectedClient(invoiceToEdit.cliente_id);
        setIssueDate(invoiceToEdit.data_emissao);
        setIsIssued(invoiceToEdit.status_emissao === 'Emitido');
        setValue(invoiceToEdit.value);
        setServiceType(invoiceToEdit.service_type);
        setIsRecurring(invoiceToEdit.is_recurring || false); // Initialize isRecurring
        // For file, we might just display the URL or allow re-upload
      } else {
        // Reset form for new invoice
        setSelectedClient('');
        setIssueDate('');
        setIsIssued(false);
        setValue('');
        setServiceType('');
        setInvoiceFile(null);
        setIsRecurring(false); // Reset isRecurring for new invoice
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

    // setLoading(true); // Assuming a loading state in parent or here
    let invoiceFileUrl: string | null = invoiceToEdit?.invoice_file_url || null;

    // Upload file if a new one is selected
    if (invoiceFile) {
      const fileExtension = invoiceFile.name.split('.').pop();
      // Get user ID for file path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuário não autenticado para upload de arquivo.');
        // setLoading(false);
        return;
      }
      const filePath = `${user.id}/${Date.now()}.${fileExtension}`; // Unique path
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices') // Assuming a bucket named 'invoices'
        .upload(filePath, invoiceFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        alert(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
        // setLoading(false);
        return;
      }
      invoiceFileUrl = uploadData?.path ? supabase.storage.from('invoices').getPublicUrl(uploadData.path).data.publicUrl : null;
    }

    const invoiceData = {
      cliente_id: selectedClient,
      data_emissao: issueDate,
      status_emissao: isIssued ? 'Emitido' : 'Pendente',
      valor: Number(value),
      tipo_servico: serviceType,
      invoice_file_url: invoiceFileUrl,
      is_recurring: isRecurring, // Add this line
    };

    if (invoiceToEdit) {
      // Update existing invoice
      const { error } = await supabase.from('notas_fiscais').update(invoiceData).eq('id', invoiceToEdit.id);
      if (error) {
        console.error('Error updating invoice:', error);
        alert(`Erro ao atualizar nota fiscal: ${error.message}`);
      } else {
        onSave(); // Trigger re-fetch in parent
      }
    } else {
      // Insert new invoice
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuário não autenticado para salvar nota fiscal.');
        // setLoading(false);
        return;
      }
      const { error } = await supabase.from('notas_fiscais').insert({ ...invoiceData, user_id: user.id });
      if (error) {
        console.error('Error inserting invoice:', error);
        alert(`Erro ao adicionar nota fiscal: ${error.message}`);
      } else {
        onSave(); // Trigger re-fetch in parent
      }
    }
    // setLoading(false);
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
          {/* Client Combobox (TODO: Implement Shadcn Combobox) */}
          <div>
            <Label htmlFor="client">Cliente</Label>
            <div className="flex gap-2"> {/* Add a flex container */}
              <Select value={selectedClient} onValueChange={setSelectedClient}>
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

          {/* Data de emissão */}
          <div>
            <Label htmlFor="issueDate">Data de Emissão</Label>
            <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          </div>

          {/* Status de emissão */}
          <div className="flex items-center space-x-2">
            <Switch id="status" checked={isIssued} onCheckedChange={setIsIssued} />
            <Label htmlFor="status">Nota Fiscal Emitida</Label>
          </div>

          {/* Recorrência Switch */}
          <div className="flex items-center space-x-2">
            <Switch id="recorrencia" checked={isRecurring} onCheckedChange={setIsRecurring} />
            <Label htmlFor="recorrencia">Recorrência</Label>
          </div>

          {/* Valor */}
          <div>
            <Label htmlFor="value">Valor (R$)</Label>
            <Input id="value" type="number" step="0.01" value={value} onChange={(e) => setValue(Number(e.target.value))} required />
          </div>

          {/* Nota fiscal (File input) */}
          <div>
            <Label htmlFor="invoiceFile">Nota Fiscal (PDF/Imagem)</Label>
            <Input id="invoiceFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
            {invoiceToEdit?.invoice_file_url && (
              <p className="text-sm text-muted-foreground mt-1">
                Arquivo atual: <a href={invoiceToEdit.invoice_file_url} target="_blank" rel="noopener noreferrer" className="underline">Ver arquivo</a>
              </p>
            )}
          </div>

          {/* Tipo de serviço */}
          <div>
            <Label htmlFor="serviceType">Tipo de Serviço</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
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
        onOpenChange={setIsAddClientSheetOpen} // Use onOpenChange to control sheet visibility
        onSuccess={() => {
          fetchClients(); // Re-fetch clients after a new one is added
          setIsAddClientSheetOpen(false); // Close the AddClientSheet
        }}
      />
    </Sheet>
  );
}
