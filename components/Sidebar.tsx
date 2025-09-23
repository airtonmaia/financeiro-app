'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import {
  LayoutDashboard, Wallet, Users, FileText, DollarSign, ChevronDown, Landmark,
  ArrowRightLeft, HandCoins, Building2, Repeat, Settings, LogOut, Palette, BarChart3, User, FolderKanban
} from 'lucide-react';
import {
    Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
    SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarGroupLabel,
    SidebarSeparator
} from '@/components/ui/sidebar';
import { Separator } from "@/components/ui/separator"

// --- TIPOS E DADOS ---
type NavItem = {
  href?: string;
  icon: React.ElementType;
  text: string;
  subItems?: { href: string; text: string; icon: React.ElementType; }[];
};
type Quadro = { id: string; nome: string; cor: string; };

const navItems: NavItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, text: 'Painel' },
    { href: '/dashboard/clients', icon: Users, text: 'Clientes' },
    { href: '/dashboard/projects', icon: Wallet, text: 'Projetos' },
    { 
      icon: DollarSign, 
      text: 'Financeiro',
      subItems: [
          { href: '/dashboard/financeiro/visao-geral', text: 'Visão Geral', icon: BarChart3 },
          { href: '/dashboard/financeiro/bancos', text: 'Bancos', icon: Landmark },
          { href: '/dashboard/financeiro/fluxo-de-caixa', text: 'Fluxo de Caixa', icon: ArrowRightLeft },
          { href: '/dashboard/financeiro/emprestimos', text: 'Empréstimos', icon: HandCoins },
          { href: '#', text: 'Fornecedores', icon: Building2 },
          { href: '#', text: 'Assinaturas', icon: Repeat },
      ]
    },
    { href: '/dashboard/invoices', icon: FileText, text: 'Notas Fiscais' },
];

// --- HOOKS ---
function usePrevious<T>(value: T): T | undefined {
    const ref = React.useRef<T>();
    React.useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

// --- COMPONENTES ---

function NavGroup({ icon: Icon, text, subItems, activeSubItem }: { icon: React.ElementType; text: string; subItems: { href: string; text: string; icon: React.ElementType; }[]; activeSubItem: boolean; }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = React.useState(activeSubItem);
    const wasActive = usePrevious(activeSubItem);

    React.useEffect(() => {
        if (activeSubItem && !wasActive) {
            setIsOpen(true);
        }
    }, [activeSubItem, wasActive]);

    return (
        <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setIsOpen(!isOpen)} isActive={activeSubItem} className="justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span>{text}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </SidebarMenuButton>
            {isOpen && (
                <SidebarMenuSub>
                    {subItems.map(sub => (
                        <SidebarMenuSubItem key={sub.text}>
                            <Link href={sub.href} className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-sidebar-accent">
                                <sub.icon className="w-4 h-4" />
                                <span>{sub.text}</span>
                            </Link>
                        </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
            )}
        </SidebarMenuItem>
    );
}

export default function NewSidebar() {
    const pathname = usePathname();
    const [boards, setBoards] = React.useState<Quadro[]>([]);
    const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
    const [supabaseError, setSupabaseError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchBoardsAndLogo = async () => {
            try {
                const supabase = createSupabaseBrowserClient();
                
                const { data: boardsData } = await supabase.from('quadros').select('id, nome, cor');
                if (boardsData) {
                    setBoards(boardsData as Quadro[]);
                }

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('logo_url').eq('id', user.id).single();
                    if (profile && profile.logo_url) {
                        setLogoUrl(profile.logo_url);
                    }
                }
            } catch (error) {
                console.error('Supabase initialization error:', error);
                setSupabaseError('Database connection not configured. Please set up your Supabase credentials.');
            }
        };
        fetchBoardsAndLogo();
    }, []);

    if (supabaseError) {
        return (
            <Sidebar className="p-2 bg-sidebar">
                <SidebarHeader>
                    <div className="flex items-center lg:justify-start">
                        <span className="ml-1 text-xl font-bold text-violet-700 dark:text-light-text">Agência 360</span>
                    </div>
                    <Separator className="my-4" />
                </SidebarHeader>
                <SidebarContent>
                    <div className="p-4 text-center text-muted-foreground">
                        <p className="text-sm">{supabaseError}</p>
                        <p className="text-xs mt-2">Check your .env.local file</p>
                    </div>
                </SidebarContent>
            </Sidebar>
        );
    }

    return (
        <Sidebar className="p-2 bg-sidebar">
            <SidebarHeader>
                <Link href="/dashboard" className="flex items-center lg:justify-start ">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-24" />
                    ) : (
                        <span className="ml-1 text-xl font-bold text-violet-700 dark:text-light-text">Agência 360</span>
                    )}
                </Link>
                <Separator className="my-4" />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
                <SidebarMenu>
                    {navItems.map((item) => (
                        item.subItems ? (
                            <NavGroup 
                                key={item.text}
                                icon={item.icon}
                                text={item.text}
                                subItems={item.subItems}
                                activeSubItem={item.subItems.some(sub => pathname.startsWith(sub.href))}
                            />
                        ) : (
                            <SidebarMenuItem key={item.text}>
                                <SidebarMenuButton asChild isActive={pathname === item.href}>
                                    <Link href={item.href!}>
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.text}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    ))}
                </SidebarMenu>
                 
                <SidebarMenu>
                    <SidebarGroupLabel>Quadros</SidebarGroupLabel>
                    {boards.map(board => (
                        <SidebarMenuItem key={board.id}>
                            <SidebarMenuButton asChild isActive={pathname.includes(board.id)}>
                                <Link href={`/dashboard/projects/board/${board.id}`}>
                                    <FolderKanban className="w-5 h-5 mr-2" color={board.cor} />
                                    <span>{board.nome}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>

            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <NavGroup 
                        icon={Settings}
                        text="Configurações"
                        subItems={[
                            { href: '/dashboard/settings/profile', text: 'Perfil', icon: User },
                            { href: '/dashboard/settings/customization', text: 'Personalização', icon: Palette }
                        ]}
                        activeSubItem={pathname.startsWith('/dashboard/settings')}
                    />
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/auth/login">
                                <LogOut className="w-5 h-5" />
                                <span>Sair</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}