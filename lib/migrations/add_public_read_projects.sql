-- Enable RLS on projects table
alter table public.projetos enable row level security;

-- Create policy for public access to projects that belong to public boards
create policy "Allow public access to projects in public boards" on public.projetos
    for select
    using (
        exists (
            select 1 from public.quadros
            where quadros.id = projetos.quadro_id
            and quadros.is_public = true
        )
    );

-- Also need to allow public access to task_groups
alter table public.task_groups enable row level security;

create policy "Allow public access to task groups of public projects" on public.task_groups
    for select
    using (
        exists (
            select 1 from public.projetos p
            join public.quadros q on q.id = p.quadro_id
            where task_groups.projeto_id = p.id
            and q.is_public = true
        )
    );
