
import React from 'react';
import { Vote, VotingStatus } from '../../types';

interface VotingControlProps {
    votingStatus: VotingStatus;
    votes: Vote[];
    onStartVoting: () => void;
    onEndVoting: () => void;
    onNewVoting: () => void;
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
}

const VotingControl: React.FC<VotingControlProps> = ({ votingStatus, votes, onStartVoting, onEndVoting, onNewVoting, showAdminMessage }) => {

    const isStarted = votingStatus === VotingStatus.STARTED;
    const isClosed = votingStatus === VotingStatus.CLOSED;
    const isNotStarted = votingStatus === VotingStatus.NOT_STARTED || votingStatus === VotingStatus.NEW_VOTING_CREATED;

    const handleNewVoting = () => {
        if (window.confirm("ATENÇÃO: Esta ação apagará todos os votos e encerrará a votação atual. Deseja continuar?")) {
            onNewVoting();
            showAdminMessage('success', 'Nova votação criada! Os dados anteriores foram limpos.');
        }
    };
    
    const simVotes = votes.filter(v => v.voto === 'SIM').length;
    const naoVotes = votes.filter(v => v.voto === 'NÃO').length;
    const abstencaoVotes = votes.filter(v => v.voto === 'ABSTENÇÃO').length;


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Status da Votação</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status Atual:</span>
                        <span className={`font-semibold ${isStarted ? 'text-green-600' : isClosed ? 'text-red-600' : 'text-blue-600'}`}>
                            {isStarted ? 'Em Andamento' : isClosed ? 'Encerrada' : 'Não Iniciada'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total de Votos:</span>
                        <span className="font-semibold text-indigo-600">{votes.length}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-green-100 p-2 rounded"><div className="font-semibold text-green-800">SIM</div><div className="text-green-600">{simVotes}</div></div>
                        <div className="bg-red-100 p-2 rounded"><div className="font-semibold text-red-800">NÃO</div><div className="text-red-600">{naoVotes}</div></div>
                        <div className="bg-yellow-100 p-2 rounded"><div className="font-semibold text-yellow-800">ABST.</div><div className="text-yellow-600">{abstencaoVotes}</div></div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Controles</h3>
                <div className="space-y-4">
                    <button onClick={onStartVoting} disabled={!isNotStarted} className="admin-btn w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center space-x-3"><span>▶️</span> <span>Iniciar Votação</span></button>
                    <button onClick={onEndVoting} disabled={!isStarted} className="admin-btn w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center space-x-3"><span>⏹️</span> <span>Encerrar Votação</span></button>
                    <button onClick={handleNewVoting} disabled={isStarted} className="admin-btn w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center space-x-3"><span>🆕</span> <span>Nova Votação</span></button>
                </div>
            </div>
        </div>
    );
};

export default VotingControl;
