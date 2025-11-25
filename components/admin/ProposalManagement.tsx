

import React, { useState } from 'react';
import { Proposal, Vote, CurrentProposalRecord, ProposalSheetsConfig, SystemPhase, ClassificationRule } from '../../types';
import CadastrarProposta from './tabs/CadastrarProposta';
import ListarPropostas from './tabs/ListarPropostas';
import SelecionarProposta from './tabs/SelecionarProposta';
import Acompanhamento from './tabs/Acompanhamento';
import VotosIndividuais from './tabs/VotosIndividuais';
import { EIXOS } from '../../constants';

interface ProposalManagementProps {
    votes: Vote[];
    proposals: Proposal[];
    proposalSheetsConfig: ProposalSheetsConfig | null;
    currentProposalId?: string;
    systemPhase: SystemPhase;
    classificationRules: ClassificationRule[];
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
    onSaveProposalSheetsConfig: (config: ProposalSheetsConfig) => void;
    onCreateProposal: (proposal: Proposal) => void;
    onUpdateProposal: (proposal: Proposal) => void;
    onDeleteProposal: (proposal: Proposal) => void;
    onSelectProposal: (proposalData: CurrentProposalRecord) => void;
    onResetProposalVote: (proposalId: string) => void;
    onSaveClassificationRule: (rule: ClassificationRule) => void;
    onDeleteClassificationRule: (rule: ClassificationRule) => void;
}

type ActiveTab = 'cadastrar' | 'listar' | 'selecionar' | 'acompanhamento' | 'votosIndividuais';

const ProposalManagement: React.FC<ProposalManagementProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('listar');
    const [activeEixoTab, setActiveEixoTab] = useState<string>('ALL');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'cadastrar':
                return <CadastrarProposta 
                    {...props} 
                    defaultEixo={activeEixoTab !== 'ALL' ? activeEixoTab : ''}
                />;
            case 'listar':
                return <ListarPropostas 
                    proposals={props.proposals}
                    onUpdateProposal={props.onUpdateProposal}
                    onDeleteProposal={props.onDeleteProposal}
                    showAdminMessage={props.showAdminMessage}
                    onResetProposalVote={props.onResetProposalVote}
                    filterEixo={activeEixoTab !== 'ALL' ? activeEixoTab : undefined}
                />;
            case 'selecionar':
                return <SelecionarProposta 
                    proposals={props.proposals}
                    currentProposalId={props.currentProposalId}
                    onSelectProposal={props.onSelectProposal}
                    showAdminMessage={props.showAdminMessage}
                    onResetProposalVote={props.onResetProposalVote}
                    systemPhase={props.systemPhase}
                    filterEixo={activeEixoTab !== 'ALL' ? activeEixoTab : undefined}
                />;
            case 'acompanhamento':
                return <Acompanhamento 
                    proposals={props.proposals} 
                    onUpdateProposal={props.onUpdateProposal}
                    showAdminMessage={props.showAdminMessage}
                    classificationRules={props.classificationRules}
                    onSaveClassificationRule={props.onSaveClassificationRule}
                    onDeleteClassificationRule={props.onDeleteClassificationRule}
                />;
            case 'votosIndividuais':
                return <VotosIndividuais votes={props.votes} proposals={props.proposals} />;
            default:
                return null;
        }
    };

    const TabButton: React.FC<{ tabName: ActiveTab, label: string, icon: string }> = ({ tabName, label, icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${activeTab === tabName ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
        >
           {icon} {label}
        </button>
    );

    return (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">📝 Gerenciar Propostas</h3>
            </div>

            {/* Abas de Eixos (Painéis) */}
            <div className="mb-4 overflow-x-auto pb-2">
                <div className="flex space-x-2 min-w-max">
                    <button
                        onClick={() => setActiveEixoTab('ALL')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeEixoTab === 'ALL' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                    >
                        🌐 Visão Geral
                    </button>
                    {EIXOS.map(eixo => (
                        <button
                            key={eixo}
                            onClick={() => setActiveEixoTab(eixo)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeEixoTab === eixo ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}
                        >
                            {eixo}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sub-Abas de Ação */}
            <div className="flex flex-wrap gap-2 mb-6 bg-gray-200/50 p-2 rounded-lg">
                <TabButton tabName="listar" label="Listar" icon="📋" />
                <TabButton tabName="selecionar" label="Votar" icon="🎯" />
                <TabButton tabName="cadastrar" label="Cadastrar" icon="➕" />
                <TabButton tabName="acompanhamento" label="Relatórios & Plenária" icon="📊" />
                <TabButton tabName="votosIndividuais" label="Auditoria" icon="🗳️" />
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-100 min-h-[400px]">
                {activeEixoTab !== 'ALL' && (activeTab === 'listar' || activeTab === 'selecionar' || activeTab === 'cadastrar') && (
                    <div className="mb-4 p-2 bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700 text-sm rounded">
                        <strong>Painel do {activeEixoTab}:</strong> Você está visualizando e gerenciando itens exclusivos deste eixo.
                    </div>
                )}
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ProposalManagement;