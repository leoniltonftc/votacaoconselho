
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

    const sortedProposals = [...proposals].sort((a, b) => {
        const eixoCompare = a.categoria.localeCompare(b.categoria);
        if (eixoCompare !== 0) return eixoCompare;
        return a.titulo.localeCompare(b.titulo);
    });

    const filteredVotes = votes
        .filter(v => !filtroParticipante || v.user_code.toLowerCase().includes(filtroParticipante.toLowerCase()))
        .filter(v => !filtroProposta || v.proposta_id === filtroProposta)
        .filter(v => !filtroVoto || v.voto === filtroVoto)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
            doc.text("Relatório de Votos Individuais", 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Relatório gerado em: ${new Date().toLocaleString()}`, 14, 30);
            doc.text(`Total de votos (filtrado): ${filteredVotes.length}`, 14, 36);

            const tableColumn = ["Participante", "Proposta", "Descrição", "Regional", "Município", "Voto", "Data"];
            const tableRows: string[][] = [];

            filteredVotes.forEach(v => {
                const proposal = getProposalDetails(v.proposta_id);
                const voteData = [
                    v.user_code,
                    proposal?.titulo || 'Proposta Desconhecida',
                    proposal?.descricao || 'N/A',
                    proposal?.regional_saude || 'N/A',
                    proposal?.municipio || 'N/A',
                    v.voto,
                    new Date(v.timestamp).toLocaleString(),
                ];
                tableRows.push(voteData);
            });

            (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 
                    0: { cellWidth: 25 }, 
                    1: { cellWidth: 40 }, 
                    2: { cellWidth: 50 } 
                }
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
                            {sortedProposals.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
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

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredVotes.length > 0 ? filteredVotes.map(vote => {
                    const proposal = getProposalDetails(vote.proposta_id);
                    return (
                        <div key={vote.id} className="bg-white border border-gray-200 rounded-lg p-4 printable-proposal">
                            <div className="flex flex-wrap justify-between items-center gap-3">
                               <div className="flex-1 min-w-[150px]">
                                    <p className="text-sm text-gray-500">Participante:</p>
                                    <p className="font-semibold font-mono text-gray-800">{vote.user_code}</p>
                               </div>
                               <div className="flex-1 min-w-[200px]">
                                    <p className="text-sm text-gray-500">Proposta:</p>
                                    <p className="font-semibold text-gray-800">{proposal?.titulo || 'Proposta Desconhecida'}</p>
                                    <p className="text-xs text-gray-500 mt-1">{proposal?.regional_saude} • {proposal?.municipio}</p>
                               </div>
                               <div className="text-center">
                                    <p className="text-sm text-gray-500">Voto:</p>
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getVoteClass(vote.voto)}`}>{vote.voto}</span>
                               </div>
                            </div>
                        </div>
                    );
                }) : (
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
