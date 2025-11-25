
import React, { useState } from 'react';
import { Proposal, ProposalResult, ProposalStatus } from '../../../types';
import { EIXOS } from '../../../constants';

// Since jspdf and jspdf-autotable are loaded from a CDN, we need to tell TypeScript they exist on the window object.
declare global {
    interface Window {
        jspdf: any;
    }
}

interface AcompanhamentoProps {
    proposals: Proposal[];
    onUpdateProposal?: (proposal: Proposal) => void;
    showAdminMessage?: (type: 'success' | 'error', text: string) => void;
}

const Acompanhamento: React.FC<AcompanhamentoProps> = ({ proposals, onUpdateProposal, showAdminMessage }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingVoted, setIsExportingVoted] = useState(false);
    const [approvalThreshold, setApprovalThreshold] = useState(50);

    const sortedProposals = [...proposals].sort((a, b) => {
        const eixoCompare = String(a.categoria || '').localeCompare(String(b.categoria || ''));
        if (eixoCompare !== 0) return eixoCompare;
        return String(a.titulo || '').localeCompare(String(b.titulo || ''));
    });
    
    const votedProposals = proposals.filter(p => p.status === ProposalStatus.VOTADA);
    
    const stats = {
        total: proposals.length,
        pendentes: proposals.filter(p => !p.status || p.status === ProposalStatus.PENDENTE).length,
        aprovadas: proposals.filter(p => p.resultado_final === ProposalResult.APROVADA).length,
        rejeitadas: proposals.filter(p => p.resultado_final === ProposalResult.REJEITADA).length,
        qualificadas: proposals.filter(p => p.is_plenary === true).length // Conta propostas na plenária
    };
    
    const analisePorEixo = EIXOS.map(eixo => {
        const proposalsInEixo = proposals.filter(p => p.categoria === eixo);
        return {
            eixo,
            total: proposalsInEixo.length,
            aprovadas: proposalsInEixo.filter(p => p.resultado_final === ProposalResult.APROVADA).length,
            rejeitadas: proposalsInEixo.filter(p => p.resultado_final === ProposalResult.REJEITADA).length,
            qualificadas: proposalsInEixo.filter(p => p.is_plenary === true).length
        };
    }).filter(e => e.total > 0);

    // Função para promover propostas automaticamente
    const handlePromoteByRule = () => {
        if (!onUpdateProposal) return;

        const eligibleProposals = proposals.filter(p => {
            // Regra: Deve estar votada E ter % de SIM maior que o limite
            if (p.status !== ProposalStatus.VOTADA) return false;
            const total = p.total_votos || 0;
            if (total === 0) return false;
            const simPercent = ((p.votos_sim || 0) / total) * 100;
            return simPercent >= approvalThreshold;
        });

        if (eligibleProposals.length === 0) {
            if (showAdminMessage) showAdminMessage('error', 'Nenhuma proposta atende aos critérios para promoção.');
            return;
        }

        if (window.confirm(`Deseja promover ${eligibleProposals.length} propostas para a Plenária Final? (Critério: > ${approvalThreshold}% de votos SIM)`)) {
            let promotedCount = 0;
            eligibleProposals.forEach(p => {
                if (!p.is_plenary) {
                    onUpdateProposal({
                        ...p,
                        is_plenary: true
                    });
                    promotedCount++;
                }
            });
            if (showAdminMessage) showAdminMessage('success', `${promotedCount} propostas foram promovidas para a Plenária Final!`);
        }
    };

    const handleExportPDF = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert("Erro: A biblioteca para gerar PDF (jsPDF) não foi carregada. Verifique a conexão com a internet.");
            return;
        }
        
        setIsExporting(true);
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            if (typeof (doc as any).autoTable !== 'function') {
                throw new Error("A extensão jsPDF-AutoTable não foi carregada corretamente.");
            }

            doc.setFontSize(22);
            doc.text("Relatório de Acompanhamento", 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Gerado em: ${new Date().toLocaleString()}`, 105, 25, { align: 'center' });

            doc.setFontSize(16);
            doc.text("Resumo Geral", 14, 40);
            doc.setFontSize(12);
            doc.text(`- Total de Propostas: ${stats.total}`, 14, 50);
            doc.text(`- Aprovadas: ${stats.aprovadas} | Rejeitadas: ${stats.rejeitadas}`, 14, 55);
            doc.text(`- Qualificadas para Plenária Final: ${stats.qualificadas}`, 14, 60);
            
            const tableColumn = ["Eixo", "Título", "Status", "Resultado", "Plenária Final"];
            const tableRows: (string | number | null | undefined)[][] = [];

            sortedProposals.forEach(proposal => {
                const proposalData = [
                    proposal.categoria,
                    proposal.titulo,
                    proposal.status || ProposalStatus.PENDENTE,
                    proposal.resultado_final || '-',
                    proposal.is_plenary ? 'SIM' : 'NÃO'
                ];
                tableRows.push(proposalData);
            });
            
            (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 70,
                headStyles: { fillColor: [22, 160, 133] },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 
                    1: { cellWidth: 60 }
                }
            });

            doc.save("relatorio_geral_propostas.pdf");
        } catch(error) {
            console.error("Error exporting PDF:", error);
            alert(`Ocorreu um erro ao exportar o PDF: ${(error as Error).message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportVotedPDF = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert("Erro: A biblioteca para gerar PDF (jsPDF) não foi carregada.");
            return;
        }
        
        setIsExportingVoted(true);
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: "landscape" });

            if (typeof (doc as any).autoTable !== 'function') {
                throw new Error("A extensão jsPDF-AutoTable não foi carregada corretamente.");
            }

            doc.setFontSize(18);
            doc.text("Relatório Detalhado de Votações", 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Relatório gerado em: ${new Date().toLocaleString()}`, 14, 30);
            
            const tableColumn = ["Eixo", "Título", "Resultado", "Sim", "Não", "Abst.", "Total", "Plenária"];
            const tableRows: (string | number)[][] = [];

            votedProposals.forEach(p => {
                const proposalData = [
                    p.categoria,
                    p.titulo,
                    p.resultado_final || 'N/A',
                    p.votos_sim ?? 0,
                    p.votos_nao ?? 0,
                    p.votos_abstencao ?? 0,
                    p.total_votos ?? 0,
                    p.is_plenary ? 'QUALIFICADA' : '-'
                ];
                tableRows.push(proposalData.map(d => String(d)));
            });
            
            (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                headStyles: { fillColor: [74, 35, 90] },
                styles: { fontSize: 9, cellPadding: 2 },
                 columnStyles: { 
                    1: { cellWidth: 90 }, 
                }
            });

            doc.save("relatorio_detalhado_votos.pdf");
        } catch(error) {
            console.error("Error exporting Voted PDF:", error);
            alert(`Ocorreu um erro ao exportar o PDF de votações: ${(error as Error).message}`);
        } finally {
            setIsExportingVoted(false);
        }
    };

    const escapeCsvCell = (cellData: any): string => {
        const stringData = String(cellData ?? '');
        if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
            return `"${stringData.replace(/"/g, '""')}"`;
        }
        return stringData;
    };

    const handleExportCSV = () => {
        setIsExporting(true);
        try {
            const headers = [
                "ID", "Título", "Eixo", "Abrangência", "Regional", "Município", 
                "Status", "Votos Sim", "Votos Não", "Votos Abstenção",
                "Total", "Resultado", "Qualificada Plenária"
            ];

            const csvRows = [headers.join(',')];

            sortedProposals.forEach(p => {
                const row = [
                    escapeCsvCell(p.id), escapeCsvCell(p.titulo), escapeCsvCell(p.categoria),
                    escapeCsvCell(p.abrangencia), escapeCsvCell(p.regional_saude), escapeCsvCell(p.municipio), 
                    escapeCsvCell(p.status || ProposalStatus.PENDENTE), escapeCsvCell(p.votos_sim || 0),
                    escapeCsvCell(p.votos_nao || 0), escapeCsvCell(p.votos_abstencao || 0),
                    escapeCsvCell(p.total_votos || 0), escapeCsvCell(p.resultado_final || 'Pendente'), 
                    escapeCsvCell(p.is_plenary ? 'SIM' : 'NÃO')
                ].join(',');
                csvRows.push(row);
            });

            const csvString = csvRows.join('\n');
            const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "relatorio_propostas_completo.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch(error) {
            console.error("Error exporting CSV:", error);
            alert("Ocorreu um erro ao exportar o CSV.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-2">📊 Painel de Acompanhamento</h4>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-xs text-blue-800 font-medium">Total</div>
                </div>
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
                    <div className="text-xs text-yellow-800 font-medium">Pendentes</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.aprovadas}</div>
                    <div className="text-xs text-green-800 font-medium">Aprovadas</div>
                </div>
                 <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.rejeitadas}</div>
                    <div className="text-xs text-red-800 font-medium">Rejeitadas</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{stats.qualificadas}</div>
                    <div className="text-xs text-purple-800 font-medium">Na Plenária</div>
                </div>
            </div>

            {onUpdateProposal && (
                <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h5 className="text-sm font-bold text-purple-800 mb-1">🏛️ Gerenciar Plenária Final</h5>
                            <p className="text-xs text-gray-600">Defina regras para qualificar propostas automaticamente para a fase final.</p>
                        </div>
                        
                        <div className="flex items-end gap-2 w-full md:w-auto">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Aprovação Mínima (SIM %):</label>
                                <input 
                                    type="number" 
                                    value={approvalThreshold} 
                                    onChange={e => setApprovalThreshold(Number(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    min="0" max="100"
                                />
                            </div>
                            <button 
                                onClick={handlePromoteByRule} 
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transition-colors whitespace-nowrap"
                            >
                                🚀 Promover Qualificadas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">📈 Análise por Eixo</h5>
                <div className="space-y-3">
                    {analisePorEixo.map(({ eixo, total, aprovadas, rejeitadas, qualificadas }) => (
                        <div key={eixo} className="bg-white border p-3 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2">
                            <div className="flex-1 w-full sm:w-auto">
                                <h6 className="font-semibold text-sm text-gray-800">{eixo}</h6>
                                <span className="text-xs text-gray-500">{total} propostas</span>
                            </div>
                            <div className="flex gap-2 text-xs font-medium w-full sm:w-auto">
                               <div className="bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200 flex-1 text-center">Aprov: {aprovadas}</div>
                               <div className="bg-red-100 text-red-800 px-2 py-1 rounded border border-red-200 flex-1 text-center">Rej: {rejeitadas}</div>
                               <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded border border-purple-200 flex-1 text-center">Plenária: {qualificadas}</div>
                           </div>
                        </div>
                    ))}
                     {analisePorEixo.length === 0 && <p className="text-center text-gray-500 text-sm py-4">Nenhuma proposta com eixos definidos para análise.</p>}
                </div>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">📄 Exportar Relatórios Detalhados</h5>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <button onClick={handleExportVotedPDF} disabled={isExportingVoted || isExporting || votedProposals.length === 0} className="flex-1 min-w-[140px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 shadow-sm">
                        {isExportingVoted ? 'Gerando...' : '📄 Relatório de Votações'}
                    </button>
                    <button onClick={handleExportPDF} disabled={isExporting || isExportingVoted || proposals.length === 0} className="flex-1 min-w-[140px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 shadow-sm">
                        {isExporting ? 'Gerando...' : '📋 Relatório Completo (PDF)'}
                    </button>
                    <button onClick={handleExportCSV} disabled={isExporting || isExportingVoted || proposals.length === 0} className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 shadow-sm">
                        {isExporting ? 'Gerando...' : '📊 Relatório Completo (CSV)'}
                    </button>
                </div>
                 {proposals.length === 0 && <p className="text-xs text-gray-500 mt-2 text-center">Nenhuma proposta disponível para exportar.</p>}
            </div>
        </div>
    );
};

export default Acompanhamento;
