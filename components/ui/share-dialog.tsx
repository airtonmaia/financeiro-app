'use client';

import { useState } from 'react';
import { Check, Copy, Globe2 } from 'lucide-react';
import { Button } from './button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Switch } from './switch';
import { Input } from './input';
import { Label } from './label';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

interface ShareDialogProps {
  boardId: string;
  isPublic: boolean;
  onVisibilityChange: (isPublic: boolean) => void;
}

export function ShareDialog({ boardId, isPublic, onVisibilityChange }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const pathname = usePathname();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = origin ? `${origin}/public/board/${boardId}` : '';

  const handleVisibilityChange = async (checked: boolean) => {
    try {
      console.log('Mudando visibilidade para:', checked);
      console.log('Board ID:', boardId);
      setLoading(true);
      
      // Primeiro, verifica se o usuário é o dono do quadro
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      // Busca o quadro para verificar se o usuário tem permissão
      const { data: board } = await supabase
        .from('quadros')
        .select('user_id')
        .eq('id', boardId)
        .single();

      if (!board) {
        throw new Error('Quadro não encontrado');
      }

      if (board.user_id !== user.user.id) {
        throw new Error('Você não tem permissão para editar este quadro');
      }

      // Atualiza a visibilidade
      const { data, error } = await supabase
        .from('quadros')
        .update({ is_public: checked })
        .eq('id', boardId)
        .select();
      
      console.log('Resposta do Supabase:', { data, error });
      
      if (error) {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao atualizar a visibilidade do quadro');
      } else {
        onVisibilityChange(checked);
        console.log('Visibilidade atualizada com sucesso');
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar a visibilidade do quadro');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Globe2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar quadro</DialogTitle>
          <DialogDescription>
            Qualquer pessoa com o link poderá visualizar este quadro quando público.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="visibility" className="font-normal">
              Tornar quadro público
            </Label>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="visibility">
                  Compartilhar com qualquer pessoa
                </Label>
                <p className="text-sm text-muted-foreground">
                  Qualquer pessoa poderá visualizar os cards deste quadro
                </p>
              </div>
              <div className="relative">
                <Switch
                  id="visibility"
                  checked={isPublic}
                  onCheckedChange={handleVisibilityChange}
                  disabled={loading}
                />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {isPublic && (
          <>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <Input
                  id="link"
                  defaultValue={publicUrl}
                  readOnly
                  className="h-9"
                />
              </div>
              <Button 
                type="button" 
                size="sm" 
                className="px-3" 
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copiar link</span>
              </Button>
            </div>
            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
