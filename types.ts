

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
    EM_VOTACAO = 'EM VOTAÇÃO',
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
    is_plenary?: boolean;
    // Classification fields
    classification_label?: string;
    classification_color?: string;
}

export enum VotingStatus {
    NOT_STARTED = 'not_started',
    STARTED = 'started',
    CLOSED = 'closed',
    RESET = 'reset',
    NEW_VOTING_CREATED = 'new_voting_created'
}

export enum SystemPhase {
    EIXOS = 'EIXOS',
    PLENARIA = 'PLENARIA'
}

export interface ControlRecord {
    id: string;
    tipo: 'control';
    status: VotingStatus | 'reset' | 'new_voting_created';
    start_time?: string;
    end_time?: string;
    timestamp: string;
    system_phase?: SystemPhase;
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
    segmento_column?: string;
    representante_column?: string;
    eixo_column?: string;
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

export interface LocalUser {
    id: string;
    tipo: 'local_user';
    username: string;
    password: string;
    segmento?: string;
    representante?: string;
    eixo?: string;
    timestamp: string;
}

export interface AdminPermissions {
    can_manage_voting: boolean;
    can_manage_proposals: boolean;
    can_manage_users: boolean;
    can_manage_config: boolean;
}

export interface AdminUser {
    id: string;
    tipo: 'admin_user';
    username: string;
    password: string;
    permissions?: AdminPermissions;
    timestamp: string;
}

export interface ClassificationRule {
    id: string;
    tipo: 'classification_rule';
    min_percent: number;
    max_percent: number;
    label: string;
    action: 'none' | 'promote_to_plenary';
    color: string;
    timestamp: string;
}

export type AppData = Vote | Proposal | ControlRecord | CurrentProposalRecord | SheetsConfig | ProposalSheetsConfig | LocalUser | AdminUser | ClassificationRule;