'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuadro, updateQuadro } from '@/app/actions/quadro-actions';

type Quadro = {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  imagem_cover_url: string | null;
};

interface BoardFormProps {
  boardToEdit: Quadro | null;
  onSave: () => void;
}

const predefinedColors = [
    { name: 'Azul', value: '#3B82F6' }, { name: 'Roxo', value: '#8B5CF6' }, { name: 'Verde', value: '#22C55E' },
    { name: 'Vermelho', value: '#EF4444' }, { name: 'Amarelo', value: '#F59E0B' }, { name: 'Índigo', value: '#6366F1' },
];

export function BoardForm({ boardToEdit, onSave }: BoardFormProps) {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState(predefinedColors[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (boardToEdit) {
      setNome(boardToEdit.nome);
      setDescricao(boardToEdit.descricao || '');
      setCor(boardToEdit.cor);
    } else {
      setNome('');
      setDescricao('');
      setCor(predefinedColors[0].value);
    }
  }, [boardToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (boardToEdit) {
        await updateQuadro(boardToEdit.id, { nome, descricao, cor });
      } else {
        await createQuadro({ nome, descricao, cor });
      }
      router.refresh();
      onSave();
    } catch (error) {
      console.error("Falha ao salvar o quadro:", error);
      // Idealmente, mostrar um toast de erro para o usuário
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="board-name">Título*</Label>
        <Input id="board-name" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Projeto Phoenix" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="board-description">Descrição</Label>
        <Textarea id="board-description" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} placeholder="Descreva o propósito deste quadro" />
      </div>
      <div className="space-y-2">
        <Label>Cor do Quadro</Label>
        <div className="grid grid-cols-3 gap-2">
          {predefinedColors.map(colorOption => (
            <Button type="button" key={colorOption.name} onClick={() => setCor(colorOption.value)} variant="outline" className={`flex items-center gap-2 ${cor === colorOption.value ? 'border-primary' : ''}`}>
              <span className="w-5 h-5 rounded-full" style={{ backgroundColor: colorOption.value }}></span>
              <span>{colorOption.name}</span>
            </Button>
          ))}
          <div className="relative">
            <Label htmlFor="color-picker" className={`border-2 rounded-lg flex items-center gap-2 p-2 cursor-pointer ${!predefinedColors.some(pc => pc.value === cor) ? 'border-primary' : 'border-border'}`}>
                <span className="w-5 h-5 rounded-full" style={{ backgroundColor: cor }}></span>
                <span>Outra</span>
            </Label>
            <Input
              id="color-picker"
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="ghost" onClick={onSave} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (boardToEdit ? 'Salvar Alterações' : 'Criar Quadro')}
        </Button>
      </div>
    </form>
  );
}
