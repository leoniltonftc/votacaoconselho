
import React from 'react';

interface WelcomeScreenProps {
    onEnter: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-200 -z-20"></div>
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000 -z-10"></div>

            <div className="glass w-full max-w-5xl rounded-3xl shadow-2xl p-8 md:p-16 border border-white/60 flex flex-col items-center text-center fade-in-up">
                
                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold tracking-widest uppercase shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        Sistema Online v3.0
                    </span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                    Votação <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Inteligente</span>
                </h1>
                
                <p className="text-lg md:text-2xl text-slate-600 max-w-2xl mb-12 leading-relaxed font-light">
                    Plataforma segura para gestão de plenárias, controle de eixos e apuração em tempo real.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                    <div className="bg-white/60 p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                        <div className="text-4xl mb-3">🔐</div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">Segurança Total</h3>
                        <p className="text-sm text-slate-500">Autenticação híbrida via CPF e controle de acesso por níveis.</p>
                    </div>
                    <div className="bg-white/60 p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                        <div className="text-4xl mb-3">⚡</div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">Tempo Real</h3>
                        <p className="text-sm text-slate-500">Sincronização instantânea entre todos os dispositivos conectados.</p>
                    </div>
                    <div className="bg-white/60 p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                        <div className="text-4xl mb-3">📊</div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">Gestão Completa</h3>
                        <p className="text-sm text-slate-500">Relatórios detalhados, gráficos e exportação para Excel/PDF.</p>
                    </div>
                </div>

                <button
                    onClick={onEnter}
                    className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-slate-900 font-lg rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                    <span className="mr-2 text-lg">Iniciar Sessão</span>
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                </button>

                <p className="mt-6 text-xs text-slate-400 font-medium">
                    Desenvolvido para alta performance e confiabilidade.
                </p>
            </div>
        </div>
    );
};

export default WelcomeScreen;
