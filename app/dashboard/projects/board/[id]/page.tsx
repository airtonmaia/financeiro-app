// app/dashboard/projects/board/[id]/page.tsx
// Página que exibe o Kanban e o painel lateral para detalhes/edição.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Project, type Subtask, type ProjectStatus, type Client, type Categoria, type Quadro } from '@/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import SlideOverPanel from '@/components/ui/SlideOverPanel';
import { Plus, List, LayoutGrid, Palette, GripVertical, MoreHorizontal, Clock, CheckCircle2, Edit, Trash2, Eye, Move, CheckSquare, Square } from 'lucide-react';

// --- COMPONENTES ---

// Componente para um cartão de projeto (Modo Kanban)
function ProjectCard({ project, statusColor, onOpen, onEdit, onMove, onDelete }: { project: Project & { subtasks: Subtask[] }; statusColor: string; onOpen: () => void; onEdit: () => void; onMove: () => void; onDelete: () => void; }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const diasRestantes = Math.ceil((new Date(project.data_entrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const subtasksConcluidas = project.subtasks?.filter(st => st.concluida).length || 0;
    const totalSubtasks = project.subtasks?.length || 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
        setIsMenuOpen(false);
    };

    return (
        <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-card p-4 space-y-3 cursor-pointer" onClick={onOpen}>
            <div className="flex justify-between items-center">
                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                    {project.tipo_projeto}
                </span>
                <div className="relative" ref={menuRef}>
                    <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-dark-tertiary">
                        <MoreHorizontal className="w-4 h-4 text-gray-text" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-secondary rounded-lg shadow-xl z-10 border border-light-tertiary dark:border-dark-tertiary">
                            <button onClick={(e) => handleActionClick(e, onOpen)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-dark-text dark:text-light-text hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                                <Eye className="w-4 h-4" /> Abrir Projeto
                            </button>
                            <button onClick={(e) => handleActionClick(e, onEdit)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-dark-text dark:text-light-text hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                                <Edit className="w-4 h-4" /> Editar Projeto
                            </button>
                             <button onClick={(e) => handleActionClick(e, onMove)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-dark-text dark:text-light-text hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                                <Move className="w-4 h-4" /> Mover para...
                            </button>
                            <div className="border-t border-light-tertiary dark:border-dark-tertiary my-1"></div>
                            <button onClick={(e) => handleActionClick(e, onDelete)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-danger-text hover:bg-red-100 dark:hover:bg-red-900/50">
                                <Trash2 className="w-4 h-4" /> Excluir
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <h4 className="font-bold text-dark-text dark:text-light-text">{project.descricao}</h4>
            <p className="text-sm text-gray-text dark:text-gray-400 line-clamp-2">{project.observacao}</p>
            
            {totalSubtasks > 0 && (
                <div className="text-sm text-gray-text flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{subtasksConcluidas} de {totalSubtasks} tarefas</span>
                </div>
            )}
        </div>
    );
}

// Formulário completo para Adicionar/Editar Projetos
function ProjectForm({ boardId, project, statuses, onSave, onCancel }: { boardId: string; project: Partial<Project> | null; statuses: ProjectStatus[]; onSave: () => void; onCancel: () => void; }) {
    const supabase = createSupabaseBrowserClient();
    const [clients, setClients] = useState<Client[]>([]);
    const [projectCategories, setProjectCategories] = useState<Categoria[]>([]);
    
    const [nome_projeto, setNomeProjeto] = useState(project?.descricao || '');
    const [cliente_id, setClienteId] = useState(project?.cliente_id || '');
    const [tipo_projeto, setTipoProjeto] = useState(project?.tipo_projeto || '');
    const [data_entrega, setDataEntrega] = useState(project?.data_entrega ? new Date(project.data_entrega).toISOString().split('T')[0] : '');
    const [status_entrega, setStatusEntrega] = useState(project?.status_entrega || (statuses && statuses.length > 0 ? statuses[0].name : ''));
    const [descricao, setDescricao] = useState(project?.observacao || '');
    
    const [integrar_financeiro, setIntegrarFinanceiro] = useState(!!project?.valor_total);
    const [valor_total, setValorTotal] = useState<number | ''>(project?.valor_total || '');
    const [forma_pagamento, setFormaPagamento] = useState(project?.detalhes_pagamento?.tipo || 'À Vista');
    const [entrada_recebida, setEntradaRecebida] = useState(false);
    const [assinatura, setAssinatura] = useState(project?.assinatura || false);
    const [data_pagamento, setDataPagamento] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: clientsData } = await supabase.from('clientes').select('id, nome');
            if (clientsData) setClients(clientsData as Client[]);

            const { data: categoriesData } = await supabase.from('categorias').select('*').eq('tipo', 'projeto');
            if (categoriesData) setProjectCategories(categoriesData as Categoria[]);
        };
        fetchData();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const projectData = {
            descricao: nome_projeto,
            cliente_id: cliente_id || null,
            tipo_projeto,
            data_entrega,
            status_entrega,
            observacao: descricao,
            valor_total: integrar_financeiro ? Number(valor_total) : null,
            assinatura,
            detalhes_pagamento: integrar_financeiro ? { tipo: forma_pagamento, parcelas: [] } : null,
            status_pagamento: integrar_financeiro ? (entrada_recebida ? 'Parcialmente pago' : 'Pendente') : null,
        };

        if (project?.id) {
            await supabase.from('projetos').update(projectData).eq('id', project.id);
        } else {
            await supabase.from('projetos').insert({ ...projectData, user_id: user.id, quadro_id: boardId });
        }
        onSave();
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 space-y-6 p-6 overflow-y-auto">
                <div className="space-y-4">
                    <h4 className="font-semibold text-md border-b pb-2">Detalhes do projeto</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-text mb-1">Nome do projeto*</label>
                        <input type="text" value={nome_projeto} onChange={(e) => setNomeProjeto(e.target.value)} required className="w-full p-2 bg-gray-50 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-text mb-1">Cliente</label>
                        <select value={cliente_id} onChange={(e) => setClienteId(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg">
                            <option value="">Selecione um cliente</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-text mb-1">Tipo de projeto*</label>
                            <select value={tipo_projeto} onChange={(e) => setTipoProjeto(e.target.value)} required className="w-full p-2 bg-gray-50 border rounded-lg">
                                <option value="">Selecione um tipo</option>
                                {projectCategories.map(cat => <option key={cat.id} value={cat.nome}>{cat.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-text mb-1">Previsão de entrega*</label>
                            <input type="date" value={data_entrega} onChange={(e) => setDataEntrega(e.target.value)} required className="w-full p-2 bg-gray-50 border rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-text mb-1">Status do projeto*</label>
                        <select value={status_entrega} onChange={(e) => setStatusEntrega(e.target.value)} required className="w-full p-2 bg-gray-50 border rounded-lg">
                            {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-text mb-1">Descrição</label>
                        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="w-full p-2 bg-gray-50 border rounded-lg" />
                    </div>
                </div>

                <div className="flex items-center justify-between border-t pt-6">
                    <label className="font-semibold text-md">Integrar com o financeiro?</label>
                    <button type="button" onClick={() => setIntegrarFinanceiro(!integrar_financeiro)} className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${integrar_financeiro ? 'bg-brand-primary' : 'bg-gray-300'}`}>
                        <span className={`w-4 h-4 bg-white rounded-full transition-transform ${integrar_financeiro ? 'transform translate-x-6' : ''}`}></span>
                    </button>
                </div>

                {integrar_financeiro && (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-md border-b pb-2">Detalhes financeiros</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-text mb-1">Valor Total (R$)</label>
                                <input type="number" value={valor_total} onChange={(e) => setValorTotal(Number(e.target.value))} className="w-full p-2 bg-gray-50 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-text mb-1">Forma de Pagamento</label>
                                <select value={forma_pagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg">
                                    <option>À Vista</option>
                                    <option>50/50</option>
                                    <option>Parcelado</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-text mb-1">Data do pagamento</label>
                            <input type="date" value={data_pagamento} onChange={(e) => setDataPagamento(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg" />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm">Você recebeu a entrada?</label>
                            <button type="button" onClick={() => setEntradaRecebida(!entrada_recebida)} className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${entrada_recebida ? 'bg-brand-primary' : 'bg-gray-300'}`}>
                                <span className={`w-4 h-4 bg-white rounded-full transition-transform ${entrada_recebida ? 'transform translate-x-6' : ''}`}></span>
                            </button>
                        </div>
                         <div className="flex items-center justify-between">
                            <label className="text-sm">Este projeto é uma assinatura?</label>
                            <button type="button" onClick={() => setAssinatura(!assinatura)} className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${assinatura ? 'bg-brand-primary' : 'bg-gray-300'}`}>
                                <span className={`w-4 h-4 bg-white rounded-full transition-transform ${assinatura ? 'transform translate-x-6' : ''}`}></span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-4 p-6 border-t border-light-tertiary dark:border-dark-tertiary flex-shrink-0">
                 <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-dark-tertiary font-semibold py-2 px-6 rounded-lg">Cancelar</button>
                 <button type="submit" disabled={loading} className="bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg">{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </form>
    );
}

function ProjectDetailView({ project }: { project: Project & { subtasks: Subtask[] } }) {
    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                    <p className="text-gray-text">Cliente</p>
                    <p className="font-semibold">{project.clientes?.nome || 'N/A'}</p>
                </div>
                 <div>
                    <p className="text-gray-text">Tipo de Tarefa</p>
                    <p className="font-semibold">{project.tipo_projeto}</p>
                </div>
                 <div>
                    <p className="text-gray-text">Data de Entrega</p>
                    <p className="font-semibold">{new Date(project.data_entrega).toLocaleDateString()}</p>
                </div>
                 <div>
                    <p className="text-gray-text">Valor do Projeto</p>
                    <p className="font-semibold">{project.valor_total ? `R$ ${project.valor_total.toFixed(2)}` : 'N/A'}</p>
                </div>
            </div>
            <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Descrição</h4>
                <p className="text-sm text-gray-text">{project.observacao}</p>
            </div>
             <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Tarefas</h4>
                <div className="space-y-2">
                    {project.subtasks?.map(task => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                            {task.concluida ? <CheckSquare className="w-4 h-4 text-brand-primary" /> : <Square className="w-4 h-4 text-gray-text" />}
                            <span className={task.concluida ? 'line-through text-gray-text' : ''}>{task.nome}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatusManagerModal({ isOpen, onClose, initialStatuses, folderId, onStatusesChange }: { isOpen: boolean; onClose: () => void; initialStatuses: ProjectStatus[]; folderId: string; onStatusesChange: (newStatuses: ProjectStatus[]) => void; }) {
    // ... (código do StatusManagerModal)
}

function MoveProjectModal({ isOpen, onClose, onMove, currentBoardId, projectToMove }: { isOpen: boolean; onClose: () => void; onMove: (newBoardId: string) => void; currentBoardId: string; projectToMove: Project | null; }) {
    // ... (código do MoveProjectModal)
}

// --- PÁGINA PRINCIPAL ---
export default function BoardPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const boardId = params.id as string;
    
    const viewMode = searchParams.get('view');
    const currentProjectId = searchParams.get('projectId');

    const [projects, setProjects] = useState<(Project & { subtasks: Subtask[] })[]>([]);
    const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
    const [boardName, setBoardName] = useState('');
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseBrowserClient();
    
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [projectToMove, setProjectToMove] = useState<Project | null>(null);

    const fetchData = useCallback(async () => {
        if (!boardId) return;
        setLoading(true);
        const { data: boardData } = await supabase.from('quadros').select('nome').eq('id', boardId).single();
        if (boardData) setBoardName(boardData.nome);

        const { data: statusesData } = await supabase.from('project_statuses').select('*').eq('quadro_id', boardId).order('display_order');
        if (statusesData) setStatuses(statusesData);

        const { data: projectsData } = await supabase.from('projetos').select('*, clientes(nome), subtarefas(*)').eq('quadro_id', boardId);
        if (projectsData) setProjects(projectsData as any);
        setLoading(false);
    }, [boardId, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenPanel = (mode: 'new' | 'details' | 'edit', projectId?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('view', mode);
        if (projectId) {
            params.set('projectId', projectId);
        } else {
            params.delete('projectId');
        }
        router.push(`?${params.toString()}`);
    };

    const handleClosePanel = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('view');
        params.delete('projectId');
        router.push(`?${params.toString()}`);
    };
    
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId;
        
        setProjects(prevProjects => 
            prevProjects.map(p => 
                p.id === draggableId ? { ...p, status_entrega: newStatus } : p
            )
        );

        await supabase.from('projetos').update({ status_entrega: newStatus }).eq('id', draggableId);
    };

    const handleOpenMoveModal = (project: Project) => {
        setProjectToMove(project);
        setIsMoveModalOpen(true);
    };

    const handleMoveProject = async (newBoardId: string) => {
        if (!projectToMove) return;
        await supabase.from('projetos').update({ quadro_id: newBoardId }).eq('id', projectToMove.id);
        setProjects(projects.filter(p => p.id !== projectToMove.id));
        setIsMoveModalOpen(false);
    };
    
    const handleDeleteProject = async (projectId: string) => {
        if (window.confirm("Tem a certeza de que quer apagar este projeto?")) {
            await supabase.from('projetos').delete().eq('id', projectId);
            fetchData();
        }
    };
    
    const selectedProject = projects.find(p => p.id === currentProjectId);

    return (
        <div className="flex h-[calc(100vh_-_theme(space.24))]">
            <div className="flex-1 flex flex-col space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{boardName}</h1>
                        <p className="text-sm text-gray-text">Visualize e gerencie os projetos deste quadro.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsStatusModalOpen(true)} className="p-2 rounded-lg text-gray-text hover:bg-gray-100" title="Personalizar Quadro"><Palette className="w-5 h-5" /></button>
                        <button className="p-2 rounded-lg text-gray-text hover:bg-gray-100"><List className="w-5 h-5" /></button>
                        <button className="p-2 rounded-lg bg-brand-primary/20 text-brand-primary"><LayoutGrid className="w-5 h-5" /></button>
                        <button onClick={() => handleOpenPanel('new')} className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Novo Projeto
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="board" direction="horizontal" type="COLUMN">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="flex gap-4 h-full">
                                    {statuses.map((status, index) => (
                                        <Draggable draggableId={status.id} index={index} key={status.id}>
                                            {(provided) => (
                                                <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} className="w-80 flex-shrink-0">
                                                    <Droppable droppableId={status.name} type="CARD">
                                                        {(provided) => (
                                                            <div {...provided.droppableProps} ref={provided.innerRef} className="bg-gray-100 dark:bg-dark-tertiary rounded-lg p-3 h-full flex flex-col">
                                                                <h4 className="font-semibold mb-3 px-1">{status.name} ({projects.filter(p => p.status_entrega === status.name).length})</h4>
                                                                <div className="space-y-3 flex-1 overflow-y-auto">
                                                                    {projects.filter(p => p.status_entrega === status.name).map((p, i) => (
                                                                        <ProjectCard 
                                                                            key={p.id} 
                                                                            project={p} 
                                                                            statusColor={status.color} 
                                                                            onOpen={() => handleOpenPanel('details', p.id)}
                                                                            onEdit={() => handleOpenPanel('edit', p.id)}
                                                                            onMove={() => handleOpenMoveModal(p)}
                                                                            onDelete={() => handleDeleteProject(p.id)}
                                                                        />
                                                                    ))}
                                                                    {provided.placeholder}
                                                                </div>
                                                                <button onClick={() => handleOpenPanel('new')} className="mt-3 text-sm text-gray-text hover:text-brand-primary w-full text-left p-2 rounded-md">
                                                                    + Adicionar um projeto
                                                                </button>
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </div>
            <SlideOverPanel
                isOpen={!!viewMode}
                onClose={handleClosePanel}
                title={
                    viewMode === 'new' ? 'Novo Projeto' :
                    viewMode === 'edit' ? 'Editar Projeto' :
                    'Detalhes do Projeto'
                }
            >
                {(viewMode === 'new' || viewMode === 'edit') && <ProjectForm boardId={boardId} project={selectedProject} statuses={statuses} onSave={fetchData} onCancel={handleClosePanel} />}
                {viewMode === 'details' && selectedProject && <ProjectDetailView project={selectedProject as Project & { subtasks: Subtask[] }} />}
            </SlideOverPanel>
            <StatusManagerModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} initialStatuses={statuses} folderId={boardId} onStatusesChange={(newStatuses) => setStatuses(newStatuses)} />
            <MoveProjectModal 
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                onMove={handleMoveProject}
                currentBoardId={boardId}
                projectToMove={projectToMove}
            />
        </div>
    );
}
