// components/Sidebar.tsx
// Componente reutilizável para a barra de navegação lateral, agora com o menu de Configurações.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Wallet, Users, FileText, DollarSign, ChevronDown, Landmark,
  ArrowRightLeft, HandCoins, Building2, Repeat, Settings, LogOut, Palette, BarChart3
} from 'lucide-react';

// --- TIPOS E DADOS ---
type NavItem = {
  href?: string;
  icon: React.ElementType;
  text: string;
  subItems?: { href: string; text: string; icon: React.ElementType; }[];
};

const navItems: NavItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, text: 'Painel' },
    { href: '/dashboard/clients', icon: Users, text: 'Clientes' },
    { href: '/dashboard/projects', icon: Wallet, text: 'Projetos' },
    { 
      icon: DollarSign, 
      text: 'Financeiro',
      subItems: [
          // NOVO: Link para a Visão Geral
          { href: '/dashboard/financeiro/visao-geral', text: 'Visão Geral', icon: BarChart3 },
          { href: '/dashboard/financeiro/bancos', text: 'Bancos', icon: Landmark },
          { href: '/dashboard/financeiro/fluxo-de-caixa', text: 'Fluxo de Caixa', icon: ArrowRightLeft },
          { href: '/dashboard/financeiro/emprestimos', text: 'Empréstimos', icon: HandCoins },
          { href: '#', text: 'Fornecedores', icon: Building2 },
          { href: '#', text: 'Assinaturas', icon: Repeat },
      ]
    },
    { href: '#', icon: FileText, text: 'Notas Fiscais' },
];

// --- COMPONENTES ---

function NavLink({ href, icon: Icon, text, active }: { href: string; icon: React.ElementType; text: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-0 m-0 text-sm text-gray-800 p-3 rounded-lg transition-colors hover:bg-violet-600 hover:text-white duration-200 ${
        active
          ? 'bg-violet-600/10 text-brand-green font-semibold'
          : 'text-gray-text hover:bg-gray-100 hover:text-dark-text dark:hover:bg-dark-tertiary dark:hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="ml-4 hidden lg:block">{text}</span>
    </Link>
  );
}

function NavGroup({ icon: Icon, text, subItems, activeSubItem }: { icon: React.ElementType; text: string; subItems: { href: string; text: string; icon: React.ElementType; }[]; activeSubItem: boolean; }) {
    const [isOpen, setIsOpen] = useState(activeSubItem);

    return (
        <div className="">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                    activeSubItem ? 'text-brand-green font-semibold' : 'text-gray-text'
                } hover:bg-gray-100 hover:text-dark-text dark:hover:bg-dark-tertiary dark:hover:text-white`}
            >
                <div className="flex items-center">
                    <Icon className="w-5 h-5" />
                    <span className="ml-4 hidden lg:block">{text}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform hidden lg:block ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="mt-2 pl-6 lg:pl-8 space-y-1 ">
                    {subItems.map(item => (
                        <NavLink 
                            key={item.text}
                            href={item.href}
                            icon={item.icon}
                            text={item.text}
                            active={usePathname() === item.href}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-20 lg:w-64 bg-card p-4 flex flex-col justify-between border-r border-light-tertiary dark:bg-dark-secondary dark:border-dark-tertiary">
            <div>
                <div className="p-3 mb-10">
                    <Link href="/dashboard" className="flex items-center justify-center lg:justify-start">
                        {/* <div className="w-10 h-10 bg-brand-50 dark:bg-light-primary rounded-full">Pro</div> */}
                        <span className="ml-1 text-xl font-bold hidden lg:block text-brand-primary dark:text-light-text">Agência 360</span>
                    </Link>
                </div>
                <nav className="flex flex-col space-y-2 text-gray-700 hover:text-gray-900">
                    {navItems.map((item) => (
                        item.subItems ? (
                            <NavGroup 
                                key={item.text}
                                icon={item.icon}
                                text={item.text}
                                subItems={item.subItems}
                                activeSubItem={item.subItems.some(sub => sub.href === pathname)}
                            />
                        ) : (
                            <NavLink 
                                key={item.text}
                                href={item.href!}
                                icon={item.icon} 
                                text={item.text} 
                                active={pathname === item.href}
                            />
                        )
                    ))}
                </nav>
            </div>
            <div className="flex flex-col space-y-2">
                <NavGroup 
                    icon={Settings}
                    text="Configurações"
                    subItems={[
                        { href: '/dashboard/settings/customization', text: 'Personalização', icon: Palette }
                    ]}
                    activeSubItem={pathname.startsWith('/dashboard/settings')}
                />
                <NavLink href="/auth/login" icon={LogOut} text="Sair" active={false} />
            </div>
        </aside>
    );
}
