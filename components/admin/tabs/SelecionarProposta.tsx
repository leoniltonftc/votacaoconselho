

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
    onSelectProposal: (proposalData: CurrentProposalRecord) => void;
    showAdminMessage: (type: 'success' | 'error', text: string) => void;
}

const SelecionarProposta: React.FC<SelecionarPropostaProps> = ({ proposals, onSelectProposal, showAdminMessage }) => {

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
                 {sortedProposals.length > 0 ? sortedProposals.map(proposta => (
                    <div key={proposta.id} className="bg-white border border-gray-200 rounded-lg p-4 printable-proposal">
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                <h5 className="font-semibold text-gray-800">{String(proposta.titulo || '')}</h5>
                                <p className="text-sm text-gray-600">{String(proposta.categoria || '')} • {String(proposta.abrangencia || '')}</p>
                                <p className="text-xs text-gray-500 mt-1">{String(proposta.regional_saude || '')} • {String(proposta.municipio || '')}</p>
                                {proposta.status === ProposalStatus.VOTADA && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                                        <span className={`font-bold p-1 px-2 rounded-full ${getResultClass(proposta.resultado_final)}`}>
                                            Resultado: {String(proposta.resultado_final || 'N/A')}
                                        </span>
                                        <span className="ml-2 text-gray-600">
                                            (Sim: {proposta.votos_sim ?? 0}, Não: {proposta.votos_nao ?? 0}, Abst: {proposta.votos_abstencao ?? 0})
                                        </span>
                                    </div>
                                )}
                            </div>
                            {proposta.status === ProposalStatus.VOTADA ? (
                                <button disabled className="ml-4 bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium no-print cursor-not-allowed">
                                    ✔️ Votada
                                </button>
                            ) : (
                                <button onClick={() => handleSelect(proposta)} className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium no-print">
                                    🎯 Selecionar
                                </button>
                            )}
                        </div>
                    </div>
                 )) : (
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