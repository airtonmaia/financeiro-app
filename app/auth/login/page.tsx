// app/auth/login/page.tsx
// Componente de página para o login de usuários.

'use client';
import { useState } from 'react';
// CORREÇÃO: Importa a função para criar o cliente do Supabase
import { createSupabaseBrowserClient } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Usar Link para navegação interna

export default function LoginPage() {
  // CORREÇÃO: Cria a instância do cliente Supabase chamando a função
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Função para lidar com o processo de login.
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Chama o método signInWithPassword do Supabase para autenticar o usuário.
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      // O middleware irá detetar a sessão de usuário e fazer o redirecionamento para /dashboard.
      router.refresh();

    } catch (error: any) {
      setMessage(`Erro ao fazer login: ${error.message}`);
      setLoading(false); // Garante que o loading para em caso de erro.
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="p-8 bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-100">
            Entrar
        </h1>
        <form onSubmit={handleSignIn}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm font-semibold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 bg-gray-700 border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu.email@exemplo.com"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-semibold mb-2">Senha:</label>
            <input
              type="password"
              id="password"
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-200 bg-gray-700 border-gray-600 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="********"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transform transition duration-300 hover:scale-105 disabled:bg-gray-500"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <Link href="/auth/signup" className="inline-block align-baseline font-semibold text-sm text-blue-400 hover:text-blue-300 transition duration-200">
              Criar conta
            </Link>
          </div>
        </form>
        {message && (
          <p className="text-center text-sm mt-4 p-3 rounded-lg bg-red-900 text-red-200">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
