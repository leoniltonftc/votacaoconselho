import React, { useState } from 'react';
import { Proposal } from '../../types';
import { EIXOS, ABRANGENCIAS } from '../../constants';

interface EditProposalModalProps {
    proposal: Proposal;
    onClose: () => void;
    onSave: (proposal: Proposal) => void;
}

const EditProposalModal: React.FC<EditProposalModalProps> = ({ proposal, onClose, onSave }) => {
    const [titulo, setTitulo] = useState(proposal.titulo);
    const [categoria, setCategoria] = useState(proposal.categoria);
    const [abrangencia, setAbrangencia] = useState(proposal.abrangencia);
    const [regionalSaude, setRegionalSaude] = useState(proposal.regional_saude);
    const [municipio, setMunicipio] = useState(proposal.municipio);
    const [descricao, setDescricao] = useState(proposal.descricao);

    const handleSave = () => {
        onSave({
            ...proposal,
            titulo,
            categoria,
            abrangencia,
            regional_saude: regionalSaude,
            municipio,
            descricao,
            timestamp: new Date().toISOString()
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">✏️ Editar Proposta</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><span className="text-2xl">×</span></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título da Proposta:</label>
                        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Eixo:</label>
                            <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg">
                                {EIXOS.map(eixo => <option key={eixo} value={eixo}>{eixo}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Abrangência:</label>
                            <select value={abrangencia} onChange={e => setAbrangencia(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg">
                                {ABRANGENCIAS.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Regional de Saúde:</label>
                            <input type="text" value={regionalSaude} onChange={e => setRegionalSaude(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Município:</label>
                            <input type="text" value={municipio} onChange={e => setMunicipio(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição Detalhada:</label>
                        <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={4} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg"></textarea>
                    </div>
                    <div className="flex space-x-3 pt-4">
                        <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">💾 Salvar Alterações</button>
                        <button onClick={onClose} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">❌ Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProposalModal;