import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

type Props = {
    params: {
        id: string;
    };
};

export default async function PublicBoardPage({ params }: Props) {
    const boardId = params.id;
    const supabase = createServerComponentClient({ cookies });

    try {
        const { data: boardData, error: boardError } = await supabase
            .from('quadros')
            .select('nome')
            .eq('id', boardId)
            .eq('is_public', true)
            .single();

        if (boardError) throw new Error('Quadro não encontrado');

        const { data: statusData } = await supabase
            .from('project_statuses')
            .select('id, name, color, display_order')
            .eq('quadro_id', boardId)
            .order('display_order', { ascending: true });

        const { data: projects = [] } = await supabase
            .from('projetos')
            .select('id, descricao, data_entrega, status_entrega')
            .eq('quadro_id', boardId);

        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <h1 className="text-2xl font-bold">{boardData.nome}</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {statusData?.map((status) => (
                            <div
                                key={status.id}
                                className="bg-card rounded-lg shadow p-4"
                                style={{ borderTop: "3px solid " + status.color }}
                            >
                                <h3 className="font-semibold mb-4">{status.name}</h3>
                                <div className="space-y-4">
                                    {Array.isArray(projects) && projects
                                        .filter(project => project.status_entrega === status.name)
                                        .map(project => (
                                            <div
                                                key={project.id}
                                                className={cn(
                                                    "rounded-lg border bg-card text-card-foreground shadow-sm",
                                                    "p-4 space-y-2"
                                                )}
                                            >
                                                <h4 className="font-medium">{project.descricao}</h4>
                                                {project.data_entrega && (
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>
                                                            {format(new Date(project.data_entrega), 'dd/MM/yyyy')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Link>
                    <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                        <p>{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
                    </div>
                </div>
            </div>
        );
    }
}