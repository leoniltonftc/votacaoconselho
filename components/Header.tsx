
import React from 'react';
import { VotingStatus } from '../types';

interface HeaderProps {
    title: string;
    question: string;
    status: VotingStatus;
    totalVotes: number;
}

const Header: React.FC<HeaderProps> = ({ title, question, status, totalVotes }) => {
    
    const getStatusText = () => {
        switch (status) {
            case VotingStatus.NOT_STARTED:
                return 'Aguardando início da votação';
            case VotingStatus.STARTED:
                if (totalVotes === 0) {
                  return 'Votação em andamento • Seja o primeiro a votar!';
                }
                return `Votação em andamento • ${totalVotes} voto${totalVotes !== 1 ? 's' : ''} registrado${totalVotes !== 1 ? 's' : ''}`;
            case VotingStatus.CLOSED:
                return `Votação encerrada • ${totalVotes} voto${totalVotes !== 1 ? 's' : ''} computado${totalVotes !== 1 ? 's' : ''}`;
            default:
                return 'Aguardando início da votação';
        }
    }

    return (
        <header className="text-center mb-4 sm:mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4 px-2">{title}</h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-2 px-2">{question}</p>
            <div className="text-xs sm:text-sm text-gray-500 px-2">{getStatusText()}</div>
        </header>
    );
};

export default Header;
