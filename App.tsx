import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Proposal, Vote, ControlRecord, SheetsConfig, AppData, VotingStatus, ProposalSheetsConfig, ProposalResult, ProposalStatus, CurrentProposalRecord, LocalUser, AdminUser, SystemPhase, AdminPermissions } from './types';
import Header from './components/Header';
import AuthSection from './components/AuthSection';
import TimerSection from './components/TimerSection';
import ProposalSection from './components/ProposalSection';
import VotingSection from './components/VotingSection';
import ResultsSection from './components/ResultsSection';
import AdminPanel from './components/AdminPanel';
import AdminLoginModal from './components/modals/AdminLoginModal';
import { ADMIN_PASSWORD, DEFAULT_CONFIG } from './constants';
import WelcomeScreen from './components/WelcomeScreen';

const isValidAppData = (item: any): item is AppData => {
    if (!item || typeof item !== 'object' || !item.tipo || typeof item.tipo !== 'string') {
        return false;
    }

    switch (item.tipo) {
        case 'vote':
            return typeof item.id === 'string' &&
                   typeof item.voto === 'string' && ['SIM', 'NÃO', 'ABSTENÇÃO'].includes(item.voto) &&
                   typeof item.timestamp === 'string' &&
                   typeof item.user_code === 'string' &&
                   typeof item.proposta_id === 'string';
        case 'proposta_cadastrada':
            return typeof item.id === 'string' &&
                   typeof item.titulo === 'string' &&
                   typeof item.categoria === 'string' &&
                   typeof item.abrangencia === 'string' &&
                   typeof item.regional_saude === 'string' &&
                   typeof item.municipio === 'string' &&
                   typeof item.descricao === 'string' &&
                   typeof item.data_criacao === 'string';
        case 'control':
            return typeof item.id === 'string' && typeof item.status === 'string';
        case 'proposal':
            return typeof item.id === 'string' &&
                   typeof item.proposta_id === 'string' &&
                   typeof item.titulo === 'string' &&
                   typeof item.eixo === 'string' &&
                   typeof item.proposta === 'string';
        case 'sheets_config':
            return typeof item.id === 'string' &&
                   typeof item.google_sheet_url === 'string' &&
                   typeof item.sheet_name === 'string' &&
                   typeof item.username_column === 'string' &&
                   typeof item.password_column === 'string' &&
                   (item.segmento_column === undefined || typeof item.segmento_column === 'string') &&
                   (item.representante_column === undefined || typeof item.representante_column === 'string') &&
                   (item.eixo_column === undefined || typeof item.eixo_column === 'string');
        case 'proposals_sheets_config':
            return typeof item.id === 'string' &&
                   typeof item.proposals_sheet_url === 'string' &&
                   typeof item.proposals_sheet_name === 'string' &&
                   typeof item.titulo_column === 'string' &&
                   typeof item.eixo_column === 'string';
        case 'local_user':
            return typeof item.id === 'string' &&
                   typeof item.username === 'string' &&
                   typeof item.password === 'string';
        case 'admin_user':
            return typeof item.id === 'string' &&
                   typeof item.username === 'string' &&
                   typeof item.password === 'string' &&
                   (item.permissions === undefined || typeof item.permissions === 'object');
        default:
            return false;
    }
};


// Mock dataSdk com melhorias de sincronização (Read-Modify-Write)
const dataSdk = {
  _onDataChanged: (data: AppData[]) => {},
  
  init: async function(handler: { onDataChanged: (data: AppData[]) => void }) {
    this._onDataChanged = handler.onDataChanged;
    this._loadAndNotify(); // Carrega inicial
    
    // Escuta mudanças em outras abas/janelas
    window.addEventListener('storage', (e) => {
      if (e.key === 'voting_app_data') {
        this._loadAndNotify();
      }
    });
    return { isOk: true };
  },

  // Lê do localStorage, valida e notifica a aplicação
  _loadAndNotify: function() {
    try {
        const data = localStorage.getItem('voting_app_data');
        if (!data) {
            this._onDataChanged([]);
            return;
        }
        
        const parsedData = JSON.parse(data);
        if (!Array.isArray(parsedData)) throw new Error("Dados inválidos");
        
        const cleanData = parsedData.filter(isValidAppData);
        this._onDataChanged(cleanData);
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
  },

  // Helper para ler dados frescos antes de escrever
  _readData: function(): AppData[] {
      try {
          const data = localStorage.getItem('voting_app_data');
          if (!data) return [];
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed.filter(isValidAppData) : [];
      } catch {
          return [];
      }
  },

  _saveData: function(data: AppData[]) {
    try {
      localStorage.setItem('voting_app_data', JSON.stringify(data));
      this._onDataChanged(data); 
      window.dispatchEvent(new Event('local-storage-update'));
    } catch (e) {
      console.error("Falha ao salvar dados", e);
    }
  },

  create: async function(item: AppData) {
    const currentData = this._readData();
    currentData.push(item);
    this._saveData(currentData);
    return { isOk: true };
  },

  update: async function(item: AppData) {
    const currentData = this._readData();
    const index = currentData.findIndex(d => d.id === item.id);
    if (index !== -1) {
      currentData[index] = item;
      this._saveData(currentData);
      return { isOk: true };
    }
    return { isOk: false, error: 'Item not found' };
  },

  delete: async function(item: AppData) {
    const currentData = this._readData();
    const newData = currentData.filter(d => d.id !== item.id);
    this._saveData(newData);
    return { isOk: true };
  },

  deleteMany: async function(idsToDelete: string[]) {
    const currentData = this._readData();
    const newData = currentData.filter(d => !idsToDelete.includes(d.id));
    this._saveData(newData);
    return { isOk: true };
  },

  deleteAll: async function(type?: string) {
    const currentData = this._readData();
    let newData;
    if (type) {
        newData = currentData.filter(d => d.tipo !== type);
    } else {
        newData = [];
    }
    this._saveData(newData);
    return { isOk: true };
  }
};

const safeGetTime = (timestamp: string | undefined | null): number => {
    if (!timestamp) return 0;
    const time = new Date(timestamp).getTime();
    return isNaN(time) ? 0 : time;
};


const App: React.FC = () => {
    const [showWelcomeScreen, setShowWelcomeScreen] = useState(() => !sessionStorage.getItem('welcomeScreenShown'));
    const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
    const [authenticatedUserCode, setAuthenticatedUserCode] = useState<string | null>(null);
    const [authenticatedUserEixo, setAuthenticatedUserEixo] = useState<string | null>(null);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [currentAdminPermissions, setCurrentAdminPermissions] = useState<AdminPermissions | null>(null); 
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const [votes, setVotes] = useState<Vote[]>([]);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
    const [sheetsConfig, setSheetsConfig] = useState<SheetsConfig | null>(null);
    const [proposalSheetsConfig, setProposalSheetsConfig] = useState<ProposalSheetsConfig | null>(null);
    const [localUsers, setLocalUsers] = useState<LocalUser[]>([]);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]); 
    const [votingStatus, setVotingStatus] = useState<VotingStatus>(VotingStatus.NOT_STARTED);
    const [votingStartTime, setVotingStartTime] = useState<Date | null>(null);
    const [votingEndTime, setVotingEndTime] = useState<Date | null>(null);
    
    const [systemPhase, setSystemPhase] = useState<SystemPhase>(SystemPhase.EIXOS);

    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [currentProposalText, setCurrentProposalText] = useState(DEFAULT_CONFIG.proposta_texto);
    const [currentEixoText, setCurrentEixoText] = useState(DEFAULT_CONFIG.eixo_texto);
    const [currentProposalTitle, setCurrentProposalTitle] = useState("Título da proposta");

    const hasVoted = authenticatedUserCode && currentProposal 
        ? votes.some(v => v.user_code === authenticatedUserCode && v.proposta_id === currentProposal.id) 
        : false;

    const canVoteInCurrentEixo = useCallback(() => {
        // Se for plenária final, libera geral
        if (systemPhase === SystemPhase.PLENARIA) return true;
        
        // Se não houver proposta ou usuário não tiver eixo, bloqueia
        if (!currentProposal || !authenticatedUserEixo) return false; 
        
        const propEixo = currentProposal.categoria.trim().toLowerCase();
        const userEixo = authenticatedUserEixo.trim().toLowerCase();
        
        return propEixo === userEixo;
    }, [systemPhase, currentProposal, authenticatedUserEixo]);

    const onDataChanged = useCallback((data: AppData[]) => {
        try {
            const allVotes = data.filter(item => item.tipo === 'vote') as Vote[];
            setVotes(allVotes);
            
            const allProposals = data.filter(item => item.tipo === 'proposta_cadastrada') as Proposal[];
            setProposals(allProposals);

            const allLocalUsers = data.filter(item => item.tipo === 'local_user') as LocalUser[];
            setLocalUsers(allLocalUsers);

            const allAdminUsers = data.filter(item => item.tipo === 'admin_user') as AdminUser[];
            setAdminUsers(allAdminUsers);

            const controlRecords = data.filter(item => item.tipo === 'control') as ControlRecord[];
            if (controlRecords.length > 0) {
                const latestControl = controlRecords.sort((a, b) => safeGetTime(b?.timestamp) - safeGetTime(a?.timestamp))[0];
                
                if (latestControl.system_phase) {
                    setSystemPhase(latestControl.system_phase);
                }

                if (latestControl.status === 'reset' || latestControl.status === 'new_voting_created') {
                    setVotingStatus(VotingStatus.NOT_STARTED);
                    setVotingStartTime(null);
                    setVotingEndTime(null);
                } else {
                    setVotingStatus((latestControl.status as VotingStatus) || VotingStatus.NOT_STARTED);
                    setVotingStartTime(latestControl.start_time ? new Date(latestControl.start_time) : null);
                    setVotingEndTime(latestControl.end_time ? new Date(latestControl.end_time) : null);
                }
            } else {
                setVotingStatus(VotingStatus.NOT_STARTED);
                setSystemPhase(SystemPhase.EIXOS); 
            }

            const proposalRecords = data.filter(item => item.tipo === 'proposal') as CurrentProposalRecord[];
            if (proposalRecords.length > 0) {
                const latestProposal = proposalRecords.sort((a, b) => safeGetTime(b?.timestamp) - safeGetTime(a?.timestamp))[0];
                setCurrentProposalText(String(latestProposal.proposta || ''));
                setCurrentEixoText(String(latestProposal.eixo || ''));
                setCurrentProposalTitle(String(latestProposal.titulo || ''));

                const proposal = allProposals.find(p => p.id === latestProposal.proposta_id);
                setCurrentProposal(proposal || null);
            } else {
                 setCurrentProposalText(DEFAULT_CONFIG.proposta_texto);
                 setCurrentEixoText(DEFAULT_CONFIG.eixo_texto);
                 setCurrentProposalTitle("Título da proposta");
                 setCurrentProposal(null);
            }

            const sheetsConfigRecords = data.filter(item => item.tipo === 'sheets_config') as SheetsConfig[];
            if (sheetsConfigRecords.length > 0) {
                const latestConfig = sheetsConfigRecords.sort((a, b) => safeGetTime(b?.timestamp) - safeGetTime(a?.timestamp))[0];
                setSheetsConfig(latestConfig);
            }
            
            const proposalSheetsConfigRecords = data.filter(item => item.tipo === 'proposals_sheets_config') as ProposalSheetsConfig[];
            if (proposalSheetsConfigRecords.length > 0) {
                const latestConfig = proposalSheetsConfigRecords.sort((a, b) => safeGetTime(b?.timestamp) - safeGetTime(a?.timestamp))[0];
                setProposalSheetsConfig(latestConfig);
            }
        } catch (error) {
            console.error("A critical error occurred while processing data.", error);
        }
    }, []);

    useEffect(() => {
        dataSdk.init({ onDataChanged });

        const storedUserCode = localStorage.getItem('authenticated_user_code');
        const storedUserEixo = localStorage.getItem('authenticated_user_eixo');
        if (storedUserCode) {
            setIsUserAuthenticated(true);
            setAuthenticatedUserCode(storedUserCode);
            if (storedUserEixo) setAuthenticatedUserEixo(storedUserEixo);
        }

        const wasAdminAuth = localStorage.getItem('admin_authenticated') === 'true';
        const authTimestamp = localStorage.getItem('admin_auth_timestamp');
        
        // Restore Admin Permissions if session is valid
        if(wasAdminAuth && authTimestamp) {
            const oneHour = 60 * 60 * 1000;
            if (Date.now() - parseInt(authTimestamp, 10) < oneHour) {
                setIsAdminAuthenticated(true);
                const savedPermissions = localStorage.getItem('admin_permissions');
                if (savedPermissions) {
                    setCurrentAdminPermissions(JSON.parse(savedPermissions));
                }
            } else {
                localStorage.removeItem('admin_authenticated');
                localStorage.removeItem('admin_auth_timestamp');
                localStorage.removeItem('admin_permissions');
            }
        }
        setIsAuthLoading(false);
    }, [onDataChanged]);

    const handleEnterApp = () => {
        sessionStorage.setItem('welcomeScreenShown', 'true');
        setShowWelcomeScreen(false);
    };

    const handleAuthenticate = (code: string, userEixo: string | null) => {
        setIsUserAuthenticated(true);
        setAuthenticatedUserCode(code);
        setAuthenticatedUserEixo(userEixo);
        localStorage.setItem('authenticated_user_code', code);
        if (userEixo) {
            localStorage.setItem('authenticated_user_eixo', userEixo);
        }
    };

    const handleLogout = () => {
        setIsUserAuthenticated(false);
        setAuthenticatedUserCode(null);
        setAuthenticatedUserEixo(null);
        localStorage.removeItem('authenticated_user_code');
        localStorage.removeItem('authenticated_user_eixo');
        localStorage.removeItem('voting_user_hash');
    };

    const handleAdminAuthenticate = (username: string, password: string) => {
        // 1. Master Password (Super Admin - All permissions)
        if (password === ADMIN_PASSWORD) {
            const superPermissions: AdminPermissions = {
                can_manage_voting: true,
                can_manage_proposals: true,
                can_manage_users: true,
                can_manage_config: true
            };
            setIsAdminAuthenticated(true);
            setCurrentAdminPermissions(superPermissions);
            localStorage.setItem('admin_authenticated', 'true');
            localStorage.setItem('admin_auth_timestamp', Date.now().toString());
            localStorage.setItem('admin_permissions', JSON.stringify(superPermissions));
            setIsAdminModalOpen(false);
            return true;
        }
        // 2. Registered Admin User
        if (username) {
            const adminUser = adminUsers.find(u => u.username === username && u.password === password);
            if (adminUser) {
                setIsAdminAuthenticated(true);
                // Default permissions to all true for old records, or use stored permissions
                const permissions = adminUser.permissions || {
                    can_manage_voting: true,
                    can_manage_proposals: true,
                    can_manage_users: true,
                    can_manage_config: true
                };
                setCurrentAdminPermissions(permissions);
                localStorage.setItem('admin_authenticated', 'true');
                localStorage.setItem('admin_auth_timestamp', Date.now().toString());
                localStorage.setItem('admin_permissions', JSON.stringify(permissions));
                setIsAdminModalOpen(false);
                return true;
            }
        }
        return false;
    };
    
    const handleCloseAdminPanel = () => {
        setIsAdminAuthenticated(false);
        setCurrentAdminPermissions(null);
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_auth_timestamp');
        localStorage.removeItem('admin_permissions');
    }

    const handleVote = async (voteOption: 'SIM' | 'NÃO' | 'ABSTENÇÃO') => {
        if (!isUserAuthenticated || !authenticatedUserCode || hasVoted || votingStatus !== VotingStatus.STARTED || !currentProposal) return;

        // CRITICAL CHECK: Ensure user belongs to the correct Axis before creating vote
        if (!canVoteInCurrentEixo()) {
            console.warn("Tentativa de voto bloqueada: Eixo do usuário não corresponde.");
            return;
        }

        const userHash = localStorage.getItem('voting_user_hash') || `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('voting_user_hash', userHash);

        const voteData: Vote = {
            id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tipo: 'vote',
            voto: voteOption,
            timestamp: new Date().toISOString(),
            ip_hash: userHash,
            user_code: authenticatedUserCode,
            proposta_id: currentProposal.id 
        };
        await dataSdk.create(voteData);
    };

    const saveVotingResults = async () => {
        if (!currentProposal) return;
        
        const currentProposalVotes = votes.filter(v => v.proposta_id === currentProposal.id);

        const simVotes = currentProposalVotes.filter(v => v.voto === 'SIM').length;
        const naoVotes = currentProposalVotes.filter(v => v.voto === 'NÃO').length;
        const abstencaoVotes = currentProposalVotes.filter(v => v.voto === 'ABSTENÇÃO').length;

        let resultadoFinal: ProposalResult = ProposalResult.EMPATE;
        if (simVotes > naoVotes) {
            resultadoFinal = ProposalResult.APROVADA;
        } else if (naoVotes > simVotes) {
            resultadoFinal = ProposalResult.REJEITADA;
        }
        
        const durationInSeconds = votingStartTime ? Math.round((new Date().getTime() - new Date(votingStartTime).getTime()) / 1000) : 0;

        const updatedProposal: Proposal = {
            ...currentProposal,
            votos_sim: simVotes,
            votos_nao: naoVotes,
            votos_abstencao: abstencaoVotes,
            total_votos: currentProposalVotes.length,
            data_votacao: new Date().toISOString(),
            resultado_final: resultadoFinal,
            status: ProposalStatus.VOTADA,
            voting_duration_seconds: durationInSeconds,
        };
        await dataSdk.update(updatedProposal);
    };
    
    const handleResetProposalVote = async (proposalId: string) => {
        try {
            const proposal = proposals.find(p => p.id === proposalId);
            if (!proposal) return;

            const proposalVotes = votes.filter(v => v.proposta_id === proposalId);
            const idsToDelete = proposalVotes.map(v => v.id);
            
            if (idsToDelete.length > 0) {
                await dataSdk.deleteMany(idsToDelete);
            }

            const resetProposal: Proposal = {
                ...proposal,
                status: ProposalStatus.PENDENTE,
                votos_sim: 0,
                votos_nao: 0,
                votos_abstencao: 0,
                total_votos: 0,
                resultado_final: undefined,
                data_votacao: undefined,
                voting_duration_seconds: 0
            };
            await dataSdk.update(resetProposal);

        } catch (e) {
            console.error("Erro ao zerar votação da proposta", e);
        }
    };

    const handleStartVoting = async () => {
        if (currentProposal) {
            const updatedProposal: Proposal = {
                ...currentProposal,
                status: ProposalStatus.EM_VOTACAO
            };
            await dataSdk.update(updatedProposal);
        }

        await dataSdk.create({
            id: `control_${Date.now()}`,
            tipo: 'control',
            status: VotingStatus.STARTED,
            start_time: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            system_phase: systemPhase 
        } as ControlRecord);
    };

    const handleEndVoting = async () => {
        await saveVotingResults();
        await dataSdk.create({
            id: `control_${Date.now()}`,
            tipo: 'control',
            status: VotingStatus.CLOSED,
            start_time: votingStartTime?.toISOString(),
            end_time: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            system_phase: systemPhase
        } as ControlRecord);
    };

    const handleNewVoting = async () => {
        await dataSdk.create({
            id: `control_reset_${Date.now()}`,
            tipo: 'control',
            status: 'reset',
            timestamp: new Date().toISOString(),
            system_phase: systemPhase
        } as ControlRecord);
        
        await dataSdk.create({
            id: `control_new_${Date.now()}`,
            tipo: 'control',
            status: 'new_voting_created',
            timestamp: new Date().toISOString(),
            system_phase: systemPhase
        } as ControlRecord);
    };
    
    const handleChangePhase = async (newPhase: SystemPhase) => {
        setSystemPhase(newPhase);
        await dataSdk.create({
            id: `control_phase_${Date.now()}`,
            tipo: 'control',
            status: VotingStatus.NOT_STARTED, 
            timestamp: new Date().toISOString(),
            system_phase: newPhase
        } as ControlRecord);
    };
    
    if (showWelcomeScreen) {
        return <WelcomeScreen onEnter={handleEnterApp} />;
    }
    
    if (isAuthLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl font-semibold text-gray-700">Carregando...</div>
        </div>
      )
    }

    return (
        <div className="p-2 sm:p-4 lg:p-6 min-h-screen">
            <div className="max-w-7xl mx-auto w-full">
                <Header 
                  title={DEFAULT_CONFIG.titulo_votacao} 
                  question={systemPhase === SystemPhase.PLENARIA ? "PLENÁRIA FINAL - Votação Geral" : `Votação por Eixos: ${authenticatedUserEixo || 'Indefinido'}`}
                  status={votingStatus}
                  totalVotes={(votingStatus === VotingStatus.STARTED || votingStatus === VotingStatus.CLOSED) && currentProposal ? votes.filter(v => v.proposta_id === currentProposal.id).length : 0}
                />

                {!isUserAuthenticated ? (
                    <AuthSection 
                      onAuthenticate={handleAuthenticate}
                      sheetsConfig={sheetsConfig}
                      localUsers={localUsers}
                    />
                ) : (
                    <>
                        <TimerSection 
                          status={votingStatus} 
                          startTime={votingStartTime}
                          endTime={votingEndTime}
                        />
                        <ProposalSection
                           eixo={currentEixoText}
                           title={currentProposalTitle}
                           text={currentProposalText}
                        />

                        {votingStatus !== VotingStatus.CLOSED && (
                          <VotingSection
                              status={votingStatus}
                              hasVoted={hasVoted}
                              onVote={handleVote}
                              userCode={authenticatedUserCode}
                              userEixo={authenticatedUserEixo}
                              proposalEixo={currentProposal?.categoria}
                              systemPhase={systemPhase}
                              onLogout={handleLogout}
                          />
                        )}
                        
                        {votingStatus === VotingStatus.CLOSED && currentProposal && (
                            <ResultsSection votes={votes.filter(v => v.proposta_id === currentProposal.id)} />
                        )}
                    </>
                )}

                <div className="text-center mt-4 sm:mt-6 lg:mt-8 px-2 space-y-3">
                    <div className="flex justify-center">
                        <button onClick={() => setIsAdminModalOpen(true)} className="bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition-colors text-sm sm:text-base shadow-lg">
                            🔧 Painel Administrativo
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Acesse o painel administrativo para gerenciar a votação</p>
                </div>
                
                {isAdminAuthenticated && (
                  <AdminPanel
                    votes={votes}
                    proposals={proposals}
                    localUsers={localUsers}
                    adminUsers={adminUsers}
                    votingStatus={votingStatus}
                    sheetsConfig={sheetsConfig}
                    proposalSheetsConfig={proposalSheetsConfig}
                    currentProposalId={currentProposal?.id}
                    systemPhase={systemPhase}
                    currentAdminPermissions={currentAdminPermissions} // Pass permissions
                    onChangePhase={handleChangePhase} 
                    onStartVoting={handleStartVoting}
                    onEndVoting={handleEndVoting}
                    onNewVoting={handleNewVoting}
                    onSaveSheetsConfig={(config) => dataSdk.create(config)}
                    onSaveProposalSheetsConfig={(config) => dataSdk.create(config)}
                    onClose={handleCloseAdminPanel}
                    onCreateProposal={(proposal) => dataSdk.create(proposal)}
                    onUpdateProposal={(proposal) => dataSdk.update(proposal)}
                    onDeleteProposal={(proposal) => dataSdk.delete(proposal)}
                    onSelectProposal={(proposalData) => dataSdk.create(proposalData)}
                    onResetProposalVote={handleResetProposalVote}
                    onCreateUser={(user) => dataSdk.create(user)}
                    onDeleteUser={(user) => dataSdk.delete(user)}
                    onCreateAdminUser={(admin) => dataSdk.create(admin)}
                    onDeleteAdminUser={(admin) => dataSdk.delete(admin)}
                  />
                )}

                {isAdminModalOpen && !isAdminAuthenticated && (
                    <AdminLoginModal
                        onClose={() => setIsAdminModalOpen(false)}
                        onAuthenticate={handleAdminAuthenticate}
                    />
                )}

                <footer className="text-center mt-4 sm:mt-6 lg:mt-8 px-2">
                    <p className="text-xs sm:text-sm text-gray-600">{DEFAULT_CONFIG.footer_text}</p>
                </footer>
            </div>
        </div>
    );
};

export default App;