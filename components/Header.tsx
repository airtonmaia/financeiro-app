// components/Header.tsx
// Componente reutilizável para o cabeçalho superior da página, com dados do usuário e novo design.

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';
import { Plus, UserPlus, FolderPlus, ArrowUpCircle, ArrowDownCircle, Bell, Search, ChevronDown, Moon, Sun } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import {
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function Header() {
    const supabase = createSupabaseBrowserClient();
    const router = useRouter();
    
    const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const quickAccessRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();

        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        }
    }, [supabase]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (quickAccessRef.current && !quickAccessRef.current.contains(event.target as Node)) {
                setIsQuickAccessOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDarkMode = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
        setIsDarkMode(!isDarkMode);
    };
    
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    const getUserInitials = () => user?.email?.charAt(0).toUpperCase() || '?';

    return (
        <header className="bg-card p-4 lg:p-6 flex justify-between items-center border-b border-border">
           <div className="flex items-center">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />            
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" placeholder="Pesquisar..." className="bg-muted rounded-lg pl-10 pr-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            </div>
            <div className="flex-1 md:flex-grow-0 flex justify-end items-center gap-4">
                <div className="relative" ref={quickAccessRef}>
                    <button onClick={() => setIsQuickAccessOpen(!isQuickAccessOpen)} className="bg-primary hover:bg-opacity-90 text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-lg" title="Acesso Rápido">
                      <Plus className="w-5 h-5" />
                    </button>
                    {isQuickAccessOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground rounded-lg shadow-xl z-10 border border-border">
                            <div className="py-2">
                                <Link href="/dashboard/clients/new" className="flex items-center px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md"><UserPlus className="w-4 h-4 mr-3 text-muted-foreground" />Novo Cliente</Link>
                                <Link href="/dashboard/projects/new" className="flex items-center px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md"><FolderPlus className="w-4 h-4 mr-3 text-muted-foreground" />Novo Projeto</Link>
                                <div className="border-t border-border my-1"></div>
                                <Link href="#" className="flex items-center px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md"><ArrowUpCircle className="w-4 h-4 mr-3 text-success-500" />Nova Receita</Link>
                                <Link href="#" className="flex items-center px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md"><ArrowDownCircle className="w-4 h-4 mr-3 text-error-500" />Nova Despesa</Link>
                            </div>
                        </div>
                    )}
                </div>

                <button className="bg-muted hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-full w-10 h-10 flex items-center justify-center relative" title="Notificações">
                    <Bell className="w-5 h-5" />
                </button>

                <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-bold text-muted-foreground">
                            {getUserInitials()}
                        </div>
                        <div className="hidden sm:block">
                            <p className="font-semibold text-sm text-foreground">Airton Maia</p>
                            <p className="text-xs text-muted-foreground">{user ? user.email : '...'}</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {isUserMenuOpen && (
                         <div className="absolute right-0 mt-2 w-64 bg-popover text-popover-foreground rounded-lg shadow-xl z-10 border border-border">
                            <div className="p-4 border-b border-border">
                                <p className="font-bold text-popover-foreground">Airton Maia</p>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                            <div className="py-2">
                                <a href="#" className="block px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">Meu Perfil</a>
                                <a href="#" className="block px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">Configurações</a>
                                <div className="flex justify-between items-center px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                                    <span>Dark Mode</span>
                                    <button onClick={toggleDarkMode} className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${isDarkMode ? 'bg-primary' : 'bg-muted'}`}>
                                        <span className={`w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? 'transform translate-x-5' : ''}`}></span>
                                    </button>
                                </div>
                            </div>
                            <div className="border-t border-border">
                                <button onClick={handleSignOut} className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">Sair</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}