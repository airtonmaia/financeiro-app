// app/dashboard/clients/new/page.tsx
// Página com formulário para cadastrar um novo cliente.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export default function NewClientPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    // Estados para os campos do formulário, baseados na tabela 'clientes'
    const [nome, setNome] = useState('');
    const [email_contato, setEmailContato] = useState('');
    const [telefone, setTelefone] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [cpf_cnpj, setCPFCNPJ] = useState('');
    const [origem, setOrigem] = useState('');

    // Estados para o feedback da UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Obter o usuário logado para associar o cliente a ele
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError("Você precisa estar logado para criar um cliente.");
            setLoading(false);
            return;
        }

        // Inserir os dados na tabela 'clientes' do Supabase
        const { error: insertError } = await supabase
            .from('clientes')
            .insert({
                user_id: user.id,
                nome,
                email_contato,
                telefone,
                empresa,
                origem,
                cpf_cnpj,
            });

        if (insertError) {
            setError(`Erro ao salvar: ${insertError.message}`);
            setLoading(false);
        } else {
            // Em caso de sucesso, redireciona para a lista de clientes
            router.push('/dashboard/clients');
            // Força a atualização da lista de clientes na página anterior
            router.refresh(); 
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-card">
                <h1 className="text-2xl font-bold text-dark-text mb-8">Cadastrar Novo Cliente</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="nome" className="block text-sm font-medium text-gray-text mb-1">Nome do Cliente / Contato*</label>
                            <input type="text" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
                        </div>
                        <div>
                            <label htmlFor="empresa" className="block text-sm font-medium text-gray-text mb-1">Empresa (opcional)</label>
                            <input type="text" id="empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-text mb-1">Email de Contato*</label>
                            <input type="email" id="email" value={email_contato} onChange={(e) => setEmailContato(e.target.value)} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
                        </div>
                         <div>
                            <label htmlFor="cpf_cnpj" className="block text-sm font-medium text-gray-text mb-1">CPF/CNPJ</label>
                            <input type="text" id="cpf_cnpj" value={cpf_cnpj} onChange={(e) => setCPFCNPJ(e.target.value)} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
                        </div>
                        <div>
                            <label htmlFor="telefone" className="block text-sm font-medium text-gray-text mb-1">Telefone*</label>
                            <input type="tel" id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
                        </div>
                        <div className="md:col-span-2">
                             <label htmlFor="origem" className="block text-sm font-medium text-gray-text mb-1">Origem do Cliente*</label>
                             <select id="origem" value={origem} onChange={(e) => setOrigem(e.target.value)} required className="w-full p-3 bg-gray-50 border border-light-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green appearance-none">
                                <option value="" disabled>Selecione a origem</option>
                                <option value="Indicação">Indicação</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Site">Site</option>
                                <option value="Prospecção Ativa">Prospecção Ativa</option>
                                <option value="Outro">Outro</option>
                             </select>
                        </div>
                    </div>
                    
                    {error && <p className="text-sm text-danger-text mt-4">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                         <button type="button" onClick={() => router.back()} className="bg-white hover:bg-light-tertiary text-dark-text font-semibold py-2 px-6 rounded-lg border border-light-tertiary">
                            Cancelar
                         </button>
                         <button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-600/90 text-white font-semibold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {loading ? 'Salvando...' : 'Salvar Cliente'}
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
