'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BoardForm } from './BoardForm';
import { deleteQuadro } from '@/app/actions/quadro-actions';
import { useRouter } from 'next/navigation';

type Quadro = {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  imagem_cover_url: string | null;
};

function BoardCard({ board, onEditClick }: { board: Quadro; onEditClick: () => void; }) {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteQuadro(board.id);
      router.refresh();
    } catch (error) {
      console.error("Falha ao deletar o quadro:", error);
      // Adicionar um toast de erro aqui seria ideal
    }
  };

  return (
    <div className="group relative rounded-lg overflow-hidden shadow-card transition-transform hover:-translate-y-1 border border-border">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button variant="secondary" size="icon" onClick={onEditClick} className="w-7 h-7" title="Editar Quadro">
          <Edit className="w-4 h-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="w-7 h-7" title="Excluir Quadro">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o quadro e todos os projetos associados a ele.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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


export function ProjectActions({ boards }: { boards: Quadro[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState<Quadro | null>(null);

  const handleOpenNewModal = () => {
    setBoardToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (board: Quadro) => {
    setBoardToEdit(board);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quadros de Projetos</h1>
          <p className="text-sm text-muted-foreground">Selecione um quadro para ver seus projetos.</p>
        </div>
        <Button onClick={handleOpenNewModal}><Plus className="w-4 h-4 mr-2" /> Novo Quadro</Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {boards.map(board => (
            <BoardCard key={board.id} board={board} onEditClick={() => handleOpenEditModal(board)} />
          ))}
          <DialogTrigger asChild>
            <button
              className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-accent transition-colors h-36"
            >
              <Plus className="w-6 h-6 mb-2" />
              <span className="font-semibold">Criar quadro</span>
            </button>
          </DialogTrigger>
        </div>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{boardToEdit ? 'Editar Quadro' : 'Novo Quadro'}</DialogTitle>
          </DialogHeader>
          <BoardForm boardToEdit={boardToEdit} onSave={closeModal}/>
        </DialogContent>
      </Dialog>
    </>
  );
}
