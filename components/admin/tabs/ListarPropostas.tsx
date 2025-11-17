
import React, { useState } from 'react';
import { Proposal } from '../../../types';
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
}

const ListarPropostas: React.FC<ListarPropostasProps> = ({ proposals, onUpdateProposal, onDeleteProposal, showAdminMessage }) => {
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroAbrangencia, setFiltroAbrangencia] = useState('');
    const [filtroRegional, setFiltroRegional] = useState('');
    const [filtroMunicipio, setFiltroMunicipio] = useState('');
    const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

    const regionais = [...new Set(proposals.map(p => p.regional_saude).filter(Boolean))].sort();
    const municipios = [...new Set(proposals.map(p => p.municipio).filter(Boolean))].sort();

    const filteredProposals = proposals
        .filter(p => !filtroCategoria || p.categoria === filtroCategoria)
        .filter(p => !filtroAbrangencia || p.abrangencia === filtroAbrangencia)
        .filter(p => !filtroRegional || p.regional_saude === filtroRegional)
        .filter(p => !filtroMunicipio || p.municipio === filtroMunicipio)
        .sort((a, b) => {
            const eixoCompare = a.categoria.localeCompare(b.categoria);
            if (eixoCompare !== 0) return eixoCompare;
            return a.titulo.localeCompare(b.titulo);
        });

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
        doc.text("Lista de Propostas Cadastradas", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Relatório gerado em: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total de propostas (filtrado): ${filteredProposals.length}`, 14, 36);

        const tableColumn = ["Eixo", "Título", "Descrição", "Abrangência", "Regional", "Município"];
        const tableRows: string[][] = [];

        filteredProposals.forEach(p => {
            const proposalData = [
                p.categoria,
                p.titulo,
                p.descricao,
                p.abrangencia,
                p.regional_saude,
                p.municipio,
            ];
            tableRows.push(proposalData);
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

        doc.save("lista_propostas.pdf");
      } catch (error) {
          alert(`Ocorreu um erro ao exportar o PDF: ${(error as Error).message}`);
          console.error("PDF Export Error:", error);
      }
    };

    return (
        <div>
            <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                <h4 className="text-md font-semibold text-gray-700">Propostas Cadastradas</h4>
                <div className="text-sm text-gray-500">Total: {filteredProposals.length}</div>
            </div>
            <div className="no-print mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Eixo:</label>
                    <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">Todos os eixos</option>
                        {EIXOS.map(eixo => <option key={eixo} value={eixo}>{eixo}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Abrangência:</label>
                    <select value={filtroAbrangencia} onChange={e => setFiltroAbrangencia(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">Todas</option>
                        {ABRANGENCIAS.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Regional:</label>
                    <select value={filtroRegional} onChange={e => setFiltroRegional(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">Todas</option>
                        {regionais.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Município:</label>
                    <select value={filtroMunicipio} onChange={e => setFiltroMunicipio(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">Todos</option>
                        {municipios.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
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

            <div className="space-y-3 max-h-96 overflow-y-auto printable-section">
                {filteredProposals.length > 0 ? filteredProposals.map(proposta => (
                    <div key={proposta.id} className="bg-white border border-gray-200 rounded-lg p-4 printable-proposal">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                                <h5 className="font-semibold text-gray-800 mb-1">{proposta.titulo}</h5>
                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2 flex-wrap gap-1">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">{proposta.categoria}</span>
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">{proposta.abrangencia}</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">{proposta.regional_saude}</span>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">{proposta.municipio}</span>
                                </div>
                                <p className="text-gray-700 text-sm">{proposta.descricao}</p>
                            </div>
                            <div className="ml-4 flex flex-col space-y-2 no-print">
                                <button onClick={() => setEditingProposal(proposta)} className="text-blue-500 hover:text-blue-700 text-sm font-medium">✏️ Editar</button>
                                <button onClick={() => handleDelete(proposta)} className="text-red-500 hover:text-red-700 text-sm font-medium">🗑️ Excluir</button>
                            </div>
                        </div>
                    </div>
                )) : (
                     <div className="text-center text-gray-500 py-8">
                         <span className="text-2xl">📝</span>
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
