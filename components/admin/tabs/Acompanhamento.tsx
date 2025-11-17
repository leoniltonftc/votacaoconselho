
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
}

const Acompanhamento: React.FC<AcompanhamentoProps> = ({ proposals }) => {
    const [isExporting, setIsExporting] = useState(false);

    const sortedProposals = [...proposals].sort((a, b) => {
        const eixoCompare = a.categoria.localeCompare(b.categoria);
        if (eixoCompare !== 0) return eixoCompare;
        return a.titulo.localeCompare(b.titulo);
    });
    
    const stats = {
        total: proposals.length,
        pendentes: proposals.filter(p => !p.status || p.status === ProposalStatus.PENDENTE).length,
        aprovadas: proposals.filter(p => p.resultado_final === ProposalResult.APROVADA).length,
        rejeitadas: proposals.filter(p => p.resultado_final === ProposalResult.REJEITADA).length,
    };
    
    const analisePorEixo = EIXOS.map(eixo => {
        const proposalsInEixo = proposals.filter(p => p.categoria === eixo);
        return {
            eixo,
            total: proposalsInEixo.length,
            aprovadas: proposalsInEixo.filter(p => p.resultado_final === ProposalResult.APROVADA).length,
            rejeitadas: proposalsInEixo.filter(p => p.resultado_final === ProposalResult.REJEITADA).length,
        };
    }).filter(e => e.total > 0);

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
            doc.text("Relatório de Acompanhamento de Propostas", 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Gerado em: ${new Date().toLocaleString()}`, 105, 25, { align: 'center' });

            doc.setFontSize(16);
            doc.text("Resumo Geral", 14, 40);
            doc.setFontSize(12);
            doc.text(`- Total de Propostas: ${stats.total}`, 14, 50);
            doc.text(`- Propostas Pendentes: ${stats.pendentes}`, 14, 55);
            doc.text(`- Propostas Aprovadas: ${stats.aprovadas}`, 14, 60);
            doc.text(`- Propostas Rejeitadas: ${stats.rejeitadas}`, 14, 65);
            
            const tableColumn = ["Eixo", "Título", "Descrição", "Regional", "Município", "Status", "Resultado"];
            const tableRows: (string | number | null | undefined)[][] = [];

            sortedProposals.forEach(proposal => {
                const proposalData = [
                    proposal.categoria,
                    proposal.titulo,
                    proposal.descricao,
                    proposal.regional_saude,
                    proposal.municipio,
                    proposal.status || ProposalStatus.PENDENTE,
                    proposal.resultado_final || 'Pendente',
                ];
                tableRows.push(proposalData);
            });
            
            (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 75,
                headStyles: { fillColor: [22, 160, 133] },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 
                    1: { cellWidth: 40 }, 
                    2: { cellWidth: 50 } 
                }
            });

            doc.save("relatorio_propostas.pdf");
        } catch(error) {
            console.error("Error exporting PDF:", error);
            alert(`Ocorreu um erro ao exportar o PDF: ${(error as Error).message}`);
        } finally {
            setIsExporting(false);
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
                "ID", "Título", "Eixo (Categoria)", "Abrangência", "Regional de Saúde", "Município", "Descrição",
                "Data de Criação", "Status", "Votos Sim", "Votos Não", "Votos Abstenção",
                "Total de Votos", "Data da Votação", "Resultado Final"
            ];

            const csvRows = [headers.join(',')];

            sortedProposals.forEach(p => {
                const row = [
                    escapeCsvCell(p.id), escapeCsvCell(p.titulo), escapeCsvCell(p.categoria),
                    escapeCsvCell(p.abrangencia), escapeCsvCell(p.regional_saude), escapeCsvCell(p.municipio), 
                    escapeCsvCell(p.descricao), escapeCsvCell(p.data_criacao),
                    escapeCsvCell(p.status || ProposalStatus.PENDENTE), escapeCsvCell(p.votos_sim || 0),
                    escapeCsvCell(p.votos_nao || 0), escapeCsvCell(p.votos_abstencao || 0),
                    escapeCsvCell(p.total_votos || 0), escapeCsvCell(p.data_votacao || 'Pendente'),
                    escapeCsvCell(p.resultado_final || 'Pendente')
                ].join(',');
                csvRows.push(row);
            });

            const csvString = csvRows.join('\n');
            const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "relatorio_propostas.csv");
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
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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
            </div>

            <div className="mb-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">📈 Análise por Eixo</h5>
                <div className="space-y-3">
                    {analisePorEixo.map(({ eixo, total, aprovadas, rejeitadas }) => (
                        <div key={eixo} className="bg-white border p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h6 className="font-semibold text-sm">{eixo}</h6>
                                <span className="text-xs">{total} propostas</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-center">
                               <div className="bg-green-100 p-2 rounded">Aprovadas: {aprovadas}</div>
                               <div className="bg-red-100 p-2 rounded">Rejeitadas: {rejeitadas}</div>
                               <div className="bg-yellow-100 p-2 rounded">Pendentes: {total - aprovadas - rejeitadas}</div>
                           </div>
                        </div>
                    ))}
                     {analisePorEixo.length === 0 && <p className="text-center text-gray-500 text-sm py-4">Nenhuma proposta com eixos definidos para análise.</p>}
                </div>
            </div>
             {/* Note: PDF and CSV export functionality is not implemented in this component for simplicity */}
            <div className="bg-gray-100 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">📄 Exportar Relatório Completo</h5>
                <div className="flex flex-wrap gap-3">
                    <button onClick={handleExportPDF} disabled={isExporting || proposals.length === 0} className="flex-1 min-w-[140px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        {isExporting ? 'Gerando...' : '📄 Exportar PDF'}
                    </button>
                    <button onClick={handleExportCSV} disabled={isExporting || proposals.length === 0} className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        {isExporting ? 'Gerando...' : '📊 Exportar CSV'}
                    </button>
                </div>
                 {proposals.length === 0 && <p className="text-xs text-gray-500 mt-2">Nenhuma proposta para exportar.</p>}
            </div>
        </div>
    );
};

export default Acompanhamento;