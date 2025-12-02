
import React from 'react';
import { VotingStatus } from '../types';

interface HeaderProps {
    title: string;
    question: string;
    status: VotingStatus;
    totalVotes: number;
}

const Header: React.FC<HeaderProps> = ({ title, question, status, totalVotes }) => {
    
    const getStatusInfo = () => {
        switch (status) {
            case VotingStatus.NOT_STARTED:
                return { text: 'Aguardando', color: 'bg-slate-200 text-slate-600', icon: '⏳' };
            case VotingStatus.STARTED:
                return { text: 'Em Andamento', color: 'bg-green-100 text-green-700 border-green-200 animate-pulse', icon: '🔴' };
            case VotingStatus.CLOSED:
                return { text: 'Encerrada', color: 'bg-red-100 text-red-700 border-red-200', icon: '🔒' };
            default:
                return { text: 'Aguardando', color: 'bg-slate-200 text-slate-600', icon: '⏳' };
        }
    }

    const statusInfo = getStatusInfo();

    return (
        <header className="glass sticky top-2 z-40 mx-auto max-w-7xl rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    V
                </div>
                <div className="text-left">
                    <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">{title}</h1>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">{question}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {status === VotingStatus.STARTED && (
                     <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Votos</span>
                        <span className="text-lg font-black text-slate-800">{totalVotes}</span>
                    </div>
                )}
                
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${statusInfo.color} shadow-sm`}>
                    <span className="text-sm">{statusInfo.icon}</span>
                    <span className="text-xs md:text-sm font-bold uppercase tracking-wide">{statusInfo.text}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
