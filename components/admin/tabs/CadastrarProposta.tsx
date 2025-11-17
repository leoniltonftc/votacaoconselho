import React, { useState } from 'react';
import { Proposal, ProposalSheetsConfig, ProposalStatus } from '../../../types';
import { EIXOS, ABRANGENCIAS } from '../../../constants';

interface CadastrarPropostaProps {
    onCreateProposal: (proposal: Proposal) => void;
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
    proposalSheetsConfig: ProposalSheetsConfig | null;
    onSaveProposalSheetsConfig: (config: ProposalSheetsConfig) => void;
}
interface LoadedProposal {
  titulo: string;
  eixo: string;
  abrangencia: string;
  regional_saude: string;
  municipio: string;
  descricao: string;
}

// Helper functions for Google Sheets
const extractSheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
};

const buildSheetsApiUrl = (sheetId: string, sheetName: string) => {
    // Add cache-busting parameter to ensure fresh data is loaded.
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&_=${new Date().getTime()}`;
};

const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { // Handle escaped quotes ""
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
}


const CadastrarProposta: React.FC<CadastrarPropostaProps> = ({ onCreateProposal, showAdminMessage, proposalSheetsConfig, onSaveProposalSheetsConfig }) => {
    const [titulo, setTitulo] = useState('');
    const [categoria, setCategoria] = useState('');
    const [abrangencia, setAbrangencia] = useState('');
    const [regionalSaude, setRegionalSaude] = useState('');
    const [municipio, setMunicipio] = useState('');
    const [descricao, setDescricao] = useState('');
    
    const [sheetUrl, setSheetUrl] = useState(proposalSheetsConfig?.proposals_sheet_url || '');
    const [sheetName, setSheetName] = useState(proposalSheetsConfig?.proposals_sheet_name || 'Propostas');
    const [tituloCol, setTituloCol] = useState(proposalSheetsConfig?.titulo_column || 'A');
    const [eixoCol, setEixoCol] = useState(proposalSheetsConfig?.eixo_column || 'B');
    const [abrangenciaCol, setAbrangenciaCol] = useState(proposalSheetsConfig?.abrangencia_column || 'C');
    const [regionalSaudeCol, setRegionalSaudeCol] = useState(proposalSheetsConfig?.regional_saude_column || 'D');
    const [municipioCol, setMunicipioCol] = useState(proposalSheetsConfig?.municipio_column || 'E');
    const [descricaoCol, setDescricaoCol] = useState(proposalSheetsConfig?.descricao_column || 'F');
    const [loadedProposals, setLoadedProposals] = useState<LoadedProposal[]>([]);
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo || !categoria || !abrangencia || !regionalSaude || !municipio || !descricao) {
            showAdminMessage('error', 'Por favor, preencha todos os campos.');
            return;
        }
        const newProposal: Proposal = {
            id: `proposta_${Date.now()}`,
            tipo: 'proposta_cadastrada',
            titulo,
            categoria,
            abrangencia,
            regional_saude: regionalSaude,
            municipio,
            descricao,
            data_criacao: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            status: ProposalStatus.PENDENTE,
        };
        onCreateProposal(newProposal);
        showAdminMessage('success', 'Proposta cadastrada com sucesso!');
        setTitulo('');
        setCategoria('');
        setAbrangencia('');
        setRegionalSaude('');
        setMunicipio('');
        setDescricao('');
    };
    
    const handleSaveConfig = () => {
        const config: ProposalSheetsConfig = {
            id: `proposals_sheets_config_${Date.now()}`,
            tipo: 'proposals_sheets_config',
            proposals_sheet_url: sheetUrl,
            proposals_sheet_name: sheetName,
            titulo_column: tituloCol,
            eixo_column: eixoCol,
            abrangencia_column: abrangenciaCol,
            regional_saude_column: regionalSaudeCol,
            municipio_column: municipioCol,
            descricao_column: descricaoCol,
            timestamp: new Date().toISOString(),
        };
        onSaveProposalSheetsConfig(config);
        showAdminMessage('success', 'Configuração da planilha de propostas salva.');
    };
    
    const handleLoadProposals = async () => {
        const configToUse: Partial<ProposalSheetsConfig> = proposalSheetsConfig || {
          proposals_sheet_url: sheetUrl,
          proposals_sheet_name: sheetName,
          titulo_column: tituloCol,
          eixo_column: eixoCol,
          abrangencia_column: abrangenciaCol,
          regional_saude_column: regionalSaudeCol,
          municipio_column: municipioCol,
          descricao_column: descricaoCol,
        };

        if (!configToUse || !configToUse.proposals_sheet_url) {
            showAdminMessage('error', 'Configure e salve a URL da planilha de propostas primeiro.');
            return;
        }

        setIsLoadingProposals(true);
        setLoadedProposals([]);

        try {
            const sheetId = extractSheetId(configToUse.proposals_sheet_url);
            if (!sheetId) {
                throw new Error('URL da planilha inválida.');
            }

            const apiUrl = buildSheetsApiUrl(sheetId, configToUse.proposals_sheet_name!);
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Erro ao buscar dados (${response.status}). Verifique se a planilha é pública.`);
            }

            const csvText = await response.text();
             if (!csvText) {
                throw new Error("A planilha parece estar vazia.");
            }
            const lines = csvText.trim().split('\n');
            
            // Remove header line
            const dataLines = lines.slice(1);

            const tituloColIndex = (configToUse.titulo_column || 'A').toUpperCase().charCodeAt(0) - 65;
            const eixoColIndex = (configToUse.eixo_column || 'B').toUpperCase().charCodeAt(0) - 65;
            const abrangenciaColIndex = (configToUse.abrangencia_column || 'C').toUpperCase().charCodeAt(0) - 65;
            const regionalSaudeColIndex = (configToUse.regional_saude_column || 'D').toUpperCase().charCodeAt(0) - 65;
            const municipioColIndex = (configToUse.municipio_column || 'E').toUpperCase().charCodeAt(0) - 65;
            const descricaoColIndex = (configToUse.descricao_column || 'F').toUpperCase().charCodeAt(0) - 65;

            const proposalsData: LoadedProposal[] = dataLines.map(line => {
                const values = parseCsvLine(line);
                const titulo = values[tituloColIndex] || '';
                if (!titulo) return null;

                return {
                    titulo: titulo,
                    eixo: values[eixoColIndex] || '',
                    abrangencia: values[abrangenciaColIndex] || '',
                    regional_saude: values[regionalSaudeColIndex] || '',
                    municipio: values[municipioColIndex] || '',
                    descricao: values[descricaoColIndex] || ''
                };
            }).filter((p): p is LoadedProposal => p !== null);

            if (proposalsData.length === 0) {
                showAdminMessage('error', 'Nenhuma proposta com título foi encontrada na planilha.');
            } else {
                setLoadedProposals(proposalsData);
                showAdminMessage('success', `${proposalsData.length} propostas carregadas com sucesso.`);
            }
        } catch (e) {
            showAdminMessage('error', `Falha ao carregar propostas: ${(e as Error).message}`);
        } finally {
            setIsLoadingProposals(false);
        }
    };
    
    const handleSelectProposal = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIndexStr = e.target.value;
        if (selectedIndexStr) {
            const selectedIndex = parseInt(selectedIndexStr, 10);
            const proposal = loadedProposals[selectedIndex];
            if (proposal) {
                setTitulo(proposal.titulo);
                
                const matchingEixo = EIXOS.find(eixo => eixo.toLowerCase() === proposal.eixo.toLowerCase());
                setCategoria(matchingEixo || '');

                const matchingAbrangencia = ABRANGENCIAS.find(abr => abr.toLowerCase() === proposal.abrangencia.toLowerCase());
                setAbrangencia(matchingAbrangencia || '');
                
                setRegionalSaude(proposal.regional_saude);
                setMunicipio(proposal.municipio);
                setDescricao(proposal.descricao);
                showAdminMessage('success', `Formulário preenchido com: "${proposal.titulo}"`);
            }
        } else {
            setTitulo('');
            setCategoria('');
            setAbrangencia('');
            setRegionalSaude('');
            setMunicipio('');
            setDescricao('');
        }
    };


    return (
        <div>
            {/* Google Sheets Integration Section */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <h4 className="text-md font-semibold text-blue-800 mb-3">🔗 Importar da Planilha Google</h4>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">URL da Planilha:</label>
                            <input type="url" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">Nome da Aba:</label>
                            <input type="text" value={sheetName} onChange={e => setSheetName(e.target.value)} className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                         <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">Col. Título:</label>
                            <input type="text" value={tituloCol} onChange={e => setTituloCol(e.target.value)} className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">Col. Eixo:</label>
                            <input type="text" value={eixoCol} onChange={e => setEixoCol(e.target.value)} className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">Col. Abrangência:</label>
                            <input type="text" value={abrangenciaCol} onChange={e => setAbrangenciaCol(e.target.value)} className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">Col. Regional:</label>
                            <input type="text" value={regionalSaudeCol} onChange={e => setRegionalSaudeCol(e.target.value)} className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">Col. Município:</label>
                            <input type="text" value={municipioCol} onChange={e => setMunicipioCol(e.target.value)} className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">Col. Descrição:</label>
                            <input type="text" value={descricaoCol} onChange={e => setDescricaoCol(e.target.value)} className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg" />
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={handleSaveConfig} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">💾 Salvar Configuração</button>
                        <button onClick={handleLoadProposals} disabled={isLoadingProposals} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:opacity-50">
                          {isLoadingProposals ? '🔄 Carregando...' : '📥 Carregar Propostas'}
                        </button>
                    </div>
                </div>
                 {loadedProposals.length > 0 && (
                    <div className="mt-4">
                        <label htmlFor="select-proposal-title" className="block text-sm font-medium text-blue-700 mb-2">Selecionar Proposta da Planilha:</label>
                        <select
                            id="select-proposal-title"
                            onChange={handleSelectProposal}
                            defaultValue=""
                            className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg"
                        >
                            <option value="">Escolha uma proposta para preencher automaticamente</option>
                            {loadedProposals.map((p, index) => (
                                <option key={index} value={index}>{p.titulo}</option>
                            ))}
                        </select>
                        <p className="text-xs text-blue-600 mt-1">Selecione um título para preencher os campos do formulário.</p>
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título da Proposta:</label>
                    <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Eixo:</label>
                        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg" required>
                            <option value="">Selecione um eixo</option>
                            {EIXOS.map(eixo => <option key={eixo} value={eixo}>{eixo}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Abrangência:</label>
                        <select value={abrangencia} onChange={e => setAbrangencia(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg" required>
                            <option value="">Selecione a abrangência</option>
                            {ABRANGENCIAS.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Regional de Saúde:</label>
                        <input type="text" value={regionalSaude} onChange={e => setRegionalSaude(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Município:</label>
                        <input type="text" value={municipio} onChange={e => setMunicipio(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição Detalhada:</label>
                    <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={4} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg" required maxLength={1000}></textarea>
                     <div className="text-xs text-gray-500 mt-1">{descricao.length}/1000 caracteres</div>
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">➕ Cadastrar Proposta</button>
            </form>
        </div>
    );
};

export default CadastrarProposta;