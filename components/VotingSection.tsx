
import React, { useState } from 'react';
import { VotingStatus } from '../types';

interface VotingSectionProps {
    status: VotingStatus;
    hasVoted: boolean;
    onVote: (vote: 'SIM' | 'NÃO' | 'ABSTENÇÃO') => void;
    userCode: string | null;
    onLogout: () => void;
}

const VotingSection: React.FC<VotingSectionProps> = ({ status, hasVoted, onVote, userCode, onLogout }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleVoteClick = async (voteOption: 'SIM' | 'NÃO' | 'ABSTENÇÃO') => {
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
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center px-2">
              {showVotingArea ? 'Escolha uma das opções para votar' : 'Acompanhe a votação'}
            </h2>
            
            {showVotingArea && (
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button onClick={() => handleVoteClick('SIM')} className="vote-button bg-green-500 hover:bg-green-600 text-white font-bold py-4 sm:py-6 px-4 sm:px-8 rounded-lg sm:rounded-xl text-base sm:text-lg lg:text-xl shadow-lg w-full">
                        <div className="flex flex-col items-center"><span className="text-2xl sm:text-3xl mb-1 sm:mb-2">✅</span> <span>SIM</span></div>
                    </button>
                    <button onClick={() => handleVoteClick('NÃO')} className="vote-button bg-red-500 hover:bg-red-600 text-white font-bold py-4 sm:py-6 px-4 sm:px-8 rounded-lg sm:rounded-xl text-base sm:text-lg lg:text-xl shadow-lg w-full">
                        <div className="flex flex-col items-center"><span className="text-2xl sm:text-3xl mb-1 sm:mb-2">❌</span> <span>NÃO</span></div>
                    </button>
                    <button onClick={() => handleVoteClick('ABSTENÇÃO')} className="vote-button bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 sm:py-6 px-4 sm:px-8 rounded-lg sm:rounded-xl text-base sm:text-lg lg:text-xl shadow-lg w-full lg:col-span-1 sm:col-span-2">
                        <div className="flex flex-col items-center"><span className="text-2xl sm:text-3xl mb-1 sm:mb-2">⚪</span> <span>ABSTENÇÃO</span></div>
                    </button>
                </div>
            )}

            {(hasVoted || successMessage) && (
                <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
                    <span className="text-2xl">🎉</span>
                    <p className="font-semibold">Voto registrado com sucesso!</p>
                    <p className="text-sm">Obrigado por participar da votação.</p>
                </div>
            )}
            
            {errorMessage && (
                <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
                    <span className="text-2xl">⚠️</span>
                    <p className="font-semibold">Erro ao registrar voto</p>
                    <p className="text-sm">{errorMessage}</p>
                </div>
            )}

            {status === VotingStatus.NOT_STARTED && (
                <div className="mt-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-center">
                    <span className="text-2xl">⏳</span>
                    <p className="font-semibold">Votação Não Iniciada</p>
                    <p className="text-sm">A votação ainda não foi iniciada pelo administrador. Aguarde o início para poder votar.</p>
                </div>
            )}
            
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-green-600">👤</span>
                        <span className="text-sm font-medium text-green-800">Conectado como:</span>
                        <span className="text-sm font-mono text-green-700 bg-green-100 px-2 py-1 rounded">{userCode}</span>
                    </div>
                    <button onClick={onLogout} className="text-xs text-red-600 hover:text-red-800 underline">Sair</button>
                </div>
            </div>
        </section>
    );
};

export default VotingSection;
