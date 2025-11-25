import React, { useState } from 'react';
import { VotingStatus, SystemPhase } from '../types';

interface VotingSectionProps {
    status: VotingStatus;
    hasVoted: boolean;
    onVote: (vote: 'SIM' | 'NÃO' | 'ABSTENÇÃO') => void;
    userCode: string | null;
    userEixo?: string | null;
    proposalEixo?: string;
    systemPhase?: SystemPhase;
    onLogout: () => void;
}

const VotingSection: React.FC<VotingSectionProps> = ({ status, hasVoted, onVote, userCode, userEixo, proposalEixo, systemPhase, onLogout }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Lógica de restrição de Eixo
    // Se estiver na fase PLENARIA, todos votam.
    // Se estiver na fase EIXOS, deve haver match exato entre o eixo do usuário e o da proposta.
    const canVote = () => {
        if (systemPhase === SystemPhase.PLENARIA) return true;
        
        // Se não tem proposta definida ou usuário sem eixo, bloqueia por segurança
        if (!proposalEixo || !userEixo) return false;
        
        return proposalEixo.trim().toLowerCase() === userEixo.trim().toLowerCase();
    };

    const isAllowedToVote = canVote();

    const handleVoteClick = async (voteOption: 'SIM' | 'NÃO' | 'ABSTENÇÃO') => {
        if (!isAllowedToVote) return;
        
        setIsLoading(true);
        setErrorMessage(null);
        try {
            await onVote(voteOption);
            setSuccessMessage(true);
        } catch (error) {
            setErrorMessage("Erro ao registrar voto. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const showVotingArea = status === VotingStatus.STARTED && !hasVoted && !successMessage;

    return (
        <section className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl p-3 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 mx-1 sm:mx-2">
            <div className="flex items-center justify-between mb-4 sm:mb-6 px-2 border-b border-gray-100 pb-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">
                    {showVotingArea && isAllowedToVote ? 'Sua vez de votar' : 'Status da Votação'}
                </h2>
                
                {/* Badge do Eixo do Usuário */}
                {userEixo && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        Seu Eixo: {userEixo}
                    </span>
                )}
            </div>
            
            {/* ÁREA DE VOTAÇÃO ATIVA - Apenas se permitido */}
            {showVotingArea && isAllowedToVote && (
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button onClick={() => handleVoteClick('SIM')} className="vote-button bg-green-500 hover:bg-green-600 text-white font-bold py-4 sm:py-6 px-4 sm:px-8 rounded-lg sm:rounded-xl text-base sm:text-lg lg:text-xl shadow-lg w-full transition-transform transform hover:-translate-y-1">
                        <div className="flex flex-col items-center"><span className="text-3xl mb-2">✅</span> <span>SIM</span></div>
                    </button>
                    <button onClick={() => handleVoteClick('NÃO')} className="vote-button bg-red-500 hover:bg-red-600 text-white font-bold py-4 sm:py-6 px-4 sm:px-8 rounded-lg sm:rounded-xl text-base sm:text-lg lg:text-xl shadow-lg w-full transition-transform transform hover:-translate-y-1">
                        <div className="flex flex-col items-center"><span className="text-3xl mb-2">❌</span> <span>NÃO</span></div>
                    </button>
                    <button onClick={() => handleVoteClick('ABSTENÇÃO')} className="vote-button bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 sm:py-6 px-4 sm:px-8 rounded-lg sm:rounded-xl text-base sm:text-lg lg:text-xl shadow-lg w-full lg:col-span-1 sm:col-span-2 transition-transform transform hover:-translate-y-1">
                        <div className="flex flex-col items-center"><span className="text-3xl mb-2">⚪</span> <span>ABSTENÇÃO</span></div>
                    </button>
                </div>
            )}

            {/* MENSAGEM DE BLOQUEIO - Se votação aberta mas eixo diferente */}
            {status === VotingStatus.STARTED && !isAllowedToVote && !hasVoted && (
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl text-center">
                    <div className="text-4xl mb-3">✋</div>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Aguarde a vez do seu Eixo</h3>
                    <p className="text-gray-600">
                        A proposta atual pertence ao <strong className="text-indigo-600">{proposalEixo}</strong>.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Como você está cadastrado no <strong>{userEixo || 'Eixo Indefinido'}</strong>, seu voto não é permitido nesta rodada.
                    </p>
                </div>
            )}

            {/* MENSAGEM DE SUCESSO */}
            {(hasVoted || successMessage) && (
                <div className="p-6 bg-green-50 border border-green-200 text-green-800 rounded-xl text-center animate-fade-in">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="font-bold text-lg">Voto registrado com sucesso!</p>
                    <p className="text-sm opacity-80">Aguarde a próxima pauta.</p>
                </div>
            )}
            
            {/* MENSAGEM DE ERRO */}
            {errorMessage && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
                    <span className="font-bold">⚠️ {errorMessage}</span>
                </div>
            )}

            {/* MENSAGEM DE AGUARDANDO */}
            {status === VotingStatus.NOT_STARTED && (
                <div className="p-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-center">
                    <div className="text-4xl mb-2">⏳</div>
                    <p className="font-bold">Aguardando início da votação</p>
                    <p className="text-sm opacity-80">O administrador liberará o painel em breve.</p>
                </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs sm:text-sm text-gray-500">
                <div className="flex items-center gap-2">
                    <span>Conectado como:</span>
                    <strong className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">{userCode}</strong>
                </div>
                <button onClick={onLogout} className="text-red-500 hover:text-red-700 font-medium hover:underline">
                    Sair / Trocar Usuário
                </button>
            </div>
        </section>
    );
};

export default VotingSection;