-- Verifica se o usuário tem permissão para atualizar um quadro
create policy "Usuários podem atualizar seus próprios quadros"
on quadros
for update using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

-- Verifica se o usuário tem permissão para ler um quadro
create policy "Todos podem ler quadros públicos"
on quadros
for select using (
  is_public = true OR auth.uid() = user_id
);
