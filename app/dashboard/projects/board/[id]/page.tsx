// app/dashboard/projects/board/[id]/page.tsx
// Página que exibe o Kanban e o painel lateral para detalhes/edição.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Project, type Subtask, type ProjectStatus, type Client, type Categoria, type Quadro, type TaskGroup } from '@/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import SlideOverPanel from '@/components/ui/SlideOverPanel';
import { 
    Plus, List, LayoutGrid, Palette, GripVertical, MoreHorizontal, Clock, 
    CheckCircle2, Edit, Trash2, Eye, Move, Check, 
    Paperclip, StickyNote, History, ListTodo, FolderKanban, Columns3, Calendar, DollarSign, CircleUserRound, 
    icons
} from 'lucide-react';
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import ProjectListPage from '@/app/dashboard/projects/board/[id]/page-list';

// --- HELPERS ---
const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

// --- COMPONENTES ---

function ProjectCard({ project, onOpen, onEdit, onMove, onDelete }: { project: Project & { task_groups: TaskGroup[] }; onOpen: () => void; onEdit: () => void; onMove: () => void; onDelete: () => void; }) {
    const diasRestantes = project.data_entrega ? Math.ceil((new Date(project.data_entrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    const priorityClasses: { [key: string]: string } = {
        'Alta': 'bg-destructive/20 text-destructive',
        'Média': 'bg-yellow-500/20 text-yellow-500',
        'Baixa': 'bg-blue-500/20 text-blue-500',
    };
    
    const dateColorClass = diasRestantes !== null && diasRestantes < 7 ? 'text-destructive' : 'text-muted-foreground';

    const renderDueDate = () => {
        if (diasRestantes === null) return null;
        if (diasRestantes < 0) return <span className="text-destructive">Atrasado</span>;
        if (diasRestantes === 0) return <span className="text-destructive">Entrega hoje</span>;
        if (diasRestantes === 1) return "Entrega amanhã";
        return `${diasRestantes} dias restantes`;
    };

    return (
        <div className="bg-card border hover:border-primary rounded-xl p-4 space-y-3 cursor-pointer" onClick={onOpen}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-wrap">
                    {project.prioridade && (
                        <Badge variant="secondary" className={priorityClasses[project.prioridade] || ''}>
                            {project.prioridade}
                        </Badge>
                    )}
                    <Badge variant="outline">{project.tipo_projeto}</Badge>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="w-6 h-6">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={onOpen}><Eye className="w-4 h-4 mr-2" /> Abrir Projeto</DropdownMenuItem>
                        <DropdownMenuItem onClick={onEdit}><Edit className="w-4 h-4 mr-2" /> Editar Projeto</DropdownMenuItem>
                        <DropdownMenuItem onClick={onMove}><Move className="w-4 h-4 mr-2" /> Mover para...</DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <h4 className="font-bold text-foreground">{project.descricao}</h4>
            
            <div className="flex justify-between items-center pt-2 border-t border-border">
                 <div className={`flex items-center gap-1 text-xs font-semibold ${dateColorClass}`}>
                    <Clock className="w-3 h-3" />
                    <span>{renderDueDate()}</span>
                </div>
                <div className="flex -space-x-2">
                    <Avatar className="rounded-full size-6">
                        <AvatarImage src="/avatar.png" />
                        <AvatarFallback>AG</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    );
}

function QuickClientModal({ isOpen, onClose, onClientCreated }: { isOpen: boolean; onClose: () => void; onClientCreated: (newClient: Client) => void; }) {
    const supabase = createSupabaseBrowserClient();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('clientes')
            .insert({ user_id: user.id, nome, email_contato: email, telefone })
            .select().single();

        if (data) onClientCreated(data as Client);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-popover text-popover-foreground p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-6">Novo Cliente Rápido</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Nome*</label>
                        <Input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Telefone</label>
                        <Input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

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
    const [prioridade, setPrioridade] = useState(project?.prioridade || 'Média');
    const [responsaveis, setResponsaveis] = useState(project?.responsaveis || '');
    
    const [integrar_financeiro, setIntegrarFinanceiro] = useState(!!project?.valor_total);
    const [valor_total, setValorTotal] = useState<number | ''>(project?.valor_total || '');
    const [forma_pagamento, setFormaPagamento] = useState<'À Vista' | '50/50' | 'Parcelado'>(project?.detalhes_pagamento?.tipo || 'À Vista');
    const [entrada_recebida, setEntradaRecebida] = useState(false);
    const [assinatura, setAssinatura] = useState(project?.assinatura || false);
    const [data_pagamento, setDataPagamento] = useState('');

    const [loading, setLoading] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    const fetchClients = useCallback(async () => {
        const { data: clientsData } = await supabase.from('clientes').select('id, nome');
        if (clientsData) setClients(clientsData as Client[]);
    }, [supabase]);

    useEffect(() => {
        const fetchInitialData = async () => {
            fetchClients();
            const { data: categoriesData } = await supabase.from('categorias').select('*').eq('tipo', 'projeto');
            if (categoriesData) setProjectCategories(categoriesData as Categoria[]);
        };
        fetchInitialData();
    }, [supabase, fetchClients]);
    
    const handleClientCreated = (newClient: Client) => {
        setClients(prev => [...prev, newClient]);
        setClienteId(newClient.id);
        setIsClientModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const projectData = {
            descricao: nome_projeto, cliente_id: cliente_id || null, tipo_projeto, data_entrega,
            status_entrega, observacao: descricao, prioridade, responsaveis, valor_total: integrar_financeiro ? Number(valor_total) : null,
            assinatura, detalhes_pagamento: integrar_financeiro ? { tipo: forma_pagamento, parcelas: [] } : null,
            status_pagamento: integrar_financeiro ? (entrada_recebida ? 'Parcialmente pago' : 'Pendente') : null,
        };

        let projectId = project?.id;
        if (projectId) {
            await supabase.from('projetos').update(projectData).eq('id', projectId);
        } else {
            const { data } = await supabase.from('projetos').insert({ ...projectData, user_id: user.id, quadro_id: boardId }).select().single();
            if (data) projectId = data.id;
        }

        if (projectId && integrar_financeiro && valor_total) {
            const transactionData = {
                user_id: user.id, descricao: `Receita do projeto: ${nome_projeto}`, valor: Number(valor_total), tipo: 'Receita' as const,
                data: data_pagamento || new Date().toISOString().split('T')[0], status: entrada_recebida ? 'Pago' as const : 'Pendente' as const,
                categoria: 'Venda de Projeto', projeto_id: projectId, cliente_id: cliente_id || null,
            };
            await supabase.from('transacoes').delete().eq('projeto_id', projectId);
            await supabase.from('transacoes').insert(transactionData);
        }
        onSave();
        setLoading(false);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="flex-1 space-y-6 p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-md border-b border-border pb-2">Detalhes do projeto</h4>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Nome do projeto*</label>
                            <Input type="text" value={nome_projeto} onChange={(e) => setNomeProjeto(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Cliente</label>
                            <div className="flex items-center gap-2">
                                <Select value={cliente_id} onValueChange={setClienteId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button type="button" size="icon" variant="outline" onClick={() => setIsClientModalOpen(true)}><Plus className="w-4 h-4" /></Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo de projeto*</label>
                                <Select value={tipo_projeto} onValueChange={setTipoProjeto} required>
                                    <SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger>
                                    <SelectContent>
                                        {projectCategories.map(cat => <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Previsão de entrega*</label>
                                <Input type="date" value={data_entrega} onChange={(e) => setDataEntrega(e.target.value)} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Status do projeto*</label>
                                <Select value={status_entrega} onValueChange={setStatusEntrega} required>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {statuses.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Prioridade</label>
                                <Select value={prioridade} onValueChange={(v) => setPrioridade(v as any)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Baixa">Baixa</SelectItem>
                                        <SelectItem value="Média">Média</SelectItem>
                                        <SelectItem value="Alta">Alta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Responsáveis</label>
                            <Input type="text" value={responsaveis} onChange={(e) => setResponsaveis(e.target.value)} placeholder="Ex: João, Maria" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Descrição</label>
                            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-6">
                        <label className="font-semibold text-md">Integrar com o financeiro?</label>
                        <button type="button" onClick={() => setIntegrarFinanceiro(!integrar_financeiro)} className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${integrar_financeiro ? 'bg-primary' : 'bg-muted'}`}>
                            <span className={`w-4 h-4 bg-white rounded-full transition-transform ${integrar_financeiro ? 'transform translate-x-6' : ''}`}></span>
                        </button>
                    </div>

                    {integrar_financeiro && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-md border-b border-border pb-2">Detalhes financeiros</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Valor Total (R$)</label>
                                    <Input type="number" value={valor_total} onChange={(e) => setValorTotal(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Forma de Pagamento</label>
                                    <Select value={forma_pagamento} onValueChange={(v) => setFormaPagamento(v as any)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="À Vista">À Vista</SelectItem>
                                            <SelectItem value="50/50">50/50</SelectItem>
                                            <SelectItem value="Parcelado">Parcelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Data do pagamento</label>
                                <Input type="date" value={data_pagamento} onChange={(e) => setDataPagamento(e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm">Você recebeu a entrada?</label>
                                <button type="button" onClick={() => setEntradaRecebida(!entrada_recebida)} className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${entrada_recebida ? 'bg-primary' : 'bg-muted'}`}>
                                    <span className={`w-4 h-4 bg-white rounded-full transition-transform ${entrada_recebida ? 'transform translate-x-6' : ''}`}></span>
                                </button>
                            </div>
                             <div className="flex items-center justify-between">
                                <label className="text-sm">Este projeto é uma assinatura?</label>
                                <button type="button" onClick={() => setAssinatura(!assinatura)} className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${assinatura ? 'bg-primary' : 'bg-muted'}`}>
                                    <span className={`w-4 h-4 bg-white rounded-full transition-transform ${assinatura ? 'transform translate-x-6' : ''}`}></span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-4 p-6 border-t border-border flex-shrink-0">
                     <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                     <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                </div>
            </form>
            <QuickClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onClientCreated={handleClientCreated} />
        </>
    );
}

function TaskGroupComponent({ group, onUpdate }: { group: TaskGroup; onUpdate: () => void; }) {
    const supabase = createSupabaseBrowserClient();
    const [newItemText, setNewItemText] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [groupName, setGroupName] = useState(group.nome);

    const handleToggleSubtask = async (subtaskId: string, currentState: boolean) => {
        await supabase.from('subtarefas').update({ concluida: !currentState }).eq('id', subtaskId);
        onUpdate();
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) { setIsAdding(false); return; };
        await supabase.from('subtarefas').insert({ group_id: group.id, projeto_id: group.projeto_id, nome: newItemText });
        setNewItemText('');
        setIsAdding(false);
        onUpdate();
    };

    const handleDeleteSubtask = async (subtaskId: string) => {
        if(window.confirm("Tem certeza que deseja excluir este item?")) {
            await supabase.from('subtarefas').delete().eq('id', subtaskId);
            onUpdate();
        }
    };
    
    const handleDeleteGroup = async () => {
        if(window.confirm("Tem certeza que deseja excluir este grupo de tarefas e todos os seus itens?")) {
            await supabase.from('task_groups').delete().eq('id', group.id);
            onUpdate();
        }
    };

    const handleTitleBlur = async () => {
        setIsEditingTitle(false);
        if (groupName.trim() && groupName !== group.nome) {
            await supabase.from('task_groups').update({ nome: groupName }).eq('id', group.id);
            onUpdate();
        } else {
            setGroupName(group.nome);
        }
    };

    const progress = group.subtarefas.length > 0 ? (group.subtarefas.filter(t => t.concluida).length / group.subtarefas.length) * 100 : 0;

    return (
        <div className="space-y-2 border border-border p-4 rounded-lg">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-5">
                {isEditingTitle ? (
                    <Input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} onBlur={handleTitleBlur} onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()} className="font-semibold text-md h-7" autoFocus />
                ) : (
                    <h4 onClick={() => setIsEditingTitle(true)} className="font-semibold text-md cursor-pointer">{group.nome}</h4>
                )}
                <Button variant="ghost" size="sm" onClick={handleDeleteGroup} className="text-muted-foreground hover:text-destructive">Excluir</Button>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <div className="space-y-1 pl-2">
                {group.subtarefas.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-1 rounded-md hover:bg-accent">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={task.concluida} onChange={() => handleToggleSubtask(task.id, task.concluida)} className="h-4 w-4 rounded border-muted-foreground text-primary focus:ring-ring" />
                            <span className={`text-sm text-foreground ${task.concluida ? 'line-through text-muted-foreground' : ''}`}>{task.nome}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSubtask(task.id)} className="w-6 h-6 opacity-50 hover:opacity-100">
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
            </div>
            {isAdding ? (
                <form onSubmit={handleAddSubtask}>
                    <Input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Adicionar um item..." className="mt-2 h-8" autoFocus />
                    <div className="mt-2 flex items-center gap-2">
                         <Button type="submit" size="sm">Adicionar</Button>
                         <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancelar</Button>
                    </div>
                </form>
            ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="text-primary ml-7">Adicionar um item</Button>
            )}
        </div>
    );
}

function TaskSection({ project, onUpdate }: { project: Project & { task_groups: TaskGroup[] }; onUpdate: () => void; }) {
    const supabase = createSupabaseBrowserClient();
    const [newGroupName, setNewGroupName] = useState('');

    const handleAddGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('task_groups').insert({ projeto_id: project.id, user_id: user.id, nome: newGroupName });
        setNewGroupName('');
        onUpdate();
    };
    
    return (
        <div className="space-y-6">
            {project.task_groups.map(group => (
                <TaskGroupComponent key={group.id} group={group} onUpdate={onUpdate} />
            ))}
            <form onSubmit={handleAddGroup} className="flex gap-2 pt-4 border-t border-border">
                <Input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Adicionar novo grupo de tarefas..." className="flex-1" />
                <Button type="submit">Adicionar</Button>
            </form>
        </div>
    );
}

function ProjectDetailView({ project, onUpdate }: { project: Project & { task_groups: TaskGroup[] }; onUpdate: () => void; }) {
    const [activeTab, setActiveTab] = useState('tasks');

    const allSubtasks = project.task_groups.flatMap(g => g.subtarefas);
    const progress = allSubtasks.length > 0 ? (allSubtasks.filter(t => t.concluida).length / allSubtasks.length) * 100 : 0;

    return (
        <div className="px-2 space-y-6">
            <div>
                <div>
                    <label className="text-xs font-normal text-muted-foreground">Progresso</label>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="text-sm font-semibold">{Math.round(progress)}%</span>
                    </div>
                </div>
                <hr className="my-6 border-border" />
                <div className="space-y-4">
                    <table className="w-full text-sm">
                        <tbody>
                            <tr>
                                <td className="py-2 font-medium text-foreground inline-flex items-center text-sm"><FolderKanban className="h-5 mr-2 text-primary" />Tipo de Projeto</td>
                                <td className="py-3 text-muted-foreground">{project.tipo_projeto}</td>
                            </tr>
                            <tr>
                                <td className="py-3 font-medium text-foreground inline-flex items-center"><Columns3 className="h-5 mr-2 text-primary" />Status</td>
                                <td className="py-3 text-muted-foreground">{project.status_entrega}</td>
                            </tr>
                            <tr>
                                <td className="py-3 font-medium text-foreground inline-flex items-center"><Calendar className="h-5 mr-2 text-primary" />Previsão de Entrega</td>
                                <td className="py-3 text-muted-foreground">{project.data_entrega ? new Date(project.data_entrega).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td className="py-3 font-medium text-foreground inline-flex items-center"><DollarSign className="h-5 mr-2 text-primary" />Valor do Projeto</td>
                                <td className="py-3 text-muted-foreground">{project.valor_total ? `R$ ${formatBRL(project.valor_total)}` : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td className="py-3 font-medium text-foreground inline-flex items-center"><CircleUserRound className="h-5 mr-2 text-primary" />Responsáveis</td>
                                <td className="py-2 text-muted-foreground">{project.responsaveis || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="border border-primary/20 bg-primary/10 p-6 rounded-md">
                        <label className="text-md font-semibold text-foreground">Descrição</label>
                        <p className="text-sm text-muted-foreground mt-1">{project.observacao || 'Nenhuma descrição fornecida.'}</p>
                    </div>
                </div>
            </div>
            <div>
                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('tasks')} className={`py-3 px-1 text-sm font-semibold ${activeTab === 'tasks' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}><ListTodo className="w-4 h-4 inline-block mr-2"/>Tarefas</button>
                        <button onClick={() => setActiveTab('attachments')} className={`py-3 px-1 text-sm font-semibold ${activeTab === 'attachments' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}><Paperclip className="w-4 h-4 inline-block mr-2"/>Anexos</button>
                        <button onClick={() => setActiveTab('notes')} className={`py-3 px-1 text-sm font-semibold ${activeTab === 'notes' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}><StickyNote className="w-4 h-4 inline-block mr-2"/>Anotações</button>
                        <button onClick={() => setActiveTab('log')} className={`py-3 px-1 text-sm font-semibold ${activeTab === 'log' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}><History className="w-4 h-4 inline-block mr-2"/>Log de Atividades</button>
                    </nav>
                </div>
                <div className="pt-6">
                    {activeTab === 'tasks' && <TaskSection project={project} onUpdate={onUpdate} />}
                    {activeTab === 'attachments' && <div className="text-center text-muted-foreground p-8">Funcionalidade de anexos em breve.</div>}
                    {activeTab === 'notes' && <div className="text-center text-muted-foreground p-8">Funcionalidade de anotações em breve.</div>}
                    {activeTab === 'log' && <div className="text-center text-muted-foreground p-8">Funcionalidade de log de atividades em breve.</div>}
                </div>
            </div>
        </div>
    );
}

function StatusManagerModal({ isOpen, onClose, onSave, statusToEdit, boardId }: { isOpen: boolean; onClose: () => void; onSave: () => void; statusToEdit: ProjectStatus | null; boardId: string; }) {
    const supabase = createSupabaseBrowserClient();
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3B82F6');

    const predefinedColors = [
        { name: 'Azul', value: '#3B82F6' }, { name: 'Roxo', value: '#8B5CF6' }, { name: 'Verde', value: '#22C55E' },
        { name: 'Vermelho', value: '#EF4444' }, { name: 'Amarelo', value: '#F59E0B' }, { name: 'Índigo', value: '#6366F1' },
    ];

    useEffect(() => {
        if (statusToEdit) {
            setName(statusToEdit.name);
            setColor(statusToEdit.color);
        } else {
            setName('');
            setColor(predefinedColors[0].value);
        }
    }, [statusToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (statusToEdit) {
            await supabase.from('project_statuses').update({ name, color }).eq('id', statusToEdit.id);
        } else {
            await supabase.from('project_statuses').insert({ name, color, user_id: user.id, quadro_id: boardId });
        }
        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-popover text-popover-foreground p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-6">{statusToEdit ? 'Editar Fase' : 'Nova Fase'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="board-name" className="block text-sm font-medium text-muted-foreground mb-1">Título*</label>
                        <Input type="text" id="board-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Digite o título da fase" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-muted-foreground mb-2">Cor da Fase</label>
                         <div className="grid grid-cols-3 gap-2">
                             {predefinedColors.map(colorOption => (
                                 <button type="button" key={colorOption.name} onClick={() => setColor(colorOption.value)} className={`p-2 rounded-lg border-2 flex items-center gap-2 ${color === colorOption.value ? 'border-primary' : 'border-border'}`}>
                                     <span className="w-5 h-5 rounded-full" style={{ backgroundColor: colorOption.value }}></span>
                                     <span className="text-sm">{colorOption.name}</span>
                                 </button>
                             ))}
                             <div className={`p-2 rounded-lg border-2 flex items-center gap-2 relative ${!predefinedColors.some(pc => pc.value === color) ? 'border-primary' : 'border-border'}`}>
                                 <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 absolute opacity-0 cursor-pointer" />
                                  <span className="w-5 h-5 rounded-full" style={{ backgroundColor: color }}></span>
                                 <span className="text-sm">Outra</span>
                             </div>
                         </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">{statusToEdit ? 'Salvar Alterações' : 'Criar Fase'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function MoveProjectModal({ isOpen, onClose, onMove, currentBoardId, projectToMove }: { isOpen: boolean; onClose: () => void; onMove: (newBoardId: string) => void; currentBoardId: string; projectToMove: Project | null; }) {
    const supabase = createSupabaseBrowserClient();
    const [boards, setBoards] = useState<Quadro[]>([]);
    const [selectedBoard, setSelectedBoard] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchBoards = async () => {
                const { data } = await supabase.from('quadros').select('id, nome').neq('id', currentBoardId);
                if (data) {
                    setBoards(data as Quadro[]);
                    if (data.length > 0) setSelectedBoard(data[0].id);
                }
            };
            fetchBoards();
        }
    }, [isOpen, supabase, currentBoardId]);
    
    if (!isOpen || !projectToMove) return null;

    const handleMove = () => {
        if (selectedBoard) onMove(selectedBoard);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-popover text-popover-foreground p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Mover Projeto</h2>
                <p className="text-sm text-muted-foreground mb-6">Selecione o quadro de destino para "{projectToMove.descricao}".</p>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Mover para o quadro</label>
                    <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                        <SelectTrigger><SelectValue placeholder="Selecione um quadro" /></SelectTrigger>
                        <SelectContent>
                            {boards.map(board => <SelectItem key={board.id} value={board.id}>{board.nome}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end gap-4 pt-6">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleMove} disabled={!selectedBoard}>Mover</Button>
                </div>
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function BoardPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const boardId = params.id as string;
    
    const viewMode = searchParams.get('view');
    const displayMode = searchParams.get('displayMode') || 'kanban';
    const currentProjectId = searchParams.get('projectId');

    const [projects, setProjects] = useState<(Project & { task_groups: TaskGroup[] })[]>([]);
    const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
    const [boardName, setBoardName] = useState('');
    const [boardDescription, setBoardDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseBrowserClient();
    
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusToEdit, setStatusToEdit] = useState<ProjectStatus | null>(null);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [projectToMove, setProjectToMove] = useState<Project | null>(null);

    const fetchData = useCallback(async () => {
        if (!boardId) return;
        setLoading(true);
        const { data: boardData } = await supabase.from('quadros').select('nome, descricao').eq('id', boardId).single();
        if (boardData) {
            setBoardName(boardData.nome);
            setBoardDescription(boardData.descricao || '');
        }

        const { data: statusesData } = await supabase.from('project_statuses').select('*').eq('quadro_id', boardId).order('display_order');
        if (statusesData) setStatuses(statusesData);

        const { data: projectsData } = await supabase.from('projetos').select('*, clientes(nome), task_groups(*, subtarefas(*))').eq('quadro_id', boardId);
        if (projectsData) setProjects(projectsData as any);
        setLoading(false);
    }, [boardId, supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenPanel = (mode: 'new' | 'details' | 'edit', projectId?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('view', mode);
        if (projectId) params.set('projectId', projectId); else params.delete('projectId');
        router.push(`?${params.toString()}`);
    };

    const handleClosePanel = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('view');
        params.delete('projectId');
        router.push(`?${params.toString()}`);
    };

    const handleViewChange = (mode: 'kanban' | 'list') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('displayMode', mode);
        router.push(`?${params.toString()}`);
    };
    
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId, type } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

        if (type === 'COLUMN') {
            const newStatuses = Array.from(statuses);
            const [reorderedItem] = newStatuses.splice(source.index, 1);
            newStatuses.splice(destination.index, 0, reorderedItem);
            setStatuses(newStatuses);
            const updates = newStatuses.map((status, index) => supabase.from('project_statuses').update({ display_order: index + 1 }).eq('id', status.id));
            await Promise.all(updates);
            return;
        }

        setProjects(prev => prev.map(p => p.id === draggableId ? { ...p, status_entrega: destination.droppableId } : p));
        await supabase.from('projetos').update({ status_entrega: destination.droppableId }).eq('id', draggableId);
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
        const { data: projectData } = await supabase.from('projetos').select('valor_total').eq('id', projectId).single();
        const isLinkedToFinance = projectData?.valor_total != null;

        if (!window.confirm("Tem a certeza de que quer apagar este projeto?")) return;

        if (isLinkedToFinance) {
            if (window.confirm("Este projeto está vinculado ao financeiro. Deseja excluir também o registro do fluxo de caixa?")) {
                await supabase.from('transacoes').delete().eq('projeto_id', projectId);
            } else {
                await supabase.from('transacoes').update({ projeto_id: null }).eq('projeto_id', projectId);
            }
        }
        await supabase.from('projetos').delete().eq('id', projectId);
        fetchData();
    };
    
    const handleEditStatus = (status: ProjectStatus) => {
        setStatusToEdit(status);
        setIsStatusModalOpen(true);
    };

    const handleSetFinalStatus = async (statusId: string) => {
        await supabase.from('project_statuses').update({ is_final_status: false }).eq('quadro_id', boardId);
        await supabase.from('project_statuses').update({ is_final_status: true }).eq('id', statusId);
        fetchData(); 
    };

    const handleDeleteStatus = async (statusId: string) => {
        if (projects.some(p => p.status_entrega === statuses.find(s => s.id === statusId)?.name)) {
            alert("Não é possível excluir esta fase, pois ela contém projetos. Mova os projetos para outra fase antes de excluir.");
            return;
        }
        if (window.confirm("Tem certeza que deseja excluir esta fase?")) {
            await supabase.from('project_statuses').delete().eq('id', statusId);
            fetchData();
        }
    };
    
    const selectedProject = projects.find(p => p.id === currentProjectId);

    return (
        <div className="flex w-full h-[calc(100vh_-_theme(space.24))]">
            <div className="flex-1 flex flex-col space-y-6 p-6 min-w-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{boardName || 'Carregando...'}</h1>
                        <p className="text-sm text-muted-foreground">{boardDescription || 'Visualize e gerencie os projetos deste quadro.'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant={displayMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => handleViewChange('list')}><List className="w-5 h-5" /></Button>
                        <Button variant={displayMode === 'kanban' ? 'secondary' : 'ghost'} size="icon" onClick={() => handleViewChange('kanban')}><LayoutGrid className="w-5 h-5" /></Button>
                        <Button onClick={() => handleOpenPanel('new')}><Plus className="w-4 h-4 mr-2" /> Novo Projeto</Button>
                    </div>
                </div>

                {displayMode === 'kanban' ? (
                    <div className="flex-1 overflow-x-auto">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="board" direction="horizontal" type="COLUMN">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex gap-4 h-full items-start">
                                        {statuses.map((status, index) => (
                                            <Draggable draggableId={status.id} index={index} key={status.id}>
                                                {(providedDrag) => (
                                                    <div {...providedDrag.draggableProps} ref={providedDrag.innerRef} className="w-80 flex-shrink-0">
                                                        <Droppable droppableId={status.name} type="CARD">
                                                            {(providedDrop) => (
                                                                <div ref={providedDrop.innerRef} {...providedDrop.droppableProps} className="bg-muted/50 rounded-lg p-3 h-full flex flex-col">
                                                                    <div className="flex justify-between items-center mb-3 px-1">
                                                                        <div {...providedDrag.dragHandleProps} className="flex items-center gap-2 cursor-grab p-1">
                                                                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                                                                            <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: status.color }}></span>
                                                                            <h4 className="font-semibold">{status.name}</h4>
                                                                            <Badge variant="secondary">{projects.filter(p => p.status_entrega === status.name).length}</Badge>
                                                                            {status.is_final_status && <Check className="w-4 h-4 text-success" />}
                                                                        </div>
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="w-6 h-6"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent>
                                                                                <DropdownMenuItem onClick={() => handleEditStatus(status)}><Edit className="w-4 h-4 mr-2" /> Editar Fase</DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={() => handleSetFinalStatus(status.id)} disabled={status.is_final_status}><Check className="w-4 h-4 mr-2" /> Definir como fase final</DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={() => handleDeleteStatus(status.id)} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Excluir Fase</DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                    <div className="space-y-3 flex-1 overflow-y-auto p-1">
                                                                        {projects.filter(p => p.status_entrega === status.name).map((p, i) => (
                                                                            <Draggable key={p.id} draggableId={p.id} index={i}>
                                                                                {(providedCard) => (
                                                                                    <div ref={providedCard.innerRef} {...providedCard.draggableProps} {...providedCard.dragHandleProps}>
                                                                                        <ProjectCard project={p} onOpen={() => handleOpenPanel('details', p.id)} onEdit={() => handleOpenPanel('edit', p.id)} onMove={() => handleOpenMoveModal(p)} onDelete={() => handleDeleteProject(p.id)} />
                                                                                    </div>
                                                                                )}
                                                                            </Draggable>
                                                                        ))}
                                                                        {providedDrop.placeholder}
                                                                    </div>
                                                                    <Button variant="ghost" onClick={() => handleOpenPanel('new')} className="w-full mt-3 justify-start">+ Adicionar um projeto</Button>
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        <div className="w-80 flex-shrink-0">
                                            <Button variant="secondary" onClick={() => { setStatusToEdit(null); setIsStatusModalOpen(true); }} className="w-full">+ Adicionar nova fase</Button>
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                ) : (
                    <ProjectListPage boardId={boardId} />
                )}
            </div>
           <SlideOverPanel isOpen={!!viewMode} onClose={handleClosePanel} title={viewMode === 'new' ? 'Novo Projeto' : viewMode === 'edit' ? 'Editar Projeto' : selectedProject?.descricao ?? ''}>
              {(viewMode === 'new' || viewMode === 'edit') && <ProjectForm boardId={boardId} project={selectedProject || null} statuses={statuses} onSave={fetchData} onCancel={handleClosePanel} />}
              {viewMode === 'details' && selectedProject && <ProjectDetailView project={selectedProject as Project & { task_groups: TaskGroup[] }} onUpdate={fetchData} />}
            </SlideOverPanel>

            <StatusManagerModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} onSave={() => { setIsStatusModalOpen(false); fetchData(); }} statusToEdit={statusToEdit} boardId={boardId} />
            <MoveProjectModal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} onMove={handleMoveProject} currentBoardId={boardId} projectToMove={projectToMove} />
        </div>
    );
}