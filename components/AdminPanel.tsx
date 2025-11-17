
import React, { useState, useEffect } from 'react';
import { Proposal, Vote, VotingStatus, SheetsConfig, CurrentProposalRecord, ProposalSheetsConfig } from '../types';
import ProposalManagement from './admin/ProposalManagement';
import VotingControl from './admin/VotingControl';
import SheetsAuthConfig from './admin/SheetsAuthConfig';

interface AdminPanelProps {
    votes: Vote[];
    proposals: Proposal[];
    votingStatus: VotingStatus;
    sheetsConfig: SheetsConfig | null;
    proposalSheetsConfig: ProposalSheetsConfig | null;
    onStartVoting: () => void;
    onEndVoting: () => void;
    onNewVoting: () => void;
    onSaveSheetsConfig: (config: SheetsConfig) => void;
    onSaveProposalSheetsConfig: (config: ProposalSheetsConfig) => void;
    onClose: () => void;
    onCreateProposal: (proposal: Proposal) => void;
    onUpdateProposal: (proposal: Proposal) => void;
    onDeleteProposal: (proposal: Proposal) => void;
    onSelectProposal: (proposalData: CurrentProposalRecord) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const showAdminMessage = (type: 'success' | 'error', text: string) => {
        setAdminMessage({ type, text });
        setTimeout(() => setAdminMessage(null), 5000);
    };

    return (
        <section className="admin-panel-section bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl p-3 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 mx-1 sm:mx-2">
            <div className="flex justify-between items-center mb-6 no-print">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">🔧 Painel Administrativo</h2>
                <button onClick={props.onClose} className="text-red-600 hover:text-red-800 text-sm underline">Fechar Painel</button>
            </div>

            <VotingControl
                votingStatus={props.votingStatus}
                votes={props.votes}
                onStartVoting={props.onStartVoting}
                onEndVoting={props.onEndVoting}
                onNewVoting={props.onNewVoting}
                showAdminMessage={showAdminMessage}
            />

            <SheetsAuthConfig
                sheetsConfig={props.sheetsConfig}
                onSaveSheetsConfig={props.onSaveSheetsConfig}
                showAdminMessage={showAdminMessage}
            />
            
            <ProposalManagement
                votes={props.votes}
                proposals={props.proposals}
                proposalSheetsConfig={props.proposalSheetsConfig}
                onSaveProposalSheetsConfig={props.onSaveProposalSheetsConfig}
                onCreateProposal={props.onCreateProposal}
                onUpdateProposal={props.onUpdateProposal}
                onDeleteProposal={props.onDeleteProposal}
                onSelectProposal={props.onSelectProposal}
                showAdminMessage={showAdminMessage}
            />

            {adminMessage && (
                <div className={`mt-4 p-4 rounded-lg text-center ${adminMessage.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
                    <span className="text-2xl">{adminMessage.type === 'success' ? '✅' : '⚠️'}</span>
                    <p className="font-semibold">{adminMessage.type === 'success' ? 'Operação realizada com sucesso!' : 'Erro na operação'}</p>
                    <p className="text-sm">{adminMessage.text}</p>
                </div>
            )}
        </section>
    );
};

export default AdminPanel;