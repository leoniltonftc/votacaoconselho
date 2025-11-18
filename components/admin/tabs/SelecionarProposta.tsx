
import React from 'react';
import { Proposal, CurrentProposalRecord, ProposalStatus, ProposalResult } from '../../../types';

// Since jspdf and jspdf-autotable are loaded from a CDN, we need to tell TypeScript they exist on the window object.
declare global {
    interface Window {
        jspdf: any;
    }
}

interface SelecionarPropostaProps {
    proposals: Proposal[];
    currentProposalId?: string;
    onSelectProposal: (proposalData: CurrentProposalRecord) => void;
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
    onResetProposalVote: (proposalId: string) => void;
}

const SelecionarProposta: React.FC<SelecionarPropostaProps> = ({ proposals, currentProposalId, onSelectProposal, showAdminMessage, onResetProposalVote }) => {

    const sortedProposals = [...proposals].sort((a, b) => {
        const eixoCompare = String(a.categoria || '').localeCompare(String(b.categoria || ''));
        if (eixoCompare !== 0) return eixoCompare;
        return String(a.titulo || '').localeCompare(String(b.titulo || ''));
    });

    const handleSelect = (proposal: Proposal) => {
        const proposalData: CurrentProposalRecord = {
            id: `proposal_selection_${Date.now()}`,
            tipo: 'proposal',
            proposta_id: proposal.id,
            titulo: proposal.titulo,
            eixo: proposal.categoria,
            proposta: proposal.descricao,
            timestamp: new Date().toISOString()
        };
        onSelectProposal(proposalData);
        showAdminMessage('success', `Proposta "${proposal.titulo}" selecionada para votação.`);
    };

    const handleReset = (proposal: Proposal) => {
        if (window.confirm(`Tem certeza que deseja ZERAR os votos da proposta "${proposal.titulo}"? Isso permitirá que ela seja selecionada novamente.`)) {
            onResetProposalVote(proposal.id);
            showAdminMessage('success', `Votação da proposta "${proposal.titulo}" zerada com sucesso.`);
        }
    };

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
            const doc = new jsPDF();

            if (typeof (doc as any).autoTable !== 'function') {
                throw new Error("A extensão jsPDF-AutoTable não foi carregada corretamente.");
            }

            doc.setFontSize(18);
            doc.text("Propostas Disponíveis para Votação", 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Relatório gerado em: ${new Date().toLocaleString()}`, 14, 30);
            doc.text(`Total de propostas: ${sortedProposals.length}`, 14, 36);

            const tableColumn = ["Eixo", "Título", "Descrição", "Abrangência", "Regional", "Município"];
            const tableRows: string[][] = [];

            sortedProposals.forEach(p => {
                const proposalData = [
                    p.categoria,
                    p.titulo,
                    p.descricao,
                    p.abrangencia,
                    p.regional_saude,
                    p.municipio,
                ];
                tableRows.push(proposalData.map(d => String(d || '')));
            });

            (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 
                    1: { cellWidth: 40 }, 
                    2: { cellWidth: 60 } 
                }
            });

            doc.save("propostas_para_selecao.pdf");
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

    const calculatePercentage = (value: number | undefined, total: number | undefined) => {
        if (!value || !total || total === 0) return 0;
        return Math.round((value / total) * 100);
    };


    return (
        <div className="printable-section">
            <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Selecionar Proposta para Votação</h4>
                <p className="text-sm text-gray-600">Escolha uma proposta para a votação atual.</p>
            </div>

            <div className="no-print bg-gray-100 rounded-lg p-3 mb-4 flex flex-wrap gap-3">
                <button onClick={handlePrint} disabled={sortedProposals.length === 0} className="flex-1 min-w-[120px] bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    🖨️ Imprimir Lista
                </button>
                <button onClick={handleExportPDF} disabled={sortedProposals.length === 0} className="flex-1 min-w-[120px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    📄 Exportar PDF
                </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
                 {sortedProposals.length > 0 ? sortedProposals.map(proposta => {
                    const simPct = calculatePercentage(proposta.votos_sim, proposta.total_votos);
                    const naoPct = calculatePercentage(proposta.votos_nao, proposta.total_votos);
                    const abstPct = calculatePercentage(proposta.votos_abstencao, proposta.total_votos);
                    const isSelected = currentProposalId === proposta.id;
                    
                    return (
                    <div key={proposta.id} className={`bg-white border rounded-lg p-4 printable-proposal transition-all ${isSelected ? 'border-2 border-blue-600 bg-blue-50 shadow-lg transform scale-[1.01]' : 'border-gray-200'}`}>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div className="flex-1 w-full">
                                <h5 className="font-semibold text-gray-800">
                                    {String(proposta.titulo || '')} 
                                    {isSelected && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full animate-pulse">Em Votação</span>}
                                </h5>
                                <p className="text-sm text-gray-600">{String(proposta.categoria || '')} • {String(proposta.abrangencia || '')}</p>
                                <p className="text-xs text-gray-500 mt-1">{String(proposta.regional_saude || '')} • {String(proposta.municipio || '')}</p>
                                {proposta.status === ProposalStatus.VOTADA && (
                                    <div className="mt-3 pt-2 border-t border-gray-100 text-xs w-full">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className={`font-bold p-1 px-2 rounded-full ${getResultClass(proposta.resultado_final)}`}>
                                                {String(proposta.resultado_final || 'N/A')}
                                            </span>
                                            <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                Total: {proposta.total_votos ?? 0}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {/* Barra SIM */}
                                            <div className="flex items-center w-full">
                                                <div className="w-16 font-bold text-green-700">SIM</div>
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mx-2">
                                                    <div className="h-full bg-green-500" style={{ width: `${simPct}%` }}></div>
                                                </div>
                                                <div className="w-20 text-right text-gray-600">{proposta.votos_sim ?? 0} ({simPct}%)</div>
                                            </div>
                                            {/* Barra NÃO */}
                                            <div className="flex items-center w-full">
                                                <div className="w-16 font-bold text-red-700">NÃO</div>
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mx-2">
                                                    <div className="h-full bg-red-500" style={{ width: `${naoPct}%` }}></div>
                                                </div>
                                                <div className="w-20 text-right text-gray-600">{proposta.votos_nao ?? 0} ({naoPct}%)</div>
                                            </div>
                                            {/* Barra ABST */}
                                            <div className="flex items-center w-full">
                                                <div className="w-16 font-bold text-yellow-700">ABST.</div>
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mx-2">
                                                    <div className="h-full bg-yellow-500" style={{ width: `${abstPct}%` }}></div>
                                                </div>
                                                <div className="w-20 text-right text-gray-600">{proposta.votos_abstencao ?? 0} ({abstPct}%)</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-row lg:flex-col gap-2 no-print min-w-[140px] w-full lg:w-auto">
                                {isSelected ? (
                                    <button disabled className="w-full lg:w-auto bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-bold cursor-default shadow-md flex items-center justify-center gap-2 opacity-100">
                                        <span className="animate-pulse">📢</span> Em Votação
                                    </button>
                                ) : proposta.status === ProposalStatus.VOTADA ? (
                                    <>
                                        <button disabled className="flex-1 lg:flex-none bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed opacity-70 text-center">
                                            ✔️ Votada
                                        </button>
                                        <button onClick={() => handleReset(proposta)} className="flex-1 lg:flex-none bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm text-center">
                                            🔄 Zerar
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => handleSelect(proposta)} className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-transform transform hover:scale-105">
                                        🎯 Selecionar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                 )}) : (
                     <div className="text-center text-gray-500 py-8">
                         <span className="text-2xl">🎯</span>
                         <p>Nenhuma proposta disponível para seleção.</p>
                     </div>
                 )}
            </div>
        </div>
    );
};

export default SelecionarProposta;
