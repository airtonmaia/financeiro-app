// app/dashboard/projects/page.tsx
// Página para listar e gerenciar todos os projetos.

'use client'; 

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type Project } from '@/types'; 
import { Edit, Trash2, Plus, List, LayoutGrid } from 'lucide-react';

// --- COMPONENTES ---

// Componente para um item da lista de projetos, agora com mais colunas
function ProjectListItem({ project, onDelete }: { project: Project, onDelete: (id: string) => void }) {
    const deliveryStatusColors: { [key: string]: string } = {
        'A fazer': 'bg-gray-200 text-gray-800',
        'Em andamento': 'bg-purple-100 text-purple-800',
        'Finalizado': 'bg-green-100 text-green-800',
    };

    const paymentStatusColors: { [key: string]: string } = {
        'Pendente': 'bg-red-100 text-red-800',
        'Parcialmente pago': 'bg-yellow-100 text-yellow-800',
        'Totalmente pago': 'bg-green-100 text-green-800',
    };
    
    // Lógica de placeholder para o valor pago
    const valorPago = project.status_pagamento === 'Totalmente pago' ? project.valor_total : (project.status_pagamento === 'Parcialmente pago' ? project.valor_total / 2 : 0);

    return (
        <div className="border-b border-light-tertiary last:border-b-0">
            {/* Layout para Desktop */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 items-center py-4 px-5 hover:bg-gray-50 transition-colors text-sm">
                <div className="col-span-2 font-bold text-dark-text truncate">
                    <Link href={`/dashboard/projects/${project.id}`} className="hover:text-brand-blue">
                        {project.descricao}
                    </Link>
                </div>
                <div className="col-span-2 text-gray-text truncate">{project.clientes?.nome || 'N/A'}</div>
                <div className="col-span-1 text-gray-text">{new Date(project.data_entrega).toLocaleDateString()}</div>
                <div className="col-span-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${deliveryStatusColors[project.status_entrega] || 'bg-gray-100'}`}>
                        {project.status_entrega}
                    </span>
                </div>
                <div className="col-span-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[project.status_pagamento] || 'bg-gray-100'}`}>
                        {project.status_pagamento}
                    </span>
                </div>
                <div className="col-span-1 text-gray-text">R$ {project.valor_total.toFixed(2)}</div>
                <div className="col-span-1 text-gray-text">R$ {valorPago.toFixed(2)}</div>
                <div className="col-span-1 text-gray-text">{project.assinatura ? 'Sim' : 'Não'}</div>
                <div className="col-span-1 flex items-center justify-end gap-2">
                    <Link href={`/dashboard/projects/${project.id}/edit`}>
                        <button className="p-2 text-gray-text hover:text-brand-blue hover:bg-blue-100 rounded-full" title="Editar Projeto"><Edit className="w-4 h-4" /></button>
                    </Link>
                    <button onClick={() => onDelete(project.id)} className="p-2 text-gray-text hover:text-danger-text hover:bg-red-100 rounded-full" title="Excluir Projeto"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>
            
            {/* Layout para Mobile */}
            <div className="md:hidden p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <Link href={`/dashboard/projects/${project.id}`} className="font-bold text-dark-text hover:text-brand-blue">{project.descricao}</Link>
                        <p className="text-sm text-gray-text">{project.clientes?.nome || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2 -mt-1">
                        <Link href={`/dashboard/projects/${project.id}/edit`}><button className="p-2 text-gray-text"><Edit className="w-4 h-4" /></button></Link>
                        <button onClick={() => onDelete(project.id)} className="p-2 text-gray-text"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="font-semibold">Status:</span> <span className={`px-2 py-1 text-xs rounded-full ${deliveryStatusColors[project.status_entrega]}`}>{project.status_entrega}</span></div>
                    <div><span className="font-semibold">Pagamento:</span> <span className={`px-2 py-1 text-xs rounded-full ${paymentStatusColors[project.status_pagamento]}`}>{project.status_pagamento}</span></div>
                    <div><span className="font-semibold">Prazo:</span> {new Date(project.data_entrega).toLocaleDateString()}</div>
                    <div><span className="font-semibold">Assinatura:</span> {project.assinatura ? 'Sim' : 'Não'}</div>
                    <div><span className="font-semibold">Valor Total:</span> R$ {project.valor_total.toFixed(2)}</div>
                    <div><span className="font-semibold">Valor Pago:</span> R$ {valorPago.toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
        .from('projetos')
        .select('*, clientes ( nome )') // A query já busca todos os campos necessários
        .order('created_at', { ascending: false });

    if (error) {
        setError(`Erro ao carregar projetos: ${error.message}`);
    } else {
        setProjects(data as Project[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteProject = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
        const { error } = await supabase.from('projetos').delete().eq('id', id);
        if (error) {
            alert(`Erro ao excluir projeto: ${error.message}`);
        } else {
            setProjects(projects.filter(p => p.id !== id));
        }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-light-secondary rounded-xl shadow-card overflow-x-auto">
        <div className="p-5 border-b border-light-tertiary flex justify-between items-center">
            <div>
                <h3 className="font-bold text-dark-text">Lista de Projetos</h3>
                <p className="text-sm text-gray-text">Visualize e gerencie todos os seus projetos.</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-brand-green/20 text-brand-green' : 'text-gray-text hover:bg-gray-100'}`}><List className="w-5 h-5" /></button>
                <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg ${viewMode === 'kanban' ? 'bg-brand-green/20 text-brand-green' : 'text-gray-text hover:bg-gray-100'}`}><LayoutGrid className="w-5 h-5" /></button>
            </div>
        </div>
        
        {viewMode === 'list' && (
            <div>
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 border-b border-light-tertiary bg-gray-50 text-xs font-bold text-gray-text uppercase tracking-wider">
                    <h4 className="col-span-2">Projeto</h4>
                    <h4 className="col-span-2">Cliente</h4>
                    <h4 className="col-span-1">Prazo</h4>
                    <h4 className="col-span-1">Status</h4>
                    <h4 className="col-span-2">Status Pag.</h4>
                    <h4 className="col-span-1">Valor Total</h4>
                    <h4 className="col-span-1">Valor Pago</h4>
                    <h4 className="col-span-1">Assinatura</h4>
                    <h4 className="col-span-1 text-right">Ações</h4>
                </div>
                <div>
                    {loading && <p className="p-5 text-center text-gray-text">Carregando projetos...</p>}
                    {error && <p className="p-5 text-center text-danger-text">{error}</p>}
                    {!loading && !error && projects.length === 0 && <p className="p-5 text-center text-gray-text">Nenhum projeto cadastrado.</p>}
                    {!loading && !error && projects.length > 0 && projects.map((project) => (
                        <ProjectListItem key={project.id} project={project} onDelete={handleDeleteProject} />
                    ))}
                </div>
            </div>
        )}

        {viewMode === 'kanban' && (
            <div className="p-5 text-center text-gray-text">A visualização em modo Kanban será implementada em breve!</div>
        )}
      </div>
    </div>
  );
}
