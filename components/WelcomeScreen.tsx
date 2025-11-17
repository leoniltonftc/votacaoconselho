import React from 'react';

interface WelcomeScreenProps {
    onEnter: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
    return (
        <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Animated background shapes */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

            <div className="relative w-full max-w-5xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-white/30 animate-fade-in">
                <header className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-800 mb-3 tracking-tight">
                        Bem-vindo ao <span className="text-blue-600">Sistema de Votação</span>
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl text-gray-600">
                        A saúde que se constrói com a voz de todos.
                    </p>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
                    {/* Card 1: Funcionalidades */}
                    <div className="welcome-card animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="card-icon bg-blue-100 text-blue-600">🚀</div>
                        <h2 className="card-title text-blue-800">
                            Funcionalidades
                        </h2>
                        <ul className="card-list">
                            <li>Votação em tempo real</li>
                            <li>Autenticação segura</li>
                            <li>Painel de administração completo</li>
                            <li>Gerenciamento de propostas</li>
                            <li>Resultados instantâneos</li>
                        </ul>
                    </div>

                    {/* Card 2: Vantagens */}
                    <div className="welcome-card animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="card-icon bg-green-100 text-green-600">✅</div>
                        <h2 className="card-title text-green-800">
                            Vantagens
                        </h2>
                        <ul className="card-list">
                            <li>Transparência no processo</li>
                            <li>Agilidade na tomada de decisão</li>
                            <li>Participação democrática</li>
                            <li>Segurança e confiabilidade</li>
                            <li>Interface intuitiva e moderna</li>
                        </ul>
                    </div>

                    {/* Card 3: Nossos Objetivos */}
                    <div className="welcome-card animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
                        <div className="card-icon bg-purple-100 text-purple-600">🎯</div>
                        <h2 className="card-title text-purple-800">
                            Nossos Objetivos
                        </h2>
                        <ul className="card-list">
                            <li>Engajar participantes</li>
                            <li>Facilitar a organização de plenárias</li>
                            <li>Garantir a legitimidade das votações</li>
                            <li>Otimizar o tempo de apuração</li>
                            <li>Modernizar processos democráticos</li>
                        </ul>
                    </div>
                </main>

                <footer className="text-center">
                    <button
                        onClick={onEnter}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white font-bold py-4 px-10 rounded-full transition-all transform hover:scale-105 text-lg shadow-xl animate-pulse-slow focus:outline-none focus:ring-4 focus:ring-blue-300"
                    >
                        Acessar Sistema de Votação →
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default WelcomeScreen;
