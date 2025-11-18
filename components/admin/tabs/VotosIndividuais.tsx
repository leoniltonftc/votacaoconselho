

import React, { useState } from 'react';
import { Vote, Proposal } from '../../../types';

declare global {
    interface Window {
        jspdf: any;
    }
}

interface VotosIndividuaisProps {
    votes: Vote[];
    proposals: Proposal[];
}

const VotosIndividuais: React.FC<VotosIndividuaisProps> = ({ votes, proposals }) => {
    const [filtroParticipante, setFiltroParticipante] = useState('');
    const [filtroProposta, setFiltroProposta] = useState('');
    const [filtroVoto, setFiltroVoto] = useState<'SIM' | 'NÃO' | 'ABSTENÇÃO' | ''>('');

    const getProposalDetails = (proposalId: string) => {
        return proposals.find(p => p.id === proposalId);
    };

    const sortedProposalsForFilter = [...proposals].sort((a, b) => {
        const eixoCompare = String(a.categoria || '').localeCompare(String(b.categoria || ''));
        if (eixoCompare !== 0) return eixoCompare;
        return String(a.titulo || '').localeCompare(String(b.titulo || ''));
    });

    const filteredVotes = votes
        .filter(v => !filtroParticipante || (v.user_code || '').toLowerCase().includes(filtroParticipante.toLowerCase()))
        .filter(v => !filtroProposta || v.proposta_id === filtroProposta)
        .filter(v => !filtroVoto || v.voto === filtroVoto);

    // Group votes for display
    const votesByProposal: { [key: string]: Vote[] } = {};
    filteredVotes.forEach(vote => {
        if (!votesByProposal[vote.proposta_id]) {
            votesByProposal[vote.proposta_id] = [];
        }
        votesByProposal[vote.proposta_id].push(vote);
    });

    const sortedProposalIds = Object.keys(votesByProposal).sort((idA, idB) => {
        const propA = getProposalDetails(idA);
        const propB = getProposalDetails(idB);
        
        if (!propA || !propB) return 0;

        const eixoCompare = String(propA.categoria || '').localeCompare(String(propB.categoria || ''));
        if (eixoCompare !== 0) return eixoCompare;
        
        return String(propA.titulo || '').localeCompare(String(propB.titulo || ''));
    });

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
            doc.text("Relatório de Votos Individuais Agrupado por Proposta", 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Relatório gerado em: ${new Date().toLocaleString()}`, 14, 30);
            doc.text(`Total de votos (filtrado): ${filteredVotes.length}`, 14, 36);

            const tableRows: any[][] = [];

            sortedProposalIds.forEach(proposalId => {
                const proposal = getProposalDetails(proposalId);
                if (!proposal) return;

                // Add a grouping row for the proposal
                tableRows.push([{
                    content: `Eixo: ${proposal.categoria} | Proposta: ${proposal.titulo}`,
                    colSpan: 5,
                    styles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [50, 50, 50] }
                }]);
                
                // Add header for the group
                tableRows.push([
                    { content: 'Participante', styles: { fontStyle: 'bold' } },
                    { content: 'Regional', styles: { fontStyle: 'bold' } },
                    { content: 'Município', styles: { fontStyle: 'bold' } },
                    { content: 'Voto', styles: { fontStyle: 'bold' } },
                    { content: 'Data', styles: { fontStyle: 'bold' } }
                ]);

                votesByProposal[proposalId]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .forEach(v => {
                        const voteData = [
                            v.user_code,
                            proposal.regional_saude || 'N/A',
                            proposal.municipio || 'N/A',
                            v.voto,
                            new Date(v.timestamp).toLocaleString(),
                        ];
                        tableRows.push(voteData);
                    });
            });

            (doc as any).autoTable({
                body: tableRows,
                startY: 50,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 8, cellPadding: 2 },
            });

            doc.save("relatorio_votos_individuais.pdf");
        } catch (error) {
            alert(`Ocorreu um erro ao exportar o PDF: ${(error as Error).message}`);
            console.error("PDF Export Error:", error);
        }
    };

    const getVoteClass = (voto: 'SIM' | 'NÃO' | 'ABSTENÇÃO') => {
        switch (voto) {
            case 'SIM': return 'bg-green-100 text-green-800';
            case 'NÃO': return 'bg-red-100 text-red-800';
            case 'ABSTENÇÃO': return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="printable-section">
            <h4 className="text-md font-semibold text-gray-700 mb-4">🗳️ Votos Individuais por Participante</h4>
            
            <div className="no-print mb-4 p-4 bg-gray-100 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por Participante:</label>
                        <input
                            type="text"
                            placeholder="Digite o código..."
                            value={filtroParticipante}
                            onChange={e => setFiltroParticipante(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Proposta:</label>
                        <select value={filtroProposta} onChange={e => setFiltroProposta(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">Todas as propostas</option>
                            {sortedProposalsForFilter.map(p => <option key={p.id} value={p.id}>{String(p.titulo || '')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Voto:</label>
                         <select value={filtroVoto} onChange={e => setFiltroVoto(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">Todos os votos</option>
                            <option value="SIM">SIM</option>
                            <option value="NÃO">NÃO</option>
                            <option value="ABSTENÇÃO">ABSTENÇÃO</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="no-print bg-gray-100 rounded-lg p-3 mb-4 flex flex-wrap gap-3">
                <button onClick={handlePrint} disabled={filteredVotes.length === 0} className="flex-1 min-w-[120px] bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    🖨️ Imprimir Lista
                </button>
                <button onClick={handleExportPDF} disabled={filteredVotes.length === 0} className="flex-1 min-w-[120px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    📄 Exportar PDF
                </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredVotes.length > 0 ? (
                    sortedProposalIds.map(proposalId => {
                        const proposal = getProposalDetails(proposalId);
                        if (!proposal) return null;
                        return (
                            <div key={proposalId} className="bg-white border border-gray-200 rounded-lg printable-proposal">
                                <div className="p-3 bg-gray-100 border-b border-gray-200">
                                    <p className="font-semibold text-gray-800">{String(proposal.titulo || '')}</p>
                                    <p className="text-sm text-gray-600">{String(proposal.categoria || '')}</p>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {votesByProposal[proposalId]
                                        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                        .map(vote => (
                                        <div key={vote.id} className="p-3 flex flex-wrap justify-between items-center gap-2">
                                            <div>
                                                <p className="font-mono text-sm text-gray-700">{String(vote.user_code || '')}</p>
                                                <p className="text-xs text-gray-500">{new Date(vote.timestamp).toLocaleString()}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getVoteClass(vote.voto)}`}>{String(vote.voto || '')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                ) : (
                     <div className="text-center text-gray-500 py-8">
                         <span className="text-2xl">🧐</span>
                         <p>Nenhum voto encontrado com os filtros selecionados.</p>
                     </div>
                )}
            </div>
        </div>
    );
};

export default VotosIndividuais;