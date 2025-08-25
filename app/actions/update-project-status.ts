import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';

export async function updateProjectStatus(projectId: string, newStatus: string) {
    const supabase = createServerActionClient({ cookies });
    
    try {
        const { error } = await supabase
            .from('projetos')
            .update({ status_entrega: newStatus })
            .eq('id', projectId);

        if (error) throw error;
        
        // Revalidate the board page to show the updated status
        revalidatePath('/public/board/[id]');
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        return { success: false, error };
    }
}
