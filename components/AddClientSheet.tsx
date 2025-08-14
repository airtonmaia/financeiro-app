// components/AddClientSheet.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Client } from '@/types';

// Props atualizadas para aceitar um cliente para edição e controlar o estado de abertura
interface AddClientSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  clientToEdit?: Client | null;
  onSuccess: () => void;
}

// Estado inicial para um novo cliente
const initialState: Omit<Client, 'id' | 'created_at'> = {
  nome: '',
  empresa: '',
  email_contato: '',
  telefone: '',
  cpf_cnpj: '',
  website: '',
  origem: '',
};

export function AddClientSheet({ isOpen, onOpenChange, clientToEdit, onSuccess }: AddClientSheetProps) {
  const [clientData, setClientData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const isEditMode = !!clientToEdit;

  // Efeito para popular o formulário quando um cliente é passado para edição
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        // Garante que apenas os campos relevantes para o Client sejam usados
        const { id, created_at, ...rest } = clientToEdit;
        setClientData(rest);
      } else {
        setClientData(initialState);
      }
    }
  }, [isOpen, clientToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setClientData(prev => ({ ...prev, origem: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Erro: Usuário não autenticado.");
      setIsSubmitting(false);
      return;
    }

    // Cria um objeto com apenas os campos que devem ser enviados para o Supabase
    const dataToSave = {
      nome: clientData.nome,
      empresa: clientData.empresa,
      email_contato: clientData.email_contato,
      telefone: clientData.telefone,
      cpf_cnpj: clientData.cpf_cnpj,
      website: clientData.website,
      origem: clientData.origem,
      user_id: user.id, // Adiciona o user_id
    };

    let query;
    if (isEditMode) {
      // Modo Edição: Atualiza o cliente existente
      query = supabase
        .from('clientes')
        .update(dataToSave)
        .eq('id', clientToEdit.id);
    } else {
      // Modo Criação: Insere um novo cliente
      query = supabase
        .from('clientes')
        .insert([dataToSave]);
    }

    const { error: queryError } = await query;

    if (queryError) {
      setError(`Erro ao salvar cliente: ${queryError.message}`);
      console.error(queryError);
    } else {
      onSuccess(); // Callback para o pai (ex: re-fetch da lista)
      onOpenChange(false); // Fecha o sheet
    }
    setIsSubmitting(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Editar Cliente' : 'Adicionar novo Cliente'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Atualize os dados do cliente.' : 'Preencha os dados do novo cliente.'}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input id="nome" name="nome" value={clientData.nome} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="empresa" className="text-right">
                Empresa
              </Label>
              <Input id="empresa" name="empresa" value={clientData.empresa || ''} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email_contato" className="text-right">
                Email
              </Label>
              <Input id="email_contato" name="email_contato" type="email" value={clientData.email_contato} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone" className="text-right">
                Telefone
              </Label>
              <Input id="telefone" name="telefone" value={clientData.telefone} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpf_cnpj" className="text-right">
                CPF/CNPJ
              </Label>
              <Input id="cpf_cnpj" name="cpf_cnpj" value={clientData.cpf_cnpj || ''} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="website" className="text-right">
                Website
              </Label>
              <Input id="website" name="website" value={clientData.website || ''} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="origem" className="text-right">
                Origem
              </Label>
              <Select onValueChange={handleSelectChange} value={clientData.origem}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                  <SelectItem value="Organico">Orgânico</SelectItem>
                  <SelectItem value="Patrocinado">Patrocinado</SelectItem>
                  <SelectItem value="Redes sociais">Redes sociais</SelectItem>
                  <SelectItem value="Parceiro">Parceiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Cliente')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}