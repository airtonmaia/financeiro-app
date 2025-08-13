// app/dashboard/projects/page.tsx
// Página para listar e criar os Quadros de Projetos.

'use client'; 

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// --- TIPOS ---
type Quadro = {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  imagem_cover_url: string | null;
};

// --- COMPONENTES ---

function BoardCard({ board, onEdit, onDelete }: { board: Quadro; onEdit: (board: Quadro) => void; onDelete: (id: string) => void; }) {
    return (
        <div className="group relative rounded-lg overflow-hidden shadow-card transition-transform hover:-translate-y-1 border border-border">
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button variant="secondary" size="icon" onClick={(e) => { e.preventDefault(); onEdit(board); }} className="w-7 h-7" title="Editar Quadro">
                    <Edit className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={(e) => { e.preventDefault(); onDelete(board.id); }} className="w-7 h-7" title="Excluir Quadro">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
            <Link href={`/dashboard/projects/board/${board.id}`}>
                <div>
                    <div 
                        className="h-24 bg-cover bg-center" 
                        style={{ backgroundColor: board.cor, backgroundImage: board.imagem_cover_url ? `url(${board.imagem_cover_url})` : 'none' }}
                    />
                    <div className="bg-card p-4">
                        <h3 className="font-bold text-foreground truncate">{board.nome}</h3>
                        {board.descricao && <p className="text-sm text-muted-foreground truncate mt-1">{board.descricao}</p>}
                    </div>
                </div>
            </Link>
        </div>
    );
}

function BoardModal({ isOpen, onClose, onSave, boardToEdit }: { isOpen: boolean; onClose: () => void; onSave: (board: Partial<Quadro>) => void; boardToEdit: Quadro | null; }) {
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [cor, setCor] = useState('#3B82F6');

    const predefinedColors = [
        { name: 'Azul', value: '#3B82F6' }, { name: 'Roxo', value: '#8B5CF6' }, { name: 'Verde', value: '#22C55E' },
        { name: 'Vermelho', value: '#EF4444' }, { name: 'Amarelo', value: '#F59E0B' }, { name: 'Índigo', value: '#6366F1' },
    ];

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
    }, [boardToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: boardToEdit?.id, nome, descricao, cor });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-popover text-popover-foreground p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-6">{boardToEdit ? 'Editar Quadro' : 'Novo Quadro'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="board-name" className="block text-sm font-medium text-muted-foreground mb-1">Título*</label>
                        <Input type="text" id="board-name" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Digite o título do quadro" />
                    </div>
                    <div>
                        <label htmlFor="board-description" className="block text-sm font-medium text-muted-foreground mb-1">Descrição</label>
                        <Textarea id="board-description" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} placeholder="Descreva o propósito do quadro" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-muted-foreground mb-2">Cor do Quadro</label>
                         <div className="grid grid-cols-3 gap-2">
                             {predefinedColors.map(colorOption => (
                                 <button type="button" key={colorOption.name} onClick={() => setCor(colorOption.value)} className={`p-2 rounded-lg border-2 flex items-center gap-2 ${cor === colorOption.value ? 'border-primary' : 'border-border'}`}>
                                     <span className="w-5 h-5 rounded-full" style={{ backgroundColor: colorOption.value }}></span>
                                     <span className="text-sm">{colorOption.name}</span>
                                 </button>
                             ))}
                             <div className={`p-2 rounded-lg border-2 flex items-center gap-2 relative ${!predefinedColors.some(pc => pc.value === cor) ? 'border-primary' : 'border-border'}`}>
                                 <Input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="w-7 h-7 absolute opacity-0 cursor-pointer" />
                                 <span className="w-5 h-5 rounded-full" style={{ backgroundColor: cor }}></span>
                                 <span className="text-sm">Outra</span>
                             </div>
                         </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">{boardToEdit ? 'Salvar Alterações' : 'Criar Quadro'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- PÁGINA PRINCIPAL ---
export default function ProjectBoardsPage() {
  const [boards, setBoards] = useState<Quadro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState<Quadro | null>(null);
  const supabase = createSupabaseBrowserClient();

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('quadros').select('*').order('created_at');
    if (data) setBoards(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  const handleOpenNewModal = () => {
      setBoardToEdit(null);
      setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (board: Quadro) => {
      setBoardToEdit(board);
      setIsModalOpen(true);
  };

  const handleSaveBoard = async (boardData: Partial<Quadro>) => {
      if (boardToEdit) {
          await supabase.from('quadros').update({ nome: boardData.nome, descricao: boardData.descricao, cor: boardData.cor }).eq('id', boardToEdit.id);
      } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('quadros').insert({ nome: boardData.nome, descricao: boardData.descricao, cor: boardData.cor, user_id: user.id });
      }
      fetchBoards();
      setIsModalOpen(false);
  };
  
  const handleDeleteBoard = async (id: string) => {
      if (window.confirm("Tem certeza que deseja excluir este quadro? Todos os projetos dentro dele serão apagados.")) {
          await supabase.from('quadros').delete().eq('id', id);
          fetchBoards();
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-bold">Quadros de Projetos</h1>
              <p className="text-sm text-muted-foreground">Selecione um quadro para ver seus projetos.</p>
          </div>
          <Button onClick={handleOpenNewModal}><Plus className="w-4 h-4 mr-2" /> Novo Quadro</Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? <p className="text-muted-foreground">A carregar...</p> : boards.map(board => (
              <BoardCard key={board.id} board={board} onEdit={handleOpenEditModal} onDelete={handleDeleteBoard} />
          ))}
          <button 
            onClick={handleOpenNewModal}
            className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-accent transition-colors h-36"
          >
              <Plus className="w-6 h-6 mb-2" />
              <span className="font-semibold">Criar quadro</span>
          </button>
      </div>
      
      <BoardModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBoard}
        boardToEdit={boardToEdit}
      />
    </div>
  );
}