// components/ui/SlideOverPanel.tsx
// Componente reutilizável para o painel lateral deslizante.

'use client';

import { X } from 'lucide-react';

type SlideOverPanelProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
};

export default function SlideOverPanel({ isOpen, onClose, title, children }: SlideOverPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40">
            {/* Fundo Escuro */}
            <div 
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            ></div>

            {/* Painel de Conteúdo */}
            <div className="absolute top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-dark-secondary shadow-xl flex flex-col">
                {/* Cabeçalho do Painel */}
                <div className="flex justify-between items-center p-6 border-b border-light-tertiary dark:border-dark-tertiary">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Conteúdo do Formulário */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
