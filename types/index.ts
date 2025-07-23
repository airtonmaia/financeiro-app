// types/index.ts
// Ficheiro central para armazenar os tipos de dados da aplicação.

export type Client = {
  id: string;
  created_at: string;
  nome: string;
  empresa: string | null;
  email_contato: string;
  telefone: string;
  cpf_cnpj: string | null;
  origem: string;
};

export type Parcela = {
    valor: number;
    data: string;
    pago: boolean;
};

export type Project = {
  id: string;
  created_at: string;
  cliente_id: string;
  descricao: string; 
  observacao: string | null;
  data_entrega: string;
  status_entrega: string;
  valor_total: number;
  assinatura: boolean;
  tipo_projeto: string | null;
  detalhes_pagamento: {
    tipo: 'À Vista' | '50/50' | 'Parcelado';
    parcelas: Parcela[];
  } | null;
  status_pagamento: string;
  anotacoes?: string | null;
  clientes: { 
    nome: string;
  } | null;
};

export type Subtask = {
  id: string;
  projeto_id: string;
  nome: string;
  status: string;
  concluida: boolean;
  created_at: string;
};

// ATUALIZAÇÃO: Adicionados campos para recorrência
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
};
