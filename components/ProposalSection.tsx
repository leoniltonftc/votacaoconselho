
import React from 'react';

interface ProposalSectionProps {
    eixo: string;
    title: string;
    text: string;
    originalTitle?: string;
    originalText?: string;
}

const ProposalSection: React.FC<ProposalSectionProps> = React.memo(({ eixo, title, text, originalTitle, originalText }) => {
    return (
        <section className="glass rounded-3xl shadow-xl p-6 md:p-10 mb-6 mx-1 sm:mx-2 border border-white/50">
            
            {/* Header do Cartão */}
            <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-100">
                    Pauta em Votação
                </span>
                <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Coluna do Eixo */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 h-full flex flex-col justify-center items-center text-center">
                        <span className="text-4xl mb-2">🎯</span>
                        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Eixo Temático</h3>
                        <p className="text-slate-800 font-bold text-lg leading-tight">{eixo}</p>
                    </div>
                </div>

                {/* Coluna do Texto */}
                <div className="lg:col-span-9">
                     {originalText ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Original */}
                            <div className="relative bg-slate-50 border border-slate-200 p-6 rounded-2xl opacity-75">
                                <div className="absolute -top-3 left-4 bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase">Original</div>
                                {originalTitle && <h4 className="font-bold text-slate-700 mb-2 mt-2">{originalTitle}</h4>}
                                <p className="text-slate-600 text-sm leading-relaxed">{originalText}</p>
                            </div>

                            {/* Nova / Supressão */}
                            <div className="relative bg-white border-2 border-blue-500 p-6 rounded-2xl shadow-lg">
                                <div className="absolute -top-3 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">Nova Proposta</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 mt-2">{title}</h3>
                                <p className="text-slate-700 leading-relaxed">{text}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-2xl shadow-sm">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">{title}</h3>
                            <p className="text-lg text-slate-700 leading-relaxed font-light">
                                {text}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
});

export default ProposalSection;
