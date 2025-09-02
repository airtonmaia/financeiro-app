// types/index.ts
// Ficheiro central para armazenar os tipos de dados da aplicação.

export type Status = {
  id: string;
  name: string;
  color: string;
  display_order: number;
  quadro_id: string;
  user_id: string;
  is_final_status?: boolean;
};

export type Client = {
  id: string;
  created_at: string;
  nome: string;
  empresa: string | null;
  email_contato: string;
  telefone: string;
  cpf_cnpj: string | null;
    website?: string; // <- garanta que existe e é string ou string | null
  origem: string;
};

export type Parcela = {
    valor: number;
    data: string;
    pago: boolean;
};

// NOVO: Tipo para Grupo de Tarefas
export type TaskGroup = {
  id: string;
  projeto_id: string;
  user_id: string;
  nome: string;
  status_id: string;
  subtarefas: Subtask[];
  created_at?: string;
};

export type Subtask = {
  id: string;
  group_id: string; // MODIFICADO: Referencia o grupo
  nome: string;
  status: string;
  concluida: boolean;
  created_at: string;
};

export type Project = {
  id: string;
  created_at: string;
  user_id: string;
  quadro_id: string;
  prioridade?: 'Baixa' | 'Média' | 'Alta' | null;
  responsaveis?: string | null;
  cliente_id?: string;
  descricao: string;
  data_entrega?: string | null;
  observacao?: string | null;
  status_entrega?: string;
  status_pagamento: string;
  valor_pago?: number;
  valor_total?: number;
  assinatura: boolean;
  tipo_projeto?: string | null;
  anotacoes?: string | null;
  detalhes_pagamento?: {
    tipo: 'À Vista' | '50/50' | 'Parcelado';
    parcelas: Parcela[];
  } | null;
  clientes?: { 
    nome: string;
  } | null;
  task_groups?: TaskGroup[]; // MODIFICADO: Usa a nova estrutura
};

export type Transacao = {
    id: string;
    descricao: string;
    valor: number;
    tipo: 'Receita' | 'Despesa';
    data: string;
    status: 'Pago' | 'Pendente' | 'Atrasado';
    categoria: string;
    projeto_id: string | null;
    cliente_id: string | null;
    recorrente?: boolean;
    frequencia?: string;
    projetos?: { descricao: string } | null;
    clientes?: { nome: string } | null;
    isGenerated?: boolean;
};

export type Quadro = {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  imagem_cover_url: string | null;
};

export type ProjectStatus = {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  quadro_id: string;
  display_order: number;
  is_final_status?: boolean;
};

export type Categoria = {
    id: string;
    nome: string;
    tipo: 'projeto' | 'receita' | 'despesa' | 'emprestimo';
};
