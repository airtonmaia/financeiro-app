// app/dashboard/projects/page.tsx
// Página para listar e criar os Quadros de Projetos.

'use client'; 

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Plus, Edit, Trash2 } from 'lucide-react';

// --- TIPOS ---
type Quadro = {
  id: string;
  nome: string;
  cor: string;
  imagem_cover_url: string | null;
};

// --- COMPONENTES ---

function BoardCard({ board, onEdit, onDelete }: { board: Quadro; onEdit: (board: Quadro) => void; onDelete: (id: string) => void; }) {
    return (
        <div className="group relative rounded-lg overflow-hidden shadow-card transition-transform hover:-translate-y-1 border border-light-tertiary dark:border-dark-tertiary">
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={(e) => { e.preventDefault(); onEdit(board); }} className="p-1.5 bg-white/80 hover:bg-white rounded-md text-dark-text" title="Editar Quadro">
                    <Edit className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.preventDefault(); onDelete(board.id); }} className="p-1.5 bg-white/80 hover:bg-white rounded-md text-danger-text" title="Excluir Quadro">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <Link href={`/dashboard/projects/board/${board.id}`}>
                <div>
                    <div 
                        className="h-24 bg-cover bg-center" 
                        style={{ backgroundColor: board.cor, backgroundImage: board.imagem_cover_url ? `url(${board.imagem_cover_url})` : 'none' }}
                    />
                    <div className="bg-light-secondary dark:bg-dark-secondary p-4">
                        <h3 className="font-bold text-dark-text dark:text-light-text truncate">{board.nome}</h3>
                    </div>
                </div>
            </Link>
        </div>
    );
}

function BoardModal({ isOpen, onClose, onSave, boardToEdit }: { isOpen: boolean; onClose: () => void; onSave: (board: Partial<Quadro>) => void; boardToEdit: Quadro | null; }) {
    const [nome, setNome] = useState('');
    const [cor, setCor] = useState('#6B7280');

    useEffect(() => {
        if (boardToEdit) {
            setNome(boardToEdit.nome);
            setCor(boardToEdit.cor);
        } else {
            setNome('');
            setCor('#6B7280');
        }
    }, [boardToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: boardToEdit?.id, nome, cor });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-6">{boardToEdit ? 'Editar Quadro' : 'Criar Novo Quadro'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="board-name" className="block text-sm font-medium text-gray-text mb-1">Nome do Quadro*</label>
                        <input type="text" id="board-name" value={nome} onChange={(e) => setNome(e.target.value)} required className="w-full p-2 bg-gray-50 dark:bg-dark-tertiary border rounded-lg" />
                    </div>
                    <div>
                        <label htmlFor="board-color" className="block text-sm font-medium text-gray-text mb-1">Cor</label>
                        <input type="color" id="board-color" value={cor} onChange={(e) => setCor(e.target.value)} className="w-full h-10 p-1 bg-gray-50 dark:bg-dark-tertiary border rounded-lg cursor-pointer" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-dark-tertiary font-semibold py-2 px-6 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg">Salvar</button>
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

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleOpenNewModal = () => {
      setBoardToEdit(null);
      setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (board: Quadro) => {
      setBoardToEdit(board);
      setIsModalOpen(true);
  };

  const handleSaveBoard = async (boardData: Partial<Quadro>) => {
      if (boardToEdit) { // Editando
          const { error } = await supabase.from('quadros').update({ nome: boardData.nome, cor: boardData.cor }).eq('id', boardToEdit.id);
          if (!error) fetchBoards();
      } else { // Criando
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { error } = await supabase.from('quadros').insert({ nome: boardData.nome, cor: boardData.cor, user_id: user.id });
          if (!error) fetchBoards();
      }
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
              <p className="text-sm text-gray-text">Selecione um quadro para ver seus projetos.</p>
          </div>
          <button onClick={handleOpenNewModal} className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Quadro
          </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? <p>A carregar...</p> : boards.map(board => (
              <BoardCard key={board.id} board={board} onEdit={handleOpenEditModal} onDelete={handleDeleteBoard} />
          ))}
          <button 
            onClick={handleOpenNewModal}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-text hover:bg-gray-50 dark:hover:bg-dark-tertiary transition-colors h-36"
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
