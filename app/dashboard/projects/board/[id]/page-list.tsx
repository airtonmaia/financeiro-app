// app/dashboard/projects/board/[id]/page-list.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Project } from '@/types';
import { BasicTable } from '@/components/ui/basic-table';

interface ProjectListPageProps {
  boardId: string;
}

export default function ProjectListPage({ boardId }: ProjectListPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projetos')
      .select('*, clientes(nome)') // Seleciona o nome do cliente associado
      .eq('quadro_id', boardId) // Filtra por boardId
      .order('created_at', { ascending: false });

    if (error) {
      setError(`Erro ao carregar projetos: ${error.message}`);
      console.error(error);
    } else {
      setProjects(data as Project[]); // Garante que o tipo está correto
    }
    setLoading(false);
  }, [supabase, boardId]); // Adiciona boardId como dependência

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteProject = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', id);

      if (error) {
        alert(`Erro ao excluir projeto: ${error.message}`);
      } else {
        fetchProjects(); // Re-fetch para atualizar a lista
      }
    }
  };

  if (error) {
    return <div className="p-5 text-center text-destructive bg-destructive/10 rounded-lg">{error}</div>;
  }

  const columns = [
    { header: "Projeto", accessor: "descricao" },
    { header: "Status", accessor: "status_entrega" },
    { header: "Data de Entrega", accessor: "data_entrega" },
    { header: "Valor", accessor: "valor_total" },
  ];

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-2xl font-bold mb-4">Lista de Projetos</h2>
      {loading ? (
        <p className="p-5 text-center text-muted-foreground">Carregando projetos...</p>
      ) : (
        <BasicTable columns={columns} data={projects} />
      )}
    </div>
  );
}
