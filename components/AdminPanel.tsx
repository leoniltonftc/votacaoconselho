

import React, { useState, useEffect } from 'react';
import { Proposal, Vote, VotingStatus, SheetsConfig, CurrentProposalRecord, ProposalSheetsConfig, LocalUser, AdminUser, SystemPhase, AdminPermissions, ClassificationRule } from '../types';
import ProposalManagement from './admin/ProposalManagement';
import VotingControl from './admin/VotingControl';
import SheetsAuthConfig from './admin/SheetsAuthConfig';
import UserManagement from './admin/UserManagement';
import AdminUserManagement from './admin/AdminUserManagement';

interface AdminPanelProps {
    votes: Vote[];
    proposals: Proposal[];
    localUsers: LocalUser[];
    adminUsers: AdminUser[];
    classificationRules: ClassificationRule[];
    votingStatus: VotingStatus;
    sheetsConfig: SheetsConfig | null;
    proposalSheetsConfig: ProposalSheetsConfig | null;
    currentProposalId?: string;
    systemPhase: SystemPhase;
    currentAdminPermissions: AdminPermissions | null;
    onChangePhase: (phase: SystemPhase) => void;
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
    onResetProposalVote: (proposalId: string) => void;
    onCreateUser: (user: LocalUser) => void;
    onDeleteUser: (user: LocalUser) => void;
    onCreateAdminUser: (user: AdminUser) => void;
    onDeleteAdminUser: (user: AdminUser) => void;
    onSaveClassificationRule: (rule: ClassificationRule) => void;
    onDeleteClassificationRule: (rule: ClassificationRule) => void;
}

declare global {
    interface Window {
        XLSX: any;
    }
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const showAdminMessage = (type: 'success' | 'error', text: string) => {
        setAdminMessage({ type, text });
        setTimeout(() => setAdminMessage(null), 5000);
    };

    const handleExportFullData = () => {
        if (typeof window.XLSX === 'undefined') {
            alert("Erro: A biblioteca SheetJS (XLSX) não foi carregada. Verifique a conexão com a internet.");
            return;
        }
        
        try {
            const wb = window.XLSX.utils.book_new();

            // 1. Aba de Propostas
            const proposalsData = props.proposals.map(p => ({
                ID: p.id,
                Titulo: p.titulo,
                Eixo: p.categoria,
                Abrangencia: p.abrangencia,
                Regional: p.regional_saude,
                Municipio: p.municipio,
                Descricao: p.descricao,
                Status: p.status || 'PENDENTE',
                Resultado: p.resultado_final || '-',
                Votos_Sim: p.votos_sim || 0,
                Votos_Nao: p.votos_nao || 0,
                Votos_Abstencao: p.votos_abstencao || 0,
                Total_Votos: p.total_votos || 0,
                Duracao_Segundos: p.voting_duration_seconds || 0,
                Data_Criacao: p.data_criacao ? new Date(p.data_criacao).toLocaleString() : '',
                Data_Votacao: p.data_votacao ? new Date(p.data_votacao).toLocaleString() : ''
            }));
            const wsProposals = window.XLSX.utils.json_to_sheet(proposalsData);
            window.XLSX.utils.book_append_sheet(wb, wsProposals, "Propostas");

            // 2. Aba de Votos Detalhados
            const votesData = props.votes.map(v => ({
                ID: v.id,
                Proposta_ID: v.proposta_id,
                Usuario_Hash: v.user_code, 
                Voto: v.voto,
                Data_Hora: v.timestamp ? new Date(v.timestamp).toLocaleString() : ''
            }));
            const wsVotes = window.XLSX.utils.json_to_sheet(votesData);
            window.XLSX.utils.book_append_sheet(wb, wsVotes, "Votos Individuais");

            // 3. Aba de Eleitores Cadastrados
            const usersData = props.localUsers.map(u => ({
                Usuario: u.username,
                Senha: u.password,
                Segmento: u.segmento || '',
                Representante: u.representante || '',
                Eixo: u.eixo || '',
                Data_Cadastro: u.timestamp ? new Date(u.timestamp).toLocaleString() : ''
            }));
            const wsUsers = window.XLSX.utils.json_to_sheet(usersData);
            window.XLSX.utils.book_append_sheet(wb, wsUsers, "Eleitores");

            // 4. Aba de Administradores
            const adminsData = props.adminUsers.map(a => ({
                Usuario: a.username,
                Senha: a.password,
                Data_Cadastro: a.timestamp ? new Date(a.timestamp).toLocaleString() : ''
            }));
            const wsAdmins = window.XLSX.utils.json_to_sheet(adminsData);
            window.XLSX.utils.book_append_sheet(wb, wsAdmins, "Administradores");

            // 5. Aba de Configurações
            const configData = [];
            if (props.sheetsConfig) {
                configData.push({
                    Tipo: 'Autenticação Planilha',
                    URL: props.sheetsConfig.google_sheet_url,
                    Sheet_Name: props.sheetsConfig.sheet_name,
                    Detalhes: `UserCol: ${props.sheetsConfig.username_column}, PassCol: ${props.sheetsConfig.password_column}`
                });
            }
            if (props.proposalSheetsConfig) {
                configData.push({
                    Tipo: 'Importação Propostas',
                    URL: props.proposalSheetsConfig.proposals_sheet_url,
                    Sheet_Name: props.proposalSheetsConfig.proposals_sheet_name,
                    Detalhes: `TituloCol: ${props.proposalSheetsConfig.titulo_column}, EixoCol: ${props.proposalSheetsConfig.eixo_column}`
                });
            }
            const wsConfig = window.XLSX.utils.json_to_sheet(configData);
            window.XLSX.utils.book_append_sheet(wb, wsConfig, "Configurações");

            // Gerar arquivo
            window.XLSX.writeFile(wb, `Backup_Sistema_Votacao_${new Date().toISOString().slice(0,10)}.xlsx`);
            showAdminMessage('success', 'Backup completo (Excel) gerado com sucesso!');

        } catch (e) {
            console.error(e);
            showAdminMessage('error', 'Erro ao gerar arquivo Excel.');
        }
    };

    // Lógica CRÍTICA para corrigir o display:
    // Só retorna votos se o status for explicitamente STARTED ou CLOSED.
    // Se for NOT_STARTED (após clicar em Nova Votação), retorna [] vazio.
    const getFilteredVotesForDisplay = () => {
        if (props.votingStatus !== VotingStatus.STARTED && props.votingStatus !== VotingStatus.CLOSED) {
            return [];
        }
        
        if (!props.currentProposalId) {
            return [];
        }
        
        return props.votes.filter(v => v.proposta_id === props.currentProposalId);
    };

    // Helper para verificar permissões
    const hasPermission = (permission: keyof AdminPermissions) => {
        if (!props.currentAdminPermissions) return false;
        return props.currentAdminPermissions[permission];
    };

    return (
        <section className="admin-panel-section bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl p-3 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 mx-1 sm:mx-2">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">🔧 Painel Administrativo</h2>
                    
                    {/* Switch de Fase do Sistema */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => props.onChangePhase(SystemPhase.EIXOS)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${props.systemPhase === SystemPhase.EIXOS ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Eixos Temáticos
                        </button>
                        <button 
                            onClick={() => props.onChangePhase(SystemPhase.PLENARIA)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${props.systemPhase === SystemPhase.PLENARIA ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Plenária Final
                        </button>
                    </div>
                </div>
                
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={handleExportFullData} 
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
                    >
                        📂 Backup Completo (Excel)
                    </button>
                    <button onClick={props.onClose} className="text-red-600 hover:text-red-800 text-sm underline">Fechar Painel</button>
                </div>
            </div>

            {hasPermission('can_manage_voting') && (
                <VotingControl
                    votingStatus={props.votingStatus}
                    votes={getFilteredVotesForDisplay()} 
                    onStartVoting={props.onStartVoting}
                    onEndVoting={props.onEndVoting}
                    onNewVoting={props.onNewVoting}
                    showAdminMessage={showAdminMessage}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Coluna da Esquerda: Configurações do Sistema e Admins */}
                <div className="space-y-6">
                    {hasPermission('can_manage_config') && (
                        <SheetsAuthConfig
                            sheetsConfig={props.sheetsConfig}
                            onSaveSheetsConfig={props.onSaveSheetsConfig}
                            showAdminMessage={showAdminMessage}
                        />
                    )}
                    {hasPermission('can_manage_users') && (
                        <AdminUserManagement 
                            adminUsers={props.adminUsers}
                            onCreateAdminUser={props.onCreateAdminUser}
                            onDeleteAdminUser={props.onDeleteAdminUser}
                            showAdminMessage={showAdminMessage}
                        />
                    )}
                </div>

                {/* Coluna da Direita: Gerenciamento de Eleitores (Lista longa) */}
                <div>
                     {hasPermission('can_manage_users') && (
                        <UserManagement 
                            localUsers={props.localUsers}
                            onCreateUser={props.onCreateUser}
                            onDeleteUser={props.onDeleteUser}
                            showAdminMessage={showAdminMessage}
                        />
                    )}
                </div>
            </div>
            
            {hasPermission('can_manage_proposals') && (
                <ProposalManagement
                    votes={props.votes}
                    proposals={props.proposals}
                    proposalSheetsConfig={props.proposalSheetsConfig}
                    currentProposalId={props.currentProposalId}
                    classificationRules={props.classificationRules}
                    onSaveProposalSheetsConfig={props.onSaveProposalSheetsConfig}
                    onCreateProposal={props.onCreateProposal}
                    onUpdateProposal={props.onUpdateProposal}
                    onDeleteProposal={props.onDeleteProposal}
                    onSelectProposal={props.onSelectProposal}
                    showAdminMessage={showAdminMessage}
                    onResetProposalVote={props.onResetProposalVote}
                    onSaveClassificationRule={props.onSaveClassificationRule}
                    onDeleteClassificationRule={props.onDeleteClassificationRule}
                    systemPhase={props.systemPhase}
                />
            )}

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