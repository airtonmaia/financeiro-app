// components/Header.tsx
// Componente reutilizável para o cabeçalho superior da página, com dados do usuário e novo design.

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';
import { Plus, UserPlus, FolderPlus, ArrowUpCircle, ArrowDownCircle, Bell, Search, ChevronDown, Moon, Sun, LogOut } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function Header() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const [user, setUser] = useState<User | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();

        const darkMode = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDarkMode(darkMode);
        document.documentElement.classList.toggle('dark', darkMode);
    }, [supabase]);

    const toggleDarkMode = () => {
        const newIsDarkMode = !isDarkMode;
        setIsDarkMode(newIsDarkMode);
        localStorage.theme = newIsDarkMode ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newIsDarkMode);
    };
    
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    const getUserInitials = () => user?.email?.charAt(0).toUpperCase() || '?';

    return (
        <header className="bg-card p-4 lg:p-6 flex justify-between items-center border-b border-border">
           <div className="flex items-center gap-4">
                <SidebarTrigger className="-ml-1" />
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input type="text" placeholder="Pesquisar..." className="pl-10 w-80" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" title="Acesso Rápido">
                            <Plus className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Acesso Rápido</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link href="/dashboard/clients/new" className="flex items-center"><UserPlus className="w-4 h-4 mr-3" />Novo Cliente</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/dashboard/projects/new" className="flex items-center"><FolderPlus className="w-4 h-4 mr-3" />Novo Projeto</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link href="#" className="flex items-center"><ArrowUpCircle className="w-4 h-4 mr-3 text-success" />Nova Receita</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="#" className="flex items-center"><ArrowDownCircle className="w-4 h-4 mr-3 text-destructive" />Nova Despesa</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" title="Notificações">
                    <Bell className="w-5 h-5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={user?.user_metadata.avatar_url} />
                                <AvatarFallback>{getUserInitials()}</AvatarFallback>
                            </Avatar>
                            <div className="hidden sm:block text-left">
                                <p className="font-semibold text-sm text-foreground">Airton Maia</p>
                                <p className="text-xs text-muted-foreground">{user ? user.email : '...'}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>
                            <p className="font-bold">Airton Maia</p>
                            <p className="text-sm text-muted-foreground font-normal">{user?.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link href="/dashboard/settings/profile">Meu Perfil</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/dashboard/settings/customization">Configurações</Link></DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <div className="flex justify-between items-center w-full">
                                <span>Dark Mode</span>
                                <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}