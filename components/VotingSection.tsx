
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

const VotingSection: React.FC<VotingSectionProps> = React.memo(({ status, hasVoted, onVote, userCode, userEixo, proposalEixo, systemPhase, onLogout }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const canVote = () => {
        if (systemPhase === SystemPhase.PLENARIA) return true;
        if (!proposalEixo || !userEixo) return false;
        return proposalEixo.trim().toLowerCase() === userEixo.trim().toLowerCase();
    };

    const isAllowedToVote = canVote();
    const isNotStarted = status === VotingStatus.NOT_STARTED || status === VotingStatus.NEW_VOTING_CREATED;

    const handleVoteClick = async (voteOption: 'SIM' | 'NÃO' | 'ABSTENÇÃO') => {
        if (!isAllowedToVote) return;
        setIsLoading(true);
        setErrorMessage(null);
        try {
            await onVote(voteOption);
            setSuccessMessage(true);
        } catch (error) {
            setErrorMessage("Erro ao registrar voto.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const showVotingArea = status === VotingStatus.STARTED && !hasVoted && !successMessage;

    return (
        <section className="glass rounded-3xl shadow-xl p-6 md:p-8 mb-8 mx-1 sm:mx-2 border border-white/60">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-slate-200/60 pb-4 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {showVotingArea && isAllowedToVote ? 'Sua Decisão' : 'Status da Votação'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {showVotingArea && isAllowedToVote ? 'Selecione uma opção abaixo para registrar seu voto.' : 'Acompanhe o andamento da sessão.'}
                    </p>
                </div>
                
                {!isNotStarted && (
                    <div className="flex gap-2">
                        {userEixo && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isAllowedToVote ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                                <span className="text-lg">{isAllowedToVote ? '🔓' : '🔒'}</span>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] font-bold uppercase opacity-70">Seu Eixo</span>
                                    <span className="font-bold text-sm">{userEixo}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* ÁREA DE VOTAÇÃO ATIVA */}
            {showVotingArea && isAllowedToVote && (
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button onClick={() => handleVoteClick('SIM')} className="group relative overflow-hidden bg-white border-2 border-green-500 hover:bg-green-500 text-green-600 hover:text-white rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-green-200 hover:shadow-xl transform hover:-translate-y-1 active:scale-95">
                        <div className="flex flex-col items-center relative z-10">
                            <span className="text-5xl mb-3 filter grayscale group-hover:grayscale-0 transition-all">✅</span>
                            <span className="text-2xl font-black tracking-tight">SIM</span>
                            <span className="text-xs font-medium opacity-70 mt-1">Aprovar Proposta</span>
                        </div>
                    </button>

                    <button onClick={() => handleVoteClick('NÃO')} className="group relative overflow-hidden bg-white border-2 border-red-500 hover:bg-red-500 text-red-600 hover:text-white rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-red-200 hover:shadow-xl transform hover:-translate-y-1 active:scale-95">
                        <div className="flex flex-col items-center relative z-10">
                            <span className="text-5xl mb-3 filter grayscale group-hover:grayscale-0 transition-all">❌</span>
                            <span className="text-2xl font-black tracking-tight">NÃO</span>
                            <span className="text-xs font-medium opacity-70 mt-1">Rejeitar Proposta</span>
                        </div>
                    </button>

                    <button onClick={() => handleVoteClick('ABSTENÇÃO')} className="group relative overflow-hidden bg-white border-2 border-yellow-400 hover:bg-yellow-400 text-yellow-600 hover:text-white rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-yellow-200 hover:shadow-xl transform hover:-translate-y-1 active:scale-95 md:col-span-1">
                        <div className="flex flex-col items-center relative z-10">
                            <span className="text-5xl mb-3 filter grayscale group-hover:grayscale-0 transition-all">✋</span>
                            <span className="text-2xl font-black tracking-tight">ABSTENÇÃO</span>
                            <span className="text-xs font-medium opacity-70 mt-1">Não opinar</span>
                        </div>
                    </button>
                </div>
            )}

            {/* MENSAGEM DE BLOQUEIO */}
            {status === VotingStatus.STARTED && !isAllowedToVote && !hasVoted && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full text-3xl mb-4">✋</div>
                    <h3 className="text-xl font-bold text-orange-800 mb-2">Voto Não Permitido</h3>
                    <p className="text-orange-700 max-w-md mx-auto">
                        A proposta atual pertence ao eixo <strong>{proposalEixo}</strong>, mas você está cadastrado no <strong>{userEixo}</strong>.
                    </p>
                </div>
            )}

            {/* MENSAGEM DE SUCESSO */}
            {(hasVoted || successMessage) && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-3xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">Voto Confirmado!</h3>
                    <p className="text-green-700">Seu voto foi registrado com segurança.</p>
                </div>
            )}
            
            {/* MENSAGEM DE AGUARDANDO */}
            {isNotStarted && (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-10 text-center opacity-75">
                    <div className="text-5xl mb-4 grayscale opacity-50">⏳</div>
                    <h3 className="text-xl font-bold text-slate-600 mb-1">Aguardando Início</h3>
                    <p className="text-slate-500">O administrador iniciará a votação em breve.</p>
                </div>
            )}
            
            <div className="mt-8 pt-4 border-t border-slate-200/60 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span>ID: {userCode}</span>
                </div>
                <button onClick={onLogout} className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider">
                    Encerrar Sessão
                </button>
            </div>
        </section>
    );
});

export default VotingSection;
