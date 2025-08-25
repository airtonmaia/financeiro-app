-- Adiciona a coluna is_public na tabela quadros
ALTER TABLE quadros
ADD COLUMN is_public boolean DEFAULT false;

-- Atualiza as políticas de segurança
drop policy if exists "Usuários podem atualizar seus próprios quadros" on quadros;
drop policy if exists "Todos podem ler quadros públicos" on quadros;

create policy "Usuários podem atualizar seus próprios quadros"
on quadros
for update using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "Todos podem ler quadros públicos"
on quadros
for select using (
  is_public = true OR auth.uid() = user_id
);
