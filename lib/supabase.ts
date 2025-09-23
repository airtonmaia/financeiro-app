// lib/supabase.ts
// Este ficheiro inicializa o cliente Supabase para o LADO DO NAVEGADOR (client-side).

import { createBrowserClient } from '@supabase/ssr';

// Esta função cria um cliente Supabase que pode ser usado em qualquer
// Componente de Cliente ('use client'). Ele usa as variáveis de ambiente
// para se conectar ao seu projeto Supabase.

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please check your .env.local file.');
    console.error('Required variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error('Supabase configuration is missing. Please add your Supabase URL and API key to .env.local');
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
