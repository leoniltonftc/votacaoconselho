
import React from 'react';

interface WelcomeScreenProps {
    onEnter: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
    return (
        <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-100">
            {/* Animated background shapes */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-20 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="relative w-full max-w-6xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-12 border border-white/50 animate-fade-in flex flex-col items-center">
                
                <header className="text-center mb-12 max-w-3xl">
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase shadow-sm">
                        Sistema de Votação Eletrônica v2.0
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-800 mb-6 tracking-tight leading-tight">
                        Decisões inteligentes,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">resultados imediatos.</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                        Uma plataforma completa para gestão de plenárias, com autenticação híbrida, 
                        controle de pauta em tempo real e auditoria transparente.
                    </p>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                    {/* Card 1: Segurança e Acesso */}
                    <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-3xl">🔐</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Acesso & Segurança</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Sistema de login flexível com suporte a <strong>listas locais</strong> e integração direta com <strong>Google Sheets</strong>. Controle total sobre usuários e administradores.
                        </p>
                    </div>

                    {/* Card 2: Gestão de Propostas */}
                    <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-3xl">📊</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Controle da Sessão</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Gerencie o ciclo de vida das propostas: <strong>Pendentes, Em Votação e Votadas</strong>. Visualize resultados parciais e definitivos instantaneamente no telão.
                        </p>
                    </div>

                    {/* Card 3: Relatórios e Dados */}
                    <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-3xl">📂</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Auditoria Completa</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Geração automática de relatórios detalhados em <strong>PDF</strong> e backup completo dos dados em <strong>Excel</strong> (XLSX) com separação por abas.
                        </p>
                    </div>
                </main>

                <div className="flex flex-col items-center space-y-4 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                    <button
                        onClick={onEnter}
                        className="group relative px-8 py-4 bg-slate-900 text-white font-bold text-lg rounded-full shadow-2xl hover:bg-slate-800 transition-all duration-300 hover:shadow-blue-500/30 focus:outline-none focus:ring-4 focus:ring-slate-300 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Iniciar Sistema 
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <p className="text-xs text-slate-400 font-medium">Versão Segura • Dados Sincronizados</p>
                </div>

            </div>
        </div>
    );
};

export default WelcomeScreen;
