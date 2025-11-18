

import React, { useState, useMemo } from 'react';
import { Proposal, ProposalResult, ProposalStatus } from '../../../types';
import { EIXOS, ABRANGENCIAS } from '../../../constants';
import EditProposalModal from '../../modals/EditProposalModal';

// Since jspdf and jspdf-autotable are loaded from a CDN, we need to tell TypeScript they exist on the window object.
declare global {
    interface Window {
        jspdf: any;
    }
}


interface ListarPropostasProps {
    proposals: Proposal[];
    onUpdateProposal: (proposal: Proposal) => void;
    onDeleteProposal: (proposal: Proposal) => void;
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
    onResetProposalVote: (proposalId: string) => void;
}

const ListarPropostas: React.FC<ListarPropostasProps> = ({ proposals, onUpdateProposal, onDeleteProposal, showAdminMessage, onResetProposalVote }) => {
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroAbrangencia, setFiltroAbrangencia] = useState('');
    const [filtroRegional, setFiltroRegional] = useState('');
    const [filtroMunicipio, setFiltroMunicipio] = useState('');
    const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

    const { regionais, municipios, filteredProposals } = useMemo(() => {
        try {
            const safeProposals = Array.isArray(proposals) ? proposals.filter(p => p && typeof p === 'object') : [];

            const regionaisList = [...new Set(
                safeProposals
                    .map(p => String(p.regional_saude || ''))
                    .flatMap(r => r.split(',').map(item => item.trim()))
                    .filter(Boolean)
            )].sort((a: string, b: string) => a.localeCompare(b));

            const municipiosList = [...new Set(
                safeProposals
                    .map(p => String(p.municipio || ''))
                    .flatMap(m => m.split(',').map(item => item.trim()))
                    .filter(Boolean)
            )].sort((a: string, b: string) => a.localeCompare(b));
            
            const filtered = safeProposals
                .filter(p => !filtroCategoria || p.categoria === filtroCategoria)
                .filter(p => !filtroAbrangencia || p.abrangencia === filtroAbrangencia)
                .filter(p => !filtroRegional || String(p.regional_saude || '').split(',').map(item => item.trim()).includes(filtroRegional))
                .filter(p => !filtroMunicipio || String(p.municipio || '').split(',').map(item => item.trim()).includes(filtroMunicipio))
                .sort((a, b) => {
                    const eixoCompare = String(a.categoria || '').localeCompare(String(b.categoria || ''));
                    if (eixoCompare !== 0) return eixoCompare;
                    return String(a.titulo || '').localeCompare(String(b.titulo || ''));
                });

            return {
                regionais: regionaisList,
                municipios: municipiosList,
                filteredProposals: filtered
            };
        } catch (error) {
            console.error("CRITICAL ERROR in ListarPropostas: Could not process proposals. Returning empty list to prevent app crash.", error);
            return {
                regionais: [],
                municipios: [],
                filteredProposals: []
            };
        }
    }, [proposals, filtroCategoria, filtroAbrangencia, filtroRegional, filtroMunicipio]);

    const formatDuration = (totalSeconds: number | undefined): string => {
        if (totalSeconds === undefined || totalSeconds < 0) return 'N/A';
        const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const handleDelete = (proposal: Proposal) => {
        if (window.confirm(`Tem certeza que deseja excluir a proposta "${proposal.titulo}"?`)) {
            onDeleteProposal(proposal);
            showAdminMessage('success', 'Proposta excluída com sucesso.');
        }
    };
    
    const handleUpdate = (updatedProposal: Proposal) => {
        onUpdateProposal(updatedProposal);
        setEditingProposal(null);
        showAdminMessage('success', 'Proposta atualizada com sucesso.');
    };
    
    const handleResetVote = (proposal: Proposal) => {
        if (window.confirm(`ATENÇÃO: Tem certeza que deseja ZERAR os votos da proposta "${proposal.titulo}"? Esta ação não pode ser desfeita.`)) {
            onResetProposalVote(proposal.id);
            showAdminMessage('success', 'Votação da proposta zerada com sucesso.');
        }
    }

    const handlePrint = () => {
      const adminPanel = document.querySelector('.admin-panel-section');
      if (adminPanel) {
        document.body.classList.add('is-printing');
        adminPanel.classList.add('is-printing-section');
        
        window.onafterprint = () => {
          document.body.classList.remove('is-printing');
          adminPanel.classList.remove('is-printing-section');
          window.onafterprint = null;
        };
        
        window.print();
      }
    };

    const handleExportPDF = () => {
      if (typeof window.jspdf === 'undefined') {
        alert("Erro: A biblioteca jsPDF não foi carregada.");
        return;
      }
      
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "landscape" });
        
        if (typeof (doc as any).autoTable !== 'function') {
            throw new Error("A extensão jsPDF-AutoTable não foi carregada corretamente.");
        }

        doc.setFontSize(18);
        doc.text("Lista de Propostas Cadastradas", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Relatório gerado em: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total de propostas (filtrado): ${filteredProposals.length}`, 14, 36);

        const tableColumn = ["Eixo", "Título", "Abrangência", "Regional", "Município", "Status", "Resultado", "Sim", "Não", "Abst.", "Total", "Duração"];
        const tableRows: (string | number)[][] = [];

        filteredProposals.forEach(p => {
            const proposalData = [
                p.categoria,
                p.titulo,
                p.abrangencia,
                p.regional_saude,
                p.municipio,
                p.status || ProposalStatus.PENDENTE,
                p.status === ProposalStatus.VOTADA ? (p.resultado_final || 'N/A') : 'Pendente',
                p.votos_sim ?? 'N/A',
                p.votos_nao ?? 'N/A',
                p.votos_abstencao ?? 'N/A',
                p.total_votos ?? 'N/A',
                formatDuration(p.voting_duration_seconds),
            ];
            tableRows.push(proposalData.map(d => String(d)));
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: { 
                1: { cellWidth: 50 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25 },
            }
        });
        
        doc.save("lista_propostas.pdf");
      } catch (error) {
        alert(`Ocorreu um erro ao exportar o PDF: ${(error as Error).message}`);
        console.error("PDF Export Error:", error);
      }
    };

    const getResultClass = (result: ProposalResult | null | undefined) => {
        switch (result) {
            case ProposalResult.APROVADA:
                return 'bg-green-100 text-green-800';
            case ProposalResult.REJEITADA:
                return 'bg-red-100 text-red-800';
            case ProposalResult.EMPATE:
                return 'bg-gray-100 text-gray-800';
            case ProposalResult.ABSTENCAO_MAJORITARIA:
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-500';
        }
    };

    return (
        <div className="printable-section">
            <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Propostas Cadastradas ({filteredProposals.length})</h4>
                <p className="text-sm text-gray-600">Visualize, edite ou exclua as propostas do sistema.</p>
            </div>

            <div className="no-print mb-4 p-4 bg-gray-100 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Eixo:</label>
                        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">Todos os eixos</option>
                            {EIXOS.map(eixo => <option key={eixo} value={eixo}>{eixo}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Abrangência:</label>
                        <select value={filtroAbrangencia} onChange={e => setFiltroAbrangencia(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">Todas</option>
                            {ABRANGENCIAS.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Regional:</label>
                        <select value={filtroRegional} onChange={e => setFiltroRegional(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">Todas</option>
                            {regionais.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Município:</label>
                        <select value={filtroMunicipio} onChange={e => setFiltroMunicipio(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">Todos</option>
                            {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="no-print bg-gray-100 rounded-lg p-3 mb-4 flex flex-wrap gap-3">
                 <button onClick={handlePrint} disabled={filteredProposals.length === 0} className="flex-1 min-w-[120px] bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    🖨️ Imprimir Lista
                </button>
                 <button onClick={handleExportPDF} disabled={filteredProposals.length === 0} className="flex-1 min-w-[120px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    📄 Exportar PDF
                </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
                 {filteredProposals.length > 0 ? filteredProposals.map(proposta => (
                    <div key={proposta.id} className="bg-white border border-gray-200 rounded-lg p-4 printable-proposal">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                             <div className="flex-1 mb-3 sm:mb-0">
                                <span className={`text-xs font-bold p-1 px-2 rounded-full ${proposta.status === ProposalStatus.VOTADA ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {String(proposta.status || ProposalStatus.PENDENTE)}
                                </span>
                                <h5 className="font-semibold text-gray-800 mt-2">{String(proposta.titulo || '')}</h5>
                                <p className="text-sm text-gray-600">{String(proposta.categoria || '')} • {String(proposta.abrangencia || '')}</p>
                                <p className="text-xs text-gray-500 mt-1">{String(proposta.regional_saude || '')} • {String(proposta.municipio || '')}</p>
                                <p className="text-sm text-gray-600 mt-2 line-clamp-3">{String(proposta.descricao || '')}</p>
                            </div>
                            <div className="no-print flex-shrink-0 flex sm:flex-col sm:space-y-2 sm:items-end space-x-2 sm:space-x-0">
                                <button onClick={() => setEditingProposal(proposta)} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg">✏️ Editar</button>
                                <button onClick={() => handleDelete(proposta)} className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg">🗑️ Excluir</button>
                                {proposta.status === ProposalStatus.VOTADA && (
                                    <button onClick={() => handleResetVote(proposta)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg">🔄 Zerar Votação</button>
                                )}
                            </div>
                        </div>
                        {proposta.status === ProposalStatus.VOTADA && (
                             <div className="mt-3 pt-3 border-t border-gray-100 text-xs">
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    <span className={`font-bold p-1 px-2 rounded-full ${getResultClass(proposta.resultado_final)}`}>
                                        Resultado: {String(proposta.resultado_final || 'N/A')}
                                    </span>
                                    <span className="text-gray-600"><strong>Sim:</strong> {proposta.votos_sim ?? 0}</span>
                                    <span className="text-gray-600"><strong>Não:</strong> {proposta.votos_nao ?? 0}</span>
                                    <span className="text-gray-600"><strong>Abst:</strong> {proposta.votos_abstencao ?? 0}</span>
                                    <span className="text-gray-600"><strong>Total:</strong> {proposta.total_votos ?? 0}</span>
                                    <span className="text-gray-600"><strong>Duração:</strong> {formatDuration(proposta.voting_duration_seconds)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                 )) : (
                     <div className="text-center text-gray-500 py-8">
                         <span className="text-2xl">📋</span>
                         <p>Nenhuma proposta encontrada com os filtros selecionados.</p>
                     </div>
                 )}
            </div>

            {editingProposal && (
                <EditProposalModal 
                    proposal={editingProposal}
                    onClose={() => setEditingProposal(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    );
};

export default ListarPropostas;