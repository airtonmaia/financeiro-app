// app/dashboard/settings/profile/page.tsx
// Página para o usuário visualizar e editar suas informações de perfil e segurança.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { User, Lock, Bell, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
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

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const updates = { id: user.id, full_name: fullName, phone, company, job_title: jobTitle, department, location, timezone, bio, updated_at: new Date() };
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
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Nome Completo</label>
                        <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                        <Input type="email" value={email} disabled />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Telefone</label>
                        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Cargo</label>
                        <Input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Empresa</label>
                        <Input type="text" value={company} onChange={(e) => setCompany(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Departamento</label>
                        <Input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Localização</label>
                        <Input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Fuso Horário</label>
                        <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger><SelectValue placeholder="Selecione o fuso horário" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gmt-3">(GMT-3) São Paulo</SelectItem>
                                <SelectItem value="gmt-4">(GMT-4) Manaus</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-4">Biografia</h3>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Sobre você</label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
                </div>
            </div>
            <div className="flex justify-end items-center gap-4 pt-4 border-t border-border">
                {message && <p className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-destructive'}`}>{message.text}</p>}
                <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
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
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Nova Senha</label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Confirmar Nova Senha</label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                </div>
            </div>
            <div className="flex justify-end items-center gap-4 pt-4 border-t border-border">
                {message && <p className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-destructive'}`}>{message.text}</p>}
                <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</Button>
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
                <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais e preferências.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Coluna Esquerda - Avatar e Info Rápida */}
                <div className="lg:w-1/4 space-y-4">
                    <div className="bg-card p-6 rounded-lg shadow-sm text-center">
                        <img
                            className="w-24 h-24 rounded-full mx-auto mb-4"
                            src="https://placehold.co/100x100/7C3AED/FFFFFF?text=A"
                            alt="Avatar do usuário"
                        />
                        <h2 className="font-bold text-lg">Airton Maia</h2>
                        <p className="text-sm text-muted-foreground">Engenheiro de Software</p>
                    </div>
                </div>

                {/* Coluna Direita - Formulário e Abas */}
                <div className="lg:flex-1">
                    <div className="bg-card rounded-lg shadow-sm">
                        <div className="border-b border-border p-4">
                            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto">
                                <Button variant={activeTab === 'personal' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('personal')}><User size={16}/> Informações</Button>
                                <Button variant={activeTab === 'security' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('security')}><Lock size={16}/> Segurança</Button>
                                <Button variant={activeTab === 'notifications' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('notifications')}><Bell size={16}/> Notificações</Button>
                                <Button variant={activeTab === 'privacy' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('privacy')}><Shield size={16}/> Privacidade</Button>
                            </nav>
                        </div>
                        <div className="p-6">
                            {activeTab === 'personal' && <PersonalInformationTab />}
                            {activeTab === 'security' && <SecurityTab />}
                            {activeTab === 'notifications' && <div className="text-center text-muted-foreground p-8">Configurações de notificações em breve.</div>}
                            {activeTab === 'privacy' && <div className="text-center text-muted-foreground p-8">Configurações de privacidade em breve.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}