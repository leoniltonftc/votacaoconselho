
import React from 'react';
import { Proposal } from '../types';

interface PresentationScreenProps {
    proposal: Proposal | null;
    onClose: () => void;
    defaultTitle: string;
    defaultQuestion: string;
}

const PresentationScreen: React.FC<PresentationScreenProps> = ({ proposal, onClose, defaultTitle, defaultQuestion }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
            {/* Header Minimalista */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-4">
                    <span className="text-3xl">🗳️</span>
                    <h1 className="text-2xl font-bold tracking-wide text-slate-200 uppercase">
                        {defaultTitle}
                    </h1>
                </div>
                <button 
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors text-sm shadow-sm"
                >
                    Sair do Modo Apresentação
                </button>
            </div>

            {/* Conteúdo Principal Centralizado */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-slate-50 overflow-y-auto">
                <div className="max-w-6xl w-full text-center space-y-12">
                    
                    {proposal ? (
                        <>
                            {/* Eixo com destaque */}
                            <div className="inline-block">
                                <span className="px-6 py-3 rounded-full bg-blue-100 text-blue-800 text-2xl lg:text-3xl font-bold border border-blue-200 shadow-sm">
                                    {proposal.categoria}
                                </span>
                            </div>

                            {/* Título da Proposta Gigante */}
                            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight tracking-tight">
                                {proposal.titulo}
                            </h2>

                            {/* Texto da Proposta Grande */}
                            <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200">
                                <p className="text-3xl lg:text-5xl text-slate-700 leading-relaxed font-medium">
                                    "{proposal.descricao}"
                                </p>
                            </div>

                            {/* Detalhes Rodapé */}
                            <div className="flex justify-center gap-8 text-xl text-slate-500 font-medium mt-8">
                                <span>📍 {proposal.municipio}</span>
                                <span>•</span>
                                <span>🌍 {proposal.abrangencia}</span>
                            </div>
                        </>
                    ) : (
                        <div className="animate-pulse flex flex-col items-center justify-center space-y-6 opacity-50">
                            <div className="text-9xl">⏳</div>
                            <h2 className="text-5xl font-bold text-slate-400">{defaultQuestion}</h2>
                            <p className="text-3xl text-slate-400">Aguardando a próxima proposta...</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Barra de Status Inferior */}
            <div className="bg-slate-100 p-4 text-center text-slate-400 text-sm font-medium border-t border-slate-200">
                Modo de Exibição para Projetor • Pressione ESC ou clique em Sair para voltar
            </div>
        </div>
    );
};

export default PresentationScreen;
