

export interface Vote {
    id: string;
    tipo: 'vote';
    voto: 'SIM' | 'NÃO' | 'ABSTENÇÃO';
    timestamp: string;
    ip_hash: string;
    user_code: string;
    proposta_id: string;
}

export enum ProposalStatus {
    PENDENTE = 'PENDENTE',
    VOTADA = 'VOTADA'
}

export enum ProposalResult {
    APROVADA = 'APROVADA',
    REJEITADA = 'REJEITADA',
    EMPATE = 'EMPATE',
    ABSTENCAO_MAJORITARIA = 'ABSTENÇÃO MAJORITÁRIA'
}

export interface Proposal {
    id: string;
    tipo: 'proposta_cadastrada';
    titulo: string;
    categoria: string; // Eixo
    abrangencia: string;
    regional_saude: string;
    municipio: string;
    descricao: string;
    data_criacao: string;
    timestamp: string;
    // Voting results
    status?: ProposalStatus;
    votos_sim?: number;
    votos_nao?: number;
    votos_abstencao?: number;
    total_votos?: number;
    data_votacao?: string | null;
    resultado_final?: ProposalResult | null;
    voting_duration_seconds?: number;
}

export enum VotingStatus {
    NOT_STARTED = 'not_started',
    STARTED = 'started',
    CLOSED = 'closed',
    RESET = 'reset',
    NEW_VOTING_CREATED = 'new_voting_created'
}

export interface ControlRecord {
    id: string;
    tipo: 'control';
    status: VotingStatus | 'reset' | 'new_voting_created';
    start_time?: string;
    end_time?: string;
    timestamp: string;
}

export interface CurrentProposalRecord {
    id: string;
    tipo: 'proposal';
    proposta_id: string;
    titulo: string;
    eixo: string;
    proposta: string;
    timestamp: string;
}

export interface SheetsConfig {
    id: string;
    tipo: 'sheets_config';
    google_sheet_url: string;
    sheet_name: string;
    username_column: string;
    password_column: string;
    timestamp: string;
}

export interface ProposalSheetsConfig {
    id: string;
    tipo: 'proposals_sheets_config';
    proposals_sheet_url: string;
    proposals_sheet_name: string;
    titulo_column: string;
    eixo_column: string;
    abrangencia_column: string;
    regional_saude_column: string;
    municipio_column: string;
    descricao_column: string;
    timestamp: string;
}

export type AppData = Vote | Proposal | ControlRecord | CurrentProposalRecord | SheetsConfig | ProposalSheetsConfig;