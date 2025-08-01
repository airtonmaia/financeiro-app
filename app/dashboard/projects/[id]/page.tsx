// app/dashboard/projects/[id]/page.tsx
// Página para exibir o quadro (Kanban/Lista) de projetos de uma pasta específica.

'use client'; 

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Project, type Subtask, type ProjectStatus } from '@/types'; 
import { Edit, Trash2, Plus, List, LayoutGrid, MoreHorizontal, Clock, CheckCircle2, GripVertical, Palette } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// --- COMPONENTES ---

function ProjectCard({ project, index, statusColor }: { project: Project & { subtasks: Subtask[] }, index: number, statusColor: string }) {
    const diasRestantes = Math.ceil((new Date(project.data_entrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const subtasksConcluidas = project.subtasks?.filter(st => st.concluida).length || 0;
    const totalSubtasks = project.subtasks?.length || 0;

    return (
        <Draggable draggableId={project.id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="bg-white dark:bg-dark-secondary rounded-xl shadow-card p-4 space-y-3"
                >
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                            {project.tipo_projeto}
                        </span>
                        <button className="text-gray-text"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>
                    <h4 className="font-bold text-dark-text dark:text-light-text">{project.descricao}</h4>
                    <p className="text-sm text-gray-text dark:text-gray-400 line-clamp-2">{project.observacao}</p>
                    
                    {totalSubtasks > 0 && (
                        <div className="text-sm text-gray-text flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{subtasksConcluidas} de {totalSubtasks} tarefas</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-light-tertiary dark:border-dark-tertiary">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white dark:border-dark-secondary"></div>
                            <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white dark:border-dark-secondary flex items-center justify-center text-xs font-bold">A</div>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-semibold ${diasRestantes < 0 ? 'text-danger-text' : 'text-gray-text'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Atrasado'}</span>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

function StatusManagerModal({ isOpen, onClose, initialStatuses, folderId, onStatusesChange }: { isOpen: boolean; onClose: () => void; initialStatuses: ProjectStatus[]; folderId: string; onStatusesChange: (newStatuses: ProjectStatus[]) => void; }) {
    const supabase = createSupabaseBrowserClient();
    const [statuses, setStatuses] = useState(initialStatuses);
    const [newStatusName, setNewStatusName] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('#808080');

    useEffect(() => { setStatuses(initialStatuses) }, [initialStatuses]);

    if (!isOpen) return null;

    const handleUpdateStatus = async (id: string, field: 'name' | 'color', value: string) => {
        await supabase.from('project_statuses').update({ [field]: value }).eq('id', id);
    };

    const handleAddStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStatusName.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('project_statuses')
            .insert({ name: newStatusName, color: newStatusColor, user_id: user.id, pasta_id: folderId, display_order: statuses.length + 1 })
            .select()
            .single();
        
        if (data) {
            const newStatuses = [...statuses, data];
            setStatuses(newStatuses);
            onStatusesChange(newStatuses);
            setNewStatusName('');
            setNewStatusColor('#808080');
        }
    };
    
    const handleDeleteStatus = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este status?")) {
            await supabase.from('project_statuses').delete().eq('id', id);
            const newStatuses = statuses.filter(s => s.id !== id);
            setStatuses(newStatuses);
            onStatusesChange(newStatuses);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const newStatuses = Array.from(statuses);
        const [reorderedItem] = newStatuses.splice(result.source.index, 1);
        newStatuses.splice(result.destination.index, 0, reorderedItem);
        
        setStatuses(newStatuses);
        onStatusesChange(newStatuses);
        
        const updates = newStatuses.map((status, index) => 
            supabase.from('project_statuses').update({ display_order: index + 1 }).eq('id', status.id)
        );
        await Promise.all(updates);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-secondary p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-6">Personalizar Colunas do Quadro</h2>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="statuses">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mb-4">
                                {statuses.map((status, index) => (
                                    <Draggable key={status.id} draggableId={status.id} index={index}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-center gap-2 bg-gray-50 dark:bg-dark-tertiary p-2 rounded-lg">
                                                <div {...provided.dragHandleProps} className="cursor-grab text-gray-400">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <input type="color" value={status.color} onChange={(e) => handleUpdateStatus(status.id, 'color', e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
                                                <input type="text" defaultValue={status.name} onBlur={(e) => handleUpdateStatus(status.id, 'name', e.target.value)} className="flex-1 bg-transparent text-sm focus:outline-none" />
                                                <button onClick={() => handleDeleteStatus(status.id)} className="text-gray-text hover:text-danger-text p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <form onSubmit={handleAddStatus} className="flex gap-2">
                    <input type="color" value={newStatusColor} onChange={(e) => setNewStatusColor(e.target.value)} className="w-10 h-10 p-0 border-none rounded-lg cursor-pointer bg-transparent" />
                    <input type="text" value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="Nova coluna..." className="flex-1 p-2 bg-gray-50 dark:bg-dark-tertiary border border-light-tertiary dark:border-dark-tertiary rounded-lg" />
                    <button type="submit" className="bg-brand-primary text-white font-semibold p-2 rounded-lg"><Plus className="w-5 h-5" /></button>
                </form>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-dark-tertiary font-semibold py-2 px-6 rounded-lg">Fechar</button>
                </div>
            </div>
        </div>
    );
}


// --- PÁGINA PRINCIPAL ---
export default function ProjectBoardPage() {
  const params = useParams();
  const folderId = params.id as string;

  const [folderName, setFolderName] = useState('');
  const [projects, setProjects] = useState<(Project & { subtasks: Subtask[] })[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const fetchData = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);

    const { data: folderData } = await supabase.from('pastas_projetos').select('nome').eq('id', folderId).single();
    if (folderData) setFolderName(folderData.nome);
    
    const { data: statusesData } = await supabase.from('project_statuses').select('*').eq('pasta_id', folderId).order('display_order');
    if (statusesData) setStatuses(statusesData);

    const { data: projectsData } = await supabase
        .from('projetos')
        .select('*, clientes ( nome ), subtarefas (*)')
        .eq('pasta_id', folderId)
        .order('created_at', { ascending: false });

    if (projectsData) setProjects(projectsData as (Project & { subtasks: Subtask[] })[]);
    
    setLoading(false);
  }, [supabase, folderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;

    if (type === 'COLUMN') {
        const newStatuses = Array.from(statuses);
        const [reorderedItem] = newStatuses.splice(source.index, 1);
        newStatuses.splice(destination.index, 0, reorderedItem);
        
        setStatuses(newStatuses);
        
        const updates = newStatuses.map((status, index) => 
            supabase.from('project_statuses').update({ display_order: index + 1 }).eq('id', status.id)
        );
        await Promise.all(updates);
        return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    
    const updatedProjects = projects.map(p => 
        p.id === draggableId ? { ...p, status_entrega: newStatus } : p
    );
    setProjects(updatedProjects);

    await supabase.from('projetos').update({ status_entrega: newStatus }).eq('id', draggableId);
  };
  
  const handleDeleteProject = async (id: string) => {
      if (window.confirm("Tem a certeza de que quer apagar este projeto?")) {
          await supabase.from('projetos').delete().eq('id', id);
          fetchData();
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-bold">{folderName || 'Carregando...'}</h1>
              <p className="text-sm text-gray-text">Visualize e gerencie os projetos desta pasta.</p>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={() => setIsStatusModalOpen(true)} className="p-2 rounded-lg text-gray-text hover:bg-gray-100" title="Personalizar Quadro">
                  <Palette className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-brand-primary/20 text-brand-primary' : 'text-gray-text hover:bg-gray-100'}`}><List className="w-5 h-5" /></button>
              <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg ${viewMode === 'kanban' ? 'bg-brand-primary/20 text-brand-primary' : 'text-gray-text hover:bg-gray-100'}`}><LayoutGrid className="w-5 h-5" /></button>
              <Link href={`/dashboard/projects/new?folderId=${folderId}`}>
                <button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Novo Projeto
                </button>
              </Link>
          </div>
      </div>
      
      <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-card">
        {loading && <p className="p-5 text-center text-gray-text">A carregar projetos...</p>}
        
        {!loading && viewMode === 'kanban' && (
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="p-4 flex gap-4 overflow-x-auto"
                        >
                            {statuses.map((status, index) => {
                                const columnProjects = projects.filter(p => p.status_entrega === status.name);
                                return (
                                    <Draggable draggableId={status.id} index={index} key={status.id}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="w-80 flex-shrink-0"
                                            >
                                                <Droppable droppableId={status.name} type="CARD">
                                                    {(providedDroppable) => (
                                                        <div
                                                            ref={providedDroppable.innerRef}
                                                            {...providedDroppable.droppableProps}
                                                            className="bg-gray-100 dark:bg-dark-tertiary rounded-lg p-3 min-h-[200px]"
                                                        >
                                                            <h4 className="font-semibold mb-3 px-1 flex items-center gap-2" {...provided.dragHandleProps}>
                                                                <GripVertical className="w-4 h-4 text-gray-400" />
                                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></span>
                                                                {status.name} ({columnProjects.length})
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {columnProjects.map((project, index) => (
                                                                    <ProjectCard key={project.id} project={project} index={index} statusColor={status.color} />
                                                                ))}
                                                                {providedDroppable.placeholder}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        )}
      </div>

      <StatusManagerModal 
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        initialStatuses={statuses}
        folderId={folderId}
        onStatusesChange={(newStatuses) => setStatuses(newStatuses)}
      />
    </div>
  );
}
