
import React, { useState } from 'react';
import { Proposal, Vote, CurrentProposalRecord, ProposalSheetsConfig } from '../../types';
import CadastrarProposta from './tabs/CadastrarProposta';
import ListarPropostas from './tabs/ListarPropostas';
import SelecionarProposta from './tabs/SelecionarProposta';
import Acompanhamento from './tabs/Acompanhamento';
import VotosIndividuais from './tabs/VotosIndividuais';

interface ProposalManagementProps {
    votes: Vote[];
    proposals: Proposal[];
    proposalSheetsConfig: ProposalSheetsConfig | null;
    currentProposalId?: string;
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
    onSaveProposalSheetsConfig: (config: ProposalSheetsConfig) => void;
    onCreateProposal: (proposal: Proposal) => void;
    onUpdateProposal: (proposal: Proposal) => void;
    onDeleteProposal: (proposal: Proposal) => void;
    onSelectProposal: (proposalData: CurrentProposalRecord) => void;
    onResetProposalVote: (proposalId: string) => void;
}

type ActiveTab = 'cadastrar' | 'listar' | 'selecionar' | 'acompanhamento' | 'votosIndividuais';

const ProposalManagement: React.FC<ProposalManagementProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('listar');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'cadastrar':
                return <CadastrarProposta {...props} />;
            case 'listar':
                return <ListarPropostas 
                    proposals={props.proposals}
                    onUpdateProposal={props.onUpdateProposal}
                    onDeleteProposal={props.onDeleteProposal}
                    showAdminMessage={props.showAdminMessage}
                    onResetProposalVote={props.onResetProposalVote}
                />;
            case 'selecionar':
                return <SelecionarProposta 
                    proposals={props.proposals}
                    currentProposalId={props.currentProposalId}
                    onSelectProposal={props.onSelectProposal}
                    showAdminMessage={props.showAdminMessage}
                    onResetProposalVote={props.onResetProposalVote}
                />;
            case 'acompanhamento':
                return <Acompanhamento {...props} />;
            case 'votosIndividuais':
                return <VotosIndividuais votes={props.votes} proposals={props.proposals} />;
            default:
                return null;
        }
    };

    const TabButton: React.FC<{ tabName: ActiveTab, label: string, icon: string }> = ({ tabName, label, icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${activeTab === tabName ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
           {icon} {label}
        </button>
    );

    return (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 Gerenciar Propostas</h3>
            <div className="flex flex-wrap gap-1 mb-6 bg-gray-200 rounded-lg p-1">
                <TabButton tabName="listar" label="Listar Propostas" icon="📋" />
                <TabButton tabName="selecionar" label="Selecionar" icon="🎯" />
                <TabButton tabName="cadastrar" label="Cadastrar Nova" icon="➕" />
                <TabButton tabName="acompanhamento" label="Acompanhamento" icon="📊" />
                <TabButton tabName="votosIndividuais" label="Votos Individuais" icon="🗳️" />
            </div>
            <div>
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ProposalManagement;
