import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { PublicBoardClient } from './board-client';

type Props = {
    params: {
        id: string;
    };
};

export default async function PublicBoardPage({ params }: Props) {
    const boardId = params.id;
    const supabase = createServerComponentClient({ cookies });

    try {
        const [boardResponse, statusResponse, projectsResponse] = await Promise.all([
            supabase
                .from('quadros')
                .select('nome')
                .eq('id', boardId)
                .eq('is_public', true)
                .single(),
            supabase
                .from('project_statuses')
                .select('id, name, color, display_order')
                .eq('quadro_id', boardId)
                .order('display_order', { ascending: true }),
            supabase
                .from('projetos')
                .select('*')
                .eq('quadro_id', boardId)
        ]);

        if (boardResponse.error) throw new Error('Quadro não encontrado');
        if (statusResponse.error) throw new Error('Erro ao carregar status');
        if (projectsResponse.error) throw new Error('Erro ao carregar projetos');

        const boardData = boardResponse.data;
        const statusData = statusResponse.data;
        const projects = projectsResponse.data || [];

        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <h1 className="text-2xl font-bold">{boardData.nome}</h1>
                    <PublicBoardClient initialProjects={projects} initialStatuses={statusData} boardId={boardId} />
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
