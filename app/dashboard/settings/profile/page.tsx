// app/dashboard/settings/profile/page.tsx
// Página para o usuário visualizar e editar suas informações de perfil e segurança.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { User, Lock, Bell, Shield } from 'lucide-react';

// --- COMPONENTE: Aba de Informações Pessoais ---
function PersonalInformationTab() {
    const supabase = createSupabaseBrowserClient();
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [department, setDepartment] = useState('');
    const [location, setLocation] = useState('');
    const [timezone, setTimezone] = useState('');
    const [bio, setBio] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);


    const fetchProfile = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            setEmail(user.email || '');
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setFullName(data.full_name || '');
                setPhone(data.phone || '');
                setCompany(data.company || '');
                setJobTitle(data.job_title || '');
                setDepartment(data.department || '');
                setLocation(data.location || '');
                setTimezone(data.timezone || '');
                setBio(data.bio || '');
            }
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const updates = {
                id: user.id,
                full_name: fullName,
                phone,
                company,
                job_title: jobTitle,
                department,
                location,
                timezone,
                bio,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) {
                setMessage({ type: 'error', text: 'Erro ao atualizar o perfil: ' + error.message });
            } else {
                setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            }
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" value={email} disabled className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cargo</label>
                        <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Empresa</label>
                        <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Departamento</label>
                        <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Localização</label>
                        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fuso Horário</label>
                        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm">
                            <option>(GMT-3) São Paulo</option>
                            <option>(GMT-4) Manaus</option>
                        </select>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-4">Biografia</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Sobre você</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"></textarea>
                </div>
            </div>
            <div className="flex justify-end items-center gap-4 pt-4 border-t">
                {message && <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
                <button type="submit" disabled={loading} className="bg-gray-800 text-white font-semibold py-2 px-5 rounded-lg hover:bg-gray-900 disabled:bg-gray-400">
                    {loading ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
}

// --- COMPONENTE: Aba de Segurança ---
function SecurityTab() {
    const supabase = createSupabaseBrowserClient();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem.' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setMessage({ type: 'error', text: 'Erro ao atualizar a senha: ' + error.message });
        } else {
            setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Alterar Senha</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" 
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" 
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            </div>
            <div className="flex justify-end items-center gap-4 pt-4 border-t">
                {message && <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
                <button type="submit" disabled={loading} className="bg-gray-800 text-white font-semibold py-2 px-5 rounded-lg hover:bg-gray-900 disabled:bg-gray-400">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    );
}


// --- PÁGINA PRINCIPAL ---
export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('personal');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Configurações do Perfil</h1>
                <p className="text-sm text-gray-500">Gerencie suas informações pessoais e preferências.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Coluna Esquerda - Avatar e Info Rápida */}
                <div className="lg:w-1/4 space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                        <img
                            className="w-24 h-24 rounded-full mx-auto mb-4"
                            src="https://placehold.co/100x100/7C3AED/FFFFFF?text=A"
                            alt="Avatar do usuário"
                        />
                        <h2 className="font-bold text-lg">Airton Maia</h2>
                        <p className="text-sm text-gray-500">Engenheiro de Software</p>
                    </div>
                </div>

                {/* Coluna Direita - Formulário e Abas */}
                <div className="lg:flex-1">
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="border-b p-4">
                            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto">
                                <button onClick={() => setActiveTab('personal')} className={`px-3 py-2 font-medium text-sm rounded-md flex items-center gap-2 ${activeTab === 'personal' ? 'text-violet-700 bg-violet-100' : 'text-gray-500 hover:bg-gray-100'}`}><User size={16}/> Informações</button>
                                <button onClick={() => setActiveTab('security')} className={`px-3 py-2 font-medium text-sm rounded-md flex items-center gap-2 ${activeTab === 'security' ? 'text-violet-700 bg-violet-100' : 'text-gray-500 hover:bg-gray-100'}`}><Lock size={16}/> Segurança</button>
                                <button onClick={() => setActiveTab('notifications')} className={`px-3 py-2 font-medium text-sm rounded-md flex items-center gap-2 ${activeTab === 'notifications' ? 'text-violet-700 bg-violet-100' : 'text-gray-500 hover:bg-gray-100'}`}><Bell size={16}/> Notificações</button>
                                <button onClick={() => setActiveTab('privacy')} className={`px-3 py-2 font-medium text-sm rounded-md flex items-center gap-2 ${activeTab === 'privacy' ? 'text-violet-700 bg-violet-100' : 'text-gray-500 hover:bg-gray-100'}`}><Shield size={16}/> Privacidade</button>
                            </nav>
                        </div>
                        <div className="p-6">
                            {activeTab === 'personal' && <PersonalInformationTab />}
                            {activeTab === 'security' && <SecurityTab />}
                            {activeTab === 'notifications' && <div className="text-center text-gray-500 p-8">Configurações de notificações em breve.</div>}
                            {activeTab === 'privacy' && <div className="text-center text-gray-500 p-8">Configurações de privacidade em breve.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
