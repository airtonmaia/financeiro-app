'use client';

import { useState, useEffect } from 'react';
import { DragDropBoard } from '@/components/DragDropBoard';
import { createSupabaseBrowserClient } from '@/lib/supabase';

// Re-defining types here as they are not exported from page.tsx
type Project = {
    id: string;
    descricao: string;
    data_entrega: string | null | undefined;
    status_entrega: string;
};

type Status = {
    id: string;
    name: string;
    color: string;
};

type PublicBoardClientProps = {
    initialProjects: Project[];
    initialStatuses: Status[];
    boardId: string;
};

export function PublicBoardClient({ initialProjects, initialStatuses, boardId }: PublicBoardClientProps) {
    const [projects, setProjects] = useState(initialProjects);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        const interval = setInterval(async () => {
            const { data: projectsData } = await supabase
                .from('projetos')
                .select('id, descricao, data_entrega, status_entrega')
                .eq('quadro_id', boardId);
            
            if (projectsData) {
                setProjects(projectsData as any);
            }
        }, 60000); // 60000ms = 1 minute

        return () => clearInterval(interval);
    }, [boardId, supabase]);

    return <DragDropBoard projects={projects} statuses={initialStatuses} />;
}
