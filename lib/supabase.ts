// lib/supabase.ts
// Este ficheiro inicializa o cliente Supabase para o LADO DO NAVEGADOR (client-side).

import { createBrowserClient } from '@supabase/ssr';

// Esta função cria um cliente Supabase que pode ser usado em qualquer
// Componente de Cliente ('use client'). Ele usa as variáveis de ambiente
// para se conectar ao seu projeto Supabase.

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}