-- Habilita RLS para todas as tabelas necessárias
alter table projetos enable row level security;
alter table project_statuses enable row level security;
alter table task_groups enable row level security;

-- Adiciona política para permitir leitura de projetos em quadros públicos
drop policy if exists "Todos podem ler projetos de quadros públicos" on projetos;

create policy "Todos podem ler projetos de quadros públicos"
on projetos
for select using (
  exists (
    select 1
    from quadros
    where quadros.id = projetos.quadro_id
    and (quadros.is_public = true OR auth.uid() = quadros.user_id)
  )
);

-- Adiciona política para permitir leitura de status de projetos em quadros públicos
drop policy if exists "Todos podem ler status de quadros públicos" on project_statuses;

create policy "Todos podem ler status de quadros públicos"
on project_statuses
for select using (
  exists (
    select 1
    from quadros
    where quadros.id = project_statuses.quadro_id
    and (quadros.is_public = true OR auth.uid() = quadros.user_id)
  )
);

-- Adiciona política para permitir leitura de grupos de tarefas em quadros públicos
drop policy if exists "Todos podem ler grupos de tarefas de quadros públicos" on task_groups;

create policy "Todos podem ler grupos de tarefas de quadros públicos"
on task_groups
for select using (
  exists (
    select 1
    from projetos
    join quadros on quadros.id = projetos.quadro_id
    where projetos.id = task_groups.projeto_id
    and (quadros.is_public = true OR auth.uid() = quadros.user_id)
  )
);
