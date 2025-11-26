
import React, { useState, useEffect } from 'react';
import { Proposal, Vote, VotingStatus, SheetsConfig, CurrentProposalRecord, ProposalSheetsConfig, LocalUser, AdminUser, SystemPhase, AdminPermissions, ClassificationRule } from '../types';
import ProposalManagement from './admin/ProposalManagement';
import VotingControl from './admin/VotingControl';
import SheetsAuthConfig from './admin/SheetsAuthConfig';
import UserManagement from './admin/UserManagement';
import AdminUserManagement from './admin/AdminUserManagement';
import NotificationCenter from './admin/NotificationCenter';

interface AdminPanelProps {
    votes: Vote[];
    proposals: Proposal[];
    localUsers: LocalUser[];
    adminUsers: AdminUser[];
    votingStatus: VotingStatus;
    sheetsConfig: SheetsConfig | null;
    proposalSheetsConfig: ProposalSheetsConfig | null;
    currentProposalId?: string;
    systemPhase: SystemPhase;
    currentAdminPermissions: AdminPermissions | null;
    classificationRules: ClassificationRule[];
    onChangePhase: (phase: SystemPhase) => void;
    onSaveClassificationRule: (rule: ClassificationRule) => void;
    onDeleteClassificationRule: (rule: ClassificationRule) => void;
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
    onTogglePresentationMode: () => void;
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

    // Default to true (all permissions) if not provided
    const permissions = props.currentAdminPermissions || {
        can_manage_voting: true,
        can_manage_proposals: true,
        can_manage_users: true,
        can_manage_config: true
    };

    const handleExportFullData = () => {
        if (typeof window.XLSX === 'undefined') {
            alert("Erro: A biblioteca SheetJS (XLSX) não foi carregada. Verifique a conexão com a internet.");
            return;
        }
        
        try {
            const wb = window.XLSX.utils.book_new();

            // Nova aba: Visão Geral e Status
            const overviewData = [
                { Chave: "Fase Atual do Sistema", Valor: props.systemPhase },
                { Chave: "Status da Votação", Valor: props.votingStatus },
                { Chave: "Total de Propostas", Valor: props.proposals.length },
                { Chave: "Total de Votos", Valor: props.votes.length },
                { Chave: "Total de Eleitores Locais", Valor: props.localUsers.length },
                { Chave: "Total de Admins", Valor: props.adminUsers.length },
                { Chave: "Data do Backup", Valor: new Date().toLocaleString() }
            ];
            const wsOverview = window.XLSX.utils.json_to_sheet(overviewData);
            window.XLSX.utils.book_append_sheet(wb, wsOverview, "Visão Geral");

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
                Classificacao: p.classification_label || '-',
                Qualificada_Plenaria: p.is_plenary ? 'SIM' : 'NÃO',
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
                Perm_Votar: a.permissions?.can_manage_voting ? 'SIM' : 'NÃO',
                Perm_Propostas: a.permissions?.can_manage_proposals ? 'SIM' : 'NÃO',
                Perm_Usuarios: a.permissions?.can_manage_users ? 'SIM' : 'NÃO',
                Perm_Config: a.permissions?.can_manage_config ? 'SIM' : 'NÃO',
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

    const getFilteredVotesForDisplay = () => {
        if (props.votingStatus !== VotingStatus.STARTED && props.votingStatus !== VotingStatus.CLOSED) {
            return [];
        }
        if (!props.currentProposalId) {
            return [];
        }
        return props.votes.filter(v => v.proposta_id === props.currentProposalId);
    };

    return (
        <section className="admin-panel-section bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl p-3 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 mx-1 sm:mx-2">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">🔧 Painel Administrativo</h2>
                    
                    {/* Phase Control - Only if can_manage_config */}
                    {permissions.can_manage_config && (
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                            <button 
                                onClick={() => props.onChangePhase(SystemPhase.EIXOS)}
                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${props.systemPhase === SystemPhase.EIXOS ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                Fase de Eixos
                            </button>
                            <button 
                                onClick={() => props.onChangePhase(SystemPhase.PLENARIA)}
                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${props.systemPhase === SystemPhase.PLENARIA ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                Plenária Final
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={props.onTogglePresentationMode} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
                        title="Exibir proposta atual em tela cheia para projeção"
                    >
                        📺 Modo Apresentação
                    </button>

                    <button 
                        onClick={handleExportFullData} 
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
                    >
                        📂 Backup Excel
                    </button>
                    <button onClick={props.onClose} className="text-red-600 hover:text-red-800 text-sm underline">Fechar Painel</button>
                </div>
            </div>

            {permissions.can_manage_config && (
                <div className={`mb-6 p-4 rounded-lg border border-l-4 ${props.systemPhase === SystemPhase.PLENARIA ? 'bg-purple-50 border-purple-500 text-purple-800' : 'bg-blue-50 border-blue-500 text-blue-800'}`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{props.systemPhase === SystemPhase.PLENARIA ? '🏛️' : '🗳️'}</span>
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wide">Modo de Votação: {props.systemPhase === SystemPhase.PLENARIA ? 'Plenária Final' : 'Votação por Eixos'}</h3>
                            <p className="text-xs mt-1 opacity-90">
                                {props.systemPhase === SystemPhase.PLENARIA 
                                    ? "Todos os usuários podem votar nas propostas qualificadas."
                                    : "Usuários só podem votar em propostas do seu próprio eixo cadastrado."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {permissions.can_manage_voting ? (
                <VotingControl
                    votingStatus={props.votingStatus}
                    votes={getFilteredVotesForDisplay()}
                    onStartVoting={props.onStartVoting}
                    onEndVoting={props.onEndVoting}
                    onNewVoting={props.onNewVoting}
                    showAdminMessage={showAdminMessage}
                />
            ) : (
                <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg text-center text-gray-500">
                    <span className="block text-xl mb-1">🚫</span>
                    Sem permissão para controlar votações.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Column 1: Config & Admin Users */}
                <div className="space-y-6">
                     {permissions.can_manage_users && (
                        <NotificationCenter 
                            localUsers={props.localUsers}
                            showAdminMessage={showAdminMessage}
                        />
                    )}

                    {permissions.can_manage_config ? (
                        <SheetsAuthConfig
                            sheetsConfig={props.sheetsConfig}
                            onSaveSheetsConfig={props.onSaveSheetsConfig}
                            showAdminMessage={showAdminMessage}
                        />
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 opacity-50 pointer-events-none">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">🔗 Configurar Planilha</h3>
                            <p className="text-sm text-gray-500">Acesso restrito.</p>
                        </div>
                    )}

                    {permissions.can_manage_users ? (
                        <AdminUserManagement 
                            adminUsers={props.adminUsers}
                            onCreateAdminUser={props.onCreateAdminUser}
                            onDeleteAdminUser={props.onDeleteAdminUser}
                            showAdminMessage={showAdminMessage}
                        />
                    ) : null}
                </div>

                {/* Column 2: Voter Users */}
                <div>
                    {permissions.can_manage_users ? (
                        <UserManagement 
                            localUsers={props.localUsers}
                            onCreateUser={props.onCreateUser}
                            onDeleteUser={props.onDeleteUser}
                            showAdminMessage={showAdminMessage}
                        />
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 opacity-50">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">👤 Gerenciar Usuários</h3>
                            <p className="text-sm text-gray-500">Você não tem permissão para gerenciar usuários.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {permissions.can_manage_proposals ? (
                <ProposalManagement
                    votes={props.votes}
                    proposals={props.proposals}
                    proposalSheetsConfig={props.proposalSheetsConfig}
                    currentProposalId={props.currentProposalId}
                    systemPhase={props.systemPhase}
                    classificationRules={props.classificationRules}
                    onSaveClassificationRule={props.onSaveClassificationRule}
                    onDeleteClassificationRule={props.onDeleteClassificationRule}
                    onSaveProposalSheetsConfig={props.onSaveProposalSheetsConfig}
                    onCreateProposal={props.onCreateProposal}
                    onUpdateProposal={props.onUpdateProposal}
                    onDeleteProposal={props.onDeleteProposal}
                    onSelectProposal={props.onSelectProposal}
                    showAdminMessage={showAdminMessage}
                    onResetProposalVote={props.onResetProposalVote}
                />
            ) : (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">📝 Gerenciar Propostas</h3>
                    <p className="text-gray-500">Você não tem permissão para acessar o módulo de propostas.</p>
                </div>
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
