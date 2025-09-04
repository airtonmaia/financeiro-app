'use client';

import { useState, useEffect } from 'react';
import { DragDropBoard } from '@/components/DragDropBoard';
import { createSupabaseBrowserClient } from '@/lib/supabase';

import { Project, Status } from '@/types';

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
                .select('*')
                .eq('quadro_id', boardId);
            
            if (projectsData) {
                setProjects(projectsData);
            }
        }, 60000); // 60000ms = 1 minute

        return () => clearInterval(interval);
    }, [boardId, supabase]);

    return <DragDropBoard projects={projects} statuses={initialStatuses} />;
}
