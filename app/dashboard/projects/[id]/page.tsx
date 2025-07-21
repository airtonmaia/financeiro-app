// app/dashboard/projects/[id]/page.tsx
// Página para visualizar e gerenciar os detalhes de um projeto específico.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Project, type Subtask } from '@/types'; 
import { CheckSquare, Square, Trash2, Plus, Paperclip, Book, Activity, Calendar, Clock, User, Tag, AlertTriangle, DollarSign, File, UploadCloud } from 'lucide-react';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// --- TIPOS ---
type ProjectFile = {
    name: string;
    id: string;
    created_at: string;
    metadata: {
        size: number;
        mimetype: string;
    };
};

// --- COMPONENTES ---

function ProgressBar({ value, total }: { value: number, total: number }) {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <p className="font-semibold text-dark-text">Progresso das Tarefas</p>
                <p className="font-semibold text-gray-text">{percentage}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-brand-green h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null }) {
    return (
        <div className="space-y-1">
            <p className="text-sm text-gray-text flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</p>
            <p className="font-semibold text-dark-text">{value || 'Não definido'}</p>
        </div>
    );
}

function SubtaskItem({ task, onToggle, onDelete, onStatusChange }: { task: Subtask; onToggle: (id: string, status: boolean) => void; onDelete: (id: string) => void; onStatusChange: (id: string, newStatus: string) => void; }) {
    return (
        <div className="flex items-center gap-3 p-2 border-b border-light-tertiary last:border-b-0">
            <button onClick={() => onToggle(task.id, !task.concluida)}>
                {task.concluida ? <CheckSquare className="w-5 h-5 text-brand-green" /> : <Square className="w-5 h-5 text-gray-text" />}
            </button>
            <p className={`flex-1 ${task.concluida ? 'line-through text-gray-text' : 'text-dark-text'}`}>{task.nome}</p>
            <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)} className="text-sm bg-gray-100 rounded-md p-1 border-none focus:ring-2 focus:ring-brand-green">
                <option>A fazer</option>
                <option>Em andamento</option>
                <option>Concluído</option>
            </select>
            <button onClick={() => onDelete(task.id)} className="text-gray-text hover:text-danger-text">
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

function NotesEditor({ content, onChange, isSaving }: { content: string, onChange: (content: string) => void, isSaving: boolean }) {
    return (
        <div>
            <style jsx global>{`
                .quill-editor-wrapper .ql-toolbar {
                  border-top-left-radius: 0.75rem;
                  border-top-right-radius: 0.75rem;
                  border-color: #E9ECEF;
                  background-color: #F7F8FC;
                }
                .quill-editor-wrapper .ql-container {
                  border-bottom-left-radius: 0.75rem;
                  border-bottom-right-radius: 0.75rem;
                  border-color: #E9ECEF;
                  min-height: 300px;
                  font-size: 1rem;
                  color: #212529;
                }
                .quill-editor-wrapper .ql-editor {
                  padding: 1.25rem;
                }
            `}</style>
            <div className="quill-editor-wrapper">
                <ReactQuill 
                    theme="snow" 
                    value={content} 
                    onChange={onChange}
                    className="bg-white"
                />
            </div>
            <div className="text-right text-sm text-gray-text mt-2 h-4 transition-opacity">
                {isSaving ? 'Salvando...' : 'Salvo'}
            </div>
        </div>
    );
}

function FilesTab({ projectId }: { projectId: string }) {
    const supabase = createSupabaseBrowserClient();
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFiles = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.storage
            .from('project-files')
            .list(`${user.id}/${projectId}`, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });
        if (data) setFiles(data as ProjectFile[]);
    }, [projectId, supabase]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesToUpload = Array.from(event.target.files);
            setIsUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            for (const file of filesToUpload) {
                const filePath = `${user.id}/${projectId}/${file.name}`;
                await supabase.storage
                    .from('project-files')
                    .upload(filePath, file, { upsert: true }); // upsert: true para sobrescrever se já existir
            }

            setIsUploading(false);
            fetchFiles();
        }
    };
    
    const handleDeleteFile = async (fileName: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o arquivo "${fileName}"?`)) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const filePath = `${user.id}/${projectId}/${fileName}`;
            await supabase.storage.from('project-files').remove([filePath]);
            fetchFiles();
        }
    };

    return (
        <div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center mb-6">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                    <button onClick={() => fileInputRef.current?.click()} className="font-semibold text-brand-blue hover:text-brand-blue/80">
                        Clique para enviar
                    </button>
                </p>
                <p className="text-xs text-gray-500">Qualquer tipo de arquivo até 25MB</p>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" />
            </div>

            {isUploading && <p className="text-sm text-gray-text mb-4">Enviando arquivos...</p>}

            <div className="space-y-3">
                <h3 className="font-semibold text-dark-text">Arquivos Anexados</h3>
                {files.length === 0 && !isUploading && <p className="text-sm text-gray-text">Nenhum arquivo anexado a este projeto.</p>}
                {files.map(file => (
                    <div key={file.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-light-tertiary">
                        <File className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-dark-text">{file.name}</p>
                            <p className="text-xs text-gray-text">
                                Enviado em: {new Date(file.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <button onClick={() => handleDeleteFile(file.name)} className="p-1 text-gray-500 hover:text-danger-text">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}


// --- PÁGINA PRINCIPAL ---
export default function ProjectDetailPage() {
    const params = useParams();
    const supabase = createSupabaseBrowserClient();
    
    const [project, setProject] = useState<Project | null>(null);
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    const projectId = params.id as string;
    const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        const { data: projectData, error: projectError } = await supabase
            .from('projetos')
            .select('*, clientes ( nome )')
            .eq('id', projectId)
            .single();

        if (projectError) {
            setError("Projeto não encontrado.");
            setLoading(false);
            return;
        }
        setProject(projectData as Project);
        setNotes(projectData.anotacoes || '');

        const { data: subtasksData } = await supabase
            .from('subtarefas')
            .select('*')
            .eq('projeto_id', projectId)
            .order('created_at', { ascending: true });
        
        if (subtasksData) setSubtasks(subtasksData as Subtask[]);
        setLoading(false);
    }, [projectId, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleNotesChange = (content: string) => {
        setNotes(content);
        setIsSavingNotes(true);
        
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
        }

        autosaveTimeoutRef.current = setTimeout(async () => {
            await supabase
                .from('projetos')
                .update({ anotacoes: content })
                .eq('id', projectId);
            setIsSavingNotes(false);
        }, 1500);
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskName.trim()) return;

        const { data } = await supabase
            .from('subtarefas')
            .insert({ projeto_id: projectId, nome: newSubtaskName })
            .select()
            .single();

        if (data) setSubtasks([...subtasks, data as Subtask]);
        setNewSubtaskName('');
    };
    
    const handleToggleSubtask = async (id: string, isCompleted: boolean) => {
        const { data } = await supabase
            .from('subtarefas')
            .update({ concluida: isCompleted, status: isCompleted ? 'Concluído' : 'A fazer' })
            .eq('id', id)
            .select()
            .single();

        if (data) setSubtasks(subtasks.map(t => t.id === id ? (data as Subtask) : t));
    };
    
    const handleStatusChange = async (id: string, newStatus: string) => {
        const { data } = await supabase
            .from('subtarefas')
            .update({ status: newStatus, concluida: newStatus === 'Concluído' })
            .eq('id', id)
            .select()
            .single();
        if (data) setSubtasks(subtasks.map(t => t.id === id ? (data as Subtask) : t));
    };

    const handleDeleteSubtask = async (id: string) => {
        await supabase.from('subtarefas').delete().eq('id', id);
        setSubtasks(subtasks.filter(t => t.id !== id));
    };

    const completedTasks = subtasks.filter(task => task.concluida).length;
    const totalTasks = subtasks.length;

    if (loading) return <div className="text-center p-10">Carregando projeto...</div>;
    if (error) return <div className="p-5 text-center text-danger-text bg-red-100 rounded-lg">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-dark-text">{project?.descricao}</h1>
                    <span className="text-sm font-semibold px-3 py-1 bg-purple-100 text-purple-800 rounded-full">{project?.status_entrega}</span>
                </div>
            </div>

            <div className="border-b border-light-tertiary">
                <nav className="flex space-x-6">
                    <button onClick={() => setActiveTab('overview')} className={`py-3 px-1 font-semibold flex items-center gap-2 ${activeTab === 'overview' ? 'border-b-2 border-brand-green text-dark-text' : 'text-gray-text'}`}><Activity className="w-4 h-4"/> Visão Geral</button>
                    <button onClick={() => setActiveTab('subtasks')} className={`py-3 px-1 font-semibold flex items-center gap-2 ${activeTab === 'subtasks' ? 'border-b-2 border-brand-green text-dark-text' : 'text-gray-text'}`}><CheckSquare className="w-4 h-4"/> Subtarefas</button>
                    <button onClick={() => setActiveTab('files')} className={`py-3 px-1 font-semibold flex items-center gap-2 ${activeTab === 'files' ? 'border-b-2 border-brand-green text-dark-text' : 'text-gray-text'}`}><Paperclip className="w-4 h-4"/> Arquivos</button>
                    <button onClick={() => setActiveTab('notes')} className={`py-3 px-1 font-semibold flex items-center gap-2 ${activeTab === 'notes' ? 'border-b-2 border-brand-green text-dark-text' : 'text-gray-text'}`}><Book className="w-4 h-4"/> Anotações</button>
                </nav>
            </div>

            <div className="bg-light-secondary p-6 rounded-xl shadow-card min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {totalTasks > 0 && (
                            <ProgressBar value={completedTasks} total={totalTasks} />
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <InfoItem icon={User} label="Cliente" value={project?.clientes?.nome || 'N/A'} />
                            <InfoItem icon={Calendar} label="Data de Início" value={project ? new Date(project.created_at).toLocaleDateString() : null} />
                            <InfoItem icon={Calendar} label="Previsão de Entrega" value={project ? new Date(project.data_entrega).toLocaleDateString() : null} />
                            <InfoItem icon={Tag} label="Tipo de Projeto" value={project?.tipo_projeto} />
                        </div>
                        <div className="border-t border-light-tertiary pt-6">
                            <h3 className="font-semibold text-dark-text mb-2">Descrição</h3>
                            <p className="text-gray-text">{project?.observacao || 'Nenhuma descrição fornecida.'}</p>
                        </div>
                    </div>
                )}
                {activeTab === 'subtasks' && (
                    <div>
                        <form onSubmit={handleAddSubtask} className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                value={newSubtaskName}
                                onChange={(e) => setNewSubtaskName(e.target.value)}
                                placeholder="Adicionar nova subtarefa..." 
                                className="flex-1 p-2 bg-gray-50 border border-light-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                            />
                            <button type="submit" className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Adicionar
                            </button>
                        </form>
                        <div className="space-y-1">
                            {subtasks.map(task => (
                                <SubtaskItem key={task.id} task={task} onToggle={handleToggleSubtask} onDelete={handleDeleteSubtask} onStatusChange={handleStatusChange} />
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'files' && (
                    <FilesTab projectId={projectId} />
                )}
                {activeTab === 'notes' && (
                    <NotesEditor 
                        content={notes}
                        onChange={handleNotesChange}
                        isSaving={isSavingNotes}
                    />
                )}
            </div>
        </div>
    );
}
