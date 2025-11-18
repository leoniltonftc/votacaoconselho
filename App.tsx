

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Proposal, Vote, ControlRecord, SheetsConfig, AppData, VotingStatus, ProposalSheetsConfig, ProposalResult, ProposalStatus, CurrentProposalRecord } from './types';
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
                   typeof item.password_column === 'string';
        case 'proposals_sheets_config':
            return typeof item.id === 'string' &&
                   typeof item.proposals_sheet_url === 'string' &&
                   typeof item.proposals_sheet_name === 'string' &&
                   typeof item.titulo_column === 'string' &&
                   typeof item.eixo_column === 'string';
        default:
            return false;
    }
};


// Mock dataSdk
const dataSdk = {
  _data: [] as AppData[],
  _onDataChanged: (data: AppData[]) => {},
  init: async function(handler: { onDataChanged: (data: AppData[]) => void }) {
    this._onDataChanged = handler.onDataChanged;
    this._loadData();
    // Simulate real-time updates
    window.addEventListener('storage', (e) => {
      if (e.key === 'voting_app_data') {
        this._loadData();
      }
    });
    return { isOk: true };
  },
  _loadData: function() {
    try {
        const data = localStorage.getItem('voting_app_data');
        if (!data) {
            this._data = [];
            this._onDataChanged([]);
            return;
        }
        
        const parsedData = JSON.parse(data);

        if (!Array.isArray(parsedData)) {
            throw new Error("Stored data is not an array.");
        }
        
        const cleanData = parsedData.filter(isValidAppData);
        
        if(cleanData.length < parsedData.length) {
             console.warn(`Data Corruption Detected: ${parsedData.length - cleanData.length} invalid items were found and removed from stored data.`);
        }
        
        this._data = cleanData;
        this._onDataChanged(this._data);

    } catch (e) {
        console.error("CRITICAL: Failed to load or parse data, resetting state to prevent crash.", e);
        localStorage.removeItem('voting_app_data');
        this._data = [];
        this._onDataChanged([]);
    }
  },
  _saveData: function() {
    try {
      localStorage.setItem('voting_app_data', JSON.stringify(this._data));
      // Dispatch a storage event to notify other tabs/windows
      window.dispatchEvent(new StorageEvent('storage', { key: 'voting_app_data' }));
    } catch (e) {
      console.error("Failed to save data to localStorage", e);
    }
  },
  create: async function(item: AppData) {
    this._data.push(item);
    this._saveData();
    this._onDataChanged(this._data);
    return { isOk: true };
  },
  update: async function(item: AppData) {
    const index = this._data.findIndex(d => d.id === item.id);
    if (index !== -1) {
      this._data[index] = item;
      this._saveData();
      this._onDataChanged(this._data);
      return { isOk: true };
    }
    return { isOk: false, error: 'Item not found' };
  },
  delete: async function(item: AppData) {
    this._data = this._data.filter(d => d.id !== item.id);
    this._saveData();
    this._onDataChanged(this._data);
    return { isOk: true };
  },
  deleteAll: async function(type?: string) {
    if (type) {
        this._data = this._data.filter(d => d && d.tipo !== type);
    } else {
        this._data = [];
    }
    this._saveData();
    this._onDataChanged(this._data);
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
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const [votes, setVotes] = useState<Vote[]>([]);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
    const [sheetsConfig, setSheetsConfig] = useState<SheetsConfig | null>(null);
    const [proposalSheetsConfig, setProposalSheetsConfig] = useState<ProposalSheetsConfig | null>(null);
    const [votingStatus, setVotingStatus] = useState<VotingStatus>(VotingStatus.NOT_STARTED);
    const [votingStartTime, setVotingStartTime] = useState<Date | null>(null);
    const [votingEndTime, setVotingEndTime] = useState<Date | null>(null);

    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [currentProposalText, setCurrentProposalText] = useState(DEFAULT_CONFIG.proposta_texto);
    const [currentEixoText, setCurrentEixoText] = useState(DEFAULT_CONFIG.eixo_texto);
    const [currentProposalTitle, setCurrentProposalTitle] = useState("Título da proposta");

    const hasVoted = authenticatedUserCode ? votes.some(v => v.user_code === authenticatedUserCode) : false;

    const onDataChanged = useCallback((data: AppData[]) => {
        try {
            const allVotes = data.filter(item => item.tipo === 'vote') as Vote[];
            setVotes(allVotes);
            
            const allProposals = data.filter(item => item.tipo === 'proposta_cadastrada') as Proposal[];
            setProposals(allProposals);

            const controlRecords = data.filter(item => item.tipo === 'control') as ControlRecord[];
            if (controlRecords.length > 0) {
                const latestControl = controlRecords.sort((a, b) => safeGetTime(b?.timestamp) - safeGetTime(a?.timestamp))[0];
                if (latestControl.status === 'reset' || latestControl.status === 'new_voting_created') {
                    setVotingStatus(VotingStatus.NOT_STARTED);
                    setVotingStartTime(null);
                    setVotingEndTime(null);
                    localStorage.removeItem('voting_user_hash');
                } else {
                    setVotingStatus((latestControl.status as VotingStatus) || VotingStatus.NOT_STARTED);
                    setVotingStartTime(latestControl.start_time ? new Date(latestControl.start_time) : null);
                    setVotingEndTime(latestControl.end_time ? new Date(latestControl.end_time) : null);
                }
            } else {
                setVotingStatus(VotingStatus.NOT_STARTED);
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
            console.error("A critical error occurred while processing data. Resetting data to prevent a crash.", error);
            dataSdk.deleteAll();
        }
    }, []);

    useEffect(() => {
        dataSdk.init({ onDataChanged });

        const storedUserCode = localStorage.getItem('authenticated_user_code');
        if (storedUserCode) {
            setIsUserAuthenticated(true);
            setAuthenticatedUserCode(storedUserCode);
        }

        const wasAdminAuth = localStorage.getItem('admin_authenticated') === 'true';
        const authTimestamp = localStorage.getItem('admin_auth_timestamp');
        if(wasAdminAuth && authTimestamp) {
            const oneHour = 60 * 60 * 1000;
            if (Date.now() - parseInt(authTimestamp, 10) < oneHour) {
                setIsAdminAuthenticated(true);
            } else {
                localStorage.removeItem('admin_authenticated');
                localStorage.removeItem('admin_auth_timestamp');
            }
        }
        setIsAuthLoading(false);
    }, [onDataChanged]);

    const handleEnterApp = () => {
        sessionStorage.setItem('welcomeScreenShown', 'true');
        setShowWelcomeScreen(false);
    };

    const handleAuthenticate = (code: string) => {
        setIsUserAuthenticated(true);
        setAuthenticatedUserCode(code);
        localStorage.setItem('authenticated_user_code', code);
    };

    const handleLogout = () => {
        setIsUserAuthenticated(false);
        setAuthenticatedUserCode(null);
        localStorage.removeItem('authenticated_user_code');
        localStorage.removeItem('voting_user_hash');
    };

    const handleAdminAuthenticate = (password: string) => {
        if (password === ADMIN_PASSWORD) {
            setIsAdminAuthenticated(true);
            localStorage.setItem('admin_authenticated', 'true');
            localStorage.setItem('admin_auth_timestamp', Date.now().toString());
            setIsAdminModalOpen(false);
            return true;
        }
        return false;
    };
    
    const handleCloseAdminPanel = () => {
        setIsAdminAuthenticated(false);
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_auth_timestamp');
    }

    const handleVote = async (voteOption: 'SIM' | 'NÃO' | 'ABSTENÇÃO') => {
        if (!isUserAuthenticated || !authenticatedUserCode || hasVoted || votingStatus !== VotingStatus.STARTED) return;

        const userHash = localStorage.getItem('voting_user_hash') || `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('voting_user_hash', userHash);

        const voteData: Vote = {
            id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tipo: 'vote',
            voto: voteOption,
            timestamp: new Date().toISOString(),
            ip_hash: userHash,
            user_code: authenticatedUserCode,
            proposta_id: currentProposal?.id || 'unknown'
        };
        await dataSdk.create(voteData);
    };

    const saveVotingResults = async () => {
        if (!currentProposal) return;
        const simVotes = votes.filter(v => v.voto === 'SIM').length;
        const naoVotes = votes.filter(v => v.voto === 'NÃO').length;
        const abstencaoVotes = votes.filter(v => v.voto === 'ABSTENÇÃO').length;

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
            total_votos: votes.length,
            data_votacao: new Date().toISOString(),
            resultado_final: resultadoFinal,
            status: ProposalStatus.VOTADA,
            voting_duration_seconds: durationInSeconds,
        };
        await dataSdk.update(updatedProposal);
    };

    const handleStartVoting = async () => {
        await dataSdk.create({
            id: `control_${Date.now()}`,
            tipo: 'control',
            status: VotingStatus.STARTED,
            start_time: new Date().toISOString(),
            timestamp: new Date().toISOString()
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
            timestamp: new Date().toISOString()
        } as ControlRecord);
    };

    const handleNewVoting = async () => {
        await dataSdk.deleteAll('vote');
        await dataSdk.create({
            id: `control_reset_${Date.now()}`,
            tipo: 'control',
            status: 'reset',
            timestamp: new Date().toISOString()
        } as ControlRecord);
        await dataSdk.create({
            id: `control_new_${Date.now()}`,
            tipo: 'control',
            status: 'new_voting_created',
            timestamp: new Date().toISOString()
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
                  question={DEFAULT_CONFIG.pergunta_votacao}
                  status={votingStatus}
                  totalVotes={votes.length}
                />

                {!isUserAuthenticated ? (
                    <AuthSection 
                      onAuthenticate={handleAuthenticate}
                      sheetsConfig={sheetsConfig} 
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
                              onLogout={handleLogout}
                          />
                        )}
                        
                        {votingStatus === VotingStatus.CLOSED && (
                            <ResultsSection votes={votes} />
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
                    votingStatus={votingStatus}
                    sheetsConfig={sheetsConfig}
                    proposalSheetsConfig={proposalSheetsConfig}
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