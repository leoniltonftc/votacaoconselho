
import React, { useState } from 'react';
import { Proposal, ProposalResult, ProposalStatus, ClassificationRule } from '../../../types';
import { EIXOS } from '../../../constants';

// Since jspdf and jspdf-autotable are loaded from a CDN, we need to tell TypeScript they exist on the window object.
declare global {
    interface Window {
        jspdf: any;
    }
}

interface AcompanhamentoProps {
    proposals: Proposal[];
    classificationRules?: ClassificationRule[];
    onUpdateProposal?: (proposal: Proposal) => void; 
    showAdminMessage?: (type: 'success' | 'error', text: string) => void;
    onSaveClassificationRule?: (rule: ClassificationRule) => void;
    onDeleteClassificationRule?: (rule: ClassificationRule) => void;
}

const Acompanhamento: React.FC<AcompanhamentoProps> = ({ 
    proposals, 
    classificationRules = [], 
    onUpdateProposal, 
    showAdminMessage, 
    onSaveClassificationRule, 
    onDeleteClassificationRule 
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingVoted, setIsExportingVoted] = useState(false);
    
    // Form states for new rule
    const [minPercent, setMinPercent] = useState(0);
    const [maxPercent, setMaxPercent] = useState(100);
    const [label, setLabel] = useState('');
    const [action, setAction] = useState<'none' | 'promote_to_plenary'>('none');
    const [color, setColor] = useState('gray');

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
        qualificadas: proposals.filter(p => p.is_plenary === true).length 
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

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const preset = e.target.value;
        switch (preset) {
            case 'desclassificada':
                setLabel('Desclassificada');
                setMinPercent(0);
                setMaxPercent(49.99);
                setAction('none');
                setColor('red');
                break;
            case 'relatorio':
                setLabel('Relatório Final');
                setMinPercent(50);
                setMaxPercent(79.99);
                setAction('none');
                setColor('blue');
                break;
            case 'plenaria':
                setLabel('Plenária Final');
                setMinPercent(80);
                setMaxPercent(100);
                setAction('promote_to_plenary');
                setColor('purple');
                break;
            default:
                // Não reseta tudo para permitir edição livre, ou pode resetar se preferir
                break;
        }
    };

    const handleAddRule = () => {
        if (!label) {
            if (showAdminMessage) showAdminMessage('error', 'O rótulo é obrigatório.');
            return;
        }
        if (minPercent > maxPercent) {
            if (showAdminMessage) showAdminMessage('error', 'O percentual mínimo não pode ser maior que o máximo.');
            return;
        }
        
        const newRule: ClassificationRule = {
            id: `rule_${Date.now()}`,
            tipo: 'classification_rule',
            min_percent: Number(minPercent),
            max_percent: Number(maxPercent),
            label,
            action,
            color,
            timestamp: new Date().toISOString()
        };
        
        if (onSaveClassificationRule) onSaveClassificationRule(newRule);
        if (showAdminMessage) showAdminMessage('success', `Regra "${label}" adicionada com sucesso.`);
        
        // Reset form defaults
        setLabel('');
        setMinPercent(0);
        setMaxPercent(100);
        setAction('none');
        setColor('gray');
    };

    const handleApplyRules = () => {
        if (!onUpdateProposal || classificationRules.length === 0) {
            if (showAdminMessage) showAdminMessage('error', 'Não há regras definidas ou permissão para atualizar.');
            return;
        }

        let updatedCount = 0;
        
        proposals.forEach(p => {
            if (p.status !== ProposalStatus.VOTADA) return;
            
            const total = p.total_votos || 0;
            if (total === 0) return;
            
            const simPercent = ((p.votos_sim || 0) / total) * 100;
            
            // Encontra a regra que engloba o percentual de SIM
            // Usamos >= min e <= max. A ordem das regras pode importar se houver sobreposição.
            const rule = classificationRules.find(r => simPercent >= r.min_percent && simPercent <= r.max_percent);
            
            if (rule) {
                const updates: Partial<Proposal> = {
                    classification_label: rule.label,
                    classification_color: rule.color
                };
                
                if (rule.action === 'promote_to_plenary') {
                    updates.is_plenary = true;
                } else {
                    // Se a regra não promove, garantimos que a flag seja removida caso existisse
                    updates.is_plenary = false;
                }
                
                // Só atualiza se houve mudança
                if (p.classification_label !== rule.label || p.is_plenary !== updates.is_plenary) {
                    onUpdateProposal({
                        ...p,
                        ...updates
                    });
                    updatedCount++;
                }
            }
        });
        
        if (showAdminMessage) showAdminMessage('success', `Regras aplicadas! ${updatedCount} propostas foram reclassificadas.`);
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
            
            const tableColumn = ["Eixo", "Título", "Status", "Aprovação (%)", "Classificação", "Plenária Final"];
            const tableRows: (string | number | null | undefined)[][] = [];

            sortedProposals.forEach(proposal => {
                const total = proposal.total_votos || 0;
                const simPct = total > 0 ? ((proposal.votos_sim || 0) / total * 100).toFixed(1) : '0.0';
                
                const proposalData = [
                    proposal.categoria,
                    proposal.titulo,
                    proposal.status || ProposalStatus.PENDENTE,
                    `${simPct}%`,
                    proposal.classification_label || '-',
                    proposal.is_plenary ? 'SIM' : 'NÃO'
                ];
                tableRows.push(proposalData);
            });
            
            (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 40,
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
            
            const tableColumn = ["Eixo", "Título", "Resultado", "Sim", "Não", "Abst.", "Total", "Classificação"];
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
                    p.classification_label || '-'
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
                "ID", "Título", "Eixo", "Status", "Votos Sim", "Votos Não", "Total", "Resultado", "Classificação", "Qualificada Plenária"
            ];

            const csvRows = [headers.join(',')];

            sortedProposals.forEach(p => {
                const row = [
                    escapeCsvCell(p.id), escapeCsvCell(p.titulo), escapeCsvCell(p.categoria),
                    escapeCsvCell(p.status || ProposalStatus.PENDENTE), escapeCsvCell(p.votos_sim || 0),
                    escapeCsvCell(p.votos_nao || 0), escapeCsvCell(p.total_votos || 0), escapeCsvCell(p.resultado_final || 'Pendente'), 
                    escapeCsvCell(p.classification_label || '-'), escapeCsvCell(p.is_plenary ? 'SIM' : 'NÃO')
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
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                        <div className="text-xs text-blue-800 font-medium">Total</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-purple-600">{stats.qualificadas}</div>
                        <div className="text-xs text-purple-800 font-medium">Na Plenária</div>
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
            </div>

            {/* GESTÃO DE REGRAS DE CLASSIFICAÇÃO */}
            {onSaveClassificationRule && onDeleteClassificationRule && (
                <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <h5 className="text-sm font-bold text-gray-800">📐 Regras de Classificação Automática</h5>
                        
                        {/* Dropdown de Modelos Rápidos */}
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                             <label className="text-xs font-medium text-gray-600">Modelos Rápidos:</label>
                             <select onChange={handlePresetChange} className="text-xs border border-gray-300 rounded p-1">
                                <option value="">Selecione...</option>
                                <option value="desclassificada">🔴 Desclassificada (0-50%)</option>
                                <option value="relatorio">🔵 Relatório Final (50-80%)</option>
                                <option value="plenaria">🟣 Plenária Final (80-100%)</option>
                             </select>
                        </div>
                    </div>
                    
                    {/* Formulário de Nova Regra */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">De (% Mín)</label>
                            <input type="number" value={minPercent} onChange={e => setMinPercent(Number(e.target.value))} className="w-full text-sm border-gray-300 rounded" step="0.01" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Até (% Máx)</label>
                            <input type="number" value={maxPercent} onChange={e => setMaxPercent(Number(e.target.value))} className="w-full text-sm border-gray-300 rounded" step="0.01" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Rótulo da Classificação</label>
                            <input type="text" value={label} onChange={e => setLabel(e.target.value)} className="w-full text-sm border-gray-300 rounded" placeholder="Ex: Relatório Final" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Ação Automática</label>
                            <select value={action} onChange={e => setAction(e.target.value as any)} className="w-full text-sm border-gray-300 rounded">
                                <option value="none">Apenas Rotular</option>
                                <option value="promote_to_plenary">Promover p/ Plenária</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <button onClick={handleAddRule} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-2 rounded">Salvar Regra</button>
                        </div>
                    </div>

                    {/* Lista de Regras */}
                    {classificationRules.length > 0 ? (
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full text-xs text-left">
                                <thead className="bg-gray-100 text-gray-600 font-semibold">
                                    <tr>
                                        <th className="px-3 py-2">Faixa (%)</th>
                                        <th className="px-3 py-2">Rótulo</th>
                                        <th className="px-3 py-2">Ação</th>
                                        <th className="px-3 py-2 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {classificationRules.map(rule => (
                                        <tr key={rule.id}>
                                            <td className="px-3 py-2">{rule.min_percent}% a {rule.max_percent}%</td>
                                            <td className="px-3 py-2">
                                                <span 
                                                    className="px-2 py-0.5 rounded text-white font-medium" 
                                                    style={{ backgroundColor: rule.color === 'red' ? '#EF4444' : rule.color === 'blue' ? '#3B82F6' : rule.color === 'purple' ? '#8B5CF6' : '#6B7280' }}
                                                >
                                                    {rule.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">{rule.action === 'promote_to_plenary' ? '✅ Vai p/ Plenária' : 'ℹ️ Apenas Classifica'}</td>
                                            <td className="px-3 py-2 text-right">
                                                <button onClick={() => onDeleteClassificationRule(rule)} className="text-red-500 hover:text-red-700 font-bold">Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">Nenhuma regra definida. Use os modelos rápidos acima para começar.</p>
                    )}
                    
                    <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                        <button onClick={handleApplyRules} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg text-sm shadow-md flex items-center gap-2">
                            ⚙️ Processar e Classificar Propostas
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-right">Ao clicar em processar, todas as propostas já votadas serão analisadas e receberão o rótulo correspondente à sua % de votos SIM.</p>
                </div>
            )}

            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">📄 Exportar Relatórios Detalhados</h5>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <button onClick={handleExportVotedPDF} disabled={isExportingVoted} className="flex-1 min-w-[140px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 shadow-sm">
                        {isExportingVoted ? 'Gerando...' : '📄 Relatório de Votações'}
                    </button>
                    <button onClick={handleExportPDF} disabled={isExporting} className="flex-1 min-w-[140px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 shadow-sm">
                        {isExporting ? 'Gerando...' : '📋 Relatório Completo (PDF)'}
                    </button>
                    <button onClick={handleExportCSV} disabled={isExporting} className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 shadow-sm">
                        {isExporting ? 'Gerando...' : '📊 Relatório Completo (CSV)'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Acompanhamento;
